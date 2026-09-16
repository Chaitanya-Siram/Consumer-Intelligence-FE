import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteSession, listSessions, listGeneratedQueries, getSession, uploadFile, createSession } from '../api/sessions.js'
import { addSectionsPrompt, scheduleGeneratedQuery } from '../api/projects.js'
import UploadModal from '../components/UploadModal.jsx'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BracesIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  DashboardIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  FileTextIcon,
  MergeIcon,
  SearchIcon,
  SpreadsheetIcon,
  TrashIcon,
  UploadIcon,
  WorkflowIcon,
} from '../components/Icons.jsx'
import SectionPromptModal from '../components/SectionPromptModal.jsx'
import ScheduleModal from '../components/ScheduleModal.jsx'
import QueryBuilderDock from '../components/QueryBuilderDock.jsx'
import { fileExt, formatDate, prettyFileName, uploadedDate } from '../utils/files.js'
import { toast } from 'react-hot-toast'

const FILE_TYPE = {
  CSV: { Icon: SpreadsheetIcon, bg: '#d1fae5', fg: '#059669' },
  XLSX: { Icon: SpreadsheetIcon, bg: '#d1fae5', fg: '#059669' },
  XLS: { Icon: SpreadsheetIcon, bg: '#d1fae5', fg: '#059669' },
  PDF: { Icon: FileTextIcon, bg: '#fee2e2', fg: '#dc2626' },
  JSON: { Icon: BracesIcon, bg: '#dbeafe', fg: '#2563eb' },
  QUERY: { Icon: SearchIcon, bg: '#ede9fe', fg: '#7c3aed' },
}
function typeFor(ext) {
  return FILE_TYPE[ext] || { Icon: FileIcon, bg: '#e5e7eb', fg: '#6b7280' }
}

// Copy a previous session's workflow for a re-upload: point its file data nodes at
// the new upload and refresh their keywords. Returns null when there's nothing to copy.
function buildWorkflowForUpload(previousWorkflow, fileUploadId, draftData) {
  if (!previousWorkflow || !Array.isArray(previousWorkflow.nodes)) return null
  const nodes = previousWorkflow.nodes.map((node) => {
    if (node?.type !== 'data') return node
    const data = { ...(node.data || {}) }
    if (data.sourceType === 'api') return node
    data.sourceType = 'file'
    data.file_upload_id = fileUploadId
    delete data.data_sources
    delete data.queries
    if (draftData.brandKeywords?.length) data.brandKeywords = draftData.brandKeywords
    if (draftData.competitorKeywords?.length) data.competitorKeywords = draftData.competitorKeywords
    if (draftData.messageKeywords?.length) data.messageKeywords = draftData.messageKeywords
    return { ...node, data }
  })
  return { ...previousWorkflow, nodes }
}

import { useOnBackHandler } from '../utils/useOnBackHandler.js'

