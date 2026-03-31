export default function MapControls({ datasets, active, onChange }) {
  return (
    <div className="controls">
      {Object.entries(datasets).map(([key, { label }]) => (
        <button
          key={key}
          className={active === key ? 'active' : ''}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
