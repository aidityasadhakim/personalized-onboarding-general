"use client";

import { useRef } from "react";
import { cn } from "@cloudflare/kumo";

export const SIDEBAR_MIN = 320;
export const SIDEBAR_DEFAULT = 400;
const SIDEBAR_MAX = 600;
const maxWidth = () => Math.min(Math.round(window.innerWidth * 0.45), SIDEBAR_MAX);
export const clampWidth = (w) => Math.max(SIDEBAR_MIN, Math.min(maxWidth(), Math.round(w)));

/* The chat column on the left, like the prompt rail in AI Studio or Lovable.
   It is always there on desktop and resizes from its right edge; on phones it
   is a full-screen sheet over the console. */
export default function Sidebar({ width, onWidthChange, header, mobile, hidden, children }) {
  const dragging = useRef(false);

  function onPointerDown(e) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }
  function onPointerMove(e) {
    if (!dragging.current) return;
    // The column hugs the left edge, so its width is the pointer's x.
    onWidthChange(clampWidth(e.clientX));
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
    if (e.key === "ArrowRight") onWidthChange(clampWidth(width + step));
    else if (e.key === "ArrowLeft") onWidthChange(clampWidth(width - step));
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
        "relative flex min-h-0 shrink-0 flex-col bg-kumo-canvas",
        mobile && "fixed inset-0 z-30 w-full",
      )}
    >
      {header}
      <div className="min-h-0 flex-1">{children}</div>

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
          className="group absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize outline-none"
        >
          <span className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-transparent group-hover:bg-kumo-line group-focus-visible:bg-kumo-strong group-active:bg-kumo-strong" />
          <span className="absolute top-1/2 left-1/2 h-8 w-1 -translate-1/2 rounded-full bg-kumo-line opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
        </div>
      )}
    </aside>
  );
}
