/* The Enrich Labs teardown, as structured data.
   Every panel, chat reply, and the onboarding prototype reads from here, so a
   second company is a second file with the same shape. Facts come from the
   July 2026 teardown report; nothing here is fetched live. */

const asset = (name) => `/teardown/enrichlabs/${name}`;

export const enrichlabs = {
  slug: "enrichlabs",
  url: "enrichlabs.ai",
  capturedAt: "Jul 30, 2026",

  profile: {
    name: "Enrich Labs",
    product: "Helena, an autonomous AI marketer",
    category: "AI marketing agent",
    useCases: ["SEO", "Ads", "Social", "Email"],
    users: "Founders, marketers, and agencies",
    model: "Opt-in free trial, 3 days, no card at signup",
    metrics: [
      { label: "Workspace → trial start", role: "North star step" },
      { label: "Gate reveal rate", role: "Primary" },
      { label: "Trial → paid", role: "Guardrail" },
      { label: "First-output completion", role: "Health" },
    ],
    competitors: ["Jasper", "Copy.ai", "Writesonic", "Surfer SEO", "Okara AI"],
  },

  /* The head-to-head against the two closest rivals, each with its own
     teardown. Sample demo figures, not measured. `journey` is the rival's path
     to its first value, timed from landing; `image` is null until a capture
     is added. `tracked` rivals have no teardown shown yet. */
  competitors: {
    refreshedAt: "Jul 30, 2026",
    measures: [
      { key: "timeToValue", label: "Time to first value", better: "lower", unit: "min", max: 7 },
      { key: "steps", label: "Steps before value", better: "lower", unit: "steps", max: 6 },
      { key: "aha", label: "Aha strength", better: "higher", unit: "/100", max: 100 },
      { key: "personalization", label: "Personalization", better: "higher", unit: "/100", max: 100 },
      { key: "price", label: "Entry price", better: "lower", unit: "$/mo", max: 110 },
    ],
    rows: [
      {
        name: "Enrich Labs",
        self: true,
        score: 52,
        timeToValue: 6, steps: 5, aha: 44, personalization: 86, price: 99,
        trial: "3-day trial, no card",
        journey: [
          { title: "Landing", at: 0, note: "“Meet Helena.” One CTA." },
          { title: "Intent chips", at: 0.7, note: "Five chips, multi-select" },
          { title: "Site read", at: 2.5, note: "Helena reads the whole site" },
          { title: "Brand analysis", at: 4.5, note: "Dense context, not a win" },
          { title: "First usable output", at: 6, note: "After “Hire Helena” interrupts", value: true },
        ],
      },
      {
        name: "Jasper",
        score: 71,
        timeToValue: 3, steps: 4, aha: 62, personalization: 48, price: 49,
        trial: "7-day trial, card required",
        teardown: "Jul 28",
        takeaway: "Jasper hands over a finished blog intro in three minutes. The template picker skips the blank page.",
        journey: [
          { title: "Landing", at: 0, note: "“Start writing with Jasper”", image: null },
          { title: "Sign up", at: 0.5, note: "Google sign-in, card for the trial", image: null },
          { title: "Template picker", at: 1.7, note: "50+ templates by use case", image: null },
          { title: "First draft", at: 3, note: "A blog intro from a one-line brief", image: null, value: true },
        ],
      },
      {
        name: "Copy.ai",
        score: 68,
        timeToValue: 2, steps: 3, aha: 58, personalization: 40, price: 0,
        trial: "Free plan",
        teardown: "Jul 28",
        takeaway: "Copy.ai shows a LinkedIn post in two minutes, with no card and no setup. Speed is the whole pitch.",
        journey: [
          { title: "Landing", at: 0, note: "“Get started free”", image: null },
          { title: "Sign up", at: 0.3, note: "Google sign-in, no card", image: null },
          { title: "First output", at: 2, note: "A LinkedIn post from a starter prompt", image: null, value: true },
        ],
      },
    ],
    tracked: [
      { name: "Writesonic", teardown: null },
      { name: "Surfer SEO", teardown: null },
      { name: "Okara AI", teardown: "Jul 29" },
    ],
  },

  /* The capture pipeline. `log` lines replay while a run is in progress. */
  journey: [
    {
      id: "landing",
      step: "01",
      title: "Landing",
      image: asset("capture-landing.jpg"),
      summary: "“Meet Helena, your AI digital marketer.” One CTA: Get Started.",
      log: "Visited enrichlabs.ai and read the hero, nav, and proof points",
    },
    {
      id: "onboarding",
      step: "02",
      title: "Onboarding",
      image: asset("capture-onboarding.jpg"),
      summary: "“What do you need help with?” Five intent chips, multi-select.",
      log: "Signed up with a test inbox and answered the intent step",
    },
    {
      id: "first-session",
      step: "03",
      title: "First session",
      image: asset("capture-first-session.jpg"),
      summary: "Helena reads the site and saves business-profile.md and brand-guidelines.md.",
      issues: ["issue-01", "issue-02"],
      log: "Recorded the first session: site read, two files saved",
    },
    {
      id: "paywall",
      step: "04",
      title: "Paywall",
      image: asset("capture-paywall.jpg"),
      summary: "“Hire your first autonomous AI marketer today.” Hire Helena, 3-day trial.",
      issues: ["issue-03", "issue-04"],
      log: "Hit the paywall mid-output: “Hire Helena”",
    },
    {
      id: "pricing",
      step: "05",
      title: "Pricing",
      image: null,
      summary: "3-day free trial, no card at signup, 3 interaction credits before the gate.",
      log: "Read pricing: opt-in trial, credit cap before the gate",
    },
  ],

  funnel: [
    { stage: "Onboarding", lens: "Effortless momentum", score: 64, tone: "ok", note: "Helena does the homework: reads the whole site before asking for anything." },
    { stage: "Activation", lens: "Compelling aha", score: 44, tone: "leak", note: "The first output is a dense brand analysis, not the thing the user came for." },
    { stage: "Paid", lens: "Clear upgrade ask", score: 58, tone: "mid", note: "The ask lands mid-read and names the commitment instead of the value." },
    { stage: "Retention", lens: "Habit building", score: 40, tone: "mid", note: "No Save, Copy, or Schedule after the first output, so the win has nowhere to go." },
  ],

  upside: {
    northStar: "Signup → paid conversion",
    average: 6,
    top10: 19,
    note: "AI growth and marketing tools with an opt-in trial. Directional for the category; connect analytics to place Enrich Labs on the line.",
  },

  strength: {
    title: "Helena does the homework",
    body: "It reads your whole site and saves a real brand and business profile before doing anything. The groundwork for a personal aha is already done; most tools never get this far.",
    image: asset("evidence-strength.jpg"),
  },

  issues: [
    {
      id: "issue-01",
      n: "01",
      stage: "Activation",
      title: "The first output isn't a win, it's context",
      body: "The first thing Helena produces is a long, dense brand analysis. It's an input to future work, not the output the user came for.",
      fix: "Collapse the analysis and go straight to one finished, personally relevant artifact.",
      solution: ["Fold business-profile.md and brand-guidelines.md into a one-line “I read your site” note", "Open with one finished artifact matched to the first intent chip", "Keep the full analysis one click away for users who want it"],
      status: "Agreed on call",
      image: asset("evidence-issue-01.jpg"),
      spot: { x: 30, y: 58 },
      idea: "003",
    },
    {
      id: "issue-02",
      n: "02",
      stage: "Activation",
      title: "Asked, then set aside",
      body: "The intent chips and the site URL are already collected, but the first chat opens with a generic starter plan.",
      fix: "Use the intent and the site to make one strong, personalized recommendation.",
      solution: ["Carry the chosen chips into Helena’s first message", "Recommend one win grounded in something found on their site", "Offer two alternatives as chips instead of a 14-day plan"],
      status: "Agreed on call",
      image: asset("evidence-issue-02.jpg"),
      spot: { x: 22, y: 21 },
      idea: "002",
    },
    {
      id: "issue-03",
      n: "03",
      stage: "Paid",
      title: "Attention goes to the gate, not the output",
      body: "“Hire Helena” is the one saturated element on the aha screen, injected before the first output is even read.",
      fix: "Move the gate after the finished draft and let it block only the next artifact.",
      solution: ["Let the first output render in full, with no banner on screen", "Deliver the gate as a message from Helena, attached to the next artifact", "Blur only the lower half, so the preview itself is the pitch"],
      status: "Acknowledged on call",
      image: asset("evidence-issue-03.jpg"),
      spot: { x: 24, y: 27 },
      idea: "EC-01",
    },
    {
      id: "issue-04",
      n: "04",
      stage: "Paid",
      title: "The CTA names the commitment, not the value",
      body: "“Hire Helena” asks the user to decide at the moment they should be experiencing. Say what they get instead.",
      fix: "“Get your full week of posts →” with the trial demoted to reassurance.",
      solution: ["Rename the button to the value on screen: “Get your full week of posts →”", "Move “3-day free trial” under the button as reassurance", "Add “cancel anytime · keep everything you create”"],
      status: "Proposed",
      image: asset("evidence-issue-04.jpg"),
      spot: { x: 62, y: 37 },
      idea: "001",
    },
  ],

  opportunity:
    "Helena already does the hard work of reading the whole site. The biggest leak is the wait after it: get the user one real first win fast, then let that win, not a banner, tee up the subscription.",

  roadmap: [
    { group: "Low-hanging fruit", items: [
      "Use the intent choice, then suggest a personalized next choice that yields the first win",
      "Rewrite the banner CTA to name the value, not the commitment",
      "Keep “Hire Helena”, but take it off the critical path until the first win",
      "Add Save · Copy · Schedule after the first output so the win has somewhere to go",
    ] },
    { group: "The revamp", items: [
      "Gate the adjacent artifact, not the first one: counted, blurred, one click to reveal",
      "Name the paywall after the week of work already drafted",
    ] },
  ],

  comparison: [
    { point: "First proof", today: "Context and a strategy shell arrive before a complete, usable artifact.", pattern: "Deliver one finished, personally relevant artifact before asking for commitment." },
    { point: "Gate timing", today: "The commercial banner interrupts the first read.", pattern: "Gate the reveal of the adjacent artifact after the first win is complete." },
    { point: "CTA framing", today: "“Hire Helena” names a heavy commitment.", pattern: "Name the value already on screen and continue the user's momentum." },
    { point: "Learning loop", today: "Each optimization stays an isolated change.", pattern: "Store inputs, test, result, and context in memory for the next bet." },
  ],

  ideas: [
    {
      id: "EC-01",
      title: "The gate joins the conversation",
      from: "Issue 03",
      status: "planned",
      onRoadmap: true,
      score: 8.8,
      userState: "High intent, mid-read: absorbing their first output, in a conversation mindset, skeptical of being sold.",
      change: "The gate becomes a message from Helena that arrives after the first output is fully readable, attached to a second real artifact and blocking only its lower half. Clicking to see it is the trial start.",
      rationale: "The ask lands after a delivered win, the blocked preview is concrete proof about their own brand, and a reveal rides reading momentum instead of demanding a hiring decision.",
      reference: {
        image: asset("reference-tinder-openart.png"),
        name: "Tinder · OpenArt",
        driver: "The likes are counted and blurred: proof they exist, gated exactly at the reveal. Seeing is the purchase.",
      },
      metric: "Gate reveal rate · workspace → trial starts",
      guardrail: "Trial → paid holds · no bounce after the gate · first-output consumption rises",
    },
    { id: "001", title: "Rename the upgrade CTA to the value on screen", from: "Issue 04", status: "shipped", onRoadmap: true },
    { id: "002", title: "Open the first chat with one recommendation", from: "Issue 02", status: "planned" },
    { id: "003", title: "Fast path to output: collapse the analysis", from: "Issue 01", status: "planned" },
  ],

  lastTestRun: { card: "001", result: "+18%", metric: "upgrade clicks", date: "Aug 12, 2026" },

  /* The experiment library prototypes are generated from. Demo figures. */
  library: { experiments: 340, matched: 12 },
};

