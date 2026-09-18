// Server-only: the OpenRouter model used by the API routes, via the Vercel AI SDK.
// Configured by OPENROUTER_API_KEY and OPENROUTER_MODEL (see .env.example).
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject, generateText } from "ai";

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("[llm] OPENROUTER_API_KEY is not set — LLM calls will fail.");
}

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

const BASE_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash";

// The :nitro variant routes to the fastest provider rather than the cheapest, which
// matters because every turn of the onboarding waits on this call. A model id that
// already carries a variant is left alone.
export const MODEL_ID = BASE_MODEL.includes(":") ? BASE_MODEL : `${BASE_MODEL}:nitro`;

// Onboarding turns are short decisions; reasoning tokens would only add dead air.
export const model = openrouter.chat(MODEL_ID, { reasoning: { effort: "none" } });

/** How long a single turn may take before we fall back to the deterministic path. */
export const TURN_TIMEOUT_MS = 8000;

/**
 * Structured generation. Every LLM decision in the flow goes through here, so the
 * model can only return shapes the rules layer already knows how to validate.
 *
 * Two conventions, both learned from `npm run llm:check` against this model:
 *
 * 1. Extraction fields are evidence-first — `{ quote, value }`, not a bare enum.
 *    Asked for an enum alone, the model answers "unknown" even when the message
 *    plainly states the fact. The quote is also the provenance we show the user
 *    ("you said…") and log for the audit trail.
 * 2. Enum boundaries go in the system prompt, not only in `.describe()`. Field
 *    descriptions alone did not move the model; a stated mapping rule did. Add
 *    "if you filled in a quote, the value must not be unknown" whenever a schema
 *    pairs the two.
 *
 * Returns { ok: true, object } or { ok: false, error } — never throws, because a
 * slow or malformed model response must degrade to the scripted flow, not a crash.
 */
export async function generateJson({
  schema,
  system,
  prompt,
  timeoutMs = TURN_TIMEOUT_MS,
  temperature = 0.3,
}) {
  const started = Date.now();
  try {
    const { object } = await generateObject({
      model,
      schema,
      system,
      prompt,
      temperature,
      abortSignal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: true, object, ms: Date.now() - started };
  } catch (error) {
    console.error("[llm] generateJson failed:", error?.message ?? error);
    return { ok: false, error, ms: Date.now() - started };
  }
}

/** Plain text generation, for the rare line of copy the model writes itself. */
export async function generateLine({
  system,
  prompt,
  timeoutMs = TURN_TIMEOUT_MS,
  temperature = 0.5,
}) {
  const started = Date.now();
  try {
    const { text } = await generateText({
      model,
      system,
      prompt,
      temperature,
      abortSignal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: true, text: text.trim(), ms: Date.now() - started };
  } catch (error) {
    console.error("[llm] generateLine failed:", error?.message ?? error);
    return { ok: false, error, ms: Date.now() - started };
  }
}
