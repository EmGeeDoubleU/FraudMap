import { useData } from '../hooks/useData';
import PageContainer from '../components/Layout/PageContainer';
import StatCard from '../components/Blocks/StatCard';
import ScrollReveal from '../components/common/ScrollReveal';
import NextSection from '../components/common/NextSection';
import { formatCurrency, formatMultiplier } from '../utils/formatters';

export default function ExecutiveSummary() {
  const { data: derived } = useData('derived_metrics.json');
  const { data: unreported } = useData('report_enhancements/unreported_multiplier.json');
  const { data: contact } = useData('contact_methods.json');
  const { data: overview } = useData('overview.json');

  const headlines = derived?.headlines;
  const severity = derived?.severity;

  const socialMedia = contact?.methods?.find((m) => m.contact_method === 'Social Media');
  const email = contact?.methods?.find((m) => m.contact_method === 'Email');

  const reported = headlines?.total_loss;
  const estimated = unreported?.insight?.estimated_actual_low;
  const barRatio = reported && estimated ? Math.round((reported / estimated) * 100) : 0;

  return (
    <>
      <section className="hero" id="overview-hero">
        <img src="/rulebase-logo.svg" alt="Rulebase" className="hero-logo" />
        <h1 className="hero-title">
          State of Fraud<br />in the U.S.
        </h1>
        <p className="hero-subtitle">
          An analysis of 2.6M consumer reports from the FTC Consumer Sentinel Network in 2024
        </p>
        <div className="scroll-prompt">
          <span className="scroll-prompt-arrow">↓</span>
          Scroll to explore
        </div>
      </section>

      <PageContainer>
        <ScrollReveal>
          <div className="iceberg-block" id="overview-iceberg">
            {reported && estimated && (
              <>
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
              </>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="overview-figures">
            <div className="supporting-context" style={{ maxWidth: 760 }}>
              <p>
                In 2024, the FTC Consumer Sentinel Network recorded its highest-ever annual total: 6.5 million
                consumer reports encompassing fraud, identity theft, and other complaints.               Only 38% of fraud
                reports included a dollar loss, meaning the $12.5 billion figure almost certainly understates
                the true cost. The median loss was $497, but the average was $4,920, a 10x gap that reveals
                how a small number of catastrophic incidents drive aggregate losses while most victims lose
                relatively modest amounts.
              </p>
              <p style={{ marginTop: 12 }}>
                Fraud is not evenly distributed. Three categories generate 58% of reports. Three payment methods
                account for 72% of dollar losses. Ten metro areas hold 38% of metropolitan volume. This report
                examines where fraud concentrates, how it reaches people, and who bears the heaviest cost.
              </p>
            </div>

            <div className="page-section" style={{ marginTop: 32 }}>
            <div className="stat-cards">
              <StatCard
                value={headlines ? formatCurrency(headlines.total_loss) : '...'}
                label="Reported losses"
              />
              <StatCard
                value={socialMedia ? `${socialMedia.pct_with_loss}%` : '...'}
                label={`Social media conversion rate${email ? ` vs ${email.pct_with_loss}% email` : ''}`}
              />
              <StatCard
                value={severity ? formatCurrency(severity.highest_avg_loss_payment_method.avg_loss, { compact: false, decimals: 0 }) : '...'}
                label={`Avg bank transfer loss, ${severity ? formatMultiplier(severity.highest_avg_loss_payment_method.avg_loss / (overview?.avg_loss_per_report || 1)) : '...'} the overall average`}
              />
              <StatCard
                value={severity ? formatCurrency(severity.highest_loss_per_report_age_group.loss_per_report, { compact: false, decimals: 0 }) : '...'}
                label="Avg loss per report, age 80+"
              />
              <StatCard
                value={headlines ? `${headlines.cagr}%` : '...'}
                label="Annual growth rate (CAGR) since 2001"
              />
            </div>
            </div>
          </div>
        </ScrollReveal>

        <NextSection label="How It Happens" to="/how-fraud-happens" />
      </PageContainer>
    </>
  );
}
