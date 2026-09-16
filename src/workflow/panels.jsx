import TagInput from "./TagInput.jsx";
import UnifiedLensPanel from "./UnifiedLensPanel.jsx";
import {
  LENSES,
  LLM_MODELS,
  CHART_OPTIONS,
  LAYOUTS,
  OUTPUT_FORMATS,
} from "./constants.js";
import { splitQueries, updateApiPayload } from "./workflowUtils.js";
import { UploadIcon, TrashIcon } from "../components/Icons.jsx";
import { prettyFileName } from "../utils/files.js";
import { useEffect, useState, useRef } from "react";
import { listSessions, uploadFile } from "../api/sessions.js";
import { useNavigate } from "react-router-dom";
import { paths } from "../router/nav.js";
import { toast } from "react-hot-toast";

import { getActiveProviderKeys } from "../api/dataProviders.js";
import { cn } from "../lib/utils";
import ProviderSelectDropdown from "./ProviderSelectDropdown.jsx";

export { updateApiPayload, splitQueries };

// The backend reads an api data node's sources/queries as flat fields.
function apiFields(queryText, selectedSources, brandKeywords) {
  const { sources, queries } = updateApiPayload(
    queryText,
    selectedSources,
    brandKeywords,
  );
  return { data_sources: sources, queries };
}

// The query box's text. `query` is what the box itself authors, but a node built
// by the workflow agent only carries the derived `queries` array, so fall back to
// that rather than showing an empty box.
function nodeQueryText(d) {
  if (typeof d?.query === "string" && d.query.trim()) return d.query;
  if (Array.isArray(d?.queries) && d.queries.length)
    return d.queries.join(", ");
  return "";
}

// The providers currently ticked on this node, so rebuilding the api payload
// after a query/keyword edit doesn't discard the user's selection.
function currentSources(d) {
  if (Array.isArray(d?.selectedSources)) {
    return d.selectedSources.filter(Boolean);
  }
  // A node built by the workflow agent carries only the saved data_sources.
  if (Array.isArray(d?.data_sources) && d.data_sources.length) {
    return d.data_sources.filter(Boolean);
  }
  if (Array.isArray(d?.api?.sources)) {
    return d.api.sources.filter(Boolean);
  }
  return [];
}

// Right-hand inspector. Renders the editor for whichever node is selected;
// `onChange(patch)` shallow-merges into that node's `data`.
// `showErrors` — when true, validation errors are visible (set after a save attempt).
export default function ConfigPanel({
  node,
  nodes = [],
  onChange,
  showErrors = false,
  project,
  session,
}) {
  if (!node) {
    return <></>;
  }
  const set = (patch) => onChange(patch);
  const d = node.data;
  return (
    <aside
      className="wfpanel"
      style={{
        overflowY: "auto",
        maxHeight: "calc(100vh - 130px)",
        paddingBottom: "90px",
      }}
    >
      {node.type === "data" && (
        <DataPanel
          d={d}
          set={set}
          showErrors={showErrors}
          project={project}
          session={session}
        />
      )}
      {node.type === "analysis" && (
        <AnalysisPanel
          d={d}
          set={set}
          showErrors={showErrors}
          node={node}
          nodes={nodes}
        />
      )}
      {node.type === "review" && <ReviewPanel d={d} set={set} />}
      {node.type === "assembly" && <AssemblyPanel d={d} set={set} />}
      {node.type === "output" && <OutputPanel d={d} set={set} />}
    </aside>
  );
}

function Section({ title, children }) {
  return (
    <>
      <h3 className="wfpanel__title">{title}</h3>
      <div className="wfpanel__body">{children}</div>
    </>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <label className="wffld">
      <span className="wffld__label">{label}</span>
      {children}
      {error ? (
        <span className="wffld__err">{error}</span>
      ) : (
        hint && <span className="wffld__hint">{hint}</span>
      )}
    </label>
  );
}

