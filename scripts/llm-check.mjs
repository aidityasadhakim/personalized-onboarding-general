/**
 * Smoke test for the OpenRouter wiring: one text call and one structured call.
 * Run with: npm run llm:check
 */
import { z } from "zod";
import { MODEL_ID, generateJson, generateLine } from "../lib/llm.js";

// Evidence-first shape. Asking the model to quote the source words before it
// classifies is what makes extraction reliable — a bare enum field comes back
// "unknown" even when the message plainly states the answer (see lib/llm.js).
// The quote doubles as provenance for the audit trail.
const fact = (values, about) =>
  z.object({
    quote: z.string().describe(`Exact words from the message about ${about}, or "" if absent`),
    value: z.enum(values),
  });

const intake = z.object({
  age: z.number().nullable().describe("Age in years, or null if not stated"),
  onset: fact(["under_a_year", "one_to_three_years", "longer", "unknown"], "how long it has lasted"),
  pattern: fact(["crown", "hairline", "diffuse", "unknown"], "where the hair loss is"),
  intent: fact(["ready", "exploring", "preventing", "unknown"], "readiness to start treatment"),
  priorTreatments: z.array(z.string()).describe("Treatments already tried, verbatim"),
});

console.log(`model: ${MODEL_ID}`);
console.log(`key:   ${process.env.OPENROUTER_API_KEY ? "set" : "MISSING"}\n`);

const line = await generateLine({
  system: "You write one short, warm sentence. No emoji, no exclamation marks.",
  prompt: "Acknowledge that a man said he is ready to start hair loss treatment today.",
});
console.log(
  line.ok ? `text  ok  ${line.ms}ms  "${line.text}"` : `text  FAILED  ${line.error?.message}`,
);

const extracted = await generateJson({
  schema: intake,
  system: [
    "Quote the evidence from the message, then classify it.",
    "Use unknown only when the message does not say.",
    "If you filled in a quote, the value must not be unknown — classify what the quote says.",
    "Duration: under 12 months is under_a_year, 1 to 3 years is one_to_three_years, more is longer.",
  ].join(" "),
  prompt:
    "I'm 34, my crown has been thinning for about two years, tried Rogaine for a while. Want to start treatment now.",
  temperature: 0,
});

if (!extracted.ok) {
  console.log(`json  FAILED  ${extracted.error?.message}`);
  process.exit(1);
}

const got = extracted.object;
console.log(`json  ok  ${extracted.ms}ms  ${JSON.stringify(got)}`);

// The sentence states all four facts, so anything left unknown is a regression.
const misses = [
  got.age === 34 ? null : "age",
  got.onset.value === "one_to_three_years" ? null : "onset",
  got.pattern.value === "crown" ? null : "pattern",
  got.intent.value === "ready" ? null : "intent",
].filter(Boolean);

console.log(misses.length ? `\ncheck FAILED — missed: ${misses.join(", ")}` : "\ncheck ok — all stated facts extracted");
process.exit(line.ok && misses.length === 0 ? 0 : 1);
