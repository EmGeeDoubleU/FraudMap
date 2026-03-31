export default function GeoInsightCard({ type, data }) {
  if (type === 'versus') {
    return (
      <div className="geo-card geo-card--versus">
        <div className="geo-card__tag">{data.tag}</div>
        <h3 className="geo-card__finding">{data.finding}</h3>
        <div className="geo-card__matchup">
          <div className="geo-card__contestant geo-card__contestant--lead">
            <span className="geo-card__state-name">{data.left.name}</span>
            <span className="geo-card__stat">{data.left.value}</span>
            <span className="geo-card__stat-label">{data.label}</span>
          </div>
          <span className="geo-card__vs">vs</span>
          <div className="geo-card__contestant">
            <span className="geo-card__state-name">{data.right.name}</span>
            <span className="geo-card__stat">{data.right.value}</span>
            <span className="geo-card__stat-label">{data.label}</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'rank-shift') {
    return (
      <div className="geo-card geo-card--shift">
        <div className="geo-card__tag">{data.tag}</div>
        <h3 className="geo-card__finding">{data.finding}</h3>
        <div className="geo-card__ranks">
          <div className="geo-card__rank-badge geo-card__rank-badge--before">
            <span className="geo-card__rank-num">#{data.rankBefore}</span>
            <span className="geo-card__rank-label">Raw</span>
          </div>
          <div className="geo-card__rank-arrow">
            <svg width="48" height="16" viewBox="0 0 48 16" fill="none">
              <path d="M0 8h40m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="geo-card__rank-badge geo-card__rank-badge--after">
            <span className="geo-card__rank-num">#{data.rankAfter}</span>
            <span className="geo-card__rank-label">Per Capita</span>
          </div>
        </div>
        <p className="geo-card__detail">{data.detail}</p>
      </div>
    );
  }

  if (type === 'multi-state') {
    return (
      <div className="geo-card geo-card--multi">
        <div className="geo-card__tag">{data.tag}</div>
        <h3 className="geo-card__finding">{data.finding}</h3>
        <div className="geo-card__state-list">
          {data.states.map((s) => (
            <div className="geo-card__state-row" key={s.name}>
              <span className="geo-card__state-name">{s.name}</span>
              <span className="geo-card__state-shift">
                #{s.rawRank} <span className="geo-card__shift-arrow">→</span> #{s.pcRank}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
