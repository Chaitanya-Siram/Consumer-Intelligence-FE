/**
 * "Save as image" for every chart card and banner in a storyboard.
 *
 * One layer mounted in StoryboardShell tracks which `.card` / `.tbanner` the
 * pointer is over and floats a small button at that element's top-right corner.
 * Clicking it renders the element to a PNG and downloads it. The button lives in
 * a portal on <body>, so nothing is injected into React-managed markup and no
 * chart or banner component needs to know about it. Pointer events (not hover)
 * are used so a tap on a touch screen reveals the button too.
 */
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toPng } from "html-to-image";
import "./capture.css";

const TARGET = ".sb-lens .card, .sb-lens .tbanner";
const BUTTON_CLASS = "capture-btn";
const PIXEL_RATIO = 2;

/** A readable file name from the element's own title text. */
function captureName(el) {
  const title = el.querySelector(".card-title, .b-title, .nm")?.textContent || el.querySelector(".b-eyebrow, .eyebrow")?.textContent || "storyboard";
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "storyboard";
}

function cornerOf(el) {
  const r = el.getBoundingClientRect();
  return { top: Math.max(r.top, 8) + 8, left: Math.min(r.right, window.innerWidth) - 44 };
}

export default function CaptureLayer() {
  const [target, setTarget] = useState(null);
  const [corner, setCorner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onPointerOver = (event) => {
      if (event.target.closest?.(`.${BUTTON_CLASS}`)) return;
      setTarget(event.target.closest?.(TARGET) || null);
    };
    document.addEventListener("pointerover", onPointerOver);
    return () => document.removeEventListener("pointerover", onPointerOver);
  }, []);

  useEffect(() => {
    if (!target) {
      setCorner(null);
      return undefined;
    }
    const place = () => setCorner(cornerOf(target));
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [target]);

  const capture = useCallback(async () => {
    if (!target || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const dataUrl = await toPng(target, {
        pixelRatio: PIXEL_RATIO,
        cacheBust: true,
        filter: (node) => !(node.classList && node.classList.contains(BUTTON_CLASS)),
      });
      const link = document.createElement("a");
      link.download = `${captureName(target)}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [target, busy]);

  if (!target || !corner) return null;
  return createPortal(
    <button
      type="button"
      className={BUTTON_CLASS}
      onClick={capture}
      disabled={busy}
      aria-label={failed ? "Could not save image, try again" : "Save as image"}
      title={failed ? "Could not save image, try again" : "Save as image"}
      style={{ top: corner.top, left: corner.left }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    </button>,
    document.body,
  );
}
