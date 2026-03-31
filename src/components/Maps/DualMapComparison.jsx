import { useState } from 'react';
import USChoropleth from './USChoropleth';

export default function DualMapComparison({
  stateData,
  leftValueKey = 'reports',
  rightValueKey = 'reports_per_100k',
  leftLabel = 'Total Reports',
  rightLabel = 'Reports per 100K',
  leftFormatFn,
  rightFormatFn,
}) {
  const [activeView, setActiveView] = useState('both');

  return (
    <div className="map-section">
      <div className="map-toggle-group">
        <button
          className={activeView === 'left' ? 'active' : ''}
          onClick={() => setActiveView('left')}
        >
          {leftLabel}
        </button>
        <button
          className={activeView === 'right' ? 'active' : ''}
          onClick={() => setActiveView('right')}
        >
          {rightLabel}
        </button>
      </div>

      <div className="dual-map">
        {(activeView === 'both' || activeView === 'left') && (
          <div className="map-panel">
            <div className="map-panel-label">{leftLabel}</div>
            <USChoropleth
              stateData={stateData}
              valueKey={leftValueKey}
              label={leftLabel.toLowerCase()}
              formatFn={leftFormatFn}
            />
          </div>
        )}
        {(activeView === 'both' || activeView === 'right') && (
          <div className="map-panel">
            <div className="map-panel-label">{rightLabel}</div>
            <USChoropleth
              stateData={stateData}
              valueKey={rightValueKey}
              label={rightLabel.toLowerCase()}
              formatFn={rightFormatFn}
            />
          </div>
        )}
      </div>
    </div>
  );
}
