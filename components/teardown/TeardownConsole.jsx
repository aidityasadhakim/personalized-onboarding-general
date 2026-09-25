"use client";

import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge, Button, DropdownMenu, Toasty, TooltipProvider, cn } from "@cloudflare/kumo";
import { CaretDownIcon, ChatCircleIcon, CheckIcon, PlusIcon, SidebarSimpleIcon, XIcon } from "@phosphor-icons/react";
import { applyEvent, buildTimeline, completedState, initialRunState, messageId } from "@/lib/teardown/timeline";
import { replyTo, suggestionsFor } from "@/lib/teardown/replies";
import { initialIdeas } from "@/lib/teardown/roadmap";
import { Mark, Wordmark } from "./ui";
import Sidebar, { SIDEBAR_DEFAULT } from "./Sidebar";
import ConsoleView from "./ConsoleView";
import Chat from "./chat/Chat";
import StartHero from "./chat/StartHero";
import JourneyPanel from "./panels/JourneyPanel";
import DataPanel from "./panels/DataPanel";
import CompetitorsPanel from "./panels/CompetitorsPanel";
import AnalysisPanel from "./panels/AnalysisPanel";
import IdeasPanel from "./panels/IdeasPanel";
import MockupsPanel from "./panels/MockupsPanel";
import OnboardingPanel from "./panels/OnboardingPanel";
import WorkflowPanel from "./panels/WorkflowPanel";

/* The line under each stage's views: when it was last refreshed, or the last
   test that ran. */
function stageMeta(report, run) {
  if (run.phase !== "done") return null;
  const t = report.lastTestRun;
  return {
    context: `Last refreshed ${report.capturedAt}`,
    ideas: `Last refreshed ${report.capturedAt}`,
    test: `Last test run: ${t.card} ${t.result} ${t.metric} · ${t.date}`,
  };
}

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

function Avatar() {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-kumo-contrast text-[11px] font-medium text-white" aria-label="Signed in as CW">
      CW
    </span>
  );
}

/* The start screen's header. Once a run starts, the wordmark moves to the top
   of the chat column and the status to the console toolbar. */
function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-kumo-hairline bg-kumo-canvas/80 px-4 backdrop-blur sm:px-5">
      <Link href="/" className="shrink-0" aria-label="Funnel OS home">
        <Wordmark />
      </Link>
      <div className="ml-auto">
        <Avatar />
      </div>
    </header>
  );
}

