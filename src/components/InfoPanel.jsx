export default function InfoPanel({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="info-panel">
      <button className="info-panel-close" onClick={onClose}>
        &times;
      </button>
      <div className="info-panel-name">{item.name}</div>
      <div className="info-panel-rank">Rank #{item.rank} nationally</div>
      <div className="info-panel-grid">
        <div className="info-panel-stat">
          <div className="info-panel-stat-label">Reports</div>
          <div className="info-panel-stat-value accent">
            {item.reports.toLocaleString()}
          </div>
        </div>
        <div className="info-panel-stat">
          <div className="info-panel-stat-label">Per 100K Pop</div>
          <div className="info-panel-stat-value">
            {item.perCapita.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
