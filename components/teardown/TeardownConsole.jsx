"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge, Button, DropdownMenu, Toasty, TooltipProvider } from "@cloudflare/kumo";
import { CaretDownIcon, CheckIcon, PlusIcon, SidebarSimpleIcon } from "@phosphor-icons/react";
import { applyEvent, buildTimeline, completedState, initialRunState, messageId } from "@/lib/teardown/timeline";
import { replyTo, suggestionsFor } from "@/lib/teardown/replies";
import { Wordmark } from "./ui";
import Sidebar, { SIDEBAR_DEFAULT, clampWidth } from "./Sidebar";
import Chat from "./chat/Chat";
import StartHero from "./chat/StartHero";
import ProfilePanel from "./panels/ProfilePanel";
import WorkflowPanel from "./panels/WorkflowPanel";
import JourneyPanel from "./panels/JourneyPanel";
import AnalysisPanel from "./panels/AnalysisPanel";
import IdeasPanel from "./panels/IdeasPanel";
import OnboardingPanel from "./panels/OnboardingPanel";

const PROTOTYPE_WIDTH = 640;

function runReducer(state, action) {
  switch (action.type) {
    case "start":
      return { ...initialRunState(action.url), phase: "running" };
    case "advance":
      return { ...applyEvent(state, action.event), cursor: state.cursor + 1 };
    case "skip":
      return action.events.slice(state.cursor).reduce(applyEvent, { ...state, cursor: action.events.length });
    case "say":
      return {
        ...state,
        messages: [...state.messages, { id: messageId(state.messages), ...action.message }],
      };
    case "reset":
      return initialRunState();
    default:
      return state;
  }
}