function ChatHeader({ report, onRestart, mobile, onClose, onCollapse }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 px-4">
      <Link href="/" className="shrink-0" onClick={onRestart} aria-label="Funnel OS home">
        <Wordmark />
      </Link>
      <span className="h-5 w-px bg-kumo-line" aria-hidden="true" />
      <DropdownMenu>
        <DropdownMenu.Trigger
          render={(p) => (
            <Button {...p} variant="ghost" size="sm" className="min-w-0 gap-1.5">
              <span className="truncate">{report.profile.name}</span>
              <CaretDownIcon size={12} className="shrink-0 text-kumo-subtle" />
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
      {mobile ? (
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          className="ml-auto"
          icon={<XIcon size={16} />}
          aria-label="Back to the console"
          onClick={onClose}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          className="ml-auto"
          icon={<SidebarSimpleIcon size={18} />}
          aria-label="Collapse chat"
          title="Collapse chat"
          onClick={onCollapse}
        />
      )}
    </div>
  );
}

export default function TeardownConsole({ report, start = "idle" }) {
  const [run, dispatch] = useReducer(runReducer, null, () =>
    start === "done" ? completedState(report) : initialRunState(),
  );
  const [tab, setTab] = useState(start === "done" ? "journey" : "workflow");
  // The roadmap: which cards are on it, their order, status, and mockups.
  // Shared by Journey, Issues, Roadmap, and Mockups.
  const [ideas, setIdeas] = useState(() => initialIdeas(report));
  // The mockup picked under Test › Mockups; Preview plays it.
  const [mock, setMock] = useState("A");
  const [focus, setFocus] = useState(null);
  const [width, setWidth] = useState(SIDEBAR_DEFAULT);
  // On desktop the chat can fold away, like ChatGPT's sidebar.
  const [chatOpen, setChatOpen] = useState(true);
  // Phones show one surface at a time; the chat opens as a sheet.
  const [mobileChat, setMobileChat] = useState(false);
  const [pending, setPending] = useState(false);
  const replyTimer = useRef(null);
  const isMobile = useIsMobile();

  const timeline = useMemo(() => (run.url ? buildTimeline(report, run.url) : []), [report, run.url]);

  // When a run finishes (or is skipped), leave the log and open the
  // workflow at its start: Context.
  const [seenPhase, setSeenPhase] = useState(run.phase);
  if (run.phase !== seenPhase) {
    setSeenPhase(run.phase);
    if (run.phase === "done") {
      setTab("journey");
      setFocus(null);
    }
  }

  // Replay the scripted run one event at a time.
  useEffect(() => {
    if (run.phase !== "running" || run.cursor >= timeline.length) return;
    const event = timeline[run.cursor];
    const t = setTimeout(() => dispatch({ type: "advance", event }), event.delay);
    return () => clearTimeout(t);
  }, [run.phase, run.cursor, timeline]);

  useEffect(() => () => clearTimeout(replyTimer.current), []);

  function openTab(next, focusId = null) {
    setTab(next);
    setFocus(focusId);
    // On phones the chat covers the console, so step aside to show the view.
    setMobileChat(false);
  }

  function send(text) {
    if (pending) return;
    dispatch({ type: "say", message: { role: "user", text } });
    setPending(true);
    replyTimer.current = setTimeout(() => {
      const reply = replyTo(text, report, tab);
      dispatch({ type: "say", message: { role: "agent", stream: true, text: reply.text, attachments: reply.attachments } });
      setPending(false);
      if (reply.tab) {
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
    setIdeas(initialIdeas(report));
    setMock("A");
    setTab("workflow");
    setFocus(null);
    setMobileChat(false);
  }

  const panelProps = { report, run, focus, onOpen: openTab, onAsk: send, onRestart: restart };
  const ideaProps = { ideas, onIdeasChange: setIdeas };
  const chatHidden = isMobile ? !mobileChat : !chatOpen;
  const captureStarted = run.captured.length > 0;

  if (run.phase === "idle") {
    return (
      <Toasty>
        <TooltipProvider>
          <div className="flex h-dvh flex-col bg-kumo-canvas">
            <Header />
            <main className="min-h-0 flex-1">
              <StartHero report={report} onRun={startRun} />
            </main>
          </div>
        </TooltipProvider>
      </Toasty>
    );
  }

  const status =
    run.phase === "done" ? (
      <Badge variant="success" appearance="dot">Teardown complete</Badge>
    ) : (
      <Badge variant="warning" appearance="dot">Running</Badge>
    );

  return (
    <Toasty>
      <TooltipProvider>
        <div className="flex h-dvh bg-kumo-canvas">
          <Sidebar
            hidden={chatHidden}
            width={width}
            onWidthChange={setWidth}
            mobile={isMobile}
            header={
              <ChatHeader
                report={report}
                onRestart={restart}
                mobile={isMobile}
                onClose={() => setMobileChat(false)}
                onCollapse={() => setChatOpen(false)}
              />
            }
          >
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
          </Sidebar>

          {/* The console is the main surface: an inset pane beside the chat,
              like the preview in AI Studio or Lovable. */}
          <main className={cn("min-w-0 flex-1 md:py-2 md:pr-2", !chatOpen && "md:pl-2")}>
            <div className="h-full overflow-hidden bg-kumo-base md:rounded-xl md:shadow-[0_1px_2px_rgb(40_30_20/0.05)] md:ring-1 md:ring-kumo-hairline">
              <ConsoleView
                tab={tab}
                meta={stageMeta(report, run)}
                leading={
                  !isMobile &&
                  !chatOpen && (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        shape="square"
                        icon={<SidebarSimpleIcon size={18} />}
                        aria-label="Open chat"
                        title="Open chat"
                        onClick={() => setChatOpen(true)}
                      />
                      <Mark className="size-5" />
                      <span className="mr-1 h-5 w-px bg-kumo-line" aria-hidden="true" />
                    </span>
                  )
                }
                onTabChange={(t) => {
                  setTab(t);
                  setFocus(null);
                }}
                actions={
                  <>
                    <span className="hidden lg:block">{status}</span>
                    {isMobile && (
                      <Button
                        variant="secondary"
                        size="sm"
                        shape="square"
                        icon={<ChatCircleIcon size={16} />}
                        aria-label="Open chat"
                        onClick={() => setMobileChat(true)}
                      />
                    )}
                    <Avatar />
                  </>
                }
              >
                {/* Panels stay mounted so decisions (approvals, sources, wins)
                    survive switching views; only the active one is visible. */}
                <div hidden={tab !== "journey"}>
                  <JourneyPanel {...panelProps} {...ideaProps} focus={tab === "journey" ? focus : null} />
                </div>
                <div hidden={tab !== "data"}>
                  <DataPanel {...panelProps} ready={captureStarted} />
                </div>
                <div hidden={tab !== "competitors"}>
                  <CompetitorsPanel {...panelProps} ready={captureStarted && tab === "competitors"} />
                </div>
                <div hidden={tab !== "analysis"}>
                  <AnalysisPanel {...panelProps} {...ideaProps} focus={tab === "analysis" ? focus : null} />
                </div>
                <div hidden={tab !== "ideas"}>
                  <IdeasPanel {...panelProps} {...ideaProps} />
                </div>
                <div hidden={tab !== "setup"}>
                  <MockupsPanel {...panelProps} {...ideaProps} mock={mock} onMockChange={setMock} />
                </div>
                <div hidden={tab !== "onboarding"}>
                  <OnboardingPanel {...panelProps} mock={mock} />
                </div>
                <div hidden={tab !== "workflow"}>
                  <WorkflowPanel {...panelProps} />
                </div>
              </ConsoleView>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </Toasty>
  );
}
