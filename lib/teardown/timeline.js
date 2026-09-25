/* The scripted teardown run. There is no crawler behind this demo: a run
   replays these events on a timer, and "Skip" applies the rest at once.
   Each event carries the delay to wait *before* it fires. */

export const STAGES = [
  { id: "capture", title: "Capture", detail: "Sign up and record every screen" },
  { id: "analysis", title: "Analysis", detail: "Score the funnel, find the leaks" },
  { id: "ideas", title: "Idea cards", detail: "Turn issues into shippable tests" },
  { id: "onboarding", title: "Onboarding", detail: "Build a personalized first run" },
];

export function buildTimeline(report, requestedHost) {
  const host = report.url;
  const replaying = requestedHost && requestedHost !== host;
  const events = [];
  const push = (delay, event) => events.push({ delay, ...event });

  push(300, { type: "stage", stage: "capture", status: "running" });
  push(200, {
    type: "message",
    message: {
      role: "agent",
      text: replaying
        ? `This demo runs on a recorded teardown, so I'm replaying ${host} in place of ${requestedHost}. I'll sign up like a real user and capture every screen.`
        : `Starting on ${host}. I'll sign up like a real user and capture every screen from the landing page to the paywall.`,
    },
  });

  for (const step of report.journey) {
    push(900, { type: "capture", id: step.id, log: step.log });
  }

  push(500, { type: "stage", stage: "capture", status: "done" });
  push(150, {
    type: "message",
    message: {
      role: "agent",
      text: `Captured ${report.journey.length} steps. The sign-up is smooth, but Helena asks you to “Hire Helena” before the first output is even read.`,
      attachments: [{ type: "captures" }],
    },
  });

  push(400, { type: "stage", stage: "analysis", status: "running" });
  push(300, { type: "log", text: "Scored the funnel against 4 lenses" });
  push(900, { type: "log", text: `Found ${report.issues.length} issues and 1 strength` });
  push(700, { type: "log", text: "Placed the category benchmark: 6% average, 19% top 10%" });
  push(400, { type: "stage", stage: "analysis", status: "done" });
  push(150, {
    type: "message",
    message: {
      role: "agent",
      text: `Found ${report.issues.length} issues. The biggest leak is activation: the first output is context, not a win, and the paywall lands before it.`,
      attachments: [{ type: "funnel" }, { type: "issue", id: "issue-01" }],
    },
  });

  push(400, { type: "stage", stage: "ideas", status: "running" });
  push(900, { type: "log", text: "Matched 2 path-success patterns: Tinder, OpenArt" });
  push(700, { type: "log", text: "Drafted an idea card for each issue; EC-01 is on the roadmap" });
  push(300, { type: "stage", stage: "ideas", status: "done" });
  push(150, {
    type: "message",
    message: {
      role: "agent",
      text: "Drafted EC-01: the gate joins the conversation. Keep the first output whole, then gate only the next artifact. It's on your roadmap; generate mockups there when you're ready.",
      attachments: [{ type: "idea", id: "EC-01" }],
    },
  });

  push(400, { type: "stage", stage: "onboarding", status: "running" });
  push(900, { type: "log", text: "Personalized the first run from the site and intent chips" });
  push(700, { type: "log", text: "Built the proposed flow: need → first win → gate → trial" });
  push(300, { type: "stage", stage: "onboarding", status: "done" });
  push(150, {
    type: "message",
    message: {
      role: "agent",
      text: "Your personalized first run for Enrich Labs is ready. Pick an intent, get one real win, and meet the ask only after the win is on screen. Try it in the console.",
      attachments: [{ type: "prototype" }],
    },
  });
  push(100, { type: "done" });

  return events;
}

/* The same run, already finished: what /teardown/enrichlabs opens on. */
export function completedState(report) {
  const events = buildTimeline(report);
  const state = events.reduce(applyEvent, { ...initialRunState(report.url), phase: "running" });
  // A finished run loads as history: no word-by-word replay.
  return { ...state, cursor: events.length, messages: state.messages.map((m) => ({ ...m, stream: false })) };
}

export function initialRunState(url = "") {
  return {
    phase: "idle",
    url,
    stages: Object.fromEntries(STAGES.map((s) => [s.id, "pending"])),
    captured: [],
    log: [],
    messages: [],
    cursor: 0,
  };
}

// Timestamps read as a real run, about a minute per few lines, from 15:02.
// Derived from the log length so the reducer stays pure.
const stamp = (log) => `15:${String(2 + Math.floor(log.length / 3)).padStart(2, "0")}`;

export const messageId = (messages) => `m${messages.length + 1}`;

export function applyEvent(state, event) {
  switch (event.type) {
    case "stage":
      return { ...state, stages: { ...state.stages, [event.stage]: event.status } };
    case "capture":
      return {
        ...state,
        captured: [...state.captured, event.id],
        log: [...state.log, { time: stamp(state.log), text: event.log }],
      };
    case "log":
      return { ...state, log: [...state.log, { time: stamp(state.log), text: event.text }] };
    case "message":
      return {
        ...state,
        messages: [...state.messages, { id: messageId(state.messages), stream: true, ...event.message }],
      };
    case "done":
      return { ...state, phase: "done" };
    default:
      return state;
  }
}
