export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      {label && <div className="chart-tooltip-label">{label}</div>}
      {payload.map((entry, i) => (
        <div className="chart-tooltip-row" key={i}>
          <span className="chart-tooltip-key">{entry.name || entry.dataKey}</span>
          <span className="chart-tooltip-value">
            {formatter ? formatter(entry.value, entry) : entry.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
