import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDownIcon } from "../components/Icons.jsx";
import { Rich } from "../utils/text.jsx";
import MonitoringHero from "../components/MonitoringHero.jsx";
import { downloadMediaMonitoringReport } from "../api/charts.js";
import { updateSectionsOrders } from "../api/projects.js";

const DASHBOARD_KEY = "media_monitoring";
const SECTION_CHART_ID = "section_articles";

const SENT = {
  POS: { label: "Positive", cls: "sent--pos", color: "#00a878" },
  NEG: { label: "Negative", cls: "sent--neg", color: "#e8335a" },
  NEU: { label: "Neutral", cls: "sent--neu", color: "#5a5a72" },
};

const COLORS = [
  "#5b2fd4",
  "#2563eb",
  "#f59e0b",
  "#e8335a",
  "#00a878",
  "#8b6fe8",
];

// Stable slug so the section nav can scroll to its card.
function slug(name) {
  return `mmsec-${String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;
}

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

// Normalize any date value to a local YYYY-MM-DD key.
function dayKey(d) {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? "" : ymd(dt);
}

// Format a Date as a local YYYY-MM-DD key (no timezone shift).
function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fmtDay(key) {
  if (!key) return "";
  const dt = new Date(`${key}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return key;
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "May 6, 2026"
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

// Author can arrive as a string or a list of names; join into a display string.
function authorText(author) {
  if (Array.isArray(author)) return author.filter(Boolean).join(", ");
  return author ? String(author).trim() : "";
}

function GripIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="3" r="1.4" />
      <circle cx="11" cy="3" r="1.4" />
      <circle cx="5" cy="8" r="1.4" />
      <circle cx="11" cy="8" r="1.4" />
      <circle cx="5" cy="13" r="1.4" />
      <circle cx="11" cy="13" r="1.4" />
    </svg>
  );
}

// --- calendar ---------------------------------------------------------------

