import { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import GeoInsightCard from '../../components/Blocks/GeoInsightCard';
import ScrollReveal from '../../components/common/ScrollReveal';
import DualMapComparison from '../../components/Maps/DualMapComparison';
import NextSection from '../../components/common/NextSection';
import { formatNumber } from '../../utils/formatters';

export default function Geography() {
  const { data: geoData } = useData('geography_state_per_capita.json');
  const { data: perCapitaInsights } = useData('report_enhancements/per_capita_insights.json');

  const states = geoData?.states;

  const top10Raw = useMemo(() => {
    if (!states) return [];
    return [...states].sort((a, b) => a.rank_by_reports - b.rank_by_reports).slice(0, 10);
  }, [states]);

  const s0 = perCapitaInsights?.surprises?.[0];
  const s1 = perCapitaInsights?.surprises?.[1];
  const s2 = perCapitaInsights?.surprises?.[2];
  const s3 = perCapitaInsights?.surprises?.[3];

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div id="geo-maps">
            <span className="section-number">04 — Geography</span>
            <InsightHeadline
              primary="The raw numbers mislead."
              secondary={perCapitaInsights?.subhead || 'Adjusted for population, the picture changes dramatically.'}
            />
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
        </ScrollReveal>

        <ScrollReveal>
          <div className="supporting-context" id="geo-context">
            <p>
              California, Texas, and Florida together account for 28% of all state-level fraud reports.
              But that's largely a function of population. When normalized per capita, the District of
              Columbia leads at 1,054 reports per 100,000 residents, nearly twice California's rate of
              608. Nevada and Colorado round out the top three. Texas, the #2 state by raw volume, drops
              to #33 per capita. It has a lot of fraud because it's big, not because it's especially targeted.
            </p>
            <p style={{ marginTop: 12 }}>
              Loss density tells yet another story. Arizona leads the nation at $4.63 million lost per
              100,000 residents, driven by retiree populations with larger savings. High-loss-density
              states don't always overlap with high-volume states. Where fraud happens and where it
              hurts most are different questions.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="geo-surprises">
            <div className="chart-grid two-col">
              {s0 && (
                <GeoInsightCard
                  type="versus"
                  data={{
                    tag: 'Per capita reports',
                    finding: s0.finding,
                    label: 'per 100K',
                    left: { name: 'District of Columbia', value: Math.round(s0.dc_reports_per_100k || 1054).toLocaleString() },
                    right: { name: 'California', value: Math.round(s0.california_reports_per_100k || 608).toLocaleString() },
                  }}
                />
              )}
              {s1 && (
                <GeoInsightCard
                  type="versus"
                  data={{
                    tag: 'Loss per capita',
                    finding: s1.finding,
                    label: 'per 100K',
                    left: { name: 'Arizona', value: `$${(s1.arizona_loss_per_100k / 1e6).toFixed(2)}M` },
                    right: { name: 'California', value: `$${(s1.california_loss_per_100k / 1e6).toFixed(2)}M` },
                  }}
                />
              )}
            </div>
            <div className="chart-grid two-col" style={{ marginTop: 24 }}>
              {s2 && (
                <GeoInsightCard
                  type="rank-shift"
                  data={{
                    tag: 'Rank shift',
                    finding: s2.finding,
                    rankBefore: s2.texas_rank_raw || 2,
                    rankAfter: s2.texas_rank_per_capita || 33,
                    detail: s2.detail,
                  }}
                />
              )}
              {s3 && (
                <GeoInsightCard
                  type="multi-state"
                  data={{
                    tag: 'Small-state effect',
                    finding: s3.finding,
                    states: [
                      { name: 'Delaware', rawRank: s3.delaware_rank_raw || 43, pcRank: s3.delaware_rank_per_capita || 4 },
                      { name: 'Nevada', rawRank: s3.nevada_rank_raw || 26, pcRank: s3.nevada_rank_per_capita || 2 },
                      { name: 'New Hampshire', rawRank: 41, pcRank: 12 },
                    ],
                  }}
                />
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="chart-section" id="geo-table">
            {top10Raw.length > 0 && (
              <>
                <h3 className="chart-title">Top 10 States: Raw vs Per Capita</h3>
                <p className="chart-subtitle">How rankings shift when adjusted for population</p>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>State</th>
                      <th>Raw Rank</th>
                      <th>Per Capita Rank</th>
                      <th>Shift</th>
                      <th>Reports</th>
                      <th>Per 100K</th>
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
              </>
            )}
          </div>
        </ScrollReveal>

        <NextSection label="Trends" to="/fraud/trends" />
      </div>
    </PageContainer>
  );
}