function DataPanel({ d, set, showErrors, project, session }) {
  const [uploading, setUploading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeProviders, setActiveProviders] = useState({
    "Google News": "google_news",
  });
  const navigate = useNavigate();

  const sessionsData = session?.workflow?.nodes?.find(
    (item) => item.type === "data",
  )?.data;

  console.log({ d, session });

  const hasFile = !!(
    d.fileObject ||
    d.file ||
    d.file_upload_id ||
    (session?.source_file && session?.session_type === "upload")
  );
  // The dropdown writes selectedSources; a saved or agent-built node carries
  // data_sources. A new node starts on Google News.
  const activeSources = Array.isArray(d.selectedSources)
    ? d.selectedSources
    : Array.isArray(d.data_sources) && d.data_sources.length
      ? d.data_sources.filter(Boolean)
      : ["google_news"];

  const hasActiveProvider = activeSources.length > 0;
  const fileName =
    d.file ||
    (d.fileObject
      ? d.fileObject.name
      : session?.source_file
        ? prettyFileName(session.source_file)
        : "");

  useEffect(() => {
    getActiveProviderKeys()
      .then((res) => {
        if (res && typeof res === "object" && Object.keys(res).length > 0) {
          setActiveProviders(res);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch active provider keys:", err);
      });
  }, []);

  useEffect(() => {
    if (project?.id) {
      listSessions(project.id)
        .then((res) => {
          const filtered = res.filter((resp) => resp.session_type === "upload");

          if (filtered) setSessions(filtered);
        })
        .catch(console.error);
    }
  }, [project?.id]);

  useEffect(() => {
    if (hasFile && d.sourceType === "api") {
      set({ sourceType: "file" });
    }
  }, [hasFile, d.sourceType]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file in node data so that the workflow knows about the file selection
    set({
      fileObject: file,
      file: file.name,
      sourceType: "file",
    });

    if (project?.id) {
      try {
        setUploading(true);
        toast.loading("Uploading file...", { id: "upload" });

        const uploadResult = await uploadFile({
          projectId: project.id,
          file: file,
        });

        // The upload has no session; the id links the node to the stored articles.
        if (uploadResult?.file_upload_id) {
          set({ file_upload_id: uploadResult.file_upload_id });
          toast.success(
            `File uploaded (${uploadResult.record_count} articles)`,
            { id: "upload" },
          );
        } else {
          toast.error("Upload returned no file id", { id: "upload" });
        }
      } catch (err) {
        toast.error(err.message || "Failed to upload file", { id: "upload" });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveFile = (e) => {
    e?.stopPropagation();
    set({ file: "", fileObject: null, file_upload_id: null });
  };

  return (
    <Section title="Data Source">
      <Field
        label="Source Type"
        error={
          showErrors && !hasFile && !hasActiveProvider
            ? "Either File Upload or an Active Data Provider is required."
            : undefined
        }
      >
        <div className="wfseg">
          <button
            type="button"
            className={`wfseg__btn${d.sourceType !== "api" ? " wfseg__btn--on" : ""}`}
            onClick={() => set({ sourceType: "file" })}
            disabled={
              session?.session_type && session?.session_type !== "upload"
            }
            style={{
              opacity:
                session?.session_type && session?.session_type !== "upload"
                  ? 0.45
                  : 1,
              cursor:
                session?.session_type && session?.session_type !== "upload"
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            File Upload
          </button>
          <button
            type="button"
            className={`wfseg__btn${d.sourceType === "api" && !(session?.source_file && session?.session_type === "upload") ? " wfseg__btn--on" : ""}`}
            disabled={hasFile}
            onClick={() => {
              if (!hasFile) {
                set({
                  sourceType: "api",
                  file_upload_id: null,
                  // currentSources keeps the node's existing providers; a bare
                  // boolean here would collapse them to google_news.
                  ...apiFields(
                    nodeQueryText(d),
                    currentSources(d),
                    d.brandKeywords,
                  ),
                });
              }
            }}
            style={{
              opacity: hasFile ? 0.45 : 1,
              cursor: hasFile ? "not-allowed" : "pointer",
            }}
            title={hasFile ? "Remove the file to enable REST API" : ""}
          >
            REST API
          </button>
        </div>
      </Field>

      {d.sourceType === "api" ? (
        <>
          {/* <Field label="Endpoint URL">
            <input
              type="text"
              className="wfinput"
              placeholder="Domains (e.g. abc.com, xyz.com)"
              value={d?.domain || ""}
              onChange={(e) => set({ domain: e.target.value })}
            />
          </Field> */}

          <Field label="Data Providers">
            <ProviderSelectDropdown
              activeProviders={activeProviders}
              activeSources={activeSources}
              onChangeSources={(newSources) => {
                const apiPayload = updateApiPayload(
                  nodeQueryText(d),
                  newSources,
                  d.brandKeywords,
                );
                set({
                  selectedSources: newSources,
                  api: apiPayload,
                });
              }}
            />
            {activeSources.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  marginTop: "8px",
                }}
              >
                {activeSources.map((sourceId) => {
                  const displayName =
                    Object.keys(activeProviders).find(
                      (key) => activeProviders[key] === sourceId,
                    ) || sourceId;
                  return (
                    <span
                      key={sourceId}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "#e0e7ff",
                        color: "#3730a3",
                        fontSize: "12px",
                        fontWeight: 500,
                        border: "1px solid #c7d2fe",
                      }}
                    >
                      {displayName}
                      <button
                        type="button"
                        onClick={() => {
                          const newSources = activeSources.filter(
                            (s) => s !== sourceId,
                          );
                          const apiPayload = updateApiPayload(
                            nodeQueryText(d),
                            newSources,
                            d.brandKeywords,
                          );
                          set({
                            selectedSources: newSources,
                            api: apiPayload,
                          });
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0 2px",
                          fontSize: "12px",
                          color: "#4338ca",
                          lineHeight: 1,
                          fontWeight: "bold",
                        }}
                        title="Remove provider"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </Field>

          <Field
            label="Query"
            hint="Use Boolean syntax OR, AND, NOT and single/double quotes."
            error={
              showErrors &&
              (d.errors || []).includes("Unbalanced parentheses in Query")
                ? "Unbalanced parentheses in Query"
                : showErrors &&
                    (d.sourceType === "api" || hasActiveProvider) &&
                    !nodeQueryText(d) &&
                    !(d.brandKeywords || []).length
                  ? "Query is required when a Data Provider is selected"
                  : undefined
            }
          >
            <QueryEditor
              value={nodeQueryText(d)}
              onChange={(query) => {
                set({
                  query,
                  ...apiFields(query, currentSources(d), d.brandKeywords),
                });
              }}
              onValidate={(isValid) => {
                const currentErrors = d.errors || [];
                const hasError = currentErrors.includes(
                  "Unbalanced parentheses in Query",
                );
                if (!isValid && !hasError) {
                  set({
                    errors: [
                      ...currentErrors,
                      "Unbalanced parentheses in Query",
                    ],
                  });
                } else if (isValid && hasError) {
                  set({
                    errors: currentErrors.filter(
                      (err) => err !== "Unbalanced parentheses in Query",
                    ),
                  });
                }
              }}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="File">
            {hasFile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#f3f4f6",
                  borderRadius: "8px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  color: "#374151",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    overflow: "hidden",
                  }}
                >
                  <UploadIcon width={16} height={16} />
                  <span
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                    title={fileName}
                  >
                    {fileName || "Attached file"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove file"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </div>
            )}

            {project?.id && sessions.length > 0 && (
              <select
                className={cn("wfinput", "mb-2")}
                value={session?.id || ""}
                onChange={(e) => {
                  const sid = e.target.value;
                  if (sid && project?.id) {
                    navigate(paths.workflow(project.id, sid));
                  }
                }}
              >
                <option value="" disabled>
                  Select a file...
                </option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.source_file
                      ? prettyFileName(
                          s?.workflow?.nodes?.find(
                            (item) => item.type === "data",
                          )?.data?.file,
                        )
                      : `Session ${s.id}`}
                  </option>
                ))}
              </select>
            )}

            <div
              className="wffile"
              style={{
                cursor: uploading ? "not-allowed" : "pointer",
                opacity: uploading ? 0.7 : 1,
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!uploading)
                  document.getElementById("wf-file-upload")?.click();
              }}
            >
              <UploadIcon width={18} height={18} />
              <span className="wffile__name">
                {uploading ? "Uploading..." : "Upload new file"}
              </span>
            </div>
          </Field>
          <input
            id="wf-file-upload"
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </>
      )}

      <Field
        label="Brand Keyword"
        hint="Enter exactly one brand keyword."
        error={
          showErrors && (d.brandKeywords || []).length !== 1
            ? "Exactly one brand keyword is required."
            : undefined
        }
      >
        <TagInput
          value={d.brandKeywords || []}
          onChange={(brandKeywords) => {
            const patch = { brandKeywords };
            if (d.sourceType === "api" || hasActiveProvider) {
              Object.assign(
                patch,
                apiFields(nodeQueryText(d), currentSources(d), brandKeywords),
              );
            }
            set(patch);
          }}
          tone="brand"
          placeholder="Add brand keyword…"
          showErrors={showErrors}
          required
        />
      </Field>

      <Field
        label="Message Keywords"
        hint="Press Enter or comma to add. Backspace removes the last keyword."
        error={
          showErrors && (d.messageKeywords || []).length === 0
            ? "At least one message keyword is required."
            : undefined
        }
      >
        <TagInput
          value={d.messageKeywords || []}
          onChange={(messageKeywords) => set({ messageKeywords })}
          tone="comp"
          placeholder="Add message keyword…"
          showErrors={showErrors}
          required
        />
      </Field>
    </Section>
  );
}

