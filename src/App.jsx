import {
  Component,
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { toast } from "react-hot-toast";

import LoginScreen from "./screens/LoginScreen.jsx";
import ProjectsScreen from "./screens/ProjectsScreen.jsx";
import ProjectScreen from "./screens/ProjectScreen.jsx";
import ReviewScreen from "./screens/ReviewScreen.jsx";
import DashboardsScreen from "./screens/DashboardsScreen.jsx";
import MediaMeasurementScreen from "./screens/MediaMeasurementScreen.jsx";
import MediaMonitoringScreen from "./screens/MediaMonitoringScreenV2.jsx";
import PRImpactScreen from "./screens/PRImpactScreen.jsx";
import NarrativeScreen from "./screens/NarrativeScreen.jsx";
import ReputationScreen from "./screens/ReputationScreen.jsx";
import WorkflowScreen from "./screens/WorkflowScreen.jsx";
import SandboxScreen from "./screens/SandboxScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import BuilderScreen from "./screens/BuilderScreen.jsx";
import WorkflowStudioScreen from "./screens/WorkflowStudioScreen.jsx";
// Consumer Intelligence dashboards (ported from ConsumerIntelligence_PR).
import TrendIntelligenceScreen from "./screens/TrendIntelligenceScreen.jsx";
import BrandCompetitiveScreen from "./screens/BrandCompetitiveScreen.jsx";
import BrandIntelligenceScreen from "./screens/BrandIntelligenceScreen.jsx";
import MarketIntelligenceScreen from "./screens/MarketIntelligenceScreen.jsx";
import IntelLensScreen from "./screens/IntelLensScreen.jsx";
import NetworkMapScreen from "./screens/NetworkMapScreen.jsx";
import BrandHealthScreen from "./screens/BrandHealthScreen.jsx";
import TrackEmergingIssuesScreen from "./screens/TrackEmergingIssuesScreen.jsx";
import ShiftingAudiencePrioritiesScreen from "./screens/ShiftingAudiencePrioritiesScreen.jsx";

function isAuthenticated() {
  const token = localStorage.getItem("auth_token");
  return Boolean(token && token !== "null" && token !== "undefined");
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function NotFoundRedirect() {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to="/login" replace />;
}
import { BellIcon, MoonIcon, SunIcon } from "./components/Icons.jsx";
import CanvasTabBar from "./components/canvas/CanvasTabBar.jsx";
import { Toaster } from "react-hot-toast";
import {
  paths,
  loadProject,
  loadSession,
  useResolved,
  useCharts,
  seedCharts,
  seedSession,
} from "./router/nav.js";
import ShaderBg from "./components/backgrounds/ShaderBg.jsx";
import { useThemes } from "./store/useThemes.js";
import { setupAuthRefreshLoop, logoutUser } from "./api/auth.js";
import UserAvatar from "./components/UserAvatar.jsx";
import logoImg from "./assets/images/image.png";
import {
  restoreNodes,
  restoreEdges,
  hasSavedGraph,
  seedNodes,
  MM_REVIEW_COLUMNS,
  OTHER_REVIEW_COLUMNS,
} from "./workflow/workflowUtils.js";
import { listSessions } from "./api/sessions.js";
import { cn } from "./lib/utils";

// Dashboard tabs shown in the topbar while inside a project's dashboards.
const DASH_TABS = [
  { key: "home", label: "Home", build: paths.dashboards },
  {
    key: "media_monitoring",
    label: "Daily Monitoring",
    build: paths.monitoring,
  },
  {
    key: "media_measurement",
    label: "Media Measurement",
    build: paths.measurement,
  },
  {
    key: "narrative_intelligence",
    label: "Narrative Intelligence",
    build: paths.narrative,
  },
  {
    key: "pr_impact",
    label: "PR Impact",
    build: paths.primpact,
  },
  {
    key: "reputation_index",
    label: "Reputation Index",
    build: paths.reputation,
  },
];

/* ---------- theme (app-global) ---------- */
const ThemeCtx = createContext({ theme: "light", toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

function ThemeProvider({ children }) {
  const dark = useThemes((state) => state.dark);
  const setDark = useThemes((state) => state.setDark);
  const theme = dark ? "dark" : "light";
  const toggle = () => setDark(!dark);
  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
  );
}

function Loading() {
  return (
    <div className="state">
      <span className="loader" />
      <p>Loading…</p>
    </div>
  );
}

class SafeImportErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    const errorMsg = String(error?.message || error || "");
    const isModuleError =
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.includes("Importing a module script failed") ||
      errorMsg.includes("Loading chunk");

    if (isModuleError) {
      console.warn(
        "Dynamic import failed, reloading to sync Vite modules...",
        error,
      );
      const lastReload = sessionStorage.getItem("auto_chunk_reload");
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem("auto_chunk_reload", String(now));
        window.location.reload(true);
      }
    } else {
      console.error("[SafeImportErrorBoundary] Component render error:", error);
    }
  }
  render() {
    if (this.state.hasError) {
      return <Loading />;
    }
    return this.props.children;
  }
}

