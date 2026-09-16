import { useEffect, useMemo, useState } from 'react'

// Modal to set a recurring daily schedule (time-of-day + timezone) for a
// generated query. Lists every IANA timezone with its current UTC offset.

const FALLBACK_ZONES = [
  'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney',
]

// "+05:30" -> 330 (minutes), for sorting by offset.
function offsetMinutes(off) {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(off)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  return sign * (Number(m[2]) * 60 + Number(m[3]))
}

function zoneOffset(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date())
    const name = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+00:00'
    const off = name.replace('GMT', '').trim()
    return off === '' ? '+00:00' : off // "GMT" alone means +00:00
  } catch {
    return '+00:00'
  }
}

function allTimezones() {
  let zones = []
  try {
    zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  } catch {
    zones = []
  }
  if (!zones.length) zones = FALLBACK_ZONES
  return zones
    .map((tz) => ({ tz, offset: zoneOffset(tz) }))
    .sort((a, b) => offsetMinutes(a.offset) - offsetMinutes(b.offset) || a.tz.localeCompare(b.tz))
}

function browserTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export default function ScheduleModal({ open, query, saving = false, onClose, onSave, onUnschedule }) {
  const zones = useMemo(allTimezones, [])
  const [time, setTime] = useState('09:00')
  const [tz, setTz] = useState('UTC')

  useEffect(() => {
    if (!open) return
    setTime(query?.schedule_time || '09:00')
    setTz(query?.schedule_timezone || browserTz())
  }, [open, query])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isScheduled = !!query?.schedule_time

  function submit(e) {
    e.preventDefault()
    if (saving || !time || !tz) return
    onSave(time, tz)
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sch-title" onMouseDown={(e) => e.stopPropagation()}>
        <h2 id="sch-title" className="modal__title">Schedule daily run</h2>
        <p className="modal__sub">
          Pick a time of day and timezone. The fetch + tag job runs every day at this time.
        </p>

        <form onSubmit={submit} className="form">
          <label className="field">
            <span className="field__label">Time (daily)</span>
            <input
              className="field__input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Timezone</span>
            <select className="field__input" value={tz} onChange={(e) => setTz(e.target.value)}>
              {zones.map((z) => (
                <option key={z.tz} value={z.tz}>
                  (GMT{z.offset}) {z.tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <div className="form__actions">
            {isScheduled && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => onUnschedule()}
                disabled={saving}
                style={{ marginRight: 'auto' }}
              >
                Unschedule
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
