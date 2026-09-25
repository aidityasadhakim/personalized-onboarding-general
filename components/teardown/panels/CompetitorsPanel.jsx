"use client";

/* eslint-disable @next/next/no-img-element -- static capture screenshots */

import { useId, useState } from "react";
import { Badge, Button, Empty, Tabs, cn, useKumoToastManager } from "@cloudflare/kumo";
import {
  ArrowUpRightIcon,
  ArrowsClockwiseIcon,
  ImageIcon,
  PlayIcon,
  SealCheckIcon,
  TrendDownIcon,
  TrendUpIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PanelIntro } from "../ui";

/* Chart colors: you in ember (green where you lead), the leading rival in
   ink, the other rival hatched. */
const EMBER = "#c8552b";
const OK = "#2f7a4f";
const INK = "#1f1c18";
const HATCH_BG = "#f1eee8";
const HATCH_LINE = "#bdb6ab";
const MUTED = "#8a8378";

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

function Card({ className, children }) {
  return <div className={cn("rounded-2xl bg-kumo-base p-5 ring-1 ring-kumo-hairline", className)}>{children}</div>;
}

function Chip({ tone, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "win" && "bg-ok-tint text-ok",
        tone === "loss" && "bg-ember-tint text-ember",
        tone === "invert" && "bg-white/15 text-white",
        !tone && "bg-kumo-recessed text-kumo-default",
      )}
    >
      {children}
    </span>
  );
}

/* A diagonal hatch for rival bars, scoped to one chart. */
function Hatch({ id }) {
  return (
    <defs>
      <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" fill={HATCH_BG} />
        <line x1="0" y1="0" x2="0" y2="6" stroke={HATCH_LINE} strokeWidth="2.5" />
      </pattern>
    </defs>
  );
}

function ChartTip({ active, payload, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-kumo-base px-3 py-2 text-xs shadow-[0_6px_20px_-6px_rgb(40_30_20/0.25)] ring-1 ring-kumo-hairline">
      {render(payload[0].payload)}
    </div>
  );
}

/* A single-line value label over a bar; Recharts would wrap it to the bar width. */
function TopLabel({ x, y, width, value, formatter }) {
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={500} fill={INK}>
      {formatter(value)}
    </text>
  );
}

const fillFor = (d, hatch, win) => (d.self ? (win ? OK : EMBER) : d.lead ? INK : `url(#${hatch})`);

/* One score card per product. Yours is filled; a rival's opens its journey. */
function ScoreCards({ rows, self, selected, onSelect }) {
  const leader = rows.reduce((a, b) => (b.score > a.score ? b : a));
  return (
    <div className="grid gap-4 @2xl:grid-cols-3">
      {rows.map((r) =>
        r.self ? (
          <div
            key={r.name}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#d9683d] to-[#a3401d] p-5 text-white shadow-[0_10px_30px_-12px_rgb(200_85_43/0.6)]"
          >
            <p className="text-sm font-medium text-white/90">{r.name} · you</p>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-6xl leading-none">{r.score}</span>
              <span className="text-sm text-white/70">/100 funnel score</span>
            </p>
            <p className="mt-4">
              <Chip tone="invert">
                <TrendDownIcon size={12} /> {leader.score - r.score} behind {leader.name}
              </Chip>
            </p>
          </div>
        ) : (
          <button
            key={r.name}
            type="button"
            onClick={() => onSelect(r.name)}
            className={cn(
              "group rounded-2xl bg-kumo-base p-5 text-left ring-1 transition-shadow",
              selected === r.name ? "ring-2 ring-kumo-contrast" : "ring-kumo-hairline hover:ring-kumo-line",
            )}
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-medium text-kumo-strong">{r.name}</span>
              <span className="flex size-8 items-center justify-center rounded-full ring-1 ring-kumo-line transition-colors group-hover:bg-kumo-contrast group-hover:text-white">
                <ArrowUpRightIcon size={14} />
              </span>
            </span>
            <span className="mt-3 flex items-baseline gap-1">
              <span className="font-display text-6xl leading-none text-kumo-strong">{r.score}</span>
              <span className="text-sm text-kumo-subtle">/100</span>
            </span>
            <span className="mt-4 flex items-center justify-between gap-2">
              <Chip>
                <TrendUpIcon size={12} /> {r.score - self.score} ahead of you
              </Chip>
              <span className="text-xs text-kumo-subtle">{r.trial}</span>
            </span>
          </button>
        ),
      )}
    </div>
  );
}

