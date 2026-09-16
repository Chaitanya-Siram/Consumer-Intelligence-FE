/**
 * The storyboard's charts.
 *
 * Chart.js rather than the app's Recharts: the source pages are built on Chart.js
 * 4.x and depend on its specifics (indexAxis bars with borderRadius, stacked
 * signal x brand, an indexed momentum line). Recharts is still what renders the
 * media-monitoring screens.
 */
// `chart.js/auto` registers every controller, scale and element on the same module
// instance react-chartjs-2 resolves. Hand-registering a subset from "chart.js" left
// the dev server throwing '"linear" is not a registered scale'.
import "chart.js/auto";
import "./chartAxisIcons.js";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import PlatformIcon from "./PlatformIcon.jsx";

const FONT = { family: "Inter" };

/**
 * Chart.js paints to a canvas, so it cannot inherit CSS variables — the axis and
 * grid colours have to be read as values and the charts rebuilt when the theme
 * flips. `useThemes` writes data-theme onto <html>, so that is what we watch.
 */
function useChartTheme() {
  const [theme, setTheme] = useState(() =>
    typeof document === "undefined" ? null : document.documentElement.getAttribute("data-theme"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.documentElement.getAttribute("data-theme")),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return useMemo(() => {
    const dark = theme === "dark";
    return {
      grid: dark ? "#232B3D" : "#EAEEF5",
      tick: dark ? "#8A94A8" : "#6B7280",
      brand: dark ? "#A855F7" : "#702082",
      muted: dark ? "#46345E" : "#c4b5fd",
      positive: "#10B981",
    };
  }, [theme]);
}

function useAxes() {
  const theme = useChartTheme();
  return useMemo(
    () => ({
      theme,
      base: {
        x: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
        y: { grid: { color: theme.grid }, ticks: { font: FONT, color: theme.tick } },
      },
      legend: {
        position: "bottom",
        labels: {
          font: { size: 10, family: "Inter" },
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 14,
          color: theme.tick,
        },
      },
    }),
    [theme],
  );
}

export function Legendary({ items }) {
  if (!items?.length) return null;
  return (
    <div className="legend">
      {items.map((item) => (
        <div className="legend-item" key={item.name}>
          <div className="legend-dot" style={{ background: item.color }} />
          <div className="legend-label">{item.name}</div>
        </div>
      ))}
    </div>
  );
}

function Empty({ label = "No data for this view." }) {
  return <div className="sb-chart-empty">{label}</div>;
}

/** Horizontal bars with the subject brand picked out, as in the source page. */
function HorizontalBrandBar({ rows, brand, accent, tooltip, height = 300 }) {
  const { theme, base } = useAxes();
  if (!rows?.length) return <Empty />;

  return (
    <div style={{ height }}>
      <Bar
        data={{
          labels: rows.map((r) => r.brand),
          datasets: [
            {
              data: rows.map((r) => r.value),
              backgroundColor: rows.map((r) => (r.brand === brand ? theme.brand : accent)),
              borderRadius: 5,
            },
          ],
        }}
        options={{
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => tooltip(c.raw) } },
          },
          scales: {
            x: base.x,
            y: { grid: { display: false }, ticks: { font: { family: "Inter", size: 10 }, color: theme.tick } },
          },
        }}
      />
    </div>
  );
}

export function ShareOfVoiceChart({ rows, brand }) {
  const { theme } = useAxes();
  return (
    <HorizontalBrandBar
      rows={rows}
      brand={brand}
      accent={theme.muted}
      tooltip={(v) => `${v}% of conversations`}
    />
  );
}

export function NetSentimentChart({ rows, brand }) {
  const { theme } = useAxes();
  return (
    <HorizontalBrandBar
      rows={rows}
      brand={brand}
      accent={theme.positive}
      tooltip={(v) => `Net ${v > 0 ? "+" : ""}${v}`}
    />
  );
}