function AnalysisPanel({ d, set, showErrors, node, nodes = [] }) {
  const otherSelectedLenses = (nodes || [])
    .filter((n) => n.type === "analysis" && n.id !== node?.id)
    .map((n) => n.data?.lens)
    .filter(Boolean);

  return (
    <Section title="Analysis">
      {/* <Field label="Label" hint="Used for the node + dashboard nav">
        <input
          className="wfinput"
          value={d.label || ""}
          onChange={(e) => set({ label: e.target.value })}
        />
      </Field> */}

      <UnifiedLensPanel
        lensType={d.lensType}
        lens={d.lens}
        tier2={d.tier2}
        set={set}
        showErrors={showErrors}
        otherSelectedLenses={otherSelectedLenses}
      />

      <Field label="LLM Model">
        <select
          className="wfinput"
          value={d.llm || ""}
          onChange={(e) => set({ llm: e.target.value })}
        >
          <option value="">No LLM selected</option>
          {LLM_MODELS.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label} — {m.detail}
            </option>
          ))}
        </select>
      </Field>

      {/* <Field label="API Key">
        <input
          type="password"
          className="wfinput"
          placeholder="Enter API Key "
          value={d.apiKey || ""}
          onChange={(e) => set({ apiKey: e.target.value })}
        />
      </Field> */}

      <Field
        label="Competitor Keywords"
        hint="Press Enter or comma to add. Backspace removes the last keyword."
        error={
          showErrors && (d.competitorKeywords || []).length === 0
            ? "At least one competitor keyword is required."
            : undefined
        }
      >
        <TagInput
          value={d.competitorKeywords || []}
          onChange={(competitorKeywords) => set({ competitorKeywords })}
          tone="comp"
          placeholder="Add competitor…"
          required
        />
      </Field>

      <div style={{ marginTop: 12 }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: 13,
            userSelect: "none",
            color: "var(--text)",
          }}
        >
          <input
            type="checkbox"
            checked={d.applyCompetitorsToAll !== false}
            onChange={(e) => set({ applyCompetitorsToAll: e.target.checked })}
            style={{ width: 14, height: 14, cursor: "pointer" }}
          />
          Apply competitor keywords and LLM model to all analysis nodes
        </label>
      </div>
    </Section>
  );
}

