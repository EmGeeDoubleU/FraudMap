import { Link } from 'react-router-dom';

export default function ReportSwitcher() {
  return (
    <div className="switcher-page">
      <div className="switcher-inner">
        <img src="/rulebase-logo.svg" alt="Rulebase" className="switcher-logo" />
        <h1 className="switcher-title">Rulebase Reports</h1>
        <p className="switcher-subtitle">
          Data-driven intelligence for compliance, risk, and operations teams.
        </p>

        <div className="switcher-cards">
          <Link to="/fraud" className="switcher-card">
            <span className="switcher-card-tag">FTC Consumer Sentinel 2024</span>
            <h2 className="switcher-card-title">
              State of Fraud<br />in the U.S.
            </h2>
            <p className="switcher-card-desc">
              An analysis of 2.6M consumer reports covering fraud types, payment methods,
              demographics, and geographic patterns.
            </p>
            <span className="switcher-card-cta">View Report &rarr;</span>
          </Link>

          <Link to="/complaints" className="switcher-card">
            <span className="switcher-card-tag">CFPB Consumer Response 2025</span>
            <h2 className="switcher-card-title">
              State of Consumer<br />Complaints
            </h2>
            <p className="switcher-card-desc">
              An analysis of 6.6M complaints covering credit reporting, money transfers,
              scam liability, and furnisher accountability.
            </p>
            <span className="switcher-card-cta">View Report &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
