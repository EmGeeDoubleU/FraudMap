import { useNavigate } from 'react-router-dom';

export default function NextSection({ label, to }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="next-section"
      onClick={handleClick}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      <span className="next-section-label">Continue: {label}</span>
      <span className="next-section-arrow">↓</span>
    </div>
  );
}