/** Wraps a lazy screen with Suspense so it shows a spinner while its chunk loads */
function ScreenLoader({ children }) {
  return (
    <SafeImportErrorBoundary>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </SafeImportErrorBoundary>
  );
}

/* ---------- shared page chrome (topbar + main) ---------- */
function Shell({
  project,
  projectId,
  sessionId,
  session,
  chartsData,
  activeTab,
  wide,
  children,
  onCanvasTabChange,
}) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const inDash = !!activeTab;

  const pName = project?.name;

  const { pathname } = useLocation();
  console.log({ pathname });

  const PROC_IDLE = {
    active: false,
    stage: null,
    status: "",
    detail: "",
    progress: null,
  };

  const getScreenFromPath = (path) => {
    if (path.includes("/sessions")) return "v2-sessions";
    if (path.includes("/tagging/")) return "v2-tagging";
    if (path.includes("/dashboards/")) return "v2-dashboards";
    if (path.includes("/dashboard-v2/")) return "v2-dashboard";
    if (path.includes("/landing")) return "landing";
    if (path.includes("/dashboard")) return "dashboard";
    if (path.includes("/taggging")) return "tagging";
    if (path.includes("/sandbox")) return "sandbox";
    return "projects";
  };

  const initialScreen = getScreenFromPath(pathname);

  const [screen, setScreen] = useState(initialScreen);

  const [processing, setProcessing] = useState(PROC_IDLE);
  const [layoutTheme, setLayoutTheme] = useState(() => {
    return localStorage.getItem("dashboard_template_mode") || "gallery";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const mode = localStorage.getItem("dashboard_template_mode") || "gallery";
      setLayoutTheme(mode);
    };
    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 200);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);
  console.time("app rendering");
  console.timeEnd("app rendering");
  console.log({ cookie: decodeURIComponent(document.cookie) });

  return (
    <div className={`page ${inDash ? `layout-theme-${layoutTheme}` : ""}`}>
      {(screen === "landing" ||
        screen === "projects" ||
        screen === "tagging" ||
        screen === "v2-sessions" ||
        screen === "v2-tagging" ||
        screen === "v2-dashboards" ||
        screen === "sandbox") &&
        !inDash && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background:
                "linear-gradient(180deg, #FFFFFF 0%, #FDFCFF 40%, #F8F4FF 75%, #F5F0FF 100%)",
              zIndex: 0,
            }}
          >
            <ShaderBg intensity={150} speed={0.4} dark={false} />
            {/* Purple aura — left edge, full height */}
            <div
              style={{
                position: "absolute",
                width: "900px",
                height: "140%",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(139, 53, 214, 0.42) 0%, rgba(139, 53, 214, 0.18) 45%, transparent 70%)",
                top: "-20%",
                left: "-18%",
                filter: "blur(90px)",
                pointerEvents: "none",
                animation: "landingAuraPulse 28s ease-in-out infinite",
                animationDelay: "0s",
              }}
            />
            {/* Orange aura — right edge, full height */}
            <div
              style={{
                position: "absolute",
                width: "800px",
                height: "130%",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(240, 112, 32, 0.38) 0%, rgba(240, 112, 32, 0.16) 45%, transparent 70%)",
                top: "-15%",
                right: "-16%",
                filter: "blur(100px)",
                pointerEvents: "none",
                animation: "landingAuraFloat 32s ease-in-out infinite",
                animationDelay: "6s",
              }}
            />
            {/* Center blend — purple-pink where the two auras meet */}
            <div
              style={{
                position: "absolute",
                width: "600px",
                height: "120%",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(190, 70, 140, 0.18) 0%, transparent 65%)",
                top: "-10%",
                left: "35%",
                filter: "blur(80px)",
                pointerEvents: "none",
                animation: "landingAuraBlend 24s ease-in-out infinite",
                animationDelay: "12s",
              }}
            />
            {/* Top purple highlight so header isn't blank */}
            <div
              style={{
                position: "absolute",
                width: "700px",
                height: "500px",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(139, 53, 214, 0.22) 0%, rgba(139, 53, 214, 0.08) 50%, transparent 70%)",
                top: "-15%",
                left: "5%",
                filter: "blur(100px)",
                pointerEvents: "none",
                animation: "landingAuraPulse 36s ease-in-out infinite",
                animationDelay: "18s",
              }}
            />
            {/* Top orange highlight — right side header */}
            <div
              style={{
                position: "absolute",
                width: "600px",
                height: "450px",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(240, 112, 32, 0.18) 0%, rgba(240, 112, 32, 0.07) 50%, transparent 70%)",
                top: "-12%",
                right: "8%",
                filter: "blur(110px)",
                pointerEvents: "none",
                animation: "landingAuraFloat 40s ease-in-out infinite",
                animationDelay: "24s",
              }}
            />
          </div>
        )}

      {inDash &&
        layoutTheme !== "editorial" &&
        layoutTheme !== "impact" &&
        layoutTheme !== "sense" && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 0,
              pointerEvents: "none",
              background: `
  radial-gradient(circle at 12% 18%, rgba(124,58,237,0.14) 30%, transparent 45%),
  radial-gradient(circle at 88% 15%, rgba(59,130,246,0.12) 50%, transparent 50%),
  radial-gradient(circle at 85% 85%, rgba(16,185,129,0.10) 60%, transparent 55%),
  radial-gradient(circle at 20% 85%, rgba(236,72,153,0.08) 80%, transparent 55%),
  linear-gradient(
    180deg,
    #FEFEFF 0%,
    #FAFBFF 30%,
    #F5F7FF 65%,
    #F2F4FF 100%
  )
`,
            }}
          />
        )}

      {((!inDash &&
        (pathname.includes("/review") || pathname.includes("/dashboards"))) ||
        (layoutTheme !== "editorial" &&
          !pathname?.includes("monitoring") &&
          layoutTheme !== "merger" &&
          layoutTheme !== "bento" &&
          layoutTheme !== "glass" &&
          layoutTheme !== "impact" &&
          layoutTheme !== "sense")) && (
        <header
          className={`topbar ${layoutTheme === "editorial" ? "topbar--editorial" : layoutTheme === "merger" ? "topbar--merger" : ""}`}
        >
          {inDash &&
          layoutTheme !== "editorial" &&
          layoutTheme !== "merger" &&
          layoutTheme !== "bento" &&
          layoutTheme !== "glass" &&
          layoutTheme !== "impact" &&
          layoutTheme !== "sense" ? (
            <CanvasTabBar
              activeTab={activeTab}
              onTabChange={(tab) => setScreen(tab)}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "10px",
                width: "100%",
              }}
            >
              <div
                className="brand"
                onClick={() => {
                  if (onCanvasTabChange) {
                    const allowed = onCanvasTabChange("home");
                    if (allowed === false) return;
                  }
                  navigate("/");
                }}
                style={{
                  cursor: "pointer",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <img
                  src={logoImg}
                  alt="InfoVision Logo"
                  style={{ width: 28, height: 28, objectFit: "contain" }}
                />
                AlphaMetricx
                {pName && (
                  <>
                    {" "}
                    <span className="text-slate-400">›</span>
                    <span
                      className={`${cn(
                        "text-slate-700  h-5 max-w-[120px] xs:max-w-[70px] sm:max-w-[90px] md:max-w-[180px] lg:max-w-[320px] truncate",
                      )} `}
                    >
                      {pName}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {!inDash &&
            (pathname.includes("/review") ||
              pathname.includes("/dashboards")) &&
            project?.id &&
            session?.id && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 10,
                }}
              >
                <CanvasTabBar
                  activeTab={pathname.includes("/review") ? "review" : "output"}
                  onTabChange={(tab) => {
                    if (onCanvasTabChange) {
                      const allowed = onCanvasTabChange(tab);
                      if (allowed === false) return;
                    }
                    if (tab === "configure") {
                      navigate(paths.workflow(project.id, session.id), {
                        state: { project, session },
                      });
                    } else if (tab === "review") {
                      navigate(paths.review(project.id, session.id), {
                        state: { project, session },
                      });
                    } else if (tab === "output") {
                      navigate(paths.dashboards(project.id, session.id), {
                        state: { project, session },
                      });
                    }
                  }}
                />
              </div>
            )}

          <div className="topbar__actions">
            {/* {pathname !== "/sandbox" && (
                <button 
                  className="sandbox-nav-btn"
                  onClick={() => navigate("/sandbox")}
                  title="Open AI Sandbox"
                >
                  <i className={cn('fa-solid', 'fa-wand-magic-sparkles', 'mr-1')}></i>
                  AI Sandbox
                </button>
              )} */}
            <button className="iconbtn" aria-label="Notifications">
              <BellIcon width={18} height={18} />
            </button>
            <button
              className="iconbtn"
              aria-label="Toggle theme"
              onClick={toggle}
            >
              {theme === "light" ? (
                <MoonIcon width={18} height={18} />
              ) : (
                <SunIcon width={18} height={18} />
              )}
            </button>
            <button
              className="iconbtn"
              aria-label="Settings"
              onClick={() => navigate("/settings")}
              title="Organization Settings & Profile"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <UserAvatar />
          </div>
        </header>
      )}

      <main className={`content${wide ? " content--wide" : ""}`}>
        {children}
      </main>
    </div>
  );
}

