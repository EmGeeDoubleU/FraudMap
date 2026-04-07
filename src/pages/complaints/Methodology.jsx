import { useContext } from 'react';
import PageContainer from '../../components/Layout/PageContainer';
import ScrollReveal from '../../components/common/ScrollReveal';
import { DownloadContext } from '../../App';

export default function ComplaintsMethodology() {
  const download = useContext(DownloadContext);

  return (
    <PageContainer>
      <div className="page-section methodology-section">
        <div id="method-scope">
          <ScrollReveal>
            <span className="section-number">04 — Methodology</span>
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
                href="https://files.consumerfinance.gov/f/documents/cfpb_2025-cr-annual-report_2026-03.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                CFPB Consumer Response Annual Report 2025
              </a>
              , published in March 2026. The report covers complaints received by the
              Consumer Financial Protection Bureau from January 1 through December 31, 2025.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2>What's Included</h2>
            <p>
              The dataset includes consumer complaints sent to companies for response,
              company response outcomes, geographic distribution, and product and issue
              breakdowns. Of the 6.6 million complaints received, 90% were sent to
              companies and 3% were referred to other regulatory agencies.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            <h2>Limitations</h2>
            <ul>
              <li>
                Complaints are based on unverified consumer reports. The CFPB does not
                independently confirm each submission.
              </li>
              <li>
                This is not a statistical sample of consumer experiences. Complaint
                volume reflects who chooses to file, not the full scope of any issue.
              </li>
              <li>
                Complaint volume is affected by credit repair organizations, AI agents,
                and social media influencers promoting complaint filing.
              </li>
              <li>
                Does not include complaints referred to other regulators or those deemed
                not actionable.
              </li>
            </ul>
          </ScrollReveal>

          <ScrollReveal>
            <h2>External Sources</h2>
            <ul>
              <li>
                CFPB press releases: Zelle lawsuit (December 2024),
                Cash App consent order (January 2025)
              </li>
              <li>
                Senate letters on Reg E rulemaking regarding authorized vs. unauthorized
                transfers
              </li>
              <li>
                Federal Reserve Bank of Atlanta analysis on APP fraud and Regulation E
                coverage (September 2024)
              </li>
            </ul>
          </ScrollReveal>
        </div>

        <div id="method-detail">
          <ScrollReveal>
            <h2>Glossary</h2>
            <dl>
              <dt>Non-monetary relief</dt>
              <dd>
                Company corrected information, restored account access, stopped
                collection calls, or provided other objective, verifiable non-monetary
                relief.
              </dd>

              <dt>Administrative response</dt>
              <dd>
                Company returned the complaint citing fraud by the consumer, pending
                litigation, unauthorized third-party submission, duplicate complaint,
                or wrong company.
              </dd>

              <dt>Reg E (Regulation E)</dt>
              <dd>
                Electronic Fund Transfer Act regulations that govern consumer rights
                for electronic payments. Currently does not require banks to reimburse
                for authorized push payment fraud.
              </dd>

              <dt>APP fraud</dt>
              <dd>
                Authorized Push Payment fraud — scam-induced transfers where the
                consumer initiates the payment but is deceived about the recipient
                or purpose.
              </dd>

              <dt>Furnisher</dt>
              <dd>
                An entity that reports consumer data to credit bureaus. Banks,
                lenders, and other financial institutions furnish account
                information that appears on credit reports.
              </dd>

              <dt>NCRA (Nationwide Consumer Reporting Agency)</dt>
              <dd>
                The three major credit bureaus: Equifax, Experian, and TransUnion.
                They received 77% of all CFPB complaints in 2025.
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
