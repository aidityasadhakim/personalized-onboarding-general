"use client";

import { Badge, Button, Empty, Loader } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, LightbulbIcon } from "@phosphor-icons/react";
import { IDEA_STATUS, PanelIntro, PanelSection } from "../ui";

/* Step 2 of the workflow: issues become idea cards, and the PM's ranking of
   them is the roadmap. Cards with a full hypothesis can go straight to setup. */
export default function IdeasPanel({ report, run, ideas, onIdeasChange, onOpen }) {
  const stage = run.stages.ideas;

  if (stage !== "done") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={stage === "running" ? <Loader size="lg" /> : <LightbulbIcon size={40} className="text-kumo-inactive" />}
        title={stage === "running" ? "Drafting idea cards…" : "No idea cards yet"}
        description="Each issue becomes a shippable test you can rank into a roadmap."
      />
    );
  }

  const byId = Object.fromEntries(report.ideas.map((i) => [i.id, i]));

  function move(index, by) {
    onIdeasChange((s) => {
      const order = [...s.order];
      [order[index], order[index + by]] = [order[index + by], order[index]];
      return { ...s, order };
    });
  }

  return (
    <>
      <PanelIntro title="Roadmap">
        {report.ideas.length} idea cards from the issues. Rank them; the order is the roadmap, and the top card gets set up
        first.
      </PanelIntro>

      <PanelSection title="Idea cards">
        <ol className="flex flex-col divide-y divide-kumo-hairline">
          {ideas.order.map((id, i) => {
            const idea = byId[id];
            const s = IDEA_STATUS[ideas.statuses[id]];
            return (
              <li key={id} className="flex items-center gap-3 py-2.5">
                <span className="w-5 shrink-0 text-center font-display text-lg text-kumo-subtle">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-kumo-strong">{idea.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-kumo-subtle">
                    <span className="font-mono">{idea.id}</span> · From {idea.from}
                  </span>
                </span>
                <Badge variant={s.variant}>{s.label}</Badge>
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
              </li>
            );
          })}
        </ol>
      </PanelSection>

      <PanelSection>
        <Button variant="primary" icon={<ArrowRightIcon size={14} />} onClick={() => onOpen("setup")}>
          Set up {report.ideas[0].id}
        </Button>
        <p className="mt-2 text-xs text-kumo-subtle">
          {report.ideas[0].id} has a full hypothesis, mockups, and a run-length estimate in this demo.
        </p>
      </PanelSection>
    </>
  );
}
