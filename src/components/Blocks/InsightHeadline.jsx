export default function InsightHeadline({ primary, secondary }) {
  return (
    <div className="insight-headline">
      <h2 className="insight-headline-primary">{primary}</h2>
      {secondary && (
        <p className="insight-headline-secondary">{secondary}</p>
      )}
    </div>
  );
}
