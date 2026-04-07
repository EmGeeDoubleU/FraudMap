import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

const SEGMENT_COLORS = {
  monetary: CHART_COLORS.success,
  non_monetary: CHART_COLORS.primary,
  explanation: CHART_COLORS.muted,
  admin: '#c4c4c4',
};

export default function StackedBar({
  data,
  height = 320,
  highlightProduct,
  segments = ['monetary_pct', 'non_monetary_pct', 'explanation_pct', 'admin_pct'],
  segmentLabels = ['Monetary relief', 'Non-monetary relief', 'Explanation only', 'Administrative'],
  segmentColors = [SEGMENT_COLORS.monetary, SEGMENT_COLORS.non_monetary, SEGMENT_COLORS.explanation, SEGMENT_COLORS.admin],
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 40, bottom: 8, left: 0 }}>
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <YAxis
          type="category"
          dataKey="product"
          width={180}
          tick={{ fontSize: 13 }}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(value, name) => {
                const idx = segments.indexOf(name);
                const label = idx >= 0 ? segmentLabels[idx] : name;
                return [`${value}%`, label];
              }}
            />
          }
        />
        <Legend
          formatter={(value) => {
            const idx = segments.indexOf(value);
            return idx >= 0 ? segmentLabels[idx] : value;
          }}
        />
        {segments.map((seg, i) => (
          <Bar
            key={seg}
            dataKey={seg}
            stackId="stack"
            fill={segmentColors[i]}
            radius={i === segments.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
          >
            {data.map((entry, j) => (
              <Cell
                key={j}
                fillOpacity={highlightProduct && entry.product !== highlightProduct ? 0.4 : 1}
              />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
