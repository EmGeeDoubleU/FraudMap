import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import StatCard from '../../components/Blocks/StatCard';
import Callout from '../../components/Blocks/Callout';
import ScrollReveal from '../../components/common/ScrollReveal';
import NextSection from '../../components/common/NextSection';
import { formatNumber } from '../../utils/formatters';

export default function ComplaintsExecutiveSummary() {
  const { data: overview } = useData('complaints/overview.json');

  return (
    <>
      <section className="hero" id="overview-hero">
        <img src="/rulebase-logo.svg" alt="Rulebase" className="hero-logo" />
        <h1 className="hero-title">
          State of Consumer<br />Complaints
        </h1>
        <p className="hero-subtitle">
          An analysis of {overview ? formatNumber(overview.total_complaints_2025, { compact: true }) : '...'} complaints
          from the CFPB Consumer Response database in 2025
        </p>
        <div className="scroll-prompt">
          <span className="scroll-prompt-arrow">↓</span>
          Scroll to explore
        </div>
      </section>

      <PageContainer>
        <ScrollReveal>
          <Callout variant="warning" headline="This is what reaches regulators">
            <p>
              Every complaint in this report was sent to a company for response.
              Every response is visible to examiners.
              Every pattern is potential enforcement evidence.
            </p>
          </Callout>
        </ScrollReveal>

        <ScrollReveal>
          <div id="overview-figures">
            <div className="page-section" style={{ marginTop: 32 }}>
              <div className="stat-cards">
                <StatCard
                  value={overview ? formatNumber(overview.total_complaints_2025, { compact: true }) : '...'}
                  label="Complaints in 2025"
                />
                <StatCard
                  value={overview ? `${overview.growth_metrics.yoy_change_2024_to_2025}%` : '...'}
                  label="Year-over-year growth"
                />
                <StatCard
                  value={overview ? `${overview.product_breakdown[0].pct_of_total}%` : '...'}
                  label="Credit reporting share"
                />
                <StatCard
                  value="40%"
                  label="Required corrections"
                />
                <StatCard
                  value="94%"
                  label="Money transfer denials"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        <NextSection label="The Flood" to="/complaints/flood" />
      </PageContainer>
    </>
  );
}
