"use client";

import { brand } from "@/lib/brand";
import PricingTiers from "./PricingTiers";
import styles from "./flow.module.css";

/**
 * The paywall as its own screen. The nurture route reaches the offer this way, after
 * the plan has had a screen to itself; the fast lane gets the same tiers on the plan
 * card instead.
 */
export default function PaywallStep({ plan, onCheckout }) {
  return (
    <div>
      <h1 className={styles.prompt}>Choose how long you want to commit.</h1>
      <p className={styles.helper}>
        Every option includes the provider review, unlimited follow-ups and free
        shipping. Cancel any time.
      </p>
      <p className={`caption ${styles.socialProof}`}>{brand.socialProof}</p>

      <PricingTiers plan={plan} onCheckout={onCheckout} />
    </div>
  );
}
