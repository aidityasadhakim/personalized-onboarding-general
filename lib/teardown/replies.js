/* Canned answers for "Ask the teardown". No model runs behind the chat: a
   question is matched against these routes in order, and the first hit wins.
   A reply can attach cards and point the console at the view it talks about. */

const routes = [
  {
    match: /ship first|priorit|start with|what should we|first test/,
    reply: () => ({
      text: "Issue 04, the CTA rename. It's copy only, about half an eng-day, and high confidence. It's also the cheapest way to learn whether the gate's framing or its placement is the binding constraint. If clicks move but trial starts don't, placement is the answer, so ship EC-01 next.",
      attachments: [{ type: "issue", id: "issue-04" }, { type: "idea", id: "EC-01" }],
      tab: "ideas",
    }),
  },
  {
    match: /issue ?0?1\b|first output|dense|context/,
    reply: () => ({
      text: "Helena's first output is a long brand analysis: business-profile.md and brand-guidelines.md. It's good groundwork, but it's an input to future work, not the thing the user signed up for. Collapse it and lead with one finished artifact.",
      attachments: [{ type: "issue", id: "issue-01" }],
      tab: "analysis",
    }),
  },
  {
    match: /issue ?0?2\b|intent|chip|recommend|starter plan|generic/,
    reply: () => ({
      text: "Onboarding asks what you need help with, then the first chat ignores the answer and opens with a generic 14-day plan. The prototype uses the chips and the site to make one strong recommendation instead.",
      attachments: [{ type: "issue", id: "issue-02" }],
      tab: "analysis",
    }),
  },
  {
    match: /tinder|openart|reference|blur/,
    reply: (r) => ({
      text: `Tinder counts your likes and blurs them: proof they exist, gated exactly at the reveal. ${r.ideas[0].rationale}`,
      attachments: [{ type: "idea", id: "EC-01" }],
      tab: "setup",
    }),
  },
  {
    match: /issue ?0?3\b|gate|banner|attention|hire helena|paywall hurt/,
    reply: () => ({
      text: "“Hire Helena” is the only saturated element on the aha screen, and it fires before the output is read. The gate itself can stay; it just needs to arrive after the win and block the next artifact, not the first one.",
      attachments: [{ type: "issue", id: "issue-03" }],
      tab: "analysis",
    }),
  },
  {
    match: /issue ?0?4\b|cta|button|copy|commitment/,
    reply: () => ({
      text: "The button names the commitment. Name the value instead: “Get your full week of posts →”, with “Free for 3 days · cancel anytime · keep everything you create” underneath as reassurance, never as the offer.",
      attachments: [{ type: "issue", id: "issue-04" }],
      tab: "analysis",
    }),
  },
  {
    match: /upside|benchmark|how much|worth|north star|revenue/,
    reply: (r) => ({
      text: `The north star is ${r.upside.northStar.toLowerCase()}. The category averages ${r.upside.average}% and the top 10% reach ${r.upside.top10}%. We can't place Enrich Labs on that line without analytics; connect Amplitude or PostHog under Context › Data and I'll size the gap.`,
      attachments: [{ type: "funnel" }],
      tab: "analysis",
    }),
  },
  {
    match: /compar|competitor|up against|rival|jasper|okara|pattern|category/,
    reply: (r) => ({
      text: `Jasper and Copy.ai reach a first output in 2 to 3 minutes; Enrich Labs takes 6. It scores ${r.competitors.rows[0].score} against ${r.competitors.rows[1].score} and ${r.competitors.rows[2].score}, and loses on 4 of 5 measures. The one win is personalization: Helena reads the whole site, which neither rival does. The head-to-head and both rivals' journeys are under Context › Competitors.`,
      tab: "competitors",
    }),
  },
  {
    match: /capture|journey|screen|landing|paywall|pricing|sign ?up/,
    reply: (r) => ({
      text: `I captured ${r.journey.length} steps: landing, onboarding, the first session, the paywall, and pricing. Sign-up is effortless; the friction starts at step 04, when the paywall lands mid-output.`,
      attachments: [{ type: "captures" }],
      tab: "journey",
    }),
  },
  {
    match: /card|ec-?01|test|experiment|run length|how long|traffic/,
    reply: () => ({
      text: "EC-01 moves the gate into the conversation: the first output stays whole, and Helena gates only the next draft. It's on the roadmap; generate mockups there and a growth expert drafts three variants to choose from.",
      attachments: [{ type: "idea", id: "EC-01" }],
      tab: "ideas",
    }),
  },
  {
    match: /which mock|mock [abc]\b|pick a mock|choose/,
    reply: () => ({
      text: "Mock A is the expert's pick. The email stays whole and only the next draft is gated below its first line, so the win lands before the ask. Mock B proves quantity with four counted drafts; Mock C is the lightest touch, a gate inside Helena's message.",
      tab: "setup",
    }),
  },
  {
    match: /onboarding|prototype|preview|solution|personali|first run|mockup|flow/,
    reply: () => ({
      text: "The proposed first run is need → first win → ask. Helena uses the intent chips and the site to recommend one win, writes it in full, and only then shows four more drafts behind a counted, blurred gate.",
      attachments: [{ type: "prototype" }],
      tab: "onboarding",
    }),
  },
  {
    match: /strength|good|working|well/,
    reply: (r) => ({
      text: `${r.strength.title}: ${r.strength.body}`,
      tab: "analysis",
    }),
  },
];

export function replyTo(question, report, activeTab) {
  const q = question.toLowerCase();
  for (const route of routes) {
    if (route.match.test(q)) return route.reply(report);
  }
  return {
    text: `I don't have a scripted answer for that yet. On the ${tabNames[activeTab] ?? "current"} tab, try asking about ${fallbackTopic[activeTab] ?? "an issue, the capture, or the onboarding prototype"}.`,
  };
}

const tabNames = {
  journey: "Journey",
  data: "Data",
  competitors: "Competitors",
  analysis: "Issues",
  ideas: "Roadmap",
  setup: "Mockups",
  onboarding: "Preview",
  workflow: "Workflow",
};

const fallbackTopic = {
  journey: "the paywall, or the onboarding step",
  data: "the upside, or the north star",
  competitors: "who they're up against",
  analysis: "Issue 01, the gate, or the benchmark",
  ideas: "which issue to ship first",
  setup: "which mock to pick, or EC-01",
  onboarding: "why the gate moved, or the first win",
  workflow: "what the capture found",
};

export const suggestionsFor = {
  idle: [],
  journey: ["Why does the paywall hurt?", "What happens after the intent chips?", "What's working well?"],
  data: ["What's the upside?", "Who are they up against?", "Which issue do we ship first?"],
  competitors: ["Who are they up against?", "What's the upside?", "Which issue do we ship first?"],
  analysis: ["Explain Issue 01", "What's the upside?", "Compare to stronger patterns"],
  ideas: ["Which issue do we ship first?", "What is EC-01?", "Why the Tinder reference?"],
  setup: ["Which mock should we pick?", "Why the Tinder reference?", "Show the preview"],
  onboarding: ["Why move the gate?", "How is it personalized?", "Which issue do we ship first?"],
  workflow: ["What did the capture find?", "Which issue do we ship first?", "Show the onboarding prototype"],
};
