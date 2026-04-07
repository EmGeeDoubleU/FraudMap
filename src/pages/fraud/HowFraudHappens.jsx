import { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import ExpandableCallout from '../../components/Blocks/ExpandableCallout';
import ScrollReveal from '../../components/common/ScrollReveal';
import HorizontalBar from '../../components/Charts/HorizontalBar';
import ReportTreemap from '../../components/Charts/ReportTreemap';
import DivergingBar from '../../components/Charts/DivergingBar';
import NextSection from '../../components/common/NextSection';
import { formatPercent, formatCurrency } from '../../utils/formatters';

export default function HowFraudHappens() {
  const { data: contact } = useData('contact_methods.json');
  const { data: pigData } = useData('report_enhancements/pig_butchering_explainer.json');
  const { data: fraudTypes } = useData('fraud_types.json');
  const { data: growth } = useData('category_relative_growth.json');
  const { data: derived } = useData('derived_metrics.json');

  const conversionData = useMemo(() => {
    if (!contact?.methods) return [];
    return [...contact.methods]
      .sort((a, b) => b.pct_with_loss - a.pct_with_loss)
      .map((m) => ({
        name: m.contact_method,
        value: m.pct_with_loss,
        totalLoss: m.total_loss,
      }));
  }, [contact]);

  const lossData = useMemo(() => {
    if (!contact?.methods) return [];
    return [...contact.methods]
      .sort((a, b) => b.total_loss - a.total_loss)
      .map((m) => ({
        name: m.contact_method,
        value: m.total_loss,
      }));
  }, [contact]);

  const growthData = useMemo(() => {
    if (!growth?.categories) return [];
    return [...growth.categories]
      .sort((a, b) => b.relative_growth_pct - a.relative_growth_pct)
      .map((c) => ({
        name: c.category,
        value: c.relative_growth_pct,
      }));
  }, [growth]);

  const socialMedia = contact?.methods?.find((m) => m.contact_method === 'Social Media');
  const email = contact?.methods?.find((m) => m.contact_method === 'Email');

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div className="section-intro split" id="how-lead">
            <div>
              <span className="section-number">01 — How It Happens</span>
              <InsightHeadline
                primary={`Social media converts ${socialMedia?.pct_with_loss ?? '...'}% of fraud contacts into losses.`}
                secondary={`Email converts ${email?.pct_with_loss ?? '...'}%.`}
              />
              <div className="supporting-context">
                <p>
                  Social media isn't just a contact channel — it's a trust-building platform.
                  Scammers use it to cultivate relationships before ever mentioning money.
                </p>
              </div>
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Contact Method Conversion Rate</h3>
              <p className="chart-subtitle">% of contacts that result in a loss</p>
              <HorizontalBar
                data={conversionData}
                highlightIndex={0}
                formatValue={(v) => formatPercent(v)}
                label
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="chart-grid two-col" id="how-channels">
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Contact Method by Total Loss</h3>
              <p className="chart-subtitle">Dollars lost through each channel</p>
              <HorizontalBar
                data={lossData}
                formatValue={(v) => formatCurrency(v)}
              />
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              {fraudTypes && (
                <>
                  <h3 className="chart-title">Fraud Category Concentration</h3>
                  <p className="chart-subtitle">
                    Top 3 = {derived?.concentration?.category_top_3_share ?? '...'}% of reports
                  </p>
                  <ReportTreemap
                    data={fraudTypes.slice(0, 15)}
                    formatValue={(v) => formatPercent(v, 1)}
                    height={350}
                  />
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="how-pig">
            {pigData && (
              <ExpandableCallout title="What is Pig Butchering?">
                <p><strong>{pigData.subhead}</strong></p>
                <p>
                  {typeof pigData.definition === 'string'
                    ? pigData.definition
                    : pigData.definition?.short}
                </p>
                {pigData.definition?.etymology && (
                  <p style={{ marginTop: 8, color: 'var(--neutral-500)' }}>
                    {pigData.definition.etymology}
                  </p>
                )}
                {pigData.how_it_works && (
                  <div style={{ marginTop: 16 }}>
                    {Object.entries(pigData.how_it_works).map(([key, step]) => (
                      <p key={key} style={{ marginTop: 8 }}>
                        <strong>{step.name}</strong> — {step.description}
                      </p>
                    ))}
                  </div>
                )}
                {pigData.statistics?.average_loss_per_victim && (
                  <p style={{ marginTop: 16, fontStyle: 'italic' }}>
                    Average loss per victim: {formatCurrency(pigData.statistics.average_loss_per_victim, { compact: false, decimals: 0 })}
                  </p>
                )}
              </ExpandableCallout>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="chart-section" id="how-growth">
            {growthData.length > 0 && (
              <>
                <h3 className="chart-title">Category Growth Relative to Market</h3>
                <p className="chart-subtitle">
                  Percentage points above or below market growth of {growth?.market_growth_2022_2024_pct?.toFixed(1)}%
                </p>
                <DivergingBar
                  data={growthData}
                  formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}pp`}
                  baselineLabel="Market Average"
                />
              </>
            )}
          </div>
        </ScrollReveal>

        <NextSection label="Where Money Goes" to="/fraud/where-money-goes" />
      </div>
    </PageContainer>
  );
}
