"use client";;
import { motion, useSpring } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useChartConfig } from "../chart-config-context";
import { chartCssVars } from "../chart-context";

// Inner-only-on-visible so `useSpring` initializes at the cursor's actual x/y
// instead of (0, 0) on first hover.
export function TooltipBox(props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = props.containerRef.current;
  if (!(mounted && container)) {
    return null;
  }
  if (!props.visible) {
    return null;
  }
  return <TooltipBoxInner {...props} container={container} />;
}

// Every dashboard card clips its contents with `overflow: hidden` (for its
// rounded corners), and the chart itself is a fixed, short height. A tooltip
// portaled and absolutely-positioned *inside* that card can never be taller
// than the sliver of card left below the cursor — no z-index fixes that,
// z-index only orders siblings, it does not escape an ancestor's clip.
// So this tooltip is portaled to <body> instead and drawn with
// `position: fixed` in viewport coordinates: it renders above every card,
// chart and sidebar in the page (Z_INDEX) and is never clipped by any of
// them, without needing to scroll or shrink its content.
const Z_INDEX = 10000;

function useForceUpdate() {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((t) => t + 1), []);
}

function TooltipBoxInner({
  x,
  y,
  offset = 16,
  className = "",
  children,
  left: leftOverride,
  top: topOverride,
  flipped: flippedOverride,
  springConfig,
  animate = true,
  entrance = true,
  panelStyle,
  backgroundColor = chartCssVars.tooltipBackground,
  container
}) {
  const { tooltipBoxSpring } = useChartConfig();
  const effectiveSpring = springConfig ?? tooltipBoxSpring;

  // Convert the chart-local (x, y) into a viewport-fixed point by adding the
  // chart container's own on-screen position. Recomputed on every render
  // (mousemove already re-renders this component continuously while
  // hovering) and refreshed on scroll/resize so it stays correct even if the
  // page moves under a still cursor.
  const forceUpdate = useForceUpdate();
  useEffect(() => {
    window.addEventListener("scroll", forceUpdate, { passive: true, capture: true });
    window.addEventListener("resize", forceUpdate, { passive: true });
    return () => {
      window.removeEventListener("scroll", forceUpdate, { capture: true });
      window.removeEventListener("resize", forceUpdate);
    };
  }, [forceUpdate]);

  const containerRect = container.getBoundingClientRect();
  const pageX = containerRect.left + x;
  const pageY = containerRect.top + y;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // `left`/`top` overrides (e.g. a vertical chart pins the box to its own
  // `margin.top` instead of following the cursor) are chart-local too, same
  // as `x`/`y` — they need the exact same conversion, or the override value
  // gets used as a raw viewport offset and the tooltip ends up pinned near
  // the top of the browser window instead of the top of the chart.
  const pageLeftOverride =
    leftOverride === undefined ? undefined : containerRect.left + leftOverride;
  const pageTopOverride =
    topOverride === undefined ? undefined : containerRect.top + topOverride;

  const tooltipRef = useRef(null);
  const tooltipWidthRef = useRef(180);
  const tooltipHeightRef = useRef(80);
  const [staticPosition, setStaticPosition] = useState({ left: pageX, top: pageY });

  const tw = tooltipWidthRef.current;
  const th = tooltipHeightRef.current;
  const shouldFlipX = pageX + tw + offset > viewportWidth;
  const targetX = shouldFlipX ? pageX - offset - tw : pageX + offset;
  const targetY = Math.max(offset, Math.min(pageY - th / 2, viewportHeight - th - offset));

  const animatedLeft = useSpring(targetX, effectiveSpring);
  const animatedTop = useSpring(targetY, effectiveSpring);

  if (animate && leftOverride === undefined) {
    animatedLeft.set(targetX);
  }
  if (animate && topOverride === undefined) {
    animatedTop.set(targetY);
  }

  useLayoutEffect(() => {
    if (!tooltipRef.current) {
      return;
    }
    const el = tooltipRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0) {
      tooltipWidthRef.current = w;
    }
    if (h > 0) {
      tooltipHeightRef.current = h;
    }
    const w2 = tooltipWidthRef.current;
    const h2 = tooltipHeightRef.current;
    const flip = pageX + w2 + offset > viewportWidth;
    const tx = flip ? pageX - offset - w2 : pageX + offset;
    const ty = Math.max(offset, Math.min(pageY - h2 / 2, viewportHeight - h2 - offset));
    if (!animate) {
      setStaticPosition({ left: tx, top: ty });
      return;
    }
    if (leftOverride === undefined) {
      animatedLeft.set(tx);
    }
    if (topOverride === undefined) {
      animatedTop.set(ty);
    }
  }, [
    pageX,
    pageY,
    viewportWidth,
    viewportHeight,
    offset,
    leftOverride,
    topOverride,
    animate,
    animatedLeft,
    animatedTop,
  ]);

  const prevFlipRef = useRef(shouldFlipX);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (prevFlipRef.current !== shouldFlipX) {
      setFlipKey((k) => k + 1);
      prevFlipRef.current = shouldFlipX;
    }
  }, [shouldFlipX]);

  const finalLeft = animate
    ? (pageLeftOverride ?? animatedLeft)
    : staticPosition.left;
  const finalTop = animate ? (pageTopOverride ?? animatedTop) : staticPosition.top;
  const isFlipped = flippedOverride ?? shouldFlipX;
  const transformOrigin = isFlipped ? "right top" : "left top";

  const hasCustomBg =
    panelStyle?.background !== undefined ||
    panelStyle?.backgroundColor !== undefined;

  const panelClassName = cn(
    "min-w-[140px] overflow-hidden rounded-xl text-chart-tooltip-foreground shadow-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-md",
    !hasCustomBg &&
      backgroundColor === chartCssVars.tooltipBackground &&
      "bg-chart-tooltip-background",
    panelStyle?.backdropFilter === undefined && "backdrop-blur-md"
  );
  // No maxHeight/scroll here: the panel is no longer confined to the chart's
  // own height (see the body-portal note above), so it simply grows to fit
  // its content — `overflow-hidden` above only keeps the rounded corners
  // clean, it has nothing to clip since the box is never shorter than its
  // content.
  const panelStyleResolved = {
    transformOrigin,
    ...(!hasCustomBg && {
      backgroundColor,
    }),
    ...panelStyle,
  };

  // Fixed (viewport) positioning + a portal to <body> is what actually gets
  // the tooltip out from under every ancestor's `overflow: hidden` — see the
  // note above Z_INDEX. `position: absolute` into the chart-local container
  // (the old approach) could never do this, no matter the z-index.
  if (!entrance) {
    return createPortal(<div
      className={cn("pointer-events-none fixed", className)}
      ref={tooltipRef}
      style={{ left: staticPosition.left, top: staticPosition.top, zIndex: Z_INDEX }}>
      <div className={panelClassName} style={panelStyleResolved}>
        {children}
      </div>
    </div>, document.body);
  }

  return createPortal(<motion.div
    animate={{ opacity: 1 }}
    className={cn("pointer-events-none fixed", className)}
    exit={{ opacity: 0 }}
    initial={{ opacity: 0 }}
    ref={tooltipRef}
    style={{ left: finalLeft, top: finalTop, zIndex: Z_INDEX }}
    transition={{ duration: 0.1 }}>
    <motion.div
      animate={{ scale: 1, opacity: 1, x: 0 }}
      className={panelClassName}
      initial={{ scale: 0.85, opacity: 0, x: isFlipped ? 20 : -20 }}
      key={flipKey}
      style={panelStyleResolved}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}>
      {children}
    </motion.div>
  </motion.div>, document.body);
}

TooltipBox.displayName = "TooltipBox";

export default TooltipBox;
