"use client";

import { Button, Empty, Loader, useKumoToastManager } from "@cloudflare/kumo";
import { ArrowsOutSimpleIcon, LinkSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { PanelIntro } from "../ui";
import HelenaPrototype from "../prototype/HelenaPrototype";

export default function OnboardingPanel({ report, run }) {
  const toasts = useKumoToastManager();
  const stage = run.stages.onboarding;
  const shareUrl = `/teardown/${report.slug}/prototype`;

  if (stage !== "done") {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={stage === "running" ? <Loader size="lg" /> : <SparkleIcon size={40} className="text-kumo-inactive" />}
        title={stage === "running" ? "Building the first run…" : "No prototype yet"}
        description="The last step turns the analysis into a clickable, personalized onboarding."
      />
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(new URL(shareUrl, window.location.origin).toString());
      toasts.add({ title: "Link copied", description: "Anyone with the link can click through the prototype.", variant: "success" });
    } catch {
      toasts.add({ title: "Couldn't copy the link", description: shareUrl, variant: "error" });
    }
  }

  return (
    <>
      <PanelIntro title={<>A first run built for <em>{report.profile.name}</em></>}>
        Gather the need, deliver one real win, then ask. Pick an intent and click through. Generated from{" "}
        {report.library.matched} matched experiments in the library.
      </PanelIntro>
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <Button
          size="sm"
          variant="secondary"
          icon={<ArrowsOutSimpleIcon size={14} />}
          onClick={() => window.open(shareUrl, "_blank", "noopener")}
        >
          Full screen
        </Button>
        <Button size="sm" variant="ghost" icon={<LinkSimpleIcon size={14} />} onClick={copyLink}>
          Copy share link
        </Button>
      </div>
      <div className="px-5 pb-8">
        <HelenaPrototype data={report.firstRun} url={report.url} />
      </div>
    </>
  );
}