/* ---------- route wrappers (URL → data → screen) ---------- */
function ProjectsRoute() {
  const navigate = useNavigate();
  const handleOpenProject = async (project) => {
    try {
      const sessions = await listSessions(project.id);
      console.log({ sessions });

      if (sessions && sessions.length > 0) {
        const latestSession = sessions[0];
        navigate(paths.dashboards(project.id, latestSession.id), {
          state: { project, session: latestSession },
        });
      } else {
        navigate(paths.workflow(project.id, "new"), { state: { project } });
      }
    } catch (err) {
      navigate(paths.workflow(project.id, "new"), { state: { project } });
    }
  };
  return (
    <Shell>
      <ScreenLoader>
        <ProjectsScreen onOpenProject={handleOpenProject} />
      </ScreenLoader>
    </Shell>
  );
}

function ProjectRoute() {
  const { projectId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const project = useResolved(loadProject, projectId, state?.project);
  return (
    <Shell project={project} projectId={projectId}>
      {project ? (
        <ScreenLoader>
          <ProjectScreen
            project={project}
            onBack={() => navigate(paths.projects())}
            onOpenReview={(session, opts = {}) =>
              navigate(paths.review(projectId, session.id), {
                state: { project, session, runTagging: !!opts.runTagging },
              })
            }
            onOpenWorkflow={(session) =>
              navigate(paths.workflow(projectId, session.id), {
                state: { project, session },
              })
            }
            onNewWorkflow={(draftData) =>
              navigate(paths.workflow(projectId, "new"), {
                state: { project, draftData },
              })
            }
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function WorkflowRoute() {
  const { projectId, sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const project = useResolved(loadProject, projectId, state?.project);
  const session =
    sessionId === "new"
      ? null
      : useResolved(loadSession, sessionId, state?.session);

  if (projectId && (!project || (sessionId !== "new" && !session))) {
    return (
      <div className="page">
        <div className="page__glow" aria-hidden="true" />
        <main className="content">
          <Loading />
        </main>
      </div>
    );
  }
  return (
    <ScreenLoader>
      <WorkflowScreen
        project={project}
        session={session}
        draftData={state?.draftData}
        theme={theme}
        onToggleTheme={toggle}
        onBack={() => {
          // if (projectId) {
          //   navigate(paths.project(projectId), { state: { project } });
          // } else {
          navigate(paths.projects());
          // }
        }}
        onOpenReview={(s) => {
          const status = (s?.status || "").toLowerCase();
          const tagged = status === "tagged" || status === "completed";
          navigate(paths.review(projectId, s.id), {
            state: { project, session: s, runTagging: !tagged },
          });
        }}
      />
    </ScreenLoader>
  );
}

function ReviewRoute() {
  const { projectId, sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const project = useResolved(loadProject, projectId, state?.project);
  const session = useResolved(loadSession, sessionId, state?.session);
  const [hasPendingApprovalChanges, setHasPendingApprovalChanges] =
    useState(false);
  const [isJobActive, setIsJobActive] = useState(false);

  const { nodes, edges } = useMemo(() => {
    const wf = session?.workflow;
    if (hasSavedGraph(wf)) {
      return {
        nodes: restoreNodes(wf),
        edges: restoreEdges(wf),
      };
    }
    return {
      nodes: seedNodes(session),
      edges: [],
    };
  }, [session]);

  const reviewFedByMM = useMemo(() => {
    const reviewNodes = nodes.filter((n) => n.type === "review");
    return reviewNodes.some((r) => {
      const feeders = new Set(
        edges.filter((e) => e.target === r.id).map((e) => e.source),
      );
      return nodes.some(
        (n) =>
          feeders.has(n.id) &&
          n.type === "analysis" &&
          n.data?.lens === "media_monitoring",
      );
    });
  }, [nodes, edges]);

  const reviewColumns = useMemo(() => {
    return reviewFedByMM ? MM_REVIEW_COLUMNS : OTHER_REVIEW_COLUMNS;
  }, [reviewFedByMM]);

  const handleCanvasTabChange = useCallback(
    (tab) => {
      if (isJobActive) {
        toast.error(
          "Process is currently running. Please wait for it to complete before navigating.",
        );
        return false;
      }
      if (tab === "output" && hasPendingApprovalChanges) {
        toast.error(
          "Please click on Create Dashboards for the latest approvals so that the charts will get updated.",
        );
        return false;
      }
      return true;
    },
    [isJobActive, hasPendingApprovalChanges],
  );

  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      onCanvasTabChange={handleCanvasTabChange}
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <ReviewScreen
            project={project}
            session={session}
            runTagging={state?.runTagging || false}
            onBack={() => navigate(paths.projects())}
            onCreated={(chartsData) => {
              seedCharts(sessionId, chartsData);
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              });
            }}
            onApprovalChange={setHasPendingApprovalChanges}
            onJobStateChange={setIsJobActive}
            columns={reviewColumns}
            relationEditable={reviewFedByMM}
            approvalField={
              reviewFedByMM
                ? "is_approved_for_monitoring"
                : "is_approved_for_dashboards"
            }
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

// Shared loader for the dashboard views (home / measurement / monitoring / primpact / narrative / reputation).
function useDashData() {
  const { projectId, sessionId } = useParams();
  const { state } = useLocation();
  const project = useResolved(loadProject, projectId, state?.project);
  const [session, setSession] = useState(state?.session || null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    // Always fetch fresh session data from API so workflow updates are immediately reflected
    loadSession(sessionId, true)
      .then((s) => {
        if (!cancelled && s) {
          setSession(s);
          seedSession(sessionId, s);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const {
    data: chartsData,
    loading: chartsLoading,
    error: chartsError,
  } = useCharts(sessionId, state?.chartsData);
  return {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  };
}

function ClearTemplateModeOnNavigation() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isSelectiveDashboard =
      pathname.includes("/measurement") ||
      pathname.includes("/monitoring") ||
      pathname.includes("/primpact") ||
      pathname.includes("/narrative") ||
      pathname.includes("/reputation");

    if (!isSelectiveDashboard) {
      if (localStorage.getItem("dashboard_template_mode")) {
        localStorage.removeItem("dashboard_template_mode");
        window.dispatchEvent(new Event("storage"));
      }
    }
  }, [pathname]);

  return null;
}

function DashboardsRoute() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  } = useDashData();

  useEffect(() => {
    if (localStorage.getItem("dashboard_template_mode")) {
      localStorage.removeItem("dashboard_template_mode");
      window.dispatchEvent(new Event("storage"));
    }
  }, []);

  console.log(session);

  const stateSession = useResolved(loadSession, sessionId, state?.session);
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      // activeTab=""
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <DashboardsScreen
            project={project}
            session={session || stateSession}
            chartsData={chartsData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            onBack={() => {
              localStorage.removeItem("dashboard_template_mode");
              window.dispatchEvent(new Event("storage"));
              navigate(paths.projects());
            }}
            onOpenDashboard={(key, title) => {
              if (key === "media_measurement") {
                navigate(paths.measurement(projectId, sessionId), {
                  state: { project, session, chartsData },
                });
              } else if (key === "media_monitoring") {
                navigate(paths.monitoring(projectId, sessionId), {
                  state: { project, session, chartsData },
                });
              } else if (key === "narrative_intelligence") {
                navigate(paths.narrative(projectId, sessionId), {
                  state: { project, session, chartsData },
                });
              } else if (key === "pr_impact") {
                navigate(paths.primpact(projectId, sessionId), {
                  state: { project, session, chartsData },
                });
              } else if (key === "reputation_index") {
                navigate(paths.reputation(projectId, sessionId), {
                  state: { project, session, chartsData },
                });
              } else {
                alert(`Open "${title}" dashboard — coming soon.`);
              }
            }}
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function MeasurementRoute() {
  const navigate = useNavigate();
  const {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  } = useDashData();
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab="media_measurement"
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <MediaMeasurementScreen
            project={project}
            session={session}
            chartsData={chartsData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            onBack={() => {
              localStorage.removeItem("dashboard_template_mode");
              window.dispatchEvent(new Event("storage"));
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              });
            }}
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function MonitoringRoute() {
  const navigate = useNavigate();
  const {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  } = useDashData();
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab="media_monitoring"
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <MediaMonitoringScreen
            project={project}
            session={session}
            chartsData={chartsData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            onBack={() => {
              localStorage.removeItem("dashboard_template_mode");
              window.dispatchEvent(new Event("storage"));
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              });
            }}
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function PRImpactRoute() {
  const navigate = useNavigate();
  const {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  } = useDashData();
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab="pr_impact"
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <PRImpactScreen
            project={project}
            session={session}
            chartsData={chartsData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            onBack={() => {
              localStorage.removeItem("dashboard_template_mode");
              window.dispatchEvent(new Event("storage"));
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              });
            }}
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function NarrativeRoute() {
  const navigate = useNavigate();
  const {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  } = useDashData();
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab="narrative_intelligence"
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <NarrativeScreen
            project={project}
            session={session}
            chartsData={chartsData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            onBack={() => {
              localStorage.removeItem("dashboard_template_mode");
              window.dispatchEvent(new Event("storage"));
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              });
            }}
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function ReputationRoute() {
  const navigate = useNavigate();
  const {
    projectId,
    sessionId,
    project,
    session,
    chartsData,
    chartsLoading,
    chartsError,
  } = useDashData();
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab="reputation_index"
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <ReputationScreen
            project={project}
            session={session}
            chartsData={chartsData}
            chartsLoading={chartsLoading}
            chartsError={chartsError}
            onBack={() => {
              localStorage.removeItem("dashboard_template_mode");
              window.dispatchEvent(new Event("storage"));
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              });
            }}
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

/* ---------- Consumer Intelligence routes ---------- */
// Shared frame for the CI dashboards: resolves project/session/charts like the
// MI routes, and provides an `onBack` that returns to the Tier 2 gallery that
// opened this screen (`state.backTo`) or to the dashboards home, carrying the
// navigation state so the destination needs no refetch.
function CIDashboardRoute({ activeTab, children: render }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const dash = useDashData();
  const { projectId, sessionId, project, session, chartsData } = dash;
  const onBack = () =>
    navigate(state?.backTo || paths.dashboards(projectId, sessionId), {
      state: {
        project,
        session,
        chartsData,
        selectedTier2: state?.selectedTier2,
      },
    });
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab={activeTab}
      wide
    >
      {project && session ? (
        <ScreenLoader>{render({ ...dash, onBack, state })}</ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function TrendRoute() {
  return (
    <CIDashboardRoute activeTab="trend_intelligence">
      {({ project, session, chartsData, chartsLoading, chartsError, onBack }) => (
        <TrendIntelligenceScreen
          project={project}
          session={session}
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

function BrandCompetitiveRoute() {
  return (
    <CIDashboardRoute activeTab="brand_competitive_intel">
      {({ project, session, chartsData, chartsLoading, chartsError, onBack }) => (
        <BrandCompetitiveScreen
          project={project}
          session={session}
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

function NetworkMapRoute() {
  return (
    <CIDashboardRoute activeTab="network_map">
      {({ project, session, chartsData, chartsLoading, chartsError, onBack, state }) => (
        <NetworkMapScreen
          project={project}
          session={session}
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          initialSlide={state?.initialSlide}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

function BrandHealthRoute() {
  return (
    <CIDashboardRoute activeTab="brand_health_storyboard">
      {({ project, session, chartsData, chartsLoading, chartsError, onBack }) => (
        <BrandHealthScreen
          project={project}
          session={session}
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

// Issues Intelligence → Track Emerging Issues (Tier 2 storyboard).
function IssuesRoute() {
  return (
    <CIDashboardRoute activeTab="track_emerging_issues">
      {({ chartsData, chartsLoading, chartsError, onBack }) => (
        <TrackEmergingIssuesScreen
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

// Advanced Metrics → Shifting Audience Priorities (Tier 2 storyboard).
function PrioritiesRoute() {
  return (
    <CIDashboardRoute activeTab="shifting_audience_priorities">
      {({ chartsData, chartsLoading, chartsError, onBack }) => (
        <ShiftingAudiencePrioritiesScreen
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

function MarketIntelligenceRoute() {
  return (
    <CIDashboardRoute activeTab="market_intelligence">
      {({ chartsData, chartsLoading, chartsError, onBack, state }) => (
        <MarketIntelligenceScreen
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          initialLensId={state?.initialSlide}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

function BrandIntelligenceRoute() {
  return (
    <CIDashboardRoute activeTab="brand_intelligence">
      {({ project, session, chartsData, chartsLoading, chartsError, onBack }) => (
        <BrandIntelligenceScreen
          project={project}
          session={session}
          chartsData={chartsData}
          chartsLoading={chartsLoading}
          chartsError={chartsError}
          onBack={onBack}
        />
      )}
    </CIDashboardRoute>
  );
}

// Tier 2 gallery for one Tier 1 CI pillar (/intel/:tier1Key).
function IntelLensRoute() {
  const navigate = useNavigate();
  const { tier1Key } = useParams();
  const { state } = useLocation();
  const { projectId, sessionId, project, session, chartsData } = useDashData();
  return (
    <Shell
      project={project}
      projectId={projectId}
      sessionId={sessionId}
      session={session}
      chartsData={chartsData}
      activeTab={tier1Key}
      wide
    >
      {project && session ? (
        <ScreenLoader>
          <IntelLensScreen
            tier1Key={tier1Key}
            selectedTier2={state?.selectedTier2}
            projectId={projectId}
            sessionId={sessionId}
            project={project}
            session={session}
            chartsData={chartsData}
            onBack={() =>
              navigate(paths.dashboards(projectId, sessionId), {
                state: { project, session, chartsData },
              })
            }
          />
        </ScreenLoader>
      ) : (
        <Loading />
      )}
    </Shell>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  return (
    <PublicOnlyRoute>
      <ScreenLoader>
        <LoginScreen onLoginSuccess={() => navigate("/")} />
      </ScreenLoader>
    </PublicOnlyRoute>
  );
}

function SandboxRoute() {
  return (
    <Shell wide>
      <ScreenLoader>
        <SandboxScreen />
      </ScreenLoader>
    </Shell>
  );
}

function SettingsRoute() {
  const navigate = useNavigate();
  return (
    <Shell wide>
      <ScreenLoader>
        <SettingsScreen onBack={() => navigate("/")} />
      </ScreenLoader>
    </Shell>
  );
}

function WorkflowStudioRoute() {
  const navigate = useNavigate();
  const { projectId, sessionId } = useParams();
  const { state } = useLocation();
  const project = useResolved(loadProject, projectId, state?.project);
  const session = useResolved(loadSession, sessionId, state?.session);

  // Deep-linking to a saved workflow needs its data before the canvas seeds.
  if ((projectId && !project) || (sessionId && !session)) {
    return (
      <div className="page">
        <div className="page__glow" aria-hidden="true" />
        <main className="content">
          <Loading />
        </main>
      </div>
    );
  }
  return (
    <ScreenLoader>
      <WorkflowStudioScreen
        project={project}
        session={session}
        onBack={() => navigate("/")}
      />
    </ScreenLoader>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize background token refresh loop on app mount
    setupAuthRefreshLoop();

    const handleAuthLogout = (e) => {
      const reason = e?.detail?.reason || "Session expired";
      // toast.error(reason);
    };

    window.addEventListener("auth_logout", handleAuthLogout);
    return () => {
      window.removeEventListener("auth_logout", handleAuthLogout);
    };
  }, []);

  return (
    <ThemeProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            maxWidth: "420px",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          },
        }}
      />
      <BrowserRouter future={{ v7_startTransition: true }}>
        <ClearTemplateModeOnNavigation />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsRoute />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sandbox"
            element={
              <ProtectedRoute>
                <SandboxRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new/workflow"
            element={
              <ProtectedRoute>
                <WorkflowRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions"
            element={
              <ProtectedRoute>
                <ProjectRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/workflow"
            element={
              <ProtectedRoute>
                <WorkflowRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/review"
            element={
              <ProtectedRoute>
                <ReviewRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/dashboards"
            element={
              <ProtectedRoute>
                <DashboardsRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/measurement"
            element={
              <ProtectedRoute>
                <MeasurementRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/monitoring"
            element={
              <ProtectedRoute>
                <MonitoringRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/primpact"
            element={
              <ProtectedRoute>
                <PRImpactRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/narrative"
            element={
              <ProtectedRoute>
                <NarrativeRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/reputation"
            element={
              <ProtectedRoute>
                <ReputationRoute />
              </ProtectedRoute>
            }
          />
          {/* Consumer Intelligence dashboards */}
          <Route
            path="/:projectId/sessions/:sessionId/trend"
            element={
              <ProtectedRoute>
                <TrendRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/competitive"
            element={
              <ProtectedRoute>
                <BrandCompetitiveRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/network"
            element={
              <ProtectedRoute>
                <NetworkMapRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/health"
            element={
              <ProtectedRoute>
                <BrandHealthRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/issues"
            element={
              <ProtectedRoute>
                <IssuesRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/priorities"
            element={
              <ProtectedRoute>
                <PrioritiesRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/brand-intel"
            element={
              <ProtectedRoute>
                <BrandIntelligenceRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/market-intelligence"
            element={
              <ProtectedRoute>
                <MarketIntelligenceRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/intel/:tier1Key"
            element={
              <ProtectedRoute>
                <IntelLensRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/build"
            element={
              <ProtectedRoute>
                <BuilderScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/build"
            element={
              <ProtectedRoute>
                <BuilderScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/build"
            element={
              <ProtectedRoute>
                <BuilderScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workflow-studio"
            element={
              <ProtectedRoute>
                <WorkflowStudioRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/workflow-studio"
            element={
              <ProtectedRoute>
                <WorkflowStudioRoute />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:projectId/sessions/:sessionId/workflow-studio"
            element={
              <ProtectedRoute>
                <WorkflowStudioRoute />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
