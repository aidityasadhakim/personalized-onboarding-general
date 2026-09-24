"use client";

/* eslint-disable @next/next/no-img-element -- captured screenshots are static
   assets shown at their natural ratio; next/image adds nothing here. */

import { Button, Meter, cn } from "@cloudflare/kumo";
import { ArrowUpRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { WindowFrame } from "../ui";

/* Cards the agent drops into the chat. Each one can open its console view. */

function OpenButton({ onClick, children = "Open in console" }) {
  return (
    <Button variant="ghost" size="xs" onClick={onClick} className="text-kumo-subtle">
      {children}
      <ArrowUpRightIcon size={12} />
    </Button>
  );
}

function Card({ children, className }) {
  return (
    <div className={cn("rounded-xl bg-kumo-base ring-1 ring-kumo-hairline shadow-[0_1px_2px_rgb(40_30_20/0.04)]", className)}>
      {children}
    </div>
  );
}

function Captures({ report, onOpen }) {
  const shots = report.journey.filter((s) => s.image);
  return (
    <Card className="@container p-3">
      <div className="grid grid-cols-2 gap-2 @xl:grid-cols-4">
        {shots.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpen("journey", s.id)}
            className="group text-left"
          >
            <img
              src={s.image}
              alt={`${s.title} capture`}
              className="aspect-[322/200] w-full rounded-md object-cover ring-1 ring-kumo-hairline group-hover:ring-kumo-line"
            />
            <span className="mt-1.5 block text-xs text-kumo-subtle">
              {s.step} · {s.title}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <OpenButton onClick={() => onOpen("journey")}>Open journey</OpenButton>
      </div>
    </Card>
  );
}

export const toneClass = {
  // Kumo's indicator paints a brand gradient, so recolor its stops.
  ok: "from-ok via-ok to-ok",
  mid: "from-[#c99a3b] via-[#c99a3b] to-[#c99a3b]",
  leak: "from-ember via-ember to-ember",
};

function Funnel({ report, onOpen }) {
  return (
    <Card className="@container p-4">
      <div className="grid gap-3 @md:grid-cols-2">
        {report.funnel.map((f) => (
          <Meter
            key={f.stage}
            label={f.stage}
            value={f.score}
            customValue={f.lens}
            indicatorClassName={toneClass[f.tone]}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-end">
        <OpenButton onClick={() => onOpen("analysis")}>Open analysis</OpenButton>
      </div>
    </Card>
  );
}

function Issue({ report, id, onOpen }) {
  const issue = report.issues.find((i) => i.id === id);
  if (!issue) return null;
  return (
    <Card className="@container p-3">
      <div className="flex gap-4">
        <img
          src={issue.image}
          alt=""
          className="hidden h-20 w-32 shrink-0 rounded-md object-cover object-top ring-1 ring-kumo-hairline @lg:block"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-ember-tint px-1.5 py-0.5 text-xs font-medium text-ember">Issue {issue.n}</span>
            <span className="text-xs text-kumo-subtle">{issue.stage}</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-kumo-strong">{issue.title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-kumo-subtle">{issue.fix}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <OpenButton onClick={() => onOpen("analysis", issue.id)} />
      </div>
    </Card>
  );
}

function Idea({ report, id, onOpen }) {
  const idea = report.ideas.find((i) => i.id === id);
  if (!idea) return null;
  return (
    <Card className="p-4">
      <p className="font-mono text-xs text-kumo-subtle">{idea.id}</p>
      <p className="mt-1 text-sm font-medium text-kumo-strong">{idea.title}</p>
      <p className="text-xs text-kumo-subtle">
        From {idea.from} · score {idea.score} · 3 mockups · run-length estimate
      </p>
      <div className="mt-2 flex justify-end">
        <OpenButton onClick={() => onOpen("setup", idea.id)}>Open card</OpenButton>
      </div>
    </Card>
  );
}

function Prototype({ report, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen("onboarding")} className="group block w-full text-left">
      <WindowFrame title={`${report.url} · proposed first run`} bodyClassName="warm-wash p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f08a5d] to-[#d9532c] text-white">
            <SparkleIcon size={15} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight text-kumo-strong">What&apos;s the one win you want first?</p>
            <p className="mt-1 text-sm text-kumo-subtle">Need → first win → then the ask. Try it in the console.</p>
          </div>
        </div>
      </WindowFrame>
    </button>
  );
}

export default function Attachment({ attachment, report, onOpen }) {
  const props = { report, onOpen, id: attachment.id };
  switch (attachment.type) {
    case "captures":
      return <Captures {...props} />;
    case "funnel":
      return <Funnel {...props} />;
    case "issue":
      return <Issue {...props} />;
    case "idea":
      return <Idea {...props} />;
    case "prototype":
      return <Prototype {...props} />;
    default:
      return null;
  }
}
