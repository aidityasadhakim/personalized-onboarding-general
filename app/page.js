import { brand } from "@/lib/brand";
import styles from "./page.module.css";

const OPTIONS = [
  { label: "Receding hairline, want to slow its progress" },
  { label: "Experiencing hair loss, exploring options", route: "nurture" },
  { label: "Experiencing hair loss, ready to start treatment ASAP", route: "ready" },
  { label: "No hair loss yet, want to get ahead of it" },
  { label: "None of the above" },
];

const SWATCHES = [
  ["--paper", "paper"],
  ["--paper-warm", "paper-warm"],
  ["--paper-cream", "paper-cream"],
  ["--line-strong", "line-strong"],
  ["--ink", "ink"],
  ["--rust", "rust"],
  ["--ready", "ready"],
  ["--nurture", "nurture"],
  ["--olive", "olive"],
  ["--amber", "amber"],
  ["--chart-plan", "chart-plan"],
  ["--chart-base", "chart-base"],
];

/**
 * Scaffold check: renders the DESIGN.md primitives so the token layer is
 * visible in the browser. The conversation flow replaces this page.
 */
export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span className="wordmark">{brand.name}</span>
        <span className="label">Design system check</span>
      </header>

      <h1>Which best represents your hair loss and goals?</h1>
      <p className={styles.helper}>
        Two different men, two different answers. Everything after this screen
        differs.
      </p>

      <fieldset className={styles.options}>
        <legend className="label">Screen 1 · the same for everyone</legend>
        {OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            className={styles.option}
            data-route={option.route}
          >
            {option.label}
            {option.route ? <span className={styles.check}>✓</span> : null}
          </button>
        ))}
      </fieldset>

      <input
        className={styles.freeText}
        placeholder="…or tell me in your own words"
        aria-label="Answer in your own words"
      />

      <div className={styles.badges}>
        <span className={styles.badge} style={{ background: "var(--ready)" }}>
          Direct route · 3 questions to a plan
        </span>
        <span className={styles.badge} style={{ background: "var(--nurture)" }}>
          Nurture route · belief first
        </span>
      </div>

      <section className={styles.section}>
        <div className={`label ${styles.sectionLabel}`}>Plan-building card</div>
        <div className={styles.planCard}>
          <div className="label">Your plan, building as you answer</div>
          <p className={styles.planText}>
            {brand.productLine.join(" + ")}, provider review included, ships in
            2 days
          </p>
        </div>
        <div className={styles.row}>
          <button type="button" className={styles.primary}>
            See my plan →
          </button>
          <button type="button" className={styles.secondary}>
            Tell me more first
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <div className={`label ${styles.sectionLabel}`}>Stat cards</div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statNumber}>90%</div>
            <p className={`caption ${styles.statCaption}`}>
              saw reduced shedding with finasteride
            </p>
          </div>
          <div className={styles.stat}>
            <div className={styles.statNumber}>80%</div>
            <p className={`caption ${styles.statCaption}`}>
              experienced significant regrowth with minoxidil
            </p>
          </div>
        </div>
        <p className="caption" style={{ marginTop: 12 }}>
          {brand.disclaimer}
        </p>
      </section>

      <section className={styles.section}>
        <div className={`label ${styles.sectionLabel}`}>Palette</div>
        <div className={styles.swatches}>
          {SWATCHES.map(([token, name]) => (
            <div key={token} className={styles.swatch}>
              <div
                className={styles.swatchChip}
                style={{ background: `var(${token})` }}
              />
              <div className={styles.swatchName}>{name}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
