/**
 * The LLM layer. Three jobs, each one bounded by the rules layer:
 *   extractFacts   — turn free text into profile slots, evidence-first
 *   decideTurn     — pick one of the allowed moves and write the acknowledgement
 *   recordFollowup — word the question the imported records make possible
 *
 * Every function degrades: if the model is slow, wrong or down, the caller gets the
 * deterministic answer instead and the onboarding continues.
 */

import { z } from "zod";
import { generateJson } from "../llm";
import { EDUCATION, QUESTIONS } from "./questions";
import { IMPORTED_RECORDS, RECORD_FOLLOWUP_FALLBACK } from "./records";
import { describeMove } from "./rules";

// Evidence-first: the quote comes before the value, or the model answers "unknown"
// even when the message says otherwise. See lib/llm.js.
const fact = (values, about) =>
  z.object({
    quote: z.string().describe(`Exact words from the message about ${about}, or "" if absent`),
    value: z.enum([...values, "unknown"]),
  });

const extractionSchema = z.object({
  intent: fact(["ready", "exploring", "slowing", "preventing"], "readiness to start treatment"),
  onset: fact(["under_a_year", "one_to_three_years", "longer"], "how long the hair loss has lasted"),
  pattern: fact(["crown", "hairline", "diffuse"], "where the hair loss is"),
  familyHistory: fact(["yes", "no", "not_sure"], "hair loss running in the family"),
  conditions: fact(["heart", "liver", "none"], "heart or liver conditions"),
  age: z.number().nullable().describe("Age in years, or null if not stated"),
  priorTreatments: z.array(z.string()).describe("Treatments already tried, verbatim"),
  // Evidence-bearing for the same reason as the fields above: as a bare enum array
  // this invented worries the person never raised, and the UI then told them they had.
  concerns: z
    .array(
      z.object({
        quote: z.string().describe("Exact words from the message that voice this worry"),
        value: z.enum(["side_effects", "cost", "time", "privacy"]),
      }),
    )
    .describe("Worries the person actually voiced, in their own words. Empty if none."),
});

const EXTRACTION_RULES = [
  "Quote the exact words from the message first, then classify what the quote says.",
  'Use "unknown" only when the message does not mention that topic at all.',
  "If you filled in a quote, the value must not be unknown.",
  "Duration: under 12 months is under_a_year, 1 to 3 years is one_to_three_years, more is longer.",
  "Readiness: wanting to start now is ready, weighing options is exploring, no loss yet is preventing.",
  "Do not infer facts the person did not state.",
  "Concerns: only list a worry if the message contains words voicing it. Mentioning a treatment is not a worry about it. When in doubt, return an empty list.",
].join(" ");

/**
 * The model will still occasionally attach a concern to a message that never raised
 * one, so the quote has to survive a check against the actual text. This is the guard
 * that matters: a fabricated worry becomes a claim about what the patient said.
 */
function groundedConcerns(raw, message) {
  const haystack = message.toLowerCase();
  return (raw ?? [])
    .filter((entry) => {
      const quote = entry?.quote?.trim().toLowerCase();
      return quote && quote.length > 2 && haystack.includes(quote);
    })
    .map((entry) => entry.value);
}

/**
 * Pulls every stated fact out of one free-text message. Returns only the slots the
 * message actually spoke to, each carrying its quote so the UI can show the person
 * where it came from and the audit log can prove it.
 */
export async function extractFacts(message) {
  const result = await generateJson({
    schema: extractionSchema,
    system: EXTRACTION_RULES,
    prompt: message,
    temperature: 0,
  });

  if (!result.ok) return { facts: {}, concerns: [], ms: result.ms, degraded: true };

  const object = result.object;
  const facts = {};
  for (const slot of ["intent", "onset", "pattern", "familyHistory", "conditions"]) {
    const value = object[slot];
    if (value && value.value !== "unknown") {
      facts[slot] =
        slot === "conditions"
          ? { value: [value.value], quote: value.quote, source: "said" }
          : { value: value.value, quote: value.quote, source: "said" };
    }
  }
  if (typeof object.age === "number") {
    facts.age = { value: object.age, quote: `${object.age}`, source: "said" };
  }
  if (object.priorTreatments?.length) {
    facts.priorTreatments = object.priorTreatments;
  }

  return {
    facts,
    concerns: [...new Set(groundedConcerns(object.concerns, message))],
    ms: result.ms,
    degraded: false,
  };
}

const decisionSchema = z.object({
  ack: z
    .string()
    .describe(
      "One short sentence, under 16 words, acknowledging what they just said. No emoji, no exclamation marks, no promises about results.",
    ),
  moveId: z.string().describe("The id of the move to make next, copied exactly from the list"),
});

const MAX_ACK_WORDS = 22;

/**
 * The model reliably over-writes: it tacks the next question onto the acknowledgement
 * ("...I can pull your records, sound good?") and sometimes narrates records it was
 * never given. Keep the first sentence, and reject anything that asks a question —
 * asking is the step's job, not the ack's.
 */
export function cleanAck(raw, move, skipped) {
  const text = (raw ?? "").trim();
  if (!text) return fallbackAck(move, skipped);

  const first = text.split(/(?<=[.!?])\s+/)[0]?.trim() ?? text;
  if (first.includes("?")) return fallbackAck(move, skipped);
  if (first.split(/\s+/).length > MAX_ACK_WORDS) return fallbackAck(move, skipped);
  return first.replace(/!+$/, ".");
}

