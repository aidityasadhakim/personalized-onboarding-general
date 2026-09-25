import { cn } from "@cloudflare/kumo";
import { LockSimpleIcon } from "@phosphor-icons/react";

/* The gated artifacts from EC-01. Enrich Labs' own UI language: white cards,
   their blue CTA, Helena's voice. The first line stays readable; the rest is
   blurred, so the preview itself is the pitch. */

export const ENRICH_BLUE = "#1f6feb";
export const REASSURANCE = "Free for 3 days · cancel anytime · keep everything you create";

/* A draft kind mid-sentence: “your LinkedIn post”, “your blog intro”. */
export const kindLabel = (kind) => (/^(LinkedIn|Instagram)\b/.test(kind) ? kind : kind.toLowerCase());

/* The three EC-01 mockups the expert sends back. */
export const MOCKS = [
  { id: "A", name: "One draft", caption: "The email stays whole; the next draft is gated below its first line.", recommended: true },
  { id: "B", name: "Four drafts", caption: "A counted draft grid proves quantity; one reveal opens all four." },
  { id: "C", name: "In the message", caption: "The gate lives inside Helena's message: a quoted opening, then the reveal." },
];

function BlurredLines({ lines = 3, unlocked, text }) {
  if (unlocked && text) return <p className="mt-1.5 text-[13px] leading-relaxed text-[#3d3a4d]">{text}</p>;
  return (
    <div className="gate-fade mt-2 flex flex-col gap-1.5 blur-[2.5px]" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="h-2 rounded-full bg-[#dcd9e8]" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

function GateCta({ label, onClick, disabled }) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <LockSimpleIcon size={16} weight="fill" className="text-[#b9b4c8]" />
      {disabled ? (
        <span className="rounded-lg px-4 py-2 text-[13px] font-medium text-white" style={{ background: ENRICH_BLUE }}>
          {label}
        </span>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="rounded-lg px-4 py-2 text-[13px] font-medium text-white hover:brightness-110"
          style={{ background: ENRICH_BLUE }}
        >
          {label}
        </button>
      )}
      <span className="text-[11px] text-[#8c88a0]">{REASSURANCE}</span>
    </div>
  );
}

/* Mock A: one adjacent artifact, gated below its first line. */
export function SingleDraftGate({ draft, unlocked, onReveal, interactive = true }) {
  return (
    <div className="rounded-xl border border-[#e6e3f0] bg-white p-4">
      <p className="text-[13px] font-semibold text-[#1d1a33]">{draft.kind} · Enrich Labs</p>
      <p className="mt-1 text-[13px] text-[#3d3a4d]">{draft.line}</p>
      <BlurredLines lines={4} unlocked={unlocked} text={draft.more} />
      {!unlocked && <GateCta label={`See your full ${kindLabel(draft.kind)}`} onClick={onReveal} disabled={!interactive} />}
    </div>
  );
}

/* Mock B: a counted grid proves quantity; one reveal opens all four. */
export function DraftGridGate({ drafts, unlocked, onReveal, interactive = true }) {
  return (
    <div className="rounded-xl border border-[#e6e3f0] bg-white p-4">
      <p className="text-[13px] font-semibold text-[#1d1a33]">
        {drafts.length} drafts {unlocked ? "unlocked" : "waiting"}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {drafts.map((d) => (
          <div key={d.kind} className={cn("rounded-lg border border-[#ece9f4] p-2.5", unlocked && "bg-[#f7f6fc]")}>
            <p className="text-[12px] font-semibold text-[#1d1a33]">{d.kind}</p>
            <p className="mt-0.5 line-clamp-2 text-[11.5px] text-[#55516a]">{d.line}</p>
            {!unlocked && <BlurredLines lines={2} />}
          </div>
        ))}
      </div>
      {!unlocked && <GateCta label={`See all ${drafts.length} drafts`} onClick={onReveal} disabled={!interactive} />}
    </div>
  );
}

/* Mock C: the gate lives inside Helena's message. A quoted opening line, the
   rest blurred, then the reveal. */
export function MessageGate({ draft, unlocked, onReveal, interactive = true }) {
  return (
    <div>
      <p className="text-[13px] text-[#3d3a4d]">
        Your {kindLabel(draft.kind)} opens with: <span className="font-medium text-[#1d1a33]">“{draft.line}”</span>
      </p>
      <BlurredLines lines={3} unlocked={unlocked} text={draft.more} />
      {!unlocked && <GateCta label={`See the rest of your ${kindLabel(draft.kind)}`} onClick={onReveal} disabled={!interactive} />}
    </div>
  );
}
