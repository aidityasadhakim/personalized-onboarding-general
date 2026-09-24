"use client";

import { useRef } from "react";
import { Button, cn } from "@cloudflare/kumo";
import { ChatCircleIcon, SidebarSimpleIcon } from "@phosphor-icons/react";

export const SIDEBAR_MIN = 320;
export const SIDEBAR_DEFAULT = 400;
const SIDEBAR_MAX = 640;
const maxWidth = () => Math.min(Math.round(window.innerWidth * 0.5), SIDEBAR_MAX);
export const clampWidth = (w) => Math.max(SIDEBAR_MIN, Math.min(maxWidth(), Math.round(w)));

/* The chat rail beside the console: resizable from its left edge, collapsible,
   and a full-height sheet on phones. */
export default function Sidebar({ width, onWidthChange, onCollapse, mobile, hidden, children }) {
  const dragging = useRef(false);

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

  return (
    <aside
      hidden={hidden}
      aria-label="Chat"
      style={mobile ? undefined : { width }}
      className={cn(
        "relative flex min-h-0 shrink-0 flex-col border-l border-kumo-hairline bg-kumo-canvas",
        mobile && "fixed inset-x-0 top-14 bottom-0 z-30 w-full border-l-0 shadow-[0_-8px_32px_rgb(40_30_20/0.12)]",
      )}
    >
      {!mobile && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize chat"
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

      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-kumo-hairline pr-2 pl-4">
        <ChatCircleIcon size={15} className="text-kumo-subtle" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium text-kumo-strong">Chat</span>
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          icon={<SidebarSimpleIcon size={16} className="-scale-x-100" />}
          aria-label="Hide chat"
          title="Hide chat"
          onClick={onCollapse}
        />
      </div>

      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
