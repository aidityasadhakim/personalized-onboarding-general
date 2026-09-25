"use client";

import { Badge, Button, Empty, Loader, cn, useKumoToastManager } from "@cloudflare/kumo";
import { CheckCircleIcon, EyeIcon, ListNumbersIcon, RocketLaunchIcon, SparkleIcon } from "@phosphor-icons/react";
import { IDEA_STATUS } from "../ui";
import { DraftGridGate, MOCKS, MessageGate, SingleDraftGate, kindLabel } from "../prototype/gate";

function HelenaRow({ children }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6f8cff] to-[#1f6feb] text-[11px] font-semibold text-white">
        H
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-[#1d1a33]">Helena</p>
        <div className="mt-0.5 text-[13px] leading-relaxed text-[#3d3a4d]">{children}</div>
      </div>
    </div>
  );
}

/* One mockup as it would appear in Helena's workspace: the first output stays
   whole, then the gate in its A, B, or C form. */
function MockScreen({ id, drafts }) {
  return (
    <div className="flex flex-col gap-3 bg-[#f7f6fc] p-4">
      <div className="rounded-xl border border-[#e6e3f0] bg-white p-3.5">
        <p className="text-[13px] font-semibold text-[#1d1a33]">Launch email · Enrich Labs</p>
        <p className="mt-1 text-[12.5px] text-[#55516a]">Subject: Helena already started</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#55516a]">
          While you were signing up, Helena read your site and drafted your first week.
        </p>
      </div>
      {id === "A" && (
        <HelenaRow>
          Your {kindLabel(drafts[0].kind)} is drafted too:
          <div className="mt-2">
            <SingleDraftGate draft={drafts[0]} interactive={false} />
          </div>
        </HelenaRow>
      )}
      {id === "B" && (
        <HelenaRow>
          While you read, I drafted {drafts.length} more:
          <div className="mt-2">
            <DraftGridGate drafts={drafts} interactive={false} />
          </div>
        </HelenaRow>
      )}
      {id === "C" && (
        <HelenaRow>
          <MessageGate draft={drafts[0]} interactive={false} />
        </HelenaRow>
      )}
    </div>
  );
}

/* Test › Mockups: the variants the expert sent back for the card, shown big.
   The PM picks one; Preview plays it as a clickable first run. */
export default function MockupsPanel({ report, run, ideas, onIdeasChange, mock, onMockChange, onOpen }) {
  const toasts = useKumoToastManager();
  const card = report.ideas[0];
  const state = ideas.mockups[card.id];
  const launched = ideas.statuses[card.id] === "launched";

  if (run.stages.ideas !== "done" || state !== "ready") {
    const generating = state === "generating";
    return (
      <Empty
        className="mx-auto mt-24 max-w-sm border-0 bg-transparent"
        icon={generating ? <Loader size="lg" /> : <SparkleIcon size={40} className="text-kumo-inactive" />}
        title={generating ? `A growth expert is drafting ${card.id}…` : "No mockups yet"}
        description={
          generating
            ? "Three mockups land here when they're done. You can keep working in the meantime."
            : "Put an issue on the roadmap, then generate mockups. A growth expert drafts the variants to test."
        }
        contents={
          !generating && run.stages.ideas === "done" ? (
            <Button variant="primary" icon={<ListNumbersIcon size={14} />} onClick={() => onOpen("ideas")}>
              Go to the roadmap
            </Button>
          ) : null
        }
      />
    );
  }

  function launch() {
    onIdeasChange((s) => ({ ...s, statuses: { ...s.statuses, [card.id]: "launched" } }));
    toasts.add({ title: `Test launched with Mock ${mock}`, description: `${card.id} · ${card.title}`, variant: "success" });
  }

  const status = IDEA_STATUS[ideas.statuses[card.id]];

  return (
    <>
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-kumo-subtle">{card.id}</span>
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="ml-auto text-xs text-kumo-subtle">Score {card.score}</span>
        </div>
        <h2 className="mt-2 font-display text-[28px] leading-[1.1] text-kumo-strong">{card.title}</h2>
        <p className="mt-2 text-sm text-kumo-subtle">
          Three mockups from your growth expert, for {card.from}. Pick the one to test.
        </p>
      </div>

      <div className="@container px-5 pb-5">
        <div role="radiogroup" aria-label="Mockups" className="grid gap-5 @2xl:grid-cols-2 @5xl:grid-cols-3">
          {MOCKS.map((m) => {
            const on = mock === m.id;
            return (
              <figure key={m.id} className="flex flex-col">
                {/* A div, not a button: the mock holds the gate's own (inert) button. */}
                <div
                  role="radio"
                  aria-checked={on}
                  aria-disabled={launched}
                  aria-label={`Mock ${m.id}: ${m.name}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => !launched && onMockChange(m.id)}
                  onKeyDown={(e) => {
                    if (launched) return;
                    const i = MOCKS.findIndex((x) => x.id === m.id);
                    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                    if (step) {
                      e.preventDefault();
                      onMockChange(MOCKS[(i + step + MOCKS.length) % MOCKS.length].id);
                    } else if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      onMockChange(m.id);
                    }
                  }}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded-2xl bg-kumo-base text-left ring-1 transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-kumo-strong",
                    on ? "ring-2 ring-kumo-contrast shadow-[0_8px_28px_-10px_rgb(40_30_20/0.35)]" : "ring-kumo-line hover:ring-kumo-strong/40",
                    launched && "cursor-default",
                  )}
                >
                  <span className="flex h-8 items-center gap-1.5 border-b border-kumo-hairline bg-kumo-elevated px-3">
                    <span className="size-2 rounded-full bg-kumo-line" />
                    <span className="size-2 rounded-full bg-kumo-line" />
                    <span className="size-2 rounded-full bg-kumo-line" />
                    <span className="ml-2 text-xs font-medium text-kumo-strong">Mock {m.id}</span>
                    {m.recommended && (
                      <Badge variant="success" className="ml-auto">Recommended</Badge>
                    )}
                  </span>
                  <MockScreen id={m.id} drafts={report.firstRun.drafts} />
                  {on && (
                    <CheckCircleIcon size={26} weight="fill" className="absolute right-3 bottom-3 rounded-full bg-white text-kumo-contrast" />
                  )}
                </div>
                <figcaption className="mt-2.5 px-1 text-sm text-kumo-default">
                  <span className="font-medium text-kumo-strong">Mock {m.id} · {m.name}.</span> {m.caption}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-kumo-hairline bg-kumo-base/95 px-5 py-3 backdrop-blur">
        <span className="mr-auto text-sm text-kumo-subtle">
          {launched ? (
            <>Launched with <span className="font-medium text-kumo-strong">Mock {mock}</span></>
          ) : (
            <><span className="font-medium text-kumo-strong">Mock {mock}</span> selected</>
          )}
        </span>
        <Button variant="secondary" icon={<EyeIcon size={14} />} onClick={() => onOpen("onboarding")}>
          Preview Mock {mock}
        </Button>
        {!launched && (
          <Button variant="primary" icon={<RocketLaunchIcon size={14} />} onClick={launch}>
            Launch test
          </Button>
        )}
      </div>
    </>
  );
}
