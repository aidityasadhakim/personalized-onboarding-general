"use client";

import { useEffect, useRef } from "react";
import { Button, Tabs, cn } from "@cloudflare/kumo";
import {
  BuildingsIcon,
  FlowArrowIcon,
  CameraIcon,
  ChartLineUpIcon,
  LightbulbIcon,
  SparkleIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";

export const SIDEBAR_TABS = [
  { value: "profile", label: "Profile", icon: BuildingsIcon },
  { value: "workflow", label: "Workflow", icon: FlowArrowIcon },
  { value: "journey", label: "Journey", icon: CameraIcon },
  { value: "analysis", label: "Analysis", icon: ChartLineUpIcon },
  { value: "ideas", label: "Ideas", icon: LightbulbIcon },
  { value: "onboarding", label: "Onboarding", icon: SparkleIcon },
];

export const SIDEBAR_MIN = 340;
export const SIDEBAR_DEFAULT = 460;
const SIDEBAR_MAX = 980;
const maxWidth = () => Math.min(Math.round(window.innerWidth * 0.64), SIDEBAR_MAX);
export const clampWidth = (w) => Math.max(SIDEBAR_MIN, Math.min(maxWidth(), Math.round(w)));

/* Below this width only the active tab keeps its label; the rest are icons. */
const FULL_LABELS_AT = 640;

export default function Sidebar({ width, onWidthChange, tab, onTabChange, onCollapse, mobile, hidden, children }) {
  const dragging = useRef(false);
  const body = useRef(null);
  const compact = !mobile && width < FULL_LABELS_AT;

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

  const tabs = SIDEBAR_TABS.map(({ value, label, icon: Icon }) => {
    const showLabel = !compact || value === tab;
    return {
      value,
      label: (
        <span className="flex items-center gap-1.5" title={label}>
          <Icon size={15} weight={value === tab ? "fill" : "regular"} aria-hidden="true" />
          {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
        </span>
      ),
    };
  });

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
          tabs={tabs}
          value={tab}
          onValueChange={onTabChange}
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

      <div ref={body} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </aside>
  );
}
