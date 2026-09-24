"use client";

/* eslint-disable @next/next/no-img-element -- static capture screenshots */

import { useEffect, useState } from "react";
import { Button, Dialog, Empty, Loader, cn } from "@cloudflare/kumo";
import { CameraIcon, ChatCircleIcon, CurrencyDollarIcon, XIcon } from "@phosphor-icons/react";
import { PanelIntro, PanelSection } from "../ui";

export default function JourneyPanel({ report, run, focus, onAsk, onOpen }) {
  const [zoom, setZoom] = useState(null);
  // Red dots mark the steps where the analysis found an issue.
  const issuesFor = (step) =>
    run.stages.analysis === "done" ? (step.issues ?? []).map((id) => report.issues.find((i) => i.id === id)) : [];
  const captured = report.journey.filter((s) => run.captured.includes(s.id));
  const next = report.journey.find((s) => !run.captured.includes(s.id));

  useEffect(() => {
    if (!focus) return;
    // After the console resets its scroll for the view change.
    const id = requestAnimationFrame(() =>
      document.getElementById(`journey-${focus}`)?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(id);
  }, [focus]);

  if (run.phase === "idle") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<CameraIcon size={40} className="text-kumo-inactive" />}
        title="Nothing captured yet"
        description="Screens appear here as the capture signs up and moves through the product."
      />
    );
  }

  return (
    <>
      <PanelIntro title="User journey">
        {captured.length} of {report.journey.length} steps captured, from the landing page to pricing.
      </PanelIntro>

      <PanelSection className="@container">
        <div className="grid gap-6 @xl:grid-cols-2 @4xl:grid-cols-3">
        {captured.map((s) => {
          const issues = issuesFor(s);
          return (
          <article key={s.id} id={`journey-${s.id}`} className="rise-in relative scroll-mt-4">
            {issues.length > 0 && (
              <button
                type="button"
                onClick={() => onOpen("analysis", issues[0].id)}
                aria-label={`${issues.length} issues on ${s.title}: open in Issues`}
                className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-ember py-1 pr-2.5 pl-2 text-xs font-medium text-white shadow-[0_2px_8px_rgb(200_85_43/0.35)] hover:brightness-110"
              >
                <span className="relative flex size-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
                  <span className="relative size-2 rounded-full bg-white" />
                </span>
                {issues.length} {issues.length === 1 ? "issue" : "issues"}
              </button>
            )}
            {s.image ? (
              <button
                type="button"
                onClick={() => setZoom(s)}
                className="block w-full overflow-hidden rounded-xl ring-1 ring-kumo-hairline hover:ring-kumo-line"
                aria-label={`Enlarge the ${s.title} capture`}
              >
                <img src={s.image} alt={`${s.title} capture`} className="aspect-[322/200] w-full object-cover" />
              </button>
            ) : (
              <div className="flex aspect-[322/140] w-full flex-col items-center justify-center gap-2 rounded-xl bg-kumo-elevated ring-1 ring-kumo-hairline">
                <CurrencyDollarIcon size={22} className="text-kumo-subtle" />
                <span className="text-xs text-kumo-subtle">Read from the pricing page</span>
              </div>
            )}
            <div className="mt-3 flex items-start gap-3">
              <span className="font-display text-xl leading-6 text-kumo-subtle">{s.step}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-kumo-strong">{s.title}</h3>
                <p className="mt-0.5 text-sm text-kumo-subtle">{s.summary}</p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                icon={<ChatCircleIcon size={13} />}
                onClick={() => onAsk(`What did the capture find on the ${s.title.toLowerCase()} screen?`)}
              >
                Ask
              </Button>
            </div>
            {issues.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1 pl-8">
                {issues.map((issue) => (
                  <li key={issue.id}>
                    <button
                      type="button"
                      onClick={() => onOpen("analysis", issue.id)}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-kumo-tint"
                    >
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ember" aria-hidden="true" />
                      <span className="min-w-0 flex-1 text-kumo-default">
                        <span className="text-kumo-subtle">Issue {issue.n} · </span>
                        {issue.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
          );
        })}

        {next && run.phase === "running" && (
          <div className={cn("flex aspect-[322/120] items-center justify-center gap-2.5 rounded-xl border border-dashed border-kumo-line text-sm text-kumo-subtle")}>
            <Loader size="sm" /> Capturing {next.title.toLowerCase()}…
          </div>
        )}
        </div>
      </PanelSection>

      <Dialog.Root open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <Dialog size="xl" className="p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <Dialog.Title className="font-display text-2xl text-kumo-strong">
              {zoom ? `${zoom.step} · ${zoom.title}` : ""}
            </Dialog.Title>
            <Dialog.Close
              render={(p) => <Button {...p} variant="ghost" shape="square" size="sm" icon={<XIcon />} aria-label="Close" />}
            />
          </div>
          {zoom?.image && <img src={zoom.image} alt={`${zoom.title} capture`} className="w-full rounded-lg ring-1 ring-kumo-hairline" />}
          <Dialog.Description className="mt-3 text-sm text-kumo-subtle">{zoom?.summary}</Dialog.Description>
        </Dialog>
      </Dialog.Root>
    </>
  );
}
