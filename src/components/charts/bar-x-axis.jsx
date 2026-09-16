"use client";;
import { motion } from "motion/react";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useChart, useChartStable } from "./chart-context";

// Horizontal room between the centres of two neighbouring labels, minus a gap so
// adjacent labels never touch. Below this many pixels a label is unreadable and
// we thin the labels out instead of squeezing them.
const LABEL_SLOT_GAP = 6;
const MIN_LABEL_SLOT = 28;
const LABEL_LINE_HEIGHT = 13;
const LABEL_MAX_LINES = 2;

function BarXAxisLabel({
  label,
  x,
  crosshairX,
  isHovering,
  tickerHalfWidth,
  maxWidth
}) {
  const fadeBuffer = 20;
  const fadeRadius = tickerHalfWidth + fadeBuffer;

  let opacity = 1;
  if (isHovering && crosshairX !== null) {
    const distance = Math.abs(x - crosshairX);
    if (distance < tickerHalfWidth) {
      opacity = 0;
    } else if (distance < fadeRadius) {
      opacity = (distance - tickerHalfWidth) / fadeBuffer;
    }
  }

  const text = String(label ?? "");

  // Zero-width container approach for perfect centering. The label itself is
  // limited to its band slot: it wraps onto a second line and then ellipsises,
  // so long category names cannot run into their neighbours. The full text is
  // available on hover via `title`.
  return (
    <div
      className="absolute"
      style={{
        left: x,
        bottom: 8,
        width: 0,
        display: "flex",
        justifyContent: "center",
      }}>
      <motion.span
        animate={{ opacity }}
        className={cn("text-chart-label text-xs")}
        initial={{ opacity: 1 }}
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: LABEL_MAX_LINES,
          overflow: "hidden",
          maxWidth: maxWidth != null ? Math.max(0, maxWidth) : undefined,
          width: maxWidth != null ? "max-content" : undefined,
          lineHeight: `${LABEL_LINE_HEIGHT}px`,
          textAlign: "center",
          // Break between words first; hyphenate a single long word before
          // splitting it at an arbitrary character.
          overflowWrap: "break-word",
          hyphens: "auto",
          flexShrink: 0,
        }}
        lang="en"
        title={text}
        transition={{ duration: 0.4, ease: "easeInOut" }}>
        {text}
      </motion.span>
    </div>
  );
}

export function BarXAxis(props) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  if (!barScale) {
    return null;
  }

  return <BarXAxisInner {...props} container={container} />;
}

const BarXAxisInner = memo(function BarXAxisInner({
  tickerHalfWidth = 50,
  showAllLabels = false,
  maxLabels = 12,
  container
}) {
  const { margin, tooltipData, barScale, bandWidth, barXAccessor, data } =
    useChart();

  // Distance between neighbouring bar centres (band + padding). Falls back to
  // the band width when the scale does not expose `step`.
  const slotWidth = useMemo(() => {
    const step = typeof barScale?.step === "function" ? barScale.step() : 0;
    return step > 0 ? step : (bandWidth ?? 0);
  }, [barScale, bandWidth]);

  // Generate labels for each bar
  const labelsToShow = useMemo(() => {
    if (!(barScale && bandWidth && barXAccessor)) {
      return [];
    }

    const allLabels = data.map((d) => {
      const label = barXAccessor(d);
      const bandX = barScale(label) ?? 0;
      // Center the label under the bar group
      const x = bandX + bandWidth / 2 + margin.left;
      return { label, x };
    });

    // Every label is clipped to its own slot (see BarXAxisLabel), so labels
    // only need thinning when the slots themselves are too narrow to read.
    const slotsPerLabel =
      slotWidth > 0 ? Math.ceil(MIN_LABEL_SLOT / slotWidth) : 1;
    const countStep =
      showAllLabels || allLabels.length <= maxLabels
        ? 1
        : Math.ceil(allLabels.length / maxLabels);
    const step = Math.max(1, slotsPerLabel, countStep);
    if (step === 1) {
      return allLabels;
    }
    return allLabels.filter((_, i) => i % step === 0);
  }, [
    barScale,
    bandWidth,
    barXAccessor,
    data,
    margin.left,
    showAllLabels,
    maxLabels,
    slotWidth,
  ]);

  // A thinned axis can lend the skipped slots to the labels that remain.
  const labelMaxWidth = useMemo(() => {
    if (!(slotWidth > 0) || labelsToShow.length === 0) {
      return undefined;
    }
    const shown = labelsToShow.length;
    const stride = shown > 0 ? Math.max(1, Math.round(data.length / shown)) : 1;
    return Math.max(0, slotWidth * stride - LABEL_SLOT_GAP);
  }, [slotWidth, labelsToShow.length, data.length]);

  const isHovering = tooltipData !== null;
  const crosshairX = tooltipData ? tooltipData.x + margin.left : null;

  return createPortal(<div className="pointer-events-none absolute inset-0">
    {labelsToShow.map((item) => (
      <BarXAxisLabel
        crosshairX={crosshairX}
        isHovering={isHovering}
        key={`${item.label}-${item.x}`}
        label={item.label}
        maxWidth={labelMaxWidth}
        tickerHalfWidth={tickerHalfWidth}
        x={item.x} />
    ))}
  </div>, container);
});

BarXAxis.displayName = "BarXAxis";

export default BarXAxis;