/* Minutes from landing to the first output a user would keep. */
function RaceChart({ rows }) {
  const hatch = `hatch-${useId().replace(/:/g, "")}`;
  const fastest = Math.min(...rows.map((r) => r.timeToValue));
  const data = rows.map((r) => ({
    name: r.self ? "You" : r.name,
    value: r.timeToValue,
    self: !!r.self,
    lead: r.timeToValue === fastest,
    journey: r.journey,
  }));
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }} barCategoryGap="28%">
          <Hatch id={hatch} />
          <XAxis type="number" domain={[0, 7]} ticks={[0, 1, 2, 3, 4, 5, 6, 7]} tickFormatter={(v) => `${v}m`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: MUTED }} />
          <YAxis type="category" dataKey="name" width={72} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: INK }} />
          <Tooltip
            cursor={false}
            content={
              <ChartTip
                render={(d) => (
                  <>
                    <p className="mb-1 font-medium text-kumo-strong">{d.name} · {d.value} min to first value</p>
                    {d.journey.map((s) => (
                      <p key={s.title} className="flex gap-2 text-kumo-subtle">
                        <span className="w-8 tabular-nums">{clock(s.at)}</span>
                        <span className={cn(s.value && "font-medium text-kumo-strong")}>{s.title}</span>
                      </p>
                    ))}
                  </>
                )}
              />
            }
          />
          <Bar dataKey="value" radius={999} barSize={26}>
            {data.map((d) => (
              <Cell key={d.name} fill={fillFor(d, hatch, false)} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v) => `${v} min`} style={{ fontSize: 12, fill: INK, fontWeight: 500 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* One measure: who leads, and by how much. */
function MeasureCard({ measure, rows, self }) {
  const hatch = `hatch-${useId().replace(/:/g, "")}`;
  const best = bestValue(measure, rows);
  const win = self[measure.key] === best;
  const leader = rows.find((r) => r[measure.key] === best);
  const data = rows.map((r) => ({
    name: r.self ? "You" : r.name,
    value: r[measure.key],
    self: !!r.self,
    lead: r[measure.key] === best,
  }));
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-kumo-strong">{measure.label}</p>
          <p className="text-xs text-kumo-subtle">{measure.better} is better</p>
        </div>
        <Chip tone={win ? "win" : "loss"}>{win ? "Win" : "Loss"}</Chip>
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className={cn("font-display text-3xl leading-none", win ? "text-ok" : "text-ember")}>
          {format(measure, self[measure.key])}
        </span>
        <span className="text-xs text-kumo-subtle">{win ? "best in set" : `vs ${format(measure, best)} at ${leader.name}`}</span>
      </p>
      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 22, right: 4, bottom: 0, left: 4 }} barCategoryGap="24%">
            <Hatch id={hatch} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: MUTED }} />
            <YAxis hide domain={[0, (max) => max * 1.12]} />
            <Tooltip
              cursor={false}
              content={<ChartTip render={(d) => <span className="text-kumo-strong">{d.name} · {format(measure, d.value)}</span>} />}
            />
            <Bar dataKey="value" radius={999} barSize={36} minPointSize={10}>
              {data.map((d) => (
                <Cell key={d.name} fill={fillFor(d, hatch, win)} />
              ))}
              <LabelList dataKey="value" content={(p) => <TopLabel {...p} formatter={(v) => format(measure, v)} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Legend() {
  return (
    <span className="flex items-center gap-3 text-xs text-kumo-subtle">
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-ember" /> You
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-kumo-contrast" /> Leader
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-[repeating-linear-gradient(45deg,#bdb6ab_0_1.5px,#f1eee8_1.5px_3.5px)] ring-1 ring-kumo-line" /> Rival
      </span>
    </span>
  );
}

/* A rival's own teardown: its steps to first value. Screens show once
   captured; until then each step is a labeled frame. */
function RivalJourney({ rival }) {
  return (
    <div>
      <p className="mb-4 text-sm text-kumo-default">{rival.takeaway}</p>
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
        {self.name} trails both on {measures.length - wins.length} of {measures.length} measures. Refreshed {refreshedAt}.
      </PanelIntro>

      <div className="@container flex flex-col gap-4 px-5 pb-8">
        <ScoreCards rows={rows} self={self} selected={selected} onSelect={select} />

        <Card>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-kumo-strong">Race to first value</p>
              <p className="text-xs text-kumo-subtle">Minutes from the landing page to the first output a user would keep</p>
            </div>
            <Legend />
          </div>
          <RaceChart rows={rows} />
        </Card>

        <div className="mt-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-kumo-subtle">Head to head</h3>
          <span className="flex items-center gap-1.5">
            <Chip tone="win">{wins.length} win{wins.length === 1 ? "" : "s"}</Chip>
            <Chip tone="loss">{measures.length - wins.length} losses</Chip>
          </span>
        </div>
        <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {measures.map((m) => (
            <MeasureCard key={m.key} measure={m} rows={rows} self={self} />
          ))}
          <div className="flex flex-col justify-between rounded-2xl bg-kumo-contrast p-5 text-white">
            <div>
              <SealCheckIcon size={22} weight="fill" className="text-[#8fd3a8]" />
              <p className="mt-3 font-display text-2xl leading-tight">
                {wins.length} win, {measures.length - wins.length} losses
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {wins.map((m) => m.label).join(" and ")} is the edge: Helena reads the whole site before doing anything,
                and neither rival does. The losses are all about speed to the first win.
              </p>
            </div>
            <p className="mt-4 text-xs text-white/50">Sample figures for the demo.</p>
          </div>
        </div>

        <section id="rival-journey" className="mt-4 scroll-mt-4">
          <Card className="@container">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-kumo-strong">Their journey</p>
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
          </Card>
        </section>

        <Card>
          <p className="mb-1 text-sm font-medium text-kumo-strong">Also tracked</p>
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
        </Card>
      </div>
    </>
  );
}
