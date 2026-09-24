"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs } from "@cloudflare/kumo";
import {
  CameraIcon,
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  DatabaseIcon,
  FlaskIcon,
  FlowArrowIcon,
  LightbulbIcon,
  ListNumbersIcon,
  RocketLaunchIcon,
  SparkleIcon,
  StackIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

/* Every view the console can show. Tab values are what the chat and panels
   pass to onOpen, so they stay stable even when labels change. */
export const CONSOLE_TABS = [
  { value: "journey", label: "Journey", icon: CameraIcon },
  { value: "data", label: "Data", icon: DatabaseIcon },
  { value: "competitors", label: "Competitors", icon: UsersThreeIcon },
  { value: "analysis", label: "Issues", icon: ChartLineUpIcon },
  { value: "ideas", label: "Roadmap", icon: ListNumbersIcon },
  { value: "setup", label: "Setup", icon: FlaskIcon },
  { value: "onboarding", label: "Prototype", icon: SparkleIcon },
  { value: "workflow", label: "Workflow", icon: FlowArrowIcon },
];

/* The views grouped into the growth workflow a solo PM runs: build the
   context, turn issues into a ranked roadmap, then set up and launch a test.
   Workflow is the run log, so it sits last. */
export const CONSOLE_STAGES = [
  { value: "context", label: "Context", icon: StackIcon, tabs: ["journey", "data", "competitors"] },
  { value: "ideas", label: "Issues & ideas", icon: LightbulbIcon, tabs: ["analysis", "ideas"] },
  { value: "test", label: "Test", icon: RocketLaunchIcon, tabs: ["setup", "onboarding"] },
  { value: "workflow", label: "Workflow", icon: FlowArrowIcon, tabs: ["workflow"] },
];

const stageOf = (tab) => CONSOLE_STAGES.find((s) => s.tabs.includes(tab)) ?? CONSOLE_STAGES[0];

/* The main surface: stage tabs, the stage's views, and the active panel. */
export default function ConsoleView({ tab, onTabChange, meta, actions, children }) {
  const body = useRef(null);
  const stage = stageOf(tab);
  // The view last open in each stage, so switching stages comes back to it.
  const [lastView, setLastView] = useState({});
  if (lastView[stage.value] !== tab) setLastView((v) => ({ ...v, [stage.value]: tab }));

  // Each view opens at its top.
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [tab]);

  const stageTabs = CONSOLE_STAGES.map(({ value, label, icon: Icon }) => ({
    value,
    label: (
      <span className="flex items-center gap-1.5">
        <Icon size={15} weight={value === stage.value ? "fill" : "regular"} aria-hidden="true" />
        {label}
      </span>
    ),
  }));

  const viewTabs = stage.tabs.map((value) => {
    const { label, icon: Icon } = CONSOLE_TABS.find((t) => t.value === value);
    return {
      value,
      label: (
        <span className="flex items-center gap-1.5">
          <Icon size={13} weight={value === tab ? "fill" : "regular"} aria-hidden="true" />
          {label}
        </span>
      ),
    };
  });
  const stageMeta = meta?.[stage.value];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-kumo-hairline px-3 sm:px-4">
        <Tabs
          variant="underline"
          size="sm"
          tabs={stageTabs}
          value={stage.value}
          onValueChange={(v) => onTabChange(lastView[v] ?? CONSOLE_STAGES.find((s) => s.value === v).tabs[0])}
          className="min-w-0 flex-1"
          listClassName="h-12 gap-1 overflow-x-auto border-b-0 [scrollbar-width:none]"
        />
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {(viewTabs.length > 1 || stageMeta) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-kumo-hairline px-3 py-2 sm:px-4">
          {viewTabs.length > 1 && (
            <Tabs variant="segmented" size="sm" tabs={viewTabs} value={tab} onValueChange={onTabChange} />
          )}
          {stageMeta && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-kumo-subtle">
              <ClockCounterClockwiseIcon size={13} aria-hidden="true" />
              {stageMeta}
            </span>
          )}
        </div>
      )}

      <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-5xl px-0 pb-10 lg:px-4">{children}</div>
      </div>
    </div>
  );
}
