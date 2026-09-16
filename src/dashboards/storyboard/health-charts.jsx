/**
 * Charts for the Brand Health tracker.
 *
 * Chart.js like the Trend storyboard, and for the same reason: the source page is
 * built on it. `chart.js/auto` registers everything on the instance react-chartjs-2
 * resolves — hand-registering a subset resolves a different module and throws
 * '"linear" is not a registered scale'.
 */
import "chart.js/auto";
import "./chartAxisIcons.js";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line, Radar } from "react-chartjs-2";
import BrandLogo from "./BrandLogo.jsx";

const FONT = { family: "Inter" };

/** Canvas cannot inherit CSS variables, so theme colours are read as values. */
function useTheme() {
  const [theme, setTheme] = useState(() =>
    typeof document === "undefined" ? null : document.documentElement.getAttribute("data-theme"),
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute("data-theme")),
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return useMemo(() => {
    const dark = theme === "dark";
    return {
      grid: dark ? "#232B3D" : "#EAEEF5",
      tick: dark ? "#8A94A8" : "#6B7280",
      brand: dark ? "#A855F7" : "#702082",
    };
  }, [theme]);
}

const TONE = { pos: "#10B981", neu: "#F59E0B", neg: "#EF4444" };

function Empty({ label = "No data for this view." }) {
  return <div className="sb-chart-empty">{label}</div>;
}

export function SentimentDonut({ split, height = 200 }) {
  const theme = useTheme();
  if (!split?.some((s) => s.value)) return <Empty />;
  return (
    <div style={{ height }}>
      <Doughnut
        data={{
          labels: split.map((s) => s.label),
          datasets: [
            {
              data: split.map((s) => s.value),
              backgroundColor: split.map((s) => TONE[s.tone]),
              borderWidth: 0,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { size: 10, family: "Inter" },
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: "circle",
                padding: 12,
                color: theme.tick,
              },
            },
          },
        }}
      />
    </div>
  );
}

export function CategoryBars({ rows, color, horizontal = true, height = 200 }) {
  const theme = useTheme();
  if (!rows?.length) return <Empty />;
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels: rows.map((r) => r.name),
          datasets: [{ data: rows.map((r) => r.value), backgroundColor: color, borderRadius: 4 }],
        }}
        options={{
          indexAxis: horizontal ? "y" : "x",
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
            y: {
              grid: { display: horizontal, color: theme.grid },
              ticks: { font: { family: "Inter", size: 10 }, color: theme.tick },
            },
          },
        }}
      />
    </div>
  );
}

export function DimensionRadar({ rows, brand, height = 260 }) {
  const theme = useTheme();
  if (!rows?.length) return <Empty />;
  return (
    <div style={{ height }}>
      <Radar
        data={{
          labels: rows.map((r) => r.name),
          datasets: [
            {
              label: brand || "Brand",
              data: rows.map((r) => r.score),
              borderColor: theme.brand,
              backgroundColor: `${theme.brand}33`,
              borderWidth: 2,
              pointRadius: 3,
            },
            {
              // The mean of the other dimensions — the only benchmark a
              // single-brand export can honestly provide.
              label: "Other dimensions (mean)",
              data: rows.map((r) => r.benchmark),
              borderColor: "#9CA3AF",
              backgroundColor: "rgba(156,163,175,.16)",
              borderWidth: 1.5,
              borderDash: [4, 3],
              pointRadius: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { size: 10, family: "Inter" },
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: "circle",
                padding: 12,
                color: theme.tick,
              },
            },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              grid: { color: theme.grid },
              angleLines: { color: theme.grid },
              pointLabels: { font: { size: 10, family: "Inter" }, color: theme.tick },
              ticks: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

export function TrendLine({ rows, color, valueKey = "net_sentiment", label, height = 200 }) {
  const theme = useTheme();
  if (!rows?.length) return <Empty />;
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels: rows.map((r) => r.day?.slice(5) || r.day),
          datasets: [
            {
              label,
              data: rows.map((r) => r[valueKey]),
              borderColor: color,
              backgroundColor: `${color}22`,
              tension: 0.35,
              pointRadius: 3,
              borderWidth: 2.5,
              fill: true,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
          scales: {
            x: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
            y: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
          },
        }}
      />
    </div>
  );
}

/**
 * Positive / Neutral / Negative per day as three stacked bands — the executive
 * page's "Daily Sentiment Trend (Brand-Relevant)" chart in the source.
 */
export function StackedSentimentArea({ rows, height = 220 }) {
  const theme = useTheme();
  if (!rows?.some((r) => r.positive || r.neutral || r.negative)) return <Empty />;
  const band = (key, tone) => ({
    label: key[0].toUpperCase() + key.slice(1),
    data: rows.map((r) => r[key] || 0),
    borderColor: TONE[tone],
    backgroundColor: `${TONE[tone]}55`,
    fill: true,
    stack: "s",
    tension: 0.35,
    pointRadius: 0,
    borderWidth: 1.5,
  });
  return (
    <div style={{ height }}>
      <Line
        data={{
          labels: rows.map((r) => r.day?.slice(5) || r.day),
          datasets: [band("positive", "pos"), band("neutral", "neu"), band("negative", "neg")],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { size: 10, family: "Inter" },
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: "circle",
                padding: 12,
                color: theme.tick,
              },
            },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
            y: { stacked: true, grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
          },
        }}
      />
    </div>
  );
}

/**
 * Positive / Neutral / Negative counts per sub-KPI, stacked — the source page's
 * "Sentiment by Sub-KPI" and "Advocacy Sentiment Polarity" charts.
 */
export function GroupedSentimentBars({ rows, height = 200 }) {
  const theme = useTheme();
  if (!rows?.some((r) => r.positive || r.neutral || r.negative)) return <Empty />;
  const ds = (key, tone) => ({
    label: key[0].toUpperCase() + key.slice(1),
    data: rows.map((r) => r[key] || 0),
    backgroundColor: TONE[tone],
    borderRadius: 3,
    stack: "s",
  });
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels: rows.map((r) => r.name),
          datasets: [ds("positive", "pos"), ds("neutral", "neu"), ds("negative", "neg")],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                font: { size: 10, family: "Inter" },
                boxWidth: 8,
                usePointStyle: true,
                pointStyle: "circle",
                padding: 12,
                color: theme.tick,
              },
            },
          },
          scales: {
            x: { stacked: true, grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { font: { family: "Inter", size: 10 }, color: theme.tick },
            },
          },
        }}
      />
    </div>
  );
}

