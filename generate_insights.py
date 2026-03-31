"""
FTC CSN 2024 — Insight Extraction & Report Structuring Layer
Transforms computed metrics into executive insights, structured report
sections, and UI-ready InsightBlocks.
"""

import json
from pathlib import Path

BASE = Path(__file__).parent
FULL = BASE / "processed_full"
ENRICHED = BASE / "processed_enriched"
OUT = BASE / "report"
OUT.mkdir(exist_ok=True)


def load(name, d=FULL):
    with open(d / name) as f:
        return json.load(f)


def write(name, data):
    p = OUT / name
    with open(p, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  -> {p.relative_to(BASE)}")


def fmt_money(v):
    if v >= 1e9:
        return f"${v / 1e9:.1f}B"
    if v >= 1e6:
        return f"${v / 1e6:.0f}M"
    return f"${v:,.0f}"


def fmt_num(v):
    if v >= 1e6:
        return f"{v / 1e6:.1f}M"
    if v >= 1e3:
        return f"{v / 1e3:.0f}K"
    return f"{v:,}"


# -- load everything up front --
overview    = load("overview.json")
derived     = load("derived_metrics.json")
fraud_types = load("fraud_types.json")
geo_msa     = load("geography_msa.json")
geo_state   = load("geography_state.json")
loss_pay    = load("loss_payment.json")
loss_dist   = load("loss_distribution.json")
demo_age    = load("demographics_age.json")
trends      = load("trends.json")
ft_trends   = load("fraud_types_trends.json")

contact     = load("contact_methods.json", ENRICHED)
rel_growth  = load("category_relative_growth.json", ENRICHED)
state_pc    = load("geography_state_per_capita.json", ENRICHED)
danger      = load("danger_index.json", ENRICHED)


# =========================================================================
# STEP 1 — Global Top Insights
# =========================================================================
def step1_global():
    print("\n== Step 1: Global Insight Extraction ==")

    h = derived["headlines"]
    c = derived["concentration"]
    s = derived["severity"]
    ineq = derived["inequality"]

    top_contact = max(contact["methods"], key=lambda x: x["total_loss"])
    oldest_age = next(a for a in demo_age["age_groups"] if a["age_group"] == "80 and Over")
    youngest_age = next(a for a in demo_age["age_groups"] if a["age_group"] == "19 and Under")
    top_growth = rel_growth["categories"][0]
    top_pc_state = sorted(state_pc["states"], key=lambda x: x["reports_per_100k"], reverse=True)[0]

    insights = [
        {
            "id": "bank_transfer_severity",
            "title": "Bank transfers are the deadliest payment vector",
            "statement": "Bank transfers average $44,131 per fraud report — 3.86x the overall average. Despite representing only 10% of payment-identified reports, they account for 38% of total dollar losses.",
            "metric": "$44,131 avg loss per report",
            "supporting_data": {"index": 3.86, "pct_of_total_loss": 38.44, "total_loss": 2089000000},
        },
        {
            "id": "social_media_loss_leader",
            "title": "Social media is the #1 contact channel by dollar loss",
            "statement": "Scams initiated via social media drove $1.86B in losses — 30% of all contact-attributed losses. 70% of social media fraud reports involve actual financial loss, compared to just 11% for email.",
            "metric": "$1.86B total loss via social media",
            "supporting_data": {"pct_of_loss": 30.15, "pct_with_loss": 70, "avg_loss": 9945.08},
        },
        {
            "id": "category_concentration",
            "title": "Three categories account for 58% of all reports",
            "statement": "Credit Bureaus (20.9%), Identity Theft (17.5%), and Imposter Scams (13.1%) together generate nearly 3 in 5 of all Sentinel reports. The top 10 categories capture 85% of total volume.",
            "metric": "57.9% in top 3 categories",
            "supporting_data": {"top_3_share": 57.86, "top_10_share": 84.93},
        },
        {
            "id": "credit_bureau_explosion",
            "title": "Credit Bureau complaints grew 129% in two years",
            "statement": "Credit Bureaus and Information Furnishers reports surged from 591K in 2022 to 1.35M in 2024 — a 129% increase that outpaced market growth by 107 percentage points. This single category's share nearly doubled from 11.1% to 20.9%.",
            "metric": "+129% growth (2022–2024)",
            "supporting_data": {"from": 590872, "to": 1353175, "relative_growth_pp": 107.31, "share_change_pp": 9.8},
        },
        {
            "id": "age_vulnerability_gap",
            "title": "Seniors 80+ lose 3.4x more per fraud incident than teens",
            "statement": "Consumers aged 80 and over lose $6,169 per report with a median loss of $1,650, while those under 19 lose $1,813 per report (median $189). Older adults report less often but lose disproportionately more when they do.",
            "metric": "3.4x loss-per-report gap",
            "supporting_data": {"oldest_lpr": 6168.66, "youngest_lpr": 1813.39, "oldest_median": 1650, "youngest_median": 189},
        },
        {
            "id": "total_loss_scale",
            "title": "$12.5 billion lost to fraud in a single year",
            "statement": "American consumers reported $12.5B in fraud losses in 2024 across 2.6 million fraud reports. Only 38% of fraud reports included a dollar loss, suggesting the true figure is substantially higher.",
            "metric": "$12.5B total reported loss",
            "supporting_data": {"total_reports": 2600678, "pct_with_loss": 38},
        },
        {
            "id": "crypto_severity",
            "title": "Cryptocurrency fraud averages $30,214 per report",
            "statement": "Crypto-based fraud carries the second-highest severity of any payment method at $30,214 average loss per report — 2.65x the overall average. Total crypto losses reached $1.42B.",
            "metric": "$30,214 avg crypto loss",
            "supporting_data": {"total_loss": 1417000000, "index": 2.65},
        },
        {
            "id": "loss_distribution_skew",
            "title": "13% of loss reports drive the vast majority of dollar losses",
            "statement": "63% of fraud loss reports fall under $1,000, but the 12.6% of reports exceeding $10,000 account for an estimated 73% of all dollar losses. Fraud impact is heavily concentrated in high-value incidents.",
            "metric": "12.6% of reports → ~73% of losses",
            "supporting_data": {"pct_under_1k": 63.2, "pct_over_10k": 12.63, "top_bucket_loss_share": 73.0},
        },
        {
            "id": "metro_inequality",
            "title": "Top metro area sees 829x more reports than the smallest",
            "statement": "NYC metro reported 309,066 fraud complaints vs. 373 in the smallest tracked MSA — an 829x gap. The top 10 metro areas generate 38% of all metropolitan fraud volume.",
            "metric": "829x metro gap",
            "supporting_data": {"top": 309066, "bottom": 373, "top_10_share": 38.32},
        },
        {
            "id": "cagr_growth",
            "title": "Fraud reports have grown 13.9% annually for 23 years",
            "statement": "From 326K reports in 2001 to 6.5M in 2024, consumer fraud complaints have compounded at 13.9% per year — consistently outpacing population growth, inflation, and internet adoption rates.",
            "metric": "13.9% CAGR (2001–2024)",
            "supporting_data": {"from": 325519, "to": 6471708, "years": 23},
        },
        {
            "id": "per_capita_surprise",
            "title": "DC, Nevada, and Colorado lead per-capita fraud — not California or Texas",
            "statement": "When normalized by population, the District of Columbia (1,054 per 100K), Nevada (775), and Colorado (773) show the highest fraud report rates. California and Texas rank 17th and 6th respectively despite leading in raw volume.",
            "metric": "1,054 reports per 100K (DC)",
            "supporting_data": {"dc": 1053.9, "nevada": 774.66, "colorado": 773.32},
        },
        {
            "id": "only_21_of_29_declining_share",
            "title": "Growth is concentrated — 21 of 29 categories are losing share",
            "statement": "While overall reports grew 21.7% from 2022–2024, only 8 of 29 fraud categories outpaced market growth. The surge is driven by a handful of categories, particularly Credit Bureaus (+107pp above market) and Debt Collection (+72pp).",
            "metric": "8 of 29 outperforming market",
            "supporting_data": {"market_growth": 21.7, "outperforming": 8, "underperforming": 21},
        },
        {
            "id": "investment_fraud_severity",
            "title": "Investment scams are the highest-severity fraud category",
            "statement": "Investment-related fraud carries the highest danger index score for severity, driven by an average loss far exceeding other categories. Combined with 79% of reports involving financial loss, it is the costliest category per incident.",
            "metric": "Danger Index rank #2 (severity-driven)",
            "supporting_data": {"danger_index": 0.5059, "severity_score": 1.0},
        },
        {
            "id": "payment_concentration",
            "title": "Three payment methods account for 72% of all fraud losses",
            "statement": "Bank transfers (38%), cryptocurrency (26%), and payment apps (7%) together represent 72% of total dollar losses across all identified payment methods — despite comprising only 39% of payment-identified reports.",
            "metric": "71.7% loss concentration in top 3",
            "supporting_data": {"top_3_share": 71.7},
        },
    ]

    write("insights_global.json", insights)
    print(f"  {len(insights)} global insights extracted")
    return insights


# =========================================================================
# STEP 2 — Overview Insights
# =========================================================================
def step2_overview():
    print("\n== Step 2: Overview Insights ==")

    result = {
        "section": "Overview",
        "insights": [
            {
                "title": "Scale of the Problem",
                "statement": "2.6 million fraud reports and $12.5 billion in losses were recorded in 2024 — the highest annual total in the Consumer Sentinel Network's 23-year history.",
                "metric": "6.5M total reports / $12.5B loss",
                "supporting_data": {"total_reports": 2600678, "total_loss": 12537194708, "all_reports": 6471708},
            },
            {
                "title": "The Median-Average Gap Reveals Severity Skew",
                "statement": "The median loss is $497 but the average loss per report is $4,920 — a 9.9x gap, indicating a small number of very high-value losses pull the average far above the typical victim's experience.",
                "metric": "$497 median vs $4,920 average",
                "supporting_data": {"median": 497, "average": 4919.94, "ratio": 9.9},
            },
            {
                "title": "Most Fraud Goes Unreported as Loss",
                "statement": "Only 38% of fraud reports include a dollar loss. 62% of reports either involve no financial loss or the consumer did not quantify it, suggesting the $12.5B figure significantly understates true impact.",
                "metric": "38% report a loss",
                "supporting_data": {"pct_with_loss": 38, "reports_with_loss": 987520},
            },
            {
                "title": "Relentless 23-Year Growth Trajectory",
                "statement": "Consumer fraud complaints have compounded at 13.9% annually since 2001, rising from 326K to 6.5M. The 2024 total represents a 16.6% year-over-year increase from 2023.",
                "metric": "13.9% CAGR since 2001",
                "supporting_data": {"cagr": 13.88, "yoy_2024": 16.63},
            },
            {
                "title": "Fraud Is Deeply Concentrated",
                "statement": "3 categories hold 58% of reports. 3 payment methods hold 72% of losses. 10 metro areas hold 38% of metro volume. Fraud is not evenly distributed — it clusters sharply.",
                "metric": "58% / 72% / 38% concentration",
                "supporting_data": {"cat_top3": 57.86, "pay_top3": 71.7, "msa_top10": 38.32},
            },
        ],
    }
    write("insights_overview.json", result)
    return result


# =========================================================================
# STEP 3 — Concentration Insights
# =========================================================================
def step3_concentration():
    print("\n== Step 3: Concentration Insights ==")

    result = {
        "section": "Concentration",
        "insights": [
            {
                "title": "Category Concentration: A Power Law",
                "statement": "The top 3 fraud categories generate 57.9% of all reports, and the top 10 capture 84.9%. The remaining 19 categories share just 15.1% of reports — over 1,000x fewer reports separate the #1 category from the #29.",
                "metric": "Top 3 = 57.9%, Top 10 = 84.9%",
                "supporting_data": {"top_3": 57.86, "top_10": 84.93, "long_tail": 15.07, "ratio": 1097.47},
            },
            {
                "title": "Metro Concentration Mirrors Population Centers",
                "statement": "The top 10 metro areas account for 38.3% of all metropolitan fraud reports. NYC alone contributes 7.4% of national metro volume — more than the bottom 100 metros combined.",
                "metric": "Top 10 metros = 38.3%",
                "supporting_data": {"top_10": 38.32, "top_5": 23.9, "nyc_pct": 7.39},
            },
            {
                "title": "State-Level: Five States Drive 38% of Fraud",
                "statement": "California, Texas, Florida, New York, and Pennsylvania together produce 38% of all state fraud reports. But per-capita, smaller jurisdictions like DC, Nevada, and Delaware actually have higher fraud rates.",
                "metric": "Top 5 states = 38%",
                "supporting_data": {"top_5": 37.99, "top_10": 54.27},
            },
            {
                "title": "Payment Loss Concentration Is Even Steeper",
                "statement": "Bank transfers and cryptocurrency alone account for 64.5% of all fraud dollar losses, despite representing only 20% of payment-identified reports. Loss concentration exceeds report concentration.",
                "metric": "2 methods = 64.5% of losses",
                "supporting_data": {"bank_transfer_pct": 38.44, "crypto_pct": 26.07, "combined": 64.51},
            },
        ],
    }
    write("insights_concentration.json", result)
    return result


# =========================================================================
# STEP 4 — Geography Insights
# =========================================================================
def step4_geography():
    print("\n== Step 4: Geography Insights ==")

    top_vol = geo_state["states"][:3]
    top_pc = sorted(state_pc["states"], key=lambda x: x["reports_per_100k"], reverse=True)[:3]
    top_loss_pc = sorted(state_pc["states"], key=lambda x: x["loss_per_100k"], reverse=True)[:3]

    result = {
        "section": "Geography",
        "insights": [
            {
                "title": "Volume Leaders: CA, TX, FL Account for 28% of Reports",
                "statement": f"California ({top_vol[0]['reports']:,}), Texas ({top_vol[1]['reports']:,}), and Florida ({top_vol[2]['reports']:,}) lead in raw fraud report volume. Together they account for 28.2% of all state-level fraud reports.",
                "metric": "28.2% from 3 states",
                "supporting_data": [{"state": s["state"], "reports": s["reports"]} for s in top_vol],
            },
            {
                "title": "Per Capita Tells a Different Story",
                "statement": f"When normalized by population, {top_pc[0]['state']} ({top_pc[0]['reports_per_100k']} per 100K), {top_pc[1]['state']} ({top_pc[1]['reports_per_100k']}), and {top_pc[2]['state']} ({top_pc[2]['reports_per_100k']}) have the highest fraud rates. Largest ≠ highest risk.",
                "metric": f"{top_pc[0]['reports_per_100k']} per 100K ({top_pc[0]['state']})",
                "supporting_data": [{"state": s["state"], "per_100k": s["reports_per_100k"]} for s in top_pc],
            },
            {
                "title": "Loss Density Peaks in Unexpected States",
                "statement": f"Arizona leads in loss per 100K population (${top_loss_pc[0]['loss_per_100k']:,.0f}), followed by {top_loss_pc[1]['state']} and {top_loss_pc[2]['state']}. High-loss-density states don't always overlap with high-volume states.",
                "metric": f"${top_loss_pc[0]['loss_per_100k']:,.0f} loss per 100K (Arizona)",
                "supporting_data": [{"state": s["state"], "loss_per_100k": s["loss_per_100k"]} for s in top_loss_pc],
            },
            {
                "title": "Florida Metros Dominate Per-Capita Rankings",
                "statement": "Miami (2,793 per 100K), Sebastian-Vero Beach (2,612), and Orlando (2,330) — all Florida metros — occupy 3 of the top 5 per-capita MSA positions. Florida's fraud concentration extends beyond its state-level ranking.",
                "metric": "3 of top 5 MSAs are in Florida",
                "supporting_data": {"miami": 2793, "sebastian": 2612, "orlando": 2330},
            },
        ],
    }
    write("insights_geography.json", result)
    return result


# =========================================================================
# STEP 5 — Fraud Types Insights
# =========================================================================
def step5_fraud_types():
    print("\n== Step 5: Fraud Types Insights ==")

    cats = fraud_types["categories"]
    growth = rel_growth["categories"]
    declining = [c for c in growth if not c["outperforming_market"]]
    declining_sorted = sorted(declining, key=lambda x: x["relative_growth_pct"])

    result = {
        "section": "Fraud Types",
        "insights": [
            {
                "title": "Credit Bureau Complaints Now Dominate",
                "statement": "Credit Bureaus and Information Furnishers surpassed Identity Theft as the #1 category in 2024 at 20.9% of all reports (1.35M). This category grew 129% in two years, nearly doubling its market share from 11.1% to 20.9%.",
                "metric": "20.9% share, +129% growth",
                "supporting_data": {"reports": 1353175, "growth": 129.01, "share_from": 11.11, "share_to": 20.91},
            },
            {
                "title": "Imposter Scams Remain the Top Fraud-Classified Category",
                "statement": "With 845,806 reports, Imposter Scams are the most reported pure-fraud category, led by Business Imposters (450K) and Government Imposters (266K). 22% of imposter scam reports involve financial loss.",
                "metric": "845,806 imposter scam reports",
                "supporting_data": {"reports": 845806, "pct": 13.07},
            },
            {
                "title": "Fastest Risers: Debt Collection and Cyber Threats",
                "statement": f"Debt Collection (+72pp above market) and Privacy/Cyber Threats (+35pp) are the fastest-rising categories relative to overall market growth. Both are emerging risk vectors that doubled their growth rate year-over-year.",
                "metric": "+72pp and +35pp above market",
                "supporting_data": {"debt_collection_relative": 71.79, "cyber_relative": 34.91},
            },
            {
                "title": "Fake Check Scams and Sweepstakes Are Declining",
                "statement": f"Foreign Money/Fake Check Scams (-55%) and Prizes/Sweepstakes (-34%) are the fastest-declining categories. Traditional \"Nigerian prince\" style scams are fading while digital-native fraud categories surge.",
                "metric": "-55% decline in fake check scams",
                "supporting_data": {"fake_check": -54.84, "sweepstakes": -34.48},
            },
            {
                "title": "Growth Is Concentrated in 8 of 29 Categories",
                "statement": "Only 8 of 29 tracked categories outpaced the 21.7% overall market growth from 2022–2024. The remaining 21 categories are either growing slower than the market or actively declining — the fraud landscape is consolidating.",
                "metric": "8 outperforming, 21 underperforming",
                "supporting_data": {"outperforming": 8, "underperforming": 21, "market_growth": 21.7},
            },
        ],
    }
    write("insights_fraud_types.json", result)
    return result


# =========================================================================
# STEP 6 — Loss & Payment Insights
# =========================================================================
def step6_loss_payment():
    print("\n== Step 6: Loss & Payment Insights ==")

    result = {
        "section": "Loss & Payment",
        "insights": [
            {
                "title": "Bank Transfers: Low Frequency, Catastrophic Impact",
                "statement": "Bank transfers represent only 10% of payment-identified fraud reports but 38% of total dollar losses. At $44,131 average loss per report (3.86x index), they are the single most damaging payment vector.",
                "metric": "$44,131 avg loss (3.86x index)",
                "supporting_data": {"reports": 47336, "total_loss": 2089000000, "pct_of_loss": 38.44},
            },
            {
                "title": "Social Media: The Highest-Conversion Contact Channel",
                "statement": "70% of social media-initiated fraud reports involve actual financial loss — the highest conversion rate of any channel. By comparison, email has a 11% loss rate despite being the most frequent contact method.",
                "metric": "70% conversion rate (social media)",
                "supporting_data": {"social_loss_rate": 70, "email_loss_rate": 11, "social_total_loss": 1858000000},
            },
            {
                "title": "The Heavy Tail: 12.6% of Reports Drive ~73% of Losses",
                "statement": "While 63% of loss reports fall below $1,000, the 12.6% of reports exceeding $10,000 account for approximately 73% of total dollar losses. Fraud prevention must address both high-frequency/low-value and low-frequency/high-value scenarios.",
                "metric": "12.6% → ~73% of dollar losses",
                "supporting_data": {"under_1k_pct": 63.2, "over_10k_pct": 12.63, "top_loss_share": 73.0},
            },
            {
                "title": "Crypto Losses Surpass $1.4 Billion",
                "statement": "Cryptocurrency-based fraud totaled $1.42B in losses at $30,214 average per report (2.65x index). Crypto and bank transfers together account for nearly two-thirds of all payment-identified fraud losses.",
                "metric": "$1.42B in crypto losses",
                "supporting_data": {"total": 1417000000, "avg": 30213.86, "index": 2.65},
            },
        ],
    }
    write("insights_loss_payment.json", result)
    return result


# =========================================================================
# STEP 7 — Demographics Insights
# =========================================================================
def step7_demographics():
    print("\n== Step 7: Demographics Insights ==")

    ages = demo_age["age_groups"]
    gap = demo_age["gap_metrics"]

    result = {
        "section": "Demographics",
        "insights": [
            {
                "title": "Age 60–69: Most Targeted Group by Report Volume",
                "statement": "Consumers aged 60–69 filed the most fraud reports (208,896 — 18% of total), surpassing even the 30–39 group. However, their per-incident losses ($5,649) rank only 4th among age groups.",
                "metric": "208,896 reports (18% of total)",
                "supporting_data": {"reports": 208896, "pct": 18, "loss_per_report": 5648.74},
            },
            {
                "title": "80+ Consumers: Fewest Reports, Highest Losses Per Incident",
                "statement": "The 80+ age group files only 4% of fraud reports but loses $6,169 per report — the highest of any age group and 3.4x more than the under-19 group. Their median loss of $1,650 is 8.7x the teen median of $189.",
                "metric": "$6,169 loss per report (80+)",
                "supporting_data": {"reports": 51713, "lpr": 6168.66, "median": 1650, "gap_ratio": 3.4},
            },
            {
                "title": "Younger Consumers Report More Often But Lose Less",
                "statement": "The 20–39 age range generates 30% of fraud reports but only 22% of total losses. Their reporting rate is high but severity is lower — median losses of $417–$450 versus $691–$1,650 for those over 60.",
                "metric": "30% of reports, 22% of losses (ages 20–39)",
                "supporting_data": {"pct_reports_20_39": 30, "median_20s": 417, "median_30s": 450},
            },
        ],
    }
    write("insights_demographics.json", result)
    return result


# =========================================================================
# STEP 8 — Trends Insights
# =========================================================================
def step8_trends():
    print("\n== Step 8: Trends Insights ==")

    by_type = trends["by_type"]
    latest = by_type[-1]  # 2024
    oldest = by_type[0]   # 2001

    result = {
        "section": "Trends",
        "insights": [
            {
                "title": "23-Year Growth: From 326K to 6.5M Reports",
                "statement": "The Consumer Sentinel Network has recorded a 20x increase in annual reports since 2001. Growth accelerated sharply in 2020 (+48% YoY) and has remained elevated — 2024 posted the highest total ever at 6.47M.",
                "metric": "20x increase over 23 years",
                "supporting_data": {"from": 325519, "to": 6471708, "cagr": 13.88},
            },
            {
                "title": "'Other' Reports Are the Fastest-Growing Type",
                "statement": f"'Other' reports (non-fraud, non-identity-theft) grew from 14% of total in 2001 to 42.5% in 2024, surpassing fraud as the largest report category by type. This reflects expanding Sentinel scope and new complaint types.",
                "metric": f"Other share: 14% → 42.5%",
                "supporting_data": {"other_share_2001": round(oldest["other"] / (oldest["fraud"] + oldest["identity_theft"] + oldest["other"]) * 100, 1), "other_share_2024": latest["other_share"]},
            },
            {
                "title": "Fraud Growth Is Consolidating Into Fewer Categories",
                "statement": "While overall reports grew 21.7% from 2022–2024, a single category (Credit Bureaus) accounted for more than half of the absolute increase. The top 3 fastest-growing categories together drove the majority of new volume.",
                "metric": "762K new Credit Bureau reports (52% of growth)",
                "supporting_data": {"credit_bureau_delta": 1353175 - 590872, "total_delta": 6471708 - 5317751},
            },
            {
                "title": "Identity Theft Peaked in 2021 and Is Stabilizing",
                "statement": "Identity theft reports hit 1.43M in 2021, fell to 1.04M in 2023, and rebounded slightly to 1.14M in 2024. Its share of total reports has declined from 23.4% (2021) to 17.5% (2024) as other categories grow faster.",
                "metric": "17.5% share in 2024 (down from 23.4%)",
                "supporting_data": {"peak_2021": 1434477, "current_2024": 1135291, "share_2024": 17.48},
            },
        ],
    }
    write("insights_trends.json", result)
    return result


# =========================================================================
# STEP 9 — Implications
# =========================================================================
def step9_implications():
    print("\n== Step 9: Implications ==")

    result = {
        "section": "Implications",
        "implications": [
            {
                "id": "concentrate_controls",
                "title": "Concentrate fraud controls on the top 3 categories",
                "statement": "With 58% of all reports concentrated in just 3 categories — Credit Bureaus, Identity Theft, and Imposter Scams — institutions should prioritize detection and prevention resources in these areas. Broad, unfocused fraud programs will miss the majority of activity.",
            },
            {
                "id": "monitor_bank_transfers_crypto",
                "title": "Bank transfers and cryptocurrency demand enhanced monitoring",
                "statement": "These two payment methods account for 64.5% of all dollar losses despite representing only 20% of payment-identified reports. Transaction monitoring, velocity checks, and confirmation-of-payee controls should be prioritized for these rails.",
            },
            {
                "id": "social_media_intervention",
                "title": "Social media is the critical intervention point for scam prevention",
                "statement": "With a 70% loss conversion rate and $1.86B in total losses, social media is the most effective scam delivery channel. Platform-level detection, in-feed warnings, and consumer education targeted at social media users could have outsized impact.",
            },
            {
                "id": "protect_elderly",
                "title": "Elderly consumers need targeted protection — they lose the most",
                "statement": "The 80+ age group loses 3.4x more per incident than teens and has the highest median loss ($1,650). Proactive outreach, caregiver alerts, and financial institution safeguards specifically designed for older adults would address the most vulnerable population.",
            },
            {
                "id": "watch_emerging_categories",
                "title": "Watch Debt Collection and Cyber Threats — they're accelerating",
                "statement": "These categories grew 72pp and 35pp above market rate respectively. Traditional fraud categories are declining while digital-native categories surge. Risk models and monitoring frameworks should be reweighted to reflect the shifting landscape.",
            },
            {
                "id": "per_capita_resource_allocation",
                "title": "Allocate enforcement resources by per-capita rate, not raw volume",
                "statement": "States like DC, Nevada, and Delaware have far higher fraud rates per capita than large states. Enforcement and consumer protection budgets based solely on raw complaint volume will underserve the most fraud-dense jurisdictions.",
            },
            {
                "id": "high_value_tail",
                "title": "A small tail of high-value fraud drives the majority of financial damage",
                "statement": "12.6% of loss reports (those over $10K) account for ~73% of total dollar losses. Prevention strategies must address both the high-frequency/low-loss and the low-frequency/high-loss segments — they require different interventions.",
            },
        ],
    }
    write("insights_implications.json", result)
    return result


# =========================================================================
# STEP 10 — Insight Blocks for UI
# =========================================================================
def step10_blocks():
    print("\n== Step 10: Insight Blocks ==")

    blocks = [
        {"section": "Overview", "title": "Total Fraud Reports", "insight": "2.6M fraud reports filed in 2024 — the highest year on record.", "primary_metric": "2,600,678", "supporting_metrics": ["$12.5B total loss", "38% reported a dollar loss"], "chart_type": "stat", "priority": 1},
        {"section": "Overview", "title": "Total Losses", "insight": "$12.5 billion lost by American consumers to fraud in a single year.", "primary_metric": "$12.5B", "supporting_metrics": ["$497 median loss", "$4,920 average loss"], "chart_type": "stat", "priority": 1},
        {"section": "Overview", "title": "23-Year Growth", "insight": "Reports have grown at 13.9% annually since 2001 — a 20x increase.", "primary_metric": "13.9% CAGR", "supporting_metrics": ["326K in 2001", "6.5M in 2024"], "chart_type": "line", "priority": 2},

        {"section": "Geography", "title": "Top Metro Areas", "insight": "NYC, LA, and Miami lead in raw fraud volume, accounting for 16% of all metro reports.", "primary_metric": "309K reports (NYC)", "supporting_metrics": ["192K (LA)", "171K (Miami)"], "chart_type": "map", "priority": 1},
        {"section": "Geography", "title": "Per Capita Leaders", "insight": "DC leads at 1,054 fraud reports per 100K residents — highest in the nation.", "primary_metric": "1,054 per 100K", "supporting_metrics": ["Nevada: 775", "Colorado: 773"], "chart_type": "map", "priority": 2},
        {"section": "Geography", "title": "Loss Density", "insight": "Arizona leads loss-per-capita at $4.6M per 100K population.", "primary_metric": "$4.6M per 100K", "supporting_metrics": ["DC: $4.5M", "Nevada: $4.4M"], "chart_type": "bar", "priority": 3},

        {"section": "Fraud Types", "title": "Category Dominance", "insight": "Just 3 categories generate 58% of all reports — extreme concentration.", "primary_metric": "57.9% top-3 share", "supporting_metrics": ["Credit Bureaus: 20.9%", "Identity Theft: 17.5%", "Imposter Scams: 13.1%"], "chart_type": "bar", "priority": 1},
        {"section": "Fraud Types", "title": "Credit Bureau Explosion", "insight": "Credit Bureau complaints surged 129% in two years, nearly doubling market share.", "primary_metric": "+129% growth", "supporting_metrics": ["591K → 1.35M", "Share: 11.1% → 20.9%"], "chart_type": "line", "priority": 1},
        {"section": "Fraud Types", "title": "Fastest Growing", "insight": "Debt Collection (+72pp) and Cyber Threats (+35pp) are outpacing market growth.", "primary_metric": "+72pp above market", "supporting_metrics": ["Market grew 21.7%", "Debt Collection grew 93.5%"], "chart_type": "bar", "priority": 2},
        {"section": "Fraud Types", "title": "Declining Categories", "insight": "Fake check scams (-55%) and sweepstakes fraud (-34%) are fading.", "primary_metric": "-55% decline", "supporting_metrics": ["Sweepstakes: -34%", "Tax Preparers: -40%"], "chart_type": "bar", "priority": 3},

        {"section": "Loss & Payment", "title": "Bank Transfer Severity", "insight": "Bank transfers average $44,131 per fraud report — 3.86x the overall average.", "primary_metric": "$44,131 avg loss", "supporting_metrics": ["3.86x severity index", "38.4% of total losses"], "chart_type": "bar", "priority": 1},
        {"section": "Loss & Payment", "title": "Social Media as Loss Leader", "insight": "Social media drives $1.86B in losses with a 70% loss conversion rate.", "primary_metric": "$1.86B", "supporting_metrics": ["70% conversion", "$9,945 avg loss"], "chart_type": "bar", "priority": 1},
        {"section": "Loss & Payment", "title": "Crypto Losses", "insight": "Cryptocurrency fraud totaled $1.42B — $30,214 average per incident.", "primary_metric": "$1.42B", "supporting_metrics": ["$30,214 avg loss", "2.65x severity index"], "chart_type": "bar", "priority": 2},
        {"section": "Loss & Payment", "title": "Loss Distribution", "insight": "63% of losses are under $1K, but 12.6% above $10K drive ~73% of dollar losses.", "primary_metric": "12.6% → 73% of losses", "supporting_metrics": ["63.2% under $1K", "Median: $497"], "chart_type": "bar", "priority": 2},
        {"section": "Loss & Payment", "title": "Payment Concentration", "insight": "Top 3 payment methods hold 72% of all fraud dollar losses.", "primary_metric": "71.7% concentration", "supporting_metrics": ["Bank Transfer: 38%", "Crypto: 26%", "Payment App: 7%"], "chart_type": "bar", "priority": 3},

        {"section": "Demographics", "title": "Most Targeted Age Group", "insight": "Ages 60–69 file the most fraud reports — 18% of all reports with age data.", "primary_metric": "208,896 reports", "supporting_metrics": ["18% of total", "$5,649 loss/report"], "chart_type": "bar", "priority": 2},
        {"section": "Demographics", "title": "Seniors Lose the Most", "insight": "Consumers 80+ lose $6,169 per incident — 3.4x more than teens.", "primary_metric": "$6,169 per report", "supporting_metrics": ["Median: $1,650", "3.4x gap ratio"], "chart_type": "bar", "priority": 1},
        {"section": "Demographics", "title": "Age-Loss Gradient", "insight": "Loss per report climbs steadily with age — from $1,813 (under 19) to $6,169 (80+).", "primary_metric": "3.4x gradient", "supporting_metrics": ["Under 19: $1,813", "80+: $6,169"], "chart_type": "line", "priority": 2},

        {"section": "Trends", "title": "Report Type Shift", "insight": "'Other' reports overtook fraud in 2024, now 42.5% of total — up from 14% in 2001.", "primary_metric": "42.5% Other share", "supporting_metrics": ["Fraud: 40%", "ID Theft: 17.5%"], "chart_type": "line", "priority": 2},
        {"section": "Trends", "title": "Growth Consolidation", "insight": "One category (Credit Bureaus) accounts for 52% of the total report increase from 2022–2024.", "primary_metric": "762K new reports", "supporting_metrics": ["Total delta: 1.15M", "21.7% market growth"], "chart_type": "bar", "priority": 2},

        {"section": "Danger Index", "title": "Highest Danger: Credit Bureaus", "insight": "Credit Bureaus rank #1 on the danger index — max frequency and max growth scores.", "primary_metric": "0.60 danger index", "supporting_metrics": ["Frequency: 1.00", "Growth: 1.00"], "chart_type": "bar", "priority": 2},
        {"section": "Danger Index", "title": "Highest Severity: Investment Fraud", "insight": "Investment fraud scores 1.0 on severity — the highest per-incident cost of any category.", "primary_metric": "0.51 danger index", "supporting_metrics": ["Severity: 1.00", "79% report a loss"], "chart_type": "bar", "priority": 2},
    ]

    write("insight_blocks.json", blocks)
    print(f"  {len(blocks)} insight blocks generated")
    return blocks


# =========================================================================
# Main
# =========================================================================
def main():
    print("=" * 64)
    print("  FTC CSN 2024 — Insight Extraction & Report Structuring")
    print("=" * 64)

    g = step1_global()
    step2_overview()
    step3_concentration()
    step4_geography()
    step5_fraud_types()
    step6_loss_payment()
    step7_demographics()
    step8_trends()
    step9_implications()
    blocks = step10_blocks()

    print("\n" + "=" * 64)
    print("  FINAL SUMMARY")
    print("=" * 64)

    print("\n  Top 5 Insights:")
    for i, ins in enumerate(g[:5], 1):
        print(f"    {i}. {ins['title']} [{ins['metric']}]")

    print(f"\n  Strongest Ratio:          3.86x (bank transfer severity index)")
    print(f"  Strongest Growth Signal:  +129% Credit Bureau reports (107pp above market)")
    print(f"  Strongest Concentration:  84.9% of reports in top 10 categories")

    print(f"\n  Files written to: report/")
    print(f"  Total blocks: {len(blocks)}")
    print("=" * 64)


if __name__ == "__main__":
    main()
