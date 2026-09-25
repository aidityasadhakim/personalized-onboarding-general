"use client";

import { Button, cn, useKumoToastManager } from "@cloudflare/kumo";
import { CheckIcon, PlusIcon } from "@phosphor-icons/react";
import { withIdea } from "@/lib/teardown/roadmap";

/* Small shared pieces. Kumo supplies the controls; these keep panel rhythm
   and the editorial type consistent across the console. */

export function Mark({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-6 rounded-[7px] bg-[conic-gradient(from_210deg,#f3b58f,#f6dcb4,#bcd3e8,#e8b8a6,#f3b58f)] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]",
        className,
      )}
    />
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Mark />
      <span className="font-display text-[22px] leading-none text-kumo-strong">funnel os</span>
    </span>
  );
}

export function PanelSection({ title, action, children, className }) {
  return (
    <section className={cn("border-b border-kumo-hairline px-5 py-5 last:border-b-0", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-medium text-kumo-subtle">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PanelIntro({ title, children }) {
  return (
    <div className="px-5 pt-6 pb-5">
      <h2 className="font-display text-[28px] leading-[1.1] text-kumo-strong">{title}</h2>
      {children && <p className="mt-2 text-sm text-kumo-subtle">{children}</p>}
    </div>
  );
}

export function StageIcon({ status }) {
  if (status === "done") {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-kumo-contrast text-white">
        <CheckIcon size={11} weight="bold" />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="relative flex size-5 shrink-0 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-[1.5px] border-[#e4ddd3] border-t-[#16130f]" />
      </span>
    );
  }
  return <span className="size-5 shrink-0 rounded-full border-[1.5px] border-dashed border-kumo-line" />;
}

/* Idea card statuses, shared by the roadmap and the mockups. */
export const IDEA_STATUS = {
  planned: { label: "Planned", variant: "neutral" },
  shipped: { label: "Shipped", variant: "success" },
  launched: { label: "Launched", variant: "success" },
};

/* Puts an issue's idea card on the roadmap, or opens it once it's there.
   Shared by the journey and the issues list. */
export function RoadmapButton({ report, issue, ideas, onIdeasChange, onOpen, className }) {
  const toasts = useKumoToastManager();
  const idea = report.ideas.find((i) => i.id === issue.idea);
  if (!idea) return null;
  if (ideas.order.includes(idea.id)) {
    return (
      <Button size="xs" variant="ghost" className={className} icon={<CheckIcon size={12} />} onClick={() => onOpen("ideas", idea.id)}>
        On roadmap
      </Button>
    );
  }
  return (
    <Button
      size="xs"
      variant="secondary"
      className={className}
      icon={<PlusIcon size={12} />}
      onClick={() => {
        onIdeasChange((s) => withIdea(s, idea.id));
        toasts.add({ title: "Added to the roadmap", description: `${idea.id} · ${idea.title}`, variant: "success" });
      }}
    >
      Add to roadmap
    </Button>
  );
}

/* A browser-style frame for captured screens and prototypes. */
export function WindowFrame({ title, children, className, bodyClassName }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-kumo-base shadow-[0_1px_2px_rgb(40_30_20/0.06),0_12px_32px_-12px_rgb(40_30_20/0.18)] ring-1 ring-kumo-line",
        className,
      )}
    >
      <div className="relative flex h-9 items-center gap-1.5 border-b border-kumo-hairline bg-kumo-elevated px-3.5">
        <span className="size-2.5 rounded-full bg-[#ec8b82]" />
        <span className="size-2.5 rounded-full bg-[#f0c46a]" />
        <span className="size-2.5 rounded-full bg-[#8fcf8f]" />
        {title && (
          <span className="absolute inset-x-0 text-center text-xs text-kumo-subtle">{title}</span>
        )}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