/** Normalised positive rate per sub-KPI, on a radar — source's "Sub-KPI Radar". */
export function PosRateRadar({ rows, brand, color = "#702082", height = 220 }) {
  const theme = useTheme();
  if (!rows?.length) return <Empty />;
  return (
    <div style={{ height }}>
      <Radar
        data={{
          labels: rows.map((r) => r.name),
          datasets: [
            {
              label: `${brand || "Brand"} · positive rate %`,
              data: rows.map((r) => r.pos_rate),
              borderColor: color,
              backgroundColor: `${color}33`,
              borderWidth: 2,
              pointRadius: 3,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 10, family: "Inter" }, boxWidth: 8, usePointStyle: true, pointStyle: "circle", padding: 12, color: theme.tick },
            },
          },
          scales: {
            r: {
              min: 0,
              max: 100,
              grid: { color: theme.grid },
              angleLines: { color: theme.grid },
              pointLabels: { font: { size: 9, family: "Inter" }, color: theme.tick },
              ticks: { display: false },
            },
          },
        }}
      />
    </div>
  );
}

/** Weighted contribution per dimension — what each actually adds to the index. */
export function ContributionBars({ rows, height = 220 }) {
  const theme = useTheme();
  if (!rows?.length) return <Empty />;
  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels: rows.map((r) => r.name),
          datasets: [
            {
              data: rows.map((r) => r.contribution),
              backgroundColor: rows.map((r) => r.color),
              borderRadius: 4,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => {
                  const row = rows[c.dataIndex];
                  return `${row.contribution} of ${row.weight} possible (score ${row.score})`;
                },
              },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: "Inter", size: 9 }, color: theme.tick } },
            y: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
          },
        }}
      />
    </div>
  );
}


/**
 * The source page's funnel and gauge blocks are CSS, not canvas — a stack of
 * tapering bars and a row of labelled tracks. Ported as markup so they keep the
 * page's own styling rather than becoming another chart.
 */
export function HealthFunnel({ rows }) {
  if (!rows?.length) return <Empty />;
  const peak = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="funnel">
      {rows.map((row) => (
        <div key={row.name} style={{ width: "100%", textAlign: "center" }}>
          <div
            className="funnel-bar"
            style={{
              // Taper toward the base: each stage is narrower than the one above.
              width: `${Math.max(28, (row.value / peak) * 100)}%`,
              margin: "0 auto",
              background: row.color,
            }}
          >
            {row.value.toLocaleString()}
          </div>
          <div className="funnel-label">{row.name}</div>
        </div>
      ))}
    </div>
  );
}

/** Pass `logos` when the rows are brands — each label then carries its mark.
 * `max` pins the scale (e.g. 100 for a 0-100 score) instead of the largest row. */
export function GaugeRows({ rows, suffix = "", logos, max }) {
  if (!rows?.length) return <Empty />;
  const peak = max || Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div>
      {rows.map((row) => (
        <div className="gauge-row" key={row.name}>
          <div
            className="gauge-label"
            style={logos ? { display: "inline-flex", alignItems: "center", gap: 6 } : undefined}
          >
            {logos ? <BrandLogo brand={row.name} logos={logos} size={16} rounded={5} /> : null}
            {row.bold ? <b>{row.name}</b> : row.name}
          </div>
          <div className="gauge-track">
            <div
              className="gauge-fill"
              style={{
                width: `${Math.max(2, (Math.abs(row.value) / peak) * 100)}%`,
                background: row.color || "var(--brand-mid)",
              }}
            />
          </div>
          <div className="gauge-val">
            {row.value}
            {suffix}
          </div>
        </div>
      ))}
    </div>
  );
}
