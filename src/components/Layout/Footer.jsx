import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-source">
          Data Source: FTC Consumer Sentinel Network 2024
        </span>
        <span className="footer-brand">
          Built by{' '}
          <a href="https://rulebase.co" target="_blank" rel="noopener noreferrer">
            Rulebase
          </a>
          {' | '}
          <Link to="/methodology">Methodology</Link>
        </span>
      </div>
    </footer>
  );
}
