"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Loader } from "@cloudflare/kumo";
import { ArrowUpIcon } from "@phosphor-icons/react";
import { Mark } from "../ui";
import { CONSOLE_TABS } from "../ConsoleView";
import Attachment from "./attachments";

/* Reveals an agent reply a couple of words at a time, then its cards. */
function AgentMessage({ message, report, onOpen, onSettled }) {
  const words = useMemo(() => message.text.split(" "), [message.text]);
  const [shown, setShown] = useState(message.stream ? 0 : words.length);
  const done = shown >= words.length;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setShown((n) => Math.min(words.length, n + 2)), 26);
    return () => clearTimeout(t);
  }, [done, shown, words.length]);

  useEffect(() => {
    onSettled?.();
  }, [shown, onSettled]);

  return (
    <div className="flex gap-3.5">
      <Mark className="mt-0.5 size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed text-kumo-default">
          {done ? message.text : words.slice(0, shown).join(" ")}
        </p>
        {done && message.attachments?.length > 0 && (
          <div className="mt-3 flex flex-col gap-2.5">
            {message.attachments.map((a, i) => (
              <div key={i} className="rise-in" style={{ animationDelay: `${i * 90}ms` }}>
                <Attachment attachment={a} report={report} onOpen={onOpen} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[80%] rounded-2xl rounded-br-md bg-kumo-recessed px-4 py-2.5 text-[15px] leading-relaxed text-kumo-strong">
        {message.text}
      </p>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3.5" aria-live="polite">
      <Mark className="size-6 shrink-0" />
      <span className="flex gap-1" aria-label="Thinking">
        <span className="thinking-dot size-1.5 rounded-full bg-kumo-subtle" />
        <span className="thinking-dot size-1.5 rounded-full bg-kumo-subtle" />
        <span className="thinking-dot size-1.5 rounded-full bg-kumo-subtle" />
      </span>
    </div>
  );
}

export default function Chat({ report, run, pending, tab, suggestions, onSend, onOpen, onSkip }) {
  const scroller = useRef(null);
  const stick = useRef(true);
  const [draft, setDraft] = useState("");
  const running = run.phase === "running";
  const tabMeta = CONSOLE_TABS.find((t) => t.value === tab);

  // Follow new content unless the reader has scrolled up to look at something.
  const settle = useCallback(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(settle, [run.messages.length, pending, settle]);

  function onScroll() {
    const el = scroller.current;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function submit(e) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || running) return;
    stick.current = true;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 px-4 pt-5 pb-8">
          <p className="text-xs text-kumo-subtle">
            {report.profile.name} · {report.url}. Ask for a change or a question; answers open in the console.
          </p>

          {run.messages.map((m) =>
            m.role === "user" ? (
              <UserMessage key={m.id} message={m} />
            ) : (
              <AgentMessage key={m.id} message={m} report={report} onOpen={onOpen} onSettled={settle} />
            ),
          )}
          {pending && <Thinking />}
        </div>
      </div>

      <div className="relative px-3 pb-3 before:pointer-events-none before:absolute before:inset-x-0 before:-top-10 before:h-10 before:bg-linear-to-t before:from-kumo-canvas before:to-transparent">
        <div>
          {running ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-kumo-base px-4 py-3 ring-1 ring-kumo-hairline">
              <span className="flex items-center gap-2.5 text-sm text-kumo-subtle">
                <Loader size="sm" /> Running the teardown…
              </span>
              <Button size="sm" variant="secondary" onClick={onSkip}>
                Skip to results
              </Button>
            </div>
          ) : (
            <>
              {suggestions.length > 0 && (
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        stick.current = true;
                        onSend(s);
                      }}
                      className="rounded-full bg-kumo-base px-3 py-1 text-[13px] text-kumo-strong ring-1 ring-kumo-hairline hover:bg-kumo-tint"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={submit}
                className="rounded-2xl bg-kumo-base p-2 shadow-[0_1px_2px_rgb(40_30_20/0.05),0_10px_30px_-14px_rgb(40_30_20/0.2)] ring-1 ring-kumo-line focus-within:ring-kumo-strong/40"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) submit(e);
                  }}
                  rows={1}
                  aria-label="Ask the teardown"
                  placeholder="Ask for a change or a question…"
                  className="field-sizing-content max-h-40 min-h-11 w-full resize-none bg-transparent px-2.5 pt-2 text-[15px] text-kumo-strong outline-none placeholder:text-kumo-placeholder"
                />
                <div className="flex items-center justify-between gap-2 pl-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-kumo-subtle">
                    {tabMeta && <tabMeta.icon size={13} />}
                    Asking with the {tabMeta?.label ?? "teardown"} tab in view
                  </span>
                  {pending ? (
                    <Loader size="sm" className="m-2" />
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      shape="circle"
                      size="sm"
                      disabled={!draft.trim()}
                      icon={<ArrowUpIcon size={14} weight="bold" />}
                      aria-label="Send"
                    />
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