export function TrajectoryChart({ signals, days }) {
  const { base } = useAxes();
  if (!signals?.length || !days?.length) return <Empty />;

  return (
    <div style={{ height: 340 }}>
      <Line
        data={{
          labels: days,
          datasets: signals.map((s) => ({
            label: s.name,
            data: s.share,
            borderColor: s.color,
            backgroundColor: `${s.color}18`,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 7,
            borderWidth: 2.5,
            fill: false,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
          scales: {
            x: base.x,
            y: { ...base.y, title: { display: true, text: "Mentions per 1,000 daily", font: FONT } },
          },
        }}
      />
    </div>
  );
}

export function PhaseChart({ signals, days }) {
  const { base, legend } = useAxes();
  if (!signals?.length || !days?.length) return <Empty />;

  return (
    <div style={{ height: 260 }}>
      <Bar
        data={{
          labels: days,
          datasets: signals.map((s) => ({
            label: s.name,
            data: s.share,
            backgroundColor: `${s.color}cc`,
            borderRadius: 3,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend },
          scales: base,
        }}
      />
    </div>
  );
}

export function MomentumChart({ signals, days }) {
  const { base, legend } = useAxes();
  if (!signals?.length || days?.length < 2) return <Empty label="Needs at least two days of data." />;

  // Indexed to the first full day so signals of very different volumes can be
  // compared on one axis — the source page's "Jun 26 = 100".
  const labels = days.slice(1);
  const datasets = signals.map((s) => {
    const base100 = s.share[1] || 1;
    return {
      label: s.name,
      data: s.share.slice(1).map((v) => Math.round((100 * v) / base100)),
      borderColor: s.color,
      backgroundColor: `${s.color}18`,
      tension: 0.3,
      pointRadius: 3,
      borderWidth: 2.5,
      fill: false,
    };
  });

  return (
    <div style={{ height: 260 }}>
      <Line
        data={{ labels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend, tooltip: { mode: "index", intersect: false } },
          scales: {
            x: base.x,
            y: { ...base.y, title: { display: true, text: `Index (${labels[0]} = 100)`, font: FONT } },
          },
        }}
      />
    </div>
  );
}

export function LeadersChart({ matrix, palette }) {
  const { base, legend, theme } = useAxes();
  const signalNames = Object.keys(matrix || {});
  if (!signalNames.length) return <Empty />;

  const brands = [...new Set(signalNames.flatMap((s) => Object.keys(matrix[s])))];
  if (!brands.length) return <Empty label="No competitor mentions in this dataset." />;

  return (
    <div style={{ height: 300 }}>
      <Bar
        data={{
          labels: signalNames,
          datasets: brands.map((b, i) => ({
            label: b,
            data: signalNames.map((s) => matrix[s][b] || 0),
            backgroundColor: palette[i % palette.length],
            borderRadius: 2,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend },
          scales: {
            x: { stacked: true, grid: { display: false }, ticks: { font: { family: "Inter", size: 8 }, color: theme.tick } },
            y: { ...base.y, stacked: true },
          },
        }}
      />
    </div>
  );
}

/**
 * Signal x platform grid. Hand-built rather than charted: the source page renders
 * it as a table of shaded cells, which is both lighter and easier to read than a
 * charting library's heatmap.
 */
export function Heatmap({ signals, platforms }) {
  if (!signals?.length || !platforms?.length) return <Empty />;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px", textAlign: "left" }} />
            {platforms.map((p) => (
              <th
                key={p}
                style={{
                  padding: "6px",
                  color: "var(--ink3)",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  textTransform: "uppercase",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <PlatformIcon platform={p} size={16} rounded={5} />
                  {String(p).split(" ")[0]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => (
            <tr key={signal.id}>
              <td
                style={{
                  padding: "7px 8px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                }}
              >
                {signal.name}
              </td>
              {signal.platforms.map((value, i) => {
                const alpha = Math.max(0.06, value / 40);
                const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
                return (
                  <td
                    // eslint-disable-next-line react/no-array-index-key -- column order is the identity
                    key={i}
                    style={{
                      padding: "7px",
                      textAlign: "center",
                      background: `${signal.color}${hex}`,
                      borderRadius: "4px",
                      fontFamily: "'JetBrains Mono',monospace",
                      fontWeight: 700,
                      fontSize: "10px",
                      color: value > 22 ? "#fff" : "var(--ink)",
                    }}
                  >
                    {value}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
