import { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import Callout from '../../components/Blocks/Callout';
import ScrollReveal from '../../components/common/ScrollReveal';
import SimpleBar from '../../components/Charts/SimpleBar';
import NextSection from '../../components/common/NextSection';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export default function WhoGetsHurt() {
  const { data: demographics } = useData('demographics_age.json');
  const { data: unreported } = useData('report_enhancements/unreported_multiplier.json');

  const lossPerReport = useMemo(() => {
    if (!demographics) return [];
    return demographics.map((d) => ({
      name: d.age_group,
      value: d.loss_per_report,
    }));
  }, [demographics]);

  const reportVolume = useMemo(() => {
    if (!demographics) return [];
    return demographics.map((d) => ({
      name: d.age_group,
      value: d.reports,
    }));
  }, [demographics]);

  const seniors = demographics?.find((d) => d.age_group === '80 and Over');
  const youngest = demographics?.find((d) => d.age_group === '19 and Under');
  const medianRatio = seniors && youngest && youngest.median_loss > 0
    ? (seniors.median_loss / youngest.median_loss).toFixed(1)
    : null;

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div id="who-intro">
            <span className="section-number">03 — Who Gets Hurt</span>
            <InsightHeadline
              primary="Seniors don't fall for more scams."
              secondary="They fall for bigger ones."
            />
            <div className="supporting-context" style={{ marginTop: 20 }}>
              <p>
                Consumers aged 60 to 69 file the most fraud reports of any age group: 208,896, or 18% of
                the total. But the 80+ group, which files only 4% of reports, loses $6,169 per incident,
                the highest of any age group. The pattern is consistent across the data: younger adults
                report more frequently but lose less. Older adults report less but lose disproportionately
                more when they do.
              </p>
              <p style={{ marginTop: 12 }}>
                This creates a bifurcation that demands different responses. High-volume, low-touch
                prevention works for younger demographics who encounter frequent low-value scams.
                For elderly customers, the answer is high-touch, relationship-based protection:
                because the scams targeting them are also relationship-based.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="chart-grid two-col" id="who-charts">
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Average Loss Per Report by Age</h3>
              <p className="chart-subtitle">Older victims lose significantly more per incident</p>
              <SimpleBar
                data={lossPerReport}
                xKey="name"
                dataKey="value"
                formatValue={(v) => formatCurrency(v, { compact: false, decimals: 0 })}
              />
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Report Volume by Age</h3>
              <p className="chart-subtitle">Most targeted does not mean most damaged</p>
              <SimpleBar
                data={reportVolume}
                xKey="name"
                dataKey="value"
                formatValue={(v) => formatNumber(v, { compact: true })}
                color="#b2d2ff"
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="who-callouts">
            {seniors && youngest && (
              <div className="stat-pair">
                <div className="stat-pair-card">
                  <div className="stat-pair-label">80+</div>
                  <div className="stat-pair-value">
                    {formatCurrency(seniors.median_loss, { compact: false, decimals: 0 })}
                  </div>
                  <div className="stat-pair-description">
                    median loss{medianRatio ? `, ${medianRatio}x higher` : ''}
                  </div>
                </div>
                <div className="stat-pair-card">
                  <div className="stat-pair-label">Under 20</div>
                  <div className="stat-pair-value">
                    {formatCurrency(youngest.median_loss, { compact: false, decimals: 0 })}
                  </div>
                  <div className="stat-pair-description">median loss (baseline)</div>
                </div>
              </div>
            )}
            {unreported?.insight?.seniors && (
              <Callout variant="warning" headline="The Hidden Scale of Senior Fraud" style={{ marginTop: 32 }}>
                <p>
                  Seniors reported <strong>{formatCurrency(unreported.insight.seniors.reported)}</strong> in losses.
                  The FTC estimates actual losses may be as high as{' '}
                  <strong>{formatCurrency(unreported.insight.seniors.estimated_actual)}</strong>, a{' '}
                  {unreported.insight.seniors.multiplier}x multiplier.
                </p>
              </Callout>
            )}
          </div>
        </ScrollReveal>

        <NextSection label="Geography" to="/fraud/geography" />
      </div>
    </PageContainer>
  );
}
