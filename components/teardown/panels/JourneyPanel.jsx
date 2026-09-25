"use client";

/* eslint-disable @next/next/no-img-element -- static capture screenshots */

import { useState } from "react";
import { Button, Dialog, Empty, Loader, cn } from "@cloudflare/kumo";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ArrowsOutSimpleIcon,
  CameraIcon,
  CaretRightIcon,
  ChatCircleIcon,
  CurrencyDollarIcon,
  LightbulbIcon,
  XIcon,
} from "@phosphor-icons/react";
import { PanelIntro, RoadmapButton } from "../ui";

const dotLabel = (issue) => String(Number(issue.n));

/* One numbered red dot, pinned where the issue shows on the screen. Hover
   highlights its callout; a click opens the issue itself. */
function Dot({ issue, active, onSelect, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen("analysis", issue.id)}
      onMouseEnter={() => onSelect(issue.id)}
      aria-label={`Issue ${issue.n}: ${issue.title}. Open in Issues`}
      className="absolute z-10 -translate-1/2"
      style={{ left: `${issue.spot.x}%`, top: `${issue.spot.y}%` }}
    >
      <span className={cn("absolute inset-0 rounded-full bg-ember/60", active ? "animate-ping" : "animate-[ping_2.4s_ease-out_infinite]")} />
      <span
        className={cn(
          "relative flex size-7 items-center justify-center rounded-full bg-ember text-xs font-semibold text-white shadow-[0_2px_10px_rgb(200_85_43/0.55)] ring-2 ring-white transition-transform",
          active && "scale-125",
        )}
      >
        {dotLabel(issue)}
      </span>
    </button>
  );
}

/* The captured screen with its issues marked on it. */
function Screen({ step, issues, active, onSelect, onOpen, onZoom, large }) {
  if (!step.image) {
    return (
      <div className="flex aspect-[322/200] w-full flex-col items-center justify-center gap-2 rounded-xl bg-kumo-elevated ring-1 ring-kumo-hairline">
        <CurrencyDollarIcon size={26} className="text-kumo-subtle" />
        <span className="text-sm text-kumo-subtle">Read from the pricing page</span>
      </div>
    );
  }
  return (
    <div className="relative">
      <img
        src={step.image}
        alt={`${step.title} capture`}
        className={cn("aspect-[322/200] w-full rounded-xl object-cover ring-1 ring-kumo-line", !large && "cursor-zoom-in")}
        onClick={onZoom}
      />
      {issues.map((issue) => (
        <Dot key={issue.id} issue={issue} active={active === issue.id} onSelect={onSelect} onOpen={onOpen} />
      ))}
      {onZoom && (
        <Button
          variant="secondary"
          size="xs"
          shape="square"
          icon={<ArrowsOutSimpleIcon size={13} />}
          aria-label="Enlarge"
          onClick={onZoom}
          className="absolute right-2.5 bottom-2.5 opacity-80 hover:opacity-100"
        />
      )}
    </div>
  );
}

