import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useData } from '../hooks/useData';
import StatCard from '../components/Blocks/StatCard';
import InsightHeadline from '../components/Blocks/InsightHeadline';
import Callout from '../components/Blocks/Callout';
import ExpertCommentary from '../components/Blocks/ExpertCommentary';
import GeoInsightCard from '../components/Blocks/GeoInsightCard';
import HorizontalBar from '../components/Charts/HorizontalBar';
import ReportTreemap from '../components/Charts/ReportTreemap';
import DivergingBar from '../components/Charts/DivergingBar';
import SimpleBar from '../components/Charts/SimpleBar';
import ReportAreaChart from '../components/Charts/ReportAreaChart';
import DualMapComparison from '../components/Maps/DualMapComparison';
import generatePDF from '../utils/generatePDF';
import { formatCurrency, formatPercent, formatNumber, formatMultiplier } from '../utils/formatters';

export function useReportDownload() {
  const [downloading, setDownloading] = useState(false);

  const trigger = useCallback(() => {
    setDownloading(true);
  }, []);

  const onDone = useCallback(() => {
    setDownloading(false);
  }, []);

  return { downloading, trigger, onDone };
}

export default function PrintReport({ onDone }) {
  const containerRef = useRef(null);

  const { data: derived } = useData('derived_metrics.json');
  const { data: unreported } = useData('report_enhancements/unreported_multiplier.json');
  const { data: contact } = useData('contact_methods.json');
  const { data: overview } = useData('overview.json');
  const { data: pigData } = useData('report_enhancements/pig_butchering_explainer.json');
  const { data: fraudTypes } = useData('fraud_types.json');
  const { data: growth } = useData('category_relative_growth.json');
  const { data: payment } = useData('loss_payment.json');
  const { data: distribution } = useData('loss_distribution.json');
  const { data: domain } = useData('report_enhancements/domain_perspective.json');
  const { data: demographics } = useData('demographics_age.json');
  const { data: geoData } = useData('geography_state_per_capita.json');
  const { data: perCapitaInsights } = useData('report_enhancements/per_capita_insights.json');
  const { data: trends } = useData('trends.json');
  const { data: outlook } = useData('report_enhancements/forward_outlook.json');

  const allLoaded = derived && unreported && contact && overview && pigData &&
    fraudTypes && growth && payment && distribution && domain && demographics &&
    geoData && perCapitaInsights && trends && outlook;

  useEffect(() => {
    if (!allLoaded || !containerRef.current) return;

    const timer = setTimeout(() => {
      generatePDF(containerRef.current).then(() => {
        onDone?.();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [allLoaded, onDone]);

  const headlines = derived?.headlines;
  const severity = derived?.severity;
  const socialMedia = contact?.methods?.find((m) => m.contact_method === 'Social Media');
  const email = contact?.methods?.find((m) => m.contact_method === 'Email');
  const reported = headlines?.total_loss;
  const estimated = unreported?.insight?.estimated_actual_high;
  const barRatio = reported && estimated ? Math.round((reported / estimated) * 100) : 0;

  const conversionData = useMemo(() => {
    if (!contact?.methods) return [];
    return [...contact.methods]
      .sort((a, b) => b.pct_with_loss - a.pct_with_loss)
      .map((m) => ({ name: m.contact_method, value: m.pct_with_loss, totalLoss: m.total_loss }));
  }, [contact]);

  const lossData = useMemo(() => {
    if (!contact?.methods) return [];
    return [...contact.methods]
      .sort((a, b) => b.total_loss - a.total_loss)
      .map((m) => ({ name: m.contact_method, value: m.total_loss }));
  }, [contact]);

  const growthData = useMemo(() => {
    if (!growth?.categories) return [];
    return [...growth.categories]
      .sort((a, b) => b.relative_growth_pct - a.relative_growth_pct)
      .map((c) => ({ name: c.category, value: c.relative_growth_pct }));
  }, [growth]);

  const severityData = useMemo(() => {
    if (!payment) return [];
    return [...payment]
      .sort((a, b) => b.avg_loss_per_report - a.avg_loss_per_report)
      .map((m) => ({ name: m.method, value: m.avg_loss_per_report, totalLoss: m.total_loss, reports: m.reports }));
  }, [payment]);

  const distData = useMemo(() => {
    if (!distribution?.broad) return [];
    return distribution.broad.map((d) => ({ name: d.range, value: d.reports }));
  }, [distribution]);

  const lossPerReport = useMemo(() => {
    if (!demographics) return [];
    return demographics.map((d) => ({ name: d.age_group, value: d.loss_per_report }));
  }, [demographics]);

  const reportVolume = useMemo(() => {
    if (!demographics) return [];
    return demographics.map((d) => ({ name: d.age_group, value: d.reports }));
  }, [demographics]);

  const trendData = useMemo(() => {
    if (!trends?.yearly_totals) return [];
    return trends.yearly_totals.map((d) => ({ year: d.year, value: d.reports }));
  }, [trends]);

  const states = geoData?.states;
  const top10Raw = useMemo(() => {
    if (!states) return [];
    return [...states].sort((a, b) => a.rank_by_reports - b.rank_by_reports).slice(0, 10);
  }, [states]);

  const bankTransfer = payment?.find((m) => m.method === 'Bank Transfer or Payment');
  const debitCard = payment?.find((m) => m.method === 'Debit Card');
  const severityRatio = bankTransfer && debitCard
    ? Math.round(bankTransfer.avg_loss_per_report / debitCard.avg_loss_per_report) : null;

  const seniors = demographics?.find((d) => d.age_group === '80 and Over');
  const youngest = demographics?.find((d) => d.age_group === '19 and Under');
  const medianRatio = seniors && youngest && youngest.median_loss > 0
    ? (seniors.median_loss / youngest.median_loss).toFixed(1) : null;

  const s0 = perCapitaInsights?.surprises?.[0];
  const s1 = perCapitaInsights?.surprises?.[1];
  const s2 = perCapitaInsights?.surprises?.[2];
  const s3 = perCapitaInsights?.surprises?.[3];

  const cagr = derived?.headlines?.cagr;

  return (
    <div className="pdf-render-container" ref={containerRef}>
      {/* ── Cover Page ── */}
      <div className="pdf-cover">
        <img src="/rulebase-logo.svg" alt="Rulebase" className="pdf-cover-logo" />
        <h1 className="pdf-cover-title">
          State of Fraud<br />in the U.S.
        </h1>
        <p className="pdf-cover-subtitle">
          An analysis of 2.6M consumer reports from the<br />
          FTC Consumer Sentinel Network in 2024
        </p>
      </div>

      {allLoaded && (
        <>
          {/* ── Section 00: Executive Summary ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">00 — Executive Summary</span>

            <div className="iceberg-block">
              <div className="iceberg-numbers">
                <div className="iceberg-reported">
                  <span className="iceberg-value">{formatCurrency(reported)}</span>
                  <span className="iceberg-label">reported</span>
                </div>
                <div className="iceberg-separator">of an estimated</div>
                <div className="iceberg-estimated">
                  <span className="iceberg-value">{formatCurrency(estimated)}+</span>
                  <span className="iceberg-label">in actual losses</span>
                </div>
              </div>
              <div className="iceberg-bar-track">
                <div className="iceberg-bar-fill" style={{ width: `${barRatio}%` }} />
                <span className="iceberg-bar-label">{barRatio}% visible</span>
              </div>
              <p className="iceberg-footnote">
                Source: FTC estimates based on survey data comparing victimization rates to formal complaint filings.
              </p>
            </div>

            <div className="supporting-context">
              <p>
                In 2024, the FTC Consumer Sentinel Network recorded its highest-ever annual total: 6.5 million
                consumer reports encompassing fraud, identity theft, and other complaints. Only 38% of fraud
                reports included a dollar loss, meaning the $12.5 billion figure almost certainly understates
                the true cost.
              </p>
            </div>

            <div className="stat-cards pdf-stat-cards">
              <StatCard value={formatCurrency(headlines.total_loss)} label="Reported losses" />
              <StatCard
                value={`${socialMedia.pct_with_loss}%`}
                label={`Social media conversion vs ${email.pct_with_loss}% email`}
              />
              <StatCard
                value={formatCurrency(severity.highest_avg_loss_payment_method.avg_loss, { compact: false, decimals: 0 })}
                label={`Avg bank transfer loss, ${formatMultiplier(severity.highest_avg_loss_payment_method.avg_loss / (overview?.avg_loss_per_report || 1))} the overall avg`}
              />
              <StatCard
                value={formatCurrency(severity.highest_loss_per_report_age_group.loss_per_report, { compact: false, decimals: 0 })}
                label="Avg loss per report, age 80+"
              />
              <StatCard value={`${headlines.cagr}%`} label="CAGR since 2001" />
            </div>
          </div>

          {/* ── Section 01: How It Happens ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">01 — How It Happens</span>
            <InsightHeadline
              primary={`Social media converts ${socialMedia.pct_with_loss}% of fraud contacts into losses.`}
              secondary={`Email converts ${email.pct_with_loss}%.`}
            />

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Contact Method Conversion Rate</h3>
                <p className="chart-subtitle">% of contacts that result in a loss</p>
                <HorizontalBar data={conversionData} highlightIndex={0} formatValue={(v) => formatPercent(v)} label />
              </div>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Contact Method by Total Loss</h3>
                <p className="chart-subtitle">Dollars lost through each channel</p>
                <HorizontalBar data={lossData} formatValue={(v) => formatCurrency(v)} />
              </div>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Fraud Category Concentration</h3>
                <p className="chart-subtitle">
                  Top 3 = {derived.concentration?.category_top_3_share ?? '...'}% of reports
                </p>
                <ReportTreemap data={fraudTypes.slice(0, 15)} formatValue={(v) => formatPercent(v, 1)} height={300} />
              </div>
            </div>

            {pigData && (
              <div className="print-avoid-break">
                <Callout variant="info" headline="What is Pig Butchering?">
                  <p><strong>{pigData.subhead}</strong></p>
                  <p>{typeof pigData.definition === 'string' ? pigData.definition : pigData.definition?.short}</p>
                  {pigData.statistics?.average_loss_per_victim && (
                    <p style={{ marginTop: 8, fontStyle: 'italic' }}>
                      Average loss per victim: {formatCurrency(pigData.statistics.average_loss_per_victim, { compact: false, decimals: 0 })}
                    </p>
                  )}
                </Callout>
              </div>
            )}

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Category Growth Relative to Market</h3>
                <p className="chart-subtitle">
                  Percentage points above/below market growth of {growth.market_growth_2022_2024_pct?.toFixed(1)}%
                </p>
                <DivergingBar
                  data={growthData}
                  formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp`}
                  baselineLabel="Market Average"
                />
              </div>
            </div>
          </div>

          {/* ── Section 02: Where Money Goes ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">02 — Where Money Goes</span>
            <InsightHeadline
              primary={(() => {
                const totalReports = payment.reduce((s, p) => s + p.reports, 0);
                const pctReports = ((bankTransfer.reports / totalReports) * 100).toFixed(0);
                return `Bank transfers: ${pctReports}% of reports, ${formatPercent(bankTransfer.pct_of_total_loss, 0)} of losses.`;
              })()}
              secondary="By the time money moves, the scam is already won."
            />

            {severityRatio && (
              <Callout variant="neutral" headline="The Severity Gap">
                <p>Bank transfers extract <strong>{severityRatio}x</strong> more per incident than debit cards.</p>
                <p>
                  <span className="big-number">{formatCurrency(bankTransfer.avg_loss_per_report, { compact: false, decimals: 0 })}</span>
                  {' avg  vs  '}
                  <span className="big-number">{formatCurrency(debitCard.avg_loss_per_report, { compact: false, decimals: 0 })}</span>
                  {' avg'}
                </p>
              </Callout>
            )}

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Payment Method Severity</h3>
                <p className="chart-subtitle">Average loss per report by payment method</p>
                <HorizontalBar data={severityData} highlightIndex={0}
                  formatValue={(v) => formatCurrency(v, { compact: false, decimals: 0 })} label />
              </div>
            </div>

            <div className="supporting-context">
              <p>
                Cryptocurrency-based fraud totaled $1.42B in losses at $30,214 average per report.
                Together, bank transfers and crypto account for nearly two-thirds of all payment-identified
                fraud losses, despite representing only ~20% of reports by volume.
              </p>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Loss Distribution</h3>
                <p className="chart-subtitle">Most individual losses are small, but a heavy tail drives total dollar impact</p>
                <HorizontalBar data={distData} formatValue={(v) => formatNumber(v, { compact: true })} label />
              </div>
            </div>

            {domain && (
              <div className="print-avoid-break">
                <ExpertCommentary label={domain.headline || 'What this means for fraud teams'}>
                  {domain.key_paragraphs?.map((p, i) => (
                    <p key={i}><strong>{p.title}:</strong> {p.body}</p>
                  ))}
                </ExpertCommentary>
              </div>
            )}
          </div>

          {/* ── Section 03: Who Gets Hurt ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">03 — Who Gets Hurt</span>
            <InsightHeadline primary="Seniors don't fall for more scams." secondary="They fall for bigger ones." />

            <div className="supporting-context">
              <p>
                Consumers aged 60–69 file the most fraud reports (208,896, 18% of total). But the 80+ group,
                which files only 4% of reports, loses $6,169 per incident — the highest of any age group.
              </p>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Average Loss Per Report by Age</h3>
                <p className="chart-subtitle">Older victims lose significantly more per incident</p>
                <SimpleBar data={lossPerReport} xKey="name" dataKey="value"
                  formatValue={(v) => formatCurrency(v, { compact: false, decimals: 0 })} />
              </div>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Report Volume by Age</h3>
                <p className="chart-subtitle">Most targeted does not mean most damaged</p>
                <SimpleBar data={reportVolume} xKey="name" dataKey="value"
                  formatValue={(v) => formatNumber(v, { compact: true })} color="#b2d2ff" />
              </div>
            </div>

            {seniors && youngest && (
              <div className="print-avoid-break">
                <div className="stat-pair">
                  <div className="stat-pair-card">
                    <div className="stat-pair-label">80+</div>
                    <div className="stat-pair-value">{formatCurrency(seniors.median_loss, { compact: false, decimals: 0 })}</div>
                    <div className="stat-pair-description">median loss{medianRatio ? `, ${medianRatio}x higher` : ''}</div>
                  </div>
                  <div className="stat-pair-card">
                    <div className="stat-pair-label">Under 20</div>
                    <div className="stat-pair-value">{formatCurrency(youngest.median_loss, { compact: false, decimals: 0 })}</div>
                    <div className="stat-pair-description">median loss (baseline)</div>
                  </div>
                </div>
              </div>
            )}

            {unreported?.insight?.seniors && (
              <div className="print-avoid-break">
                <Callout variant="warning" headline="The Hidden Scale of Senior Fraud">
                  <p>
                    Seniors reported <strong>{formatCurrency(unreported.insight.seniors.reported)}</strong> in losses.
                    Estimated actual: <strong>{formatCurrency(unreported.insight.seniors.estimated_actual)}</strong> ({unreported.insight.seniors.multiplier}x).
                  </p>
                </Callout>
              </div>
            )}
          </div>

          {/* ── Section 04: Geography ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">04 — Geography</span>
            <InsightHeadline
              primary="The raw numbers mislead."
              secondary={perCapitaInsights?.subhead || 'Adjusted for population, the picture changes.'}
            />

            <div className="print-avoid-break">
              {geoData && (
                <DualMapComparison
                  stateData={geoData}
                  leftValueKey="reports"
                  rightValueKey="reports_per_100k"
                  leftLabel="Total Reports"
                  rightLabel="Reports per 100K"
                  leftFormatFn={(v) => formatNumber(v, { compact: true })}
                  rightFormatFn={(v) => v?.toFixed(0)}
                />
              )}
            </div>

            <div className="supporting-context">
              <p>
                CA, TX, FL = 28% of all state-level reports. But per capita, DC leads at 1,054/100K — nearly
                2x California. Texas (#2 raw) drops to #33 per capita.
              </p>
            </div>

            <div className="print-avoid-break">
              <div className="chart-grid two-col">
                {s0 && (
                  <GeoInsightCard type="versus" data={{
                    tag: 'Per capita reports', finding: s0.finding, label: 'per 100K',
                    left: { name: 'District of Columbia', value: Math.round(s0.dc_reports_per_100k || 1054).toLocaleString() },
                    right: { name: 'California', value: Math.round(s0.california_reports_per_100k || 608).toLocaleString() },
                  }} />
                )}
                {s1 && (
                  <GeoInsightCard type="versus" data={{
                    tag: 'Loss per capita', finding: s1.finding, label: 'per 100K',
                    left: { name: 'Arizona', value: `$${(s1.arizona_loss_per_100k / 1e6).toFixed(2)}M` },
                    right: { name: 'California', value: `$${(s1.california_loss_per_100k / 1e6).toFixed(2)}M` },
                  }} />
                )}
              </div>
            </div>

            <div className="print-avoid-break">
              <div className="chart-grid two-col" style={{ marginTop: 16 }}>
                {s2 && (
                  <GeoInsightCard type="rank-shift" data={{
                    tag: 'Rank shift', finding: s2.finding,
                    rankBefore: s2.texas_rank_raw || 2, rankAfter: s2.texas_rank_per_capita || 33, detail: s2.detail,
                  }} />
                )}
                {s3 && (
                  <GeoInsightCard type="multi-state" data={{
                    tag: 'Small-state effect', finding: s3.finding,
                    states: [
                      { name: 'Delaware', rawRank: s3.delaware_rank_raw || 43, pcRank: s3.delaware_rank_per_capita || 4 },
                      { name: 'Nevada', rawRank: s3.nevada_rank_raw || 26, pcRank: s3.nevada_rank_per_capita || 2 },
                      { name: 'New Hampshire', rawRank: 41, pcRank: 12 },
                    ],
                  }} />
                )}
              </div>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Top 10 States: Raw vs Per Capita</h3>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>State</th><th>Raw</th><th>Per Cap.</th>
                      <th>Shift</th><th>Reports</th><th>Per 100K</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10Raw.map((s) => {
                      const shift = s.rank_by_reports - s.rank_by_reports_per_100k;
                      return (
                        <tr key={s.state}>
                          <td><strong>{s.state}</strong></td>
                          <td>#{s.rank_by_reports}</td>
                          <td>#{s.rank_by_reports_per_100k}</td>
                          <td>
                            <span className={`rank-change ${shift > 0 ? 'up' : shift < 0 ? 'down' : ''}`}>
                              {shift > 0 ? `+${shift}` : shift < 0 ? shift : '0'}
                            </span>
                          </td>
                          <td>{formatNumber(s.reports, { compact: true })}</td>
                          <td>{s.reports_per_100k?.toFixed(0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Section 05: Trends ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">05 — Trends</span>
            <InsightHeadline
              primary="Fraud has grown faster than GDP, population, or internet adoption for 24 years."
            />

            <div className="supporting-context">
              <p>
                {cagr}% annual growth for 24 years. From 326K reports in 2001 to 6.5M in 2024 — a 20x increase.
                Growth spiked +48% in 2020 (COVID-19) and never fully receded.
              </p>
            </div>

            <div className="print-avoid-break">
              <div className="chart-section">
                <h3 className="chart-title">Consumer Reports: 2001 to 2024</h3>
                <p className="chart-subtitle">Total reports filed with FTC Consumer Sentinel Network</p>
                <ReportAreaChart
                  data={trendData} xKey="year" dataKey="value"
                  formatValue={(v) => formatNumber(v, { compact: true })}
                  annotations={[{ x: 2020, label: 'COVID-19' }]}
                  height={340}
                />
              </div>
            </div>

            {outlook?.projections && (
              <div className="print-avoid-break">
                <Callout variant="info" headline={outlook.headline || "What's Coming"}>
                  {outlook.projections.map((p) => (
                    <div key={p.id} style={{ marginBottom: 12 }}>
                      <p><strong>{p.headline}</strong></p>
                      <p>{typeof p.analysis === 'string' ? p.analysis : p.copy?.body || p.copy?.short || ''}</p>
                    </div>
                  ))}
                </Callout>
              </div>
            )}
          </div>

          {/* ── Section 06: Methodology ── */}
          <div className="pdf-page-break" />
          <div className="pdf-section methodology-section">
            <img src="/rulebase-logo.svg" alt="" className="pdf-header-logo" />
            <span className="section-number">06 — Methodology</span>
            <h2 style={{ marginBottom: 12, paddingTop: 0 }}>Methodology</h2>
            <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 32 }}>
              How we built this report, and what to keep in mind when reading it.
            </p>

            <h3>Data Source</h3>
            <p>
              All data comes from the FTC Consumer Sentinel Network 2024 Data Book.
            </p>

            <h3>Limitations</h3>
            <ul>
              <li>Reporting is voluntary. Most fraud victims never file a complaint.</li>
              <li>Reports are unverified consumer submissions.</li>
              <li>The data does not allow linking fraud categories to specific payment methods.</li>
            </ul>

            <h3>Calculations</h3>
            <ul>
              <li><strong>Per capita rates</strong> use 2023 U.S. Census population estimates.</li>
              <li><strong>CAGR</strong> calculated from 2001 to 2024.</li>
              <li><strong>Conversion rate</strong> = % of contacts resulting in a financial loss.</li>
            </ul>

            <div className="pdf-final-footer">
              <p>Data Source: FTC Consumer Sentinel Network 2024 | Built by Rulebase</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
