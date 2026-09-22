"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, InputGroup } from "@cloudflare/kumo";
import { ArrowRightIcon, GlobeSimpleIcon } from "@phosphor-icons/react";

export function normalizeHost(value) {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

export default function StartHero({ report, onRun }) {
  const [value, setValue] = useState(report.url);
  const [error, setError] = useState(null);

  function submit(e) {
    e.preventDefault();
    const host = normalizeHost(value);
    if (!host) {
      setError("Enter a site address, like enrichlabs.ai");
      return;
    }
    onRun(host);
  }

  return (
    <div className="warm-wash flex h-full flex-col items-center overflow-y-auto px-4 sm:px-6">
      <div className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="mb-6 rounded-full bg-kumo-base/70 px-3 py-1 text-xs text-kumo-subtle ring-1 ring-kumo-hairline">
          Onboarding teardowns, built by agents
        </p>
        <h1 className="font-display text-[44px] leading-[1.02] text-kumo-strong sm:text-[68px]">
          See the onboarding <em>they</em> should have
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-kumo-strong/80">
          Paste a URL. Funnel OS signs up like a real user, finds where the funnel leaks, and builds a
          personalized first run you can click through.
        </p>

        <form onSubmit={submit} className="mt-10 w-full max-w-lg" noValidate>
          <div className="flex items-center gap-2 rounded-2xl bg-kumo-base p-1.5 shadow-[0_1px_2px_rgb(40_30_20/0.06),0_16px_40px_-16px_rgb(40_30_20/0.25)] ring-1 ring-kumo-line">
            <InputGroup size="lg" className="flex-1 border-0 shadow-none ring-0">
              <InputGroup.Addon>
                <GlobeSimpleIcon size={18} className="text-kumo-subtle" />
              </InputGroup.Addon>
              <InputGroup.Input
                aria-label="Website to tear down"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="yourcompany.com"
                autoComplete="off"
                spellCheck={false}
              />
            </InputGroup>
            <Button type="submit" variant="primary" size="lg" className="rounded-xl px-5">
              Run teardown
            </Button>
          </div>
          <p className={error ? "mt-3 text-sm text-kumo-danger" : "mt-3 text-sm text-kumo-subtle"} role={error ? "alert" : undefined}>
            {error ?? "About 30 seconds · replays a recorded teardown"}
          </p>
        </form>

        <div className="mt-14 flex flex-col items-center gap-3">
          <span className="text-xs text-kumo-subtle">Recent</span>
          <Link
            href={`/teardown/${report.slug}`}
            className="group flex items-center gap-3 rounded-xl bg-kumo-base/80 py-2 pr-3 pl-2 text-left ring-1 ring-kumo-hairline hover:bg-kumo-base"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#1f6feb] text-sm font-semibold text-white">
              e/
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-kumo-strong">{report.profile.name}</span>
              <span className="text-xs text-kumo-subtle">
                {report.url} · {report.capturedAt}
              </span>
            </span>
            <ArrowRightIcon size={14} className="ml-3 text-kumo-subtle group-hover:text-kumo-strong" />
          </Link>
        </div>
      </div>
    </div>
  );
}
