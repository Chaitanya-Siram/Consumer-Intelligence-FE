import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Icon } from "../../components/ui/icon";
import { cn } from "../../lib/utils";
import type { DashboardSummary } from "../../data/types";

const TILE = 40;
const GAP = 10;
const PAD_TOP = 12;
const BACK_OFFSET = TILE + GAP + 4; // offset for back button at top
// Vertical center of tile i within the rail.
const centerY = (i: number) =>
  PAD_TOP + BACK_OFFSET + i * (TILE + GAP) + TILE / 2;

export interface NavDashboardItem {
  id: string;
  name: string;
  path?: string;
  icon?: string;
  accessible?: boolean;
  disabled?: boolean;
  tab_name?: string;
}

// Standard 5 dashboards fallback list if none provided
const DEFAULT_DASHBOARDS: NavDashboardItem[] = [
  {
    id: "media_measurement",
    name: "Media Measurement",
    path: "measurement",
    icon: "newspaper",
    accessible: true,
  },
  {
    id: "media_monitoring",
    name: "Daily Monitoring",
    path: "monitoring",
    icon: "insights",
    accessible: true,
  },
  {
    id: "narrative_intelligence",
    name: "Narrative Intelligence",
    path: "narrative",
    icon: "auto_stories",
    accessible: true,
  },
  {
    id: "pr_impact",
    name: "PR Impact",
    path: "primpact",
    icon: "avg_pace",
    accessible: true,
  },
  {
    id: "reputation_index",
    name: "Reputation Index",
    path: "reputation",
    icon: "shield",
    accessible: true,
  },
];

// Per-dashboard nav icon (Material Symbols), keyed by dashboard slug or tab name.
const NAV_ICON: Record<string, string> = {
  overview: "dashboard",
  "media coverage overview": "dashboard",
  "media measurement": "newspaper",
  media_measurement: "newspaper",
  "daily monitoring": "insights",
  media_monitoring: "insights",
  monitoring: "insights",
  "sentiment analysis": "analytics",
  "sentiment pulse": "analytics",
  "coverage & sentiment": "analytics",
  "themes & topics": "topic",
  "audience & reach": "groups",
  "audience reach": "groups",
  "share of voice": "pie_chart",
  "competitive share of voice": "equalizer",
  competitive: "equalizer",
  "media coverage": "newspaper",
  "key stories": "auto_stories",
  "narrative intelligence": "auto_stories",
  narrative_intelligence: "auto_stories",
  narrative: "auto_stories",
  "pr impact": "avg_pace",
  "pr-impact": "avg_pace",
  pr_impact: "avg_pace",
  "reputation index": "shield",
  reputation_index: "shield",
  reputation: "shield",
};

const navIcon = (idOrName: string) => {
  if (!idOrName) return "bar_chart";
  const key = idOrName.toLowerCase().replace(/_/g, " ").trim();
  return NAV_ICON[key] ?? "bar_chart";
};

// Bottom utility tiles (bordered) — see Figma node 295:691.
const UTILITY = [
  { icon: "forward", label: "Forward" },
  { icon: "download", label: "Download" },
] as const;

const isDashboardActive = (
  d: NavDashboardItem,
  activeId?: string,
  pathname: string = "",
) => {
  const normPath = pathname.toLowerCase();
  const normActiveId = (activeId || "").toLowerCase();
  const id = (d.id || d.tab_name || "").toLowerCase();
  const path = (d.path || "").toLowerCase();

  if (
    path &&
    (normPath.endsWith(`/${path}`) || normPath.includes(`/${path}/`))
  ) {
    return true;
  }
  if (normActiveId) {
    if (normActiveId === id || normActiveId === path) return true;
    if (
      id === "media_measurement" &&
      (normActiveId.includes("measurement") || normActiveId === "overview")
    )
      return true;
    if (id === "media_monitoring" && normActiveId.includes("monitoring"))
      return true;
    if (id === "narrative_intelligence" && normActiveId.includes("narrative"))
      return true;
    if (
      id === "pr_impact" &&
      (normActiveId.includes("pr") || normActiveId.includes("impact"))
    )
      return true;
    if (id === "reputation_index" && normActiveId.includes("reputation"))
      return true;
  }
  return false;
};

