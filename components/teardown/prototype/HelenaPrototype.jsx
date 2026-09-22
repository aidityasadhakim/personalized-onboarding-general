"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Tabs, cn } from "@cloudflare/kumo";
import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  CheckIcon,
  CopySimpleIcon,
  BookmarkSimpleIcon,
  HashIcon,
} from "@phosphor-icons/react";
import { WindowFrame } from "../ui";
import { DraftGridGate, ENRICH_BLUE, REASSURANCE, SingleDraftGate } from "./gate";

/* A clickable replica of Helena's first run, rebuilt the way the teardown
   proposes: gather the need, deliver one real win, then make the ask.
   "Current" replays today's flow for contrast. Nothing here calls an API. */

const PROPOSED_STEPS = ["intent", "reading", "recommend", "win", "paywall", "unlocked"];

const NOTES = {
  intent: { tag: "Kept", title: "The intent step already works", body: "Five chips, one tap each. The teardown scored onboarding as the strongest stage, so it stays." },
  reading: { tag: "Issue 01", title: "Homework, shown as a checklist", body: "Helena still reads the whole site, but the user sees four short findings instead of a document dump." },
  recommend: { tag: "Issue 02", title: "Ask, then strongly recommend", body: "The chips and the site are used right away to recommend one win, instead of a generic 14-day plan." },
  win: { tag: "Issue 01 · EC-01", title: "The first output is the win", body: "Finished, personal, and actionable with Save, Copy, and Schedule. The gate arrives after it, in Helena's voice, blocking only the next artifact." },
  paywall: { tag: "Issue 04", title: "The ask names the value", body: "“Get your full week” replaces “Hire Helena”. The trial is reassurance underneath, not the offer." },
  unlocked: { tag: "Outcome", title: "Seeing is the trial start", body: "The reveal is the conversion event. Measure gate reveal rate and workspace → trial starts; hold trial → paid as the guardrail." },
};

const CURRENT_NOTES = [
  { tag: "Today", title: "Intent collected", body: "Same five chips. The answer is stored, then set aside." },
  { tag: "Issue 01 · 02", title: "Context, then a generic guess", body: "A dense brand profile arrives first, followed by a starter plan that ignores the chips." },
  { tag: "Issue 03 · 04", title: "The gate lands mid-read", body: "“Hire Helena” is the only saturated element on screen, and it names the commitment." },
];

function HelenaAvatar() {
  return <span className="size-7 shrink-0 rounded-full bg-gradient-to-br from-[#f39a6b] to-[#d9532c]" aria-hidden="true" />;
}

function HelenaSays({ children, className }) {
  return (
    <div className={cn("rise-in flex gap-3", className)}>
      <HelenaAvatar />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#1d1a33]">Helena</p>
        <div className="mt-0.5 text-[13.5px] leading-relaxed text-[#3d3a4d]">{children}</div>
      </div>
    </div>
  );
}

