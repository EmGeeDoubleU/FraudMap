import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, GeoJSON } from 'react-leaflet';
import { US_STATES_GEOJSON_URL } from '../../utils/constants';

const BOUNDS = [
  [22.0, -128.0],
  [51.0, -64.0],
];

const COLOR_SCALE = [
  '#f7faff', '#e5f0ff', '#b2d2ff', '#85bbff', '#4d97ff', '#006aff', '#002a66',
];

function getColor(value, min, max) {
  if (value == null) return '#f3f2f2';
  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const idx = Math.min(COLOR_SCALE.length - 1, Math.floor(ratio * COLOR_SCALE.length));
  return COLOR_SCALE[idx];
}

export default function USChoropleth({
  stateData,
  valueKey = 'reports',
  label = 'Reports',
  formatFn,
  height = 420,
}) {
  const [geoJson, setGeoJson] = useState(null);
  const geoRef = useRef(null);

  useEffect(() => {
    fetch(US_STATES_GEOJSON_URL)
      .then((r) => r.json())
      .then(setGeoJson)
      .catch(console.error);
  }, []);

  const lookup = useMemo(() => {
    if (!stateData) return {};
    const map = {};
    const list = Array.isArray(stateData) ? stateData : stateData.states || [];
    list.forEach((s) => {
      const key = (s.state || s.name || '').toLowerCase();
      map[key] = s;
    });
    return map;
  }, [stateData]);

  const { min, max } = useMemo(() => {
    const list = Array.isArray(stateData) ? stateData : stateData?.states || [];
    const vals = list.map((s) => s[valueKey]).filter((v) => v != null);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [stateData, valueKey]);

  const style = (feature) => {
    const name = feature.properties.name?.toLowerCase();
    const state = lookup[name];
    const val = state?.[valueKey];
    return {
      fillColor: getColor(val, min, max),
      fillOpacity: 0.85,
      weight: 1,
      color: '#edecec',
    };
  };

  const onEachFeature = (feature, layer) => {
    const name = feature.properties.name;
    const state = lookup[name?.toLowerCase()];
    if (!state) return;

    const val = state[valueKey];
    const formatted = formatFn ? formatFn(val) : val?.toLocaleString();

    layer.bindTooltip(
      `<div style="font-family:var(--font-sans);font-size:13px">
        <strong>${name}</strong><br/>
        <span style="font-family:var(--font-mono)">${formatted}</span> ${label}
      </div>`,
      { sticky: true, className: 'map-state-tooltip' }
    );

    layer.on({
      mouseover: (e) => {
        e.target.setStyle({ weight: 2, color: '#006aff', fillOpacity: 0.95 });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        geoRef.current?.resetStyle(e.target);
      },
    });
  };

  if (!geoJson) {
    return <div className="map-container" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-500)' }}>Loading map...</div>;
  }

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        bounds={BOUNDS}
        boundsOptions={{ padding: [20, 20] }}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <GeoJSON
          ref={geoRef}
          data={geoJson}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
}
