import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

const DEFAULT_COLORS = [
  CHART_COLORS.muted,
  CHART_COLORS.primary,
  '#c4c4c4',
  CHART_COLORS.primaryLight,
];

export default function DonutChart({
  data,
  height = 320,
  colors = DEFAULT_COLORS,
  highlightIndex = -1,
  innerRadius = 70,
  outerRadius = 120,
}) {
  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={colors[i % colors.length]}
                fillOpacity={highlightIndex >= 0 && i !== highlightIndex ? 0.35 : 1}
                stroke={i === highlightIndex ? colors[i % colors.length] : 'none'}
                strokeWidth={i === highlightIndex ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                formatter={(value, name) => [`${value}%`, name]}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-legend">
        {data.map((d, i) => (
          <div key={d.name} className="donut-legend-item">
            <span
              className="donut-legend-swatch"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="donut-legend-label">{d.name}</span>
            <span className="donut-legend-value">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
