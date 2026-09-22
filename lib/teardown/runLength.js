/* How long an A/B test needs before an effect of a given size is readable.
   Two-sided conversion test, 95% confidence, 80% power, 50/50 split, plus a
   10% execution buffer. Same math as the original teardown console. */

export const TRAFFIC_STEPS = [100, 300, 500, 1000, 3000, 10000];
export const CONVERSION_STEPS = [0.02, 0.05, 0.1, 0.2, 0.35, 0.5];

export const LIFTS = [
  { id: "big", label: "Big win", lift: 0.5, liftLabel: "50%+ lift" },
  { id: "moderate", label: "Moderate", lift: 0.2, liftLabel: "~20% lift" },
  { id: "small", label: "Smallest", lift: 0.1, liftLabel: "~10% lift" },
];

const Z_ALPHA = 1.96;
const Z_POWER = 0.84;

function samplePerVariant(baseline, lift) {
  const test = Math.min(0.999, baseline * (1 + lift));
  const pooled = (baseline + test) / 2;
  const delta = test - baseline;
  const numerator =
    Z_ALPHA * Math.sqrt(2 * pooled * (1 - pooled)) +
    Z_POWER * Math.sqrt(baseline * (1 - baseline) + test * (1 - test));
  return Math.ceil((numerator * numerator) / (delta * delta));
}

export function runDays(baseline, lift, dailyTraffic) {
  const days = (2 * samplePerVariant(baseline, lift)) / dailyTraffic;
  return Math.max(1, Math.ceil(days * 1.1));
}

export function friendlyDuration(days) {
  if (days === 1) return "about 1 day";
  if (days <= 8) return `about ${days} days`;
  if (days <= 10) return "about 1 week";
  if (days <= 16) return "about 2 weeks";
  if (days <= 24) return "about 3 weeks";
  if (days <= 38) return "about a month";
  if (days <= 52) return "about 6 weeks";
  return `about ${Math.ceil(days / 30)} months`;
}
