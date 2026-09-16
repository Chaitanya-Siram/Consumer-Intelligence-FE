import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  Fragment,
} from "react";
import { Rich } from "../utils/text.jsx";
import ParticleCluster from "../components/monitor/ParticleCluster.jsx";
import ChatDock from "../components/ChatDock.jsx";
import { downloadMediaMonitoringReport } from "../api/charts.js";
import { updateSectionsOrders } from "../api/projects.js";

// ── Light theme tokens (scoped to this screen's root) ─────────────────────────
// The hero keeps its dark image + scrim; the body below uses this bright palette
// with near-black text, and fades smoothly out of the hero into --bg-app.
const THEME = {
  "--bg-app": "#F5F7FF", // body backdrop — the hero fades into this colour
  "--bg-card": "#FFFFFF", // cards, calendar, report panel
  "--bg-elevated": "#EEF0F8", // section header rows, neutral badge, hover
  "--border-subtle": "rgba(17,17,20,0.08)",
  "--border-default": "rgba(17,17,20,0.14)",
  "--text-primary": "#111114", // headlines — near black
  "--text-default": "#2C2C38", // body text
  "--text-muted": "#5A5A72", // secondary text
  "--text-dimmed": "#9A9AAB", // meta / labels
  "--accent": "#5F39F8",
  "--accent-subtle": "rgba(95,57,248,0.10)",
  "--warning": "#B26B00",
};

const DASHBOARD_KEY = "media_monitoring";
const SECTION_CHART_ID = "section_articles";

// Sentiment → canvas particle colour (reference palette).
const SENTIMENT_COLOR = {
  POS: "#24A148",
  NEU: "#697077",
  NEG: "#FF475C",
};
const SENTIMENT_ALPHA = { POS: 0.82, NEU: 0.65, NEG: 0.88 };
const SENTIMENT_LABEL = { POS: "Positive", NEU: "Neutral", NEG: "Negative" };

const SENTIMENT_STYLES = {
  NEG: {
    bg: "rgba(255,71,92,0.10)",
    color: "#FF475C",
    border: "rgba(255,71,92,0.22)",
  },
  POS: {
    bg: "rgba(36,161,72,0.10)",
    color: "#24A148",
    border: "rgba(36,161,72,0.22)",
  },
  NEU: {
    bg: "var(--bg-elevated)",
    color: "var(--text-muted)",
    border: "var(--border-subtle)",
  },
};

