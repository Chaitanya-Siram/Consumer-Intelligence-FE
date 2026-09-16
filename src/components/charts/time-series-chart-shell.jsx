"use client";;
import { scaleLinear, scaleTime } from "@visx/scale";
import { bisector, extent } from "d3-array";
import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_ANIMATION_EASING,
  DEFAULT_CHART_ENTER_TRANSITION,
} from "./animation";
import {
  isClipExcludedComponent,
  isPostOverlayComponent,
  isUnderlayComponent,
  resolveChartChildElement,
} from "./chart-child-passthrough";
import { ChartProvider } from "./chart-context";
import { isGradientDefComponent, isPatternDefComponent } from "./chart-defs";
import { shortDateFmt } from "./chart-formatters";
import { DEFAULT_CHART_STATUS, DEFAULT_Y_DOMAIN_TWEEN_MS, isChartInteractionPhase } from "./chart-phase";
import { ChartRevealClip } from "./chart-reveal-clip";
import {
  decimateTimeSeries,
  maxRenderPointsForWidth,
} from "./decimate-time-series";
import { filterDataByXDomain } from "./filter-data-by-x-domain";
import {
  generateChartSkeletonData,
  generateChartSkeletonFromTarget,
} from "./generate-chart-skeleton-data";
import {
  extractProjectionLineConfigs,
  mergeProjectionXDomainMax,
  mergeProjectionYDomain,
} from "./projection-config";
import { extractReferenceAreaConfigs } from "./reference-area-config";
import { ReferenceAreaRegistrationContext } from "./reference-area-registration-context";
import {
  computeSeriesBarRevealClipPadding,
  computeSeriesBarWidth,
} from "./series-bar-layout";
import { useStaticChartPreview } from "./static-chart-preview-context";
import { useAnimatedYDomains } from "./use-animated-y-domains";
import { useChartInteraction } from "./use-chart-interaction";
import { useChartPhaseOrchestrator } from "./use-chart-phase-orchestrator";
import {
  buildYScalesFromDomains,
  DEFAULT_Y_AXIS_ID,
  getPrimaryYScale,
  groupLinesByYAxisId,
} from "./y-axis-scales";
import { computeYDomainsByAxis } from "./y-domain-utils";