/* What the personalized first run knows about Enrich Labs. Each intent maps to
   the one win Helena recommends, grounded in what the capture found. */
export const helena = {
  intents: [
    { id: "seo", label: "SEO", emoji: "🔍" },
    { id: "content", label: "Content writing", emoji: "✍️" },
    { id: "social", label: "Social media", emoji: "📱" },
    { id: "email", label: "Email marketing", emoji: "📧" },
    { id: "ads", label: "Paid ads", emoji: "📣" },
  ],

  siteFindings: [
    "Read the landing page, pricing, and blog",
    "Pulled positioning, proof points, and brand voice",
    "Found Okara AI ranking for “Enrich Labs alternatives”",
    "Spotted 2 open keywords at 2,900 searches a month",
  ],

  wins: {
    seo: {
      pick: "Own the “Enrich Labs vs Jasper” search before a competitor does",
      why: "Okara AI already ranks for “Enrich Labs alternatives”. Buyers comparing you to Jasper have decided to buy; right now a rival's page is shaping the choice.",
      alternatives: ["Target “AI SEO tool” (2,900/mo, low competition)", "Audit your top 5 pages for missing schema"],
      artifact: {
        kind: "Comparison page",
        title: "Enrich Labs vs Jasper: which AI marketer actually ships?",
        body: [
          "Jasper writes copy when you ask. Helena runs your marketing while you sleep: she reads your site, learns your voice, and ships the work.",
          "If you want a writing assistant, Jasper is a fine choice. If you want the posts, emails, and ads done, published, and measured, that's what Helena is for.",
        ],
        bullets: ["Autonomous, not prompt-by-prompt", "Learns your brand from your own site", "Ships across SEO, social, email, and ads"],
      },
    },
    content: {
      pick: "A launch blog post in Enrich Labs' own voice",
      why: "Your positioning has one sharp idea: an AI marketer that works without a prompt. One post that argues it beats a generic content calendar.",
      alternatives: ["A 5-part newsletter series", "Rewrite the About page"],
      artifact: {
        kind: "Blog post",
        title: "Your AI marketer shouldn't need a prompt",
        body: [
          "Most AI tools wait for instructions. Helena starts by reading everything you've already published, then gets to work.",
          "Here's what a week of marketing looks like when nobody has to write the first prompt.",
        ],
        bullets: ["Hook: the prompt is the bottleneck", "Proof: a week drafted from one URL", "CTA: see what Helena drafts for you"],
      },
    },
    social: {
      pick: "Monday's LinkedIn post, drafted from your positioning",
      why: "LinkedIn is where founders and agencies, your buyers, compare AI tools. One strong post in your voice is a better first win than a 14-day plan.",
      alternatives: ["3 X posts for the SaaS growth crowd", "A LinkedIn carousel script"],
      artifact: {
        kind: "LinkedIn post",
        title: "Monday · LinkedIn",
        body: [
          "Most launches whisper. Ours won't.",
          "We built Helena because every founder we met had the same problem: great product, no time to market it. She reads your site, learns your voice, and ships the posts you never get to.",
        ],
        bullets: ["Hook tested against your brand voice", "Best slot: Mon 8:30am", "Ends with one clear ask"],
      },
    },
    email: {
      pick: "A 3-email sequence for the 3-day trial window",
      why: "The trial is your most critical conversion moment. There's no sequence today, and “automated email marketing” gets 2,900 searches a month.",
      alternatives: ["A win-back email for expired trials", "A welcome email that names the first win"],
      artifact: {
        kind: "Email · day 1 of 3",
        title: "Subject: Helena already started",
        body: [
          "While you were signing up, Helena read your site and drafted your first week. Here's what she found, and what she'd ship first.",
          "Reply “go” and she'll schedule it.",
        ],
        bullets: ["Day 1: the first win", "Day 2: the week she drafted", "Day 3: keep everything you created"],
      },
    },
    ads: {
      pick: "A LinkedIn ad aimed at people comparing AI marketers",
      why: "Searches like “Jasper alternative” mean the buyer is picking a winner. An ad that answers that comparison meets them at the decision.",
      alternatives: ["Google search ad for “AI marketing agent”", "Retargeting ad for trial drop-offs"],
      artifact: {
        kind: "LinkedIn ad",
        title: "Hook: Your AI writer waits. Helena ships.",
        body: [
          "Stop prompting. Helena reads your site, learns your voice, and runs your marketing across SEO, social, email, and ads.",
        ],
        bullets: ["Audience: founders at 1–50 person SaaS", "Offer: 3 days free", "CTA: See your first week"],
      },
    },
  },

  /* The four artifacts Helena drafts while the user reads. Only their first
     line shows; the rest sits behind the gate. */
  drafts: [
    { kind: "LinkedIn post", line: "Most launches whisper. Ours won't.", more: "Every founder we met had the same problem: great product, no time to market it. So we built Helena. She reads your site, learns your voice, and ships the posts you never get to." },
    { kind: "Instagram caption", line: "A launch shouldn't sound like a launch.", more: "It should sound like you, on your best day, with a week of posts already queued. #AImarketing #founders" },
    { kind: "Blog intro", line: "Your AI marketer shouldn't need a prompt.", more: "Most AI tools wait for instructions. Helena starts by reading everything you've already published, then gets to work." },
    { kind: "Ad headline", line: "Your AI writer waits. Helena ships.", more: "Stop prompting. Start publishing. 3 days free." },
  ],
};

// The first run travels with the report, so panels never import a company directly.
enrichlabs.firstRun = helena;