function AppShell({ channel = "Getting started", children, scrollRef }) {
  return (
    <div className="flex h-full min-h-0 bg-white text-[#1d1a33]">
      <nav className="hidden w-44 shrink-0 flex-col gap-5 border-r border-[#efedf5] bg-[#fbfaff] p-3 @2xl:flex" aria-hidden="true">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: ENRICH_BLUE }}>
            e/
          </span>
          <span className="text-[13px] font-semibold">Helena</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="px-1.5 text-[10px] font-medium text-[#9994ad]">Channels</span>
          {["main", "content-inspo", "performance", "calendar"].map((c, i) => (
            <span key={c} className={cn("flex items-center gap-1 rounded-md px-1.5 py-1 text-[12.5px]", i === 0 ? "bg-[#eeecf8] font-medium" : "text-[#6b6784]")}>
              <HashIcon size={12} /> {c}
            </span>
          ))}
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[#efedf5] px-4">
          <span className="text-[11px] text-[#9994ad]">#main</span>
          <span className="text-[13px] font-semibold">{channel}</span>
        </div>
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function IntentPicker({ intents, selected, onToggle, onContinue }) {
  return (
    <div className="rise-in mx-auto flex max-w-sm flex-col py-6">
      <p className="text-[19px] font-semibold tracking-tight">What do you need help with?</p>
      <p className="mt-1 text-[12.5px] text-[#77728c]">Select all that apply. This helps Helena focus on what matters most.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {intents.map((it) => {
          const on = selected.includes(it.id);
          return (
            <button
              key={it.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(it.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px]",
                on ? "border-transparent text-white" : "border-[#e4e1ee] bg-white text-[#3d3a4d] hover:border-[#cfcbe0]",
              )}
              style={on ? { background: ENRICH_BLUE } : undefined}
            >
              <span aria-hidden="true">{it.emoji}</span> {it.label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={!selected.length}
        onClick={onContinue}
        className="mt-6 self-end rounded-lg px-5 py-2 text-[13px] font-medium text-white disabled:bg-[#e8e6ef] disabled:text-[#a9a5b8]"
        style={selected.length ? { background: ENRICH_BLUE } : undefined}
      >
        Continue
      </button>
    </div>
  );
}

function Artifact({ artifact }) {
  const [done, setDone] = useState({});
  const actions = [
    { id: "save", label: "Save", icon: BookmarkSimpleIcon, doneLabel: "Saved" },
    { id: "copy", label: "Copy", icon: CopySimpleIcon, doneLabel: "Copied" },
    { id: "schedule", label: "Schedule", icon: CalendarBlankIcon, doneLabel: "Mon 8:30am" },
  ];
  return (
    <div className="rounded-xl border border-[#e6e3f0] bg-white">
      <div className="border-b border-[#f0eef6] px-4 py-3">
        <p className="text-[11px] font-medium text-[#8c88a0]">{artifact.kind}</p>
        <p className="mt-0.5 text-[15px] font-semibold leading-snug">{artifact.title}</p>
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-3 text-[13.5px] leading-relaxed text-[#3d3a4d]">
        {artifact.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <ul className="mt-1 flex flex-col gap-1">
          {artifact.bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-[12.5px] text-[#55516a]">
              <CheckIcon size={12} weight="bold" className="mt-1 shrink-0 text-[#2f7a4f]" /> {b}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1.5 border-t border-[#f0eef6] px-3 py-2.5">
        {actions.map(({ id, label, icon: Icon, doneLabel }) => (
          <button
            key={id}
            type="button"
            onClick={() => setDone((d) => ({ ...d, [id]: true }))}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px]",
              done[id] ? "border-[#cfe6d7] bg-[#eef7f1] text-[#2f7a4f]" : "border-[#e6e3f0] text-[#3d3a4d] hover:bg-[#f7f6fc]",
            )}
          >
            {done[id] ? <CheckIcon size={12} weight="bold" /> : <Icon size={13} />}
            {done[id] ? doneLabel : label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Paywall({ onAccept, onDismiss }) {
  return (
    <div className="absolute inset-0 z-10 flex items-end justify-center bg-[#1d1a33]/25 p-4 backdrop-blur-[2px] @md:items-center">
      <div role="dialog" aria-modal="true" aria-label="Start your trial" className="rise-in w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <p className="text-[18px] font-semibold leading-snug tracking-tight text-[#1d1a33]">
          Your full week of posts, published while you sleep?
        </p>
        <p className="mt-2 text-[12.5px] text-[#77728c]">
          Helena already drafted it from enrichlabs.ai. Keep going and she&apos;ll schedule every piece.
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="mt-5 w-full rounded-lg py-2.5 text-[14px] font-medium text-white hover:brightness-110"
          style={{ background: ENRICH_BLUE }}
        >
          Get your full week →
        </button>
        <p className="mt-2 text-[11px] text-[#8c88a0]">{REASSURANCE}</p>
        <button type="button" onClick={onDismiss} className="mt-3 text-[12px] text-[#77728c] hover:text-[#1d1a33]">
          Not now
        </button>
      </div>
    </div>
  );
}

function ProposedFlow({ data, variant, onStep }) {
  const [step, setStep] = useState("intent");
  const [intents, setIntents] = useState([]);
  const [found, setFound] = useState(0);
  const [gateShown, setGateShown] = useState(false);
  const scrollRef = useRef(null);

  const primary = intents[0] ?? "seo";
  const win = data.wins[primary];
  const others = data.drafts.filter((d) => d.kind !== win.artifact.kind);
  const pickedLabels = intents.map((id) => data.intents.find((i) => i.id === id).label.toLowerCase());
  const unlocked = step === "unlocked";

  function go(next) {
    setStep(next);
    onStep(next);
  }

  // Helena's site read plays out one finding at a time, then recommends.
  useEffect(() => {
    if (step !== "reading") return;
    const t =
      found < data.siteFindings.length
        ? setTimeout(() => setFound((n) => n + 1), 650)
        : setTimeout(() => {
            setStep("recommend");
            onStep("recommend");
          }, 700);
    return () => clearTimeout(t);
  }, [step, found, data.siteFindings.length, onStep]);

  // The gate arrives after the reader has had a moment with the win.
  useEffect(() => {
    if (step !== "win" || gateShown) return;
    const t = setTimeout(() => setGateShown(true), 1800);
    return () => clearTimeout(t);
  }, [step, gateShown]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [step, found, gateShown]);

  if (step === "intent") {
    return (
      <AppShell channel="Welcome" scrollRef={scrollRef}>
        <IntentPicker
          intents={data.intents}
          selected={intents}
          onToggle={(id) => setIntents((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          onContinue={() => go("reading")}
        />
      </AppShell>
    );
  }

  return (
    <div className="relative h-full">
      <AppShell scrollRef={scrollRef}>
        <HelenaSays>
          Let me take a look at enrichlabs.ai and start putting things together.
          <ul className="mt-2 flex flex-col gap-1">
            {data.siteFindings.slice(0, found).map((f) => (
              <li key={f} className="rise-in flex items-center gap-2 text-[12.5px] text-[#55516a]">
                <CheckIcon size={12} weight="bold" className="text-[#2f7a4f]" /> {f}
              </li>
            ))}
          </ul>
        </HelenaSays>

        {PROPOSED_STEPS.indexOf(step) >= 2 && (
          <HelenaSays>
            Based on enrichlabs.ai and your pick{pickedLabels.length > 1 ? "s" : ""} ({pickedLabels.join(", ")}),
            here&apos;s the one win I&apos;d start with:
            <div className="mt-2.5 rounded-xl border-2 p-3.5" style={{ borderColor: ENRICH_BLUE }}>
              <span className="rounded-full px-2 py-0.5 text-[10.5px] font-medium text-white" style={{ background: ENRICH_BLUE }}>
                Recommended for you
              </span>
              <p className="mt-2 text-[14px] font-semibold text-[#1d1a33]">{win.pick}</p>
              <p className="mt-1 text-[12.5px] text-[#55516a]">{win.why}</p>
              {step === "recommend" && (
                <button
                  type="button"
                  onClick={() => go("win")}
                  className="mt-3 rounded-lg px-4 py-1.5 text-[13px] font-medium text-white hover:brightness-110"
                  style={{ background: ENRICH_BLUE }}
                >
                  Write it for me
                </button>
              )}
            </div>
            <p className="mt-2 text-[12px] text-[#8c88a0]">Also on my list: {win.alternatives.join(" · ")}</p>
          </HelenaSays>
        )}

        {PROPOSED_STEPS.indexOf(step) >= 3 && (
          <HelenaSays>
            Here&apos;s your {win.artifact.kind.toLowerCase()}. It&apos;s yours to keep.
            <div className="mt-2.5">
              <Artifact artifact={win.artifact} />
            </div>
          </HelenaSays>
        )}

        {gateShown && (
          <HelenaSays>
            {variant === "A"
              ? `Your ${others[0].kind.toLowerCase()} for Enrich Labs is drafted too:`
              : `While you read, I drafted ${others.length} more for Enrich Labs:`}
            <div className="mt-2.5">
              {variant === "A" ? (
                <SingleDraftGate draft={others[0]} unlocked={unlocked} onReveal={() => go("paywall")} />
              ) : (
                <DraftGridGate drafts={others} unlocked={unlocked} onReveal={() => go("paywall")} />
              )}
            </div>
          </HelenaSays>
        )}

        {unlocked && (
          <HelenaSays>
            <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-[#eef7f1] px-2.5 py-1 text-[12px] font-medium text-[#2f7a4f]">
              <CheckCircleIcon size={14} weight="fill" /> Trial started · 3 days free
            </span>
            They&apos;re all yours. Want me to put Monday&apos;s post on the calendar?
          </HelenaSays>
        )}
      </AppShell>

      {step === "paywall" && <Paywall onAccept={() => go("unlocked")} onDismiss={() => go("win")} />}
    </div>
  );
}

function CurrentFlow({ data, screen }) {
  if (screen === 0) {
    return (
      <AppShell channel="Welcome">
        <IntentPicker intents={data.intents} selected={["seo", "content"]} onToggle={() => {}} onContinue={() => {}} />
      </AppShell>
    );
  }
  return (
    <div className="relative h-full">
      <AppShell>
        <HelenaSays>
          Great info. Enrich Labs is an AI marketing agent, bold blue brand, very clean positioning. I&apos;ve saved the core files.
          <div className="mt-2.5 rounded-xl border border-[#e6e3f0] p-3.5 text-[12px] leading-relaxed text-[#55516a]">
            <p className="font-semibold text-[#1d1a33]">business-profile.md</p>
            <p className="mt-1.5">1. Autonomous marketing across SEO, ads, social and email</p>
            <p>2. Founders, marketers and agencies</p>
            <p>3. Opt-in trial, 3 days, no card at signup</p>
            <p className="mt-1.5 font-semibold text-[#1d1a33]">Competitive angle</p>
            <p>Positioned against Jasper, Copy.ai, Writesonic and Surfer SEO…</p>
            <p className="mt-1.5 font-semibold text-[#1d1a33]">brand-guidelines.md</p>
            <p>Primary #1F6FEB · Secondary #F6F5FB · Voice: confident, plain…</p>
          </div>
        </HelenaSays>
        <HelenaSays>
          Here&apos;s your starter plan:
          <ul className="mt-2 divide-y divide-[#f0eef6] rounded-xl border border-[#e6e3f0] text-[12.5px]">
            {["Draft 14 days of LinkedIn posts to launch your social presence", "Write 10 X posts to seed the brand in the SaaS growth community", "Create 3 LinkedIn carousel scripts"].map((t) => (
              <li key={t} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                {t} <span className="text-[#b0acc2]">+</span>
              </li>
            ))}
          </ul>
        </HelenaSays>
      </AppShell>
      {screen === 2 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0b12]/85 px-6 text-center">
          <p className="text-[17px] font-semibold text-white">Hire your first autonomous AI marketer today.</p>
          <span className="mt-4 rounded-lg px-6 py-2 text-[14px] font-medium text-white" style={{ background: "#2f6bff" }}>
            Hire Helena
          </span>
          <p className="mt-3 text-[12px] font-medium text-white/80">3-day free trial</p>
          <p className="text-[12px] text-white/50">Works while you sleep.</p>
        </div>
      )}
    </div>
  );
}

function Note({ note }) {
  return (
    <div className="rounded-xl bg-kumo-elevated p-4 ring-1 ring-kumo-hairline">
      <Badge variant="neutral">{note.tag}</Badge>
      <p className="mt-2 text-sm font-medium text-kumo-strong">{note.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-kumo-subtle">{note.body}</p>
    </div>
  );
}

export default function HelenaPrototype({ data, url, height = 560, className }) {
  const [mode, setMode] = useState("proposed");
  const [variant, setVariant] = useState("B");
  const [nonce, setNonce] = useState(0);
  const [step, setStep] = useState("intent");
  const [screen, setScreen] = useState(0);

  function restart() {
    setNonce((n) => n + 1);
    setStep("intent");
    setScreen(0);
  }

  const stepIndex = PROPOSED_STEPS.indexOf(step);
  const note = mode === "proposed" ? NOTES[step] : CURRENT_NOTES[screen];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          variant="segmented"
          size="sm"
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            restart();
          }}
          tabs={[
            { value: "proposed", label: "Proposed" },
            { value: "current", label: "Current" },
          ]}
        />
        {mode === "proposed" && (
          <Tabs
            variant="segmented"
            size="sm"
            value={variant}
            onValueChange={(v) => {
              setVariant(v);
              restart();
            }}
            tabs={[
              { value: "A", label: "Mock A · one draft" },
              { value: "B", label: "Mock B · four drafts" },
            ]}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowCounterClockwiseIcon size={14} />}
          onClick={restart}
          className="ml-auto"
        >
          Restart
        </Button>
      </div>

      <div className="@container">
        <WindowFrame title={`app.${url}`} bodyClassName="relative" className="w-full">
          <div style={{ height }}>
            {mode === "proposed" ? (
              <ProposedFlow key={`${variant}-${nonce}`} data={data} variant={variant} onStep={setStep} />
            ) : (
              <CurrentFlow data={data} screen={screen} />
            )}
          </div>
        </WindowFrame>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" aria-label="Progress">
          {(mode === "proposed" ? PROPOSED_STEPS : CURRENT_NOTES).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-[width]",
                i === (mode === "proposed" ? stepIndex : screen) ? "w-5 bg-kumo-contrast" : "w-1.5 bg-kumo-line",
              )}
            />
          ))}
        </div>
        {mode === "current" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setScreen((s) => (s + 1) % CURRENT_NOTES.length)}
          >
            {screen === CURRENT_NOTES.length - 1 ? "Start over" : "Next screen"}
          </Button>
        )}
      </div>

      {note && <Note note={note} />}
    </div>
  );
}