const HIGHLIGHT_BG = {
  NEG: "rgba(255,71,92,0.07)",
  POS: "rgba(36,161,72,0.07)",
  NEU: "rgba(95,57,248,0.07)",
};
const HIGHLIGHT_BORDER = {
  NEG: "#FF475C",
  POS: "#24A148",
  NEU: "var(--accent)",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Stable slug so the section nav can scroll to its card.
function slug(name) {
  return `mmsec-${String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

// Unique, stable key per article for scroll-target + highlight.
function articleKey(sectionName, a, idx) {
  return `${slug(sectionName)}__${a.id ?? idx}`;
}

// Normalize any date value to a local YYYY-MM-DD key.
function dayKey(d) {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? "" : ymd(dt);
}

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// "MON, MAY 5, 2026"
function fmtDayUpper(key) {
  if (!key) return "";
  const dt = new Date(`${key}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return key;
  return dt
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

// "May 5, 2026"
function fmtShort(key) {
  if (!key) return "";
  const dt = new Date(`${key}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return key;
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "Tuesday"
function weekday(key) {
  if (!key) return "";
  const dt = new Date(`${key}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return key;
  return dt.toLocaleDateString("en-US", { weekday: "long" });
}

function nf(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function authorText(author) {
  if (Array.isArray(author)) return author.filter(Boolean).join(", ");
  return author ? String(author).trim() : "";
}

// ── Pexels hero image ─────────────────────────────────────────────────────────
function usePexelsImage(session) {
  const [bgImage, setBgImage] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchImage = async (brandKeyword) => {
      const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
      if (!apiKey) {
        console.warn("[usePexelsImage] VITE_PEXELS_API_KEY not set in .env");
        return;
      }
      const query = (brandKeyword || "business technology")
        .replace(/['"’]/g, "")
        .trim();
      const pexelsBase = import.meta.env.DEV
        ? "/api-pexels"
        : "https://api.pexels.com";
      const url = `${pexelsBase}/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape&locale=en-US`;
      try {
        const res = await fetch(url, { headers: { Authorization: apiKey } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const photo = (data.photos ?? [])[0];
        const src = photo?.src?.landscape || photo?.src?.original || null;
        if (src) setBgImage(src);
        else if (query !== "business technology") {
          fetchedRef.current = false;
          fetchImage("business technology");
        }
      } catch (err) {
        console.warn("[usePexelsImage] fetch failed:", err.message);
      }
    };

    const brandKeywords =
      session?.workflow?.nodes?.find((item) => item?.id === "data_0")?.data
        ?.brandKeywords ?? [];
    fetchImage(brandKeywords.length > 0 ? brandKeywords[0] : null);
  }, [session]);

  return bgImage;
}

// ── Dark calendar (matches reference styling, wired to real coverage days) ────
function DarkCalendar({
  available,
  selected,
  onToggle,
  onClear,
  initialMonth,
}) {
  const [view, setView] = useState(() => {
    const base = initialMonth
      ? new Date(`${initialMonth}T00:00:00`)
      : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const { startPad, daysInMonth } = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    return {
      startPad: first.getDay(),
      daysInMonth: new Date(
        view.getFullYear(),
        view.getMonth() + 1,
        0,
      ).getDate(),
    };
  }, [view]);

  const shiftMonth = (delta) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  const navBtn = {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "var(--text-muted)",
  };

  return (
    <div
      style={{
        borderRadius: 12,
        padding: 14,
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-default)",
          }}
        >
          Filter by date
        </span>
        <button
          onClick={onClear}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          All dates
        </button>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <button
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
          style={navBtn}
        >
          <svg
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-default)",
          }}
        >
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
          style={navBtn}
        >
          <svg
            width="12"
            height="12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 9,
              fontWeight: 600,
              color: "var(--text-dimmed)",
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          rowGap: 2,
        }}
      >
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const key = ymd(new Date(view.getFullYear(), view.getMonth(), day));
          const has = available.has(key);
          const isSel = selected.has(key);
          return (
            <div
              key={day}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <button
                disabled={!has}
                onClick={has ? () => onToggle(key) : undefined}
                title={has ? fmtShort(key) : undefined}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  fontSize: 10,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isSel ? "var(--accent)" : "transparent",
                  color: isSel
                    ? "#fff"
                    : has
                      ? "var(--text-default)"
                      : "var(--text-dimmed)",
                  border: "none",
                  cursor: has ? "pointer" : "default",
                }}
              >
                {day}
              </button>
              {has && (
                <div
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: "50%",
                    background: isSel ? "var(--accent)" : "var(--text-muted)",
                    marginTop: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p
        style={{
          marginTop: 12,
          fontSize: 10,
          lineHeight: 1.5,
          color: "var(--text-dimmed)",
        }}
      >
        {available.size} day{available.size === 1 ? "" : "s"} with coverage.
        Pick one or more days to filter; click a selected day to remove it.
      </p>
    </div>
  );
}

// ── Article row (ported from reference, with expand-for-detail) ───────────────
function ArticleRow({ entry, hasBorder, isHighlighted }) {
  const { a, sentiment } = entry;
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const st = SENTIMENT_STYLES[sentiment] || SENTIMENT_STYLES.NEU;

  const hasSimilar =
    a.similar_articles && Object.keys(a.similar_articles).length > 0;
  const hasAuthorReach =
    authorText(a.author) || (a.reach != null && a.reach !== "");
  const contentLong = (a.content?.length ?? 0) > 160;
  // Only offer the toggle when expanding actually reveals something new.
  const canExpand = contentLong || hasSimilar || hasAuthorReach;

  return (
    <div
      id={`mmarticle-${entry.key}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        padding: "14px 20px",
        borderBottom: hasBorder ? "1px solid var(--border-subtle)" : undefined,
        borderLeft: isHighlighted
          ? `3px solid ${HIGHLIGHT_BORDER[sentiment]}`
          : "3px solid transparent",
        background: isHighlighted
          ? HIGHLIGHT_BG[sentiment]
          : hovered
            ? "var(--bg-elevated)"
            : "transparent",
        transition: "background 0.15s, border-left-color 0.2s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 5,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "var(--text-dimmed)",
            }}
          >
            {a.domain || "Unknown source"}
          </span>
          <span style={{ color: "var(--border-default)", fontSize: 12 }}>
            ·
          </span>
          <span style={{ fontSize: 10, color: "var(--text-dimmed)" }}>
            {fmtDayUpper(dayKey(a.date)) || "—"}
          </span>
        </div>

        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.45,
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
            marginBottom: 5,
          }}
        >
          {a.url ? (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {a.title || "Untitled"}
            </a>
          ) : (
            a.title || "Untitled"
          )}
        </p>

        {a.content && (
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--text-muted)",
              display: expanded ? "block" : "-webkit-box",
              WebkitLineClamp: expanded ? "unset" : 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}
          >
            {a.content}
          </p>
        )}

        {expanded && hasSimilar && (
          <p style={{ marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text-default)" }}>
              Similar Articles:
            </strong>{" "}
            {Object.entries(a.similar_articles).map(([domain, url], idx) => (
              <Fragment key={domain}>
                {idx > 0 && ", "}
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent)" }}
                  >
                    {domain}
                  </a>
                ) : (
                  domain
                )}
              </Fragment>
            ))}
          </p>
        )}

        {expanded && hasAuthorReach && (
          <p
            style={{ marginTop: 6, fontSize: 11, color: "var(--text-dimmed)" }}
          >
            {authorText(a.author) && <>By {authorText(a.author)}</>}
            {authorText(a.author) && a.reach != null && a.reach !== "" && " · "}
            {a.reach != null && a.reach !== "" && <>reach {nf(a.reach)}</>}
          </p>
        )}

        {canExpand && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--accent)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 5,
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        {entry.isMostNegative && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 7px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              background: "rgba(255,71,92,0.14)",
              color: "#FF475C",
              border: "1px solid rgba(255,71,92,0.30)",
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Critical
          </span>
        )}
        <span
          style={{
            padding: "2px 7px",
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 600,
            background: st.bg,
            color: st.color,
            border: `1px solid ${st.border}`,
          }}
        >
          {SENTIMENT_LABEL[sentiment] || sentiment || "—"}
        </span>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
import { useOnBackHandler } from "../utils/useOnBackHandler.js";

export default function MediaMonitoringScreenV2({
  project,
  session,
  chartsData,
  chartsLoading = false,
  chartsError = "",
  onBack,
}) {
  useOnBackHandler(onBack);
  const [selectedDays, setSelectedDays] = useState(() => new Set());
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [highlightedKey, setHighlightedKey] = useState(null);
  const [showCounts, setShowCounts] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [order, setOrder] = useState([]);
  const [dragName, setDragName] = useState(null);
  const PAGE_SIZE = 15;

  const bgImage = usePexelsImage(session);
  const brandLabel = session?.brand_keywords?.[0] || project?.name || "Media";

  const rootRef = useRef(null);

  const toggleDay = (key) =>
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const toggleCollapse = (name) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const handleDownloadReport = async () => {
    if (!session?.id || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      await downloadMediaMonitoringReport(session.id, [...selectedDays].sort());
    } catch (err) {
      setDownloadError(err.message || "Failed to download report.");
    } finally {
      setDownloading(false);
    }
  };

  const sections = useMemo(() => {
    const arr = chartsData?.[DASHBOARD_KEY];
    const chart = Array.isArray(arr)
      ? arr.find((c) => c?.chart_id === SECTION_CHART_ID)
      : null;
    const data = chart?.data;
    if (!data || typeof data !== "object") return [];
    return Object.entries(data).map(([name, articles]) => ({
      name,
      articles: Array.isArray(articles) ? articles : [],
    }));
  }, [chartsData]);

  const availableDays = useMemo(() => {
    const set = new Set();
    sections.forEach((s) =>
      s.articles.forEach((a) => {
        const k = dayKey(a.date);
        if (k) set.add(k);
      }),
    );
    return set;
  }, [sections]);

  const latestDay = useMemo(() => {
    let max = "";
    availableDays.forEach((k) => {
      if (k > max) max = k;
    });
    return max;
  }, [availableDays]);

  const filtered = useMemo(() => {
    if (selectedDays.size === 0) return sections;
    return sections.map((s) => ({
      ...s,
      articles: s.articles.filter((a) => selectedDays.has(dayKey(a.date))),
    }));
  }, [sections, selectedDays]);

  // Keep the drag order in sync with the available sections: preserve existing
  // positions, append newcomers, drop stale names.
  useEffect(() => {
    setOrder((prev) => {
      const names = sections.map((s) => s.name);
      const kept = prev.filter((n) => names.includes(n));
      const added = names.filter((n) => !kept.includes(n));
      const next = [...kept, ...added];
      const same =
        next.length === prev.length && next.every((n, i) => n === prev[i]);
      return same ? prev : next;
    });
  }, [sections]);

  // Apply the user-defined drag order to the (date-)filtered sections.
  const orderedSections = useMemo(() => {
    if (order.length === 0) return filtered;
    const byName = new Map(filtered.map((s) => [s.name, s]));
    const out = order.map((n) => byName.get(n)).filter(Boolean);
    filtered.forEach((s) => {
      if (!order.includes(s.name)) out.push(s);
    });
    return out;
  }, [filtered, order]);

  const persistOrder = useCallback(
    (names) => {
      if (!project?.id || !names.length) return;
      const prev = project.sections_orders || [];
      const same =
        prev.length === names.length && prev.every((n, i) => n === names[i]);
      if (same) return;
      project.sections_orders = names;
      updateSectionsOrders(project.id, names, session?.id).catch((err) => {
        console.error("Failed to save section order:", err);
      });
    },
    [project, session],
  );

  const handleDragEnter = (overName) => {
    if (!dragName || dragName === overName) return;
    setOrder((prev) => {
      const from = prev.indexOf(dragName);
      const to = prev.indexOf(overName);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, dragName);
      return next;
    });
  };

  const handleDragEnd = () => {
    setDragName(null);
    persistOrder(order);
  };

  const stats = useMemo(() => {
    const out = { total: 0, POS: 0, NEG: 0, NEU: 0 };
    filtered.forEach((s) =>
      s.articles.forEach((a) => {
        out.total += 1;
        if (a.sentiment in out) out[a.sentiment] += 1;
      }),
    );
    return out;
  }, [filtered]);

  // Flattened articles with a unique key — drives particles + scroll/highlight.
  const flatArticles = useMemo(() => {
    const out = [];
    filtered.forEach((s) => {
      s.articles.forEach((a, i) => {
        out.push({
          a,
          section: s.name,
          key: articleKey(s.name, a, i),
          sentiment: a.sentiment,
        });
      });
    });
    return out;
  }, [filtered]);

  // Flag the most-recent negative article for the "Critical" badge.
  const mostNegativeKey = useMemo(() => {
    let best = null;
    let bestDay = "";
    flatArticles.forEach((e) => {
      if (e.a.sentiment !== "NEG") return;
      const k = dayKey(e.a.date);
      if (best === null || k >= bestDay) {
        best = e.key;
        bestDay = k;
      }
    });
    return best;
  }, [flatArticles]);

  const clusterParticles = useMemo(
    () =>
      flatArticles.map((e, i) => ({
        id: i,
        articleId: e.key,
        color: SENTIMENT_COLOR[e.a.sentiment] || SENTIMENT_COLOR.NEU,
        alpha: SENTIMENT_ALPHA[e.a.sentiment] ?? 0.65,
        isMostNegative: e.key === mostNegativeKey,
        label: e.a.title || "Untitled",
      })),
    [flatArticles, mostNegativeKey],
  );

  const summary = chartsData?.[`${DASHBOARD_KEY}_overall_summary`] || "";
  const hasData = sections.length > 0;

  const report = useMemo(() => {
    const { total, POS, NEG, NEU } = stats;
    if (selectedDays.size === 1) {
      const key = [...selectedDays][0];
      return {
        title: weekday(key),
        sub: fmtShort(key),
        total,
        POS,
        NEG,
        NEU,
        range: false,
      };
    }
    const days = (
      selectedDays.size ? [...selectedDays] : [...availableDays]
    ).sort();
    const nDays = days.length;
    return {
      title: `${nDays}-Day Report`,
      sub: nDays ? `${fmtShort(days[0])} → ${fmtShort(days[nDays - 1])}` : "",
      total,
      POS,
      NEG,
      NEU,
      range: true,
      nDays,
    };
  }, [stats, selectedDays, availableDays]);

  const scrollTo = (id) => {
    const root = rootRef.current;
    const el = root?.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleParticleClick = (key) => {
    const entry = flatArticles.find((e) => e.key === key);
    if (!entry) return;
    setCollapsed((prev) => {
      if (!prev.has(entry.section)) return prev;
      const next = new Set(prev);
      next.delete(entry.section);
      return next;
    });
    setHighlightedKey(key);
    setTimeout(() => scrollTo(`mmarticle-${key}`), 80);
  };

  const kpis = [
    { label: "TOTAL", value: stats.total, color: "rgba(255,255,255,0.92)" },
    { label: "POSITIVE", value: stats.POS, color: "#24A148" },
    { label: "NEGATIVE", value: stats.NEG, color: "#FF475C" },
    { label: "NEUTRAL", value: stats.NEU, color: "#AFAFB8" },
  ];

  return (
    <div
      ref={rootRef}
      style={{
        ...THEME,
        position: "fixed",
        inset: 0,
        zIndex: 60,
        overflowY: "auto",
        // background: "var(--bg-app)",
        fontFamily: "Inter, sans-serif",
      }}
    >
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
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 0,
            backgroundImage: bgImage ? `url(${bgImage})` : "none",
            backgroundColor: "#0d1017",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.56)",
            }}
          />
        </div>

        {/* Nav bar */}
        <div
          style={{
            position: "relative",
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "20px 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {onBack && (
              <button
                aria-label="Back"
                onClick={() => {
                  onBack();
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(255,255,255,0.88)",
                letterSpacing: "-0.01em",
                textTransform: "capitalize",
              }}
            >
              {brandLabel} Daily Monitoring
            </span>
          </div>

          {session?.id && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <button
                onClick={handleDownloadReport}
                disabled={downloading || stats.total === 0}
                title={
                  stats.total === 0
                    ? "No articles in the current selection to export"
                    : "Download the current view as a Word report"
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    downloading || stats.total === 0
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.12)",
                  color:
                    downloading || stats.total === 0
                      ? "rgba(255,255,255,0.4)"
                      : "#fff",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  cursor:
                    downloading || stats.total === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {downloading ? "Preparing…" : "Download report"}
              </button>
              {downloadError && (
                <p style={{ margin: 0, fontSize: 11, color: "#FF6B6B" }}>
                  {downloadError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Two-column content */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 0 0 0",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1200,
              display: "flex",
              alignItems: "center",
              padding: "0 40px",
              gap: 40,
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingRight: 20,
              }}
            >
              {clusterParticles.length > 0 && (
                <ParticleCluster
                  particles={clusterParticles}
                  onParticleClick={handleParticleClick}
                  style={{ width: "100%", maxWidth: "min(100%, 62vh)" }}
                />
              )}
            </div>

            <div
              style={{
                width: 280,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: "-0.01em",
                  paddingLeft: 4,
                  marginTop: 2,
                }}
              >
                {report.sub || fmtShort(latestDay)}
              </span>
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "13px 20px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: kpi.color,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {kpi.value}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    {kpi.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Title + summary */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            padding: "0 32px 64px",
            display: "flex",
            alignItems: "flex-start",
            gap: 48,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(34px, 5vw, 64px)",
              fontWeight: 600,
              lineHeight: 1.08,
              color: "#fff",
              letterSpacing: "-0.04em",
              textShadow: "0 2px 24px rgba(0,0,0,0.5)",
              margin: 0,
              flexShrink: 0,
              textTransform: "capitalize",
            }}
          >
            {brandLabel}
            <br />
            Daily Monitoring
          </h1>
          {summary && (
            <p
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 400,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.82)",
                flex: 1,
                textShadow: "0 1px 8px rgba(0,0,0,0.2)",
              }}
            >
              <Rich text={summary} />
            </p>
          )}
        </div>

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            zIndex: 10,
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, transparent, var(--bg-app))",
          }}
        />
      </section>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      {chartsLoading ? (
        <div
          style={{
            padding: 64,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Loading dashboard…
        </div>
      ) : chartsError ? (
        <div style={{ padding: 64, textAlign: "center", color: "#FF6B6B" }}>
          {chartsError}
        </div>
      ) : !hasData ? (
        <div
          style={{
            padding: 64,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          No section data available for this dashboard yet.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 20,
            maxWidth: 1200,
            margin: "-8px auto 0",
            padding: "0 24px 48px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Sidebar */}
          <aside
            style={{
              width: 208,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              paddingTop: 16,
              position: "sticky",
              top: 16,
              alignSelf: "flex-start",
            }}
          >
            <DarkCalendar
              available={availableDays}
              selected={selectedDays}
              onToggle={toggleDay}
              onClear={() => setSelectedDays(new Set())}
              initialMonth={latestDay}
            />

            <div
              style={{
                borderRadius: 12,
                padding: 12,
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  marginTop: 0,
                }}
              >
                Sections
              </p>
              {orderedSections.map((s) => (
                <button
                  key={s.name}
                  onClick={() => scrollTo(slug(s.name))}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: 32,
                    padding: "0 8px",
                    borderRadius: 6,
                    background: "transparent",
                    color: "var(--text-default)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: "left",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      minWidth: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      flexShrink: 0,
                    }}
                  >
                    {s.articles.length}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main report */}
          <main style={{ flex: 1, minWidth: 0, paddingTop: 16 }}>
            <div
              style={{
                borderRadius: 12,
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Report header */}
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                        margin: 0,
                      }}
                    >
                      {report.title}
                    </h2>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--text-muted)",
                        marginTop: 2,
                        marginBottom: 0,
                      }}
                    >
                      {report.sub}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 24,
                      flexShrink: 0,
                    }}
                  >
                    {[
                      {
                        label: "ARTICLES",
                        value: stats.total,
                        color: "var(--text-primary)",
                      },
                      { label: "POSITIVE", value: stats.POS, color: "#24A148" },
                      {
                        label: "NEUTRAL",
                        value: stats.NEU,
                        color: "var(--text-muted)",
                      },
                      { label: "NEGATIVE", value: stats.NEG, color: "#FF475C" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: stat.color,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {stat.value}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                            color: "var(--text-dimmed)",
                            marginTop: 3,
                          }}
                        >
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  Aggregated coverage{" "}
                  {report.range
                    ? `across ${report.nDays} days`
                    : "for the selected date"}
                  : {nf(stats.total)} articles ({nf(stats.POS)} positive ·{" "}
                  {nf(stats.NEU)} neutral · {nf(stats.NEG)} negative).
                </p>
              </div>

              {/* Sections */}
              {orderedSections.map((section) => {
                const isCollapsed = collapsed.has(section.name);
                const isDragging = dragName === section.name;
                const limit = showCounts[section.name] ?? PAGE_SIZE;
                const visible = section.articles.slice(0, limit);
                const remaining = section.articles.length - visible.length;

                return (
                  <div
                    key={section.name}
                    id={slug(section.name)}
                    onDragEnter={() => handleDragEnter(section.name)}
                    onDragOver={(e) => {
                      if (dragName) e.preventDefault();
                    }}
                    style={{ opacity: isDragging ? 0.5 : 1 }}
                  >
                    <button
                      draggable
                      onDragStart={(e) => {
                        setDragName(section.name);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={() => toggleCollapse(section.name)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 20px",
                        background: "var(--bg-elevated)",
                        borderBottom: "1px solid var(--border-subtle)",
                        border: "none",
                        cursor: "grab",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="var(--text-dimmed)"
                          aria-hidden="true"
                          style={{ flexShrink: 0 }}
                        >
                          <circle cx="5" cy="3" r="1.4" />
                          <circle cx="11" cy="3" r="1.4" />
                          <circle cx="5" cy="8" r="1.4" />
                          <circle cx="11" cy="8" r="1.4" />
                          <circle cx="5" cy="13" r="1.4" />
                          <circle cx="11" cy="13" r="1.4" />
                        </svg>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-muted)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: isCollapsed ? "rotate(-90deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--text-default)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {section.name}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          minWidth: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "var(--bg-card)",
                          color: "var(--accent)",
                        }}
                      >
                        {section.articles.length}
                      </span>
                    </button>

                    {!isCollapsed &&
                      (section.articles.length === 0 ? (
                        <p
                          style={{
                            padding: 16,
                            margin: 0,
                            fontSize: 12,
                            color: "var(--text-muted)",
                          }}
                        >
                          No articles
                          {selectedDays.size > 0
                            ? " on the selected dates"
                            : ""}
                          .
                        </p>
                      ) : (
                        <>
                          {visible.map((a, idx) => {
                            const key = articleKey(section.name, a, idx);
                            return (
                              <ArticleRow
                                key={a.id ?? idx}
                                entry={{
                                  a,
                                  key,
                                  sentiment: a.sentiment,
                                  isMostNegative: key === mostNegativeKey,
                                }}
                                hasBorder={
                                  idx < visible.length - 1 || remaining > 0
                                }
                                isHighlighted={highlightedKey === key}
                              />
                            );
                          })}
                          {remaining > 0 && (
                            <button
                              onClick={() =>
                                setShowCounts((prev) => ({
                                  ...prev,
                                  [section.name]:
                                    (prev[section.name] ?? PAGE_SIZE) +
                                    PAGE_SIZE,
                                }))
                              }
                              style={{
                                width: "100%",
                                padding: "10px 20px",
                                background: "transparent",
                                border: "none",
                                borderTop: "1px solid var(--border-subtle)",
                                color: "var(--accent)",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Show {Math.min(remaining, PAGE_SIZE)} more
                              articles
                            </button>
                          )}
                        </>
                      ))}
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      )}

      <ChatDock
        sessionId={session?.id}
        mode="route"
        chartsData={chartsData}
        dashboardKey="media_monitoring"
        project={project}
        session={session}
      />
    </div>
  );
}
