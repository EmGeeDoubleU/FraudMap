import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import PageContainer from '../components/Layout/PageContainer';
import InsightHeadline from '../components/Blocks/InsightHeadline';
import Callout from '../components/Blocks/Callout';
import ScrollReveal from '../components/common/ScrollReveal';
import ReportAreaChart from '../components/Charts/ReportAreaChart';
import NextSection from '../components/common/NextSection';
import { formatNumber } from '../utils/formatters';

export default function Trends() {
  const { data: trends } = useData('trends.json');
  const { data: derived } = useData('derived_metrics.json');
  const { data: outlook } = useData('report_enhancements/forward_outlook.json');

  const trendData = useMemo(() => {
    if (!trends?.yearly_totals) return [];
    return trends.yearly_totals.map((d) => ({
      year: d.year,
      value: d.reports,
    }));
  }, [trends]);

  const cagr = derived?.headlines?.cagr;

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div className="section-intro split" id="trends-lead">
            <div>
              <span className="section-number">05 — Trends</span>
              <InsightHeadline
                primary="Fraud has grown faster than GDP, population, or internet adoption for 24 years."
              />
              <div className="supporting-context">
                <p>
                  {cagr ? `${cagr}% annual growth for 24 years.` : '...'}
                  {' '}From 326,000 reports in 2001 to 6.5 million in 2024, consumer fraud complaints have
                  compounded relentlessly, a 20x increase in 23 years.
                </p>
                <p style={{ marginTop: 12 }}>
                  Growth accelerated sharply in 2020 (+48% year-over-year) as COVID-19 moved more
                  commerce and social interaction online. The pandemic spike never fully receded.
                  The 2024 total represents a 16.6% year-over-year increase from 2023, posting the
                  highest annual total in the Sentinel Network's history.
                </p>
                <p style={{ marginTop: 12 }}>
                  But the growth isn't evenly distributed. Credit Bureau complaints alone
                  accounted for more than half of the absolute increase from 2022 to 2024. Only 8 of 29
                  tracked categories outpaced overall market growth. The fraud landscape is consolidating,
                  not broadening.
                </p>
              </div>
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              {trendData.length > 0 && (
                <>
                  <h3 className="chart-title">Consumer Reports: 2001 to 2024</h3>
                  <p className="chart-subtitle">Total reports filed with FTC Consumer Sentinel Network</p>
                  <ReportAreaChart
                    data={trendData}
                    xKey="year"
                    dataKey="value"
                    formatValue={(v) => formatNumber(v, { compact: true })}
                    annotations={[{ x: 2020, label: 'COVID-19' }]}
                    height={380}
                  />
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="trends-outlook">
            {outlook?.projections && (
              <Callout variant="info" headline={outlook.headline || "What's Coming"}>
                {outlook.projections.map((p) => (
                  <div key={p.id} style={{ marginBottom: 20 }}>
                    <p><strong>{p.headline}</strong></p>
                    <p>
                      {typeof p.analysis === 'string'
                        ? p.analysis
                        : p.copy?.body || p.copy?.short || ''}
                    </p>
                    {p.what_it_means && (
                      <p style={{ marginTop: 8, fontStyle: 'italic', color: 'var(--neutral-600)' }}>
                        {p.what_it_means}
                      </p>
                    )}
                  </div>
                ))}
              </Callout>
            )}
            {outlook?.caveats && (
              <p style={{ marginTop: 24, fontSize: 'var(--text-sm)', color: 'var(--color-muted-foreground)' }}>
                <strong>Caveat:</strong> {Array.isArray(outlook.caveats) ? outlook.caveats.join(' ') : outlook.caveats}
              </p>
            )}
          </div>
        </ScrollReveal>

        <NextSection label="Methodology" to="/methodology" />
      </div>
    </PageContainer>
  );
}
