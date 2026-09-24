"use client";

/* eslint-disable @next/next/no-img-element -- static reference image */

import { useState } from "react";
import { Badge, Button, Dialog, Empty, Input, Loader, Tabs, useKumoToastManager } from "@cloudflare/kumo";
import { BooksIcon, FlaskIcon, PencilSimpleIcon, PlusIcon, RocketLaunchIcon, TrophyIcon, XIcon } from "@phosphor-icons/react";
import { IDEA_STATUS, PanelSection } from "../ui";
import RunLengthCalculator from "../RunLengthCalculator";
import { DraftGridGate, SingleDraftGate } from "../prototype/gate";

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

/* Step 3 of the workflow: the top roadmap card becomes a test. Grounded in the
   experiment library, sized with the run-length calculator, then launched;
   results go back into the library as wins. */
export default function SetupPanel({ report, run, ideas, onIdeasChange, onOpen }) {
  const toasts = useKumoToastManager();
  const [wins, setWins] = useState(report.wins);
  const [adding, setAdding] = useState(false);
  const card = report.ideas[0];
  const stage = run.stages.ideas;

  if (stage !== "done") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={stage === "running" ? <Loader size="lg" /> : <FlaskIcon size={40} className="text-kumo-inactive" />}
        title={stage === "running" ? "Drafting the test setup…" : "No test set up yet"}
        description="The top idea on the roadmap becomes a test with mockups and a run-length estimate."
      />
    );
  }

  function decide(status, title) {
    onIdeasChange((s) => ({ ...s, statuses: { ...s.statuses, [card.id]: status } }));
    toasts.add({ title, description: `${card.id} · ${card.title}`, variant: status === "launched" ? "success" : "default" });
  }

  const cardStatus = IDEA_STATUS[ideas.statuses[card.id]];

  return (
    <>
      <section id={`idea-${card.id}`} className="border-b border-kumo-hairline">
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-kumo-subtle">{card.id}</span>
            <Badge variant={cardStatus.variant}>{cardStatus.label}</Badge>
            <span className="ml-auto text-xs text-kumo-subtle">Score {card.score}</span>
          </div>
          <h2 className="mt-2 font-display text-[28px] leading-[1.1] text-kumo-strong">{card.title}</h2>
          <p className="mt-2 text-sm text-kumo-subtle">From {card.from} · top of the roadmap.</p>
        </div>

        <PanelSection title="Hypothesis" className="border-b-0">
          <dl className="divide-y divide-kumo-hairline">
            <Term label="User state">{card.userState}</Term>
            <Term label="The change">{card.change}</Term>
            <Term label="Rationale">{card.rationale}</Term>
          </dl>
        </PanelSection>

        <PanelSection title="From the experiment library" className="border-b-0">
          <p className="mb-3 flex items-start gap-2 text-sm text-kumo-default">
            <BooksIcon size={16} className="mt-0.5 shrink-0 text-kumo-subtle" />
            <span>
              {report.library.matched} of {report.library.experiments} past experiments match this user state. The
              closest one shapes the test and the prototype.
            </span>
          </p>
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
              Open the prototype
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
          <Button variant="primary" icon={<RocketLaunchIcon size={14} />} onClick={() => decide("launched", "Test approved and launched")}>
            Approve &amp; launch
          </Button>
          <Button variant="secondary" icon={<PencilSimpleIcon size={14} />} onClick={() => decide("revising", "Sent back for revision")}>
            Revise
          </Button>
          <Button variant="ghost" icon={<XIcon size={14} />} onClick={() => decide("passed", "Card passed")}>
            Pass
          </Button>
        </div>
      </section>

      <PanelSection
        title="Recent wins"
        action={
          <Button size="xs" variant="ghost" icon={<PlusIcon size={12} />} onClick={() => setAdding(true)}>
            Add win
          </Button>
        }
      >
        <p className="mb-3 text-sm text-kumo-subtle">Results go back into the library and inform the next hypothesis.</p>
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
