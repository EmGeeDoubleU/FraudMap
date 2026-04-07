import { useEffect, useMemo, useRef } from 'react';
import { useData } from '../../hooks/useData';
import StatCard from '../../components/Blocks/StatCard';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import Callout from '../../components/Blocks/Callout';
import ExpertCommentary from '../../components/Blocks/ExpertCommentary';
import HorizontalBar from '../../components/Charts/HorizontalBar';
import ReportAreaChart from '../../components/Charts/ReportAreaChart';
import DonutChart from '../../components/Charts/DonutChart';
import DivergingBar from '../../components/Charts/DivergingBar';
import generatePDF from '../../utils/generatePDF';
import { formatNumber, formatPercent, formatCurrency } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';

export default function ComplaintsPrintReport({ onDone }) {
  const containerRef = useRef(null);

  const { data: overview } = useData('complaints/overview.json');
  const { data: creditReporting } = useData('complaints/credit_reporting.json');
  const { data: moneyTransfer } = useData('complaints/money_transfer.json');
  const { data: checking } = useData('complaints/checking_savings.json');
  const { data: outcomes } = useData('complaints/response_outcomes.json');
  const { data: geography } = useData('complaints/geography.json');
  const { data: gaming } = useData('complaints/system_gaming.json');
  const { data: regulatory } = useData('complaints/regulatory_context.json');

  const allLoaded = overview && creditReporting && moneyTransfer && checking &&
    outcomes && geography && gaming && regulatory;

  useEffect(() => {
    if (!allLoaded || !containerRef.current) return;
    const timer = setTimeout(() => {
      generatePDF(containerRef.current).then(() => onDone?.());
    }, 2000);
    return () => clearTimeout(timer);
  }, [allLoaded, onDone]);

  const trendData = useMemo(() => {
    if (!overview?.year_over_year) return [];
    return overview.year_over_year.map((d) => ({ year: d.year, value: d.complaints }));
  }, [overview]);

  const productData = useMemo(() => {
    if (!overview?.product_breakdown) return [];
    return overview.product_breakdown.map((p) => ({ name: p.product, value: p.pct_of_total }));
  }, [overview]);

  const growthData = useMemo(() => {
    if (!moneyTransfer?.growth_vs_prior_2yr_avg) return [];
    const g = moneyTransfer.growth_vs_prior_2yr_avg;
    return [
      { name: 'Other transaction problem', value: g.other_transaction_problem_issue_pct },
      { name: 'Domestic money transfer', value: g.domestic_money_transfer_pct },
      { name: 'Mobile / digital wallet', value: g.mobile_digital_wallet_pct },
      { name: 'Virtual currency', value: g.virtual_currency_pct },
    ].sort((a, b) => b.value - a.value);
  }, [moneyTransfer]);

  const crOutcome = outcomes?.by_product?.find(
    (p) => p.product === 'Credit or consumer reporting'
  );

  const donutData = useMemo(() => {
    if (!crOutcome) return [];
    return [
      { name: 'Explanation only', value: crOutcome.explanation_pct },
      { name: 'Non-monetary relief', value: crOutcome.non_monetary_pct },
      { name: 'Administrative', value: crOutcome.admin_pct },
      { name: 'Monetary relief', value: crOutcome.monetary_pct },
    ];
  }, [crOutcome]);

  const issueGrowthData = useMemo(() => {
    if (!creditReporting?.growth_vs_prior_2yr_avg) return [];
    const g = creditReporting.growth_vs_prior_2yr_avg;
    return [
      { name: 'Incorrect information', value: g.incorrect_information_issue_pct },
      { name: 'Credit reporting overall', value: g.credit_reporting_complaints_pct },
      { name: 'Other personal reports', value: g.other_personal_consumer_reports_pct },
    ].sort((a, b) => b.value - a.value);
  }, [creditReporting]);

  return (
    <div className="pdf-render-container" ref={containerRef}>
      <div className="pdf-cover">
        <img src="/rulebase-logo.svg" alt="Rulebase" className="pdf-cover-logo" />
        <h1 className="pdf-cover-title">
          State of Consumer<br />Complaints
        </h1>
        <p className="pdf-cover-subtitle">
          An analysis of 6.6M complaints from the<br />
          CFPB Consumer Response database in 2025
        </p>
      </div>

      {allLoaded && (
        <>
          {/* Executive Summary */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">00 — Executive Summary</span>
            <div className="stat-cards pdf-stat-cards">
              <StatCard value={formatNumber(overview.total_complaints_2025, { compact: true })} label="Complaints in 2025" />
              <StatCard value={`${overview.growth_metrics.yoy_change_2024_to_2025}%`} label="Year-over-year growth" />
              <StatCard value={`${overview.product_breakdown[0].pct_of_total}%`} label="Credit reporting share" />
              <StatCard value="40%" label="Required corrections" />
              <StatCard value="94%" label="Money transfer denials" />
            </div>
          </div>

          {/* Act 1: The Flood */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">01 — The Flood</span>
            <InsightHeadline primary="Complaints doubled." secondary="Headcount didn't." />
            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Complaint Volume: 2019 to 2025</h3>
                <p className="chart-subtitle">Total complaints received by CFPB</p>
                <ReportAreaChart data={trendData} xKey="year" dataKey="value"
                  formatValue={(v) => formatNumber(v, { compact: true })}
                  annotations={[{ x: 2023, label: 'Doubling begins' }]} height={300} />
              </div>
            </div>
            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Complaints by Product</h3>
                <p className="chart-subtitle">Credit reporting dominates at 88%</p>
                <HorizontalBar data={productData} highlightIndex={0}
                  formatValue={(v) => formatPercent(v)} label />
              </div>
            </div>
          </div>

          {/* Act 2: The Denials */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">02 — The Denials</span>
            <InsightHeadline primary="94% of money transfer claims denied." secondary="Regulators are watching." />
            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Money Transfer Growth Rates</h3>
                <p className="chart-subtitle">% increase vs prior 2-year average</p>
                <HorizontalBar data={growthData} highlightIndex={0}
                  formatValue={(v) => `+${v.toLocaleString()}%`} label />
              </div>
            </div>
            <div className="print-avoid-break">
              <Callout variant="warning" headline='The "Authorized" Defense'>
                <p>Banks deny scam-induced transfer claims citing consumer authorization via PIN, text confirmation, and active participation.</p>
                <p style={{ marginTop: 8 }}>
                  CFPB sued Zelle operators ({regulatory.cfpb_enforcement_actions.zelle_lawsuit.date}).
                  Ordered Cash App to pay {formatCurrency(regulatory.cfpb_enforcement_actions.cash_app_order.penalty_total)}.
                </p>
              </Callout>
            </div>
          </div>

          {/* Act 3: The Corrections */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">03 — The Corrections</span>
            <InsightHeadline primary="40% require corrections." secondary="That's not consumer error." />
            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Credit Reporting Response Outcomes</h3>
                <DonutChart data={donutData} highlightIndex={1}
                  colors={[CHART_COLORS.muted, CHART_COLORS.primary, '#c4c4c4', CHART_COLORS.success]} height={280} />
              </div>
            </div>
            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Issue Growth Rates</h3>
                <p className="chart-subtitle">% increase vs prior 2-year average</p>
                <DivergingBar data={issueGrowthData} formatValue={(v) => `+${v}%`}
                  baselineLabel="Prior 2-year avg" />
              </div>
            </div>
            <div className="print-avoid-break">
              <Callout variant="info" headline="The Furnisher Problem">
                <p>
                  {formatPercent(creditReporting.ncra_specific.pct_of_all_complaints)} of all complaints target the Big Three CRAs.
                  {formatNumber(creditReporting.ncra_specific.complaints_about_big_three, { compact: true })} complaints. 40% result in corrections.
                </p>
              </Callout>
            </div>
          </div>

          {/* Methodology */}
          <div className="pdf-page-break" />
          <div className="pdf-section methodology-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">04 — Methodology</span>
            <h2 style={{ marginBottom: 12, paddingTop: 0 }}>Methodology</h2>
            <h3>Data Source</h3>
            <p>CFPB Consumer Response Annual Report 2025, published March 2026. Data period: January 1 - December 31, 2025.</p>
            <h3>Limitations</h3>
            <ul>
              <li>Based on unverified consumer reports.</li>
              <li>Complaint volume affected by credit repair orgs, AI agents, finfluencers.</li>
              <li>Not a statistical sample of consumer experiences.</li>
            </ul>
            <div className="pdf-final-footer">
              <p>Data Source: CFPB Consumer Response Annual Report 2025 | Built by Rulebase</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
