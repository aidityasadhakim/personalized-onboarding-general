"use client";

/* eslint-disable @next/next/no-img-element -- static capture screenshots */

import { useState } from "react";
import { Badge, Button, Empty, Tabs, cn, useKumoToastManager } from "@cloudflare/kumo";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  FlagCheckeredIcon,
  ImageIcon,
  PlayIcon,
  TrendDownIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { PanelIntro, PanelSection } from "../ui";

function format(measure, v) {
  if (measure.unit === "$/mo") return v === 0 ? "Free" : `$${v}/mo`;
  if (measure.unit.startsWith("/")) return `${v}${measure.unit}`;
  return `${v} ${measure.unit}`;
}

const clock = (min) => `${Math.floor(min)}:${String(Math.round((min % 1) * 60)).padStart(2, "0")}`;

function bestValue(measure, rows) {
  const values = rows.map((r) => r[measure.key]);
  return measure.better === "lower" ? Math.min(...values) : Math.max(...values);
}

/* The scoreboard: one funnel score per product, you against the two rivals. */
function Scoreboard({ rows, self, selected, onSelect }) {
  const leader = Math.max(...rows.map((r) => r.score));
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  return (
    <div className="grid gap-3 @2xl:grid-cols-3">
      {rows.map((r) => {
        const rank = ranked.indexOf(r) + 1;
        const gap = r.score - self.score;
        const body = (
          <>
            <span className="flex items-center justify-between gap-2">
              <span className={cn("text-sm", r.self ? "font-medium text-kumo-strong" : "text-kumo-default")}>
                {r.name}
                {r.self && <span className="text-kumo-subtle"> · you</span>}
              </span>
              <span className="text-xs text-kumo-subtle">#{rank} of {rows.length}</span>
            </span>
            <span className="mt-3 flex items-baseline gap-1">
              <span className={cn("font-display text-5xl leading-none", r.self ? "text-ember" : "text-kumo-strong")}>{r.score}</span>
              <span className="text-sm text-kumo-subtle">/100</span>
            </span>
            <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-kumo-recessed">
              <span className={cn("block h-full rounded-full", r.self ? "bg-ember" : "bg-kumo-contrast")} style={{ width: `${r.score}%` }} />
            </span>
            <span className="mt-2.5 flex items-center justify-between gap-2 text-xs">
              {r.self ? (
                <span className="flex items-center gap-1 font-medium text-ember">
                  <TrendDownIcon size={13} /> {leader - r.score} behind the leader
                </span>
              ) : (
                <span className="font-medium text-kumo-strong">+{gap} ahead of you</span>
              )}
              <span className="text-kumo-subtle">{r.trial}</span>
            </span>
            {!r.self && (
              <span className="mt-3 flex items-center gap-1 text-xs text-kumo-subtle group-hover:text-kumo-strong">
                See their journey <ArrowRightIcon size={11} />
              </span>
            )}
          </>
        );
        return r.self ? (
          <div key={r.name} className="rounded-xl bg-ember-tint/60 p-4 ring-1 ring-ember/30">
            {body}
          </div>
        ) : (
          <button
            key={r.name}
            type="button"
            onClick={() => onSelect(r.name)}
            className={cn(
              "group rounded-xl p-4 text-left ring-1 transition-shadow",
              selected === r.name ? "ring-2 ring-kumo-contrast" : "ring-kumo-hairline hover:ring-kumo-line",
            )}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}

/* Each measure as bars, you first: green where you lead, red where you trail. */
function HeadToHead({ rows, measures, self }) {
  return (
    <div className="flex flex-col gap-5">
      {measures.map((m) => {
        const best = bestValue(m, rows);
        const win = self[m.key] === best;
        return (
          <div key={m.key}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-kumo-strong">{m.label}</span>
              <span className="text-xs text-kumo-subtle">{m.better} is better</span>
              <Badge variant={win ? "success" : "error"} className="ml-auto">
                {win ? "Win" : "Loss"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              {rows.map((r) => {
                const v = r[m.key];
                const lead = v === best;
                return (
                  <div key={r.name} className="flex items-center gap-3">
                    <span className={cn("w-24 shrink-0 truncate text-xs", r.self ? "font-medium text-kumo-strong" : "text-kumo-subtle")}>
                      {r.name}
                    </span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-kumo-recessed">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          r.self ? (win ? "bg-ok" : "bg-ember") : lead ? "bg-kumo-contrast" : "bg-kumo-contrast/35",
                        )}
                        style={{ width: `${Math.max(3, (v / m.max) * 100)}%` }}
                      />
                    </span>
                    <span className={cn("w-16 shrink-0 text-right text-xs tabular-nums", lead ? "font-medium text-kumo-strong" : "text-kumo-subtle")}>
                      {format(m, v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* Every product's path from landing to its first real output, on one clock. */
function Race({ rows, span = 7 }) {
  const x = (min) => `${(min / span) * 100}%`;
  return (
    <div>
      <div className="flex flex-col gap-4">
        {rows.map((r) => {
          const end = r.journey.find((s) => s.value);
          return (
            <div key={r.name} className="flex items-center gap-3">
              <span className={cn("w-24 shrink-0 truncate text-xs", r.self ? "font-medium text-kumo-strong" : "text-kumo-subtle")}>
                {r.name}
              </span>
              <div className="relative h-7 flex-1">
                <span className="absolute inset-x-0 top-1/2 h-px bg-kumo-hairline" />
                <span
                  className={cn("absolute top-1/2 h-1 -translate-y-1/2 rounded-full", r.self ? "bg-ember" : "bg-kumo-contrast/70")}
                  style={{ left: 0, width: x(end.at) }}
                />
                {r.journey.map((s) => (
                  <span
                    key={s.title}
                    title={`${clock(s.at)} · ${s.title}: ${s.note}`}
                    className={cn(
                      "absolute top-1/2 -translate-1/2 rounded-full ring-2 ring-kumo-base",
                      s.value ? "size-0" : cn("size-2.5", r.self ? "bg-ember" : "bg-kumo-contrast"),
                    )}
                    style={{ left: x(s.at) }}
                  />
                ))}
                <span
                  className={cn(
                    "absolute top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-white",
                    r.self ? "bg-ember" : "bg-kumo-contrast",
                  )}
                  style={{ left: `min(${x(end.at)}, calc(100% - 5.5rem))` }}
                >
                  <FlagCheckeredIcon size={11} weight="fill" /> {r.timeToValue} min
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative mt-2 ml-[6.75rem] h-4 text-[11px] text-kumo-subtle">
        {Array.from({ length: span + 1 }, (_, i) => (
          <span key={i} className="absolute -translate-x-1/2 tabular-nums" style={{ left: x(i) }}>
            {i}m
          </span>
        ))}
      </div>
    </div>
  );
}

/* A rival's own teardown: its steps to first value. Screens show once
   captured; until then each step is a labeled frame. */
function RivalJourney({ rival }) {
  return (
    <div>
      <p className="mb-4 rounded-lg bg-kumo-elevated px-3.5 py-2.5 text-sm text-kumo-default ring-1 ring-kumo-hairline">
        {rival.takeaway}
      </p>
      <ol className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
        {rival.journey.map((s, i) => (
          <li key={s.title} className="rise-in">
            <div className="overflow-hidden rounded-xl ring-1 ring-kumo-line">
              <div className="flex h-6 items-center gap-1 border-b border-kumo-hairline bg-kumo-elevated px-2.5">
                <span className="size-1.5 rounded-full bg-kumo-line" />
                <span className="size-1.5 rounded-full bg-kumo-line" />
                <span className="size-1.5 rounded-full bg-kumo-line" />
                <span className="ml-auto text-[10px] text-kumo-subtle tabular-nums">{clock(s.at)}</span>
              </div>
              {s.image ? (
                <img src={s.image} alt={`${rival.name} · ${s.title}`} className="aspect-[322/200] w-full object-cover" />
              ) : (
                <div className="flex aspect-[322/200] flex-col items-center justify-center gap-1.5 bg-kumo-base px-4 text-center">
                  <span className="font-display text-base leading-tight text-kumo-strong">{s.note}</span>
                  <span className="flex items-center gap-1 text-[10px] text-kumo-inactive">
                    <ImageIcon size={11} /> Screen pending
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm">
              <span className="font-display text-kumo-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium text-kumo-strong">{s.title}</span>
              {s.value && <Badge variant="success">First value</Badge>}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function CompetitorsPanel({ report, ready }) {
  const toasts = useKumoToastManager();
  const [queued, setQueued] = useState({});
  const { rows, measures, tracked, refreshedAt } = report.competitors;
  const self = rows.find((r) => r.self);
  const rivals = rows.filter((r) => !r.self);
  const [selected, setSelected] = useState(rivals[0].name);
  const rival = rivals.find((r) => r.name === selected);

  if (!ready) {
    return (
      <Empty
        className="mx-auto mt-24 max-w-xs border-0 bg-transparent"
        icon={<UsersThreeIcon size={40} className="text-kumo-inactive" />}
        title="No competitors yet"
        description="The competitor set fills in once the capture reads the site."
      />
    );
  }

  const wins = measures.filter((m) => self[m.key] === bestValue(m, rows));
  const speed = rivals.map((r) => self.timeToValue / r.timeToValue);
  const [slow, fast] = [Math.min(...speed), Math.max(...speed)].map((n) => Math.round(n * 10) / 10);

  function select(name) {
    setSelected(name);
    requestAnimationFrame(() => document.getElementById("rival-journey")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function runTeardown(name) {
    setQueued((q) => ({ ...q, [name]: true }));
    toasts.add({ title: `Teardown queued for ${name}`, description: "Demo only: no capture runs.", variant: "success" });
  }

  return (
    <>
      <PanelIntro title={<>{rivals.map((r) => r.name).join(" and ")} get users to value <em>{slow}–{fast}× faster</em>.</>}>
        {self.name} trails both on {measures.length - wins.length} of {measures.length} measures. It wins on{" "}
        {wins.map((m) => m.label.toLowerCase()).join(" and ")}, the edge worth building on. Refreshed {refreshedAt}.
      </PanelIntro>

      <PanelSection title="Funnel score" className="@container">
        <Scoreboard rows={rows} self={self} selected={selected} onSelect={select} />
      </PanelSection>

      <PanelSection
        title="Head to head"
        action={
          <span className="flex items-center gap-1.5 text-xs">
            <Badge variant="success">{wins.length} win{wins.length === 1 ? "" : "s"}</Badge>
            <Badge variant="error">{measures.length - wins.length} losses</Badge>
          </span>
        }
      >
        <HeadToHead rows={rows} measures={measures} self={self} />
      </PanelSection>

      <PanelSection title="Race to first value">
        <Race rows={rows} />
        <p className="mt-3 text-xs leading-relaxed text-kumo-subtle">
          Minutes from the landing page to the first output a user would keep. Hover a step for what happens there.
        </p>
      </PanelSection>

      <section id="rival-journey" className="@container scroll-mt-4 border-b border-kumo-hairline px-5 py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-kumo-subtle">Their journey</h3>
          <Tabs
            variant="segmented"
            size="sm"
            value={selected}
            onValueChange={setSelected}
            tabs={rivals.map((r) => ({ value: r.name, label: r.name }))}
          />
        </div>
        <RivalJourney key={rival.name} rival={rival} />
        <p className="mt-3 text-xs text-kumo-subtle">Torn down {rival.teardown}.</p>
      </section>

      <PanelSection title="Also tracked">
        <ul className="flex flex-col divide-y divide-kumo-hairline">
          {tracked.map((r) => (
            <li key={r.name} className="flex items-center gap-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-kumo-strong">{r.name}</span>
                <span className="block text-xs text-kumo-subtle">
                  {r.teardown ? `Torn down ${r.teardown}` : "Not torn down yet"}
                </span>
              </span>
              {queued[r.name] ? (
                <Badge variant="warning">Queued</Badge>
              ) : (
                <Button
                  size="xs"
                  variant={r.teardown ? "ghost" : "secondary"}
                  icon={r.teardown ? <ArrowsClockwiseIcon size={12} /> : <PlayIcon size={12} />}
                  onClick={() => runTeardown(r.name)}
                >
                  {r.teardown ? "Refresh" : "Run teardown"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </PanelSection>

      <p className="px-5 py-4 text-xs text-kumo-subtle">Sample figures for the demo.</p>
    </>
  );
}
