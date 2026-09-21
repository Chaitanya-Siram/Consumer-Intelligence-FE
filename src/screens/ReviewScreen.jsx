import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  addTaggedArticles,
  approveTaggedArticles,
  deleteTaggedArticle,
  fetchArticleByUrl,
  getTaggedArticles,
  markArticlesIrrelevant,
  markArticlesRelevant,
  taggingWsUrl,
  updateTaggedArticles,
} from "../api/tagging.js";
import { listSessions } from "../api/sessions.js";
import { prettyFileName } from "../utils/files.js";
import { chartsWsUrl } from "../api/charts.js";
import {
  ciWsUrl,
  MI_LENS_KEYS,
  sessionHasCI,
  sessionHasMI,
} from "../api/consumerIntelligence.js";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  DashboardIcon,
  EditIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  TrashIcon,
  ExternalLinkIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  CopyIcon,
} from "../components/Icons.jsx";
import { SparklesIcon } from "../workflow/wfIcons.jsx";
import CanvasTabBar from "../components/canvas/CanvasTabBar.jsx";
import DateRangePicker from "../components/DateRangePicker.jsx";
import {
  bumpIdSeq,
  hasSavedGraph,
  restoreNodes,
  seedNodes,
  MM_LENS,
  MM_REVIEW_COLUMNS,
  OTHER_REVIEW_COLUMNS,
  IRRELEVANT_REVIEW_COLUMNS,
  ALL_COL_KEYS,
} from "../workflow/workflowUtils.js";
import { useNodesState } from "reactflow";
import { useParams, useNavigate } from "react-router-dom";
import { getSession } from "../api/sessions.js";
import { paths } from "../router/nav.js";
import toast from "react-hot-toast";

const SENTIMENT = {
  POS: { label: "Positive", cls: "sent--pos" },
  NEG: { label: "Negative", cls: "sent--neg" },
  NEU: { label: "Neutral", cls: "sent--neu" },
};

const THEME_TAXONOMY = [
  "Clinical Trials",
  "Regulatory",
  "Product Pipeline",
  "Market Analysis",
  "Financial",
  "Partnerships",
  "Competitive Intelligence",
  "Reputation",
];

// Lightweight popover portal helper
function Popover({ pos, onClose, children }) {
  if (!pos) return null;
  const style =
    pos.right !== undefined
      ? {
          position: "fixed",
          top: pos.top,
          right: pos.right,
          zIndex: 9999,
          minWidth: 160,
        }
      : {
          position: "fixed",
          top: pos.top,
          left: pos.left,
          zIndex: 9999,
          minWidth: 160,
        };

  return createPortal(
    <>
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          cursor: "default",
          background: "transparent",
          border: "none",
        }}
      />
      <div
        className="portal-dropdown"
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

// Segmented switcher for the review sub-tabs. `tabs` is [{ key, label }].
function SubTabSwitcher({ tabs, value, onChange }) {
  return (
    <div
      className={cn(
        "flex",
        "items-center",
        "p-0.5",
        "rounded-lg",
        "border",
        "border-[var(--border-default)]",
        "bg-[var(--bg-card)]",
        "shrink-0",
      )}
      style={{
        display: "flex",
        padding: "2px",
        borderRadius: "8px",
        border: "1px solid var(--border-default)",
        background: "var(--bg-card)",
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          style={{
            height: "28px",
            padding: "0 12px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            background: value === t.key ? "var(--accent)" : "transparent",
            color: value === t.key ? "#fff" : "var(--text-muted)",
          }}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Circular progress ring representing approval progress
function ApprovalRing({ pct }) {
  const r = 12;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle
        cx="15"
        cy="15"
        r={r}
        fill="none"
        stroke="var(--surface-2)"
        strokeWidth="3"
      />
      <circle
        cx="15"
        cy="15"
        r={r}
        fill="none"
        stroke="var(--pos)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// Revamped Status dropdown cell supporting Approved, Disapproved, and Pending
function StatusCell({ approved, onToggle }) {
  const [pos, setPos] = useState(null);

  function handleOpen(e) {
    e.stopPropagation();
    if (pos) {
      setPos(null);
    } else {
      const r = e.currentTarget.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 2,
        left: r.left + window.scrollX,
      });
    }
  }

  function close() {
    setPos(null);
  }

  const isApproved = approved === true || approved === "approved";
  const isDisapproved = approved === false || approved === "disapproved";
  const isPending = !isApproved && !isDisapproved;

  let badgeClass = "status-badge--pending";
  let label = "Pending";
  let IconComponent = null;

  if (isApproved) {
    badgeClass = "status-badge--approved";
    label = "Approved";
    IconComponent = CheckIcon;
  } else if (isDisapproved) {
    badgeClass = "status-badge--disapproved";
    label = "Disapproved";
    IconComponent = CloseIcon;
  }

  return (
    <div className={cn("inline-flex", "items-center")}>
      <button
        type="button"
        onClick={handleOpen}
        className={`status-badge ${badgeClass}`}
      >
        {IconComponent && <IconComponent width={11} height={11} />}
        {label}
        <ChevronDownIcon
          width={10}
          height={10}
          className={cn("opacity-50", "ml-0.5")}
        />
      </button>

      <Popover pos={pos} onClose={close}>
        <p className="portal-dropdown__title">Update status to</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(true);
            close();
          }}
          className="portal-dropdown__item"
        >
          <span className="portal-dropdown__checkring">
            {isApproved && <span className="portal-dropdown__checkfill" />}
          </span>
          <span
            style={{
              color: "var(--pos, #16a34a)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckIcon width={12} height={12} /> Approved
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(false);
            close();
          }}
          className="portal-dropdown__item"
        >
          <span className="portal-dropdown__checkring">
            {isDisapproved && <span className="portal-dropdown__checkfill" />}
          </span>
          <span
            style={{
              color: "var(--neg, #dc2626)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CloseIcon width={12} height={12} /> Disapproved
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(null);
            close();
          }}
          className="portal-dropdown__item"
        >
          <span className="portal-dropdown__checkring">
            {isPending && <span className="portal-dropdown__checkfill" />}
          </span>
          <span
            style={{
              color: "var(--text-soft, #64748b)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            Pending
          </span>
        </button>
      </Popover>
    </div>
  );
}

// Revamped Confidence Badge cell
function ConfidenceBadge({ value }) {
  const percent = typeof value === "number" ? Math.round(value * 100) : null;
  if (percent === null) return <span className="muted">—</span>;

  let color = "var(--neg)";
  if (value >= 0.75) color = "var(--pos)";
  else if (value >= 0.5) color = "var(--warn)";

  return (
    <div className="conf-bar">
      <div className="conf-bar__track">
        <div
          className="conf-bar__fill"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
      <span className="conf-bar__text" style={{ color }}>
        {percent}%
      </span>
    </div>
  );
}

// Revamped Sentiment cell
function SentimentCell({ value, onChange }) {
  const [pos, setPos] = useState(null);

  const sent = SENTIMENT[value] || {
    label: value || "—",
    cls: "sent--neu",
  };

  function handleOpen(e) {
    e.stopPropagation();
    if (pos) {
      setPos(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
    });
  }

  const options = ["POS", "NEU", "NEG"];

  const getPillCls = (key) => {
    if (key === "POS") return "sent-pill--pos";
    if (key === "NEG") return "sent-pill--neg";
    return "sent-pill--neu";
  };

  const getLabelColor = (key) => {
    if (key === "POS") return "var(--pos)";
    if (key === "NEG") return "var(--neg)";
    return "var(--text-soft)";
  };

  return (
    <div className={cn("relative", "inline-block")}>
      <button
        type="button"
        onClick={handleOpen}
        className={`sent-pill ${getPillCls(value)}`}
        style={{ color: getLabelColor(value), cursor: "pointer" }}
      >
        {sent.label}
        <ChevronDownIcon
          width={10}
          height={10}
          className={cn("opacity-60", "ml-0.5")}
        />
      </button>
      <Popover pos={pos} onClose={() => setPos(null)}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt);
              setPos(null);
            }}
            className="portal-dropdown__item"
            style={{ color: getLabelColor(opt) }}
          >
            <span
              className="portal-dropdown__dot"
              style={{ background: getLabelColor(opt) }}
            />
            {SENTIMENT[opt]?.label || opt}
          </button>
        ))}
      </Popover>
    </div>
  );
}