function ReviewPanel({ d, set }) {
  return (
    <Section title="Review">
      {/* <Field label="Label">
        <input
          className="wfinput"
          value={d.label || ""}
          onChange={(e) => set({ label: e.target.value })}
        />
      </Field> */}

      <Field
        label={`Flag threshold — ${d.flag || 0}%`}
        hint="Flag articles below this confidence for review"
      >
        <input
          type="range"
          className="wfrange"
          min="0"
          max="100"
          value={d.flag || 0}
          onChange={(e) => set({ flag: Number(e.target.value) })}
        />
      </Field>

      <Field
        label={`Auto-approve — ${d.auto || 0}%`}
        hint="Auto-approve articles above this confidence"
      >
        <input
          type="range"
          className="wfrange"
          min="0"
          max="100"
          value={d.auto || 0}
          onChange={(e) => set({ auto: Number(e.target.value) })}
        />
      </Field>

      <label className="wftoggle">
        <input
          type="checkbox"
          checked={!!d.requiresSignOff}
          onChange={(e) => set({ requiresSignOff: e.target.checked })}
        />
        <span>Requires analyst sign-off</span>
      </label>
    </Section>
  );
}

import { createPortal } from "react-dom";

const TEMPLATE_DESCRIPTIONS = {
  Sense: {
    title: "Sense Layout",
    tagline: "AI Orb & Narrative Intelligence",
    description:
      "Features an animated central AI orb, floating intelligence badges, and interactive narrative tabs.",
  },
  Classic: {
    title: "Classic Layout",
    tagline: "Structured Corporate Overview",
    description:
      "Clean corporate grid with structured KPI metric blocks, executive summary widgets, and standard chart cards.",
  },
  Editorial: {
    title: "Editorial Layout",
    tagline: "Magazine Serif & Warm Wine Accents",
    description:
      "Serif typography with warm wine page styling, narrative story highlights, and magazine-style coverage feeds.",
  },
  Merger: {
    title: "Merger Layout",
    tagline: "Split Navigation & M&A Focus",
    description:
      "Dedicated left navigation bar, split executive comparison panels, and specialized M&A brand evaluation layouts.",
  },
  "PR Impact": {
    title: "PR Impact Layout",
    tagline: "Metrics & PR Score Gauges",
    description:
      "High-impact metric cards, net sentiment gauges, daily PR score performance tracking, and media reach weightings.",
  },
  Glass: {
    title: "Glass Layout",
    tagline: "Translucent Cards & Modern Accents",
    description:
      "Translucent frosted glass panels with subtle neon borders and floating metric cards.",
  },
  Bento: {
    title: "Bento Layout",
    tagline: "Multi-Column Responsive Grid",
    description:
      "Modern bento-box component arrangement with variable span cards, rounded borders, and responsive grid blocks.",
  },
};

