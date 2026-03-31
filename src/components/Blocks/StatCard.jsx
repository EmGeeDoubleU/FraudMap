export default function StatCard({ value, label, className = '' }) {
  return (
    <div className={`stat-card ${className}`.trim()}>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
