import { useEffect, useRef, useState } from "react";

import { Rich } from "../../utils/text.jsx";
import "./storyboard-base.css";

/**
 * Reveal-on-scroll, ported from the storyboard's own IntersectionObserver.
 *
 * Re-runs whenever `key` changes because switching tabs swaps the whole panel:
 * the incoming `.reveal` nodes are new elements the old observer never saw, and
 * without this they would sit at opacity 0 forever.
 */
export function useReveal(key) {
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const targets = root.querySelectorAll(".reveal");
    // Anything already on screen when the panel mounts should not wait for a
    // scroll event that may never come on a short page.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vis");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return ref;
}

function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="prog-track">
      <div className="prog-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function AiModal({ modal, onClose }) {
  useEffect(() => {
    if (!modal) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, onClose]);

  return (
    <div
      className={`modal-bg${modal ? " open" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {modal ? (
        <div className="modal-box" role="dialog" aria-modal="true" aria-label={modal.title}>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <div className="modal-tag">{modal.tag}</div>
          <h3 className="modal-title">{modal.title}</h3>
          <div className="modal-body">
            {modal.stats?.length ? (
              <div className="modal-stats">
                {modal.stats.map((stat) => (
                  <div className="modal-stat" key={`${stat.label}-${stat.value}`}>
                    <div className="mv">{stat.value}</div>
                    <div className="ml">{stat.label}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {modal.paragraphs?.length ? (
              modal.paragraphs.map((text, i) => (
                // A div, not a <p>: `Rich` renders block elements, and <p> inside <p>
                // is invalid HTML that React warns about.
                // eslint-disable-next-line react/no-array-index-key -- prose order is the identity
                <div className="modal-para" key={i}>
                  <Rich text={text} />
                </div>
              ))
            ) : (
              <p className="sb-muted">No AI analysis was generated for this view.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function StoryboardShell({
  scope,
  brandName,
  subtitle,
  tabs,
  active,
  onTab,
  footer,
  modal,
  onCloseModal,
  onBack,
  children,
  // Chrome differs per page: Trend has a scroll progress bar and AI modals,
  // Brand & Competitive has neither and lays its footer out as plain spans.
  progress = true,
  footerAs = "div",
}) {
  return (
    // `sb-lens` carries the rules shared by every storyboard; `scope` carries this
    // page's own, because the four source pages style the same class names
    // differently. Both are required.
    <div className={`sb-lens ${scope}`}>
      {progress ? <ScrollProgress /> : null}

      <div className="nav-wrap">
        <div className="nav-inner">
          <div className="brand">
            {onBack ? (
              <button type="button" className="sb-back" onClick={onBack}>
                ← Back
              </button>
            ) : null}
            <div className="brand-text">
              <div className="brand-name">{brandName}</div>
              <div className="brand-sub">{subtitle}</div>
            </div>
          </div>
          <div className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab${tab.id === active ? " active" : ""}`}
                onClick={() => onTab(tab.id)}
              >
                <span className="tdot" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {children}

      {footer?.length ? (
        <div className="foot">
          {footer.map((line) =>
            footerAs === "span" ? (
              <span key={line}>{line}</span>
            ) : (
              <div className="foot-txt" key={line}>
                {line}
              </div>
            ),
          )}
        </div>
      ) : null}

      {onCloseModal ? <AiModal modal={modal} onClose={onCloseModal} /> : null}
    </div>
  );
}
