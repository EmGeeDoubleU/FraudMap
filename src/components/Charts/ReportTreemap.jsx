import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { CHART_COLORS } from '../../utils/constants';

function TreemapCell({ x, y, width, height: h, name, pct }) {
  if (width < 40 || h < 30) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={h}
        rx={4}
        style={{ fill: CHART_COLORS.primary, stroke: '#fff', strokeWidth: 2 }}
        opacity={0.7 + (pct || 0) / 100 * 0.3}
      />
      {width > 70 && h > 40 && (
        <>
          <text
            x={x + 10}
            y={y + 20}
            fill="#fff"
            fontSize={width > 120 ? 13 : 11}
            fontWeight={600}
          >
            {name?.length > width / 8 ? name.slice(0, Math.floor(width / 8)) + '…' : name}
          </text>
          {h > 55 && (
            <text
              x={x + 10}
              y={y + 38}
              fill="rgba(255,255,255,0.8)"
              fontSize={11}
              fontFamily="var(--font-mono)"
            >
              {pct?.toFixed(1)}%
            </text>
          )}
        </>
      )}
    </g>
  );
}

export default function ReportTreemap({ data, height = 400, formatValue }) {
  const treeData = data.map((d) => ({
    name: d.category || d.name,
    size: d.reports || d.value,
    pct: d.pct,
  }));

  return (
    <div className="chart-wrapper" aria-label="Treemap chart">
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={treeData}
          dataKey="size"
          nameKey="name"
          content={<TreemapCell />}
        >
          <Tooltip content={<ChartTooltip formatter={formatValue} />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
