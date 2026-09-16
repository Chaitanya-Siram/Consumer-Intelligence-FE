import { DynamicChartRenderer } from './CustomChartWidgets.jsx';

export default function AgentChart({ chart, height = 280 }) {
  if (!chart) return null;
  return <DynamicChartRenderer chart={chart} height={height} />;
}
