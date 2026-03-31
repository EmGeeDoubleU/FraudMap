import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

export default function ReportAreaChart({
  data,
  dataKey = 'value',
  xKey = 'year',
  height = 400,
  formatValue,
  annotations = [],
}) {
  return (
    <div className="chart-wrapper" aria-label="Area chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 30, right: 20, bottom: 0, left: 10 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.15} />
              <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            cursor={{ stroke: 'var(--neutral-300)' }}
          />
          {annotations.map((a) => (
            <ReferenceLine
              key={a.x}
              x={a.x}
              stroke="var(--neutral-400)"
              strokeDasharray="4 4"
              label={{
                value: a.label,
                position: 'insideTopRight',
                fontSize: 11,
                fill: 'var(--neutral-500)',
                offset: 8,
              }}
            />
          ))}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            fill="url(#areaFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: CHART_COLORS.primary }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
