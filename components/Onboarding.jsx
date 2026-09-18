"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { brand } from "@/lib/brand";
import ConnectStep from "./ConnectStep";
import PaywallStep from "./PaywallStep";
import PlanStep from "./PlanStep";
import styles from "./flow.module.css";

const ROUTE_CLASS = {
  ready: styles.optionReady,
  nurture: styles.optionNurture,
};

export default function Onboarding() {
  const [state, setState] = useState(null);
  const [step, setStep] = useState(null);
  const [ack, setAck] = useState("");
  const [meta, setMeta] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(true);
  const [text, setText] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [picked, setPicked] = useState(null);
  const bottom = useRef(null);

  const send = useCallback(
    async (input, transcript) => {
      setBusy(true);
      if (transcript) setHistory((rows) => [...rows, transcript]);
      try {
        const response = await fetch("/api/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state, input }),
        });
        const data = await response.json();
        setState(data.state);
        setStep(data.step);
        setAck(data.ack ?? "");
        setMeta(data.meta ?? null);
        // The selection tint lives until the next question lands, so it stays lit
        // while the turn is in flight.
        setPicked(null);
      } catch (error) {
        console.error("[turn] failed", error);
      } finally {
        setBusy(false);
      }
    },
    [state],
  );

  // First paint: no model call, so the demo opens instantly. Deferred a tick so the
  // first render is the shell rather than one cascading out of this effect.
  useEffect(() => {
    const id = setTimeout(() => send({ type: "start" }), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [step, busy]);

  const answer = useCallback(
    (option) => {
      if (busy || !step) return;
      setPicked(option.value);
      send(
        { type: "option", slot: step.slot, value: option.value, label: option.label },
        { q: step.prompt, a: option.label },
      );
    },
    [busy, send, step],
  );

  // Number keys pick an option, so a live demo never fumbles for the mouse.
  useEffect(() => {
    if (!step?.options) return undefined;
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && step.options[index]) answer(step.options[index]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, answer]);

  const submitText = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setText("");
    send({ type: "text", text: value }, { q: step?.prompt ?? "", a: value, said: true });
  };

  const progress = meta?.progress;

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className="wordmark">{brand.name}</span>
        {progress ? (
          <span className={styles.progress}>
            {progress.route ? (
              <span className={styles.pips} aria-hidden="true">
                {Array.from({ length: progress.total }).map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.pip} ${index < progress.filled ? styles.pipOn : ""}`}
                  />
                ))}
              </span>
            ) : null}
            <span className="label">
              {checkout
                ? "Done"
                : step?.kind === "plan" || step?.kind === "paywall"
                  ? "Your plan"
                  : progress.route
                    ? `${progress.filled} of ${progress.total} answered`
                    : "A few questions"}
            </span>
          </span>
        ) : null}
      </header>

      <main
        className={`${styles.column} ${
          step?.kind === "paywall" || step?.withPricing ? styles.wide : ""
        }`}
      >
        {history.length > 0 ? (
          <div className={styles.history}>
            {history.map((row, index) =>
              row.said ? (
                <span key={index} className={styles.said}>
                  {row.a}
                </span>
              ) : (
                <div key={index} className={styles.historyRow}>
                  <span className={styles.historyQ}>{row.q}</span>
                  <span className={styles.historyA}>{row.a}</span>
                </div>
              ),
            )}
          </div>
        ) : null}

        {busy ? (
          <div className={styles.thinking} aria-label="Thinking">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        ) : null}

        {!busy && step ? (
          <section className={styles.turn} aria-live="polite">
            {ack ? <p className={styles.ack}>{ack}</p> : null}

            {/* The whole pitch in one line: answering in your own words removes
                questions instead of adding them. */}
            {/* Readiness stated mid-conversation moves them to the short route, and
                saying so is the point — the flow visibly reacted to them. */}
            {meta?.promoted ? (
              <p className={`${styles.skipped} ${styles.promoted}`}>
                <span aria-hidden="true">→</span>
                You sound ready, so I am taking you the short way.
              </p>
            ) : null}

            {meta?.skipped > 0 ? (
              <p className={styles.skipped}>
                <span aria-hidden="true">✓</span>
                {meta.skipped === 1
                  ? "That answered another question, so I skipped it."
                  : `That answered ${meta.skipped} more questions, so I skipped them.`}
              </p>
            ) : null}

            {checkout ? (
              <Done checkout={checkout} meta={meta} />
            ) : step.kind === "question" ? (
              <>
                {step.eyebrow ? <span className={`label ${styles.eyebrow}`}>{step.eyebrow}</span> : null}
                {step.fromRecords ? (
                  <span className={styles.sourceNote}>✓ From your records</span>
                ) : null}
                <h1 className={styles.prompt}>{step.prompt}</h1>
                {step.helper ? <p className={styles.helper}>{step.helper}</p> : null}

                <fieldset className={`${styles.options} ${step.inline ? styles.optionsInline : ""}`}>
                  <legend className={styles.srOnly}>{step.prompt}</legend>
                  {step.options?.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      // Route colour lands on selection, never before: pre-tinting two
                      // options would steer the answer the branch depends on.
                      className={`${styles.option} ${
                        picked === option.value ? ROUTE_CLASS[option.route] ?? styles.optionPicked : ""
                      }`}
                      style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                      onClick={() => answer(option)}
                      disabled={busy}
                    >
                      {option.label}
                      {!step.inline ? <span className={styles.optionKey}>{index + 1}</span> : null}
                    </button>
                  ))}
                </fieldset>

                <PlanPreview lines={meta?.planPreview} />

                <form className={styles.textRow} onSubmit={submitText}>
                  <input
                    className={styles.textInput}
                    name="answer"
                    id="answer"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="…or tell me in your own words"
                    aria-label="Answer in your own words"
                  />
                  <button type="submit" className={styles.send} disabled={!text.trim() || busy}>
                    Send
                  </button>
                </form>
              </>
            ) : step.kind === "education" ? (
              <>
                {step.eyebrow ? <span className={`label ${styles.eyebrow}`}>{step.eyebrow}</span> : null}
                <h1 className={styles.prompt}>{step.prompt}</h1>
                <div className={styles.stats}>
                  {step.stats.map((stat) => (
                    <div key={stat.value} className={styles.stat}>
                      <div className={styles.statValue}>{stat.value}</div>
                      <p className={`caption ${styles.statCaption}`}>{stat.caption}</p>
                    </div>
                  ))}
                </div>
                <p className={`caption ${styles.footnote}`}>{step.footnote}</p>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => send({ type: "continue" }, { q: step.prompt, a: "Continue" })}
                >
                  Continue →
                </button>
              </>
            ) : step.kind === "connect" ? (
              <ConnectStep
                onConnected={(source) =>
                  send(
                    { type: "records", status: "connected", source },
                    { q: "Medical records", a: "Connected" },
                  )
                }
                onDeclined={() =>
                  send(
                    { type: "records", status: "declined" },
                    { q: "Medical records", a: "Skipped" },
                  )
                }
              />
            ) : step.kind === "plan" ? (
              <PlanStep
                plan={step.plan}
                withPricing={step.withPricing}
                onCheckout={(tier) => setCheckout(tier)}
                onContinue={() => send({ type: "continue" }, null)}
              />
            ) : step.kind === "paywall" ? (
              <PaywallStep plan={step.plan} onCheckout={(tier) => setCheckout(tier)} />
            ) : step.kind === "stop" ? (
              <div className={styles.finalCard}>
                <h1>{step.headline}</h1>
                <p className={styles.planSub}>{step.body}</p>
              </div>
            ) : (
              <div className={styles.finalCard}>
                <h1>That is everything.</h1>
              </div>
            )}
          </section>
        ) : null}

        <div ref={bottom} />
      </main>
    </div>
  );
}

/**
 * The plan assembling while the conversation is still going. Without it, the person
 * only learns their answers mattered on the very last screen.
 */
function PlanPreview({ lines }) {
  if (!lines?.length) return null;
  return (
    <aside className={styles.preview}>
      <div className="label">Your plan, building as you answer</div>
      <ul className={styles.previewList}>
        {lines.map((line, index) => (
          <li
            key={line}
            className={styles.previewLine}
            style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
          >
            <span className={styles.previewTick} aria-hidden="true">
              ✓
            </span>
            {line}
          </li>
        ))}
        <li className={`${styles.previewLine} ${styles.previewPending}`}>
          <span className={styles.previewTick} aria-hidden="true">
            •
          </span>
          Still building…
        </li>
      </ul>
    </aside>
  );
}

function Done({ checkout, meta }) {
  return (
    <div className={styles.finalCard}>
      <span className="wordmark">{brand.name}</span>
      <h1 style={{ marginTop: 10 }}>You are in. A provider takes it from here.</h1>
      <p className={styles.planSub}>
        {checkout.term} · ${checkout.monthly}/mo. Your provider reviews everything within{" "}
        {brand.reviewWindowHours} hours, and nothing ships until they sign off.
      </p>
      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Questions you answered</span>
          <span className={styles.summaryValue}>{meta?.progress?.total ?? "—"}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>The same intake as a form</span>
          <span className={styles.summaryValue}>{meta?.progress?.longForm ?? 30} steps</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Plan</span>
          <span className={styles.summaryValue}>
            {checkout.term}, ${checkout.billed} {checkout.cadence}
          </span>
        </div>
      </div>
    </div>
  );
}
