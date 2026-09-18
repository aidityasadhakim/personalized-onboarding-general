/**
 * One turn of the onboarding.
 *
 * The client holds the state and sends it back each time, so there is no session
 * store to keep warm during a demo. The order here is the whole architecture:
 * apply the answer, let the rules decide what is allowed, let the model pick and
 * word one of those, render it.
 */

import { NextResponse } from "next/server";
import { buildPlan } from "@/lib/flow/plan";
import { decideTurn, extractFacts, recordFollowup, renderMove } from "@/lib/flow/engine";
import { factsFromRecords } from "@/lib/flow/records";
import { QUESTIONS } from "@/lib/flow/questions";
import {
  clinicalFlags,
  nextMoves,
  planPreview,
  progress,
  requiredSlots,
  slotFilled,
} from "@/lib/flow/rules";

const EMPTY_STATE = { profile: {}, shown: [], asked: [], records: { status: "idle" }, turns: 0 };

function shownKey(move) {
  if (move.kind === "education") return `edu:${move.id}`;
  return move.id;
}

/** Applies whatever the person just did to the profile. Returns what it filled. */
async function applyInput(state, input) {
  if (!input || input.type === "start") return { filled: [], said: "", degraded: false };

  if (input.type === "records") {
    state.records = {
      status: input.status,
      source: input.status === "connected" ? input.source ?? null : null,
    };
    if (input.status === "connected") {
      const facts = factsFromRecords();
      const filled = [];
      for (const [slot, value] of Object.entries(facts)) {
        if (!slotFilled(state.profile, slot)) {
          state.profile[slot] = value;
          filled.push(slot);
        }
      }
      return { filled, said: "connected their medical records", degraded: false };
    }
    return { filled: [], said: "skipped connecting records", degraded: false };
  }

  if (input.type === "option") {
    const slot = input.slot;
    const value = slot === "conditions" ? [input.value] : input.value;
    state.profile[slot] = { value, quote: input.label ?? input.value, source: "chose" };
    if (!state.asked.includes(slot)) state.asked.push(slot);
    return { filled: [slot], said: input.label ?? input.value, degraded: false };
  }

  if (input.type === "text") {
    const before = requiredSlots(state.profile).filter((s) => slotFilled(state.profile, s));
    const { facts, concerns, degraded } = await extractFacts(input.text);

    for (const [slot, value] of Object.entries(facts)) {
      if (slot === "priorTreatments") {
        state.profile.priorTreatments = value;
        continue;
      }
      // A typed answer beats a guess, but never overwrites something they picked.
      if (!slotFilled(state.profile, slot) || state.profile[slot]?.source === "records") {
        state.profile[slot] = value;
      }
    }
    if (concerns?.length) {
      state.profile.concerns = [...new Set([...(state.profile.concerns ?? []), ...concerns])];
    }

    const after = requiredSlots(state.profile).filter((s) => slotFilled(state.profile, s));
    const filled = after.filter((s) => !before.includes(s));
    return { filled, said: input.text, degraded };
  }

  return { filled: [], said: "", degraded: false };
}

export async function POST(request) {
  const started = Date.now();
  const body = await request.json().catch(() => ({}));
  const state = { ...EMPTY_STATE, ...(body.state ?? {}) };
  state.profile = { ...(state.profile ?? {}) };
  state.shown = [...(state.shown ?? [])];
  state.asked = [...(state.asked ?? [])];
  state.records = { ...(state.records ?? { status: "idle" }) };

  const applied = await applyInput(state, body.input);

  // Slots the answer filled that we never had to ask about: the whole point.
  const skipped = applied.filled.filter((slot) => !state.asked.includes(slot)).length;

  const moves = nextMoves(state);
  const first = moves[0];

  let ack = "";
  let move = first;
  let degraded = applied.degraded;

  if (body.input?.type === "start") {
    // No model call on the first paint: the demo should open instantly.
    move = first;
    ack = "";
  } else {
    const decision = await decideTurn({
      state,
      moves,
      lastAnswer: applied.said,
      skipped,
    });
    move = decision.move;
    ack = decision.ack;
    degraded = degraded || decision.degraded;
  }

  const needsPlan = move.kind === "plan" || move.kind === "paywall";
  const plan = needsPlan ? buildPlan(state) : null;
  const step = renderMove(move, state, plan);

  if (move.kind === "recordFollowup") {
    const written = await recordFollowup(state.profile);
    step.prompt = written.prompt;
    step.options = written.options;
    step.inline = false;
    degraded = degraded || written.degraded;
  }

  if (step.kind === "question" && step.slot && !state.asked.includes(step.slot)) {
    state.asked.push(step.slot);
  }

  const key = shownKey(move);
  if (key && !state.shown.includes(key)) state.shown.push(key);
  state.turns = (state.turns ?? 0) + 1;

  return NextResponse.json({
    state,
    ack,
    step,
    meta: {
      skipped,
      degraded,
      ms: Date.now() - started,
      progress: progress(state),
      // Only while the conversation is still running — once the plan is on screen the
      // preview would just be a worse copy of it.
      planPreview: needsPlan || move.kind === "done" ? [] : planPreview(state),
      flags: clinicalFlags(state.profile),
      question: step.kind === "question" ? QUESTIONS[step.id]?.prompt ?? step.prompt : null,
    },
  });
}
