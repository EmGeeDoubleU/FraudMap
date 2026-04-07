import { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import Callout from '../../components/Blocks/Callout';
import ExpandableCallout from '../../components/Blocks/ExpandableCallout';
import ScrollReveal from '../../components/common/ScrollReveal';
import ReportAreaChart from '../../components/Charts/ReportAreaChart';
import HorizontalBar from '../../components/Charts/HorizontalBar';
import USChoropleth from '../../components/Maps/USChoropleth';
import NextSection from '../../components/common/NextSection';
import { formatNumber, formatPercent } from '../../utils/formatters';

export default function Flood() {
  const { data: overview } = useData('complaints/overview.json');
  const { data: geography } = useData('complaints/geography.json');
  const { data: gaming } = useData('complaints/system_gaming.json');

  const trendData = useMemo(() => {
    if (!overview?.year_over_year) return [];
    return overview.year_over_year.map((d) => ({
      year: d.year,
      value: d.complaints,
    }));
  }, [overview]);

  const productData = useMemo(() => {
    if (!overview?.product_breakdown) return [];
    return overview.product_breakdown.map((p) => ({
      name: p.product,
      value: p.pct_of_total,
    }));
  }, [overview]);

  const geoStates = useMemo(() => {
    if (!geography?.top_states_by_volume) return null;
    return {
      states: geography.top_states_by_volume.map((s) => ({
        state: s.state,
        name: s.state,
        complaints: s.total_complaints,
      })),
    };
  }, [geography]);

  const adminDetails = gaming?.administrative_response_details;

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div className="section-intro split" id="flood-trend">
            <div>
              <span className="section-number">01 — The Flood</span>
              <InsightHeadline
                primary="Complaints doubled."
                secondary="Headcount didn't."
              />
              <div className="supporting-context">
                <p>
                  The CFPB received {overview ? formatNumber(overview.total_complaints_2025, { compact: true }) : '...'} complaints
                  in 2025, up {overview ? `${overview.growth_metrics.yoy_change_2024_to_2025}%` : '...'} from 2024.
                  That follows a {overview ? `${overview.growth_metrics.yoy_change_2023_to_2024}%` : '...'} increase the year before.
                  The complaint pipeline has doubled every year since 2023.
                </p>
                <p style={{ marginTop: 12 }}>
                  {overview ? formatPercent(overview.sent_to_companies_pct) : '...'}  were sent to companies for response.
                  {overview ? ` ${formatNumber(overview.companies_receiving_complaints, { compact: true })}+` : ''} companies received at least one complaint.
                </p>
              </div>
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Complaint Volume: 2019 to 2025</h3>
              <p className="chart-subtitle">Total complaints received by CFPB</p>
              {trendData.length > 0 && (
                <ReportAreaChart
                  data={trendData}
                  xKey="year"
                  dataKey="value"
                  formatValue={(v) => formatNumber(v, { compact: true })}
                  annotations={[{ x: 2023, label: 'Doubling begins' }]}
                  height={340}
                />
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="flood-products">
            <div className="chart-section">
              <h3 className="chart-title">Complaints by Product</h3>
              <p className="chart-subtitle">Credit reporting dominates at 88% of all complaints</p>
              <HorizontalBar
                data={productData}
                highlightIndex={0}
                formatValue={(v) => formatPercent(v)}
                label
              />
            </div>

            <Callout variant="info" headline="The 3,654% Number" style={{ marginTop: 32 }}>
              <p>
                Credit reporting complaints have increased{' '}
                <span className="big-number">3,654%</span> since 2019.
                From {overview ? formatNumber(overview.year_over_year[0]?.complaints, { compact: true }) : '...'} complaints to{' '}
                {overview ? formatNumber(overview.product_breakdown[0]?.complaints, { compact: true }) : '...'}.
              </p>
            </Callout>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="flood-geo">
            <div className="chart-section">
              <h3 className="chart-title">Complaints by State</h3>
              <p className="chart-subtitle">
                Per capita rate — Georgia, Florida, and Mississippi lead
              </p>
              {geoStates && (
                <USChoropleth
                  stateData={geoStates}
                  valueKey="complaints"
                  label="Complaints"
                  formatFn={(v) => formatNumber(v, { compact: true })}
                  height={400}
                />
              )}
              <p className="chart-context">
                Texas and Florida lead in raw volume, but Georgia leads per capita.
                Southeast states dominate the per-capita rankings: Georgia (#1), Florida (#2),
                Mississippi (#3), Alabama (#4), Louisiana (#5).
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="flood-gaming">
            <ExpandableCallout title="Why Are Complaints Exploding?">
              <p><strong>The CFPB cites several factors:</strong></p>
              <ul style={{ marginTop: 12 }}>
                {gaming?.complaint_explosion_factors && (
                  <>
                    <li>
                      <strong>AI agents:</strong> {gaming.complaint_explosion_factors.ai_agents.description}
                    </li>
                    <li>
                      <strong>Credit repair organizations:</strong> {gaming.complaint_explosion_factors.credit_repair_organizations.description}
                    </li>
                    <li>
                      <strong>Finfluencers:</strong> {gaming.complaint_explosion_factors.finfluencers.description} ({gaming.complaint_explosion_factors.finfluencers.platforms.join(', ')})
                    </li>
                    <li>Consumers submitting multiple complaints per session</li>
                    <li>Consumers returning to the complaint process repeatedly</li>
                  </>
                )}
              </ul>
              {adminDetails?.reasons?.suspected_fraud_by_consumer && (
                <p style={{ marginTop: 16, fontStyle: 'italic' }}>
                  One CRA alone flagged {formatNumber(adminDetails.reasons.suspected_fraud_by_consumer.count, { compact: true })} complaints
                  as suspected consumer fraud.
                </p>
              )}
            </ExpandableCallout>

            {gaming?.cfpb_response?.planned_reforms && (
              <Callout variant="neutral" headline="CFPB Planned Reforms" style={{ marginTop: 24 }}>
                <ul>
                  {gaming.cfpb_response.planned_reforms.map((reform, i) => (
                    <li key={i}>{reform}</li>
                  ))}
                </ul>
              </Callout>
            )}
          </div>
        </ScrollReveal>

        <NextSection label="The Denials" to="/complaints/denials" />
      </div>
    </PageContainer>
  );
}