function Callout({ issue, active, onSelect, children }) {
  return (
    <li
      id={`callout-${issue.id}`}
      onMouseEnter={() => onSelect(issue.id)}
      className={cn(
        "scroll-mt-4 rounded-xl p-4 ring-1 transition-shadow",
        active ? "bg-kumo-base ring-ember/60 shadow-[0_4px_18px_-6px_rgb(200_85_43/0.35)]" : "ring-kumo-hairline",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ember text-[11px] font-semibold text-white">
          {dotLabel(issue)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-kumo-strong">{issue.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-kumo-subtle">{issue.body}</p>
          <p className="mt-2.5 flex gap-2 rounded-lg bg-ok-tint px-3 py-2 text-sm text-ok">
            <LightbulbIcon size={15} weight="fill" className="mt-0.5 shrink-0" />
            <span>
              <span className="font-medium">Solution:</span> {issue.fix}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">{children}</div>
        </div>
      </div>
    </li>
  );
}

export default function JourneyPanel({ report, run, focus, onAsk, onOpen, ideas, onIdeasChange }) {
  const [picked, setPicked] = useState(null);
  const [active, setActive] = useState(null);
  const [zoom, setZoom] = useState(false);
  const analysed = run.stages.analysis === "done";
  const captured = report.journey.filter((s) => run.captured.includes(s.id));
  const next = report.journey.find((s) => !run.captured.includes(s.id));
  // Red dots appear once the analysis has found the issues.
  const issuesFor = (step) => (analysed ? (step.issues ?? []).map((id) => report.issues.find((i) => i.id === id)) : []);
  const issueCount = report.journey.reduce((n, s) => n + issuesFor(s).length, 0);

  // A step opened from the chat becomes the one on screen.
  const [seenFocus, setSeenFocus] = useState(null);
  if (focus !== seenFocus) {
    setSeenFocus(focus);
    if (focus) setPicked(focus);
  }

  // Until someone picks a step: the latest capture while running, then the
  // first screen with issues.
  const step =
    captured.find((s) => s.id === picked) ??
    (analysed ? captured.find((s) => issuesFor(s).length) : captured.at(-1)) ??
    captured[0];
  const issues = step ? issuesFor(step) : [];

  if (run.phase === "idle" || !step) {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<CameraIcon size={40} className="text-kumo-inactive" />}
        title="Nothing captured yet"
        description="Screens appear here as the capture signs up and moves through the product."
      />
    );
  }

  function pick(id) {
    setPicked(id);
    setActive(null);
  }

  return (
    <>
      <PanelIntro title="User journey">
        {captured.length} of {report.journey.length} steps captured, from the landing page to pricing.
        {analysed && ` ${issueCount} issues are marked on the screens where they happen.`}
      </PanelIntro>

      {/* The path through the product; each step opens its screen below. */}
      <nav aria-label="Journey steps" className="px-5">
        <ol className="flex items-start gap-1 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {captured.map((s, i) => {
            const count = issuesFor(s).length;
            const on = s.id === step.id;
            return (
              <li key={s.id} className="flex shrink-0 items-center gap-1">
                {i > 0 && <CaretRightIcon size={12} className="mb-5 text-kumo-inactive" aria-hidden="true" />}
                <button
                  type="button"
                  onClick={() => pick(s.id)}
                  aria-current={on ? "step" : undefined}
                  className="group w-28 text-left"
                >
                  <span
                    className={cn(
                      "relative block overflow-hidden rounded-lg ring-1",
                      on ? "ring-2 ring-kumo-contrast" : "ring-kumo-hairline group-hover:ring-kumo-line",
                    )}
                  >
                    {s.image ? (
                      <img src={s.image} alt="" className="aspect-[322/200] w-full object-cover" />
                    ) : (
                      <span className="flex aspect-[322/200] w-full items-center justify-center bg-kumo-elevated">
                        <CurrencyDollarIcon size={16} className="text-kumo-subtle" />
                      </span>
                    )}
                    {count > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className={cn("mt-1.5 block truncate text-xs", on ? "font-medium text-kumo-strong" : "text-kumo-subtle")}>
                    {s.step} · {s.title}
                  </span>
                </button>
              </li>
            );
          })}
          {next && run.phase === "running" && (
            <li className="flex shrink-0 items-center gap-1">
              <CaretRightIcon size={12} className="mb-5 text-kumo-inactive" aria-hidden="true" />
              <span className="w-28">
                <span className="flex aspect-[322/200] w-full items-center justify-center rounded-lg border border-dashed border-kumo-line">
                  <Loader size="sm" />
                </span>
                <span className="mt-1.5 block truncate text-xs text-kumo-subtle">Capturing…</span>
              </span>
            </li>
          )}
        </ol>
      </nav>

      <section className="@container px-5 pt-2 pb-8">
        <div className="grid gap-6 @4xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div key={step.id} className="rise-in">
            <Screen step={step} issues={issues} active={active} onSelect={setActive} onOpen={onOpen} onZoom={() => setZoom(true)} />
            <div className="mt-3 flex items-start gap-3">
              <span className="font-display text-xl leading-6 text-kumo-subtle">{step.step}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-kumo-strong">{step.title}</h3>
                <p className="mt-0.5 text-sm text-kumo-subtle">{step.summary}</p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                icon={<ChatCircleIcon size={13} />}
                onClick={() => onAsk(`What did the capture find on the ${step.title.toLowerCase()} screen?`)}
              >
                Ask
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-kumo-subtle">
              {issues.length ? `${issues.length} issues on this screen` : "On this screen"}
            </h3>
            {issues.length > 0 ? (
              <ul className="flex flex-col gap-2.5">
                {issues.map((issue) => (
                  <Callout key={issue.id} issue={issue} active={active === issue.id} onSelect={setActive}>
                    <RoadmapButton report={report} issue={issue} ideas={ideas} onIdeasChange={onIdeasChange} onOpen={onOpen} />
                    <Button size="xs" variant="ghost" onClick={() => onOpen("analysis", issue.id)}>
                      Open in Issues
                      <ArrowUpRightIcon size={12} />
                    </Button>
                  </Callout>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl p-4 text-sm text-kumo-subtle ring-1 ring-kumo-hairline">
                {analysed ? (
                  <>
                    No issues here.{" "}
                    {(() => {
                      const withIssues = captured.find((s) => issuesFor(s).length);
                      return withIssues ? (
                        <button type="button" onClick={() => pick(withIssues.id)} className="inline-flex items-center gap-1 text-kumo-strong underline-offset-2 hover:underline">
                          Go to {withIssues.title.toLowerCase()} <ArrowRightIcon size={12} />
                        </button>
                      ) : null;
                    })()}
                  </>
                ) : (
                  "Issues get marked on the screens once the analysis finishes."
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog.Root open={zoom} onOpenChange={setZoom}>
        <Dialog size="xl" className="p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <Dialog.Title className="font-display text-2xl text-kumo-strong">
              {step.step} · {step.title}
            </Dialog.Title>
            <Dialog.Close
              render={(p) => <Button {...p} variant="ghost" shape="square" size="sm" icon={<XIcon />} aria-label="Close" />}
            />
          </div>
          <Screen
            step={step}
            issues={issues}
            active={active}
            onSelect={setActive}
            onOpen={(tab, id) => {
              setZoom(false);
              onOpen(tab, id);
            }}
            large
          />
          <Dialog.Description className="mt-3 text-sm text-kumo-subtle">{step.summary}</Dialog.Description>
        </Dialog>
      </Dialog.Root>
    </>
  );
}
