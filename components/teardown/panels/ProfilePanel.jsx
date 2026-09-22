"use client";

import { useState } from "react";
import { Badge, Button, Dialog, Empty, Input, Switch, useKumoToastManager } from "@cloudflare/kumo";
import { BuildingsIcon, PlusIcon, TrophyIcon, XIcon } from "@phosphor-icons/react";
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

function AddWinDialog({ open, onOpenChange, onSave }) {
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSave({ name: form.get("name"), metric: form.get("metric"), result: form.get("result") });
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog className="p-6" size="lg">
        <div className="mb-1 flex items-start justify-between gap-4">
          <Dialog.Title className="font-display text-2xl text-kumo-strong">Add a win</Dialog.Title>
          <Dialog.Close
            render={(p) => <Button {...p} variant="ghost" shape="square" size="sm" icon={<XIcon />} aria-label="Close" />}
          />
        </div>
        <Dialog.Description className="text-sm text-kumo-subtle">
          Store a result in memory so it informs the next hypothesis.
        </Dialog.Description>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <Input name="name" label="Win" placeholder="The gate joins the conversation" required />
          <Input name="metric" label="Metric" placeholder="Workspace → trial starts" required />
          <Input name="result" label="Result" placeholder="+50%" required />
          <div className="mt-2 flex justify-end gap-2">
            <Dialog.Close render={(p) => <Button {...p} variant="secondary">Cancel</Button>} />
            <Button type="submit" variant="primary">Save win</Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}

export default function ProfilePanel({ report, ready }) {
  const toasts = useKumoToastManager();
  const [sources, setSources] = useState({});
  const [wins, setWins] = useState(report.wins);
  const [adding, setAdding] = useState(false);
  const p = report.profile;

  if (!ready) {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<BuildingsIcon size={40} className="text-kumo-inactive" />}
        title="No profile yet"
        description="The profile fills in once the capture reads the site."
      />
    );
  }

  return (
    <>
      <PanelIntro title={p.name}>
        {report.url} · captured {report.capturedAt}
      </PanelIntro>

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

      <PanelSection title="Compared against">
        <span className="flex flex-wrap gap-1.5">
          {p.competitors.map((c) => (
            <Badge key={c} variant="outline">{c}</Badge>
          ))}
        </span>
      </PanelSection>

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

      <PanelSection
        title="Recent wins"
        action={
          <Button size="xs" variant="ghost" icon={<PlusIcon size={12} />} onClick={() => setAdding(true)}>
            Add win
          </Button>
        }
      >
        <ul className="flex flex-col gap-2">
          {wins.map((w, i) => (
            <li key={`${w.name}-${i}`} className="flex items-center gap-3 rounded-lg bg-kumo-elevated px-3 py-2.5 ring-1 ring-kumo-hairline">
              <TrophyIcon size={16} className="shrink-0 text-kumo-subtle" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-kumo-strong">{w.name}</span>
                <span className="block text-xs text-kumo-subtle">{w.metric}</span>
              </span>
              <span className="font-display text-lg text-ok">{w.result}</span>
            </li>
          ))}
        </ul>
      </PanelSection>

      <AddWinDialog
        open={adding}
        onOpenChange={setAdding}
        onSave={(win) => {
          setWins((w) => [win, ...w]);
          setAdding(false);
          toasts.add({ title: "Win saved to memory", variant: "success" });
        }}
      />
    </>
  );
}
