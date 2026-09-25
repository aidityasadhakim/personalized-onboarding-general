"use client";

import { useEffect, useRef } from "react";
import { Badge, Button, Empty, Loader, useKumoToastManager } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, ChartLineUpIcon, LightbulbIcon, SparkleIcon, UserCircleIcon } from "@phosphor-icons/react";
import { IDEA_STATUS, PanelIntro, PanelSection } from "../ui";
import { hasMockups } from "@/lib/teardown/roadmap";

const EXPERT_MS = 4200;

/* What a card's mockups are doing: nothing yet, with the expert, or ready. */
function MockupAction({ idea, state, onGenerate, onOpen }) {
  if (state === "generating") {
    return (
      <Badge variant="warning" className="gap-1.5">
        <Loader size="sm" /> Expert drafting mockups…
      </Badge>
    );
  }
  if (state === "queued") return <Badge variant="neutral">With the expert · back in 24h</Badge>;
  if (state === "ready") {
    return (
      <Button size="xs" variant="primary" icon={<ArrowRightIcon size={12} />} onClick={() => onOpen("setup", idea.id)}>
        Open mockups
      </Button>
    );
  }
  return (
    <Button size="xs" variant="secondary" icon={<SparkleIcon size={12} />} onClick={() => onGenerate(idea)}>
      Generate mockups
    </Button>
  );
}

/* The roadmap: issues the PM added, ranked by hand. Generating mockups hands
   a card to a growth expert, who drafts the variants to test. */
export default function IdeasPanel({ report, run, ideas, onIdeasChange, onOpen }) {
  const toasts = useKumoToastManager();
  const timers = useRef([]);
  const stage = run.stages.ideas;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (stage !== "done") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={stage === "running" ? <Loader size="lg" /> : <LightbulbIcon size={40} className="text-kumo-inactive" />}
        title={stage === "running" ? "Drafting idea cards…" : "No roadmap yet"}
        description="Add issues to the roadmap, rank them, then generate mockups to test."
      />
    );
  }

  const byId = Object.fromEntries(report.ideas.map((i) => [i.id, i]));
  const setMockups = (id, state) => onIdeasChange((s) => ({ ...s, mockups: { ...s.mockups, [id]: state } }));

  function move(index, by) {
    onIdeasChange((s) => {
      const order = [...s.order];
      [order[index], order[index + by]] = [order[index + by], order[index]];
      return { ...s, order };
    });
  }

  function generate(idea) {
    setMockups(idea.id, "generating");
    toasts.add({ title: "Sent to a growth expert", description: `${idea.id} · drafting mockups to test` });
    timers.current.push(
      setTimeout(() => {
        const ready = hasMockups(idea.id);
        setMockups(idea.id, ready ? "ready" : "queued");
        if (ready) toasts.add({ title: "Mockups ready", description: `${idea.id} · 3 mockups under Test › Mockups`, variant: "success" });
      }, EXPERT_MS),
    );
  }

  return (
    <>
      <PanelIntro title="Roadmap">
        The issues you added, in the order you&apos;ll test them. Generate mockups and a growth expert drafts the
        variants for you to choose from.
      </PanelIntro>

      <PanelSection title={`On the roadmap · ${ideas.order.length}`}>
        <ol className="flex flex-col divide-y divide-kumo-hairline">
          {ideas.order.map((id, i) => {
            const idea = byId[id];
            const status = ideas.statuses[id];
            const s = IDEA_STATUS[status];
            return (
              <li key={id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <span className="w-5 shrink-0 text-center font-display text-lg text-kumo-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1 basis-48">
                  <span className="block text-sm text-kumo-strong">{idea.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-kumo-subtle">
                    <span className="font-mono">{idea.id}</span> · From {idea.from}
                    {idea.score && <> · score {idea.score}</>}
                  </span>
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {status === "planned" ? (
                    <MockupAction idea={idea} state={ideas.mockups[id]} onGenerate={generate} onOpen={onOpen} />
                  ) : (
                    <Badge variant={s.variant}>{s.label}</Badge>
                  )}
                  <span className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="xs"
                      shape="square"
                      icon={<ArrowUpIcon size={12} />}
                      aria-label={`Move ${idea.id} up`}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      shape="square"
                      icon={<ArrowDownIcon size={12} />}
                      aria-label={`Move ${idea.id} down`}
                      disabled={i === ideas.order.length - 1}
                      onClick={() => move(i, 1)}
                    />
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
        {ideas.order.length < report.ideas.length && (
          <Button className="mt-3" size="xs" variant="ghost" icon={<ChartLineUpIcon size={12} />} onClick={() => onOpen("analysis")}>
            Add more from Issues
          </Button>
        )}
      </PanelSection>

      <PanelSection>
        <div className="flex gap-3 rounded-xl bg-kumo-elevated p-4 ring-1 ring-kumo-hairline">
          <UserCircleIcon size={22} className="shrink-0 text-kumo-subtle" />
          <p className="text-sm leading-relaxed text-kumo-subtle">
            <span className="font-medium text-kumo-strong">A growth expert drafts every mockup.</span> They start from
            the card, the captured screens, and {report.library.matched} matching tests from a library of{" "}
            {report.library.experiments}, then send back three variants to choose from.
          </p>
        </div>
      </PanelSection>
    </>
  );
}
