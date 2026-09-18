/**
 * The deterministic layer. Given the profile so far, it decides what is allowed to
 * happen next; the LLM only picks from what this returns and words it. Nothing here
 * calls a model, so the flow still completes if the LLM is down.
 *
 * Reading order: slotFilled -> requiredSlots -> nextMoves -> clinicalFlags.
 */

import { EDUCATION, QUESTIONS, ROUTE_BY_INTENT } from "./questions";

export const MIN_AGE = 18;

/** A slot counts as filled once we have a value, whatever the source. */
export function slotFilled(profile, slot) {
  const fact = profile[slot];
  if (fact === undefined || fact === null) return false;
  if (Array.isArray(fact)) return fact.length > 0;
  if (typeof fact === "object") return fact.value !== undefined && fact.value !== "unknown";
  return true;
}

export function routeOf(profile) {
  const intent = profile.intent?.value;
  return intent ? ROUTE_BY_INTENT[intent] ?? "nurture" : null;
}

/**
 * Intent is set by the first question, but people announce it again later — "just show
 * me the price" halfway down is a different person than the one who clicked "exploring".
 * A stated readiness may promote someone to the fast lane; nothing demotes them, so the
 * flow can only ever get shorter and no one is pushed back into questions they passed.
 */
export function canUpgradeIntent(current, next) {
  return next === "ready" && current !== "ready";
}

/**
 * What this person must answer before a plan can be built. The ready route asks the
 * clinical minimum; the nurture route earns belief first and asks a little more.
 */
export function requiredSlots(profile) {
  const route = routeOf(profile);
  if (!route) return ["intent"];
  return route === "ready"
    ? ["intent", "onset", "conditions"]
    : ["intent", "familyHistory", "onset", "pattern", "conditions"];
}

export function missingSlots(profile) {
  return requiredSlots(profile).filter((slot) => !slotFilled(profile, slot));
}

/** Questions the person never had to answer because we already knew. */
export function skippedCount(state) {
  const asked = new Set(state.asked ?? []);
  return requiredSlots(state.profile).filter(
    (slot) => slotFilled(state.profile, slot) && !asked.has(slot),
  ).length;
}

/**
 * Hard stops. These are not suggestions the model can talk its way around — when one
 * fires, the flow ends in a handoff.
 */
export function hardStop(profile) {
  const age = profile.age?.value ?? profile.age;
  if (typeof age === "number" && age < MIN_AGE) {
    return {
      reason: "under_age",
      headline: "I need to hand this to a person.",
      body: `We treat adults ${MIN_AGE} and over. A member of the care team will follow up so you are not left without an answer.`,
    };
  }
  return null;
}

/**
 * Clinical flags. They never block the flow; they change what the plan may contain
 * and what the provider sees. This is the layer that must not be a model's opinion.
 */
export function clinicalFlags(profile) {
  const flags = [];
  const conditions = (profile.conditions?.value ?? []).filter?.(Boolean) ?? [];
  const list = Array.isArray(conditions) ? conditions : [conditions];

  if (list.includes("liver")) {
    flags.push({
      id: "liver",
      rule: "R-12",
      severity: "review",
      label: "Liver condition on file",
      effect: "Finasteride is held for provider review before it can be included.",
    });
  }
  if (list.includes("heart")) {
    flags.push({
      id: "heart",
      rule: "R-07",
      severity: "restrict",
      label: "Heart condition on file",
      effect: "Oral minoxidil is excluded. Topical minoxidil only.",
    });
  }

  const age = profile.age?.value ?? profile.age;
  if (typeof age === "number" && age >= 50) {
    flags.push({
      id: "psa",
      rule: "R-21",
      severity: "note",
      label: "Age 50 or over",
      effect: "Provider is notified that finasteride lowers PSA readings.",
    });
  }

  if (profile.concerns?.includes("side_effects")) {
    flags.push({
      id: "concern",
      rule: "R-33",
      severity: "note",
      label: "Raised side effects",
      effect: "Side effect education is offered before the plan.",
    });
  }

  return flags;
}

/**
 * The allowed next moves, best first. The LLM picks one of these and writes the line
 * that carries it; if the LLM fails, the first move is used as-is.
 */
