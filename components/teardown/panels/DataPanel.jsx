"use client";

import { useState } from "react";
import { Badge, Empty, Switch, useKumoToastManager } from "@cloudflare/kumo";
import { DatabaseIcon } from "@phosphor-icons/react";
import { PanelIntro, PanelSection } from "../ui";

const SOURCES = ["Amplitude", "PostHog", "Segment"];

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3 py-2">
      <dt className="text-sm text-kumo-subtle">{label}</dt>
      <dd className="text-sm text-kumo-strong">{children}</dd>
    </div>
  );
}

export default function DataPanel({ report, ready }) {
  const toasts = useKumoToastManager();
  const [sources, setSources] = useState({});
  const p = report.profile;

  if (!ready) {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<DatabaseIcon size={40} className="text-kumo-inactive" />}
        title="No data yet"
        description="The company profile fills in once the capture reads the site."
      />
    );
  }

  return (
    <>
      <PanelIntro title={p.name}>
        {report.url} · captured {report.capturedAt}
      </PanelIntro>

      <PanelSection title="Data sources">
        <p className="mb-3 text-sm text-kumo-subtle">Connect analytics to size the upside against real traffic.</p>
        <div className="flex flex-col gap-3">
          {SOURCES.map((s) => (
            <Switch
              key={s}
              label={s}
              variant="neutral"
              checked={!!sources[s]}
              onCheckedChange={(on) => {
                setSources((prev) => ({ ...prev, [s]: on }));
                toasts.add({
                  title: on ? `${s} connected` : `${s} disconnected`,
                  description: on ? "Demo only: no data is pulled." : undefined,
                  variant: on ? "success" : "default",
                });
              }}
            />
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Company">
        <dl className="divide-y divide-kumo-hairline">
          <Row label="Product">{p.product}</Row>
          <Row label="Category">{p.category}</Row>
          <Row label="Use cases">
            <span className="flex flex-wrap gap-1">
              {p.useCases.map((u) => (
                <Badge key={u} variant="neutral">{u}</Badge>
              ))}
            </span>
          </Row>
          <Row label="Users">{p.users}</Row>
          <Row label="Model">{p.model}</Row>
        </dl>
      </PanelSection>

      <PanelSection title="Key metrics">
        <ul className="flex flex-col gap-2">
          {p.metrics.map((m) => (
            <li key={m.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-kumo-strong">{m.label}</span>
              <span className="text-xs text-kumo-subtle">{m.role}</span>
            </li>
          ))}
        </ul>
      </PanelSection>
    </>
  );
}
