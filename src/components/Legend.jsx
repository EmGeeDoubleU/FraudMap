import { useMemo } from 'react';

export default function Legend({ data, metric }) {
  const { steps, maxVal } = useMemo(() => {
    const maxVal = Math.max(...data.map(d => d[metric]));
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const topRound = Math.ceil(maxVal / magnitude) * magnitude;

    const steps = [
      { value: Math.round(topRound), label: formatCount(topRound) },
      { value: Math.round(topRound / 4), label: formatCount(topRound / 4) },
      { value: Math.round(topRound / 16), label: formatCount(topRound / 16) },
    ];

    return { steps, maxVal };
  }, [data, metric]);

  return (
    <div className="legend">
      <div className="legend-title">Bubble Size</div>
      <div className="legend-items">
        {steps.map((step, i) => {
          const normalized = Math.sqrt(step.value / maxVal);
          const size = Math.max(6, 4 + normalized * 28);
          return (
            <div key={i} className="legend-item">
              <div
                className="legend-circle"
                style={{
                  width: size,
                  height: size,
                  background: i === 0 ? '#ff4d6a' : i === 1 ? '#ffaa33' : '#00d4aa',
                }}
              />
              <span className="legend-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}