// Revamped Themes cell
function ThemesCell({ theme, onChange }) {
  const [pos, setPos] = useState(null);

  const themes = useMemo(() => {
    return String(theme || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }, [theme]);

  function toggle(t) {
    const next = themes.includes(t)
      ? themes.filter((x) => x !== t)
      : [...themes, t];
    onChange(next.join(", "));
  }

  function handleOpen(e) {
    e.stopPropagation();
    if (pos) {
      setPos(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setPos({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
    });
  }

  // Combine taxonomy with any other existing themes so we don't lose custom themes
  const options = useMemo(() => {
    const set = new Set([...THEME_TAXONOMY, ...themes]);
    return [...set];
  }, [themes]);

  return (
    <div className="relative">
      <div
        className={cn(
          "flex",
          "items-center",
          "gap-1.5",
          "flex-nowrap",
          "overflow-hidden",
        )}
      >
        {themes.map((t) => (
          <span key={t} className="theme-pill">
            <span className="truncate" title={t}>
              {t}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(t);
              }}
              className="theme-pill__close"
            >
              <CloseIcon width={10} height={10} />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={handleOpen}
          className="theme-add-btn"
          aria-label="Add theme"
        >
          <PlusIcon width={10} height={10} />
        </button>
      </div>
      <Popover pos={pos} onClose={() => setPos(null)}>
        <p className="portal-dropdown__title">Themes</p>
        {options.map((t) => {
          const active = themes.includes(t);
          return (
            <button
              key={t}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle(t);
              }}
              className="portal-dropdown__item"
            >
              <span className="portal-dropdown__checkring">
                {active && <span className="portal-dropdown__checkfill" />}
              </span>
              <span
                className={active ? "text-primary font-medium" : "text-default"}
              >
                {t}
              </span>
            </button>
          );
        })}
      </Popover>
    </div>
  );
}

// Per-field confidences — stored as 0–1 floats, edited/shown as 0–100 percents.
const CONFIDENCE_FIELDS = [
  "sentiment_confidence",
  "theme_confidence",
  "section_category_confidence",
  "relevancy_confidence",
];

// The tagged fields the review table lets you edit, keyed by article field name.
const EDIT_FIELDS = {
  relevancy_confidence: { type: "number" },
  relevancy_reason: { type: "text" },
  sentiment: { type: "select", options: ["POS", "NEG", "NEU"] },
  theme: { type: "text" },
  sentiment_confidence: { type: "number" },
  theme_confidence: { type: "number" },
  section_category_confidence: { type: "number" },
  brand_of_interest: { type: "list" },
  competitors: { type: "list" },
  priority_watch: { type: "bool" },
  section: { type: "text" },
  peoples: { type: "list" },
  countries: { type: "list" },
  organizations: { type: "list" },
  // Relation fields: hold the parent (main) article id. `relation: true` keeps
  // them out of the Add-by-URL form and gates editing behind `relationEditable`.
  // Editing one re-parents the article, so the grouped view moves it.
  syndication_of: { type: "text", relation: true },
  similar_of: { type: "text", relation: true },
};

function list(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (val == null || val === "") return [];
  return [val];
}

// Display the full date + time in the user's current timezone. The stored
// value is never mutated — this is presentation only. A pure date (no time)
// is rendered as a calendar date so the timezone can't shift the day.
function fmtDate(d) {
  if (!d) return "—";
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return s;
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Normalize any date value to a YYYY-MM-DD key for range comparison.
function dayKey(d) {
  if (!d) return "";
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

const FILTER_INIT = {
  title: "",
  content: "",
  url: "",
  dateFrom: "",
  dateTo: "",
  relConfOp: ">=",
  relConfVal: "",
  relevancy_reason: "",
  section: "",
  author: "",
  sentiment: "",
  theme: "",
  secConfOp: ">=",
  secConfVal: "",
  sentConfOp: ">=",
  sentConfVal: "",
  themeConfOp: ">=",
  themeConfVal: "",
  brand_of_interest: "",
  competitors: "",
  priority: "",
  peoples: "",
  countries: "",
  organizations: "",
  addedType: "",
};

// Filter keys that hold an operator (not a value) — ignored by "filters active".
const FILTER_OP_KEYS = new Set([
  "secConfOp",
  "sentConfOp",
  "themeConfOp",
  "relConfOp",
]);

// Does an article's confidence (0–1) pass a "op value%" filter? Empty value = pass.
function confPass(val, op, raw) {
  if (raw === "" || raw == null) return true;
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return true;
  if (typeof val !== "number") return false;
  const cp = val * 100;
  if (op === "<=") return cp <= num;
  if (op === "=") return Math.round(cp) === Math.round(num);
  return cp >= num; // default '>='
}

// Author may be a string or a list of names; join for display/filtering.
function authorText(author) {
  if (Array.isArray(author)) return author.filter(Boolean).join(", ");
  return author ? String(author).trim() : "";
}

// Starting values for an "add article" row (editor representations).
const newRow = (key) => ({
  _key: key,
  title: "",
  content: "",
  date: "",
  sentiment: "NEU",
  priority_watch: false,
});

// The editor's working value for a field: the draft if present, else the
// article's value coerced to the editor's representation (CSV for lists).
function editorValue(article, drafts, field, type) {
  const dv = drafts?.[field];
  if (dv !== undefined) return dv;
  if (type === "list") return list(article[field]).join(", ");
  if (type === "bool") return !!article[field];
  // Confidences are stored as 0–1 floats but edited as 0–100 percents.
  if (CONFIDENCE_FIELDS.includes(field))
    return typeof article[field] === "number"
      ? Math.round(article[field] * 100)
      : "";
  return article[field] ?? "";
}

// Coerce an editor value back to the API shape for the given field type.
function coerce(type, v) {
  if (type === "list")
    return String(v || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  if (type === "number") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  if (type === "bool") return !!v;
  return String(v ?? "").trim();
}

// Original value in API shape, so we can diff drafts against it.
function originalValue(article, field, type) {
  if (type === "list") return list(article[field]);
  if (type === "bool") return !!article[field];
  if (type === "number") {
    if (typeof article[field] !== "number") return null;
    // Compare against the percent shown in the editor (confidences stored 0–1).
    return CONFIDENCE_FIELDS.includes(field)
      ? Math.round(article[field] * 100)
      : article[field];
  }
  return article[field] ?? "";
}

function sameValue(type, a, b) {
  if (type === "list") return JSON.stringify(a) === JSON.stringify(b);
  return a === b;
}

function CellEditor({ field, type, value, onChange }) {
  if (type === "select") {
    return (
      <select
        className="ecell"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {EDIT_FIELDS[field].options.map((o) => (
          <option key={o} value={o}>
            {SENTIMENT[o]?.label || o}
          </option>
        ))}
      </select>
    );
  }
  if (type === "bool") {
    return (
      <input
        type="checkbox"
        className="ecell__check"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }
  if (type === "number") {
    // Confidence is edited as a 0–100 percent; the API converts it to a 0–1 float.
    return (
      <input
        className={cn("ecell", "ecell--num")}
        type="number"
        min="0"
        max="100"
        step="1"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className="ecell"
      value={value ?? ""}
      placeholder={type === "list" ? "comma, separated" : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Table cell wrapper. Defined at module scope (not inline in the table
// component) so its component identity is stable across renders — otherwise
// React remounts every cell on each keystroke and inputs lose focus.
function Td({ children, className = "", title, style }) {
  return (
    <td
      className={`rt-td ${className}`}
      title={title}
      style={{ verticalAlign: "middle", ...style }}
    >
      {children}
    </td>
  );
}

// A checkbox that can render the tri-state "indeterminate" look (set via DOM ref).
function TriCheckbox({ checked, indeterminate = false, onChange, ariaLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="rtbl__check"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  );
}

function ListCell({ value }) {
  const items = list(value);
  if (items.length === 0) return <span className="muted">—</span>;
  const joined = items.join(", ");
  return (
    <span className="clamp" title={joined}>
      {joined}
    </span>
  );
}

// Title/content/reason etc.: clamped by default; click to toggle the full text
// inline (wraps within the column, so it grows the row height without breaking
// the table layout). Hovering still shows the native tooltip while collapsed.
function ExpandableCell({ text, prefix = null, className = "", style }) {
  const [open, setOpen] = useState(false);
  const value = text || "—";
  return (
    <span
      role="button"
      tabIndex={0}
      className={`${open ? "xcell xcell--open" : "xcell clamp"}${
        className ? ` ${className}` : ""
      }`}
      title={open ? undefined : text || undefined}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((o) => !o);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }
      }}
    >
      {prefix}
      {value}
    </span>
  );
}

// Tag fields shown (in order) in the "Add by URL" modal, after the body fields.
const URL_TAG_FIELDS = [
  ["relevancy_confidence", "Relevancy Confidence"],
  ["relevancy_reason", "Relevancy Reason"],
  ["section", "Section"],
  ["section_category_confidence", "Section Confidence"],
  ["brand_of_interest", "Brand of interest"],
  ["sentiment", "Sentiment"],
  ["sentiment_confidence", "Sentiment Confidence"],
  ["theme", "Theme"],
  ["theme_confidence", "Theme Confidence"],
  ["competitors", "Competitors"],
  ["priority_watch", "Priority watch"],
  ["peoples", "People"],
  ["countries", "Countries"],
  ["organizations", "Organizations"],
];

// A fetched+tagged article → the modal's editable form representation (lists as
// CSV, confidences as 0–100 percents — matching the inline add-row editors).
function articleToForm(a) {
  const f = {
    title: a.title || "",
    content: a.content || "",
    url: a.url || "",
    date: a.date ? String(a.date) : "",
    author: authorText(a.author || a.authors_byline),
  };
  for (const [field, cfg] of Object.entries(EDIT_FIELDS)) {
    if (cfg.relation) continue;
    if (cfg.type === "list") f[field] = list(a[field]).join(", ");
    else if (cfg.type === "bool") f[field] = !!a[field];
    else if (cfg.type === "number")
      f[field] = typeof a[field] === "number" ? a[field] : (a[field] ?? "");
    else f[field] = a[field] ?? "";
  }
  return f;
}

// Build the add-article payload from the modal form (one article). Confidences
// stay 0–100 here; the API converts them to 0–1 floats on save.
function formToPayload(form) {
  const title = String(form.title || "").trim();
  const content = String(form.content || "").trim();
  const payload = { title, content };
  const date = String(form.date || "").trim();
  const url = String(form.url || "").trim();
  const author = String(form.author || "").trim();
  if (date) payload.date = date;
  if (url) payload.url = url;
  if (author) payload.author = author;
  for (const [field, cfg] of Object.entries(EDIT_FIELDS)) {
    if (cfg.relation) continue;
    const v = coerce(cfg.type, form[field]);
    if (cfg.type === "list" && (!v || v.length === 0)) continue;
    payload[field] = v;
  }
  return payload;
}

// Modal: paste a URL → fetch + AI-tag the article → review/edit every field →
// Save appends it to the tagged file. Paywalled URLs surface a subscription error.
// True only for a well-formed http(s) URL.
function isValidHttpUrl(str) {
  let parsed;
  try {
    parsed = new URL(str.trim());
  } catch {
    return false;
  }
  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    !!parsed.hostname &&
    parsed.hostname.includes(".")
  );
}

function AddByUrlModal({ sessionId, onClose, onSaved }) {
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [form, setForm] = useState(null); // null until an article is fetched
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const doFetch = async () => {
    const u = url.trim();
    if (!u || fetching) return;
    // Validate the link before hitting the API.
    if (!isValidHttpUrl(u)) {
      setForm(null);
      setFetchErr(
        "Please enter a valid URL starting with http:// or https://.",
      );
      return;
    }
    setFetching(true);
    setFetchErr("");
    setForm(null);
    try {
      const article = await fetchArticleByUrl(sessionId, u);
      setForm(articleToForm(article));
    } catch (err) {
      setFetchErr(err.message || "Failed to fetch the article.");
    } finally {
      setFetching(false);
    }
  };

  const doSave = async () => {
    if (!form || saving) return;
    const payload = formToPayload(form);
    if (!payload.title && !payload.content) {
      setSaveErr("The article needs a title or content.");
      return;
    }
    setSaving(true);
    setSaveErr("");
    try {
      const created = await addTaggedArticles(sessionId, [payload]);
      onSaved(Array.isArray(created) ? created : [created]);
    } catch (err) {
      setSaveErr(err.message || "Failed to add the article.");
    } finally {
      setSaving(false);
    }
  };

  const tagField = (field, label) => {
    const cfg = EDIT_FIELDS[field];
    return (
      <label className="field" key={field}>
        <span className="field__label">{label}</span>
        {cfg.type === "bool" ? (
          <input
            type="checkbox"
            checked={!!form[field]}
            onChange={(e) => setField(field, e.target.checked)}
          />
        ) : cfg.type === "select" ? (
          <select
            className="field__input"
            value={form[field] ?? ""}
            onChange={(e) => setField(field, e.target.value)}
          >
            {cfg.options.map((o) => (
              <option key={o} value={o}>
                {SENTIMENT[o]?.label || o}
              </option>
            ))}
          </select>
        ) : cfg.type === "number" ? (
          <input
            className="field__input"
            type="number"
            min="0"
            max="100"
            step="1"
            value={form[field] ?? ""}
            onChange={(e) => setField(field, e.target.value)}
          />
        ) : (
          <input
            className="field__input"
            value={form[field] ?? ""}
            placeholder={cfg.type === "list" ? "comma, separated" : ""}
            onChange={(e) => setField(field, e.target.value)}
          />
        )}
      </label>
    );
  };

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div
        className={cn("modal", "modal--url")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="url-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="url-title" className="modal__title">
          Add article by URL
        </h2>
        <p className="modal__sub">
          Paste an article URL — we’ll fetch it and AI-tag every field for you
          to review.
        </p>

        <div className="urlfetch">
          <input
            className="field__input"
            placeholder="https://example.com/news/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                doFetch();
              }
            }}
            disabled={fetching}
          />
          <button
            className={cn("btn", "btn--primary")}
            onClick={doFetch}
            disabled={fetching || !url.trim()}
          >
            {fetching ? "Fetching…" : form ? "Re-fetch" : "Fetch"}
          </button>
        </div>
        {fetchErr && (
          <div className={cn("savenote", "savenote--err")}>{fetchErr}</div>
        )}

        {form && (
          <>
            <div className="urlform">
              <label className={cn("field", "urlform__full")}>
                <span className="field__label">Title</span>
                <input
                  className="field__input"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                />
              </label>
              <label className={cn("field", "urlform__full")}>
                <span className="field__label">Content</span>
                <textarea
                  className="field__input"
                  rows={4}
                  value={form.content}
                  onChange={(e) => setField("content", e.target.value)}
                />
              </label>
              <label className={cn("field", "urlform__full")}>
                <span className="field__label">URL</span>
                <input
                  className="field__input"
                  value={form.url}
                  onChange={(e) => setField("url", e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">Date</span>
                <input
                  className="field__input"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">Author</span>
                <input
                  className="field__input"
                  value={form.author}
                  onChange={(e) => setField("author", e.target.value)}
                />
              </label>
              {URL_TAG_FIELDS.map(([field, label]) => tagField(field, label))}
            </div>
            {saveErr && (
              <div className={cn("savenote", "savenote--err")}>{saveErr}</div>
            )}
          </>
        )}

        <div className="form__actions">
          <button
            type="button"
            className={cn("btn", "btn--ghost")}
            onClick={onClose}
            disabled={saving || fetching}
          >
            Cancel
          </button>
          <button
            type="button"
            className={cn("btn", "btn--primary")}
            onClick={doSave}
            disabled={!form || saving || fetching}
          >
            {saving ? "Saving…" : "Save article"}
          </button>
        </div>
      </div>
    </div>
  );
}

const IDLE_JOB = {
  kind: null, // 'tagging' | 'charts'
  active: false,
  phase: "idle", // idle | connecting | running | complete | error
  messages: [],
  progress: { done: 0, total: 0 },
  totalArticles: 0,
  errorMsg: "",
};

// Column keys in render order (the checkbox column is always shown and not
// listed here). `columns` prop, when given, restricts the table to a subset.

import { useOnBackHandler } from "../utils/useOnBackHandler.js";
import { cn } from "../lib/utils";

export default function ReviewScreen({
  project,
  session,
  runTagging = false,
  onBack,
  onCreated,
  onApprovalChange,
  onJobStateChange,
  asModal = false,
  onClose,
  columns = null,
  relationEditable = false,
  approvalField = "is_approved_for_dashboards",
}) {
  useOnBackHandler(onBack);
  // Which tagged-file flag this review's approvals read/write. Media Monitoring
  // uses `is_approved_for_monitoring`; every other review uses `is_approved_for_dashboards`.
  const forMonitoring = approvalField === "is_approved_for_monitoring";
  const navigate = useNavigate();

  const DEFAULT_COL_WIDTHS = useMemo(
    () => ({
      status: 100,
      id: 60,
      title: 220,
      content: 250,
      url: 180,
      date: 130,
      relevancy_confidence: 100,
      relevancy_reason: 180,
      section: 120,
      section_confidence: 100,
      brand: 110,
      sentiment: 90,
      sentiment_confidence: 100,
      theme: 110,
      theme_confidence: 100,
      competitors: 140,
      author: 120,
      priority: 80,
      people: 110,
      countries: 100,
      organizations: 130,
      syndication: 90,
      similar: 90,
      added_type: 90,
      actions: 130,
    }),
    [],
  );

  const [colWidths, setColWidths] = useState(DEFAULT_COL_WIDTHS);
  const [resizing, setResizing] = useState(null);

  const startResize = (key, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = colWidths[key];
    const onMove = (ev) => {
      setColWidths((prev) => ({
        ...prev,
        [key]: Math.max(50, startWidth + ev.clientX - startX),
      }));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const { sessionId } = useParams();

  const getSessionById = async () => {
    try {
      const session = await getSession(sessionId);
      return session;
    } catch (error) {
      toast.error("Error fetching session");
      console.log(error);
    }
  };

  const [sessionData, setSessionData] = useState(null);
  const [nodes, setNodes] = useNodesState([]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getSession(sessionId);
        setSessionData(session);

        const initialNodes = hasSavedGraph(session?.workflow)
          ? restoreNodes(session.workflow)
          : seedNodes(session);

        if (hasSavedGraph(session?.workflow)) {
          bumpIdSeq(initialNodes);
        }

        setNodes(initialNodes);
      } catch (error) {
        toast.error("Error fetching session");
        console.error(error);
      }
    };

    loadSession();
  }, [sessionId, setNodes]);

  const [subTab, setSubTab] = useState("monitoring");
  // When the user tries to create the dashboard having tagged only one of the
  // two split tabs, hold the "missing" tab here to drive a confirmation popup.
  const [pendingCharts, setPendingCharts] = useState(null); // "monitoring" | "dashboard" | null

  const isIrrelevantTab = subTab === "irrelevant";

  const shouldSplit = useMemo(() => {
    // if (!forMonitoring) return false;
    const hasOtherThanMediaMonitoring = nodes.some(
      (n) => n.type === "analysis" && n.data?.lens === MM_LENS,
    );
    console.log({ hasOtherThanMediaMonitoring });

    const mmAnalysisCount = nodes.filter((n) => n.type === "analysis").length;
    return mmAnalysisCount > 1 && hasOtherThanMediaMonitoring
      ? true
      : hasOtherThanMediaMonitoring;
  }, [nodes]);

  const currentApprovalField = shouldSplit
    ? subTab === "monitoring"
      ? "is_approved_for_monitoring"
      : "is_approved_for_dashboards"
    : approvalField;

  const currentForMonitoring = shouldSplit
    ? subTab === "monitoring"
      ? true
      : false
    : forMonitoring;

  const currentVisibleCols = useMemo(() => {
    // Irrelevant articles are untagged, so only the relevancy columns carry
    // anything — show that subset instead of the tagging ones.
    if (isIrrelevantTab) return new Set(IRRELEVANT_REVIEW_COLUMNS);
    if (shouldSplit) {
      return new Set(
        subTab === "monitoring" ? MM_REVIEW_COLUMNS : OTHER_REVIEW_COLUMNS,
      );
    }
    return columns ? new Set(columns) : null;
  }, [isIrrelevantTab, shouldSplit, subTab, columns]);

  const show = useCallback(
    (key) => !currentVisibleCols || currentVisibleCols.has(key),
    [currentVisibleCols],
  );

  // The Irrelevant tab's status cell holds a "Mark relevant" button, which needs
  // more room than the approval badge to stay on one line. Set as state, not
  // derived, so the column stays resizable by hand afterwards.
  useEffect(() => {
    setColWidths((prev) => ({
      ...prev,
      status: isIrrelevantTab ? 150 : DEFAULT_COL_WIDTHS.status,
    }));
  }, [isIrrelevantTab, DEFAULT_COL_WIDTHS]);

  const stickyLeft = useMemo(() => {
    let currentLeft = 38; // starts after Checkbox

    // Status column
    const statusLeft = currentLeft;
    currentLeft += colWidths.status;

    // ID column
    const idLeft = currentLeft;
    if (show("id")) {
      currentLeft += colWidths.id;
    }

    // Title column
    const titleLeft = currentLeft;

    return {
      checkbox: 0,
      status: statusLeft,
      id: idLeft,
      title: titleLeft,
    };
  }, [colWidths, show]);

  // Trailing actions column — moving an article to Irrelevant. Only meaningful
  // on the relevant tabs; the Irrelevant tab has its own Status-column action.
  const showActions = !isIrrelevantTab;

  const groupColSpan =
    (currentVisibleCols
      ? ALL_COL_KEYS.filter((k) => currentVisibleCols.has(k)).length
      : ALL_COL_KEYS.length) +
    1 +
    (showActions ? 1 : 0);

  const totalColSpan = groupColSpan + 1;

  const totalWidth = useMemo(() => {
    let sum = 38 + colWidths.status;
    if (show("id")) sum += colWidths.id;
    if (show("title")) sum += colWidths.title;
    if (show("content")) sum += colWidths.content;
    if (show("url")) sum += colWidths.url;
    if (show("date")) sum += colWidths.date;
    if (show("relevancy_confidence")) sum += colWidths.relevancy_confidence;
    if (show("relevancy_reason")) sum += colWidths.relevancy_reason;
    if (show("section")) sum += colWidths.section;
    if (show("section_confidence")) sum += colWidths.section_confidence;
    if (show("brand")) sum += colWidths.brand;
    if (show("sentiment")) sum += colWidths.sentiment;
    if (show("sentiment_confidence")) sum += colWidths.sentiment_confidence;
    if (show("theme")) sum += colWidths.theme;
    if (show("theme_confidence")) sum += colWidths.theme_confidence;
    if (show("competitors")) sum += colWidths.competitors;
    if (show("author")) sum += colWidths.author;
    if (show("priority")) sum += colWidths.priority;
    if (show("people")) sum += colWidths.people;
    if (show("countries")) sum += colWidths.countries;
    if (show("organizations")) sum += colWidths.organizations;
    if (show("syndication")) sum += colWidths.syndication;
    if (show("similar")) sum += colWidths.similar;
    if (show("added_type")) sum += colWidths.added_type;
    if (showActions) sum += colWidths.actions;
    return sum;
  }, [colWidths, show, showActions]);

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(!runTagging);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  // Inline tag editing. `drafts` holds per-article, per-field editor values
  // keyed by article id: { [id]: { [field]: editorValue } }.
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  // Per-column filters (plus the global search box).
  const [filters, setFilters] = useState(FILTER_INIT);

  // Row selection (checkbox column). Keyed by article id. Pre-ticked for
  // already-approved articles; the green Approve button persists the selection.
  const [selected, setSelected] = useState(() => new Set());
  const [approving, setApproving] = useState(false);
  const [hasPendingApprovalChanges, setHasPendingApprovalChanges] =
    useState(false);

  const markPendingApproval = useCallback(
    (val) => {
      setHasPendingApprovalChanges(val);
      onApprovalChange?.(val);
    },
    [onApprovalChange],
  );

  // Table view: 'flat' (every article in a row) or 'grouped' (main article with
  // its similar + syndicated children nested beneath it)
  const [viewMode, setViewMode] = useState("grouped");
  const [sessionsList, setSessionsList] = useState([]);
  const [selectedSyncBatch, setSelectedSyncBatch] = useState("all");

  // Expanded sub-groups in grouped view, keyed by `${mainId}:similar|syndicated`.
  // Sections are collapsed by default — a key is present only once expanded.
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleCollapse = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  // Adding brand-new articles via editable rows at the bottom of the table.
  // `newRows` holds one draft object per pending row (empty = not adding).
  const [newRows, setNewRows] = useState([]);
  const [addSaving, setAddSaving] = useState(false);
  const rowKeyRef = useRef(0);
  const adding = newRows.length > 0;

  // "Add by URL" modal — fetch + AI-tag a single article, then review & save it.
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const onUrlSaved = useCallback((created) => {
    setArticles((prev) => [...prev, ...created]);
    setUrlModalOpen(false);
    const n = created.length;
    setSaveNote(
      `Added ${n} article${n === 1 ? "" : "s"}. Dashboards will rebuild on next Create Dashboard.`,
    );
  }, []);

  // A single WebSocket "job" — tagging or charts — surfaced inline (no modal).
  // Only one runs at a time, so they share one progress panel.
  const [job, setJob] = useState(() =>
    runTagging
      ? { ...IDLE_JOB, kind: "tagging", active: true, phase: "connecting" }
      : IDLE_JOB,
  );
  const wsRef = useRef(null);

  // Fetches every tagged article (relevant and irrelevant) once. The tabs filter
  // this one list in memory — they must never trigger another fetch.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let list = [];
      if (selectedSyncBatch === "all") {
        // Also feeds the "All syncs" dropdown, so it's fetched here rather than
        // in a second effect.
        const res = project?.id
          ? await listSessions(project.id).catch(() => [])
          : [];
        const sessions = Array.isArray(res) ? res : [];
        setSessionsList(sessions);
        if (sessions.length > 0) {
          const results = await Promise.all(
            sessions.map((s) => getTaggedArticles(s.id).catch(() => [])),
          );
          list = results.flat();
        } else if (session?.id) {
          const data = await getTaggedArticles(session.id);
          list = Array.isArray(data) ? data : [];
        }
      } else {
        const data = await getTaggedArticles(selectedSyncBatch);
        list = Array.isArray(data) ? data : [];
      }

      setArticles(list);
    } catch (err) {
      setError(err.message || "Failed to load tagged articles.");
    } finally {
      setLoading(false);
    }
  }, [session?.id, project?.id, selectedSyncBatch]);

  // One fetch, split in memory: the Monitoring and Dashboard tabs review the
  // relevant articles, the Irrelevant tab the ones the relevancy gate dropped.
  // An article with no `is_relevant` flag predates the gate and counts as relevant.
  const relevantArticles = useMemo(
    () => articles.filter((a) => a.is_relevant !== false),
    [articles],
  );
  const irrelevantArticles = useMemo(
    () => articles.filter((a) => a.is_relevant === false),
    [articles],
  );
  const visibleArticles = isIrrelevantTab
    ? irrelevantArticles
    : relevantArticles;

  // Media Monitoring / Dashboard Data only exist when the workflow splits the
  // review; Irrelevant is always offered so the dropped articles stay reachable.
  const subTabs = useMemo(() => {
    const tabs = shouldSplit
      ? [
          { key: "monitoring", label: "Media Monitoring" },
          { key: "dashboard", label: "Dashboard Data" },
        ]
      : [{ key: "monitoring", label: "Relevant" }];
    return [
      ...tabs,
      { key: "irrelevant", label: `Irrelevant (${irrelevantArticles.length})` },
    ];
  }, [shouldSplit, irrelevantArticles.length]);

  // Pre-tick the articles already approved for the active tab.
  useEffect(() => {
    setSelected(
      new Set(
        visibleArticles.filter((a) => a[currentApprovalField]).map((a) => a.id),
      ),
    );
  }, [currentApprovalField, visibleArticles]);

  useEffect(() => {
    load();
  }, [load]);

  // Generic runner shared by both sockets. `onDone(msg)` fires on "complete".
  const runJob = useCallback(
    (kind, url, onDone) => {
      // "charts" (MI) and "ci" (Consumer Intelligence) are both chart jobs.
      const isCharts = kind === "charts" || kind === "ci";
      try {
        wsRef.current?.close();
      } catch {
        /* already closed */
      }

      setError("");
      setJob({ ...IDLE_JOB, kind, active: true, phase: "connecting" });

      const push = (text) =>
        setJob((j) => ({ ...j, messages: [...j.messages, text] }));
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setJob((j) => ({ ...j, phase: "running" }));
        push(
          isCharts
            ? "Connected — building dashboards…"
            : "Connected — starting tagging…",
        );
        ws.send(JSON.stringify({ session_id: session.id }));
      };

      ws.onmessage = (ev) => {
        let msg;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "start": {
            setJob((j) => ({ ...j, totalArticles: msg.total_articles || 0 }));
            // `msg.lenses` is the backend's fully-expanded CI lens-key list (one Tier 1
            // pillar can expand to several, e.g. brand_intelligence -> 4 keys), so its
            // length overcounts what the user actually picked. Count the distinct Tier 1
            // selections from the workflow itself instead — same source DashboardsScreen
            // already reads for its "one card per Tier 1 pillar" count.
            // Media Intelligence lenses live in the same workflow but are built by
            // a different stream, so they are not part of this "consumer-intelligence" count.
            const tier1Count = new Set(
              (session?.workflow?.nodes || [])
                .filter((n) => n.type === "analysis" && n.data?.lens && !MI_LENS_KEYS.includes(n.data.lens))
                .map((n) => n.data.lens),
            ).size;
            push(
              kind === "ci"
                ? `Building ${tier1Count} consumer-intelligence lens${tier1Count === 1 ? "" : "es"} across ${msg.total_articles} articles…`
                : isCharts
                  ? `Crunching ${msg.total_articles} articles across ${(msg.dashboards || []).length} dashboards…`
                : `Tagging ${msg.total_articles} articles…`,
            );
            break;
          }
          case "batch": // tagging only
            setJob((j) => ({
              ...j,
              progress: {
                done: msg.completed_batches || 0,
                total: msg.total_batches || 0,
              },
            }));
            push(
              `Batch ${(msg.batch_index ?? 0) + 1} done — ${msg.completed_batches}/${msg.total_batches} batches (${msg.tagged_count} tagged)`,
            );
            break;
          case "progress": // charts only (stage-based)
            push(msg.message || `Working on ${msg.stage}…`);
            break;
          case "lens_complete": // ci only
            push(`${msg.lens} ready`);
            break;
          case "lens_error": // ci only
            push(`Error in ${msg.lens}: ${msg.detail}`);
            break;
          case "complete":
            setJob((j) => ({
              ...j,
              phase: "complete",
              progress: {
                done: j.progress.total || j.progress.done,
                total: j.progress.total || j.progress.done,
              },
            }));
            push(
              kind === "ci"
                ? `Consumer-intelligence lenses ready${msg.elapsed_seconds ? ` in ${msg.elapsed_seconds}s` : ""}.`
                : isCharts
                  ? `Dashboards ready${msg.elapsed_seconds ? ` in ${msg.elapsed_seconds}s` : ""}.`
                : `Completed ${msg.total_tagged} articles in ${msg.elapsed_seconds}s.`,
            );
            onDone?.(msg);
            break;
          case "error":
            setJob((j) => ({
              ...j,
              phase: "error",
              errorMsg: msg.detail || "Something went wrong.",
            }));
            push(`Error: ${msg.detail}`);
            break;
          default:
            break;
        }
      };

      ws.onerror = () => {
        setJob((j) =>
          j.phase === "complete"
            ? j
            : {
                ...j,
                phase: "error",
                errorMsg:
                  j.errorMsg || "Connection error — is the backend running?",
              },
        );
      };
    },
    [session.id],
  );

  const isJobRunning =
    job.active && (job.phase === "connecting" || job.phase === "running");

  useEffect(() => {
    onJobStateChange?.(isJobRunning);
  }, [isJobRunning, onJobStateChange]);

  const startTagging = useCallback(() => {
    runJob("tagging", taggingWsUrl(), () => load());
  }, [runJob, load]);

  const startCharts = useCallback(() => {
    markPendingApproval(false);
    // Which chart jobs this session needs, from its workflow's analysis nodes.
    // Neither detected -> legacy session: run the MI charts job as before.
    let hasMI = sessionHasMI(session);
    let hasCI = sessionHasCI(session);
    if (!hasMI && !hasCI) hasMI = true;

    // CI job; merges the MI payload (if any) into the CI one for onCreated.
    const runCI = (miData) =>
      runJob("ci", ciWsUrl(), (msg) =>
        onCreated?.({ ...(miData || {}), ...(msg.charts_data || {}) }),
      );

    if (hasMI && hasCI) {
      runJob("charts", chartsWsUrl(), (msg) => runCI(msg.charts_data));
    } else if (hasCI) {
      runCI(null);
    } else {
      runJob("charts", chartsWsUrl(), (msg) => onCreated?.(msg.charts_data));
    }
  }, [runJob, onCreated, markPendingApproval, session]);

  // Gate Create Dashboard: when the review is split into Media Monitoring +
  // Dashboard tagging, warn if the user tagged only one of the two before
  // building. Otherwise start charts immediately.
  const requestCreateCharts = useCallback(() => {
    if (shouldSplit) {
      const monitoringDone = articles.some((a) => a.is_approved_for_monitoring);
      const dashboardDone = articles.some((a) => a.is_approved_for_dashboards);
      // Exactly one tagged → confirm; flag the tab that's still missing.
      if (monitoringDone !== dashboardDone) {
        setPendingCharts(monitoringDone ? "dashboard" : "monitoring");
        return;
      }
    }
    startCharts();
  }, [shouldSplit, articles, startCharts]);

  const autoTagAttemptedRef = useRef(runTagging);

  // Auto-start tagging if no articles exist after loading
  useEffect(() => {
    if (
      !loading &&
      !error &&
      articles.length === 0 &&
      !isJobRunning &&
      !autoTagAttemptedRef.current
    ) {
      autoTagAttemptedRef.current = true;
      startTagging();
    }
  }, [loading, error, articles.length, isJobRunning, startTagging]);

  // On mount: kick off tagging when asked (Generate dashboards). Loading the
  // tagged articles is handled by the load() effect above.
  useEffect(() => {
    if (runTagging) startTagging();
    return () => {
      try {
        wsRef.current?.close();
      } catch {
        /* already closed */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeSectionTab, setActiveSectionTab] = useState("all");

  const availableSections = useMemo(() => {
    const set = new Set();
    for (const a of visibleArticles) {
      const sec = (a.section || "").trim();
      if (sec) {
        set.add(sec);
      }
    }
    return Array.from(set);
  }, [visibleArticles]);

  useEffect(() => {
    if (
      activeSectionTab !== "all" &&
      !availableSections.includes(activeSectionTab)
    ) {
      setActiveSectionTab("all");
    }
  }, [availableSections, activeSectionTab]);

  const sectionCounts = useMemo(() => {
    const counts = {};
    let total = 0;
    for (const a of visibleArticles) {
      // Also respect global search text if any!
      const q = query.trim().toLowerCase();
      if (q) {
        const hay = [
          a.title,
          a.content,
          a.theme,
          a.section,
          authorText(a.author || a.authors_byline),
          ...list(a.brand_of_interest),
          ...list(a.competitors),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const sec = (a.section || "").trim();
      if (sec) {
        counts[sec] = (counts[sec] || 0) + 1;
      }
      total++;
    }
    return { counts, total };
  }, [visibleArticles, query]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = filters;
    const textIncl = (val, term) =>
      !term ||
      String(val ?? "")
        .toLowerCase()
        .includes(term.toLowerCase());
    const listIncl = (val, term) =>
      !term || list(val).join(", ").toLowerCase().includes(term.toLowerCase());

    return visibleArticles
      .filter((a) => {
        if (activeSectionTab !== "all") {
          if ((a.section || "").trim() !== activeSectionTab) return false;
        }
        if (q) {
          const hay = [
            a.title,
            a.content,
            a.theme,
            a.section,
            authorText(a.author || a.authors_byline),
            ...list(a.brand_of_interest),
            ...list(a.competitors),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        // Text / list contains.
        if (!textIncl(a.title, f.title)) return false;
        if (!textIncl(a.content, f.content)) return false;
        if (!textIncl(a.url, f.url)) return false;
        if (!textIncl(a.theme, f.theme)) return false;
        if (!textIncl(a.section, f.section)) return false;
        if (!textIncl(a.relevancy_reason, f.relevancy_reason)) return false;
        // Per-field confidence ranges (0–100 scale).
        if (!confPass(a.relevancy_confidence, f.relConfOp, f.relConfVal))
          return false;
        if (!confPass(a.section_category_confidence, f.secConfOp, f.secConfVal))
          return false;
        if (!confPass(a.sentiment_confidence, f.sentConfOp, f.sentConfVal))
          return false;
        if (!confPass(a.theme_confidence, f.themeConfOp, f.themeConfVal))
          return false;
        if (!textIncl(authorText(a.author || a.authors_byline), f.author))
          return false;
        if (!listIncl(a.brand_of_interest, f.brand_of_interest)) return false;
        if (!listIncl(a.competitors, f.competitors)) return false;
        if (!listIncl(a.peoples, f.peoples)) return false;
        if (!listIncl(a.countries, f.countries)) return false;
        if (!listIncl(a.organizations, f.organizations)) return false;
        // Exact / boolean.
        const aSent = a.sentiment || a.articlesentiment;
        if (f.sentiment && aSent !== f.sentiment) return false;
        if (f.priority === "watch" && !a.priority_watch) return false;
        if (f.priority === "no" && a.priority_watch) return false;
        if (f.addedType === "manual" && (a.added_type || "") !== "Manual")
          return false;
        if (f.addedType === "auto" && (a.added_type || "") === "Manual")
          return false;
        // Date range (inclusive).
        if (f.dateFrom || f.dateTo) {
          const dk = dayKey(a.date);
          if (!dk) return false;
          if (f.dateFrom && dk < f.dateFrom) return false;
          if (f.dateTo && dk > f.dateTo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        return (
          (Number(b.relevancy_confidence) || 0) -
          (Number(a.relevancy_confidence) || 0)
        );
      });
  }, [visibleArticles, query, filters, activeSectionTab]);

  const setDraft = useCallback((id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }, []);

  const editRowImmediately = useCallback(
    async (id, field, value) => {
      if (editing) {
        setDraft(id, field, value);
        return;
      }
      const fields = { [field]: value };
      try {
        await updateTaggedArticles(session.id, [{ id, ...fields }]);
        setArticles((prev) =>
          prev.map((a) =>
            String(a.id) === String(id) ? { ...a, ...fields } : a,
          ),
        );
        toast.success("Updated tag successfully");
      } catch (err) {
        toast.error(err.message || "Failed to update tag.");
      }
    },
    [editing, session.id, setDraft],
  );

  // Selection derived from the currently-visible (filtered) rows.
  const selectedCount = rows.reduce(
    (n, r) => (selected.has(r.id) ? n + 1 : n),
    0,
  );
  const allVisibleSelected = rows.length > 0 && selectedCount === rows.length;
  const someVisibleSelected = selectedCount > 0 && !allVisibleSelected;

  const selectedArticles = useMemo(
    () => visibleArticles.filter((a) => selected.has(a.id)),
    [visibleArticles, selected],
  );

  const selectedToApprove = useMemo(
    () => selectedArticles.filter((a) => a[currentApprovalField] !== true),
    [selectedArticles, currentApprovalField],
  );

  const selectedToDisapprove = useMemo(
    () => selectedArticles.filter((a) => a[currentApprovalField] !== false),
    [selectedArticles, currentApprovalField],
  );

  const approvedCount = useMemo(
    () => relevantArticles.filter((a) => a[currentApprovalField] === true).length,
    [relevantArticles, currentApprovalField],
  );

  // Ids that pass the active filters/search (rows is already filtered).
  const matchIds = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);

  // Grouped view: each "main" article (no syndication_of / similar_of) with its
  // similar and syndicated children nested beneath. Filters apply per-row: a group
  // is shown when the main or any child matches; only matching children are listed.
  const groups = useMemo(() => {
    const simKids = new Map();
    const synKids = new Map();
    for (const a of visibleArticles) {
      if (a.syndication_of) {
        if (!synKids.has(a.syndication_of)) synKids.set(a.syndication_of, []);
        synKids.get(a.syndication_of).push(a);
      } else if (a.similar_of) {
        if (!simKids.has(a.similar_of)) simKids.set(a.similar_of, []);
        simKids.get(a.similar_of).push(a);
      }
    }
    // Sort by relevancy_confidence high → low; fall back to date for equal scores.
    const byConf = (x, y) => {
      const cx = Number(x.relevancy_confidence) || 0;
      const cy = Number(y.relevancy_confidence) || 0;
      if (cy !== cx) return cy - cx;
      const dk = (a) => `${a.date || "9999"}|${a.id}`;
      return dk(x) < dk(y) ? -1 : dk(x) > dk(y) ? 1 : 0;
    };

    const mains = visibleArticles
      .filter((a) => !a.syndication_of && !a.similar_of)
      .sort(byConf);

    const out = [];
    const seen = new Set();
    for (const m of mains) {
      const allSim = simKids.get(m.id) || [];
      const allSyn = synKids.get(m.id) || [];
      seen.add(m.id);
      allSim.forEach((a) => seen.add(a.id));
      allSyn.forEach((a) => seen.add(a.id));

      const similar = allSim.filter((a) => matchIds.has(a.id)).sort(byConf);
      const syndicated = allSyn.filter((a) => matchIds.has(a.id)).sort(byConf);
      // Skip the whole group when nothing in it matches the filters.
      if (
        !matchIds.has(m.id) &&
        similar.length === 0 &&
        syndicated.length === 0
      )
        continue;
      out.push({ main: m, similar, syndicated });
    }
    // Safety net: surface any matching orphan whose target wasn't a top-level main.
    for (const a of visibleArticles) {
      if (!seen.has(a.id) && matchIds.has(a.id))
        out.push({ main: a, similar: [], syndicated: [] });
    }
    return out;
  }, [visibleArticles, matchIds]);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const everyVisible = rows.length > 0 && rows.every((r) => next.has(r.id));
      if (everyVisible) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  }, [rows]);

  // Persist an approval change for a set of ids (approve = true, disapprove = false).
  const applyApproval = useCallback(
    async (ids, isApproved) => {
      if (!ids.length) return;
      setApproving(true);
      setError("");
      try {
        const res = await approveTaggedArticles(
          session.id,
          ids,
          isApproved,
          currentForMonitoring,
        );
        // Approving for monitoring also approves for dashboards server-side;
        // mirror that here so the Dashboard tab doesn't need a refresh.
        const fields = { [currentApprovalField]: isApproved };
        if (res?.cascaded_to_dashboards) fields.is_approved_for_dashboards = true;
        const idSet = new Set(ids);
        setArticles((prev) =>
          prev.map((a) => (idSet.has(a.id) ? { ...a, ...fields } : a)),
        );
        markPendingApproval(true);
        const verb = isApproved ? "Approved" : "Disapproved";
        setSaveNote(
          `${verb} ${ids.length} article${ids.length === 1 ? "" : "s"}.`,
        );
      } catch (err) {
        setError(err.message || "Failed to update approval.");
      } finally {
        setApproving(false);
      }
    },
    [
      session.id,
      currentApprovalField,
      currentForMonitoring,
      markPendingApproval,
    ],
  );

  const [relevancyBusy, setRelevancyBusy] = useState(false);

  // Move selected articles between the relevant and irrelevant tabs. Promoting
  // AI-tags them server-side, so the response replaces the local rows.
  const applyRelevancy = useCallback(
    async (ids, isRelevant) => {
      if (!ids.length) return;
      let reason = "";
      if (!isRelevant) {
        reason = window.prompt(
          "Why are these articles not relevant?",
          "Manually marked irrelevant.",
        );
        if (reason === null) return;
        reason = reason.trim();
        if (!reason) {
          setError("A reason is required to move an article to irrelevant.");
          return;
        }
      }
      setRelevancyBusy(true);
      setError("");
      try {
        const updated = isRelevant
          ? await markArticlesRelevant(session.id, ids)
          : await markArticlesIrrelevant(session.id, ids, reason);
        const byId = new Map(
          (Array.isArray(updated) ? updated : []).map((a) => [a.id, a]),
        );
        setArticles((prev) => prev.map((a) => byId.get(a.id) || a));
        setSelected(new Set());
        markPendingApproval(true);
        const verb = isRelevant ? "relevant" : "irrelevant";
        setSaveNote(
          `Marked ${ids.length} article${ids.length === 1 ? "" : "s"} ${verb}. Dashboards will rebuild on next Create Dashboard.`,
        );
      } catch (err) {
        setError(err.message || "Failed to update relevancy.");
      } finally {
        setRelevancyBusy(false);
      }
    },
    [session.id, markPendingApproval],
  );

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setDrafts({});
  }, []);

  // Diff drafts against the originals → array of { id, ...changedFields }.
  const buildUpdates = useCallback(() => {
    const updates = [];
    for (const [id, fields] of Object.entries(drafts)) {
      const article = articles.find((a) => String(a.id) === String(id));
      if (!article) continue;
      const changed = {};
      for (const [field, raw] of Object.entries(fields)) {
        const cfg = EDIT_FIELDS[field];
        if (!cfg) continue;
        const next = coerce(cfg.type, raw);
        if (
          !sameValue(cfg.type, next, originalValue(article, field, cfg.type))
        ) {
          changed[field] = next;
        }
      }
      if (Object.keys(changed).length)
        updates.push({ id: article.id, ...changed });
    }
    return updates;
  }, [drafts, articles]);

  const saveEdits = useCallback(async () => {
    const updates = buildUpdates();
    if (updates.length === 0) {
      cancelEdit();
      return;
    }
    setSaving(true);
    setSaveNote("");
    setError("");
    try {
      await updateTaggedArticles(session.id, updates);
      // Apply locally so the table reflects the saved tags without a refetch.
      setArticles((prev) =>
        prev.map((a) => {
          const u = updates.find((x) => String(x.id) === String(a.id));
          if (!u) return a;
          const { id: _id, ...fields } = u;
          // The API stores confidences as 0–1 floats; mirror that locally (sent as 0–100).
          CONFIDENCE_FIELDS.forEach((cf) => {
            if (typeof fields[cf] === "number") fields[cf] = fields[cf] / 100;
          });
          return { ...a, ...fields };
        }),
      );
      markPendingApproval(true);
      setDrafts({});
      setEditing(false);
      setSaveNote(
        `Saved ${updates.length} article${updates.length === 1 ? "" : "s"}. Dashboards will rebuild on next Create Dashboard.`,
      );
    } catch (err) {
      setError(err.message || "Failed to save tag edits.");
    } finally {
      setSaving(false);
    }
  }, [buildUpdates, cancelEdit, session.id, markPendingApproval]);

  const dirtyCount = Object.keys(drafts).length;

  const setRowField = useCallback((key, field, value) => {
    setNewRows((rows) =>
      rows.map((r) => (r._key === key ? { ...r, [field]: value } : r)),
    );
  }, []);
  const startAdd = useCallback(() => {
    setSaveNote("");
    rowKeyRef.current += 1;
    setNewRows([newRow(rowKeyRef.current)]);
  }, []);
  const addAnotherRow = useCallback(() => {
    rowKeyRef.current += 1;
    setNewRows((rows) => [...rows, newRow(rowKeyRef.current)]);
  }, []);
  const removeRow = useCallback((key) => {
    setNewRows((rows) => rows.filter((r) => r._key !== key));
  }, []);
  const cancelAdd = useCallback(() => setNewRows([]), []);

  const deleteArticle = useCallback(
    async (article) => {
      if (!window.confirm("Delete this manually-added article?")) return;
      const prev = articles;
      // Optimistic removal; restore on failure.
      setArticles((list) => list.filter((a) => a.id !== article.id));
      setSelected((sel) => {
        const next = new Set(sel);
        next.delete(article.id);
        return next;
      });
      try {
        await deleteTaggedArticle(session.id, article.id);
        markPendingApproval(true);
        setSaveNote(
          "Article deleted. Dashboards will rebuild on next Create Dashboard.",
        );
      } catch (err) {
        setArticles(prev);
        setError(err.message || "Failed to delete article.");
      }
    },
    [articles, session.id, markPendingApproval],
  );

  // Drafts → API payloads. Empty rows (no title and no content) are dropped;
  // empty lists / blank url & date are omitted so optional fields stay unset.
  const buildNewArticles = useCallback(() => {
    const out = [];
    for (const row of newRows) {
      const title = String(row.title || "").trim();
      const content = String(row.content || "").trim();
      if (!title && !content) continue;
      const payload = { title, content };
      const date = String(row.date || "").trim();
      const url = String(row.url || "").trim();
      const author = String(row.author || "").trim();
      if (date) payload.date = date;
      if (url) payload.url = url;
      if (author) payload.author = author;
      for (const [field, cfg] of Object.entries(EDIT_FIELDS)) {
        const v = coerce(cfg.type, row[field]);
        if (cfg.type === "list" && (!v || v.length === 0)) continue;
        payload[field] = v;
      }
      out.push(payload);
    }
    return out;
  }, [newRows]);

  const saveNewArticles = useCallback(async () => {
    const payloads = buildNewArticles();
    if (payloads.length === 0) {
      setError("Add a title or content to at least one new article.");
      return;
    }
    setAddSaving(true);
    setError("");
    try {
      const created = await addTaggedArticles(session.id, payloads);
      setArticles((prev) => [
        ...prev,
        ...(Array.isArray(created) ? created : [created]),
      ]);
      markPendingApproval(true);
      setNewRows([]);
      const n = Array.isArray(created) ? created.length : 1;
      setSaveNote(
        `Added ${n} article${n === 1 ? "" : "s"}. Dashboards will rebuild on next Create Dashboard.`,
      );
    } catch (err) {
      setError(err.message || "Failed to add articles.");
    } finally {
      setAddSaving(false);
    }
  }, [buildNewArticles, session.id, markPendingApproval]);

  // An editor cell for an "add article" row (tag fields reuse CellEditor).
  const newCell = (row, field) => {
    const cfg = EDIT_FIELDS[field];
    const value = cfg.type === "bool" ? !!row[field] : (row[field] ?? "");
    return (
      <CellEditor
        field={field}
        type={cfg.type}
        value={value}
        onChange={(v) => setRowField(row._key, field, v)}
      />
    );
  };

  // A confidence range filter (operator + percent) for a column's filter cell.
  const confFilter = (opKey, valKey) => (
    <div className="fcell__range">
      <select
        className={cn("fcell", "fcell--op")}
        value={filters[opKey]}
        onChange={(e) => setFilter(opKey, e.target.value)}
      >
        <option value=">=">≥</option>
        <option value="<=">≤</option>
        <option value="=">=</option>
      </select>
      <input
        className={cn("fcell", "fcell--num")}
        type="number"
        min="0"
        max="100"
        placeholder="%"
        value={filters[valKey]}
        onChange={(e) => setFilter(valKey, e.target.value)}
      />
    </div>
  );

  // Td helper for column cells
  // One article row — shared by the flat and grouped views. `rowClass` adds
  // grouping styles (e.g. indented child rows) without touching the columns.
  const renderRow = (a, i, rowClass = "") => {
    const pct = (v) =>
      typeof v === "number" ? `${Math.round(v * 100)}%` : "—";
    const d = drafts[a.id];
    const ed = (field, display) => {
      if (!editing) return display;
      const cfg = EDIT_FIELDS[field];
      // Relation fields (syndication_of / similar_of) are only editable where the
      // caller opts in (the Media Monitoring popup); elsewhere they stay read-only.
      if (cfg.relation && !relationEditable) return display;
      return (
        <CellEditor
          field={field}
          type={cfg.type}
          value={editorValue(a, d, field, cfg.type)}
          onChange={(v) => setDraft(a.id, field, v)}
        />
      );
    };
    const isSel = selected.has(a.id);
    const cls = [
      "",
      d ? "rtbl__row--dirty" : "",
      isSel ? "rtbl__row--sel" : "",
      "",
      rowClass,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const getRowBg = () => {
      if (isSel) return "var(--accent-subtle)";
      if (d) return "color-mix(in srgb, var(--accent-a) 4%, var(--panel))"; // dirty/unsaved
      return "var(--panel)";
    };
    const rowBg = getRowBg();

    const stickyStyle = (leftVal) => ({
      position: "sticky",
      left: leftVal,
      background: rowBg,
      zIndex: 9,
      borderBottom: "1px solid var(--border-subtle)",
      borderRight: "1px solid var(--border-subtle)",
      verticalAlign: "middle",
    });

    const isChild = rowClass === "rtbl__row--child";

    return (
      <tr
        key={a.id ?? i}
        className={cls || undefined}
        style={{ background: rowBg }}
      >
        {/* Checkbox — sticky 0 */}
        <td className={cn("rt-td", "rt-td-checkbox")} style={stickyStyle(0)}>
          <TriCheckbox
            checked={isSel}
            onChange={() => toggleSelect(a.id)}
            ariaLabel={`Select ${a.id}`}
          />
        </td>

        {/* Status — sticky 1. Irrelevant articles can't be approved, so the
            column offers the promotion action instead. */}
        <td className="rt-td" style={stickyStyle(stickyLeft.status)}>
          {isIrrelevantTab ? (
            <button
              type="button"
              className="status-badge status-badge--pending"
              onClick={() => applyRelevancy([a.id], true)}
              disabled={relevancyBusy}
              style={{
                cursor: relevancyBusy ? "wait" : "pointer",
                whiteSpace: "nowrap",
              }}
              title="Move back to the relevant articles and AI-tag it"
            >
              <CheckIcon width={11} height={11} /> Mark relevant
            </button>
          ) : (
            <StatusCell
              approved={a[currentApprovalField]}
              edited={!!d}
              onToggle={(newVal) => applyApproval([a.id], newVal)}
            />
          )}
        </td>

        {/* ID — sticky 2 */}
        {show("id") && (
          <td
            className={cn("rt-td", "cell--id")}
            style={stickyStyle(stickyLeft.id)}
          >
            <span className={cn("mono", "text-[12px]", "text-muted")}>
              {a.id ?? "—"}
            </span>
          </td>
        )}

        {/* Title — sticky 3 */}
        {show("title") && (
          <td
            className={cn("rt-td", "cell--title")}
            style={stickyStyle(stickyLeft.title)}
          >
            <ExpandableCell
              text={a.title}
              className="font-medium"
              style={isChild ? { paddingLeft: "16px" } : undefined}
              prefix={
                isChild ? (
                  <span className={cn("text-muted", "mr-1.5")}>↳</span>
                ) : null
              }
            />
          </td>
        )}

        {/* Content */}
        {show("content") && (
          <Td title={a.content}>
            <ExpandableCell text={a.content} />
          </Td>
        )}

        {/* URL */}
        {show("url") && (
          <Td>
            {a.url ? (
              <a
                className={cn(
                  "flex",
                  "items-center",
                  "gap-1",
                  "text-[12px]",
                  "text-[var(--info)]",
                  "hover:underline",
                  "overflow-hidden",
                )}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLinkIcon width={11} height={11} className="shrink-0" />
                <span className="truncate">
                  {a.url.replace(/^https?:\/\//, "")}
                </span>
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </Td>
        )}

        {/* Date */}
        {show("date") && (
          <Td>
            <span className="whitespace-nowrap">{fmtDate(a.date)}</span>
          </Td>
        )}

        {/* Relevancy Confidence */}
        {show("relevancy_confidence") && (
          <Td>
            {editing ? (
              ed("relevancy_confidence", pct(a.relevancy_confidence))
            ) : (
              <ConfidenceBadge value={a.relevancy_confidence} />
            )}
          </Td>
        )}

        {/* Relevancy Reason */}
        {show("relevancy_reason") && (
          <Td className="cell--reason" title={a.relevancy_reason}>
            {ed(
              "relevancy_reason",
              <ExpandableCell text={a.relevancy_reason} />,
            )}
          </Td>
        )}

        {/* Section */}
        {show("section") && (
          <Td>
            {ed(
              "section",
              <span className="clamp" title={a.section || ""}>
                {a.section || "—"}
              </span>,
            )}
          </Td>
        )}

        {/* Section Confidence */}
        {show("section_confidence") && (
          <Td>
            {editing ? (
              ed(
                "section_category_confidence",
                pct(a.section_category_confidence),
              )
            ) : (
              <ConfidenceBadge value={a.section_category_confidence} />
            )}
          </Td>
        )}

        {/* Brand of interest */}
        {show("brand") && (
          <Td>
            {ed("brand_of_interest", <ListCell value={a.brand_of_interest} />)}
          </Td>
        )}

        {/* Sentiment */}
        {show("sentiment") && (
          <Td>
            <SentimentCell
              value={
                d?.sentiment !== undefined
                  ? d.sentiment
                  : a.sentiment || a.articlesentiment
              }
              onChange={(v) => {
                if (editing) {
                  setDraft(a.id, "sentiment", v);
                } else {
                  editRowImmediately(a.id, "sentiment", v);
                }
              }}
            />
          </Td>
        )}

        {/* Sentiment Confidence */}
        {show("sentiment_confidence") && (
          <Td>
            {editing ? (
              ed("sentiment_confidence", pct(a.sentiment_confidence))
            ) : (
              <ConfidenceBadge value={a.sentiment_confidence} />
            )}
          </Td>
        )}

        {/* Theme */}
        {show("theme") && (
          <Td>
            <ThemesCell
              theme={d?.theme !== undefined ? d.theme : a.theme}
              onChange={(v) => {
                if (editing) {
                  setDraft(a.id, "theme", v);
                } else {
                  editRowImmediately(a.id, "theme", v);
                }
              }}
            />
          </Td>
        )}

        {/* Theme Confidence */}
        {show("theme_confidence") && (
          <Td>
            {editing ? (
              ed("theme_confidence", pct(a.theme_confidence))
            ) : (
              <ConfidenceBadge value={a.theme_confidence} />
            )}
          </Td>
        )}

        {/* Competitors */}
        {show("competitors") && (
          <Td>{ed("competitors", <ListCell value={a.competitors} />)}</Td>
        )}

        {/* Author */}
        {show("author") && (
          <Td title={authorText(a.author || a.authors_byline)}>
            <span className="clamp">
              {authorText(a.author || a.authors_byline) || "—"}
            </span>
          </Td>
        )}

        {/* Priority */}
        {show("priority") && (
          <Td>
            {ed(
              "priority_watch",
              a.priority_watch ? (
                <span
                  className={cn("sent-pill", "sent-pill--neg")}
                  style={{ color: "var(--neg)" }}
                >
                  Watch
                </span>
              ) : (
                <span className="muted">No</span>
              ),
            )}
          </Td>
        )}

        {/* People */}
        {show("people") && (
          <Td>{ed("peoples", <ListCell value={a.peoples} />)}</Td>
        )}

        {/* Countries */}
        {show("countries") && (
          <Td>{ed("countries", <ListCell value={a.countries} />)}</Td>
        )}

        {/* Organizations */}
        {show("organizations") && (
          <Td>{ed("organizations", <ListCell value={a.organizations} />)}</Td>
        )}

        {/* Syndication of */}
        {show("syndication") && (
          <Td>
            {ed(
              "syndication_of",
              a.syndication_of ? (
                <span className="theme-pill" style={{ maxWidth: "none" }}>
                  {a.syndication_of}
                </span>
              ) : (
                <span className="muted">—</span>
              ),
            )}
          </Td>
        )}

        {/* Similar of */}
        {show("similar") && (
          <Td>
            {ed(
              "similar_of",
              a.similar_of ? (
                <span className="theme-pill" style={{ maxWidth: "none" }}>
                  {a.similar_of}
                </span>
              ) : (
                <span className="muted">—</span>
              ),
            )}
          </Td>
        )}

        {/* Added Type */}
        {show("added_type") && (
          <Td>
            {a.added_type === "Manual" ? (
              <div
                className="addedcell"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  className="theme-pill"
                  style={{
                    background: "rgba(91, 108, 249, 0.08)",
                    color: "var(--accent)",
                  }}
                >
                  Manual
                </span>
                <button
                  type="button"
                  className={cn("iconaction", "iconaction--danger")}
                  aria-label="Delete article"
                  title="Delete this manually-added article"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteArticle(a);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <TrashIcon
                    width={14}
                    height={14}
                    style={{ color: "var(--neg)" }}
                  />
                </button>
              </div>
            ) : (
              <span className="muted">—</span>
            )}
          </Td>
        )}

        {/* Actions — move this article out of the relevant set. */}
        {showActions && (
          <Td>
            <button
              type="button"
              className="status-badge status-badge--disapproved"
              onClick={(e) => {
                e.stopPropagation();
                applyRelevancy([a.id], false);
              }}
              disabled={relevancyBusy}
              style={{
                cursor: relevancyBusy ? "wait" : "pointer",
                whiteSpace: "nowrap",
              }}
              title="Move to the Irrelevant tab (tags are kept)"
            >
              <CloseIcon width={11} height={11} /> Move to Irrelevant
            </button>
          </Td>
        )}
      </tr>
    );
  };

  // A collapsible sub-group (Similar / Syndicated) under a main article.
  const renderSection = (main, kind, items, label) => {
    if (!items.length) return null;
    const key = `${main.id}:${kind}`;
    const isCollapsed = !expanded.has(key);
    return (
      <Fragment key={key}>
        <tr className="rtbl__grouplabel">
          <td
            className={cn("rt-td", "rt-td-checkbox")}
            style={{
              position: "sticky",
              left: 0,
              zIndex: 9,
              background: "var(--panel-2)",
              borderBottom: "1px solid var(--border-default)",
            }}
          />
          <td
            className="rt-td"
            colSpan={totalColSpan - 1}
            style={{
              background: "var(--panel-2)",
              borderBottom: "1px solid var(--border-default)",
              padding: "6px 12px",
            }}
          >
            <button
              type="button"
              className="group-toggle-btn"
              onClick={() => toggleCollapse(key)}
              aria-expanded={!isCollapsed}
            >
              <ChevronRightIcon
                width={12}
                height={12}
                style={{
                  transform: isCollapsed ? undefined : "rotate(90deg)",
                  transition: "transform 0.15s ease",
                }}
              />
              <span
                className={cn(
                  "uppercase",
                  "tracking-[0.06em]",
                  "text-[10px]",
                  "font-bold",
                )}
              >
                {kind === "similar" ? "Similar" : "Syndicated"} ({items.length})
              </span>
            </button>
          </td>
        </tr>
        {!isCollapsed && items.map((c) => renderRow(c, 0, "rtbl__row--child"))}
      </Fragment>
    );
  };

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);
  const clearFilters = useCallback(() => {
    setFilters(FILTER_INIT);
    setQuery("");
  }, []);
  const filtersActive =
    query.trim() !== "" ||
    Object.entries(filters).some(
      ([k, v]) => !FILTER_OP_KEYS.has(k) && v !== "",
    );

  // A second horizontal scrollbar above the table, kept in sync with the real one.
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const headRowRef = useRef(null);
  const syncingRef = useRef(false);
  const [tableWidth, setTableWidth] = useState(0);
  const [headH, setHeadH] = useState(0); // height of the title row → filter row sticky offset

  useLayoutEffect(() => {
    const el = bottomScrollRef.current;
    if (!el) return undefined;
    const measure = () => {
      setTableWidth(el.scrollWidth);
      if (headRowRef.current) setHeadH(headRowRef.current.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rows.length, editing, articles.length]);

  const syncScroll = useCallback((from, to) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (to.current && from.current)
      to.current.scrollLeft = from.current.scrollLeft;
    syncingRef.current = false;
  }, []);

  const busy =
    job.active && (job.phase === "connecting" || job.phase === "running");
  const taggingBusy = busy && job.kind === "tagging";
  const chartsBusy = busy && (job.kind === "charts" || job.kind === "ci");
  // Charts is stage-based (no batch count) → indeterminate bar while running.
  const indeterminate =
    job.phase === "running" &&
    ((job.kind === "charts" || job.kind === "ci") || job.progress.total === 0);
  const pct =
    job.phase === "complete"
      ? 100
      : job.progress.total
        ? Math.round((job.progress.done / job.progress.total) * 100)
        : 0;
  const showProgress =
    job.active &&
    job.phase !== "idle" &&
    !((job.kind === "charts" || job.kind === "ci") && job.phase === "complete");

  const handleBack = useCallback(() => {
    if (isJobRunning) {
      toast.error(
        "Process is currently running. Please wait for it to complete before navigating.",
      );
      return;
    }
    if (hasPendingApprovalChanges) {
      toast.error(
        "Please click on Create Dashboards for the latest approvals so that the charts will get updated.",
      );
      return;
    }
    onBack?.();
  }, [isJobRunning, hasPendingApprovalChanges, onBack]);

  const body = (
    <>
      {!asModal ? (
        <header
          className="wftop"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div
            className="wftop__left"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <button className="wfic" onClick={handleBack} aria-label="Back">
              <ArrowLeftIcon width={18} height={18} />
            </button>
            <SparklesIcon width={18} height={18} />
            <span className="wftop__name">{project?.name || "Workflow"}</span>
            <div
              style={{
                width: "1px",
                height: "20px",
                background: "var(--border-subtle)",
                margin: "0 8px",
              }}
            />
            <ApprovalRing
              pct={
                relevantArticles.length
                  ? Math.round((approvedCount / relevantArticles.length) * 100)
                  : 0
              }
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {approvedCount}/{relevantArticles.length} approved
            </span>
          </div>

          <div className="wftop__right">
            <SubTabSwitcher
              tabs={subTabs}
              value={subTab}
              onChange={setSubTab}
            />
          </div>
        </header>
      ) : (
        <div
          className={cn(
            "flex",
            "items-center",
            "justify-between",
            "gap-4",
            "px-5",
            "h-16",
            "shrink-0",
            "border-b",
            "border-[var(--border-subtle)]",
          )}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--border-subtle)",
            padding: "0 20px",
            height: "64px",
          }}
        >
          {/* Left: Title + Approval Ring */}
          <div
            className={cn("flex", "items-center", "gap-4")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              minWidth: 0,
              justifyContent: "center",
            }}
          >
            <div
              className={cn("flex", "items-center", "gap-2")}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <ShieldCheckIcon
                width={16}
                height={16}
                style={{ color: "var(--accent)", flexShrink: 0 }}
              />
              <h1
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "240px",
                }}
              >
                {project?.name || "Articles"}
              </h1>
            </div>

            <div
              style={{
                width: "1px",
                height: "20px",
                background: "var(--border-subtle)",
              }}
            />

            <div
              className={cn("flex", "items-center", "gap-2")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              <ApprovalRing
                pct={
                  relevantArticles.length
                    ? Math.round((approvedCount / relevantArticles.length) * 100)
                    : 0
                }
              />
              <div style={{ lineHeight: 1.2 }}>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  {approvedCount}/{relevantArticles.length} approved
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  {relevantArticles.length - approvedCount} awaiting review
                </p>
              </div>
            </div>
          </div>

          {/* Right: Switcher */}
          <SubTabSwitcher tabs={subTabs} value={subTab} onChange={setSubTab} />
        </div>
      )}

      {showProgress && (
        <section
          className={`tagpanel${job.phase === "error" ? " tagpanel--error" : ""}`}
        >
          <div className="tagpanel__head">
            <h2 className="tagpanel__title">
              {job.phase === "error"
                ? (job.kind === "charts" || job.kind === "ci")
                  ? "Dashboard generation failed"
                  : "Tagging failed"
                : job.phase === "complete"
                  ? (job.kind === "charts" || job.kind === "ci")
                    ? "Dashboards ready"
                    : `Tagging complete${job.totalArticles ? ` · ${job.totalArticles} articles` : ""}`
                  : (job.kind === "charts" || job.kind === "ci")
                    ? "Building dashboards…"
                    : `Generating tags${job.totalArticles ? ` · ${job.totalArticles} articles` : ""}`}
            </h2>
            {job.progress.total > 0 && job.phase !== "error" && (
              <span className="tagpanel__count">
                {job.progress.done}/{job.progress.total} batches · {pct}%
              </span>
            )}
          </div>

          {job.phase !== "error" && (
            <div
              className={`progress${indeterminate ? " progress--indeterminate" : ""}`}
            >
              <div
                className="progress__bar"
                style={{ width: indeterminate ? "40%" : `${pct}%` }}
              />
            </div>
          )}

          <div className="log">
            {job.messages.map((m, i) => (
              <div className="log__line" key={i}>
                {m}
              </div>
            ))}
          </div>

          {job.phase === "error" && (
            <div className="tagpanel__actions">
              <button
                className={cn("btn", "btn--primary")}
                onClick={(job.kind === "charts" || job.kind === "ci") ? startCharts : startTagging}
              >
                <RefreshIcon width={16} height={16} /> Retry
              </button>
            </div>
          )}
        </section>
      )}

      {/* Revamped Toolbar inside Panel */}
      <section className={`panel${asModal ? " panel--flat" : ""}`}>
        <div
          className="toolbar"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            padding: "16px 20px 12px",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {/* Top row: Search + view switcher + actions */}
          <div
            className={cn("flex", "items-center", "gap-3")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              width: "100%",
            }}
          >
            <div
              className={cn("relative", "flex-1", "min-w-0")}
              style={{ position: "relative", flex: 1, minWidth: 0 }}
            >
              <SearchIcon
                width={14}
                height={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className="search__input"
                placeholder="Search title, content, theme, brand…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: "36px",
                  paddingLeft: "34px",
                  paddingRight: "12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-default)",
                  background: "var(--bg-card)",
                  fontSize: "13px",
                  color: "var(--text)",
                  outline: "none",
                }}
              />
            </div>

            <div
              className={cn(
                "flex",
                "items-center",
                "p-0.5",
                "rounded-lg",
                "border",
                "border-[var(--border-default)]",
                "bg-[var(--bg-card)]",
                "shrink-0",
              )}
              style={{
                display: "flex",
                padding: "2px",
                borderRadius: "8px",
                border: "1px solid var(--border-default)",
                background: "var(--bg-card)",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                style={{
                  height: "28px",
                  padding: "0 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background:
                    viewMode === "grouped" ? "var(--accent)" : "transparent",
                  color: viewMode === "grouped" ? "#fff" : "var(--text-muted)",
                }}
                onClick={() => setViewMode("grouped")}
              >
                Grouped
              </button>
              <button
                type="button"
                style={{
                  height: "28px",
                  padding: "0 12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background:
                    viewMode === "flat" ? "var(--accent)" : "transparent",
                  color: viewMode === "flat" ? "#fff" : "var(--text-muted)",
                }}
                onClick={() => setViewMode("flat")}
              >
                Flat
              </button>
            </div>

            <select
              value={selectedSyncBatch}
              onChange={(e) => setSelectedSyncBatch(e.target.value)}
              style={{
                height: "36px",
                padding: "0 12px",
                borderRadius: "8px",
                fontSize: "13px",
                border: "1px solid var(--border-default)",
                background: "var(--bg-card)",
                outline: "none",
                cursor: "pointer",
                color: "var(--text)",
              }}
            >
              <option value="all">All syncs</option>
              {sessionsList.map((s) => {
                const label = s.source_file
                  ? prettyFileName(s.source_file)
                  : "";
                return (
                  <option key={s.id} value={String(s.id)}>
                    {label}
                  </option>
                );
              })}
            </select>

            {editing ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <button
                  type="button"
                  className={cn("btn", "btn--ghost")}
                  onClick={cancelEdit}
                  disabled={saving}
                  style={{
                    height: "36px",
                    padding: "0 14px",
                    fontSize: "12.5px",
                    borderRadius: "8px",
                  }}
                >
                  <CloseIcon width={14} height={14} /> Cancel
                </button>
                <button
                  type="button"
                  className={cn("btn", "btn--primary")}
                  onClick={saveEdits}
                  disabled={saving || dirtyCount === 0}
                  style={{
                    height: "36px",
                    padding: "0 14px",
                    fontSize: "12.5px",
                    borderRadius: "8px",
                  }}
                >
                  <EditIcon
                    width={14}
                    height={14}
                    className={saving ? "spin" : undefined}
                  />
                  {saving
                    ? "Saving…"
                    : `Save${dirtyCount ? ` (${dirtyCount})` : ""}`}
                </button>
              </div>
            ) : (
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <button
                  type="button"
                  className={cn("btn", "btn--ghost")}
                  onClick={() => {
                    setSaveNote("");
                    setUrlModalOpen(true);
                  }}
                  disabled={busy}
                  style={{
                    height: "36px",
                    padding: "0 14px",
                    fontSize: "12.5px",
                    borderRadius: "8px",
                  }}
                >
                  <PlusIcon width={14} height={14} /> Add by URL
                </button>
                <button
                  type="button"
                  className={cn("btn", "btn--ghost")}
                  onClick={() => {
                    setSaveNote("");
                    setEditing(true);
                  }}
                  disabled={busy || isIrrelevantTab || articles.length === 0}
                  style={{
                    height: "36px",
                    padding: "0 14px",
                    fontSize: "12.5px",
                    borderRadius: "8px",
                  }}
                  title={
                    isIrrelevantTab
                      ? "Irrelevant articles aren't tagged — mark one relevant first"
                      : undefined
                  }
                >
                  <EditIcon width={14} height={14} /> Edit tags
                </button>
                <button
                  type="button"
                  className={cn("btn", "btn--ghost")}
                  onClick={startTagging}
                  disabled={busy}
                  style={{
                    height: "36px",
                    padding: "0 14px",
                    fontSize: "12.5px",
                    borderRadius: "8px",
                  }}
                >
                  <RefreshIcon
                    width={14}
                    height={14}
                    className={taggingBusy ? "spin" : undefined}
                  />
                  {taggingBusy ? "Tagging…" : "Regenerate"}
                </button>
                {!asModal && (
                  <button
                    type="button"
                    className={cn("btn", "btn--primary")}
                    onClick={requestCreateCharts}
                    disabled={
                      busy || articles.length === 0 || approvedCount === 0
                    }
                    style={{
                      height: "36px",
                      padding: "0 14px",
                      fontSize: "12.5px",
                      borderRadius: "8px",
                    }}
                  >
                    <DashboardIcon
                      width={14}
                      height={14}
                      className={chartsBusy ? "spin" : undefined}
                    />
                    {chartsBusy ? "Building…" : "Create Dashboard"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section Tab Pills */}
          {availableSections.length > 0 && (
            <div
              className={cn("flex", "items-center", "gap-2")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                width: "100%",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "4px",
                borderTop: "1px dashed var(--border-subtle)",
                paddingTop: "12px",
              }}
            >
              <button
                type="button"
                style={{
                  height: "30px",
                  padding: "0 14px",
                  borderRadius: "15px",
                  fontSize: "12px",
                  fontWeight: activeSectionTab === "all" ? 700 : 500,
                  border:
                    "1px solid " +
                    (activeSectionTab === "all"
                      ? "var(--accent)"
                      : "var(--border-default)"),
                  background:
                    activeSectionTab === "all"
                      ? "var(--accent)"
                      : "var(--bg-card)",
                  color:
                    activeSectionTab === "all" ? "#fff" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
                onClick={() => setActiveSectionTab("all")}
              >
                All Sections ({sectionCounts.total})
              </button>
              {availableSections.map((sec) => {
                const count = sectionCounts.counts[sec] || 0;
                const isActive = activeSectionTab === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    style={{
                      height: "30px",
                      padding: "0 14px",
                      borderRadius: "15px",
                      fontSize: "12px",
                      fontWeight: isActive ? 700 : 500,
                      border:
                        "1px solid " +
                        (isActive ? "var(--accent)" : "var(--border-default)"),
                      background: isActive ? "var(--accent)" : "var(--bg-card)",
                      color: isActive ? "#fff" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                    onClick={() => setActiveSectionTab(sec)}
                  >
                    {sec} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom row: selection info & bulk actions */}
          {selectedCount > 0 && (
            <div
              className={cn("flex", "items-center", "gap-3")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "4px 0",
                width: "100%",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                {selectedCount} selected
              </span>

              {isIrrelevantTab ? (
                <button
                  type="button"
                  className={cn("btn", "btn--approve")}
                  onClick={() =>
                    applyRelevancy(
                      selectedArticles.map((a) => a.id),
                      true,
                    )
                  }
                  disabled={relevancyBusy || busy}
                  style={{
                    height: "28px",
                    padding: "0 10px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Move back to the relevant articles and AI-tag them"
                >
                  <CheckIcon width={12} height={12} />
                  {relevancyBusy
                    ? "Marking relevant…"
                    : `Mark relevant (${selectedCount})`}
                </button>
              ) : (
                !editing && (
                  <button
                    type="button"
                    className={cn("btn", "btn--disapprove")}
                    onClick={() =>
                      applyRelevancy(
                        selectedArticles.map((a) => a.id),
                        false,
                      )
                    }
                    disabled={relevancyBusy || busy}
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      fontSize: "11px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    title="Move to the Irrelevant tab (tags are kept)"
                  >
                    <CloseIcon width={12} height={12} />
                    {relevancyBusy
                      ? "Marking irrelevant…"
                      : `Mark irrelevant (${selectedCount})`}
                  </button>
                )
              )}

              {!editing && !isIrrelevantTab && (
                <>
                  <button
                    type="button"
                    className={cn("btn", "btn--approve")}
                    onClick={() =>
                      applyApproval(
                        selectedToApprove.map((a) => a.id),
                        true,
                      )
                    }
                    disabled={
                      approving || busy || selectedToApprove.length === 0
                    }
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      fontSize: "11px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: selectedToApprove.length === 0 ? 0.5 : 1,
                      cursor:
                        selectedToApprove.length === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                    title={
                      selectedToApprove.length === 0
                        ? "All selected articles are already approved"
                        : undefined
                    }
                  >
                    <CheckIcon width={12} height={12} />
                    {approving
                      ? "Approving…"
                      : `Approve selected (${selectedToApprove.length})`}
                  </button>

                  <button
                    type="button"
                    className={cn("btn", "btn--disapprove")}
                    onClick={() =>
                      applyApproval(
                        selectedToDisapprove.map((a) => a.id),
                        false,
                      )
                    }
                    disabled={
                      approving || busy || selectedToDisapprove.length === 0
                    }
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      fontSize: "11px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: selectedToDisapprove.length === 0 ? 0.5 : 1,
                      cursor:
                        selectedToDisapprove.length === 0
                          ? "not-allowed"
                          : "pointer",
                    }}
                    title={
                      selectedToDisapprove.length === 0
                        ? "All selected articles are already disapproved"
                        : undefined
                    }
                  >
                    <CloseIcon width={12} height={12} />
                    {approving
                      ? "Disapproving…"
                      : `Disapprove selected (${selectedToDisapprove.length})`}
                  </button>
                </>
              )}

              <button
                type="button"
                className="linkbtn"
                onClick={() => setSelected(new Set())}
                style={{
                  fontSize: "11px",
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  padding: 10,
                  boxShadow: "none",
                }}
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        {saveNote && <div className="savenote">{saveNote}</div>}
        {editing && (
          <div className={cn("savenote", "savenote--hint")}>
            Editing tags — only changed fields are saved. Title and content
            can’t be edited. Lists are comma-separated.
          </div>
        )}

        {!loading && !error && visibleArticles.length > 0 && filtersActive && (
          <div className="filterbar">
            <span>
              Showing {rows.length} of {visibleArticles.length}
            </span>
            <button className="linkbtn" onClick={clearFilters}>
              Clear all filters
            </button>
          </div>
        )}

        {loading && (
          <div className="state">
            <p>Loading tagged articles…</p>
          </div>
        )}

        {!loading && error && (
          <div className={cn("state", "state--error")}>
            <p>{error}</p>
            <button className={cn("btn", "btn--ghost")} onClick={load}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && visibleArticles.length === 0 && (
          <div className="state">
            <p>
              {taggingBusy
                ? "Tagging in progress — articles will appear here once ready."
                : isIrrelevantTab
                  ? "No irrelevant articles — everything passed the relevancy check."
                  : "No tagged articles found for this session."}
            </p>
            {!taggingBusy && !isIrrelevantTab && (
              <button
                type="button"
                className={cn("btn", "btn--primary")}
                onClick={startTagging}
                style={{ marginTop: "12px" }}
              >
                <RefreshIcon width={14} height={14} /> Start Tagging
              </button>
            )}
          </div>
        )}

        {!loading && !error && visibleArticles.length > 0 && (
          <>
            <div
              className="rtbl__topscroll"
              ref={topScrollRef}
              onScroll={() => syncScroll(topScrollRef, bottomScrollRef)}
            >
              <div
                className="rtbl__topscroll-inner"
                style={{ width: totalWidth }}
              />
            </div>
            <div
              className="rtbl__scroll"
              ref={bottomScrollRef}
              onScroll={() => syncScroll(bottomScrollRef, topScrollRef)}
            >
              <table
                className="rt-table"
                style={{
                  width: totalWidth,
                  minWidth: totalWidth,
                  tableLayout: "fixed",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                }}
              >
                <colgroup>
                  <col style={{ width: 38 }} />
                  <col style={{ width: colWidths.status }} />
                  {show("id") && <col style={{ width: colWidths.id }} />}
                  {show("title") && <col style={{ width: colWidths.title }} />}
                  {show("content") && (
                    <col style={{ width: colWidths.content }} />
                  )}
                  {show("url") && <col style={{ width: colWidths.url }} />}
                  {show("date") && <col style={{ width: colWidths.date }} />}
                  {show("relevancy_confidence") && (
                    <col style={{ width: colWidths.relevancy_confidence }} />
                  )}
                  {show("relevancy_reason") && (
                    <col style={{ width: colWidths.relevancy_reason }} />
                  )}
                  {show("section") && (
                    <col style={{ width: colWidths.section }} />
                  )}
                  {show("section_confidence") && (
                    <col style={{ width: colWidths.section_confidence }} />
                  )}
                  {show("brand") && <col style={{ width: colWidths.brand }} />}
                  {show("sentiment") && (
                    <col style={{ width: colWidths.sentiment }} />
                  )}
                  {show("sentiment_confidence") && (
                    <col style={{ width: colWidths.sentiment_confidence }} />
                  )}
                  {show("theme") && <col style={{ width: colWidths.theme }} />}
                  {show("theme_confidence") && (
                    <col style={{ width: colWidths.theme_confidence }} />
                  )}
                  {show("competitors") && (
                    <col style={{ width: colWidths.competitors }} />
                  )}
                  {show("author") && (
                    <col style={{ width: colWidths.author }} />
                  )}
                  {show("priority") && (
                    <col style={{ width: colWidths.priority }} />
                  )}
                  {show("people") && (
                    <col style={{ width: colWidths.people }} />
                  )}
                  {show("countries") && (
                    <col style={{ width: colWidths.countries }} />
                  )}
                  {show("organizations") && (
                    <col style={{ width: colWidths.organizations }} />
                  )}
                  {show("syndication") && (
                    <col style={{ width: colWidths.syndication }} />
                  )}
                  {show("similar") && (
                    <col style={{ width: colWidths.similar }} />
                  )}
                  {show("added_type") && (
                    <col style={{ width: colWidths.added_type }} />
                  )}
                  {showActions && <col style={{ width: colWidths.actions }} />}
                </colgroup>
                <thead>
                  <tr ref={headRowRef}>
                    <th
                      className="rt-th"
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 26,
                        background: "var(--panel)",
                        borderBottom: "1px solid var(--border-subtle)",
                        borderRight: "1px solid var(--border-subtle)",
                        textAlign: "center",
                      }}
                    >
                      <TriCheckbox
                        checked={allVisibleSelected}
                        indeterminate={someVisibleSelected}
                        onChange={toggleSelectAll}
                        ariaLabel="Select all"
                      />
                    </th>
                    <th
                      className="rt-th"
                      style={{
                        position: "sticky",
                        left: stickyLeft.status,
                        zIndex: 26,
                        background: "var(--panel)",
                        borderBottom: "1px solid var(--border-subtle)",
                        borderRight: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span>Status</span>
                      <div
                        className="rt-th-resize-handle"
                        onMouseDown={(e) => startResize("status", e)}
                      />
                    </th>
                    {show("id") && (
                      <th
                        className="rt-th"
                        style={{
                          position: "sticky",
                          left: stickyLeft.id,
                          zIndex: 26,
                          background: "var(--panel)",
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>ID</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("id", e)}
                        />
                      </th>
                    )}
                    {show("title") && (
                      <th
                        className="rt-th"
                        style={{
                          position: "sticky",
                          left: stickyLeft.title,
                          zIndex: 26,
                          background: "var(--panel)",
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Title</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("title", e)}
                        />
                      </th>
                    )}
                    {show("content") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Content</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("content", e)}
                        />
                      </th>
                    )}
                    {show("url") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>URL</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("url", e)}
                        />
                      </th>
                    )}
                    {show("date") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Date</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("date", e)}
                        />
                      </th>
                    )}
                    {show("relevancy_confidence") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Relevancy Confidence</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) =>
                            startResize("relevancy_confidence", e)
                          }
                        />
                      </th>
                    )}
                    {show("relevancy_reason") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Relevancy Reason</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) =>
                            startResize("relevancy_reason", e)
                          }
                        />
                      </th>
                    )}
                    {show("section") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Section</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("section", e)}
                        />
                      </th>
                    )}
                    {show("section_confidence") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Section Confidence</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) =>
                            startResize("section_confidence", e)
                          }
                        />
                      </th>
                    )}
                    {show("brand") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Brand of interest</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("brand", e)}
                        />
                      </th>
                    )}
                    {show("sentiment") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Sentiment</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("sentiment", e)}
                        />
                      </th>
                    )}
                    {show("sentiment_confidence") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Sentiment Confidence</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) =>
                            startResize("sentiment_confidence", e)
                          }
                        />
                      </th>
                    )}
                    {show("theme") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Theme</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("theme", e)}
                        />
                      </th>
                    )}
                    {show("theme_confidence") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Theme Confidence</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) =>
                            startResize("theme_confidence", e)
                          }
                        />
                      </th>
                    )}
                    {show("competitors") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Competitors</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("competitors", e)}
                        />
                      </th>
                    )}
                    {show("author") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Author</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("author", e)}
                        />
                      </th>
                    )}
                    {show("priority") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Priority</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("priority", e)}
                        />
                      </th>
                    )}
                    {show("people") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>People</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("people", e)}
                        />
                      </th>
                    )}
                    {show("countries") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Countries</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("countries", e)}
                        />
                      </th>
                    )}
                    {show("organizations") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Organizations</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("organizations", e)}
                        />
                      </th>
                    )}
                    {show("syndication") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Syndication of</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("syndication", e)}
                        />
                      </th>
                    )}
                    {show("similar") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Similar of</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("similar", e)}
                        />
                      </th>
                    )}
                    {show("added_type") && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Added Type</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("added_type", e)}
                        />
                      </th>
                    )}
                    {showActions && (
                      <th
                        className="rt-th"
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <span>Actions</span>
                        <div
                          className="rt-th-resize-handle"
                          onMouseDown={(e) => startResize("actions", e)}
                        />
                      </th>
                    )}
                  </tr>
                  <tr
                    className="rtbl__filters"
                    style={{ "--filter-top": `${headH}px` }}
                  >
                    <th
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 25,
                        background: "var(--panel)",
                        borderBottom: "1px solid var(--border-subtle)",
                        borderRight: "1px solid var(--border-subtle)",
                      }}
                    />
                    <th
                      style={{
                        position: "sticky",
                        left: stickyLeft.status,
                        zIndex: 25,
                        background: "var(--panel)",
                        borderBottom: "1px solid var(--border-subtle)",
                        borderRight: "1px solid var(--border-subtle)",
                      }}
                    />
                    {show("id") && (
                      <th
                        style={{
                          position: "sticky",
                          left: stickyLeft.id,
                          zIndex: 25,
                          background: "var(--panel)",
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      />
                    )}
                    {show("title") && (
                      <th
                        style={{
                          position: "sticky",
                          left: stickyLeft.title,
                          zIndex: 25,
                          background: "var(--panel)",
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.title}
                          onChange={(e) => setFilter("title", e.target.value)}
                        />
                      </th>
                    )}
                    {show("content") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.content}
                          onChange={(e) => setFilter("content", e.target.value)}
                        />
                      </th>
                    )}
                    {show("url") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.url}
                          onChange={(e) => setFilter("url", e.target.value)}
                        />
                      </th>
                    )}
                    {show("date") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <DateRangePicker
                          from={filters.dateFrom}
                          to={filters.dateTo}
                          onChange={(f, t) =>
                            setFilters((prev) => ({
                              ...prev,
                              dateFrom: f,
                              dateTo: t,
                            }))
                          }
                        />
                      </th>
                    )}
                    {show("relevancy_confidence") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        {confFilter("relConfOp", "relConfVal")}
                      </th>
                    )}
                    {show("relevancy_reason") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.relevancy_reason}
                          onChange={(e) =>
                            setFilter("relevancy_reason", e.target.value)
                          }
                        />
                      </th>
                    )}
                    {show("section") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.section}
                          onChange={(e) => setFilter("section", e.target.value)}
                        />
                      </th>
                    )}
                    {show("section_confidence") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        {confFilter("secConfOp", "secConfVal")}
                      </th>
                    )}
                    {show("brand") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.brand_of_interest}
                          onChange={(e) =>
                            setFilter("brand_of_interest", e.target.value)
                          }
                        />
                      </th>
                    )}
                    {show("sentiment") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <select
                          className="fcell"
                          value={filters.sentiment}
                          onChange={(e) =>
                            setFilter("sentiment", e.target.value)
                          }
                        >
                          <option value="">All</option>
                          <option value="POS">Positive</option>
                          <option value="NEG">Negative</option>
                          <option value="NEU">Neutral</option>
                        </select>
                      </th>
                    )}
                    {show("sentiment_confidence") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        {confFilter("sentConfOp", "sentConfVal")}
                      </th>
                    )}
                    {show("theme") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.theme}
                          onChange={(e) => setFilter("theme", e.target.value)}
                        />
                      </th>
                    )}
                    {show("theme_confidence") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        {confFilter("themeConfOp", "themeConfVal")}
                      </th>
                    )}
                    {show("competitors") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.competitors}
                          onChange={(e) =>
                            setFilter("competitors", e.target.value)
                          }
                        />
                      </th>
                    )}
                    {show("author") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.author}
                          onChange={(e) => setFilter("author", e.target.value)}
                        />
                      </th>
                    )}
                    {show("priority") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <select
                          className="fcell"
                          value={filters.priority}
                          onChange={(e) =>
                            setFilter("priority", e.target.value)
                          }
                        >
                          <option value="">All</option>
                          <option value="watch">Watch</option>
                          <option value="no">No</option>
                        </select>
                      </th>
                    )}
                    {show("people") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.peoples}
                          onChange={(e) => setFilter("peoples", e.target.value)}
                        />
                      </th>
                    )}
                    {show("countries") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.countries}
                          onChange={(e) =>
                            setFilter("countries", e.target.value)
                          }
                        />
                      </th>
                    )}
                    {show("organizations") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <input
                          className="fcell"
                          placeholder="Filter…"
                          value={filters.organizations}
                          onChange={(e) =>
                            setFilter("organizations", e.target.value)
                          }
                        />
                      </th>
                    )}
                    {show("syndication") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      />
                    )}
                    {show("similar") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      />
                    )}
                    {show("added_type") && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      >
                        <select
                          className="fcell"
                          value={filters.addedType}
                          onChange={(e) =>
                            setFilter("addedType", e.target.value)
                          }
                        >
                          <option value="">All</option>
                          <option value="manual">Manual</option>
                          <option value="auto">Tagged</option>
                        </select>
                      </th>
                    )}
                    {showActions && (
                      <th
                        style={{
                          borderBottom: "1px solid var(--border-subtle)",
                          borderRight: "1px solid var(--border-subtle)",
                        }}
                      />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {viewMode === "grouped" && groups.length === 0 && (
                    <tr>
                      <td colSpan={totalColSpan} className="rtbl__empty">
                        No articles match the current filters.
                      </td>
                    </tr>
                  )}
                  {viewMode === "grouped" &&
                    groups.map((g) => (
                      <Fragment key={`g-${g.main.id}`}>
                        {renderRow(g.main, 0, "rtbl__row--main")}
                        {renderSection(
                          g.main,
                          "similar",
                          g.similar,
                          "↳ Similar",
                        )}
                        {renderSection(
                          g.main,
                          "syndicated",
                          g.syndicated,
                          "↳ Syndicated",
                        )}
                      </Fragment>
                    ))}

                  {viewMode === "flat" && rows.length === 0 && (
                    <tr>
                      <td colSpan={totalColSpan} className="rtbl__empty">
                        No articles match the current filters.
                      </td>
                    </tr>
                  )}
                  {viewMode === "flat" && rows.map((a, i) => renderRow(a, i))}

                  {viewMode === "flat" && !editing && adding && (
                    <>
                      {newRows.map((row) => (
                        <tr className="rtbl__addrow" key={row._key}>
                          <td
                            className="rtbl__checkcol"
                            style={{
                              position: "sticky",
                              left: 0,
                              zIndex: 9,
                              background: "var(--panel)",
                              borderBottom: "1px solid var(--border-subtle)",
                              borderRight: "1px solid var(--border-subtle)",
                            }}
                          />
                          <td
                            style={{
                              position: "sticky",
                              left: stickyLeft.status,
                              zIndex: 9,
                              background: "var(--panel)",
                              borderBottom: "1px solid var(--border-subtle)",
                              borderRight: "1px solid var(--border-subtle)",
                            }}
                          />
                          {show("id") && (
                            <td
                              className="cell--id"
                              style={{
                                position: "sticky",
                                left: stickyLeft.id,
                                zIndex: 9,
                                background: "var(--panel)",
                                borderBottom: "1px solid var(--border-subtle)",
                                borderRight: "1px solid var(--border-subtle)",
                              }}
                            >
                              <button
                                type="button"
                                className="rtbl__rowdel"
                                title="Remove this row"
                                onClick={() => removeRow(row._key)}
                                disabled={addSaving}
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                }}
                              >
                                <CloseIcon width={14} height={14} />
                              </button>
                            </td>
                          )}
                          {show("title") && (
                            <td
                              className="cell--title"
                              style={{
                                position: "sticky",
                                left: stickyLeft.title,
                                zIndex: 9,
                                background: "var(--panel)",
                                borderBottom: "1px solid var(--border-subtle)",
                                borderRight: "1px solid var(--border-subtle)",
                              }}
                            >
                              <input
                                className="ecell"
                                placeholder="Title"
                                value={row.title || ""}
                                onChange={(e) =>
                                  setRowField(row._key, "title", e.target.value)
                                }
                                style={{ width: "100%" }}
                              />
                            </td>
                          )}
                          {show("content") && (
                            <td>
                              <input
                                className="ecell"
                                placeholder="Content"
                                value={row.content || ""}
                                onChange={(e) =>
                                  setRowField(
                                    row._key,
                                    "content",
                                    e.target.value,
                                  )
                                }
                                style={{ width: "100%" }}
                              />
                            </td>
                          )}
                          {show("url") && (
                            <td>
                              <input
                                className="ecell"
                                placeholder="https://…"
                                value={row.url || ""}
                                onChange={(e) =>
                                  setRowField(row._key, "url", e.target.value)
                                }
                                style={{ width: "100%" }}
                              />
                            </td>
                          )}
                          {show("date") && (
                            <td>
                              <input
                                className="ecell"
                                type="date"
                                value={row.date || ""}
                                onChange={(e) =>
                                  setRowField(row._key, "date", e.target.value)
                                }
                                style={{ width: "100%" }}
                              />
                            </td>
                          )}
                          {show("relevancy_confidence") && (
                            <td>{newCell(row, "relevancy_confidence")}</td>
                          )}
                          {show("relevancy_reason") && (
                            <td>{newCell(row, "relevancy_reason")}</td>
                          )}
                          {show("section") && (
                            <td>{newCell(row, "section")}</td>
                          )}
                          {show("section_confidence") && (
                            <td>
                              {newCell(row, "section_category_confidence")}
                            </td>
                          )}
                          {show("brand") && (
                            <td>{newCell(row, "brand_of_interest")}</td>
                          )}
                          {show("sentiment") && (
                            <td>{newCell(row, "sentiment")}</td>
                          )}
                          {show("sentiment_confidence") && (
                            <td>{newCell(row, "sentiment_confidence")}</td>
                          )}
                          {show("theme") && <td>{newCell(row, "theme")}</td>}
                          {show("theme_confidence") && (
                            <td>{newCell(row, "theme_confidence")}</td>
                          )}
                          {show("competitors") && (
                            <td>{newCell(row, "competitors")}</td>
                          )}
                          {show("author") && (
                            <td className="cell--author">
                              <input
                                className="ecell"
                                placeholder="Author"
                                value={row.author || ""}
                                onChange={(e) =>
                                  setRowField(
                                    row._key,
                                    "author",
                                    e.target.value,
                                  )
                                }
                                style={{ width: "100%" }}
                              />
                            </td>
                          )}
                          {show("priority") && (
                            <td>{newCell(row, "priority_watch")}</td>
                          )}
                          {show("people") && <td>{newCell(row, "peoples")}</td>}
                          {show("countries") && (
                            <td>{newCell(row, "countries")}</td>
                          )}
                          {show("organizations") && (
                            <td>{newCell(row, "organizations")}</td>
                          )}
                          {show("syndication") && (
                            <td>
                              <span className="muted">—</span>
                            </td>
                          )}
                          {show("similar") && (
                            <td>
                              <span className="muted">—</span>
                            </td>
                          )}
                          {show("added_type") && (
                            <td>
                              <span className={cn("badge", "badge--manual")}>
                                Manual
                              </span>
                            </td>
                          )}
                          {showActions && (
                            <td>
                              <span className="muted">—</span>
                            </td>
                          )}
                        </tr>
                      ))}
                      <tr className="rtbl__addactions">
                        <td colSpan={totalColSpan}>
                          <div className="rtbl__addbar">
                            <button
                              type="button"
                              className="rtbl__addlink"
                              onClick={addAnotherRow}
                              disabled={addSaving}
                            >
                              + Add another row
                            </button>
                            <span className="rtbl__addbtns">
                              <span className="muted">
                                {newRows.length} new{" "}
                                {newRows.length === 1 ? "row" : "rows"} · title
                                or content required
                              </span>
                              <button
                                type="button"
                                className={cn("btn", "btn--ghost")}
                                onClick={cancelAdd}
                                disabled={addSaving}
                              >
                                <CloseIcon width={16} height={16} /> Cancel
                              </button>
                              <button
                                type="button"
                                className={cn("btn", "btn--primary")}
                                onClick={saveNewArticles}
                                disabled={addSaving}
                              >
                                {addSaving
                                  ? "Adding…"
                                  : `Add ${newRows.length} article${newRows.length === 1 ? "" : "s"}`}
                              </button>
                            </span>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}

                  {viewMode === "flat" && !editing && !adding && (
                    <tr className="rtbl__addtrigger">
                      <td colSpan={totalColSpan}>
                        <button
                          type="button"
                          className="rtbl__addlink"
                          onClick={startAdd}
                          disabled={busy}
                        >
                          + Add article
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {urlModalOpen && (
        <AddByUrlModal
          sessionId={session.id}
          onClose={() => setUrlModalOpen(false)}
          onSaved={onUrlSaved}
        />
      )}

      {pendingCharts && (
        <div className="overlay" onMouseDown={() => setPendingCharts(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tagconfirm-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="tagconfirm-title" className="modal__title">
              Finish tagging the other tab?
            </h2>
            <p className="modal__sub">
              You've completed tagging for{" "}
              <strong>
                {pendingCharts === "monitoring"
                  ? "Dashboard Data"
                  : "Media Monitoring"}
              </strong>
              , but not for{" "}
              <strong>
                {pendingCharts === "monitoring"
                  ? "Media Monitoring"
                  : "Dashboard Data"}
              </strong>
              . Would you like to create the dashboard now, or tag the{" "}
              {pendingCharts === "monitoring"
                ? "Media Monitoring"
                : "Dashboard Data"}{" "}
              tab first?
            </p>
            <div className="form__actions">
              <button
                type="button"
                className={cn("btn", "btn--ghost")}
                onClick={() => {
                  const missing = pendingCharts;
                  setPendingCharts(null);
                  setSubTab(missing);
                }}
              >
                Tag{" "}
                {pendingCharts === "monitoring"
                  ? "Media Monitoring"
                  : "Dashboard Data"}{" "}
                first
              </button>
              <button
                type="button"
                className={cn("btn", "btn--primary")}
                onClick={() => {
                  setPendingCharts(null);
                  startCharts();
                }}
              >
                Create Dashboard anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (asModal) {
    return (
      <div className="rvmodal" role="dialog" aria-modal="true">
        <div className="rvmodal__backdrop" onClick={onClose} />
        <div className="rvmodal__panel">
          <button
            className="rvmodal__close"
            onClick={onClose}
            aria-label="Close review"
          >
            <CloseIcon width={20} height={20} />
          </button>
          <div className="rvmodal__scroll">{body}</div>
        </div>
      </div>
    );
  }

  return body;
}
