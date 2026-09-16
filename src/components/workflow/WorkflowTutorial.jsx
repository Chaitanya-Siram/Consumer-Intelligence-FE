import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CloseIcon, ChevronRightIcon } from "../Icons.jsx";

// Tutorial entry point for the Workflow screen:
//  • <TutorialMenu>        header icon → popover with "Guided tour" / "Watch video"
//  • <WorkflowTour>        step-by-step spotlight tour with Back / Next / Skip
//  • <TutorialVideoModal>  popup that plays the narrated walkthrough video

export const TUTORIAL_VIDEO_SRC = "/tutorials/workflow-screen-walkthrough.mp4";
export const TUTORIAL_VIDEO_POSTER =
  "/tutorials/workflow-screen-walkthrough.jpg";

/* ------------------------------------------------------------------ */
/* Menu                                                                */
/* ------------------------------------------------------------------ */

function GraduationIcon(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
function StepsIcon(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="18" r="2" />
      <path d="M7 6h6a3 3 0 0 1 0 6h-1M14 12h1a3 3 0 0 1 0 6h-2" />
    </svg>
  );
}
function PlayCircleIcon(p) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TutorialMenu({ onStartTour, onWatchVideo }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="wftut-menu" ref={rootRef}>
      <button
        type="button"
        className={`wfic${open ? " wfic--active" : ""}`}
        aria-label="Tutorial"
        title="Tutorial"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <GraduationIcon />
      </button>

      {open && (
        <div
          className="wftut-menu__pop"
          role="menu"
          aria-label="Tutorial options"
        >
          <div className="wftut-menu__head">
            <span className="wftut-menu__kicker">Tutorial</span>
            <span className="wftut-menu__title">Learn the Workflow screen</span>
          </div>
          <button
            type="button"
            role="menuitem"
            className="wftut-menu__item"
            onClick={() => {
              setOpen(false);
              onStartTour?.();
            }}
          >
            <span className="wftut-menu__icon wftut-menu__icon--tour">
              <StepsIcon />
            </span>
            <span className="wftut-menu__text">
              <span className="wftut-menu__label">Tutorial steps</span>
              <span className="wftut-menu__desc">
                Guided tour of the screen, one step at a time
              </span>
            </span>
            <ChevronRightIcon
              width={14}
              height={14}
              className="wftut-menu__chev"
            />
          </button>
          {/* <button
            type="button"
            role="menuitem"
            className="wftut-menu__item"
            onClick={() => {
              setOpen(false);
              onWatchVideo?.();
            }}
          >
            <span className="wftut-menu__icon wftut-menu__icon--video"><PlayCircleIcon /></span>
            <span className="wftut-menu__text">
              <span className="wftut-menu__label">Watch video</span>
              <span className="wftut-menu__desc">Narrated walkthrough · about 2½ minutes</span>
            </span>
            <ChevronRightIcon width={14} height={14} className="wftut-menu__chev" />
          </button> */}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Video popup                                                         */
/* ------------------------------------------------------------------ */

export function TutorialVideoModal({ onClose, onStartTour }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div className="wftut-backdrop" onMouseDown={onClose} />
      <div
        className="wftut-video"
        role="dialog"
        aria-modal="true"
        aria-label="Workflow tutorial video"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="wftut-video__head">
          <div>
            <div className="wftut-video__kicker">Tutorial video</div>
            <h2 className="wftut-video__title">How to build a workflow</h2>
          </div>
          <button
            type="button"
            className="wfic wfic--sm"
            aria-label="Close"
            onClick={onClose}
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>

        <video
          className="wftut-video__player"
          src={TUTORIAL_VIDEO_SRC}
          poster={TUTORIAL_VIDEO_POSTER}
          controls
          autoPlay
          playsInline
          preload="metadata"
        >
          Your browser cannot play this video.{" "}
          <a href={TUTORIAL_VIDEO_SRC} target="_blank" rel="noreferrer">
            Open it in a new tab
          </a>
          .
        </video>

        <div className="wftut-video__foot">
          <span className="wftut-video__hint">
            Covers the Data, Analysis, Review, Assembly and Output nodes,
            saving, and running the tagging agent.
          </span>
          <div className="wftut-video__actions">
            <a
              className="wftut-btn wftut-btn--ghost"
              href={TUTORIAL_VIDEO_SRC}
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab
            </a>
            {onStartTour && (
              <button
                type="button"
                className="wftut-btn wftut-btn--primary"
                onClick={() => {
                  onClose?.();
                  onStartTour();
                }}
              >
                Start guided tour
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

/* ------------------------------------------------------------------ */
/* Guided tour                                                         */
/* ------------------------------------------------------------------ */

const SPOT_PAD = 8;
const TIP_W = 360;
const MARGIN = 12;

function findTarget(selector) {
  if (!selector) return null;
  for (const sel of selector.split(",")) {
    const el = document.querySelector(sel.trim());
    if (el) {
      // React Flow nodes: highlight the whole node wrapper, not just the card.
      return el.closest(".react-flow__node") || el;
    }
  }
  return null;
}

function computeTipPosition(rect, placement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tipH = 260; // generous estimate; the box clamps itself anyway
  if (!rect || placement === "center") {
    return {
      left: Math.max(MARGIN, vw / 2 - TIP_W / 2),
      top: Math.max(MARGIN, vh / 2 - tipH / 2),
      arrow: null,
    };
  }
  const order = placement
    ? [placement, "right", "left", "bottom", "top"]
    : ["right", "left", "bottom", "top"];
  const fits = {
    right: rect.right + SPOT_PAD + 16 + TIP_W <= vw - MARGIN,
    left: rect.left - SPOT_PAD - 16 - TIP_W >= MARGIN,
    bottom: rect.bottom + SPOT_PAD + 16 + tipH <= vh - MARGIN,
    top: rect.top - SPOT_PAD - 16 - tipH >= MARGIN,
  };
  const side = order.find((s) => fits[s]) || "bottom";
  let left;
  let top;
  if (side === "right") {
    left = rect.right + SPOT_PAD + 16;
    top = rect.top + rect.height / 2 - tipH / 2;
  } else if (side === "left") {
    left = rect.left - SPOT_PAD - 16 - TIP_W;
    top = rect.top + rect.height / 2 - tipH / 2;
  } else if (side === "bottom") {
    left = rect.left + rect.width / 2 - TIP_W / 2;
    top = rect.bottom + SPOT_PAD + 16;
  } else {
    left = rect.left + rect.width / 2 - TIP_W / 2;
    top = rect.top - SPOT_PAD - 16 - tipH;
  }
  left = Math.min(Math.max(MARGIN, left), vw - TIP_W - MARGIN);
  top = Math.min(Math.max(MARGIN, top), vh - tipH - MARGIN);
  return { left, top, arrow: side };
}

export function WorkflowTour({ steps, onClose, onFinish }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const step = steps[index];
  const total = steps.length;
  const isLast = index === total - 1;

  // Run the step's preparation, then start tracking its target.
  useEffect(() => {
    step?.onEnter?.();
  }, [step]);

  useLayoutEffect(() => {
    let raf = 0;
    let last = "";
    const measure = () => {
      const el = findTarget(step?.target);
      if (!el) {
        if (last !== "none") {
          last = "none";
          setRect(null);
        }
      } else {
        const r = el.getBoundingClientRect();
        const key = `${r.left}|${r.top}|${r.width}|${r.height}`;
        if (key !== last) {
          last = key;
          setRect({
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            right: r.right,
            bottom: r.bottom,
          });
        }
      }
      raf = requestAnimationFrame(measure);
    };
    // Give onEnter a frame to open panels / move the viewport.
    const t = setTimeout(() => {
      raf = requestAnimationFrame(measure);
    }, 60);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, [step]);

  const next = useCallback(() => {
    if (isLast) {
      onFinish?.();
      onClose?.();
    } else setIndex((i) => Math.min(total - 1, i + 1));
  }, [isLast, total, onClose, onFinish]);
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, back, onClose]);

  const tip = useMemo(
    () => computeTipPosition(rect, step?.placement),
    [rect, step],
  );

  if (!step) return null;

  return createPortal(
    <div className="wftour" aria-live="polite">
      {rect ? (
        <div
          className="wftour__spot"
          style={{
            left: rect.left - SPOT_PAD,
            top: rect.top - SPOT_PAD,
            width: rect.width + SPOT_PAD * 2,
            height: rect.height + SPOT_PAD * 2,
          }}
        />
      ) : (
        <div className="wftour__dim" />
      )}

      <div
        className={`wftour__tip${tip.arrow ? ` wftour__tip--${tip.arrow}` : ""}`}
        role="dialog"
        aria-label={`Tutorial step ${index + 1} of ${total}: ${step.title}`}
        style={{ left: tip.left, top: tip.top, width: TIP_W }}
      >
        <div className="wftour__head">
          <span className="wftour__count">
            Step {index + 1} of {total}
          </span>
          <button
            type="button"
            className="wftour__skip"
            onClick={onClose}
            aria-label="Skip tutorial"
          >
            Skip tour
          </button>
        </div>
        <h3 className="wftour__title">{step.title}</h3>
        <p className="wftour__body">{step.body}</p>
        {step.tip && <p className="wftour__hint">{step.tip}</p>}

        <div className="wftour__progress" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`wftour__dot${i === index ? " wftour__dot--on" : i < index ? " wftour__dot--done" : ""}`}
            />
          ))}
        </div>

        <div className="wftour__foot">
          <button
            type="button"
            className="wftut-btn wftut-btn--ghost"
            onClick={back}
            disabled={index === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="wftut-btn wftut-btn--primary"
            onClick={next}
            autoFocus
          >
            {isLast ? "Finish" : "Next"}
            {!isLast && <ChevronRightIcon width={14} height={14} />}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
