"use client";

/* eslint-disable @next/next/no-img-element -- static evidence screenshots */

import { useEffect, useState } from "react";
import { Badge, Button, Collapsible, Empty, LayerCard, Loader, Meter, Table } from "@cloudflare/kumo";
import { ChartLineUpIcon, ChatCircleIcon, LightbulbIcon, SealCheckIcon } from "@phosphor-icons/react";
import { PanelIntro, PanelSection, RoadmapButton } from "../ui";
import { toneClass } from "../chat/attachments";

function Upside({ upside }) {
  const scale = 25; // percent shown across the full track
  const pos = (v) => `${(v / scale) * 100}%`;
  return (
    <div>
      <p className="text-sm text-kumo-strong">
        North star: <span className="font-display text-base italic">{upside.northStar.toLowerCase()}</span>
      </p>
      <div className="relative mt-10 mb-8 h-1.5 rounded-full bg-kumo-recessed">
        <span
          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-ember via-[#e0a64a] to-ok"
          style={{ left: pos(upside.average), right: `calc(100% - ${pos(upside.top10)})` }}
        />
        {[
          { v: upside.average, label: "Average" },
          { v: upside.top10, label: "Top 10%" },
        ].map((m) => (
          <span key={m.label} className="absolute top-1/2 -translate-1/2" style={{ left: pos(m.v) }}>
            <span className="block h-4 w-0.5 rounded bg-kumo-strong" />
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-display text-xl text-kumo-strong">{m.v}%</span>
            <span className="absolute top-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-kumo-subtle">{m.label}</span>
          </span>
        ))}
        <span
          className="absolute top-1/2 flex size-5 -translate-1/2 items-center justify-center rounded-full border border-dashed border-ember bg-kumo-base text-[10px] text-ember"
          style={{ left: pos((upside.average + upside.top10) / 2) }}
          title="Enrich Labs: connect analytics to place"
        >
          ?
        </span>
      </div>
      <p className="text-xs leading-relaxed text-kumo-subtle">{upside.note}</p>
    </div>
  );
}

export default function AnalysisPanel({ report, run, focus, onAsk, onOpen, ideas, onIdeasChange }) {
  const status = run.stages.analysis;
  const [open, setOpen] = useState({ "issue-01": true });
  const [openedFor, setOpenedFor] = useState(null);

  // Jumping to an issue from the chat expands it (adjusting state during
  // render, the React-recommended alternative to an effect).
  if (focus && focus !== openedFor) {
    setOpenedFor(focus);
    setOpen((o) => ({ ...o, [focus]: true }));
  }

  useEffect(() => {
    if (!focus) return;
    const id = requestAnimationFrame(() =>
      document.getElementById(`analysis-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(id);
  }, [focus]);

  if (status !== "done") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={status === "running" ? <Loader size="lg" /> : <ChartLineUpIcon size={40} className="text-kumo-inactive" />}
        title={status === "running" ? "Analyzing the funnel…" : "No analysis yet"}
        description="Scores, issues, and the upside appear once the capture finishes."
      />
    );
  }

  return (
    <>
      <PanelIntro title={<>Opportunity: the timing of the <em>first win</em>, and where the paywall sits.</>}>
        {report.opportunity}
      </PanelIntro>

      <PanelSection title={`Issues · ${report.issues.length}`}>
        <div className="flex flex-col gap-2.5">
          {report.issues.map((issue) => (
            <div key={issue.id} id={`analysis-${issue.id}`} className="scroll-mt-4 rounded-xl ring-1 ring-kumo-hairline">
              <Collapsible.Root
                open={!!open[issue.id]}
                onOpenChange={(o) => setOpen((prev) => ({ ...prev, [issue.id]: o }))}
              >
                <Collapsible.Trigger className="flex w-full items-start gap-3 p-4 text-left">
                  <span className="font-display text-xl leading-6 text-ember">{issue.n}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-kumo-strong">{issue.title}</span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <Badge variant="neutral">{issue.stage}</Badge>
                      {ideas.order.includes(issue.idea) && <Badge variant="info">On roadmap</Badge>}
                      <span className="text-xs text-kumo-subtle">{issue.status}</span>
                    </span>
                  </span>
                </Collapsible.Trigger>
                <Collapsible.Panel className="px-4 pb-4">
                  <img src={issue.image} alt={`Evidence for issue ${issue.n}`} className="w-full rounded-lg ring-1 ring-kumo-hairline" />
                  <p className="mt-3 text-sm leading-relaxed text-kumo-default">{issue.body}</p>
                  <div className="mt-3 rounded-lg bg-ok-tint px-3.5 py-3 text-ok">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <LightbulbIcon size={15} weight="fill" /> Solution
                    </p>
                    <p className="mt-1 text-sm">{issue.fix}</p>
                    {issue.solution && (
                      <ol className="mt-2 flex flex-col gap-1 text-sm text-kumo-default">
                        {issue.solution.map((s, i) => (
                          <li key={s} className="flex gap-2">
                            <span className="w-3 shrink-0 font-display text-ok">{i + 1}</span>
                            {s}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <RoadmapButton report={report} issue={issue} ideas={ideas} onIdeasChange={onIdeasChange} onOpen={onOpen} />
                    <Button variant="ghost" size="xs" icon={<ChatCircleIcon size={13} />} onClick={() => onAsk(`Explain Issue ${issue.n}`)}>
                      Ask about this
                    </Button>
                  </div>
                </Collapsible.Panel>
              </Collapsible.Root>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="Funnel score">
        <div className="flex flex-col gap-5">
          {report.funnel.map((f) => (
            <div key={f.stage}>
              <Meter label={f.stage} value={f.score} customValue={f.lens} indicatorClassName={toneClass[f.tone]} />
              <p className="mt-1.5 text-xs leading-relaxed text-kumo-subtle">{f.note}</p>
            </div>
          ))}
        </div>
      </PanelSection>

      <PanelSection title="What's working">
        <div className="overflow-hidden rounded-xl ring-1 ring-kumo-hairline">
          <img src={report.strength.image} alt="Helena reading the site and saving profile files" className="w-full" />
          <div className="flex gap-2.5 p-4">
            <SealCheckIcon size={18} weight="fill" className="mt-0.5 shrink-0 text-ok" />
            <div>
              <p className="text-sm font-medium text-kumo-strong">{report.strength.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-kumo-subtle">{report.strength.body}</p>
            </div>
          </div>
        </div>
      </PanelSection>

      <PanelSection title="Upside">
        <Upside upside={report.upside} />
      </PanelSection>

      <PanelSection title="Against stronger activation paths">
        <LayerCard className="overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Decision</Table.Head>
                <Table.Head>{report.profile.name} today</Table.Head>
                <Table.Head>Path-success pattern</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {report.comparison.map((c) => (
                <Table.Row key={c.point}>
                  <Table.Cell className="align-top font-medium whitespace-nowrap">{c.point}</Table.Cell>
                  <Table.Cell className="min-w-44 align-top text-kumo-subtle">{c.today}</Table.Cell>
                  <Table.Cell className="min-w-44 align-top">{c.pattern}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PanelSection>

      <PanelSection title="Suggested sequence">
        <div className="flex flex-col gap-5">
          {report.roadmap.map((g) => (
            <div key={g.group}>
              <p className="mb-2 text-sm font-medium text-kumo-strong">{g.group}</p>
              <ol className="flex flex-col gap-2">
                {g.items.map((item, i) => (
                  <li key={item} className="flex gap-3 text-sm text-kumo-default">
                    <span className="w-4 shrink-0 font-display text-kumo-subtle">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </PanelSection>
    </>
  );
}
