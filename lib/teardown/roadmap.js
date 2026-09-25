/* The roadmap the PM builds from the issues: which idea cards are on it, in
   what order, their status, and where their mockups are. `mockups` maps an
   idea id to "generating" (with the expert), "ready", or "queued". */

export function initialIdeas(report) {
  return {
    order: report.ideas.filter((i) => i.onRoadmap).map((i) => i.id),
    statuses: Object.fromEntries(report.ideas.map((i) => [i.id, i.status])),
    mockups: {},
  };
}

export const withIdea = (s, id) => (s.order.includes(id) ? s : { ...s, order: [...s.order, id] });

/* Only EC-01 has mockups in this demo; any other card waits with the expert. */
export const hasMockups = (id) => id === "EC-01";
