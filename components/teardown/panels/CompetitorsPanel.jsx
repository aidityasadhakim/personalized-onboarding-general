"use client";

import { useState } from "react";
import { Badge, Button, Empty, LayerCard, Table, cn, useKumoToastManager } from "@cloudflare/kumo";
import { ArrowsClockwiseIcon, PlayIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { PanelIntro, PanelSection } from "../ui";

/* The funnel index. Time and friction are better lower, aha higher; the best
   value in each column is marked so the gap reads at a glance. */
const INDEX = [
  { key: "timeToValue", label: "Time to value", best: (rows) => minBy(rows, (r) => parseFloat(r.timeToValue)) },
  { key: "friction", label: "Friction", best: (rows) => minBy(rows, (r) => r.friction) },
  { key: "aha", label: "Aha strength", best: (rows) => minBy(rows, (r) => -r.aha) },
];

function minBy(rows, f) {
  return rows.reduce((a, b) => (f(b) < f(a) ? b : a)).name;
}

function IndexTable({ rows }) {
  const best = Object.fromEntries(INDEX.map((c) => [c.key, c.best(rows)]));
  return (
    <LayerCard className="overflow-x-auto p-0">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Product</Table.Head>
            {INDEX.map((c) => (
              <Table.Head key={c.key} className="text-right whitespace-nowrap">{c.label}</Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((r) => (
            <Table.Row key={r.name} className={cn(r.self && "bg-kumo-tint")}>
              <Table.Cell className={cn("whitespace-nowrap", r.self && "font-medium")}>{r.name}</Table.Cell>
              {INDEX.map((c) => (
                <Table.Cell
                  key={c.key}
                  className={cn("text-right tabular-nums", best[c.key] === r.name ? "font-medium text-ok" : "text-kumo-default")}
                >
                  {c.key === "friction" ? `${r.friction} steps` : r[c.key]}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </LayerCard>
  );
}

function PricingTable({ rows }) {
  return (
    <LayerCard className="overflow-x-auto p-0">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Product</Table.Head>
            <Table.Head>Entry price</Table.Head>
            <Table.Head>Trial</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map((r) => (
            <Table.Row key={r.name} className={cn(r.self && "bg-kumo-tint")}>
              <Table.Cell className={cn("whitespace-nowrap", r.self && "font-medium")}>{r.name}</Table.Cell>
              <Table.Cell className="whitespace-nowrap tabular-nums">{r.price}</Table.Cell>
              <Table.Cell className="text-kumo-subtle">{r.trial}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </LayerCard>
  );
}

export default function CompetitorsPanel({ report, ready }) {
  const toasts = useKumoToastManager();
  const [queued, setQueued] = useState({});
  const { rows, refreshedAt } = report.competitors;

  if (!ready) {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<UsersThreeIcon size={40} className="text-kumo-inactive" />}
        title="No competitors yet"
        description="The competitor set fills in once the capture reads the site."
      />
    );
  }

  function runTeardown(name) {
    setQueued((q) => ({ ...q, [name]: true }));
    toasts.add({ title: `Teardown queued for ${name}`, description: "Demo only: no capture runs.", variant: "success" });
  }

  return (
    <>
      <PanelIntro title="Competitors">
        How {report.profile.name} stacks up on the funnel index and on price. Refreshed {refreshedAt}.
      </PanelIntro>

      <PanelSection title="Funnel index">
        <IndexTable rows={rows} />
        <p className="mt-2.5 text-xs leading-relaxed text-kumo-subtle">
          Time to value: minutes to the first usable output. Friction: steps before it. Aha strength: how compelling
          the first win is, out of 100. Best in set is green.
        </p>
      </PanelSection>

      <PanelSection title="Pricing">
        <PricingTable rows={rows} />
      </PanelSection>

      <PanelSection title="Teardowns">
        <ul className="flex flex-col divide-y divide-kumo-hairline">
          {rows
            .filter((r) => !r.self)
            .map((r) => (
              <li key={r.name} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-kumo-strong">{r.name}</span>
                  <span className="block text-xs text-kumo-subtle">
                    {r.teardown ? `Torn down ${r.teardown}` : "Not torn down yet"}
                  </span>
                </span>
                {queued[r.name] ? (
                  <Badge variant="warning">Queued</Badge>
                ) : (
                  <Button
                    size="xs"
                    variant={r.teardown ? "ghost" : "secondary"}
                    icon={r.teardown ? <ArrowsClockwiseIcon size={12} /> : <PlayIcon size={12} />}
                    onClick={() => runTeardown(r.name)}
                  >
                    {r.teardown ? "Refresh" : "Run teardown"}
                  </Button>
                )}
              </li>
            ))}
        </ul>
      </PanelSection>

      <p className="px-5 py-4 text-xs text-kumo-subtle">Illustrative figures for the demo.</p>
    </>
  );
}
