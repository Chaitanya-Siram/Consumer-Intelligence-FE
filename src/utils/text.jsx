// Renders the lightweight **bold** markup the LLM emits in insights/summaries.
// Splits on **…** runs and bolds them; everything else is plain text.
// export function Rich({ text }) {
//   if (!text) return null
//   const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
//   return (
//     <>
//       {parts.map((p, i) =>
//         p.startsWith('**') && p.endsWith('**') ? (
//           <strong key={i}>{p.slice(2, -2)}</strong>
//         ) : (
//           <span key={i}>{p}</span>
//         ),
//       )}
//     </>
//   )
// }

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib/utils";
import { isFlagSrc, withCountryFlags } from "./countryFlags.jsx";

function parseCssRules(val) {
  if (!val) return {};
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    const obj = {};
    const rules = val.split(/[,;]/);
    for (const rule of rules) {
      const trimmed = rule.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx !== -1) {
        let key = trimmed.slice(0, colonIdx).trim();
        let value = trimmed.slice(colonIdx + 1).trim();
        key = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        obj[key] = value;
      } else if (!isNaN(Number(trimmed))) {
        obj.lineHeight = trimmed;
      }
    }
    return obj;
  }
  return {};
}

export function Rich({
  text,
  lineHeight = "",
  className = "",
  style = null,
  color = "",
  suffix = null,
  inline = false,
}) {
  if (!text && !suffix) return null;
  if (!text && suffix) return <>{suffix}</>;

  const parsedStyle = parseCssRules(style);
  const parsedLineHeight = parseCssRules(lineHeight);

  const combinedStyle = {
    ...parsedStyle,
    ...parsedLineHeight,
  };

  if (color && !combinedStyle.color) {
    combinedStyle.color = color;
  }

  if (
    lineHeight &&
    !parsedLineHeight.lineHeight &&
    (typeof lineHeight === "number" || typeof lineHeight === "string") &&
    !isNaN(Number(lineHeight))
  ) {
    combinedStyle.lineHeight = lineHeight;
  }

  const styleObj =
    Object.keys(combinedStyle).length > 0 ? combinedStyle : undefined;
  const pClassName = cn(
    inline || suffix
      ? "inline mb-0"
      : combinedStyle.lineHeight || lineHeight
        ? "mb-3"
        : "mb-3 leading-7",
    className,
  );

  return (
    <div className={cn(inline || suffix ? "inline" : "block", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Flags added by withCountryFlags sit inline at text size; any other image renders as authored.
          img: ({ src, alt }) =>
            isFlagSrc(src) ? (
              <img src={src} alt="" width="16" height="16" loading="lazy" referrerPolicy="no-referrer" style={{ display: "inline-block", width: "1.05em", height: "1.05em", margin: "0 0.15em 0 0.25em", verticalAlign: "-0.15em" }} />
            ) : (
              <img src={src} alt={alt} loading="lazy" />
            ),

          h1: ({ children }) => (
            <h1
              className={cn("text-3xl font-bold mb-6", className)}
              style={styleObj}
            >
              {children}
            </h1>
          ),

          h2: ({ children }) => (
            <h2
              className={cn("text-xl font-semibold mt-8 mb-3", className)}
              style={styleObj}
            >
              {children}
            </h2>
          ),

          p: ({ children }) => (
            <p className={pClassName} style={styleObj}>
              {children}
              {suffix ? <span className="inline-block ml-1">{suffix}</span> : null}
            </p>
          ),

          ul: ({ children }) => (
            <ul
              className={cn(
                inline || suffix ? "inline list-none p-0 m-0" : "list-disc pl-6 space-y-2",
                className,
              )}
              style={styleObj}
            >
              {children}
            </ul>
          ),

          li: ({ children }) => (
            <li
              className={cn(inline || suffix ? "inline m-0 p-0" : "leading-relaxed", className)}
              style={styleObj}
            >
              {children}
              {suffix ? <span className="inline-block ml-1">{suffix}</span> : null}
            </li>
          ),

          table: ({ children }) => (
            <table
              className={cn(
                "w-full border border-gray-300 my-6",
                className,
              )}
              style={styleObj}
            >
              {children}
            </table>
          ),

          thead: ({ children }) => (
            <thead className="bg-gray-100">{children}</thead>
          ),

          th: ({ children }) => (
            <th className={cn("border p-3 text-left")}>{children}</th>
          ),

          td: ({ children }) => (
            <td className={cn("border p-3")}>{children}</td>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),

          hr: () => <hr className={cn("my-8 border-gray-200")} />,
        }}
      >
        {withCountryFlags(text)}
      </ReactMarkdown>
    </div>
  );
}

// Splits "- bullet" markdown blocks into an array of bullet strings.
export function toBullets(markdown) {
  if (!markdown) return [];
  return String(markdown)
    .split("\n")
    .map((l) => l.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
}

const INS_ALIASES = {
  sentiment_distribution: [
    "sentiment_breakdown_by_competitors",
    "sentiment",
    "sentiment_coverage",
    "net_sentiment_coverage",
  ],
  sentiment_breakdown_by_competitors: [
    "sentiment_distribution",
    "sentiment",
    "sentiment_coverage",
    "net_sentiment_coverage",
  ],
  datewise_coverage: [
    "media_monitoring",
    "coverage",
    "coverage_volume",
    "coverage_overtime_by_competitors",
  ],
  media_monitoring: [
    "datewise_coverage",
    "coverage",
    "coverage_volume",
    "coverage_overtime_by_competitors",
  ],
  coverage_overtime_by_competitors: [
    "datewise_coverage",
    "media_monitoring",
    "coverage",
    "coverage_volume",
  ],
  trust_kpi_breakdown: ["trust_kpis", "trust_waterfall"],
  trust_kpis: ["trust_kpi_breakdown", "trust_waterfall"],
  theme_distribution: ["theme_volume", "theme_pillar_heatmap"],
  theme_volume: ["theme_distribution", "theme_pillar_heatmap"],
};

export function getInsightObj(insights, id) {
  if (!insights) return null;
  if (insights[id]) return insights[id];
  const aliases = INS_ALIASES[id] || [];
  for (const alt of aliases) {
    if (insights[alt]) return insights[alt];
  }
  return null;
}
