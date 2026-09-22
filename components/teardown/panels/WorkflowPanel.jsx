"use client";

import { Badge, Button, Empty, Meter, cn } from "@cloudflare/kumo";
import { ArrowCounterClockwiseIcon, FlowArrowIcon } from "@phosphor-icons/react";
import { STAGES } from "@/lib/teardown/timeline";
import { PanelIntro, PanelSection, StageIcon } from "../ui";

const STAGE_TAB = { capture: "journey", analysis: "analysis", ideas: "ideas", onboarding: "onboarding" };

function stageCount(stage, report, run) {
  switch (stage) {
    case "capture":
      return `${run.captured.length} of ${report.journey.length} screens`;
    case "analysis":
      return run.stages.analysis === "done" ? `${report.issues.length} issues` : null;
    case "ideas":
      return run.stages.ideas === "done" ? `${report.ideas.length} cards` : null;
    case "onboarding":
      return run.stages.onboarding === "done" ? "Prototype" : null;
    default:
      return null;
  }
}

export default function WorkflowPanel({ report, run, onOpen, onRestart }) {
  if (run.phase === "idle") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<FlowArrowIcon size={40} className="text-kumo-inactive" />}
        title="Waiting for a URL"
        description="Paste a site in the chat to start capture, analysis, idea cards, and the onboarding prototype."
      />
    );
  }

  const units = report.journey.length + STAGES.length - 1;
  const doneUnits = run.captured.length + STAGES.slice(1).filter((s) => run.stages[s.id] === "done").length;

  return (
    <>
      <PanelIntro title="Teardown workflow">
        {run.phase === "done" ? `Finished for ${report.url}.` : `Running on ${report.url}…`}
      </PanelIntro>

      <PanelSection>
        <Meter
          label={run.phase === "done" ? "Complete" : "Progress"}
          value={doneUnits}
          max={units}
          indicatorClassName="bg-kumo-contrast"
        />
      </PanelSection>

      <PanelSection title="Stages">
        <ol className="flex flex-col">
          {STAGES.map((s, i) => {
            const status = run.stages[s.id];
            const count = stageCount(s.id, report, run);
            const clickable = status === "done";
            return (
              <li key={s.id} className="relative">
                {i < STAGES.length - 1 && (
                  <span className="absolute top-8 bottom-0 left-[9.5px] w-px bg-kumo-hairline" aria-hidden="true" />
                )}
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => onOpen(STAGE_TAB[s.id])}
                  className={cn(
                    "relative flex w-full items-start gap-3 rounded-lg py-2.5 pr-2 text-left",
                    clickable && "hover:bg-kumo-tint",
                  )}
                >
                  <StageIcon status={status} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", status === "pending" ? "text-kumo-subtle" : "text-kumo-strong")}>
                      {i + 1}. {s.title}
                    </span>
                    <span className="block text-xs text-kumo-subtle">{s.detail}</span>
                  </span>
                  {count && <Badge variant={status === "done" ? "neutral" : "outline"}>{count}</Badge>}
                </button>
              </li>
            );
          })}
        </ol>
      </PanelSection>

      <PanelSection title="Run log">
        {run.log.length === 0 ? (
          <p className="text-sm text-kumo-subtle">Starting…</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {run.log.map((l, i) => (
              <li key={i} className="rise-in flex gap-3 text-[13px]">
                <span className="w-10 shrink-0 font-mono text-xs leading-5 text-kumo-subtle">{l.time}</span>
                <span className="text-kumo-default">{l.text}</span>
              </li>
            ))}
          </ol>
        )}
      </PanelSection>

      {run.phase === "done" && (
        <PanelSection>
          <Button variant="secondary" size="sm" icon={<ArrowCounterClockwiseIcon size={14} />} onClick={onRestart}>
            New teardown
          </Button>
        </PanelSection>
      )}
    </>
  );
}
