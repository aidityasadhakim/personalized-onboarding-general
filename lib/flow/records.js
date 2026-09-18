/**
 * The health-records import, mocked. In production this is an aggregator (Fasten,
 * Particle, 1up) reading FHIR from the patient's health system; for the demo the
 * shape is what matters: a few records that let the flow skip questions and ask one
 * question it could not have asked otherwise.
 */

export const HEALTH_SYSTEMS = [
  { id: "epic", name: "Epic MyChart", detail: "Most US health systems" },
  { id: "cerner", name: "Oracle Health", detail: "Hospitals and clinics" },
  { id: "athena", name: "athenahealth", detail: "Independent practices" },
  { id: "apple", name: "Apple Health", detail: "Records already on your iPhone" },
];

export const IMPORT_STEPS = [
  "Locating your records",
  "Reading medications and labs",
  "Summarizing what matters here",
];

/** What comes back from the import. Deliberately ordinary, like a real chart. */
export const IMPORTED_RECORDS = {
  source: "Epic MyChart · Bay Area Medical Group",
  importedAt: "2026-03-14",
  count: 12,
  items: [
    {
      type: "lab",
      name: "Comprehensive metabolic panel",
      detail: "Liver enzymes normal (ALT 24, AST 21)",
      date: "2026-03-14",
      clears: "conditions",
    },
    {
      type: "medication",
      name: "Lisinopril 10mg",
      detail: "Prescribed 2024, active",
      date: "2024-11-02",
      asks: "still_current",
    },
    {
      type: "vital",
      name: "Blood pressure",
      detail: "122/78, in range",
      date: "2026-03-14",
    },
    {
      type: "condition",
      name: "Seasonal allergic rhinitis",
      detail: "Managed, no active treatment",
      date: "2023-05-19",
    },
  ],
};

/**
 * The follow-up the LLM is asked to write, and the exact copy used if it cannot.
 * Both are grounded in the records above — the model may not introduce a fact.
 */
export const RECORD_FOLLOWUP_FALLBACK = {
  prompt:
    "Your March panel shows normal liver enzymes, so I can skip that screening. Your chart also lists lisinopril 10mg — are you still taking it?",
  options: [
    { value: "yes", label: "Yes, still taking it" },
    { value: "stopped", label: "No, I stopped" },
    { value: "not_sure", label: "Not sure" },
  ],
};

/** Records can fill slots the person would otherwise have been asked about. */
export function factsFromRecords() {
  return {
    conditions: {
      value: ["none"],
      quote: "Comprehensive metabolic panel · liver enzymes normal",
      source: "records",
    },
  };
}
