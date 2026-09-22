"use client";

/* eslint-disable @next/next/no-img-element -- static reference image */

import { useState } from "react";
import { Badge, Button, Empty, Loader, Tabs, useKumoToastManager } from "@cloudflare/kumo";
import { CheckIcon, LightbulbIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { PanelIntro, PanelSection } from "../ui";
import RunLengthCalculator from "../RunLengthCalculator";
import { DraftGridGate, SingleDraftGate } from "../prototype/gate";

const STATUS = {
  shipped: { label: "Shipped", variant: "success" },
  review: { label: "In review", variant: "warning" },
  drafted: { label: "Drafted", variant: "neutral" },
  approved: { label: "Approved", variant: "success" },
  revising: { label: "Revising", variant: "info" },
  passed: { label: "Passed", variant: "neutral" },
};

function Term({ label, children }) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs font-medium text-kumo-subtle">{label}</dt>
      <dd className="text-sm leading-relaxed text-kumo-default">{children}</dd>
    </div>
  );
}

function Mockups({ drafts }) {
  const [mock, setMock] = useState("B");
  return (
    <div className="flex flex-col gap-3">
      <Tabs
        variant="segmented"
        size="sm"
        value={mock}
        onValueChange={setMock}
        tabs={[
          { value: "A", label: "Mock A" },
          { value: "B", label: "Mock B" },
        ]}
      />
      <div className="rounded-xl bg-[#f7f6fc] p-4 ring-1 ring-kumo-hairline">
        <div className="mb-3 rounded-xl border border-[#e6e3f0] bg-white p-3.5">
          <p className="text-[13px] font-semibold text-[#1d1a33]">Launch email · Enrich Labs</p>
          <p className="mt-1 text-[12.5px] text-[#55516a]">Subject: Helena already started. The first output stays whole.</p>
        </div>
        {mock === "A" ? (
          <SingleDraftGate draft={drafts[0]} interactive={false} />
        ) : (
          <DraftGridGate drafts={drafts} interactive={false} />
        )}
      </div>
      <p className="text-xs text-kumo-subtle">
        {mock === "A"
          ? "Mock A · The first artifact stays whole; the next one is gated below its first line."
          : "Mock B · A counted draft grid proves quantity; one reveal opens all four."}
      </p>
    </div>
  );
}

export default function IdeasPanel({ report, run, onOpen }) {
  const toasts = useKumoToastManager();
  const [statuses, setStatuses] = useState(() => Object.fromEntries(report.ideas.map((i) => [i.id, i.status])));
  const card = report.ideas[0];
  const stage = run.stages.ideas;

  if (stage !== "done") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={stage === "running" ? <Loader size="lg" /> : <LightbulbIcon size={40} className="text-kumo-inactive" />}
        title={stage === "running" ? "Drafting idea cards…" : "No idea cards yet"}
        description="Each issue becomes a shippable test with mockups and a run-length estimate."
      />
    );
  }

  function decide(status, title) {
    setStatuses((s) => ({ ...s, [card.id]: status }));
    toasts.add({ title, description: `${card.id} · ${card.title}`, variant: status === "approved" ? "success" : "default" });
  }

  const cardStatus = STATUS[statuses[card.id]];

  return (
    <>
      <PanelIntro title="Idea cards">Issues turned into tests you can ship this week.</PanelIntro>

      <PanelSection title="Feed">
        <ul className="flex flex-col divide-y divide-kumo-hairline">
          {report.ideas.map((idea) => {
            const s = STATUS[statuses[idea.id]];
            return (
              <li key={idea.id} className="flex items-center gap-3 py-2.5">
                <span className="w-12 shrink-0 font-mono text-xs text-kumo-subtle">{idea.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-kumo-strong">{idea.title}</span>
                  <span className="block text-xs text-kumo-subtle">From {idea.from}</span>
                </span>
                <Badge variant={s.variant}>{s.label}</Badge>
              </li>
            );
          })}
        </ul>
      </PanelSection>

      <section id={`idea-${card.id}`} className="border-b border-kumo-hairline">
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-kumo-subtle">{card.id}</span>
            <Badge variant={cardStatus.variant}>{cardStatus.label}</Badge>
            <span className="ml-auto text-xs text-kumo-subtle">Score {card.score}</span>
          </div>
          <h3 className="mt-2 font-display text-[26px] leading-tight text-kumo-strong">{card.title}</h3>
        </div>

        <PanelSection title="Hypothesis" className="border-b-0">
          <dl className="divide-y divide-kumo-hairline">
            <Term label="User state">{card.userState}</Term>
            <Term label="The change">{card.change}</Term>
            <Term label="Rationale">{card.rationale}</Term>
          </dl>
        </PanelSection>

        <PanelSection title="Reference" className="border-b-0">
          <img src={card.reference.image} alt="Tinder and OpenArt gated reveals" className="w-full rounded-xl ring-1 ring-kumo-hairline" />
          <p className="mt-2.5 text-sm text-kumo-default">
            <span className="font-medium">{card.reference.name}.</span> {card.reference.driver}
          </p>
        </PanelSection>

        <PanelSection
          title="Mockups"
          className="border-b-0"
          action={
            <Button size="xs" variant="ghost" onClick={() => onOpen("onboarding")}>
              Try it in the prototype
            </Button>
          }
        >
          <Mockups drafts={report.firstRun.drafts} />
        </PanelSection>

        <PanelSection title="Measurement" className="border-b-0">
          <dl className="mb-5 divide-y divide-kumo-hairline">
            <Term label="Primary metric">{card.metric}</Term>
            <Term label="Guardrail">{card.guardrail}</Term>
          </dl>
          <RunLengthCalculator />
        </PanelSection>

        <div className="flex flex-wrap gap-2 px-5 pt-2 pb-6">
          <Button variant="primary" icon={<CheckIcon size={14} />} onClick={() => decide("approved", "Card approved")}>
            Approve
          </Button>
          <Button variant="secondary" icon={<PencilSimpleIcon size={14} />} onClick={() => decide("revising", "Sent back for revision")}>
            Revise
          </Button>
          <Button variant="ghost" icon={<XIcon size={14} />} onClick={() => decide("passed", "Card passed")}>
            Pass
          </Button>
        </div>
      </section>
    </>
  );
}
