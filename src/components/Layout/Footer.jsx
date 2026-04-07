import { Link } from 'react-router-dom';

const SOURCES = {
  fraud: 'Data Source: FTC Consumer Sentinel Network 2024',
  complaints: 'Data Source: CFPB Consumer Response Annual Report 2025',
};

export default function Footer({ reportKey = 'fraud' }) {
  const methodologyPath = reportKey === 'complaints'
    ? '/complaints/methodology'
    : '/fraud/methodology';

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-source">
          {SOURCES[reportKey] || SOURCES.fraud}
        </span>
        <span className="footer-brand">
          Built by{' '}
          <a href="https://rulebase.co" target="_blank" rel="noopener noreferrer">
            Rulebase
          </a>
          {' | '}
          <Link to={methodologyPath}>Methodology</Link>
        </span>
      </div>
    </footer>
  );
}