/** Copy used when the model is unavailable, so the flow never stalls. */
export function fallbackAck(move, skipped) {
  if (skipped > 0) return `Got it — that already answers ${skipped === 1 ? "another question" : `${skipped} more questions`}.`;
  switch (move.kind) {
    case "question":
      return "Thanks — one more thing.";
    case "education":
      return "Before you decide, here is what the evidence says.";
    case "connect":
      return "I can save you the rest of the questions.";
    case "recordFollowup":
      return "Your records answered most of this.";
    case "plan":
      return "That is everything I need.";
    case "paywall":
      return "Here is what it costs.";
    default:
      return "Thanks.";
  }
}

/**
 * Picks the next move and writes the line that carries it. The model may only choose
 * from `moves`; anything else is discarded and the first move is used.
 */
export async function decideTurn({ state, moves, lastAnswer, skipped }) {
  const only = moves.length === 1;

  const profileLines = Object.entries(state.profile)
    .filter(([, value]) => value != null)
    .map(([slot, value]) => {
      const shown = Array.isArray(value) ? value.join(", ") : (value.value ?? value);
      const via = value?.source ? ` (${value.source})` : "";
      return `- ${slot}: ${Array.isArray(shown) ? shown.join(", ") : shown}${via}`;
    })
    .join("\n");

  const options = moves
    .map((move) => `- id "${move.id}": ${describeMove(move)}`)
    .join("\n");

  const result = await generateJson({
    schema: decisionSchema,
    system: [
      "You are the voice of a men's health onboarding. You are warm, brief and never clinical.",
      "The ack is ONE sentence under 16 words that acknowledges what they just said.",
      "The ack never asks a question — the next screen does the asking.",
      "The ack never states a medical record, lab value, medication or number.",
      "You never diagnose, never promise results, never mention being an AI.",
      "Never invent a question: pick one of the listed moves by its id.",
      only ? "There is only one move available, so copy its id exactly." : "",
    ]
      .filter(Boolean)
      .join(" "),
    prompt: [
      `What they just said: ${lastAnswer || "(nothing yet)"}`,
      skipped > 0 ? `Facts this let you skip asking about: ${skipped}` : "",
      "",
      "What you know about them:",
      profileLines || "- nothing yet",
      "",
      "Moves you may make next:",
      options,
    ]
      .filter(Boolean)
      .join("\n"),
    temperature: 0.3,
    timeoutMs: 6000,
  });

  const chosen = result.ok ? moves.find((m) => m.id === result.object.moveId) : null;
  const move = chosen ?? moves[0];
  const ack = cleanAck(result.ok ? result.object.ack : null, move, skipped);

  return { move, ack, degraded: !result.ok, ms: result.ms };
}

const followupSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Two sentences. First: name one imported record and the question it lets you skip. Second: ask about the medication on file.",
    ),
});

/**
 * Words the follow-up that only exists because the records came in. The model may
 * reference the records it is given and nothing else; if it strays, we use the
 * written copy.
 */
export async function recordFollowup(profile) {
  const records = IMPORTED_RECORDS.items
    .map((item) => `- ${item.name}: ${item.detail} (${item.date})`)
    .join("\n");

  const result = await generateJson({
    schema: followupSchema,
    system: [
      "You write one message for a men's health onboarding, after importing the person's medical records.",
      "Use only the records given. Never invent a value, a date or a diagnosis.",
      "Say what the records let you skip, then ask whether the medication on file is still current.",
      "Warm and plain. Under 45 words. No emoji.",
    ].join(" "),
    prompt: `Records imported:\n${records}`,
    temperature: 0.3,
    timeoutMs: 6000,
  });

  const prompt = result.ok ? result.object.prompt?.trim() : null;

  // Guard: the message must actually reference the medication we hold, or the model
  // has drifted and we use our own copy.
  const grounded = prompt && /lisinopril/i.test(prompt);

  return {
    prompt: grounded ? prompt : RECORD_FOLLOWUP_FALLBACK.prompt,
    options: RECORD_FOLLOWUP_FALLBACK.options,
    degraded: !grounded,
    ms: result.ms,
  };
}

/** Turns a move into the payload the client renders. */
export function renderMove(move, state, plan) {
  switch (move.kind) {
    case "question": {
      const q = QUESTIONS[move.id];
      return {
        kind: "question",
        id: q.id,
        slot: q.slot,
        eyebrow: q.eyebrow ?? null,
        prompt: q.prompt,
        helper: q.helper ?? null,
        inline: q.inline ?? false,
        options: q.options,
      };
    }
    case "education": {
      const card = EDUCATION[move.id];
      return { kind: "education", ...card };
    }
    case "connect":
      return { kind: "connect", id: "connect" };
    case "recordFollowup":
      return { kind: "question", id: "recordFollowup", slot: "medicationCurrent", fromRecords: true };
    case "plan":
      return { kind: "plan", id: "plan", plan };
    case "paywall":
      return { kind: "paywall", id: "paywall", plan };
    case "stop":
      return { kind: "stop", id: move.id, ...move.stop };
    default:
      return { kind: "done", id: "done" };
  }
}
