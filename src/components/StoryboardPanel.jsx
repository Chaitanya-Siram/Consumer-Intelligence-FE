/**
 * StoryboardPanel — narrative story cards rendered below the Overall Summary
 * WhatsNext      — tab-transition CTA rendered at the bottom of each tab
 *
 * Both consume the `storyboards` array from chartsData.
 */

const CARD_GRADIENTS = [
  ["#6366F1", "#8B5CF6"],
  ["#8B5CF6", "#EC4899"],
  ["#EC4899", "#F59E0B"],
  ["#F59E0B", "#10B981"],
  ["#10B981", "#06B6D4"],
];

const CARD_LABELS = [
  "KEY SIGNAL",
  "DATA POINT",
  "INSIGHT",
  "TREND",
  "WATCHLIST",
];

function pad(n) {
  return String(n).padStart(2, "0");
}

// ── Storyboard Cards — placed right after Overall Summary in each tab ──
export function StoryboardPanel({ chapter }) {
  if (
    !chapter ||
    (!chapter.title &&
      !chapter.description &&
      !chapter.what_to_watch_for?.length)
  ) {
    return null;
  }

  const watches = chapter.what_to_watch_for || [];

  return (
    <div className="sb">
      <div className="sb__head">
        <div className="sb__meta">
          {chapter.section_label && (
            <span className="sb__kicker">{chapter.section_label}</span>
          )}
          <h3 className="sb__title">
            {chapter.title || "Your storyline for this tab"}
          </h3>
          {chapter.description && (
            <p className="sb__desc">{chapter.description}</p>
          )}
        </div>
        {watches.length > 0 && (
          <p className="sb__hint">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Watch for these signals
          </p>
        )}
      </div>

      {watches.length > 0 && (
        <div className="sb__cards">
          {watches.map((w, i) => {
            const [ac1, ac2] = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
            return (
              <div
                key={i}
                className="sb__card"
                style={{ "--ac1": ac1, "--ac2": ac2 }}
              >
                <div className="sb__card-num">
                  {pad(i + 1)} · {CARD_LABELS[i % CARD_LABELS.length]}
                </div>
                <p className="sb__card-body">{w}</p>
                <div className="sb__card-arrow">→</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── What's Next — placed at the very bottom of each tab ──
export function WhatsNext({ chapter, allChapters = [], onSwitchTab }) {
  if (!chapter || !allChapters.length) return null;

  const sorted = [...allChapters].sort((a, b) => a.chapter - b.chapter);
  const nextChapter = sorted.find((c) => c.chapter === chapter.chapter + 1);

  if (!nextChapter || (!nextChapter.title && !nextChapter.description))
    return null;

  const actions = (nextChapter.what_to_watch_for || []).slice(0, 3);

  return (
    <div className="wn">
      <div className="wn__inner">
        <div className="wn__left">
          <div className="wn__eyebrow">
            <span className="wn__dot" />
            What's next · {nextChapter.tab_name}
          </div>
          <h3 className="wn__title">{nextChapter.title}</h3>
          {nextChapter.description && (
            <p className="wn__sub">{nextChapter.description}</p>
          )}
        </div>

        {/* {actions.length > 0 && (
          <div className="wn__actions">
            {actions.map((a, i) => (
              <div key={i} className="wn__action">
                <div className="wn__action-num">→ {pad(i + 1)}</div>
                <p className="wn__action-body">{a}</p>
              </div>
            ))}
          </div>
        )} */}

        <div className="wn__cta-row">
          <button
            className="wn__cta"
            onClick={() => {
              onSwitchTab?.(nextChapter.tab_name);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="wn__cta-label">CONTINUE</span>
            <span className="wn__cta-name">{nextChapter.tab_name}</span>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
