"use client";

import { useEffect, useState } from "react";
import { brand } from "@/lib/brand";
import ProjectionChart from "./ProjectionChart";
import styles from "./flow.module.css";

function useCountdown(minutes) {
  const [left, setLeft] = useState(minutes * 60);
  useEffect(() => {
    const id = setInterval(() => setLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * The aha moment. Everything on it is derived from what the person told us, and the
 * headline says "ready for provider review" rather than "approved" — nothing is
 * approved until a clinician looks at it.
 */
export default function PlanStep({ plan, onContinue }) {
  const held = useCountdown(plan.holdMinutes);

  return (
    <div>
      <div className={styles.holdBar}>
        <span className="label">Your plan is held for {held}</span>
      </div>

      <div className={styles.planCard}>
        <div className={styles.planHead}>
          <span className="wordmark">{brand.name}</span>
          <h1 style={{ marginTop: 10 }}>{plan.headline}</h1>
          <p className={styles.planSub}>{plan.subhead}</p>
        </div>

        <div className={styles.planAttrs}>
          {plan.attributes.map((attr) => (
            <span key={attr.label} className={styles.attr}>
              <span className={styles.attrLabel}>{attr.label}</span>
              {attr.value}
            </span>
          ))}
        </div>

        <div className={styles.items}>
          {plan.items.map((item) => (
            <div
              key={item.name}
              className={`${styles.item} ${item.status === "held" ? styles.itemHeld : ""} ${
                item.status === "excluded" ? styles.itemExcluded : ""
              }`}
            >
              <div className={styles.itemBody}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemRole}>{item.role}</div>
                {item.note ? <div className={styles.itemNote}>{item.note}</div> : null}
              </div>
              <span
                className={`${styles.itemStatus} ${
                  item.status === "held" ? styles.itemStatusHeld : ""
                } ${item.status === "excluded" ? styles.itemStatusExcluded : ""}`}
              >
                {item.status === "held"
                  ? "In review"
                  : item.status === "excluded"
                    ? "Not offered"
                    : "Included"}
              </span>
            </div>
          ))}
        </div>

        {plan.changes.length > 0 ? (
          <div className={styles.changes}>
            <div className="label">What your answers changed</div>
            <ul className={styles.changeList}>
              {plan.changes.map((change) => (
                <li key={change} className={styles.change}>
                  {change}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ProjectionChart points={plan.projection} />
        <p className="caption" style={{ marginTop: 10 }}>
          {brand.disclaimer}
        </p>

        <button type="button" className={styles.primary} onClick={onContinue}>
          See my options →
        </button>
      </div>
    </div>
  );
}
