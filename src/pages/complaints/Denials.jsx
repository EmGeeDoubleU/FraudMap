import { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import PageContainer from '../../components/Layout/PageContainer';
import InsightHeadline from '../../components/Blocks/InsightHeadline';
import Callout from '../../components/Blocks/Callout';
import ExpertCommentary from '../../components/Blocks/ExpertCommentary';
import ScrollReveal from '../../components/common/ScrollReveal';
import HorizontalBar from '../../components/Charts/HorizontalBar';
import StackedBar from '../../components/Charts/StackedBar';
import NextSection from '../../components/common/NextSection';
import { formatPercent, formatCurrency } from '../../utils/formatters';

export default function Denials() {
  const { data: moneyTransfer } = useData('complaints/money_transfer.json');
  const { data: outcomes } = useData('complaints/response_outcomes.json');
  const { data: checking } = useData('complaints/checking_savings.json');
  const { data: regulatory } = useData('complaints/regulatory_context.json');

  const growthData = useMemo(() => {
    if (!moneyTransfer?.growth_vs_prior_2yr_avg) return [];
    const g = moneyTransfer.growth_vs_prior_2yr_avg;
    return [
      { name: 'Other transaction problem', value: g.other_transaction_problem_issue_pct },
      { name: 'Domestic money transfer', value: g.domestic_money_transfer_pct },
      { name: 'Mobile / digital wallet', value: g.mobile_digital_wallet_pct },
      { name: 'Virtual currency', value: g.virtual_currency_pct },
    ].sort((a, b) => b.value - a.value);
  }, [moneyTransfer]);

  const outcomeData = useMemo(() => {
    if (!outcomes?.by_product) return [];
    const selected = ['Money transfer, virtual currency', 'Checking or savings', 'Credit card', 'Credit or consumer reporting'];
    const shortNames = {
      'Money transfer, virtual currency': 'Money transfer',
      'Checking or savings': 'Checking/savings',
      'Credit card': 'Credit card',
      'Credit or consumer reporting': 'Credit reporting',
    };
    return selected
      .map((name) => {
        const p = outcomes.by_product.find((x) => x.product === name);
        if (!p) return null;
        return {
          product: shortNames[name] || name,
          monetary_pct: p.monetary_pct,
          non_monetary_pct: p.non_monetary_pct,
          explanation_pct: p.explanation_pct,
          admin_pct: p.admin_pct,
        };
      })
      .filter(Boolean);
  }, [outcomes]);

  const checkingIssues = useMemo(() => {
    if (!checking?.top_issues) return [];
    const total = checking.top_issues.length;
    return checking.top_issues.map((i) => ({
      name: i.issue,
      value: total - i.rank + 1,
    }));
  }, [checking]);

  const zelle = regulatory?.cfpb_enforcement_actions?.zelle_lawsuit;
  const cashApp = regulatory?.cfpb_enforcement_actions?.cash_app_order;
  const authorized = moneyTransfer?.company_response_patterns?.authorized_transaction_defense;

  return (
    <PageContainer>
      <div className="page-section">
        <ScrollReveal>
          <div className="section-intro split" id="denials-growth">
            <div>
              <span className="section-number">02 — The Denials</span>
              <InsightHeadline
                primary="94% of money transfer claims denied."
                secondary="Regulators are watching."
              />
              <div className="supporting-context">
                <p>
                  Money transfer complaints surged across every sub-product.
                  Domestic money transfer complaints increased {moneyTransfer ? `${moneyTransfer.growth_vs_prior_2yr_avg.domestic_money_transfer_pct}%` : '...'} versus
                  the prior two-year average. {moneyTransfer?.spike_note}
                </p>
                <p style={{ marginTop: 12 }}>
                  Despite this surge, {moneyTransfer ? moneyTransfer.response_stats.closed_with_explanation_pct : '...'}% of complaints were closed
                  with explanation only — meaning no monetary or non-monetary relief was provided.
                </p>
              </div>
            </div>
            <div className="chart-section" style={{ margin: 0 }}>
              <h3 className="chart-title">Money Transfer Growth Rates</h3>
              <p className="chart-subtitle">% increase vs prior 2-year average</p>
              {growthData.length > 0 && (
                <HorizontalBar
                  data={growthData}
                  highlightIndex={0}
                  formatValue={(v) => `+${v.toLocaleString()}%`}
                  label
                />
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="denials-outcomes">
            <div className="chart-section">
              <h3 className="chart-title">Response Outcomes by Product</h3>
              <p className="chart-subtitle">How companies responded — money transfer stands out</p>
              {outcomeData.length > 0 && (
                <StackedBar
                  data={outcomeData}
                  highlightProduct="Money transfer"
                  height={280}
                />
              )}
              <p className="chart-context">
                Money transfer complaints receive monetary relief just 2% of the time,
                compared to 12% for credit cards. The gap is stark: banks are systematically
                denying scam-related claims across payment apps.
              </p>
            </div>

            <div className="stat-pair" style={{ marginTop: 32 }}>
              <div className="stat-pair-card">
                <div className="stat-pair-label">Money transfer</div>
                <div className="stat-pair-value">2%</div>
                <div className="stat-pair-description">monetary relief</div>
              </div>
              <div className="stat-pair-card">
                <div className="stat-pair-label">Credit card</div>
                <div className="stat-pair-value">12%</div>
                <div className="stat-pair-description">monetary relief</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="denials-authorized">
            <Callout variant="warning" headline='The "Authorized" Defense'>
              <p>
                Banks deny scam-induced transfer claims by arguing the consumer
                "authorized" the transaction. They cite:
              </p>
              {authorized && (
                <ul style={{ marginTop: 12 }}>
                  {authorized.cited_factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <p style={{ marginTop: 16 }}><strong>But regulators are pushing back:</strong></p>
              <ul style={{ marginTop: 8 }}>
                {zelle && (
                  <li>
                    CFPB sued {zelle.defendants.join(', ')} ({zelle.date})
                  </li>
                )}
                {cashApp && (
                  <li>
                    CFPB ordered Cash App to pay {formatCurrency(cashApp.penalty_total)} for fraud failures ({cashApp.date})
                  </li>
                )}
                {regulatory?.legislative_pressure?.senate_letter && (
                  <li>
                    Senators urging rulemaking on what counts as "authorized" under Reg E
                  </li>
                )}
              </ul>
              {regulatory?.current_legal_framework?.reg_e_authorized_transactions && (
                <p style={{ marginTop: 16, fontSize: 'var(--text-sm)', color: 'var(--neutral-500)' }}>
                  {regulatory.current_legal_framework.reg_e_authorized_transactions.description}
                </p>
              )}
            </Callout>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div id="denials-checking">
            <div className="chart-section">
              <h3 className="chart-title">Checking/Savings: Top Issues</h3>
              <p className="chart-subtitle">
                {checking ? formatPercent(checking.growth_vs_prior_2yr_avg.checking_account_complaints_pct) : '...'}  increase vs prior 2-year average
              </p>
              {checkingIssues.length > 0 && (
                <HorizontalBar
                  data={checkingIssues}
                  formatValue={() => ''}
                  label
                />
              )}
            </div>

            <ExpertCommentary label="What this means for compliance teams">
              <p>
                Every denied claim is logged in the CFPB database.
                Every pattern is visible to examiners.
              </p>
              <p style={{ marginTop: 12 }}>
                The "authorized transaction" defense works until it doesn't.
                When regulators move, the complaints are already on file.
              </p>
            </ExpertCommentary>
          </div>
        </ScrollReveal>

        <NextSection label="The Corrections" to="/complaints/corrections" />
      </div>
    </PageContainer>
  );
}