export default function ProjectScreen({ project, onBack, onOpenReview, onOpenWorkflow, onNewWorkflow }) {
  useOnBackHandler(onBack)
  const [sessions, setSessions] = useState([])
  const [generated, setGenerated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [sortDesc, setSortDesc] = useState(true)
  const [selected, setSelected] = useState(() => new Set())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [tab, setTab] = useState('uploading') // uploading (Data) | auto (Generated Query)
  const [expanded, setExpanded] = useState(() => new Set()) // session ids with queries shown
  const [scheduleFor, setScheduleFor] = useState(null) // generated query being scheduled
  const [scheduleSaving, setScheduleSaving] = useState(false)

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Persist (or clear) a generated query's daily schedule, then sync local state.
  const saveSchedule = useCallback(
    async (time, timezone) => {
      if (!scheduleFor) return
      setScheduleSaving(true)
      try {
        const updated = await scheduleGeneratedQuery(project.id, scheduleFor.id, time, timezone)
        setGenerated((list) => list.map((g) => (g.id === updated.id ? updated : g)))
        setScheduleFor(null)
        toast.success(time ? 'Schedule saved successfully.' : 'Schedule removed successfully.')
      } catch (err) {
        toast.error(`Could not save schedule: ${err.message}`)
      } finally {
        setScheduleSaving(false)
      }
    },
    [scheduleFor, project.id],
  )
  const unschedule = useCallback(() => saveSchedule(null, null), [saveSchedule])

  // Media Monitoring section prompt — persisted on the project via the API.
  const [sectionOpen, setSectionOpen] = useState(false)
  const [sectionPrompt, setSectionPrompt] = useState(project.monitoring_sections_prompt || '')
  const [sectionSaving, setSectionSaving] = useState(false)
  const saveSectionPrompt = useCallback(
    async (value) => {
      setSectionSaving(true)
      try {
        const updated = await addSectionsPrompt(project.id, value)
        // Keep the in-memory project in sync so reopening shows the saved value.
        project.monitoring_sections_prompt = updated?.monitoring_sections_prompt ?? value
        setSectionPrompt(updated?.monitoring_sections_prompt ?? value)
        setSectionOpen(false)
        toast.success('Section prompt saved successfully.')
      } catch (err) {
        toast.error(`Could not save section prompt: ${err.message}`)
      } finally {
        setSectionSaving(false)
      }
    },
    [project],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [data, gen] = await Promise.all([
        listSessions(project.id),
        listGeneratedQueries(project.id).catch(() => []),
      ])
      const list = Array.isArray(data) ? data : []
      setSessions(list)
      setGenerated(Array.isArray(gen) ? gen : [])
      setSelected(new Set(list.map((s) => s.id))) // default: all uploaded files selected
    } catch (err) {
      setError(err.message || 'Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }, [project.id])

  useEffect(() => {
    load()
  }, [load])

  const isQueryTab = tab === 'auto'

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Data tab → every session (no session-type filter). Generated Query tab →
    // the project's generated-query records.
    const source = isQueryTab ? generated : sessions
    let list = source.map((s) => ({
      ...s,
      _name: isQueryTab
        ? (s.name || (s.brand_keywords?.[0] ? `${s.brand_keywords[0]} — Generated Query` : `Generated Query #${s.id}`))
        : prettyFileName(s.source_file),
      _ext: isQueryTab ? 'QUERY' : fileExt(s.source_file),
      _date: uploadedDate(s),
    }))
    if (q) {
      list = list.filter((s) => {
        const hay = [
          s._name,
          ...(s.brand_keywords || []),
          ...(s.competitor_keywords || []),
        ]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }
    list.sort((a, b) => {
      const av = a._date ? a._date.getTime() : 0
      const bv = b._date ? b._date.getTime() : 0
      return sortDesc ? bv - av : av - bv
    })
    return list
  }, [sessions, generated, isQueryTab, query, sortDesc])

  const counts = useMemo(
    () => ({ uploading: sessions.length, auto: generated.length }),
    [sessions, generated],
  )

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) rows.forEach((r) => next.delete(r.id))
      else rows.forEach((r) => next.add(r.id))
      return next
    })
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleDelete(session) {
    if (!window.confirm(`Delete "${prettyFileName(session.source_file)}"?`)) return
    const prev = sessions
    setSessions((s) => s.filter((x) => x.id !== session.id))
    setSelected((sel) => {
      const next = new Set(sel)
      next.delete(session.id)
      return next
    })
    try {
      await deleteSession(session.id)
      toast.success(`File "${prettyFileName(session.source_file)}" deleted.`)
    } catch (err) {
      setSessions(prev)
      toast.error(`Could not delete file: ${err.message}`)
    }
  }

  const brandKeyword = sessions.find((s) => s.brand_keywords?.length)?.brand_keywords?.[0]

  // Most recent session with keyword details — its brand / competitor / message
  // keywords prefill the upload modal so a re-upload reuses the same workflow inputs.
  const recentSession = [...sessions]
    .sort((a, b) => (uploadedDate(b)?.getTime() || 0) - (uploadedDate(a)?.getTime() || 0))
    .find(
      (s) =>
        s.brand_keywords?.length ||
        s.competitor_keywords?.length ||
        s.message_keywords?.length,
    )
  const defaultKeywords = {
    brandKeywords: recentSession?.brand_keywords || [],
    competitorKeywords: recentSession?.competitor_keywords || [],
    messageKeywords: recentSession?.message_keywords || [],
  }
  const lastActivity = sessions
    .map((s) => uploadedDate(s))
    .filter(Boolean)
    .sort((a, b) => b - a)[0]
  const selectedCount = rows.filter((r) => selected.has(r.id)).length
  const activeCount = isQueryTab ? generated.length : sessions.length

  return (
    <>
      <button className="backlink" onClick={onBack}>
        <ArrowLeftIcon width={18} height={18} /> All projects
      </button>

      <section className="subhead">
        <p className="subhead__kicker">PROJECT {String(project.id).padStart(2, '0')}</p>
        <h1 className="subhead__title">{project.name}</h1>
        <p className="subhead__meta">
          {sessions.length} {sessions.length === 1 ? 'file' : 'files'} uploaded
          {brandKeyword && (
            <>
              {' · '}brand keyword <span className="subhead__hl">{brandKeyword}</span>
            </>
          )}
          {lastActivity && <> · last activity {formatDate(lastActivity)}</>}
        </p>
      </section>

      <div className="projbar">
        <div className="tabbar tabbar--inline">
          {[
            { key: 'uploading', label: 'Data', count: counts.uploading },
            { key: 'auto', label: 'Generated Query', count: counts.auto },
          ].map((t) => (
            <button
              key={t.key}
              className={`tabbtn${tab === t.key ? ' tabbtn--on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} <span className="tabbtn__count">{t.count}</span>
            </button>
          ))}
        </div>
        <button className="btn btn--ghost" onClick={() => setSectionOpen(true)}>
          <EyeIcon width={18} height={18} />
          {sectionPrompt ? 'Edit Media Monitoring Section' : 'Set Media Monitoring Section'}
        </button>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <SearchIcon width={18} height={18} />
            <input
              className="search__input"
              placeholder="Search files or keywords…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {tab !== 'auto' && (
            <button className="btn btn--ghost" onClick={() => setUploadOpen(true)}>
              <UploadIcon width={18} height={18} /> Upload file
            </button>
          )}
          <button
            className="btn btn--primary"
            disabled={selectedCount === 0}
            onClick={() =>
              toast(`Merge & create dashboard for ${selectedCount} file(s) — coming soon.`, { icon: 'ℹ️' })
            }
          >
            <MergeIcon width={18} height={18} /> Merge and Create Dashboard ({selectedCount})
          </button>
        </div>

        {loading && <TableSkeleton />}

        {!loading && error && (
          <div className="state state--error">
            <p>{error}</p>
            <button className="btn btn--ghost" onClick={load}>Retry</button>
          </div>
        )}

        {!loading && !error && activeCount === 0 && (
          <div className="state">
            {isQueryTab ? (
              <p>No generated queries yet. Use “Create with natural language” below to build one.</p>
            ) : (
              <>
                <p>No files uploaded to this project yet.</p>
                <button className="btn btn--primary" onClick={() => setUploadOpen(true)}>
                  <UploadIcon width={18} height={18} /> Upload file
                </button>
              </>
            )}
          </div>
        )}

        {!loading && !error && activeCount > 0 && (
          <div className="tbl">
            <div className="tbl__head trow">
              <Checkbox checked={allVisibleSelected} onChange={toggleAll} ariaLabel="Select all" />
              <span className="th">{isQueryTab ? 'NAME' : 'FILE NAME'}</span>
              <span className="th">BRAND KEYWORD</span>
              <span className="th">COMPETITOR KEYWORD</span>
              <button className="th th--sort" onClick={() => setSortDesc((d) => !d)}>
                {isQueryTab ? 'CREATED' : 'UPLOADED DATE'}
                <ChevronDownIcon
                  width={14}
                  height={14}
                  style={{ transform: sortDesc ? 'none' : 'rotate(180deg)' }}
                />
              </button>
              <span className="th" />
              <span className="th" />
            </div>

            {rows.length === 0 && (
              <div className="tbl__empty">
                No {isQueryTab ? 'queries' : 'files'} match “{query}”.
              </div>
            )}

            {rows.map((s) => {
              const { Icon, bg, fg } = typeFor(s._ext)
              const status = (s.status || '').toLowerCase()
              const isCompleted = status === 'completed'
              const isTagged = status === 'tagged' || isCompleted
              const isQuery = isQueryTab
              const groups = Array.isArray(s.queries) ? s.queries : []
              const queryCount = groups.reduce((n, g) => n + ((g.queries || []).length), 0)
              const open = expanded.has(s.id)
              return (
                <div className="trowwrap" key={s.id}>
                <div className="trow trow--body">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onChange={() => toggleOne(s.id)}
                    ariaLabel={`Select ${s._name}`}
                  />

                  <div className="cellfile">
                    <span className="ftile" style={{ backgroundColor: bg, color: fg }}>
                      <Icon width={18} height={18} />
                    </span>
                    <div className="cellfile__text">
                      <span className="cellfile__name">{s._name}</span>
                      {isQuery && queryCount > 0 ? (
                        <button
                          className="cellfile__toggle"
                          onClick={() => toggleExpand(s.id)}
                          aria-expanded={open}
                        >
                          {queryCount} {queryCount === 1 ? 'query' : 'queries'}
                          {groups.length > 1 && ` · ${groups.length} groups`}
                          <ChevronDownIcon
                            width={13}
                            height={13}
                            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
                          />
                        </button>
                      ) : (
                        <span className="cellfile__type">{s._ext || 'FILE'}</span>
                      )}
                    </div>
                  </div>

                  <div className="cellkw">
                    {(s.brand_keywords || []).map((k) => (
                      <span className="pill pill--brand" key={k}>{k}</span>
                    ))}
                  </div>

                  <div className="cellkw">
                    {(s.competitor_keywords || []).length === 0 && <span className="muted">—</span>}
                    {(s.competitor_keywords || []).map((k) => (
                      <span className="pill pill--comp" key={k}>{k}</span>
                    ))}
                  </div>

                  <div className="celldate">{formatDate(s._date)}</div>

                  {isQuery ? (
                    <>
                      <div className="rowactions">
                        <button
                          className="iconaction"
                          aria-label="Schedule daily run"
                          title={s.schedule_time
                            ? `Scheduled daily at ${s.schedule_time} ${s.schedule_timezone} (UTC ${s.schedule_time_utc})`
                            : 'Schedule daily run'}
                          onClick={() => setScheduleFor(s)}
                        >
                          <ClockIcon width={17} height={17} />
                        </button>
                      </div>
                      <span className={`statpill${s.status === 'Scheduled' ? ' statpill--on' : ''}`}>
                        {s.status === 'Scheduled' && s.schedule_time
                          ? `${s.schedule_time} · ${(s.schedule_timezone || '').split('/').pop()?.replace(/_/g, ' ') || 'UTC'}`
                          : (s.status || 'Unscheduled')}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="rowactions">
                        <button
                          className="iconaction"
                          aria-label="Download"
                          title="Download source file (coming soon)"
                          onClick={() => toast('Download is not wired to an endpoint yet.', { icon: 'ℹ️' })}
                        >
                          <DownloadIcon width={17} height={17} />
                        </button>
                        <button
                          className="iconaction iconaction--danger"
                          aria-label="Delete"
                          title="Delete file"
                          onClick={() => handleDelete(s)}
                        >
                          <TrashIcon width={17} height={17} />
                        </button>
                      </div>

                      <div className="rowbtns">
                        <button
                          className="btn btn--ghost btn--mini"
                          onClick={() => onOpenWorkflow?.(s)}
                          title="Open this file in the workflow builder"
                        >
                          <WorkflowIcon width={15} height={15} /> Open Workflow
                        </button>
                        <button
                          className="btn btn--open"
                          onClick={() => {
                            if (isTagged) {
                              // Tagged or completed → review page loads tags directly, no
                              // WS run. (Completed: "Create Dashboard" there hits the cache.)
                              onOpenReview?.(s)
                            } else {
                              // Not tagged yet → review page runs the tagging WebSocket.
                              onOpenReview?.(s, { runTagging: true })
                            }
                          }}
                        >
                          <DashboardIcon width={15} height={15} />
                          {isCompleted ? 'Open dashboards' : 'Generate dashboards'}
                          <ArrowRightIcon width={15} height={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {isQuery && open && (
                  <div className="qexpand">
                    {groups.length === 0 && (
                      <span className="muted">No queries recorded for this entry.</span>
                    )}
                    {groups.map((g, gi) => (
                      <div className="qgroup" key={g.label || gi}>
                        {g.label && <div className="qgroup__label">{g.label}</div>}
                        <div className="qgroup__items">
                          {(g.queries || []).map((q, qi) => (
                            <span className="qchip" key={qi}>{q}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <UploadModal
        open={uploadOpen}
        projectId={project.id}
        defaultKeywords={defaultKeywords}
        onClose={() => setUploadOpen(false)}
        onUploaded={async (draftData) => {
          // Upload the file, then create a session from the previous session's
          // workflow with the new upload id and keywords patched onto it.
          const uploadResult = await uploadFile({
            projectId: project.id,
            file: draftData.file,
          })
          if (!uploadResult?.file_upload_id) {
            throw new Error('Upload succeeded but returned no file id.')
          }

          if (!recentSession?.id) {
            throw new Error('No previous workflow to copy — build one in the workflow designer.')
          }
          const prev = await getSession(recentSession.id)
          const workflow = buildWorkflowForUpload(prev?.workflow, uploadResult.file_upload_id, draftData)
          if (!workflow) {
            throw new Error('The previous session has no workflow to copy.')
          }

          const created = await createSession({ projectId: project.id, workflow })
          const list = await listSessions(project.id)
          const newSession =
            (list || []).find((s) => s.id === created?.session_id) ||
            [...(list || [])].sort(
              (a, b) => (uploadedDate(b)?.getTime() || 0) - (uploadedDate(a)?.getTime() || 0),
            )[0]
          if (!newSession) {
            throw new Error('Session created but could not be located.')
          }
          setUploadOpen(false)
          onOpenReview?.(newSession, { runTagging: true })
        }}
      />

      <SectionPromptModal
        open={sectionOpen}
        initialValue={sectionPrompt}
        saving={sectionSaving}
        onClose={() => setSectionOpen(false)}
        onSave={saveSectionPrompt}
      />

      <ScheduleModal
        open={!!scheduleFor}
        query={scheduleFor}
        saving={scheduleSaving}
        onClose={() => setScheduleFor(null)}
        onSave={saveSchedule}
        onUnschedule={unschedule}
      />

      {tab === 'auto' && <QueryBuilderDock projectId={project.id} onSaved={() => load()} />}
    </>
  )
}

function Checkbox({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`checkbox${checked ? ' checkbox--on' : ''}`}
      onClick={onChange}
    >
      {checked && <CheckIcon width={13} height={13} />}
    </button>
  )
}

function TableSkeleton() {
  return (
    <div className="tbl">
      {Array.from({ length: 6 }).map((_, i) => (
        <div className="trow trow--body" key={i}>
          <div className="sk" style={{ width: 20, height: 20, borderRadius: 6 }} />
          <div className="cellfile">
            <div className="sk sk--tile" style={{ width: 38, height: 38, margin: 0 }} />
            <div className="sk sk--line sk--w60" style={{ margin: 0 }} />
          </div>
          <div className="sk sk--line sk--w40" style={{ margin: 0 }} />
          <div className="sk sk--line sk--w40" style={{ margin: 0 }} />
          <div className="sk sk--line sk--w30" style={{ margin: 0 }} />
          <div />
          <div />
        </div>
      ))}
    </div>
  )
}
