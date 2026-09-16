import React, { createContext, useContext, useState, useCallback } from "react";

const ChartAiContext = createContext({
  activeChart: null,
  isDrawerOpen: false,
  chartOverrides: {},
  openChartAi: (_chartObj) => {},
  closeChartAi: () => {},
  updateSingleChart: (_chartId, _updatedFields) => {},
  resetSingleChart: (_chartId) => {},
  getEffectiveChart: (chart) => chart,
});

export function ChartAiProvider({ children }) {
  const [activeChart, setActiveChart] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chartOverrides, setChartOverrides] = useState({});

  const openChartAi = useCallback((chartObj) => {
    if (!chartObj) return;
    setActiveChart(chartObj);
    setIsDrawerOpen(true);

    // Smooth scroll target card into view
    const chartId = chartObj.chart_id || chartObj.id || chartObj.title;
    if (chartId) {
      setTimeout(() => {
        const el = document.querySelector(`[data-chart-id="${chartId}"]`) ||
          document.querySelector(`[data-chart-title="${chartObj.title}"]`);
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 120);
    }
  }, []);

  const closeChartAi = useCallback(() => {
    setIsDrawerOpen(false);
    setActiveChart(null);
  }, []);

  const updateSingleChart = useCallback((chartId, updatedFields) => {
    if (!chartId && !updatedFields) return;
    const titleKey = typeof updatedFields?.title === "string" ? updatedFields.title : null;

    setChartOverrides((prev) => {
      const next = { ...prev };

      const applyToKey = (k) => {
        if (!k) return;
        next[k] = {
          ...(next[k] || {}),
          ...updatedFields,
        };
        const normalized = String(k).toLowerCase().replace(/[^a-z0-9]/g, "_");
        next[normalized] = {
          ...(next[normalized] || {}),
          ...updatedFields,
        };
      };

      applyToKey(chartId);
      applyToKey(titleKey);

      if (activeChart?.chart_id) applyToKey(activeChart.chart_id);
      if (activeChart?.title) applyToKey(activeChart.title);

      return next;
    });
  }, [activeChart]);

  const resetSingleChart = useCallback((chartId) => {
    if (!chartId) return;
    setChartOverrides((prev) => {
      const copy = { ...prev };
      delete copy[chartId];
      return copy;
    });
  }, []);

  const getEffectiveChart = useCallback(
    (chart) => {
      if (!chart) return chart;
      const keys = [
        chart.chart_id,
        chart.id,
        chart.title,
        chart.chart_id ? String(chart.chart_id).toLowerCase().replace(/[^a-z0-9]/g, "_") : null,
        chart.title ? String(chart.title).toLowerCase().replace(/[^a-z0-9]/g, "_") : null,
      ].filter(Boolean);

      for (const k of keys) {
        if (chartOverrides[k]) {
          return {
            ...chart,
            ...chartOverrides[k],
          };
        }
      }
      return chart;
    },
    [chartOverrides]
  );

  return (
    <ChartAiContext.Provider
      value={{
        activeChart,
        isDrawerOpen,
        chartOverrides,
        openChartAi,
        closeChartAi,
        updateSingleChart,
        resetSingleChart,
        getEffectiveChart,
      }}
    >
      {children}
    </ChartAiContext.Provider>
  );
}

export function useChartAi() {
  return useContext(ChartAiContext);
}