function LayoutPreviewCard({ layoutName, isSelected, onSelect }) {
  const cardRef = useRef(null);
  const videoRef = useRef(null);
  const popoverVideoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const modeKeyMap = {
    Sense: "sense",
    Classic: "classic",
    Editorial: "editorial",
    Merger: "merger",
    "PR Impact": "impact",
    Glass: "glass",
    Bento: "bento",
  };

  const modeKey = modeKeyMap[layoutName] || "sense";
  const videoSrc = `/layout-previews/${modeKey}.webm`;
  const info = TEMPLATE_DESCRIPTIONS[layoutName] || TEMPLATE_DESCRIPTIONS.Sense;

  const handleTimeUpdate = (e) => {
    if (e.target.currentTime < 2.0) {
      e.target.currentTime = 2.0;
    }
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const popoverWidth = 440;
      const popoverHeight = 360;

      let left = rect.left - popoverWidth - 16;
      if (left < 10) {
        left = rect.right + 16;
      }

      let top = rect.top + rect.height / 2 - popoverHeight / 2;
      if (top < 20) top = 20;
      if (top + popoverHeight > window.innerHeight - 20) {
        top = Math.max(20, window.innerHeight - popoverHeight - 20);
      }

      setPopoverPos({ top, left });
    }

    setIsHovered(true);

    if (videoRef.current) {
      if (videoRef.current.currentTime < 2.0) {
        videoRef.current.currentTime = 2.0;
      }
      videoRef.current.play().catch(() => {});
    }
    if (popoverVideoRef.current) {
      if (popoverVideoRef.current.currentTime < 2.0) {
        popoverVideoRef.current.currentTime = 2.0;
      }
      popoverVideoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 2.0;
    }
    if (popoverVideoRef.current) {
      popoverVideoRef.current.pause();
      popoverVideoRef.current.currentTime = 2.0;
    }
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`layout-preview-card ${isSelected ? "selected" : ""}`}
        onClick={onSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          borderRadius: "12px",
          border: isSelected
            ? "2px solid #635bff"
            : isHovered
              ? "1px solid #a5b4fc"
              : "1px solid rgba(226, 232, 240, 0.9)",
          background: isSelected
            ? "linear-gradient(180deg, rgba(99, 91, 255, 0.06) 0%, rgba(99, 91, 255, 0.02) 100%)"
            : "#ffffff",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: isSelected
            ? "0 4px 18px rgba(99, 91, 255, 0.22)"
            : isHovered
              ? "0 8px 22px rgba(0, 0, 0, 0.09)"
              : "0 2px 6px rgba(0, 0, 0, 0.03)",
          transform: isHovered ? "translateY(-2px)" : "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "110px",
            background: "#090d16",
            overflow: "hidden",
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            loop
            muted
            playsInline
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isHovered ? 1 : 0.85,
              transition: "opacity 0.2s ease",
            }}
          />
          {!isHovered && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15, 23, 42, 0.3)",
                backdropFilter: "blur(1.5px)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 600,
                gap: "5px",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: "11px", opacity: 0.9 }}>▶</span> Hover
              preview
            </div>
          )}
          {isSelected && (
            <div
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                background: "#635bff",
                color: "#ffffff",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                boxShadow: "0 2px 8px rgba(99, 91, 255, 0.5)",
              }}
            >
              ✓
            </div>
          )}
        </div>
        <div style={{ padding: "8px 10px", textAlign: "center" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: isSelected ? "#635bff" : "#1e293b",
            }}
          >
            {layoutName}
          </div>
        </div>
      </div>

      {/* Floating High-Res Light Presentation Tooltip Popover */}
      {isHovered &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`,
              width: "440px",
              zIndex: 999999,
              pointerEvents: "none",
              animation:
                "popoverLightFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <style>{`
              @keyframes popoverLightFadeIn {
                from { opacity: 0; transform: scale(0.96) translateY(6px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            <div
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow:
                  "0 24px 50px -12px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(99, 91, 255, 0.12)",
                overflow: "hidden",
                color: "#0f172a",
                fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                padding: "16px",
              }}
            >
              {/* Header Title Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#0f172a",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {info.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#64748b",
                      marginTop: "1px",
                    }}
                  >
                    {info.tagline}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(99, 91, 255, 0.08)",
                    border: "1px solid rgba(99, 91, 255, 0.2)",
                    borderRadius: "20px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#4f46e5",
                    letterSpacing: "0.02em",
                  }}
                >
                  Template Preview
                </div>
              </div>

              {/* Video Container */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "235px",
                  background: "#090d16",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid rgba(226, 232, 240, 0.8)",
                }}
              >
                <video
                  ref={popoverVideoRef}
                  src={videoSrc}
                  loop
                  muted
                  playsInline
                  autoPlay
                  preload="auto"
                  onTimeUpdate={handleTimeUpdate}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Description & Action Footer */}
              <div style={{ marginTop: "12px" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "12.5px",
                    lineHeight: 1.55,
                    color: "#334155",
                  }}
                >
                  {info.description}
                </p>

                <div
                  style={{
                    marginTop: "10px",
                    paddingTop: "10px",
                    borderTop: "1px solid #f1f5f9",
                    fontSize: "11.5px",
                    color: "#635bff",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Click card to apply this layout template</span>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function AssemblyPanel({ d, set }) {
  const [activeTab, setActiveTab] = useState("layout");

  function toggleChart(key) {
    const has = (d.charts || []).includes(key);
    set({
      charts: has
        ? d.charts.filter((c) => c !== key)
        : [...(d.charts || []), key],
    });
  }

  const selectedChartsCount = (d.charts || []).length;

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "4px",
          background: "rgba(0, 0, 0, 0.05)",
          padding: "4px",
          borderRadius: "10px",
          marginBottom: "16px",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("layout")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            transition: "all 0.15s ease",
            background: activeTab === "layout" ? "#FFFFFF" : "transparent",
            color: activeTab === "layout" ? "#635bff" : "#64748b",
            boxShadow:
              activeTab === "layout" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
          }}
        >
          Layout & Client
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("charts")}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            transition: "all 0.15s ease",
            background: activeTab === "charts" ? "#FFFFFF" : "transparent",
            color: activeTab === "charts" ? "#635bff" : "#64748b",
            boxShadow:
              activeTab === "charts" ? "0 2px 6px rgba(0, 0, 0, 0.08)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <span>Dashboard Charts</span>
          <span
            style={{
              fontSize: "10.5px",
              padding: "1px 6px",
              borderRadius: "999px",
              background:
                activeTab === "charts"
                  ? "rgba(99, 91, 255, 0.12)"
                  : "rgba(0, 0, 0, 0.08)",
              color: activeTab === "charts" ? "#635bff" : "#64748b",
              fontWeight: 700,
            }}
          >
            {selectedChartsCount}
          </span>
        </button>
      </div>

      {activeTab === "layout" && (
        <Section title="Layout & Client Name">
          <Field label="Client Name">
            <input
              className="wfinput"
              value={d.clientName || ""}
              placeholder="e.g. Acme Corp"
              onChange={(e) => set({ clientName: e.target.value })}
            />
          </Field>

          <Field
            label="Dashboard Layout"
            hint="Hover over any layout option to play video preview"
          >
            <select
              className="wfinput"
              value={d.layout || "Sense"}
              onChange={(e) => {
                const l = e.target.value;
                set({ layout: l });
                const LAYOUT_TO_TEMPLATE_MODE = {
                  Sense: "sense",
                  Classic: "classic",
                  Editorial: "editorial",
                  Merger: "merger",
                  "PR Impact": "impact",
                  Glass: "glass",
                  Bento: "bento",
                };
                const mode = LAYOUT_TO_TEMPLATE_MODE[l] || l.toLowerCase();
                localStorage.setItem("dashboard_template_mode", mode);
                window.dispatchEvent(new Event("storage"));
              }}
              style={{ marginBottom: "12px" }}
            >
              {LAYOUTS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "10px",
                marginTop: "6px",
              }}
            >
              {LAYOUTS.map((l) => (
                <LayoutPreviewCard
                  key={l}
                  layoutName={l}
                  isSelected={(d.layout || "Sense") === l}
                  onSelect={() => {
                    set({ layout: l });
                    const LAYOUT_TO_TEMPLATE_MODE = {
                      Sense: "sense",
                      Classic: "classic",
                      Editorial: "editorial",
                      Merger: "merger",
                      "PR Impact": "impact",
                      Glass: "glass",
                      Bento: "bento",
                    };
                    const mode = LAYOUT_TO_TEMPLATE_MODE[l] || l.toLowerCase();
                    localStorage.setItem("dashboard_template_mode", mode);
                    window.dispatchEvent(new Event("storage"));
                  }}
                />
              ))}
            </div>
          </Field>
        </Section>
      )}

      {activeTab === "charts" && (
        <Section title="Dashboard Charts">
          <Field
            label="Included Charts"
            hint="Select which visual components to assemble into this layout"
          >
            <div className="wfchecks">
              {CHART_OPTIONS.map((c) => (
                <label className="wfcheck" key={c.key}>
                  <input
                    type="checkbox"
                    checked={(d.charts || []).includes(c.key)}
                    onChange={() => toggleChart(c.key)}
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </Field>
        </Section>
      )}
    </>
  );
}

function OutputPanel({ d, set }) {
  return (
    <Section title="Output">
      {/* <Field label="Label">
        <input
          className="wfinput"
          value={d.label || ""}
          onChange={(e) => set({ label: e.target.value })}
        />
      </Field> */}

      {/* <Field label="Format">
        <select
          className="wfinput"
          value={d.format || "Dashboard"}
          onChange={(e) => set({ format: e.target.value })}
        >
          {OUTPUT_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field> */}

      <Field label="Project Name">
        <input
          className="wfinput"
          value={d.projectName || ""}
          maxLength={50}
          placeholder="e.g. Media Monitoring"
          onChange={(e) => set({ projectName: e.target.value })}
        />
      </Field>

      <Field label="Project Description">
        <textarea
          className="wfinput"
          style={{ minHeight: "80px", resize: "vertical" }}
          value={d.projectDescription || ""}
          placeholder="What is this project about?"
          onChange={(e) => set({ projectDescription: e.target.value })}
        />
      </Field>
    </Section>
  );
}

function validateParentheses(query) {
  if (!query) return true;
  let count = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  for (let i = 0; i < query.length; i++) {
    const char = query[i];
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (char === "(") count++;
      if (char === ")") {
        count--;
        if (count < 0) return false;
      }
    }
  }
  return count === 0;
}