/**
 * Nav rail. Top group: Back to Home button + one tile per dashboard in the project
 * (active tile #d31717) — clicking navigates to that dashboard route. Bottom group:
 * forward, download and a gradient AI (auto_awesome) action.
 */
export function NavSlot({
  projectId,
  sessionId,
  dashboards,
  activeId,
  onBack,
}: {
  projectId?: string;
  sessionId?: string;
  dashboards?: (DashboardSummary | NavDashboardItem)[];
  activeId?: string;
  chartsData?: any;
  session?: any;
  onBack?: () => void;
  onSelectTab?: (tabName: string) => void;
}) {
  const location = useLocation();
  const params = useParams();

  const effProjectId = params.projectId;
  const effSessionId = sessionId || params.sessionId;
  console.log({ projectId, params });

  const itemsToRender: NavDashboardItem[] = (
    dashboards && dashboards.length > 0 ? dashboards : DEFAULT_DASHBOARDS
  ) as NavDashboardItem[];

  const [hovered, setHovered] = useState<number | null>(null);

  const activeIndex = Math.max(
    0,
    itemsToRender.findIndex((d) =>
      isDashboardActive(d, activeId, location.pathname),
    ),
  );

  const [labelIndex, setLabelIndex] = useState(activeIndex);

  useEffect(() => {
    if (hovered === null) {
      setLabelIndex(activeIndex);
    }
  }, [activeIndex, hovered]);

  const backUrl = effProjectId
    ? effSessionId
      ? `/${projectId}/sessions/${effSessionId}/dashboards`
      : `/${effProjectId}/sessions`
    : "/projects";

  return (
    <nav
      className={cn(
        "relative",
        "flex",
        "w-[var(--sense-nav-w)]",
        "shrink-0",
        "flex-col",
        "items-center",
        "justify-between",
        "py-[12px]",
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {/* top: Back button + one tile per dashboard */}
      <div className={cn("flex", "flex-col", "gap-[10px]", "items-center")}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Dashboards"
            className={cn(
              "flex",
              "size-[40px]",
              "items-center",
              "justify-center",
              "rounded-[6px]",
              "text-[#1c1c1c]",
              "hover:bg-[#f4f4f5]",
              "hover:text-black",
              "border",
              "border-slate-200",
              "bg-white",
              "transition-all",
              "shadow-sm",
              "mb-1",
              "cursor-pointer",
            )}
            title="Back to Dashboards"
          >
            <Icon name="arrow_back" size={20} />
          </button>
        ) : (
          <Link
            to={backUrl}
            aria-label="Back to Dashboards"
            className={cn(
              "flex",
              "size-[40px]",
              "items-center",
              "justify-center",
              "rounded-[6px]",
              "text-[#1c1c1c]",
              "hover:bg-[#f4f4f5]",
              "hover:text-black",
              "border",
              "border-slate-200",
              "bg-white",
              "transition-all",
              "shadow-sm",
              "mb-1",
              "cursor-pointer",
            )}
            title="Back to Dashboards"
          >
            <Icon name="arrow_back" size={20} />
          </Link>
        )}

        {itemsToRender.map((d, i) => {
          const isActive = isDashboardActive(d, activeId, location.pathname);
          const isAccessible = d.accessible !== false && d.disabled !== true;

          const iconName =
            d.icon || navIcon(d.id || d.name || d.tab_name || "");

          const targetPath =
            effProjectId && effSessionId && d.path
              ? `/${effProjectId}/sessions/${effSessionId}/${d.path}`
              : effProjectId && d.id
                ? `/projects/${effProjectId}/dashboards/${d.id}`
                : "#";

          const className = cn(
            "flex size-[40px] items-center justify-center rounded-[6px] transition-colors relative",
            isAccessible
              ? isActive
                ? "text-white cursor-default shadow-sm"
                : "text-[#1c1c1c] hover:text-black cursor-pointer"
              : "text-slate-400 opacity-40 cursor-not-allowed pointer-events-none bg-slate-100",
          );

          const style = {
            backgroundColor: !isAccessible
              ? "rgba(241, 245, 249, 0.6)"
              : isActive
                ? "var(--sense-red)"
                : hovered === i
                  ? "#f4f4f5"
                  : "var(--sense-tile)",
          };

          if (!isAccessible) {
            return (
              <button
                key={d.id || d.name || i}
                type="button"
                disabled
                aria-label={`${d.name || d.id} (Not accessible)`}
                onMouseEnter={() => {
                  setHovered(i);
                  setLabelIndex(i);
                }}
                className={className}
                style={style}
              >
                <Icon name={iconName} size={22} fill={isActive} />
              </button>
            );
          }

          return (
            <Link
              key={d.id || d.name || i}
              to={targetPath}
              onClick={() =>
                localStorage.setItem("dashboard_template_mode", "sense")
              }
              aria-label={d.name || d.id}
              aria-current={isActive ? "page" : undefined}
              onMouseEnter={() => {
                setHovered(i);
                setLabelIndex(i);
              }}
              className={className}
              style={style}
            >
              <Icon name={iconName} size={22} fill={isActive} />
            </Link>
          );
        })}
      </div>

      {/* bottom: utility + AI */}
      <div
        className={cn("flex", "flex-col", "gap-[10px]")}
        onMouseEnter={() => setHovered(null)}
      >
        {UTILITY.map(({ icon, label }) => (
          <button
            key={icon}
            aria-label={label}
            className={cn(
              "flex",
              "size-[40px]",
              "items-center",
              "justify-center",
              "rounded-[6px]",
              "border",
              "border-[#f7f7f7]",
              "text-[#1c1c1c]",
              "transition-colors",
              "hover:bg-[#f4f4f5]",
              "hover:text-black",
            )}
          >
            <Icon name={icon} size={24} />
          </button>
        ))}

        <button
          aria-label="Ask AI"
          className={cn(
            "flex",
            "size-[40px]",
            "items-center",
            "justify-center",
            "rounded-[10px]",
            "border",
            "text-white",
            "transition-transform",
            "hover:scale-105",
          )}
          style={{
            backgroundImage:
              "linear-gradient(-32.5deg, #ec6020 0%, #7654f9 85.887%)",
            borderColor: "rgba(255,255,255,0.58)",
            boxShadow: "0px 12px 10px 0px rgba(94,29,0,0.25)",
          }}
        >
          <Icon name="auto_awesome" size={24} fill />
        </button>
      </div>

      {/* single travelling tooltip (top group only) */}
      {itemsToRender.length > 0 && (
        <motion.span
          role="tooltip"
          className={cn(
            "type-caption",
            "pointer-events-none",
            "absolute",
            "left-[52px]",
            "z-30",
            "-translate-y-1/2",
            "whitespace-nowrap",
            "rounded-[6px]",
            "bg-black",
            "px-2",
            "py-1",
            "text-white",
            "shadow-md",
          )}
          initial={false}
          animate={{
            top: centerY(labelIndex),
            opacity: hovered !== null ? 1 : 0,
          }}
          transition={{
            top: { type: "spring", stiffness: 500, damping: 40 },
            opacity: { duration: 0.15 },
          }}
        >
          {itemsToRender[labelIndex]?.name ||
            (itemsToRender[labelIndex] as any)?.tab_name}
          {itemsToRender[labelIndex]?.accessible === false ||
          itemsToRender[labelIndex]?.disabled === true
            ? " (Locked)"
            : ""}
        </motion.span>
      )}
    </nav>
  );
}