function MiniCalendar({ available, selected, onToggle, initialMonth }) {
  const [view, setView] = useState(() => {
    const base = initialMonth
      ? new Date(`${initialMonth}T00:00:00`)
      : new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const grid = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(
      view.getFullYear(),
      view.getMonth() + 1,
      0,
    ).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++)
      cells.push(new Date(view.getFullYear(), view.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  const shiftMonth = (delta) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button
          className="cal-nav-btn"
          aria-label="Previous month"
          onClick={() => shiftMonth(-1)}
        >
          <svg fill="none" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="cal-month">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </span>
        <button
          className="cal-nav-btn"
          aria-label="Next month"
          onClick={() => shiftMonth(1)}
        >
          <svg fill="none" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <span key={w} className="cal-day-label">
            {w}
          </span>
        ))}
        {grid.map((date, i) => {
          if (!date) return <span key={`b${i}`} className="cal-day empty" />;
          const key = ymd(date);
          const has = available.has(key);
          const isSelected = selected.has(key);

          let cls = "cal-day";
          if (has) cls += " has-data";
          if (isSelected) {
            cls += selected.size > 1 ? " multi-selected" : " selected";
          }
          return (
            <div
              key={key}
              className={cls}
              title={has ? fmtDay(key) : undefined}
              onClick={has ? () => onToggle(key) : undefined}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- article component ------------------------------------------------------

function ArticleCard({ a, sent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`nl-article ${expanded ? "expanded" : ""}`}>
      <div className="nl-article-header" onClick={() => setExpanded(!expanded)}>
        <button className="nl-article-toggle">
          <svg fill="none" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="nl-article-body">
          <div className="nl-article-meta" style={{ marginBottom: 4 }}>
            <span className="nl-article-source">
              {a.domain || "Unknown source"}
            </span>
            <span
              className="nl-article-sentiment"
              style={{ background: sent.color + "20", color: sent.color }}
            >
              {sent.label}
            </span>
            <span className="nl-article-section-tag">
              {fmtDay(dayKey(a.date)) || "—"}
            </span>
          </div>
          <div className="nl-article-headline">
            {a.url ? (
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {a.title || "Untitled"}
              </a>
            ) : (
              a.title || "Untitled"
            )}
          </div>
        </div>
      </div>
      <div className="nl-article-summary">
        {a.content && (
          <p
            style={{
              marginBottom: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              fontSize: "13px",
            }}
          >
            {a.content}
          </p>
        )}
        {a.similar_articles && Object.keys(a.similar_articles).length > 0 && (
          <p>
            <strong>Similar Articles:</strong>{" "}
            {Object.entries(a.similar_articles).map(([domain, url], idx) => (
              <Fragment key={domain}>
                {idx > 0 && ", "}
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer">
                    {domain}
                  </a>
                ) : (
                  domain
                )}
              </Fragment>
            ))}
          </p>
        )}
        {(authorText(a.author) || (a.reach != null && a.reach !== "")) && (
          <p style={{ marginTop: 8, fontSize: 11, color: "var(--tt-silver)" }}>
            {authorText(a.author) && <>By {authorText(a.author)}</>}
            {authorText(a.author) && a.reach != null && a.reach !== "" && " · "}
            {a.reach != null && a.reach !== "" && <>reach {nf(a.reach)}</>}
          </p>
        )}
      </div>
    </div>
  );
}

// --- main screen ------------------------------------------------------------

import { useOnBackHandler } from "../utils/useOnBackHandler.js";

export default function MediaMonitoringScreen({
  project,
  session,
  chartsData,
  chartsLoading = false,
  chartsError = "",
  onBack,
}) {
  useOnBackHandler(onBack);
  const [selectedDays, setSelectedDays] = useState(() => new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

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

  const toggleDay = (key) =>
    setSelectedDays((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

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

  const [collapsed, setCollapsed] = useState(() => new Set());
  const [order, setOrder] = useState([]);
  const [showCounts, setShowCounts] = useState({});
  const PAGE_SIZE = 15;
  const [dragName, setDragName] = useState(null);

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

  const orderedSections = useMemo(() => {
    if (order.length === 0) return filtered;
    const byName = new Map(filtered.map((s) => [s.name, s]));
    const out = order.map((n) => byName.get(n)).filter(Boolean);
    filtered.forEach((s) => {
      if (!order.includes(s.name)) out.push(s);
    });
    return out;
  }, [filtered, order]);

  const toggleCollapse = (name) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

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

  const summary = chartsData?.[`${DASHBOARD_KEY}_overall_summary`] || "";
  const hasData = sections.length > 0;

  const totalAll = useMemo(
    () => sections.reduce((n, s) => n + s.articles.length, 0),
    [sections],
  );

  const heroStats = useMemo(() => {
    const daysAvailable = availableDays.size;
    const avgPerDay = daysAvailable ? Math.round(totalAll / daysAvailable) : 0;
    return [
      { n: nf(daysAvailable), l: "Days available" },
      { n: nf(avgPerDay), l: "Avg / day" },
      { n: nf(sections.length), l: "Sections" },
    ];
  }, [availableDays, totalAll, sections]);

  const hero = useMemo(() => {
    const { total, POS: pos, NEG: neg, NEU: neu } = stats;
    if (!hasData || total === 0) {
      return {
        kicker: "Daily Monitoring · No coverage in window",
        headLead: "Pick a window.",
        headEm: "Build the report.",
        sub: "Select a day or range with coverage (marked with a dot) to assemble a monitoring report.",
      };
    }
    const posPct = Math.round((pos / total) * 100);
    if (selectedDays.size === 1) {
      const key = [...selectedDays][0];
      return {
        kicker: `Daily Monitoring · ${fmtDay(key)}`,
        headLead: `${weekday(key)}:`,
        headEm: `${pos} of ${total} articles ran positive.`,
        sub: `${pos} positive · ${neu} neutral · ${neg} negative across ${total} articles on ${fmtShort(key)}.`,
      };
    }
    const days = (
      selectedDays.size ? [...selectedDays] : [...availableDays]
    ).sort();
    const nDays = days.length;
    const windowLabel = selectedDays.size ? "the selected window" : "all dates";
    return {
      kicker: `Daily Monitoring · ${fmtShort(days[0])} – ${fmtShort(days[nDays - 1])} · ${nDays} days`,
      headLead: `${nf(total)} articles across ${nDays} days.`,
      headEm: `${posPct}% ran positive.`,
      sub: `${nf(pos)} positive · ${nf(neu)} neutral · ${nf(neg)} negative across ${windowLabel}.`,
    };
  }, [stats, selectedDays, availableDays, hasData]);

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

  const scrollToSection = (name) => {
    document
      .getElementById(slug(name))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <MonitoringHero
        project={project}
        session={session}
        chartsData={chartsData}
        virtualReport={
          report.total > 0
            ? {
                day: report.title,
                date: report.sub,
                total: report.total,
                pos: report.POS,
                neut: report.NEU,
                neg: report.NEG,
              }
            : null
        }
        kicker={hero.kicker}
        headLead={hero.headLead}
        headEm={hero.headEm}
        sub={hero.sub}
        stats={heroStats}
        onBack={onBack}
        onDownload={session?.id ? handleDownloadReport : undefined}
        downloading={downloading}
        downloadDisabled={stats.total === 0}
        downloadError={downloadError}
      />

      {chartsLoading ? (
        <div className="state">
          <span className="loader" />
          <p>Loading dashboard…</p>
        </div>
      ) : chartsError ? (
        <div className="state state--error">
          <p>{chartsError}</p>
        </div>
      ) : !hasData ? (
        <div className="state">
          <p>No section data available for this dashboard yet.</p>
        </div>
      ) : (
        <>
          {summary && (
            <section className="summary">
              <p className="summary__kicker">OVERALL SUMMARY</p>
              <p className="summary__body">
                <Rich text={summary} />
              </p>
            </section>
          )}

          <div className="monitor-layout">
            <aside className="monitor-panel">
              <div className="panel-header">
                <h2>Daily Monitor</h2>
                <p>Shift+click or tap multiple dates to combine</p>
              </div>

              <MiniCalendar
                available={availableDays}
                selected={selectedDays}
                onToggle={toggleDay}
                initialMonth={latestDay}
              />

              {selectedDays.size > 0 && (
                <div style={{ padding: "0 20px 16px" }}>
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "var(--tt-bg2)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--tt-purple)",
                      fontWeight: 600,
                    }}
                  >
                    {selectedDays.size}{" "}
                    {selectedDays.size === 1 ? "day" : "days"} selected
                  </div>
                  <button
                    onClick={() => setSelectedDays(new Set())}
                    style={{
                      marginTop: 6,
                      width: "100%",
                      padding: 8,
                      background: "none",
                      border: "1px solid var(--tt-pearl)",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "var(--tt-slate)",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Clear selection
                  </button>
                </div>
              )}

              <div className="bucket-nav">
                <h3>Quick Navigate</h3>
                {orderedSections.map((section, idx) => {
                  const dotColor = COLORS[idx % COLORS.length];
                  return (
                    <button
                      key={section.name}
                      className="bucket-btn"
                      onClick={() => scrollToSection(section.name)}
                    >
                      <span
                        className="bucket-dot"
                        style={{ background: dotColor }}
                      />
                      {section.name}
                      <span className="bucket-count">
                        {section.articles.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main className="monitor-main">
              {report.total > 0 && (
                <div className="exec-summary-card">
                  <div
                    style={{
                      padding: "32px 36px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div className="exec-eyebrow">{report.title} Report</div>
                    <h2 className="exec-title">{report.sub || "Overview"}</h2>
                    <div className="exec-date-range">
                      Aggregated coverage{" "}
                      {report.range
                        ? `across ${report.nDays} days`
                        : "for selected date"}
                      : {nf(report.total)} articles.
                    </div>

                    <div className="exec-takeaways">
                      <div className="exec-takeaway">
                        <span className="exec-takeaway-num">01</span>
                        <div className="exec-takeaway-text">
                          <strong>Sentiment Profile</strong>
                          {nf(report.POS)} positive · {nf(report.NEU)} neutral ·{" "}
                          {nf(report.NEG)} negative articles.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {orderedSections.map((section, idx) => {
                const isCollapsed = collapsed.has(section.name);
                const isDragging = dragName === section.name;
                const dotColor = COLORS[idx % COLORS.length];

                return (
                  <div
                    className={`nl-section ${isCollapsed ? "collapsed" : ""}`}
                    key={section.name}
                    id={slug(section.name)}
                    onDragEnter={() => handleDragEnter(section.name)}
                    onDragOver={(e) => {
                      if (dragName) e.preventDefault();
                    }}
                  >
                    <div
                      className="nl-section-header"
                      draggable
                      onDragStart={(e) => {
                        setDragName(section.name);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={() => toggleCollapse(section.name)}
                      style={{ opacity: isDragging ? 0.5 : 1 }}
                    >
                      <span
                        className="nl-section-dot"
                        style={{ background: dotColor }}
                      />
                      <span className="nl-section-title">{section.name}</span>
                      <span
                        className="nl-section-badge"
                        style={{ background: dotColor }}
                      >
                        {section.articles.length}
                      </span>
                      <div className="nl-bucket-arrow">
                        <svg fill="none" viewBox="0 0 24 24">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    <div
                      className={`nl-section-body ${isCollapsed ? "collapsed" : ""}`}
                    >
                      {section.articles.length === 0 ? (
                        <p style={{ padding: 16, color: "var(--tt-slate)" }}>
                          No articles
                          {selectedDays.size > 0
                            ? " on the selected dates"
                            : ""}
                          .
                        </p>
                      ) : (
                        (() => {
                          const visibleArticles = section.articles.slice(
                            0,
                            showCounts[section.name] ?? PAGE_SIZE,
                          );
                          const remaining =
                            section.articles.length - visibleArticles.length;
                          return (
                            <>
                              {visibleArticles.map((a, i) => {
                                const sent = SENT[a.sentiment] || {
                                  label: a.sentiment || "—",
                                  color: "var(--tt-slate)",
                                };
                                return (
                                  <ArticleCard
                                    key={a.id ?? i}
                                    a={a}
                                    sent={sent}
                                  />
                                );
                              })}
                              {remaining > 0 && (
                                <button
                                  type="button"
                                  className="nl-expand-all"
                                  style={{ marginTop: 8 }}
                                  onClick={() => {
                                    setShowCounts((prev) => ({
                                      ...prev,
                                      [section.name]:
                                        (prev[section.name] ?? PAGE_SIZE) +
                                        PAGE_SIZE,
                                    }));
                                  }}
                                >
                                  Show {Math.min(remaining, PAGE_SIZE)} more
                                  articles
                                </button>
                              )}
                            </>
                          );
                        })()
                      )}
                    </div>
                  </div>
                );
              })}
            </main>
          </div>
        </>
      )}
    </>
  );
}