function collectNumericExtents(
  data,
  dataKeys
) {
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (const d of data) {
    for (const key of dataKeys) {
      const value = d[key];
      if (typeof value === "number") {
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }
  }

  if (minValue === Number.POSITIVE_INFINITY) {
    return { minValue: 0, maxValue: 100 };
  }

  return { minValue, maxValue };
}

function resolveTimeSeriesYDomain(data, dataKeys, yScaleDomainMax) {
  if (yScaleDomainMax != null && yScaleDomainMax > 0) {
    const bottom = -yScaleDomainMax * 0.05;
    return [bottom, yScaleDomainMax * 1.15];
  }

  const { minValue, maxValue } = collectNumericExtents(data, dataKeys);

  if (minValue >= 0) {
    const top = maxValue <= 0 ? 100 : maxValue * 1.12;
    // Lifts y=0 baseline ~12-15px above innerHeight so curves, strokes, and markers at 0 do not get cut off flat
    const bottom = -Math.max(1, top * 0.05);
    return [bottom, top];
  }

  const padding = (maxValue - minValue) * 0.06 || 1;
  return [minValue - padding, maxValue + padding];
}

function ensureChildKey(child, index) {
  if (child.key != null) {
    return child;
  }
  return cloneElement(child, { key: `chart-child-${index}` });
}

export function TimeSeriesChartInner(props) {
  const { width, height } = props;
  if (width < 10 || height < 10) {
    return null;
  }
  return <TimeSeriesChartCore {...props} />;
}

const TimeSeriesChartCore = memo(function TimeSeriesChartCore({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing = DEFAULT_ANIMATION_EASING,
  enterTransition,
  revealSignature = "",
  children,
  containerRef,
  lines,
  clipPathId,
  composedBarDataKeys,
  composedBarSize,
  composedMaxBarSize,
  composedBarGap,
  composedStacked,
  composedStackOffsets,
  composedStackGap,
  yScaleDomainMax,
  chartStatus = DEFAULT_CHART_STATUS,
  loadingLabel,
  yDomainTween = true,
  yDomainTweenDuration = DEFAULT_Y_DOMAIN_TWEEN_MS,
  xDomain,
  xDomainSlotCount,
  tweenYDomainOnXDomainChange = false,
  onPhaseChange
}) {
  const staticPreview = useStaticChartPreview();

  const safeData = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      if (Array.isArray(data.points)) return data.points;
      if (Array.isArray(data.area)) return data.area;
      if (Array.isArray(data.data)) return data.data;
    }
    return [];
  }, [data]);

  const safeLines = useMemo(() => (Array.isArray(lines) ? lines : []), [lines]);
  const safeMargin = useMemo(
    () => ({
      top: margin?.top ?? 16,
      right: margin?.right ?? 16,
      bottom: margin?.bottom ?? 24,
      left: margin?.left ?? 40,
    }),
    [margin]
  );

  const innerWidth = Math.max(0, width - safeMargin.left - safeMargin.right);
  const innerHeight = Math.max(0, height - safeMargin.top - safeMargin.bottom);

  const resolveYDomain = useCallback((sourceData, dataKeys) => {
    const axisGroups = groupLinesByYAxisId(safeLines);
    const usesDefaultOnly =
      axisGroups.size === 1 && axisGroups.has(DEFAULT_Y_AXIS_ID);
    const domainMax =
      usesDefaultOnly && yScaleDomainMax != null
        ? yScaleDomainMax
        : undefined;
    return resolveTimeSeriesYDomain(sourceData, dataKeys, domainMax);
  }, [safeLines, yScaleDomainMax]);

  const skeletonData = useMemo(() => {
    const primaryKey = safeLines[0]?.dataKey ?? "value";
    if (safeData.length === 0) {
      return generateChartSkeletonData({ dataKey: primaryKey });
    }
    return generateChartSkeletonFromTarget(safeData, primaryKey);
  }, [safeData, safeLines]);

  const {
    chartPhase,
    plotData,
    revealEpoch,
    concealEpoch,
    isLoaded,
    notifyLoadingPulseComplete,
    notifyRevealConcealComplete,
    notifyYDomainTweenComplete,
  } = useChartPhaseOrchestrator({
    animationDuration,
    chartStatus,
    revealSignature,
    skeletonData,
    skipEnterReveal: staticPreview,
    targetData: safeData,
    yDomainTweenDuration,
  });

  useEffect(() => {
    onPhaseChange?.(chartPhase);
  }, [chartPhase, onPhaseChange]);

  const xAccessor = useCallback(d => {
    if (!d) return new Date(0);
    const value = d[xDataKey] ?? d.date ?? d.name ?? d.label ?? "";
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    const dt = new Date(value);
    if (!isNaN(dt.getTime())) {
      return dt;
    }
    return new Date(0);
  }, [xDataKey]);

  const bisectDate = useMemo(() => bisector((d) => xAccessor(d)).left, [xAccessor]);

  const visiblePlotData = useMemo(() => {
    if (!xDomain) {
      return plotData;
    }
    return filterDataByXDomain(plotData, xDomain, xAccessor);
  }, [plotData, xDomain, xAccessor]);

  const projectionConfigs = useMemo(() => extractProjectionLineConfigs(children), [children]);

  const xScale = useMemo(() => {
    const minTime = xDomain
      ? xDomain[0].getTime()
      : (extent(plotData, (d) => xAccessor(d).getTime())[0] ?? 0);
    let maxTime = xDomain
      ? xDomain[1].getTime()
      : (extent(plotData, (d) => xAccessor(d).getTime())[1] ?? minTime);
    // Brush defines the viewport — projection horizon is included via brush
    // track extent, not by extending past the selection on the main chart.
    if (!xDomain) {
      maxTime = mergeProjectionXDomainMax(maxTime, projectionConfigs);
    }

    return scaleTime({
      range: [0, innerWidth],
      domain: [minTime, maxTime],
    });
  }, [innerWidth, plotData, projectionConfigs, xAccessor, xDomain]);

  // When brushing, keep the full series for path rendering so edge fades stay
  // anchored to the viewport while the line pans through them. Y-domain and
  // interaction still use the filtered visible slice.
  const seriesSourceData = xDomain ? plotData : visiblePlotData;

  const renderData = useMemo(() => {
    const valueKeys = safeLines.map((line) => line.dataKey);
    return decimateTimeSeries(seriesSourceData, maxRenderPointsForWidth(innerWidth), valueKeys);
  }, [seriesSourceData, innerWidth, safeLines]);

  const columnWidth = useMemo(() => {
    const slotCount =
      xDomain && xDomainSlotCount != null
        ? xDomainSlotCount
        : visiblePlotData.length;
    if (slotCount < 2) {
      return 0;
    }
    return innerWidth / (slotCount - 1);
  }, [innerWidth, visiblePlotData.length, xDomain, xDomainSlotCount]);

  const yDomainSkeletonByAxis = useMemo(() =>
    computeYDomainsByAxis({
      lines: safeLines,
      resolveDomain: (dataKeys) => resolveYDomain(skeletonData, dataKeys),
    }), [safeLines, resolveYDomain, skeletonData]);

  const yDomainTargetByAxis = useMemo(() => {
    const base = computeYDomainsByAxis({
      lines: safeLines,
      resolveDomain: (dataKeys) =>
        resolveYDomain(xDomain ? visiblePlotData : safeData, dataKeys),
    });
    if (projectionConfigs.length === 0) {
      return base;
    }
    const merged = { ...base };
    for (const axisId of Object.keys(base)) {
      merged[axisId] = mergeProjectionYDomain(base[axisId] ?? [0, 100], projectionConfigs, axisId);
    }
    for (const config of projectionConfigs) {
      if (!merged[config.yAxisId]) {
        merged[config.yAxisId] = mergeProjectionYDomain([0, 100], projectionConfigs, config.yAxisId);
      }
    }
    return merged;
  }, [
    safeData,
    safeLines,
    projectionConfigs,
    resolveYDomain,
    visiblePlotData,
    xDomain,
  ]);

  const animatedYDomainsByAxis = useAnimatedYDomains({
    chartPhase,
    durationMs: yDomainTweenDuration,
    enabled: yDomainTween,
    onSettled: notifyYDomainTweenComplete,
    skeletonByAxis: yDomainSkeletonByAxis,
    targetByAxis: yDomainTargetByAxis,
    tweenOnTargetChange:
      yDomainTween || (tweenYDomainOnXDomainChange && xDomain != null),
  });

  const yDomainsForScales = animatedYDomainsByAxis;

  const yScales = useMemo(() =>
    buildYScalesFromDomains({
      domainsByAxis: yDomainsForScales,
      innerHeight,
      lines: safeLines,
    }), [yDomainsForScales, innerHeight, safeLines]);

  const yScale = getPrimaryYScale(
    yScales,
    scaleLinear({ range: [innerHeight, 0], domain: [0, 100], nice: true })
  );

  const dateLabels = useMemo(
    () =>
      visiblePlotData.map((d) => {
        const acc = xAccessor(d);
        if (
          acc &&
          acc instanceof Date &&
          !isNaN(acc.getTime()) &&
          acc.getTime() > 0
        ) {
          try {
            return shortDateFmt.format(acc);
          } catch {
            /* fallback */
          }
        }
        const rawVal = d?.[xDataKey] ?? d?.date ?? d?.name ?? d?.label ?? "";
        return String(rawVal ?? "");
      }),
    [visiblePlotData, xAccessor, xDataKey]
  );

  const canInteract = isLoaded && isChartInteractionPhase(chartPhase);

  const {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection,
    interactionHandlers,
    interactionStyle,
  } = useChartInteraction({
    bisectDate,
    canInteract,
    data: visiblePlotData,
    lines: safeLines,
    margin: safeMargin,
    xAccessor,
    xScale,
    yScale,
    yScales,
  });

  const defsChildren = [];
  const clipExcludedChildren = [];
  const underlayChildren = [];
  const preOverlayChildren = [];
  const postOverlayChildren = [];

  Children.forEach(children, (child, index) => {
    if (!isValidElement(child)) {
      return;
    }

    const keyedChild = ensureChildKey(child, index);
    const resolvedChild = resolveChartChildElement(keyedChild);

    if (isGradientDefComponent(resolvedChild)) {
      defsChildren.push(resolvedChild);
    } else if (isPatternDefComponent(resolvedChild)) {
      preOverlayChildren.push(resolvedChild);
    } else if (isPostOverlayComponent(resolvedChild)) {
      postOverlayChildren.push(resolvedChild);
    } else if (isClipExcludedComponent(resolvedChild)) {
      clipExcludedChildren.push(resolvedChild);
    } else if (isUnderlayComponent(resolvedChild)) {
      underlayChildren.push(resolvedChild);
    } else {
      preOverlayChildren.push(resolvedChild);
    }
  });

  const [registeredReferenceAreas, setRegisteredReferenceAreas] = useState(() => new Map());

  const registerReferenceArea = useCallback((id, config) => {
    setRegisteredReferenceAreas((prev) => {
      const existing = prev.get(id);
      if (
        existing &&
        existing.yAxisId === config.yAxisId &&
        existing.y1 === config.y1 &&
        existing.y2 === config.y2 &&
        existing.axisLabelColor === config.axisLabelColor
      ) {
        return prev;
      }
      const next = new Map(prev);
      next.set(id, config);
      return next;
    });
  }, []);

  const unregisterReferenceArea = useCallback((id) => {
    setRegisteredReferenceAreas((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const referenceAreaRegistration = useMemo(
    () => ({ registerReferenceArea, unregisterReferenceArea }),
    [registerReferenceArea, unregisterReferenceArea]
  );

  const referenceAreas = useMemo(() => {
    const extracted = extractReferenceAreaConfigs(children);
    const registered = [...registeredReferenceAreas.values()];
    if (registered.length === 0) {
      return extracted;
    }
    if (extracted.length === 0) {
      return registered;
    }
    return [...extracted, ...registered];
  }, [children, registeredReferenceAreas]);

  const contextValue = useMemo(() => ({
    data: visiblePlotData,
    renderData,
    xScale,
    yScale,
    yScales,
    width,
    height,
    innerWidth,
    innerHeight,
    margin,
    columnWidth,
    tooltipData,
    setTooltipData,
    containerRef,
    lines,
    referenceAreas,
    chartPhase,
    chartStatus,
    loadingLabel,
    yDomainTweenDuration,
    yDomainSkeletonByAxis,
    yDomainTargetByAxis,
    isLoaded,
    animationDuration,
    animationEasing,
    enterTransition,
    revealEpoch,
    notifyLoadingPulseComplete,
    xAccessor,
    dateLabels,
    xDomain,
    xDomainSlotCount,
    selection,
    clearSelection,
    composedBarDataKeys,
    composedBarSize,
    composedMaxBarSize,
    composedBarGap,
    composedStacked,
    composedStackOffsets,
    composedStackGap,
  }), [
    visiblePlotData,
    renderData,
    xScale,
    yScale,
    yScales,
    width,
    height,
    innerWidth,
    innerHeight,
    margin,
    columnWidth,
    tooltipData,
    setTooltipData,
    containerRef,
    lines,
    referenceAreas,
    chartPhase,
    chartStatus,
    loadingLabel,
    yDomainTweenDuration,
    yDomainSkeletonByAxis,
    yDomainTargetByAxis,
    isLoaded,
    animationDuration,
    animationEasing,
    enterTransition,
    revealEpoch,
    notifyLoadingPulseComplete,
    xAccessor,
    dateLabels,
    xDomain,
    xDomainSlotCount,
    selection,
    clearSelection,
    composedBarDataKeys,
    composedBarSize,
    composedMaxBarSize,
    composedBarGap,
    composedStacked,
    composedStackOffsets,
    composedStackGap,
  ]);

  const useClipReveal =
    !staticPreview &&
    renderData.length > 1 &&
    innerWidth > 0 &&
    animationDuration > 0;
  const isRevealAnimating = chartPhase === "revealing";
  const isRevealConcealing =
    chartPhase === "exitingReady" && animationDuration > 0;

  const effectiveEnterTransition =
    enterTransition ??
    ({
      ...DEFAULT_CHART_ENTER_TRANSITION,
      duration: animationDuration / 1000
    });

  const revealClipPadding = useMemo(() => {
    if (!composedBarDataKeys?.length) {
      return 0;
    }
    const barWidth = computeSeriesBarWidth({
      columnWidth,
      composedBarGap,
      composedBarSize,
      composedMaxBarSize,
      dataLength: plotData.length,
      innerWidth,
      seriesCount: composedBarDataKeys.length,
      stacked: composedStacked,
    });
    return computeSeriesBarRevealClipPadding({
      barWidth,
      gap: composedBarGap,
      seriesCount: composedBarDataKeys.length,
      stacked: composedStacked,
    });
  }, [
    columnWidth,
    composedBarDataKeys,
    composedBarGap,
    composedBarSize,
    composedMaxBarSize,
    composedStacked,
    innerWidth,
    plotData.length,
  ]);

  return (
    <ReferenceAreaRegistrationContext.Provider value={referenceAreaRegistration}>
      <ChartProvider value={contextValue}>
        <svg aria-hidden="true" height={height} width={width}>
          <defs>
            {defsChildren}
            {useClipReveal ? (
              <ChartRevealClip
                animating={isRevealAnimating || isRevealConcealing}
                clipPathId={clipPathId}
                enterTransition={effectiveEnterTransition}
                height={innerHeight + 20}
                mode={isRevealConcealing ? "conceal" : "reveal"}
                onComplete={
                  isRevealConcealing ? notifyRevealConcealComplete : undefined
                }
                padding={revealClipPadding}
                revealEpoch={isRevealConcealing ? concealEpoch : revealEpoch}
                targetWidth={innerWidth} />
            ) : null}
          </defs>

          <rect fill="transparent" height={height} width={width} x={0} y={0} />

          <g
            {...interactionHandlers}
            style={interactionStyle}
            transform={`translate(${margin.left},${margin.top})`}>
            <rect fill="transparent" height={innerHeight} width={innerWidth} x={0} y={0} />

            {clipExcludedChildren}
            {underlayChildren}
            {useClipReveal ? (
              <g clipPath={`url(#${clipPathId})`}>{preOverlayChildren}</g>
            ) : (
              preOverlayChildren
            )}
            {postOverlayChildren}
          </g>
        </svg>
      </ChartProvider>
    </ReferenceAreaRegistrationContext.Provider>
  );
});
