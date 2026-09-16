import { HeatmapChart } from "../../components/charts/heatmap/heatmap-chart";
import { HeatmapCells } from "../../components/charts/heatmap/heatmap-cells";
import { HeatmapSeparator } from "../../components/charts/heatmap/heatmap-separator";
import { HeatmapXAxis } from "../../components/charts/heatmap/heatmap-x-axis";
import { HeatmapYAxis } from "../../components/charts/heatmap/heatmap-y-axis";
import { HeatmapTooltip } from "../../components/charts/heatmap/heatmap-tooltip";
import { HeatmapLegend } from "../../components/charts/heatmap/heatmap-legend";
import type { HeatmapColumn } from "../../components/charts/heatmap/heatmap-context";
import type { HeatmapWeek } from "../../data/types.js";

/**
 * bklit "Contributions" heatmap — replicates the reference exactly:
 * circular cells, quarter separators, single-letter day labels, calendar
 * x-axis, synced-hover legend. Colours come from --chart-scale-01…05.
 */
export function BrandImpactHeatmap({ data = [] }: { data?: HeatmapWeek[] }) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const columns: HeatmapColumn[] = data.map((week, col) => ({
    bin: col,
    bins: (week?.scores || []).map((count, day) => {
      const d = new Date(week.weekStart);
      d.setDate(d.getDate() + day);
      return { bin: day, count, date: d };
    }),
  }));

  return (
    <div className="w-full">
      <HeatmapChart
        data={columns}
        gap={3}
        layout="fluid"
        margin={{ top: 56, right: 12, bottom: 0, left: 44 }}
      >
        <HeatmapCells
          cornerRadius={999}
          inactiveOpacity={0.8}
          inactiveScale={0.94}
        />
        <HeatmapSeparator
          groupBy="quarter"
          showLabels
          labelClassName="text-[var(--chart-3)]"
          spacing={12}
          startOffset={14}
          strokeOpacity={0.6}
        />
        <HeatmapXAxis />
        <HeatmapYAxis tickFilter="all" labelFormat="initial" />
        <HeatmapTooltip />
      </HeatmapChart>

      <div className="mt-5">
        <HeatmapLegend
          align="center"
          cornerRadius={999}
          gap={3}
          inactiveOpacity={0.8}
          inactiveScale={0.94}
        />
      </div>
    </div>
  );
}
