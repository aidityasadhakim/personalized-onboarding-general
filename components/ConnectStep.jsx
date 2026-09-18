"use client";

import { useEffect, useState } from "react";
import { HEALTH_SYSTEMS, IMPORT_STEPS, IMPORTED_RECORDS } from "@/lib/flow/records";
import styles from "./flow.module.css";

/**
 * The records import. Deliberately not instant: watching it locate, read and
 * summarize is what makes retrieval legible. Generic by design — reproducing a real
 * portal's branding in a demo we hand to other companies is a trademark problem.
 */
export default function ConnectStep({ onConnected, onDeclined }) {
  const [phase, setPhase] = useState("idle");
  const [system, setSystem] = useState(null);
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (phase !== "importing") return undefined;
    const timers = IMPORT_STEPS.map((_, index) =>
      setTimeout(() => setDone(index + 1), 700 * (index + 1)),
    );
    const finish = setTimeout(() => setPhase("done"), 700 * IMPORT_STEPS.length + 400);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [phase]);

  return (
    <div>
      <h1 className={styles.prompt}>Want me to pull in your medical records?</h1>
      <p className={styles.helper}>
        It saves you the rest of the health questions, and your provider sees the real
        history instead of what you remember.
      </p>

      <div className={styles.sheet}>
        <div className={styles.sheetHead}>
          <div className={styles.sheetTitle}>Health Connections</div>
          <div className={styles.sheetSub}>
            {phase === "done" ? IMPORTED_RECORDS.source : "Read-only. You can disconnect any time."}
          </div>
        </div>

        {phase === "idle" ? (
          <>
            <div className={styles.connectFlow}>
              <div>
                <div className={styles.tile}>
                  <DeviceIcon />
                </div>
                <div className={styles.tileLabel}>This device</div>
              </div>
              <span className={styles.arrow} aria-hidden="true">
                →
              </span>
              <div>
                <div className={styles.tile}>
                  <ChartIcon />
                </div>
                <div className={styles.tileLabel}>Your records</div>
              </div>
            </div>
            <div className={styles.systems}>
              {HEALTH_SYSTEMS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={styles.system}
                  onClick={() => {
                    setSystem(entry);
                    setPhase("importing");
                  }}
                >
                  <span>
                    <span className={styles.systemName}>{entry.name}</span>
                    <br />
                    <span className={styles.systemDetail}>{entry.detail}</span>
                  </span>
                  <span className={styles.connectPill}>Connect</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {phase === "importing" ? (
          <div className={styles.importing}>
            {IMPORT_STEPS.map((step, index) => (
              <div
                key={step}
                className={`${styles.importStep} ${index < done ? styles.importStepDone : ""}`}
              >
                <span
                  className={`${styles.importCheck} ${index < done ? styles.importCheckDone : ""}`}
                  aria-hidden="true"
                >
                  {index < done ? "✓" : ""}
                </span>
                {step}
              </div>
            ))}
          </div>
        ) : null}

        {phase === "done" ? (
          <div className={styles.records}>
            {IMPORTED_RECORDS.items.map((item) => (
              <div key={item.name} className={styles.record}>
                <span>
                  <span className={styles.recordName}>{item.name}</span>
                  <br />
                  <span className={styles.recordDetail}>{item.detail}</span>
                </span>
                <span className={styles.recordDate}>{item.date}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {phase === "done" ? (
        <button
          type="button"
          className={styles.primary}
          onClick={() => onConnected(system?.name ?? IMPORTED_RECORDS.source)}
        >
          Continue with {IMPORTED_RECORDS.count} records →
        </button>
      ) : null}

      {phase !== "importing" ? (
        <div>
          <button type="button" className={styles.linkButton} onClick={onDeclined}>
            Skip this — I will answer the questions myself
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* Line icons rather than emoji: emoji render differently on every machine, and this is
   the screen that has to read like a real banking-style connect sheet. */

function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 5.4h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M8.8 13.2h1.9l.9-2.1 1.3 3.5.9-1.4h1.4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path
        d="M14.5 2.8H7a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.3l-4.5-4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M14.3 2.9v4.4h4.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M8.6 12.6h2l.9-2 1.3 3.4.8-1.4h1.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.6 17.4h6.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
