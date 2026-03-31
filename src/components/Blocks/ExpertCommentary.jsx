export default function ExpertCommentary({ label = 'What this means for fraud teams', children }) {
  return (
    <div className="expert-commentary">
      <div className="expert-commentary-label">{label}</div>
      {children}
    </div>
  );
}
