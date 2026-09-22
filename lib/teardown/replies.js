/* Canned answers for "Ask the teardown". No model runs behind the chat: a
   question is matched against these routes in order, and the first hit wins.
   A reply can attach cards and point the sidebar at the tab it talks about. */

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
      tab: "ideas",
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
      text: `The north star is ${r.upside.northStar.toLowerCase()}. The category averages ${r.upside.average}% and the top 10% reach ${r.upside.top10}%. We can't place Enrich Labs on that line without analytics; connect Amplitude or PostHog in the Profile tab and I'll size the gap.`,
      attachments: [{ type: "funnel" }],
      tab: "analysis",
    }),
  },
  {
    match: /compar|competitor|up against|rival|jasper|okara|pattern|category/,
    reply: (r) => ({
      text: `Buyers compare Enrich Labs with ${r.profile.competitors.slice(0, -1).join(", ")}, and ${r.profile.competitors.at(-1)} already ranks for “Enrich Labs alternatives”. Against stronger activation paths, Enrich Labs loses on timing, not effort: the proof arrives late, the gate interrupts the first read, and the CTA asks for a hire. The comparison table is in the Analysis tab.`,
      tab: "analysis",
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
      text: "EC-01 moves the gate into the conversation. At 500 visitors a day and 20% conversion, a big win reads in about 2 days and a 10% lift in about a month. Adjust the calculator in the Ideas tab to match their traffic.",
      attachments: [{ type: "idea", id: "EC-01" }],
      tab: "ideas",
    }),
  },
  {
    match: /onboarding|prototype|solution|personali|first run|mockup|flow/,
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
  profile: "Profile",
  workflow: "Workflow",
  journey: "Journey",
  analysis: "Analysis",
  ideas: "Ideas",
  onboarding: "Onboarding",
};

const fallbackTopic = {
  profile: "the upside, or the competitors",
  workflow: "what the capture found",
  journey: "the paywall, or the onboarding step",
  analysis: "Issue 01, the gate, or the benchmark",
  ideas: "EC-01, or how long the test runs",
  onboarding: "why the gate moved, or the first win",
};

export const suggestionsFor = {
  idle: [],
  profile: ["What's the upside?", "Who are they up against?", "Which issue do we ship first?"],
  workflow: ["What did the capture find?", "Which issue do we ship first?", "Show the onboarding prototype"],
  journey: ["Why does the paywall hurt?", "What happens after the intent chips?", "What's working well?"],
  analysis: ["Explain Issue 01", "What's the upside?", "Compare to stronger patterns"],
  ideas: ["How long would EC-01 run?", "Which issue do we ship first?", "Why the Tinder reference?"],
  onboarding: ["Why move the gate?", "How is it personalized?", "Which issue do we ship first?"],
};
