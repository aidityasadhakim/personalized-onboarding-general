"use client";

import { useState } from "react";
import { Tabs } from "@cloudflare/kumo";
import { CONVERSION_STEPS, LIFTS, TRAFFIC_STEPS, friendlyDuration, runDays } from "@/lib/teardown/runLength";

const trafficLabel = (n) => (n >= 1000 ? `${n / 1000}k` : String(n));

export default function RunLengthCalculator() {
  const [traffic, setTraffic] = useState("500");
  const [conversion, setConversion] = useState("0.2");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-kumo-default">
          Traffic at this step: <span className="font-medium">{Number(traffic).toLocaleString("en-US")}</span> visitors a day
        </p>
        <Tabs
          variant="segmented"
          size="sm"
          value={traffic}
          onValueChange={setTraffic}
          listClassName="w-full"
          tabs={TRAFFIC_STEPS.map((n) => ({ value: String(n), label: trafficLabel(n), className: "flex-1" }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-kumo-default">
          Current conversion at this step: <span className="font-medium">{Math.round(Number(conversion) * 100)}%</span>
        </p>
        <Tabs
          variant="segmented"
          size="sm"
          value={conversion}
          onValueChange={setConversion}
          listClassName="w-full"
          tabs={CONVERSION_STEPS.map((c) => ({ value: String(c), label: `${Math.round(c * 100)}%`, className: "flex-1" }))}
        />
      </div>

      <dl className="divide-y divide-kumo-hairline rounded-xl ring-1 ring-kumo-hairline" aria-live="polite">
        {LIFTS.map((l) => {
          const days = runDays(Number(conversion), l.lift, Number(traffic));
          return (
            <div key={l.id} className="flex items-baseline gap-3 px-4 py-2.5">
              <dt className="w-20 text-sm font-medium text-kumo-strong">{l.label}</dt>
              <dd className="w-20 text-xs text-kumo-subtle">{l.liftLabel}</dd>
              <dd className="ml-auto text-sm text-kumo-strong">
                {friendlyDuration(days)} <span className="ml-1 text-xs text-kumo-subtle">{days}d</span>
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="text-xs leading-relaxed text-kumo-subtle">
        95% confidence · 80% power · two-sided test · 50/50 split · 10% buffer. Run at least a full week when day-of-week effects matter.
      </p>
    </div>
  );
}
