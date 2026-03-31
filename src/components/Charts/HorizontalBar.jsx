import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

export default function HorizontalBar({
  data,
  dataKey = 'value',
  nameKey = 'name',
  highlightIndex = -1,
  formatValue,
  height,
  barSize = 28,
  label: showLabel = false,
}) {
  const chartHeight = height || Math.max(300, data.length * (barSize + 16) + 40);

  const renderLabel = showLabel
    ? ({ x, y, width, value }) => (
        <text
          x={x + width + 8}
          y={y + barSize / 2}
          fill="var(--neutral-600)"
          fontSize={12}
          fontFamily="var(--font-mono)"
          dominantBaseline="central"
        >
          {formatValue ? formatValue(value) : value?.toLocaleString()}
        </text>
      )
    : false;

  return (
    <div className="chart-wrapper" aria-label="Horizontal bar chart">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: showLabel ? 80 : 20, bottom: 0, left: 8 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={160}
            tick={{ fontSize: 13, fill: 'var(--neutral-600)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip formatter={formatValue} />}
            cursor={{ fill: 'var(--neutral-100)' }}
          />
          <Bar
            dataKey={dataKey}
            radius={[0, 4, 4, 0]}
            barSize={barSize}
            label={renderLabel}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === highlightIndex ? CHART_COLORS.primaryDark : CHART_COLORS.primary}
                opacity={highlightIndex >= 0 && i !== highlightIndex ? 0.5 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
