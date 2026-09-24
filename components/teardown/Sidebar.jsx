"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Tabs, cn } from "@cloudflare/kumo";
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
  SidebarSimpleIcon,
  SparkleIcon,
  StackIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react";

/* Every view the sidebar can show. Tab values are what the chat and panels
   pass to onOpen, so they stay stable even when labels change. */
export const SIDEBAR_TABS = [
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
export const SIDEBAR_STAGES = [
  { value: "context", n: 1, label: "Context", icon: StackIcon, tabs: ["journey", "data", "competitors"] },
  { value: "ideas", n: 2, label: "Issues & ideas", icon: LightbulbIcon, tabs: ["analysis", "ideas"] },
  { value: "test", n: 3, label: "Test", icon: RocketLaunchIcon, tabs: ["setup", "onboarding"] },
  { value: "workflow", label: "Workflow", icon: FlowArrowIcon, tabs: ["workflow"] },
];

export const stageOf = (tab) => SIDEBAR_STAGES.find((s) => s.tabs.includes(tab)) ?? SIDEBAR_STAGES[0];

export const SIDEBAR_MIN = 340;
export const SIDEBAR_DEFAULT = 460;
const SIDEBAR_MAX = 980;
const maxWidth = () => Math.min(Math.round(window.innerWidth * 0.64), SIDEBAR_MAX);
export const clampWidth = (w) => Math.max(SIDEBAR_MIN, Math.min(maxWidth(), Math.round(w)));

/* Below this width Workflow, when inactive, shows only its icon. */
const FULL_LABELS_AT = 640;

export default function Sidebar({ width, onWidthChange, tab, onTabChange, meta, onCollapse, mobile, hidden, children }) {
  const dragging = useRef(false);
  const body = useRef(null);
  const compact = !mobile && width < FULL_LABELS_AT;
  const stage = stageOf(tab);
  // The view last open in each stage, so switching stages comes back to it.
  const [lastView, setLastView] = useState({});
  if (lastView[stage.value] !== tab) setLastView((v) => ({ ...v, [stage.value]: tab }));

  // Each tab opens at its top.
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [tab]);

  function onPointerDown(e) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }
  function onPointerMove(e) {
    if (!dragging.current) return;
    // The sidebar hugs the right edge, so its width is the distance to it.
    onWidthChange(clampWidth(window.innerWidth - e.clientX));
  }
  function endDrag(e) {
    if (!dragging.current) return;
    dragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }
  function onKeyDown(e) {
    const step = e.shiftKey ? 80 : 24;
    if (e.key === "ArrowLeft") onWidthChange(clampWidth(width + step));
    else if (e.key === "ArrowRight") onWidthChange(clampWidth(width - step));
    else if (e.key === "Home") onWidthChange(clampWidth(SIDEBAR_DEFAULT));
    else return;
    e.preventDefault();
  }

  const stageTabs = SIDEBAR_STAGES.map(({ value, n, label, icon: Icon }) => {
    const active = value === stage.value;
    // The numbered stages always keep their names; only Workflow folds to an icon.
    const showLabel = !compact || active || n;
    return {
      value,
      label: (
        <span className="flex items-center gap-1.5" title={n ? `${n}. ${label}` : label}>
          {n ? (
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[10px] font-medium",
                active ? "bg-kumo-contrast text-white" : "bg-kumo-recessed text-kumo-subtle",
              )}
              aria-hidden="true"
            >
              {n}
            </span>
          ) : (
            <Icon size={15} weight={active ? "fill" : "regular"} aria-hidden="true" />
          )}
          {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
        </span>
      ),
    };
  });

  const viewTabs = stage.tabs.map((value) => {
    const { label, icon: Icon } = SIDEBAR_TABS.find((t) => t.value === value);
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
    <aside
      hidden={hidden}
      aria-label="Teardown details"
      style={mobile ? undefined : { width }}
      className={cn(
        "relative flex min-h-0 shrink-0 flex-col border-l border-kumo-hairline bg-kumo-base",
        mobile && "fixed inset-x-0 top-14 bottom-0 z-30 w-full border-l-0 shadow-[0_-8px_32px_rgb(40_30_20/0.12)]",
      )}
    >
      {!mobile && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          aria-valuenow={width}
          aria-valuemin={SIDEBAR_MIN}
          aria-valuemax={SIDEBAR_MAX}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          onDoubleClick={() => onWidthChange(clampWidth(SIDEBAR_DEFAULT))}
          className="group absolute inset-y-0 -left-1.5 z-10 w-3 cursor-col-resize outline-none"
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-kumo-line group-focus-visible:bg-kumo-strong group-active:bg-kumo-strong" />
          <span className="absolute top-1/2 left-1/2 h-8 w-1 -translate-1/2 rounded-full bg-kumo-line opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-kumo-hairline pr-2 pl-3">
        <Tabs
          variant="underline"
          size="sm"
          tabs={stageTabs}
          value={stage.value}
          onValueChange={(v) => {
            const next = SIDEBAR_STAGES.find((s) => s.value === v);
            onTabChange(lastView[v] ?? next.tabs[0]);
          }}
          className="min-w-0 flex-1"
          listClassName="h-12 gap-1 overflow-x-auto [scrollbar-width:none]"
        />
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          icon={<SidebarSimpleIcon size={16} className="-scale-x-100" />}
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          onClick={onCollapse}
        />
      </div>

      {(viewTabs.length > 1 || stageMeta) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-kumo-hairline px-3 py-2">
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
        {children}
      </div>
    </aside>
  );
}