const mobileQuery = "(max-width: 767px)";
function subscribeMobile(cb) {
  const mq = window.matchMedia(mobileQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useIsMobile = () =>
  useSyncExternalStore(subscribeMobile, () => window.matchMedia(mobileQuery).matches, () => false);

function Header({ report, run, sidebarOpen, onToggleSidebar, onRestart }) {
  const status =
    run.phase === "done" ? (
      <Badge variant="success" appearance="dot">Teardown complete</Badge>
    ) : run.phase === "running" ? (
      <Badge variant="warning" appearance="dot">Running</Badge>
    ) : null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-kumo-hairline bg-kumo-canvas/80 px-4 backdrop-blur sm:px-5">
      <Link href="/teardown" className="shrink-0" onClick={onRestart} aria-label="Funnel OS home">
        <Wordmark />
      </Link>

      {run.phase !== "idle" && (
        <>
          <span className="h-5 w-px bg-kumo-line" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={(p) => (
                <Button {...p} variant="ghost" size="sm" className="gap-1.5">
                  {report.profile.name}
                  <CaretDownIcon size={12} className="text-kumo-subtle" />
                </Button>
              )}
            />
            <DropdownMenu.Content>
              <DropdownMenu.Item icon={<CheckIcon size={14} />}>
                {report.profile.name} · {report.url}
              </DropdownMenu.Item>
              <DropdownMenu.Item icon={<PlusIcon size={14} />} onClick={onRestart}>
                New teardown
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:block">{status}</span>
        <Button
          variant={sidebarOpen ? "ghost" : "secondary"}
          size="sm"
          shape="square"
          icon={<SidebarSimpleIcon size={16} className="-scale-x-100" weight={sidebarOpen ? "fill" : "regular"} />}
          aria-label={sidebarOpen ? "Hide details" : "Show details"}
          aria-pressed={sidebarOpen}
          title={sidebarOpen ? "Hide details" : "Show details"}
          onClick={onToggleSidebar}
        />
        <span className="flex size-7 items-center justify-center rounded-full bg-kumo-contrast text-[11px] font-medium text-white" aria-label="Signed in as CW">
          CW
        </span>
      </div>
    </header>
  );
}

export default function TeardownConsole({ report, start = "idle" }) {
  const [run, dispatch] = useReducer(runReducer, null, () =>
    start === "done" ? completedState(report) : initialRunState(),
  );
  const [tab, setTab] = useState(start === "done" ? "analysis" : "workflow");
  const [focus, setFocus] = useState(null);
  const [width, setWidth] = useState(SIDEBAR_DEFAULT);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const replyTimer = useRef(null);
  const isMobile = useIsMobile();
  const sidebarOpen = isMobile ? mobileOpen : !collapsed;

  const timeline = useMemo(() => (run.url ? buildTimeline(report, run.url) : []), [report, run.url]);

  // Replay the scripted run one event at a time.
  useEffect(() => {
    if (run.phase !== "running" || run.cursor >= timeline.length) return;
    const event = timeline[run.cursor];
    const t = setTimeout(() => dispatch({ type: "advance", event }), event.delay);
    return () => clearTimeout(t);
  }, [run.phase, run.cursor, timeline]);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  function showSidebar() {
    if (isMobile) setMobileOpen(true);
    else setCollapsed(false);
  }

  function openTab(next, focusId = null) {
    setTab(next);
    setFocus(focusId);
    showSidebar();
    if (next === "onboarding" && !isMobile) setWidth((w) => Math.max(w, clampWidth(PROTOTYPE_WIDTH)));
  }

  function send(text) {
    if (pending) return;
    dispatch({ type: "say", message: { role: "user", text } });
    setPending(true);
    replyTimer.current = setTimeout(() => {
      const reply = replyTo(text, report, tab);
      dispatch({ type: "say", message: { role: "agent", stream: true, text: reply.text, attachments: reply.attachments } });
      setPending(false);
      if (reply.tab && !isMobile) {
        // An answer about one issue opens that issue, not just the tab.
        const issue = reply.tab === "analysis" && reply.attachments?.find((a) => a.type === "issue");
        setTab(reply.tab);
        setFocus(issue ? issue.id : null);
      }
    }, 750);
  }

  function startRun(host) {
    dispatch({ type: "start", url: host });
    setTab("workflow");
    setFocus(null);
  }

  function restart() {
    clearTimeout(replyTimer.current);
    setPending(false);
    dispatch({ type: "reset" });
    setTab("workflow");
    setFocus(null);
  }

  const panelProps = { report, run, focus, onOpen: openTab, onAsk: send, onRestart: restart };
  const captureStarted = run.captured.length > 0;

  return (
    <Toasty>
      <TooltipProvider>
        <div className="flex h-dvh flex-col bg-kumo-canvas">
          <Header
            report={report}
            run={run}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => (isMobile ? setMobileOpen((o) => !o) : setCollapsed((c) => !c))}
            onRestart={restart}
          />
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1">
              {run.phase === "idle" ? (
                <StartHero report={report} onRun={startRun} />
              ) : (
                <Chat
                  report={report}
                  run={run}
                  pending={pending}
                  tab={tab}
                  suggestions={run.phase === "done" && !pending ? suggestionsFor[tab] : []}
                  onSend={send}
                  onOpen={openTab}
                  onSkip={() => dispatch({ type: "skip", events: timeline })}
                />
              )}
            </main>

            <Sidebar
              hidden={!sidebarOpen}
              width={width}
              onWidthChange={setWidth}
              tab={tab}
              onTabChange={(t) => {
                setTab(t);
                setFocus(null);
                if (t === "onboarding" && !isMobile) setWidth((w) => Math.max(w, clampWidth(PROTOTYPE_WIDTH)));
              }}
              onCollapse={() => (isMobile ? setMobileOpen(false) : setCollapsed(true))}
              mobile={isMobile}
            >
              {/* Panels stay mounted so decisions (approvals, sources, wins)
                  survive switching tabs; only the active one is visible. */}
              <div hidden={tab !== "profile"}>
                <ProfilePanel {...panelProps} ready={captureStarted} />
              </div>
              <div hidden={tab !== "workflow"}>
                <WorkflowPanel {...panelProps} />
              </div>
              <div hidden={tab !== "journey"}>
                <JourneyPanel {...panelProps} focus={tab === "journey" ? focus : null} />
              </div>
              <div hidden={tab !== "analysis"}>
                <AnalysisPanel {...panelProps} focus={tab === "analysis" ? focus : null} />
              </div>
              <div hidden={tab !== "ideas"}>
                <IdeasPanel {...panelProps} />
              </div>
              <div hidden={tab !== "onboarding"}>
                <OnboardingPanel {...panelProps} />
              </div>
            </Sidebar>
          </div>
        </div>
      </TooltipProvider>
    </Toasty>
  );
}
