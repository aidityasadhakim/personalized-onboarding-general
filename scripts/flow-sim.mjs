/**
 * Walks the whole onboarding through the API, the way a person would, and prints every
 * turn. Two personas: the man who is ready, and the man who is exploring and types in
 * his own words. Run against a dev server: npm run sim  (PORT=3011 by default)
 */

const BASE = process.env.SIM_BASE ?? "http://localhost:3011";

async function turn(state, input) {
  const response = await fetch(`${BASE}/api/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, input }),
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

/** A persona answers by picking an option, typing, or handling a non-question step. */
async function run(name, persona) {
  console.log(`\n=== ${name} ===`);
  let { state, step, meta } = await turn(null, { type: "start" });
  let turns = 0;
  let llmMs = 0;

  for (let guard = 0; guard < 20; guard += 1) {
    const kind = step.kind;
    if (kind === "plan" || kind === "paywall" || kind === "done" || kind === "stop") {
      console.log(`→ ${kind.toUpperCase()}`);
      if (kind === "plan") {
        console.log(`   items: ${step.plan.items.map((i) => `${i.name} [${i.status}]`).join(", ")}`);
        console.log(`   attrs: ${step.plan.attributes.map((a) => `${a.label}=${a.value}`).join(", ")}`);
        console.log(`   flags: ${step.plan.flags.map((f) => f.rule).join(", ") || "none"}`);
        const next = await turn(state, { type: "continue" });
        ({ state, step, meta } = next);
        continue;
      }
      if (kind === "paywall") {
        console.log(`   timeline: ${step.plan.timeline.map((m) => `${m.when}: ${m.what}`).join(" · ")}`);
        break;
      }
      break;
    }

    const input = persona(step, turns);
    if (!input) {
      console.log(`!! persona had no answer for ${kind} ${step.id}`);
      break;
    }

    const said =
      input.type === "text" ? `"${input.text}"` : input.label ?? input.status ?? input.type;
    console.log(`Q: ${step.prompt ?? kind}`);
    console.log(`A: ${said}`);

    const next = await turn(state, input);
    ({ state, step, meta } = next);
    turns += 1;
    llmMs += meta.ms;
    if (meta.degraded) console.log("   (degraded: fell back to written copy)");
    if (next.ack) console.log(`   ack: ${next.ack}`);
    if (meta.skipped) console.log(`   skipped ${meta.skipped} question(s)`);
  }

  console.log(`turns: ${turns} · avg ${Math.round(llmMs / Math.max(turns, 1))}ms`);
  return turns;
}

const readyMan = (step) => {
  if (step.kind === "connect") return { type: "records", status: "connected", source: "Epic MyChart" };
  if (step.kind === "education") return { type: "continue" };
  if (step.kind !== "question") return null;
  if (step.id === "intent") {
    const option = step.options.find((o) => o.value === "ready");
    return { type: "option", slot: step.slot, value: option.value, label: option.label };
  }
  const option = step.options[0];
  return { type: "option", slot: step.slot, value: option.value, label: option.label };
};

let typed = false;
const exploringMan = (step) => {
  if (step.kind === "connect") return { type: "records", status: "connected", source: "Epic MyChart" };
  if (step.kind === "education") return { type: "continue" };
  if (step.kind !== "question") return null;
  if (step.id === "intent") {
    const option = step.options.find((o) => o.value === "exploring");
    return { type: "option", slot: step.slot, value: option.value, label: option.label };
  }
  if (!typed) {
    typed = true;
    return {
      type: "text",
      text: "I'm 34, the crown has been thinning for about two years and my dad went the same way. Honestly I'm worried about the sexual side effects.",
    };
  }
  const option = step.options[0];
  return { type: "option", slot: step.slot, value: option.value, label: option.label };
};

await run("Ready — picks ASAP", readyMan);
await run("Exploring — types his own words", exploringMan);