function capitalizeOperators(text) {
  if (!text) return "";
  let parts = text.split(/(\'[^\']*\'|\"[^\"]*\")/g);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(/\b(and|or|not)\b/gi, (m) => m.toUpperCase());
  }
  return parts.join("");
}

function highlightQuery(text) {
  if (!text) return "";

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Match:
  // 1. Quoted strings
  // 2. Boolean operators with spaces before & after
  // 3. Parentheses
  const regex = /("[^"]*"|'[^']*')|(?<=\s)(and|or|not)(?=\s)|([()])/gi;

  return escaped.replace(regex, (match, stringVal, boolVal, parenVal) => {
    if (stringVal) {
      return `<span class="bq-string">${stringVal}</span>`;
    }

    if (boolVal) {
      return `<span class="bq-bool">${boolVal.toUpperCase()}</span>`;
    }

    if (parenVal) {
      return `<span class="bq-paren">${parenVal}</span>`;
    }

    return match;
  });
}

function QueryEditor({ value, onChange, onValidate }) {
  const [localQuery, setLocalQuery] = useState(value || "");
  const textareaRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    setLocalQuery(value || "");
  }, [value]);

  const handleChange = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const originalVal = textarea.value;
    const capitalizedVal = capitalizeOperators(originalVal);

    setLocalQuery(capitalizedVal);
    onChange(capitalizedVal);

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.selectionStart = start;
        textarea.selectionEnd = end;
      }
    });
  };

  const handleScroll = (e) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.target.scrollTop;
      backdropRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const handleBlur = () => {
    const capitalizedVal = capitalizeOperators(localQuery);
    setLocalQuery(capitalizedVal);
    onChange(capitalizedVal);
    const isValid = validateParentheses(capitalizedVal);
    onValidate(isValid);
  };

  const localQueryRef = useRef(localQuery);
  useEffect(() => {
    localQueryRef.current = localQuery;
  }, [localQuery]);

  const onValidateRef = useRef(onValidate);
  useEffect(() => {
    onValidateRef.current = onValidate;
  }, [onValidate]);

  useEffect(() => {
    return () => {
      const queryText = localQueryRef.current;
      const isValid = validateParentheses(queryText);
      onValidateRef.current?.(isValid);
    };
  }, []);

  const highlightedHtml = highlightQuery(localQuery);

  return (
    <div className="query-editor-container">
      <div
        ref={backdropRef}
        className="query-editor-backdrop"
        dangerouslySetInnerHTML={{ __html: highlightedHtml + "\n" }}
      />
      <textarea
        ref={textareaRef}
        className="query-editor-textarea"
        value={localQuery}
        onChange={handleChange}
        onScroll={handleScroll}
        onBlur={handleBlur}
        placeholder="e.g. ('Apple' OR 'Google') AND NOT 'Microsoft'"
      />
    </div>
  );
}
