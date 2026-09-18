import styles from "./flow.module.css";

const W = 640;
const H = 280;
const PAD = { top: 18, right: 28, bottom: 34, left: 20 };

const TICKS = [
  { month: 0, label: "Today" },
  { month: 2, label: "8 weeks" },
  { month: 4, label: "4 months" },
  { month: 12, label: "12 months" },
];

/**
 * Two projected lines: what happens without treatment, and what the plan is expected
 * to do. No library — the shape is simple and an inline SVG themes with the tokens.
 * The y-axis is deliberately unlabelled: this is a projection, not a measurement.
 */
export default function ProjectionChart({ points, title = "Your projected hair density" }) {
  const values = points.flatMap((p) => [p.base, p.plan]);
  const min = Math.min(...values) - 3;
  const max = Math.max(...values) + 3;

  const x = (month) => PAD.left + (month / 12) * (W - PAD.left - PAD.right);
  const y = (value) =>
    PAD.top + (1 - (value - min) / (max - min)) * (H - PAD.top - PAD.bottom);

  const line = (key) => points.map((p, i) => `${i ? "L" : "M"}${x(p.month)},${y(p[key])}`).join(" ");
  const area = `${line("plan")} L${x(12)},${y(min)} L${x(0)},${y(min)} Z`;

  const last = points[points.length - 1];

  return (
    <figure className={styles.chartWrap}>
      <figcaption>
        <div className={`label ${styles.chartTitle}`}>{title}</div>
      </figcaption>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Projection over twelve months. Without treatment, density falls to about ${last.base} percent of today. With the plan, it reaches about ${last.plan} percent.`}
      >
        <defs>
          <linearGradient id="planFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-plan)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--chart-plan)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {TICKS.map((tick) => (
          <g key={tick.month}>
            <line
              x1={x(tick.month)}
              x2={x(tick.month)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--line-strong)"
              strokeDasharray="3 5"
              strokeWidth="1"
            />
            <text
              x={x(tick.month)}
              y={H - PAD.bottom + 20}
              textAnchor={tick.month === 0 ? "start" : tick.month === 12 ? "end" : "middle"}
              fontSize="12"
              fill="var(--ink-muted)"
            >
              {tick.label}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#planFill)" />

        <path
          className={styles.drawBase}
          d={line("base")}
          fill="none"
          stroke="var(--chart-base)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          className={styles.drawPlan}
          d={line("plan")}
          fill="none"
          stroke="var(--chart-plan)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {TICKS.map((tick) => {
          const point = points.find((p) => p.month === tick.month);
          if (!point) return null;
          return (
            <circle
              key={`dot-${tick.month}`}
              cx={x(tick.month)}
              cy={y(point.plan)}
              r="4.5"
              fill="var(--chart-plan)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          );
        })}

        <circle cx={x(12)} cy={y(last.base)} r="4" fill="var(--chart-base)" />
      </svg>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "var(--chart-plan)" }} />
          With your plan
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: "var(--chart-base)" }} />
          Without treatment
        </span>
      </div>
    </figure>
  );
}
