import { enrichlabs } from "./enrichlabs";

/* Every recorded teardown, by slug. The URL intake replays the default one. */
export const reports = { [enrichlabs.slug]: enrichlabs };
export const defaultReport = enrichlabs;
