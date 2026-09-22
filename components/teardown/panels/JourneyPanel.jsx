"use client";

/* eslint-disable @next/next/no-img-element -- static capture screenshots */

import { useEffect, useState } from "react";
import { Button, Dialog, Empty, Loader, cn } from "@cloudflare/kumo";
import { CameraIcon, ChatCircleIcon, CurrencyDollarIcon, XIcon } from "@phosphor-icons/react";
import { PanelIntro, PanelSection } from "../ui";

export default function JourneyPanel({ report, run, focus, onAsk }) {
  const [zoom, setZoom] = useState(null);
  const captured = report.journey.filter((s) => run.captured.includes(s.id));
  const next = report.journey.find((s) => !run.captured.includes(s.id));

  useEffect(() => {
    if (!focus) return;
    // After the sidebar resets its scroll for the tab change.
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

      <PanelSection className="grid gap-6 @container">
        {captured.map((s) => (
          <article key={s.id} id={`journey-${s.id}`} className="rise-in scroll-mt-4">
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
          </article>
        ))}

        {next && run.phase === "running" && (
          <div className={cn("flex aspect-[322/120] items-center justify-center gap-2.5 rounded-xl border border-dashed border-kumo-line text-sm text-kumo-subtle")}>
            <Loader size="sm" /> Capturing {next.title.toLowerCase()}…
          </div>
        )}
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
