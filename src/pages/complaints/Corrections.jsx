import { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import Callout from '../../components/Blocks/Callout';
import ExpertCommentary from '../../components/Blocks/ExpertCommentary';
import ScrollReveal from '../../components/common/ScrollReveal';
import DonutChart from '../../components/Charts/DonutChart';
import HorizontalBar from '../../components/Charts/HorizontalBar';
import DivergingBar from '../../components/Charts/DivergingBar';
import NextSection from '../../components/common/NextSection';
import { formatNumber, formatPercent } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';

export default function Corrections() {
  const { data: creditReporting } = useData('complaints/credit_reporting.json');
  const { data: outcomes } = useData('complaints/response_outcomes.json');

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

  const issueData = useMemo(() => {
    if (!creditReporting?.top_issues) return [];
    return creditReporting.top_issues.map((i) => ({
      name: i.issue,
      value: creditReporting.top_issues.length - i.rank + 1,
    }));
  }, [creditReporting]);

  const growthData = useMemo(() => {
    if (!creditReporting?.growth_vs_prior_2yr_avg) return [];
    const g = creditReporting.growth_vs_prior_2yr_avg;
    return [
      { name: 'Incorrect information', value: g.incorrect_information_issue_pct },
      { name: 'Credit reporting overall', value: g.credit_reporting_complaints_pct },
      { name: 'Other personal reports', value: g.other_personal_consumer_reports_pct },
    ].sort((a, b) => b.value - a.value);
  }, [creditReporting]);

  const ncra = creditReporting?.ncra_specific;

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div className="section-intro split" id="corrections-outcomes">
            <div>
              <span className="section-number">03 — The Corrections</span>
              <InsightHeadline
                primary="40% of credit reporting complaints require corrections."
                secondary="That's not consumer error. That's your data."
              />
              <div className="supporting-context">
                <p>
                  Credit or consumer reporting accounts for {creditReporting ? formatPercent(creditReporting.volume.pct_of_all_complaints) : '...'} of
                  all complaints — {creditReporting ? formatNumber(creditReporting.volume.total_complaints, { compact: true }) : '...'} in 2025.
                  {creditReporting ? ` ${formatPercent(creditReporting.response_stats.consumer_tried_to_resolve_first_pct)}` : ''} of consumers
                  tried to resolve the issue with the company first.
                </p>
                <p style={{ marginTop: 12 }}>
                  {crOutcome ? formatPercent(crOutcome.non_monetary_pct) : '...'} of these complaints result in non-monetary relief —
                  meaning the company corrected information, restored access, or stopped collection activity.
                  At this scale, the correction rate is a data quality signal.
                </p>
              </div>
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Credit Reporting Response Outcomes</h3>
              <p className="chart-subtitle">How companies responded to credit reporting complaints</p>
              {donutData.length > 0 && (
                <DonutChart
                  data={donutData}
                  highlightIndex={1}
                  colors={[
                    CHART_COLORS.muted,
                    CHART_COLORS.primary,
                    '#c4c4c4',
                    CHART_COLORS.success,
                  ]}
                  height={300}
                />
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="corrections-issues">
            <div className="chart-section">
              <h3 className="chart-title">Top Credit Reporting Issues</h3>
              <p className="chart-subtitle">What consumers complain about most</p>
              {issueData.length > 0 && (
                <HorizontalBar
                  data={issueData}
                  highlightIndex={0}
                  formatValue={(v) => `#${issueData.length - v + 1}`}
                  label
                />
              )}
            </div>

            <Callout variant="neutral" headline="Real-World Impact" style={{ marginTop: 24 }}>
              <p>
                Consumers report being denied jobs and apartments due to credit report errors.
                Common themes include tradeline errors, public record inaccuracies,
                personal information mistakes, and collections appearing without notice.
              </p>
            </Callout>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="corrections-growth">
            <div className="chart-section">
              <h3 className="chart-title">Issue Growth Rates</h3>
              <p className="chart-subtitle">% increase vs prior 2-year average</p>
              {growthData.length > 0 && (
                <DivergingBar
                  data={growthData}
                  formatValue={(v) => `+${v}%`}
                  baselineLabel="Prior 2-year avg"
                />
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="corrections-furnisher">
            <Callout variant="info" headline="The Furnisher Problem">
              <p>
                {ncra ? formatPercent(ncra.pct_of_all_complaints) : '...'}  of ALL complaints are about{' '}
                {ncra ? ncra.big_three.join(', ') : 'the Big Three CRAs'}.
                But banks furnish the data.
              </p>
              <p style={{ marginTop: 12 }}>
                <span className="big-number">{ncra ? formatNumber(ncra.complaints_about_big_three, { compact: true }) : '...'}</span> complaints
                about the Big Three CRAs. {crOutcome ? formatPercent(crOutcome.non_monetary_pct) : '...'} result in corrections.
              </p>
              <p style={{ marginTop: 12 }}>
                Every correction is an admission.
                At scale, this is pattern evidence for enforcement.
              </p>
            </Callout>

            <ExpertCommentary label="What this means for compliance teams">
              <p>
                <strong>Furnisher accountability is expanding.</strong> If 40% of complaints about CRAs
                result in corrections, the question regulators will ask is: who furnished the bad data?
              </p>
              <p style={{ marginTop: 12 }}>
                <strong>Correction volume = exam risk.</strong> Every correction is visible to examiners
                and creates a trail of data quality failures that can be aggregated into pattern evidence.
              </p>
            </ExpertCommentary>
          </div>
        </ScrollReveal>

        <NextSection label="Methodology" to="/complaints/methodology" />
      </div>
    </PageContainer>
  );
}
