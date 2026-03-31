import { useMemo } from 'react';
import { useData } from '../hooks/useData';
import PageContainer from '../components/Layout/PageContainer';
import InsightHeadline from '../components/Blocks/InsightHeadline';
import Callout from '../components/Blocks/Callout';
import ExpertCommentary from '../components/Blocks/ExpertCommentary';
import ScrollReveal from '../components/common/ScrollReveal';
import HorizontalBar from '../components/Charts/HorizontalBar';
import NextSection from '../components/common/NextSection';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export default function WhereMoneyGoes() {
  const { data: payment } = useData('loss_payment.json');
  const { data: distribution } = useData('loss_distribution.json');
  const { data: domain } = useData('report_enhancements/domain_perspective.json');

  const severityData = useMemo(() => {
    if (!payment) return [];
    return [...payment]
      .sort((a, b) => b.avg_loss_per_report - a.avg_loss_per_report)
      .map((m) => ({
        name: m.method,
        value: m.avg_loss_per_report,
        totalLoss: m.total_loss,
        reports: m.reports,
      }));
  }, [payment]);

  const distData = useMemo(() => {
    if (!distribution?.broad) return [];
    return distribution.broad.map((d) => ({
      name: d.range,
      value: d.reports,
    }));
  }, [distribution]);

  const bankTransfer = payment?.find((m) => m.method === 'Bank Transfer or Payment');
  const debitCard = payment?.find((m) => m.method === 'Debit Card');
  const severityRatio = bankTransfer && debitCard
    ? Math.round(bankTransfer.avg_loss_per_report / debitCard.avg_loss_per_report)
    : null;

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div className="section-intro split" id="where-lead">
            <div>
              <span className="section-number">02 — Where Money Goes</span>
              <InsightHeadline
                primary={(() => {
                  if (!bankTransfer || !payment) return 'Loading...';
                  const totalReports = payment.reduce((s, p) => s + p.reports, 0);
                  const pctReports = ((bankTransfer.reports / totalReports) * 100).toFixed(0);
                  return `Bank transfers: ${pctReports}% of reports, ${formatPercent(bankTransfer.pct_of_total_loss, 0)} of losses.`;
                })()}
                secondary="By the time money moves, the scam is already won."
              />
              {severityRatio && (
                <Callout variant="neutral" headline="The Severity Gap" style={{ marginTop: 16 }}>
                  <p>
                    Bank transfers extract <strong>{severityRatio}x</strong> more per incident than debit cards.
                  </p>
                  <p>
                    <span className="big-number">
                      {formatCurrency(bankTransfer.avg_loss_per_report, { compact: false, decimals: 0 })}
                    </span>
                    {' avg  vs  '}
                    <span className="big-number">
                      {formatCurrency(debitCard.avg_loss_per_report, { compact: false, decimals: 0 })}
                    </span>
                    {' avg'}
                  </p>
                </Callout>
              )}
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Payment Method Severity</h3>
              <p className="chart-subtitle">Average loss per report by payment method</p>
              <HorizontalBar
                data={severityData}
                highlightIndex={0}
                formatValue={(v) => formatCurrency(v, { compact: false, decimals: 0 })}
                label
              />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="where-evidence">
            <div className="supporting-context">
              <p>
                Cryptocurrency-based fraud totaled $1.42 billion in losses at $30,214 average per report.
                Together, bank transfers and crypto account for nearly two-thirds of all payment-identified
                fraud losses, despite representing only about 20% of reports by volume. Three payment methods
                (bank transfers, crypto, and payment apps) concentrate 72% of all dollar losses. The payment
                methods that move money fastest and least reversibly are the ones scammers prefer.
              </p>
            </div>
            <div className="chart-section" style={{ marginTop: 32 }}>
              {distData.length > 0 && (
                <>
                  <h3 className="chart-title">Loss Distribution</h3>
                  <p className="chart-subtitle">
                    Most individual losses are small, but a heavy tail drives total dollar impact
                  </p>
                  <HorizontalBar
                    data={distData}
                    formatValue={(v) => formatNumber(v, { compact: true })}
                    label
                  />
                  <p className="chart-context">
                    63% of loss reports fall under $1,000. Most victims lose a few hundred dollars and move on.
                    But the 12.6% of reports exceeding $10,000 drive the majority of all dollar losses.
                    This is the core tension in fraud prevention: high-frequency, low-value scams affect the most
                    people, but low-frequency, high-value scams cause the most damage. Effective fraud programs
                    need strategies for both.
                  </p>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="where-domain">
            {domain && (
              <ExpertCommentary label={domain.headline || 'What this means for fraud teams'}>
                {domain.key_paragraphs?.map((p, i) => (
                  <p key={i}>
                    <strong>{p.title}:</strong> {p.body}
                  </p>
                ))}
              </ExpertCommentary>
            )}
          </div>
        </ScrollReveal>

        <NextSection label="Who Gets Hurt" to="/who-gets-hurt" />
      </div>
    </PageContainer>
  );
}
