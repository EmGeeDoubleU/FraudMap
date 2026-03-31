import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const US_CENTER = [39.8, -98.5];
const DEFAULT_ZOOM = 4;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Zoom thresholds for layered visibility
const ZOOM_SHOW_TOP = 3;      // zoom 3-4: top ~50 metros only
const ZOOM_SHOW_MID = 5;      // zoom 5-6: top ~150
const ZOOM_SHOW_ALL = 7;      // zoom 7+: all 401
const ZOOM_SHOW_LABELS = 7;   // zoom 7+: show city name labels

function getVisibleCount(zoom) {
  if (zoom <= ZOOM_SHOW_TOP) return 50;
  if (zoom <= ZOOM_SHOW_MID) return 150;
  if (zoom < ZOOM_SHOW_ALL) return 300;
  return Infinity;
}

function getColor(ratio) {
  if (ratio < 0.5) {
    const t = ratio * 2;
    const r = Math.round(0 + t * 255);
    const g = Math.round(212 - t * 42);
    const b = Math.round(170 - t * 118);
    return `rgb(${r},${g},${b})`;
  }
  const t = (ratio - 0.5) * 2;
  const r = 255;
  const g = Math.round(170 - t * 93);
  const b = Math.round(52 + t * 54);
  return `rgb(${r},${g},${b})`;
}

function getRadius(value, maxValue, zoom) {
  const normalized = Math.sqrt(value / maxValue);
  const baseSize = 3 + normalized * 30;
  const zoomScale = Math.pow(1.25, zoom - DEFAULT_ZOOM);
  return Math.max(2, baseSize * zoomScale);
}

function shortName(name) {
  const comma = name.indexOf(',');
  if (comma === -1) return name;
  const city = name.substring(0, comma);
  const dash = city.indexOf('-');
  return dash === -1 ? city : city.substring(0, dash);
}

function ZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });
  return null;
}

function ViewportFilter({ data, metric, zoom, onFiltered }) {
  const map = useMap();

  useEffect(() => {
    function update() {
      const bounds = map.getBounds();
      const maxVisible = getVisibleCount(zoom);

      const sorted = [...data].sort((a, b) => b[metric] - a[metric]);
      const ranked = sorted.map((item, i) => ({ ...item, _sortRank: i }));

      const visible = ranked.filter(item => {
        if (item._sortRank >= maxVisible) return false;
        if (zoom >= ZOOM_SHOW_ALL) {
          return bounds.contains([item.lat, item.lng]);
        }
        return true;
      });

      onFiltered(visible);
    }

    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => {
      map.off('moveend', update);
      map.off('zoomend', update);
    };
  }, [map, data, metric, zoom, onFiltered]);

  return null;
}

function Bubbles({ items, metric, zoom, maxValue, onHover, onSelect }) {
  const showLabels = zoom >= ZOOM_SHOW_LABELS;

  const sorted = useMemo(
    () => [...items].sort((a, b) => b[metric] - a[metric]),
    [items, metric]
  );

  return sorted.map((item) => {
    const value = item[metric];
    const ratio = value / maxValue;
    const radius = getRadius(value, maxValue, zoom);
    const color = getColor(Math.pow(ratio, 0.6));

    return (
      <CircleMarker
        key={`${item.name}-${item.lat}`}
        center={[item.lat, item.lng]}
        radius={radius}
        pathOptions={{
          fillColor: color,
          fillOpacity: 0.55,
          color: color,
          weight: 1,
          opacity: 0.8,
        }}
        eventHandlers={{
          mouseover: (e) => {
            e.target.setStyle({ fillOpacity: 0.85, weight: 2, opacity: 1 });
            onHover(item, e);
          },
          mouseout: (e) => {
            e.target.setStyle({ fillOpacity: 0.55, weight: 1, opacity: 0.8 });
            onHover(null, e);
          },
          click: () => onSelect(item),
        }}
      >
        {showLabels && (
          <Tooltip
            direction="top"
            offset={[0, -radius]}
            permanent
            className="bubble-label"
          >
            {shortName(item.name)}
          </Tooltip>
        )}
      </CircleMarker>
    );
  });
}

export default function FraudMap({ data, metric, onSelect }) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tooltip, setTooltip] = useState({ visible: false, item: null, x: 0, y: 0 });
  const [visibleItems, setVisibleItems] = useState([]);
  const containerRef = useRef(null);

  const maxValue = useMemo(
    () => Math.max(...data.map(d => d[metric])),
    [data, metric]
  );

  const handleFiltered = useCallback((items) => {
    setVisibleItems(items);
  }, []);

  const handleHover = useCallback((item, e) => {
    if (!item) {
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }
    const point = e.target._map.latLngToContainerPoint([item.lat, item.lng]);
    setTooltip({ visible: true, item, x: point.x, y: point.y });
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={US_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={3}
        maxZoom={12}
        zoomControl={true}
        style={{ width: '100%', height: '100%' }}
        maxBounds={[[10, -180], [72, -50]]}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <ZoomTracker onZoomChange={setZoom} />
        <ViewportFilter
          data={data}
          metric={metric}
          zoom={zoom}
          onFiltered={handleFiltered}
        />
        <Bubbles
          items={visibleItems}
          metric={metric}
          zoom={zoom}
          maxValue={maxValue}
          onHover={handleHover}
          onSelect={onSelect}
        />
      </MapContainer>

      {/* Zoom level indicator */}
      <div className="zoom-indicator">
        <span className="zoom-indicator-label">
          {zoom < ZOOM_SHOW_ALL
            ? `Showing top ${getVisibleCount(zoom)} metros`
            : `All ${visibleItems.length} metros in view`}
        </span>
        {zoom < ZOOM_SHOW_ALL && (
          <span className="zoom-indicator-hint">Zoom in for more</span>
        )}
      </div>

      <div
        className={`map-tooltip ${tooltip.visible ? 'visible' : ''}`}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        {tooltip.item && (
          <>
            <div className="tooltip-name">{tooltip.item.name}</div>
            <div className="tooltip-rank">Rank #{tooltip.item.rank}</div>
            <div className="tooltip-stats">
              <div className="tooltip-stat">
                <span className="tooltip-stat-label">Reports</span>
                <span className="tooltip-stat-value">
                  {tooltip.item.reports.toLocaleString()}
                </span>
              </div>
              <div className="tooltip-stat">
                <span className="tooltip-stat-label">Per 100K</span>
                <span className="tooltip-stat-value">
                  {tooltip.item.perCapita.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
