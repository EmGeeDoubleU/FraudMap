import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

export default function DivergingBar({
  data,
  dataKey = 'value',
  nameKey = 'name',
  height,
  formatValue,
  baselineLabel = 'Market Growth',
  barSize = 22,
  maxItems = 15,
}) {
  const sliced = data.slice(0, maxItems);
  const chartHeight = height || Math.max(400, sliced.length * (barSize + 12) + 60);

  return (
    <div className="chart-wrapper" aria-label="Diverging bar chart">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sliced}
          layout="vertical"
          margin={{ top: 5, right: 40, bottom: 5, left: 8 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: 'var(--neutral-500)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}pp`}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={180}
            tick={{ fontSize: 12, fill: 'var(--neutral-600)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<ChartTooltip formatter={formatValue} />}
            cursor={{ fill: 'var(--neutral-100)' }}
          />
          <ReferenceLine
            x={0}
            stroke="var(--neutral-400)"
            strokeWidth={1}
            label={{
              value: baselineLabel,
              position: 'top',
              fontSize: 11,
              fill: 'var(--neutral-500)',
            }}
          />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={barSize}>
            {sliced.map((entry, i) => (
              <Cell
                key={i}
                fill={entry[dataKey] >= 0 ? CHART_COLORS.danger : CHART_COLORS.primary}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
