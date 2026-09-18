/**
 * The question bank. In a real deployment a clinical team owns this file: the LLM
 * may only choose from these, never invent one. Each entry declares which profile
 * slot it fills and what answers are allowed.
 */

export const QUESTIONS = {
  intent: {
    id: "intent",
    slot: "intent",
    eyebrow: "Before anything else",
    prompt: "Which best represents your hair loss and goals?",
    helper: "There is no wrong answer — it decides what I ask next.",
    options: [
      { value: "slowing", label: "Receding hairline, want to slow its progress" },
      { value: "exploring", label: "Experiencing hair loss, exploring options", route: "nurture" },
      { value: "ready", label: "Experiencing hair loss, ready to start treatment ASAP", route: "ready" },
      { value: "preventing", label: "No hair loss yet, want to get ahead of it" },
      { value: "none", label: "None of the above" },
    ],
  },

  onset: {
    id: "onset",
    slot: "onset",
    prompt: "When did you first notice it?",
    inline: true,
    options: [
      { value: "under_a_year", label: "Under a year" },
      { value: "one_to_three_years", label: "1 to 3 years" },
      { value: "longer", label: "Longer" },
    ],
  },

  conditions: {
    id: "conditions",
    slot: "conditions",
    prompt: "Any of these apply?",
    inline: true,
    options: [
      { value: "heart", label: "Heart condition" },
      { value: "liver", label: "Liver condition" },
      { value: "none", label: "None of these" },
    ],
  },

  pattern: {
    id: "pattern",
    slot: "pattern",
    prompt: "Where are you noticing it most?",
    options: [
      { value: "crown", label: "The crown, at the back" },
      { value: "hairline", label: "The hairline, at the front" },
      { value: "diffuse", label: "All over, it is thinning generally" },
    ],
  },

  family: {
    id: "family",
    slot: "familyHistory",
    prompt: "Does hair loss run in your family?",
    inline: true,
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
  },

  goal: {
    id: "goal",
    slot: "goal",
    prompt: "What would make this worth it for you?",
    options: [
      { value: "keep", label: "Keep the hair I still have" },
      { value: "regrow", label: "Regrow what I have lost" },
      { value: "both", label: "Both, honestly" },
    ],
  },
};

/** Education cards. Shown, never asked. The LLM may only pick from these. */
export const EDUCATION = {
  causes: {
    id: "causes",
    eyebrow: "Worth knowing first",
    prompt: "Here is what usually causes it, and what works.",
    stats: [
      { value: "90%", caption: "saw reduced shedding with finasteride" },
      { value: "80%", caption: "experienced significant regrowth with minoxidil" },
    ],
    footnote: "Pooled results from manufacturer trials. Individual results vary.",
  },
  sideEffects: {
    id: "sideEffects",
    eyebrow: "On side effects",
    prompt: "The honest version, before you decide.",
    stats: [
      { value: "~2%", caption: "reported sexual side effects on finasteride in trials" },
      { value: "~1.5%", caption: "reported the same on placebo in those trials" },
    ],
    footnote:
      "Side effects usually resolve after stopping. A provider reviews your history before anything is prescribed.",
  },
};

export const ROUTE_BY_INTENT = {
  ready: "ready",
  exploring: "nurture",
  slowing: "nurture",
  preventing: "nurture",
  none: "nurture",
};