export function nextMoves(state) {
  const { profile } = state;
  const shown = new Set(state.shown ?? []);

  const stop = hardStop(profile);
  if (stop) return [{ kind: "stop", id: stop.reason, stop }];

  if (!slotFilled(profile, "intent")) {
    return [{ kind: "question", id: "intent" }];
  }

  const route = routeOf(profile);
  const moves = [];

  // Someone who raised side effects gets that addressed before anything else.
  if (profile.concerns?.includes("side_effects") && !shown.has("edu:sideEffects")) {
    moves.push({ kind: "education", id: "sideEffects" });
  }

  // The nurture route earns belief before it asks for more.
  if (route === "nurture" && !shown.has("edu:causes")) {
    moves.push({ kind: "education", id: "causes" });
  }

  for (const slot of missingSlots(profile)) {
    const question = Object.values(QUESTIONS).find((q) => q.slot === slot);
    if (question) moves.push({ kind: "question", id: question.id });
  }

  if (moves.length > 0) return moves;

  // Everything required is known. Offer the records import once, then use it.
  if (state.records?.status !== "connected" && state.records?.status !== "declined") {
    return [{ kind: "connect", id: "connect" }];
  }
  if (state.records?.status === "connected" && !shown.has("recordFollowup")) {
    return [{ kind: "recordFollowup", id: "recordFollowup" }];
  }
  // Someone who said "ready to start ASAP" has already decided. Making them tap past
  // the plan to reach the price is friction, so the fast lane puts pricing on the plan
  // itself; the nurture route still earns the offer with a separate screen.
  if (!shown.has("plan")) return [{ kind: "plan", id: "plan" }];
  if (route !== "ready" && !shown.has("paywall")) return [{ kind: "paywall", id: "paywall" }];
  return [{ kind: "done", id: "done" }];
}

/** Human-readable description of a move, used for the LLM prompt and the fallback copy. */
export function describeMove(move) {
  if (move.kind === "question") {
    const q = QUESTIONS[move.id];
    return `ask "${q.prompt}"`;
  }
  if (move.kind === "education") return `show the card "${EDUCATION[move.id].prompt}"`;
  if (move.kind === "connect") return "offer to import their medical records";
  if (move.kind === "recordFollowup") return "ask one follow-up grounded in the imported records";
  if (move.kind === "plan") return "show their personalized plan";
  if (move.kind === "paywall") return "show the plan options and pricing";
  return move.kind;
}

/**
 * The plan as it stands mid-conversation. The reference flow shows this next to the
 * questions — it is the moment the person can see that answering changed something,
 * rather than being told so at the end. Derived, never stored.
 */
export function planPreview(state) {
  const { profile } = state;
  const lines = [];

  const intent = profile.intent?.value;
  if (intent === "ready") lines.push("Starting treatment now");
  else if (intent === "exploring") lines.push("Looking at the options first");
  else if (intent === "slowing") lines.push("Holding the hairline you have");
  else if (intent === "preventing") lines.push("Getting ahead of it");

  const onset = profile.onset?.value;
  if (onset) {
    lines.push(
      {
        under_a_year: "Caught it inside a year",
        one_to_three_years: "Noticed 1 to 3 years ago",
        longer: "Three years or more in",
      }[onset],
    );
  }

  if (profile.familyHistory?.value === "yes") lines.push("Family history on file");
  if (profile.pattern?.value) {
    lines.push(
      {
        crown: "Crown-first pattern",
        hairline: "Hairline-first pattern",
        diffuse: "Diffuse thinning",
      }[profile.pattern.value],
    );
  }

  for (const flag of clinicalFlags(profile)) {
    if (flag.id === "liver") lines.push("Finasteride flagged for provider review");
    if (flag.id === "heart") lines.push("Oral minoxidil ruled out");
    if (flag.id === "psa") lines.push("PSA note added for your provider");
  }

  if (state.records?.status === "connected") {
    lines.push("Your records answered the rest of the screening");
  }

  return lines.filter(Boolean);
}

/**
 * What the same intake costs as a conventional form. The reference build this demo is
 * modelled on runs thirty steps before it shows anything back.
 */
export const LONG_FORM_STEPS = 30;

/** Progress for the UI: how far through the required questions this person is. */
export function progress(state) {
  const required = requiredSlots(state.profile);
  const filled = required.filter((slot) => slotFilled(state.profile, slot)).length;

  // The records follow-up is a real question on screen, so it has to be counted or the
  // header sits at "3 of 3" while the person is answering a fourth thing.
  const hasFollowup = state.records?.status === "connected";
  const followupAnswered = slotFilled(state.profile, "medicationCurrent");

  return {
    filled: filled + (hasFollowup && followupAnswered ? 1 : 0),
    total: required.length + (hasFollowup ? 1 : 0),
    route: routeOf(state.profile),
    asked: (state.asked ?? []).length,
    longForm: LONG_FORM_STEPS,
  };
}
