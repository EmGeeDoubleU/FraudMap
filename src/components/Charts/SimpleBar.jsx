import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

export default function SimpleBar({
  data,
  dataKey = 'value',
  xKey = 'name',
  height = 360,
  formatValue,
  color = CHART_COLORS.primary,
  barSize = 32,
}) {
  return (
    <div className="chart-wrapper" aria-label="Bar chart">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => {
              if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
              if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
              return v;
            }}
          />
          <Tooltip
            content={<ChartTooltip formatter={formatValue} />}
            cursor={{ fill: 'var(--neutral-100)' }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} barSize={barSize}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
