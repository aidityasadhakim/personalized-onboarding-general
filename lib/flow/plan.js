/**
 * Builds the plan from the profile and the clinical flags. Deterministic on purpose:
 * what is in someone's plan is a rules decision, never a model's. The LLM only gets
 * to word the sentence around it.
 */

import { clinicalFlags } from "./rules";

export const PRICING = [
  {
    id: "six",
    term: "6 months",
    monthly: 69,
    billed: 414,
    cadence: "billed semi-annually",
    promise: "The full course, at the lowest monthly price",
    savings: "Save $300 vs monthly",
  },
  {
    id: "three",
    term: "3 months",
    monthly: 89,
    billed: 267,
    cadence: "billed quarterly",
    promise: "Long enough to see the first real change",
    savings: "Save $90 vs monthly",
    popular: true,
  },
  {
    id: "monthly",
    term: "Monthly",
    monthly: 119,
    billed: 119,
    cadence: "billed monthly",
    promise: "No commitment, cancel any time",
  },
];

const PATTERN_WORD = {
  crown: "crown",
  hairline: "hairline",
  diffuse: "thinning",
};

function products(profile, flags) {
  const held = flags.some((f) => f.id === "liver");
  const oralExcluded = flags.some((f) => f.id === "heart");

  const items = [
    {
      name: "Topical minoxidil 5%",
      role: "Applied daily. Wakes up follicles that have gone dormant.",
      status: "included",
    },
    {
      name: "Finasteride 1mg",
      role: "Taken daily. Blocks the hormone behind pattern hair loss.",
      status: held ? "held" : "included",
      note: held ? "Held for provider review — liver condition on file." : null,
    },
  ];

  if (oralExcluded) {
    // Shown rather than silently dropped: seeing what an answer removed is what makes
    // the rules layer believable.
    items.push({
      name: "Oral minoxidil",
      role: "The stronger, pill form of the same medication.",
      status: "excluded",
      note: "Not offered with a heart condition on file.",
    });
  } else if (profile.onset?.value === "longer") {
    items.push({
      name: "Thickening shampoo",
      role: "Twice weekly. Keeps the hair you have looking fuller while the rest works.",
      status: "included",
    });
  }

  return items;
}

/** Plain-language version of what the rules did, for the person rather than the chart. */
function changes(profile, flags, state) {
  const list = flags.map((flag) => {
    switch (flag.id) {
      case "liver":
        return "Finasteride is held until a provider reviews the liver condition you mentioned.";
      case "heart":
        return "Oral minoxidil is off your plan because of the heart condition you mentioned.";
      case "psa":
        return "Your provider is told that finasteride lowers PSA readings.";
      case "concern":
        return "We went through the side effect numbers before showing you this.";
      default:
        return flag.effect;
    }
  });

  if (state?.records?.status === "connected") {
    list.unshift("Your imported records answered the health screening questions for you.");
  }
  if (profile.familyHistory?.value === "yes") {
    list.push("Family history moved you to the treatment most likely to hold the line.");
  }
  return list;
}

/**
 * Twelve months of projected hair density, indexed to today = 100.
 * The baseline keeps declining; the treated line dips during the shedding phase and
 * then recovers. Both are illustrative, and the UI says so.
 */
function projection(profile) {
  const aggressive = profile.onset?.value === "under_a_year";
  const points = [];
  for (let month = 0; month <= 12; month += 1) {
    const base = 100 - month * 0.85;
    const dip = month <= 2 ? month * 1.4 : 2.8 - (month - 2) * 0.28;
    const gain = month <= 2 ? 0 : (month - 2) * (aggressive ? 1.5 : 1.25);
    points.push({
      month,
      base: Number(base.toFixed(1)),
      plan: Number(Math.min(100 - dip + gain, 116).toFixed(1)),
    });
  }
  return points;
}

// The ready route never asks about pattern, so this has to read as a sentence with
// nothing filled in.
const PATTERN_PHRASE = {
  crown: "along the crown",
  hairline: "along the hairline",
  diffuse: "through the thinner areas",
};

function timeline(profile) {
  const where = PATTERN_PHRASE[profile.pattern?.value] ?? "where it has been thinning";
  return [
    { when: "Month 1", what: "Shedding slows", detail: "The hair you have stops leaving." },
    { when: "Month 2", what: "First new growth", detail: `Fine hairs appear ${where}.` },
    { when: "Months 3–4", what: "Visible coverage", detail: "Enough that other people notice." },
    { when: "Month 6+", what: "Full results", detail: "Density holds as long as you keep going." },
  ];
}

export function buildPlan(state) {
  const { profile } = state;
  const flags = clinicalFlags(profile);
  const items = products(profile, flags);
  const held = items.filter((i) => i.status === "held");

  const attributes = [
    profile.pattern?.value
      ? { label: "Pattern", value: PATTERN_WORD[profile.pattern.value] ?? "thinning" }
      : null,
    profile.onset?.value
      ? {
          label: "Duration",
          value: {
            under_a_year: "under a year",
            one_to_three_years: "1 to 3 years",
            longer: "3 years or more",
          }[profile.onset.value],
        }
      : null,
    profile.familyHistory?.value === "yes" ? { label: "Family history", value: "yes" } : null,
    state.records?.status === "connected" ? { label: "Records", value: "imported" } : null,
  ].filter(Boolean);

  return {
    headline: "Your personalized plan is ready for provider review.",
    subhead:
      "A licensed provider reviews everything you told me, usually within 24 hours. Nothing ships before they sign off.",
    items,
    attributes,
    flags,
    changes: changes(profile, flags, state),
    held,
    timeline: timeline(profile),
    projection: projection(profile),
    pricing: PRICING,
    holdMinutes: 15,
  };
}
