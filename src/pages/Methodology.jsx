import { useContext } from 'react';
import PageContainer from '../components/Layout/PageContainer';
import ScrollReveal from '../components/common/ScrollReveal';
import { DownloadContext } from '../App';

export default function Methodology() {
  const download = useContext(DownloadContext);
  return (
    <PageContainer>
      <div className="page-section methodology-section">
        <div id="method-scope">
          <ScrollReveal>
            <span className="section-number">06 — Methodology</span>
            <h1 style={{ fontSize: 'var(--text-4xl)', marginBottom: 12 }}>Methodology</h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-muted-foreground)', marginBottom: 48 }}>
              How we built this report, and what to keep in mind when reading it.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2>Data Source</h2>
            <p>
              All data in this report comes from the{' '}
              <a
                href="https://www.ftc.gov/reports/consumer-sentinel-network-data-book-2024"
                target="_blank"
                rel="noopener noreferrer"
              >
                FTC Consumer Sentinel Network 2024 Data Book
              </a>
              , published by the Federal Trade Commission. The Sentinel Network is the largest
              database of consumer fraud reports in the United States, containing over 6.5 million
              reports filed in 2024.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2>What's Included</h2>
            <p>
              The dataset includes three types of consumer reports: fraud reports, identity theft
              reports, and other consumer complaints (such as credit bureau issues). Date range
              covers calendar year 2024. Geographic coverage spans all 50 states, the District
              of Columbia, and Puerto Rico.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2>Limitations</h2>
            <p>
              These numbers represent only reported fraud. The FTC estimates that actual fraud
              losses may be 8–16x higher than what is reported through formal channels. Several
              important limitations apply:
            </p>
            <ul>
              <li>
                Reporting is voluntary. Most fraud victims never file a complaint. The FTC's
                own research suggests the true scale of fraud is dramatically larger.
              </li>
              <li>
                Reports are unverified consumer submissions. The FTC does not independently
                confirm each report.
              </li>
              <li>
                The data does not allow linking individual fraud categories to specific payment
                methods. Cross-tabulations between these dimensions are not available.
              </li>
              <li>
                Credit Bureau complaints represent downstream effects (credit damage from fraud),
                not fraud events themselves. Their inclusion inflates total report counts.
              </li>
            </ul>
          </ScrollReveal>
        </div>

        <div id="method-detail">
          <ScrollReveal>
            <h2>Calculations</h2>
            <ul>
              <li>
                <strong>Per capita rates</strong> use 2023 U.S. Census population estimates for
                each state and territory.
              </li>
              <li>
                <strong>CAGR</strong> (Compound Annual Growth Rate) is calculated from 2001 to
                2024 using the standard formula.
              </li>
              <li>
                <strong>Relative growth</strong> = category growth minus overall market growth
                (21.7% from 2022–2024), expressed in percentage points.
              </li>
              <li>
                <strong>Conversion rate</strong> for contact methods represents the percentage
                of contacts through a given channel that result in a reported financial loss.
              </li>
              <li>
                <strong>Severity index</strong> for payment methods is the average loss per
                report for each payment type.
              </li>
            </ul>
          </ScrollReveal>

          <ScrollReveal>
            <h2>Glossary</h2>
            <dl>
              <dt>Pig Butchering</dt>
              <dd>
                A long-con fraud technique where scammers build romantic or investment
                relationships over weeks or months, then convince victims to invest in
                fraudulent cryptocurrency platforms. Named for the practice of "fattening"
                victims before "slaughtering" them financially.
              </dd>

              <dt>Imposter Scams</dt>
              <dd>
                Fraud where the perpetrator pretends to be a trusted entity (a government
                agency, tech company, romantic partner, or family member) to extract money
                or personal information.
              </dd>

              <dt>Credit Bureau Complaints</dt>
              <dd>
                Reports filed about credit bureaus and information furnishers. These are
                typically downstream effects of identity theft or fraud, where victims
                discover fraudulent accounts or incorrect information on their credit reports.
              </dd>

              <dt>Conversion Rate (Fraud)</dt>
              <dd>
                The percentage of fraud contacts through a given channel that result in a
                reported financial loss. A 70% conversion rate means 70 out of 100 contacts
                led to money being lost.
              </dd>

              <dt>Severity Index</dt>
              <dd>
                Average dollar loss per report for a given payment method or fraud category.
                Higher severity indicates that individual incidents through that channel tend
                to be more costly.
              </dd>
            </dl>
          </ScrollReveal>
        </div>

        <ScrollReveal>
          <div className="download-cta">
            <h3 className="download-cta-title">Download the full report</h3>
            <p className="download-cta-text">
              Save a PDF copy of all sections for offline reading or sharing with your team.
            </p>
            <button type="button" className="download-cta-button" onClick={() => download?.trigger()}>
              Download PDF
            </button>
          </div>
        </ScrollReveal>
      </div>
    </PageContainer>
  );
}
