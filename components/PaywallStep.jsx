"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";
import styles from "./flow.module.css";

/**
 * The paywall. The month-by-month timeline inside the highlighted plan comes from the
 * plan object, so it reflects this person's pattern rather than static marketing copy.
 */
export default function PaywallStep({ plan, onCheckout }) {
  const [selected, setSelected] = useState(
    plan.pricing.find((tier) => tier.popular)?.id ?? plan.pricing[0].id,
  );
  const tier = plan.pricing.find((entry) => entry.id === selected);

  return (
    <div>
      <h1 className={styles.prompt}>Choose how long you want to commit.</h1>
      <p className={styles.helper}>
        Every option includes the provider review, unlimited follow-ups and free
        shipping. Cancel any time.
      </p>
      <p className={`caption ${styles.socialProof}`}>{brand.socialProof}</p>

      <div className={styles.plans}>
        {plan.pricing.map((entry) => {
          const isSelected = entry.id === selected;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={isSelected}
              className={`${styles.plan} ${entry.popular ? styles.planPopular : ""} ${
                isSelected ? styles.planSelected : ""
              }`}
              onClick={() => setSelected(entry.id)}
            >
              {entry.popular ? <span className={styles.badge}>Most popular</span> : null}

              <div className={styles.planTop}>
                <span className={styles.planTerm}>{entry.term}</span>
                <span className={styles.planPrice}>
                  ${entry.monthly}
                  <span className={styles.planPriceUnit}>/mo</span>
                  <br />
                  <span className={styles.planBilled}>
                    ${entry.billed} {entry.cadence}
                  </span>
                </span>
              </div>

              <div className={styles.planPromise}>{entry.promise}</div>
              {entry.savings ? <div className={styles.planSavings}>{entry.savings}</div> : null}

              {entry.popular ? (
                <>
                  <ul className={styles.timeline}>
                    {plan.timeline.map((milestone) => (
                      <li key={milestone.when} className={styles.milestone}>
                        <div className="label">{milestone.when}</div>
                        <div className={styles.milestoneWhat}>{milestone.what}</div>
                        <div className={styles.milestoneDetail}>{milestone.detail}</div>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.quote}>
                    <div className={styles.stars} aria-label="5 out of 5">
                      ★★★★★
                    </div>
                    <p className={styles.quoteText}>
                      “I stopped checking my hairline in every window. That is the part I did
                      not expect.”
                    </p>
                    <p className={`caption ${styles.quoteWho}`}>
                      — Marcus, member for 7 months
                    </p>
                  </div>
                </>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className={styles.checkoutBar}>
        <button type="button" className={styles.checkout} onClick={() => onCheckout(tier)}>
          Start {tier.term.toLowerCase()} · ${tier.monthly}/mo
        </button>
      </div>
    </div>
  );
}
