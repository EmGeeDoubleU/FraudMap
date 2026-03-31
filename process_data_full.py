"""
FTC Consumer Sentinel Network 2024 — Advanced Analytics Pipeline
Computes core + advanced metrics across all dimensions.
Outputs structured JSON to /processed_full/.
"""

import json
import math
import re
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent
CSV_DIR = BASE / "data" / "CSVs"
OUT_DIR = BASE / "processed_full"
OUT_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_num(val):
    if pd.isna(val):
        return 0
    s = str(val).strip().rstrip("%")
    if s == "":
        return 0
    multiplier = 1
    if s.upper().endswith("M"):
        multiplier = 1_000_000
        s = s[:-1]
    elif s.upper().endswith("B"):
        multiplier = 1_000_000_000
        s = s[:-1]
    s = s.replace("$", "").replace(",", "").strip()
    try:
        return float(s) * multiplier
    except ValueError:
        return 0


def write_json(name, data):
    path = OUT_DIR / name
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  -> {path.relative_to(BASE)}")


def rcsv(filepath, header_row=2, **kw):
    return pd.read_csv(filepath, header=header_row, encoding="latin-1", **kw)


def top_n_share(values, n):
    """Share of the top-n items relative to total."""
    s = sorted(values, reverse=True)
    total = sum(s)
    return round(sum(s[:n]) / total * 100, 2) if total else 0


def safe_div(a, b):
    return round(a / b, 2) if b else 0


# =========================================================================
# STEP 1 — Overview (Core + Advanced)
# =========================================================================
def step1_overview():
    print("\n== Step 1: Overview ==")

    # --- from state file (fraud-only reports with loss data) ---
    df = rcsv(CSV_DIR / "2024_CSN_State_Fraud_Reports_and_Losses.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["State"].notna() & (df["State"].str.strip() != "")]
    df = df[~df["State"].str.startswith("The ")]
    df = df[~df["State"].str.startswith("Source")]

    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["total_loss"] = df["Total $ Loss"].apply(parse_num)
    df["median_loss"] = df["Median $ Loss"].apply(parse_num)
    df["pct_loss"] = df["% Reporting $ Loss"].apply(parse_num)

    total_reports = int(df["reports"].sum())
    total_loss = float(df["total_loss"].sum())
    avg_loss = safe_div(total_loss, total_reports)
    median_loss = round(float(df["median_loss"].median()), 2)
    avg_pct_reporting_loss = round(float(df["pct_loss"].mean()), 2)

    # --- from amount-lost file (cross-check + distribution) ---
    with open(CSV_DIR / "2024_CSN_Fraud_Reports_by_Amount_Lost.csv", encoding="latin-1") as f:
        raw = f.read()
    m_total_loss = re.search(r'Total \$ Loss[",\s]*"\$?([\d,]+)', raw)
    m_reports_loss = re.search(r'Reports with \$ Loss[",\s]*"?([\d,]+)', raw)
    m_total_fraud = re.search(r'Number of Fraud Reports[",\s]*"?([\d,]+)', raw)
    m_median = re.search(r'Median \$ Loss[",\s]*\$?([\d,]+)', raw)

    cross_total_loss = int(m_total_loss.group(1).replace(",", "")) if m_total_loss else 0
    reports_with_loss = int(m_reports_loss.group(1).replace(",", "")) if m_reports_loss else 0
    total_fraud_reports = int(m_total_fraud.group(1).replace(",", "")) if m_total_fraud else 0
    official_median = int(m_median.group(1).replace(",", "")) if m_median else 0
    pct_reports_with_loss = safe_div(reports_with_loss, total_fraud_reports) * 100

    # bucket parsing for concentration
    broad = []
    section = None
    for line in raw.splitlines():
        s = line.strip()
        if "Reported Fraud Losses in $1 - $10,000" in s:
            section = "broad"
            continue
        if "Reported Fraud Losses in $1 - $1,000 Range" in s:
            break
        if section:
            m2 = re.match(r'^"?(\$[\d,]+\s*-\s*\$[\d,]+|More than \$[\d,]+)"?,"?([\d,]+)"?', s)
            if m2:
                broad.append({"range": m2.group(1).strip(), "reports": int(m2.group(2).replace(",", ""))})

    total_bucket_reports = sum(b["reports"] for b in broad)
    lowest_bucket_pct = round(broad[0]["reports"] / total_bucket_reports * 100, 2) if broad and total_bucket_reports else 0
    highest_bucket_pct = round(broad[-1]["reports"] / total_bucket_reports * 100, 2) if broad and total_bucket_reports else 0

    overview = {
        "total_fraud_reports": total_fraud_reports,
        "total_reports_from_states": total_reports,
        "total_loss": total_loss,
        "cross_check_total_loss": cross_total_loss,
        "avg_loss_per_report": avg_loss,
        "median_loss": median_loss,
        "official_median_loss": official_median,
        "reports_with_loss": reports_with_loss,
        "pct_reports_with_loss": round(pct_reports_with_loss, 2),
        "avg_pct_reporting_loss_across_states": avg_pct_reporting_loss,
        "loss_concentration": {
            "lowest_bucket_pct_of_reports": round(lowest_bucket_pct, 2),
            "highest_bucket_pct_of_reports": round(highest_bucket_pct, 2),
            "ratio_highest_to_lowest": safe_div(
                broad[-1]["reports"] if broad else 0,
                broad[0]["reports"] if broad else 1
            ),
        },
    }
    write_json("overview.json", overview)
    print(f"  total_fraud_reports = {total_fraud_reports:,}")
    print(f"  total_loss (states) = ${total_loss:,.0f}")
    print(f"  total_loss (official)= ${cross_total_loss:,}")
    return overview


# =========================================================================
# STEP 2 — Geography MSA
# =========================================================================
def step2_geography_msa():
    print("\n== Step 2: Geography MSA ==")
    msa_dir = CSV_DIR / "State MSA Fraud and Other data"
    frames = []
    for fp in sorted(msa_dir.glob("*.csv")):
        tmp = pd.read_csv(fp, header=2, encoding="latin-1")
        tmp.columns = [c.strip() for c in tmp.columns]
        col_r = [c for c in tmp.columns if "Reports" in c or "reports" in c][0]
        col_m = [c for c in tmp.columns if "Metropolitan" in c or "metro" in c.lower()][0]
        tmp = tmp.rename(columns={col_m: "metro", col_r: "rr"})
        tmp = tmp[["metro", "rr"]]
        tmp = tmp[tmp["metro"].notna() & (~tmp["metro"].str.contains("Source|Metropolitan Areas are", na=False))]
        tmp["reports"] = tmp["rr"].apply(parse_num).astype(int)
        frames.append(tmp[["metro", "reports"]])

    combined = pd.concat(frames, ignore_index=True)
    grouped = combined.groupby("metro", as_index=False)["reports"].max()
    grouped = grouped.sort_values("reports", ascending=False).reset_index(drop=True)

    total = int(grouped["reports"].sum())
    grouped["rank"] = range(1, len(grouped) + 1)
    grouped["pct_of_total"] = (grouped["reports"] / total * 100).round(2)

    reps = grouped["reports"].tolist()
    top3 = top_n_share(reps, 3)
    top5 = top_n_share(reps, 5)
    top10 = top_n_share(reps, 10)

    items = grouped[["metro", "reports", "pct_of_total", "rank"]].to_dict(orient="records")

    result = {
        "total_msa_reports": total,
        "metro_count": len(items),
        "concentration": {
            "top_3_share": top3,
            "top_5_share": top5,
            "top_10_share": top10,
            "long_tail_share": round(100 - top10, 2),
            "concentration_index": top10,
        },
        "metros": items,
    }
    write_json("geography_msa.json", result)
    print(f"  {len(items)} metros | top-10 share = {top10}%")
    for r in items[:5]:
        print(f"    #{r['rank']} {r['metro']}: {r['reports']:,} ({r['pct_of_total']}%)")
    return result


# =========================================================================
# STEP 3 — Geography State
# =========================================================================
def step3_geography_state():
    print("\n== Step 3: Geography State ==")
    df = rcsv(CSV_DIR / "2024_CSN_State_Fraud_Reports_and_Losses.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["State"].notna() & (df["State"].str.strip() != "")]
    df = df[~df["State"].str.startswith("The ")]
    df = df[~df["State"].str.startswith("Source")]

    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["total_loss"] = df["Total $ Loss"].apply(parse_num)
    df["median_loss"] = df["Median $ Loss"].apply(parse_num)

    total = int(df["reports"].sum())
    df["pct_of_total"] = (df["reports"] / total * 100).round(2)
    df["loss_per_report"] = (df["total_loss"] / df["reports"]).round(2)

    df = df.sort_values("reports", ascending=False).reset_index(drop=True)
    df["rank_by_reports"] = range(1, len(df) + 1)
    df["rank_by_loss_per_report"] = df["loss_per_report"].rank(ascending=False, method="min").astype(int)

    reps = df["reports"].tolist()

    items = df[["State", "reports", "total_loss", "median_loss", "pct_of_total",
                 "loss_per_report", "rank_by_reports", "rank_by_loss_per_report"]].rename(
        columns={"State": "state"}).to_dict(orient="records")

    result = {
        "total_state_reports": total,
        "state_count": len(items),
        "concentration": {
            "top_5_share": top_n_share(reps, 5),
            "top_10_share": top_n_share(reps, 10),
        },
        "states": items,
    }
    write_json("geography_state.json", result)
    print(f"  {len(items)} states | top-5 share = {result['concentration']['top_5_share']}%")
    return result


# =========================================================================
# STEP 4 — Fraud Types
# =========================================================================
def step4_fraud_types():
    print("\n== Step 4: Fraud Types ==")
    df = rcsv(CSV_DIR / "2024_CSN_Report_Categories.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["Rank"].notna() & df["Rank"].apply(lambda v: str(v).strip().isdigit())]

    df["rank"] = df["Rank"].astype(int)
    df["category"] = df["Category"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["pct"] = df["Percentage"].apply(lambda v: round(parse_num(v), 2))

    reps = df["reports"].tolist()

    items = df[["category", "reports", "pct", "rank"]].to_dict(orient="records")

    result = {
        "category_count": len(items),
        "concentration": {
            "top_3_share": top_n_share(reps, 3),
            "top_5_share": top_n_share(reps, 5),
            "top_10_share": top_n_share(reps, 10),
            "long_tail_share": round(100 - top_n_share(reps, 10), 2),
            "concentration_index": top_n_share(reps, 10),
        },
        "categories": items,
    }
    write_json("fraud_types.json", result)
    print(f"  {len(items)} categories | top-3 share = {result['concentration']['top_3_share']}%")
    for r in items[:5]:
        print(f"    #{r['rank']} {r['category']}: {r['reports']:,} ({r['pct']}%)")
    return result


# =========================================================================
# STEP 5 — Fraud Type Trends (3-year)
# =========================================================================
def step5_fraud_type_trends():
    print("\n== Step 5: Fraud Type Trends ==")
    df = rcsv(CSV_DIR / "2024_CSN_Report_Categories_over_Three_Years.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["Year"].notna() & df["Year"].apply(lambda v: str(v).strip().isdigit())]
    df = df[df["Category"].notna() & (df["Category"].str.strip() != "")]
    df = df[~df["Category"].str.startswith("Percentages")]
    df = df[~df["Category"].str.startswith("Source")]
    df = df[df["Category"].str.strip() != "Unspecified Reports"]
    df = df[df["Category"].str.strip() != "Miscellaneous Reports"]

    df["year"] = df["Year"].astype(int)
    df["category"] = df["Category"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["pct"] = df["Percentage"].apply(lambda v: round(parse_num(v), 2))

    # year-over-year per category
    yearly_totals = {2022: 5_317_751, 2023: 5_548_815, 2024: 6_471_708}
    cats = sorted(df["category"].unique())
    trend_rows = []

    for cat in cats:
        sub = df[df["category"] == cat].sort_values("year")
        years_data = {int(r["year"]): int(r["reports"]) for _, r in sub.iterrows()}
        r22 = years_data.get(2022, 0)
        r23 = years_data.get(2023, 0)
        r24 = years_data.get(2024, 0)

        yoy_23 = round((r23 - r22) / r22 * 100, 2) if r22 else None
        yoy_24 = round((r24 - r23) / r23 * 100, 2) if r23 else None
        change_22_24 = round((r24 - r22) / r22 * 100, 2) if r22 else None

        share_22 = round(r22 / yearly_totals.get(2022, 1) * 100, 2)
        share_24 = round(r24 / yearly_totals.get(2024, 1) * 100, 2)
        share_change = round(share_24 - share_22, 2)

        trend_rows.append({
            "category": cat,
            "reports_2022": r22,
            "reports_2023": r23,
            "reports_2024": r24,
            "yoy_2023_pct": yoy_23,
            "yoy_2024_pct": yoy_24,
            "change_2022_2024_pct": change_22_24,
            "share_2022_pct": share_22,
            "share_2024_pct": share_24,
            "share_change_pp": share_change,
        })

    valid = [r for r in trend_rows if r["change_2022_2024_pct"] is not None]
    fastest = sorted(valid, key=lambda r: r["change_2022_2024_pct"], reverse=True)[:10]
    declining = sorted(valid, key=lambda r: r["change_2022_2024_pct"])[:10]

    result = {
        "categories": trend_rows,
        "fastest_growing": [{"category": r["category"], "change_pct": r["change_2022_2024_pct"]} for r in fastest],
        "most_declining": [{"category": r["category"], "change_pct": r["change_2022_2024_pct"]} for r in declining],
    }
    write_json("fraud_types_trends.json", result)
    print(f"  {len(trend_rows)} categories tracked across 3 years")
    print("  Fastest growing:")
    for r in fastest[:3]:
        print(f"    {r['category']}: +{r['change_2022_2024_pct']}%")
    print("  Most declining:")
    for r in declining[:3]:
        print(f"    {r['category']}: {r['change_2022_2024_pct']}%")
    return result


# =========================================================================
# STEP 6 — Loss & Payment Methods
# =========================================================================
def step6_loss_payment():
    print("\n== Step 6: Loss & Payment ==")
    df = rcsv(CSV_DIR / "2024_CSN_Fraud_Reports_by_Payment_Method.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["Payment Method"].notna() & (df["Payment Method"].str.strip() != "")]
    df = df[~df["Payment Method"].str.contains("Number of|# of|Source", na=False)]

    df["method"] = df["Payment Method"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["total_loss"] = df["Total $ Loss"].apply(parse_num)

    total_loss_all = df["total_loss"].sum()
    total_reports_all = df["reports"].sum()
    overall_avg = safe_div(total_loss_all, total_reports_all)

    df["pct_of_total_loss"] = (df["total_loss"] / total_loss_all * 100).round(2)
    df["avg_loss_per_report"] = (df["total_loss"] / df["reports"]).round(2)
    df["loss_per_report_index"] = (df["avg_loss_per_report"] / overall_avg).round(2) if overall_avg else 0

    df = df.sort_values("total_loss", ascending=False).reset_index(drop=True)
    df["rank_by_total_loss"] = range(1, len(df) + 1)
    df["rank_by_avg_loss"] = df["avg_loss_per_report"].rank(ascending=False, method="min").astype(int)

    losses = df["total_loss"].tolist()
    top3_loss_share = top_n_share(losses, 3)

    items = df[["method", "reports", "total_loss", "pct_of_total_loss",
                 "avg_loss_per_report", "loss_per_report_index",
                 "rank_by_total_loss", "rank_by_avg_loss"]].to_dict(orient="records")

    result = {
        "total_loss_all_methods": total_loss_all,
        "overall_avg_loss_per_report": overall_avg,
        "top_3_loss_method_share": top3_loss_share,
        "methods": items,
    }
    write_json("loss_payment.json", result)
    top = items[0]
    print(f"  Top method: {top['method']} (${top['total_loss']:,.0f}) | top-3 share = {top3_loss_share}%")
    return result


# =========================================================================
# STEP 7 — Loss Distribution
# =========================================================================
def step7_loss_distribution():
    print("\n== Step 7: Loss Distribution ==")
    with open(CSV_DIR / "2024_CSN_Fraud_Reports_by_Amount_Lost.csv", encoding="latin-1") as f:
        content = f.read()

    broad = []
    fine = []
    section = None

    for line in content.splitlines():
        s = line.strip()
        if not s or s == ",":
            continue
        if "Reported Fraud Losses in $1 - $10,000" in s:
            section = "broad"
            continue
        if "Reported Fraud Losses in $1 - $1,000 Range" in s:
            section = "fine"
            continue
        if section is None:
            continue
        m = re.match(r'^"?(\$[\d,]+\s*-\s*\$[\d,]+|More than \$[\d,]+)"?,"?([\d,]+)"?', s)
        if m:
            rng = m.group(1).strip()
            cnt = int(m.group(2).replace(",", ""))
            target = broad if section == "broad" else fine
            target.append({"range": rng, "reports": cnt})

    # cumulative distribution for broad
    total_broad = sum(b["reports"] for b in broad)
    cum = 0
    for b in broad:
        cum += b["reports"]
        b["pct"] = round(b["reports"] / total_broad * 100, 2)
        b["cumulative_pct"] = round(cum / total_broad * 100, 2)

    total_fine = sum(b["reports"] for b in fine)
    cum = 0
    for b in fine:
        cum += b["reports"]
        b["pct"] = round(b["reports"] / total_fine * 100, 2)
        b["cumulative_pct"] = round(cum / total_fine * 100, 2)

    under_1k = broad[0]["reports"] if broad else 0
    over_10k = broad[-1]["reports"] if broad else 0

    # approximate loss share from buckets (midpoint * count)
    midpoints = [500, 1500, 2500, 3500, 4500, 5500, 6500, 7500, 8500, 9500, 25000]
    estimated_loss = sum(midpoints[i] * broad[i]["reports"] for i in range(min(len(midpoints), len(broad))))
    top_bucket_loss_share = safe_div(midpoints[-1] * over_10k, estimated_loss) * 100 if estimated_loss else 0

    result = {
        "total_reports_with_loss": total_broad,
        "pct_under_1k": round(under_1k / total_broad * 100, 2) if total_broad else 0,
        "pct_over_10k": round(over_10k / total_broad * 100, 2) if total_broad else 0,
        "estimated_total_loss_from_buckets": round(estimated_loss),
        "approx_top_bucket_loss_share_pct": round(top_bucket_loss_share, 2),
        "broad": broad,
        "fine": fine,
    }
    write_json("loss_distribution.json", result)
    print(f"  Under $1K: {result['pct_under_1k']}% | Over $10K: {result['pct_over_10k']}%")
    return result


# =========================================================================
# STEP 8 — Demographics Age
# =========================================================================
def step8_demographics_age():
    print("\n== Step 8: Demographics Age ==")
    df = rcsv(CSV_DIR / "2024_CSN_Reported_Frauds_and_Losses_by_Age.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["Age Range"].notna() & (df["Age Range"].str.strip() != "")]
    df = df[~df["Age Range"].str.contains("Percentage|Of the|Source", na=False)]

    df["age_group"] = df["Age Range"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["pct"] = df["Percentage"].apply(lambda v: round(parse_num(v), 2))
    df["total_loss"] = df["Total $ Lost"].apply(parse_num)
    df["median_loss"] = df["Median $ Loss"].apply(parse_num)
    df["pct_reporting_loss"] = df["Percentage Reporting $ Loss"].apply(lambda v: round(parse_num(v), 2))
    df["loss_per_report"] = (df["total_loss"] / df["reports"]).round(2)

    overall_lpr = safe_div(df["total_loss"].sum(), df["reports"].sum())
    df["loss_per_report_index"] = (df["loss_per_report"] / overall_lpr).round(2) if overall_lpr else 0

    df["rank_by_reports"] = df["reports"].rank(ascending=False, method="min").astype(int)
    df["rank_by_loss_per_report"] = df["loss_per_report"].rank(ascending=False, method="min").astype(int)

    items = df[["age_group", "reports", "pct", "total_loss", "median_loss",
                 "pct_reporting_loss", "loss_per_report", "loss_per_report_index",
                 "rank_by_reports", "rank_by_loss_per_report"]].to_dict(orient="records")

    max_lpr = df["loss_per_report"].max()
    min_lpr = df["loss_per_report"].min()
    median_lpr = df["loss_per_report"].median()

    result = {
        "age_groups": items,
        "gap_metrics": {
            "highest_loss_per_report": round(max_lpr, 2),
            "lowest_loss_per_report": round(min_lpr, 2),
            "ratio_highest_to_lowest": safe_div(max_lpr, min_lpr),
            "median_loss_per_report": round(median_lpr, 2),
        },
    }
    write_json("demographics_age.json", result)
    print(f"  {len(items)} age groups | loss/report gap ratio: {result['gap_metrics']['ratio_highest_to_lowest']}x")
    return result


# =========================================================================
# STEP 9 — Trends
# =========================================================================
def step9_trends():
    print("\n== Step 9: Trends ==")

    # --- yearly totals ---
    df_t = rcsv(CSV_DIR / "2024_CSN_Report_Count.csv")
    df_t.columns = [c.strip() for c in df_t.columns]
    df_t = df_t[df_t["Year"].notna() & df_t["Year"].apply(lambda v: str(v).strip().isdigit())]
    df_t["year"] = df_t["Year"].astype(int)
    df_t["reports"] = df_t["# of Reports"].apply(parse_num).astype(int)
    df_t = df_t.sort_values("year").reset_index(drop=True)

    yearly = df_t[["year", "reports"]].to_dict(orient="records")

    # YoY growth + acceleration
    yoy = []
    for i in range(1, len(df_t)):
        prev = df_t.iloc[i - 1]["reports"]
        curr = df_t.iloc[i]["reports"]
        growth = round((curr - prev) / prev * 100, 2) if prev else 0
        prev_growth = yoy[-1]["yoy_growth_pct"] if yoy else 0
        accel = round(growth - prev_growth, 2)
        yoy.append({
            "year": int(df_t.iloc[i]["year"]),
            "reports": int(curr),
            "yoy_growth_pct": growth,
            "acceleration_pp": accel,
        })

    # CAGR 2001-2024
    r_first = df_t.iloc[0]["reports"]
    r_last = df_t.iloc[-1]["reports"]
    n_years = int(df_t.iloc[-1]["year"] - df_t.iloc[0]["year"])
    cagr = round((math.pow(r_last / r_first, 1 / n_years) - 1) * 100, 2) if r_first and n_years else 0

    # --- by type ---
    df_type = rcsv(CSV_DIR / "2024_CSN_Number_of_Reports_by_Type.csv")
    df_type.columns = [c.strip() for c in df_type.columns]
    df_type = df_type[df_type["Year"].notna() & df_type["Year"].apply(lambda v: str(v).strip().isdigit())]
    df_type["year"] = df_type["Year"].astype(int)
    df_type["fraud"] = df_type["Fraud"].apply(parse_num).astype(int)
    df_type["identity_theft"] = df_type["Identity Theft"].apply(parse_num).astype(int)
    df_type["other"] = df_type["Other"].apply(parse_num).astype(int)
    df_type = df_type.sort_values("year")

    df_type["total"] = df_type["fraud"] + df_type["identity_theft"] + df_type["other"]
    df_type["fraud_share"] = (df_type["fraud"] / df_type["total"] * 100).round(2)
    df_type["id_theft_share"] = (df_type["identity_theft"] / df_type["total"] * 100).round(2)
    df_type["other_share"] = (df_type["other"] / df_type["total"] * 100).round(2)

    by_type = df_type[["year", "fraud", "identity_theft", "other",
                        "fraud_share", "id_theft_share", "other_share"]].to_dict(orient="records")

    result = {
        "yearly_totals": yearly,
        "yoy_growth": yoy,
        "cagr_2001_2024_pct": cagr,
        "by_type": by_type,
    }
    write_json("trends.json", result)
    print(f"  {len(yearly)} years | CAGR = {cagr}%")
    return result


# =========================================================================
# STEP 10 — Derived Metrics
# =========================================================================
def step10_derived(overview, msa, state, fraud, payment, age, trends):
    print("\n== Step 10: Derived Metrics ==")

    msa_items = msa["metros"]
    state_items = state["states"]
    cat_items = fraud["categories"]
    pay_items = payment["methods"]
    age_items = age["age_groups"]

    top_metro = msa_items[0] if msa_items else {}
    top_cat = cat_items[0] if cat_items else {}
    top_pay = max(pay_items, key=lambda x: x["total_loss"]) if pay_items else {}
    highest_lpr_age = max(age_items, key=lambda x: x["loss_per_report"]) if age_items else {}
    most_reports_age = max(age_items, key=lambda x: x["reports"]) if age_items else {}

    # state with highest loss_per_report
    top_lpr_state = max(state_items, key=lambda x: x["loss_per_report"]) if state_items else {}

    derived = {
        "concentration": {
            "msa_top_10_share": msa["concentration"]["top_10_share"],
            "msa_top_5_share": msa["concentration"]["top_5_share"],
            "category_top_10_share": fraud["concentration"]["top_10_share"],
            "category_top_3_share": fraud["concentration"]["top_3_share"],
            "state_top_5_share": state["concentration"]["top_5_share"],
            "state_top_10_share": state["concentration"]["top_10_share"],
            "payment_top_3_loss_share": payment["top_3_loss_method_share"],
        },
        "inequality": {
            "top_metro_reports": top_metro.get("reports", 0),
            "bottom_metro_reports": msa_items[-1].get("reports", 0) if msa_items else 0,
            "top_to_bottom_metro_ratio": safe_div(
                top_metro.get("reports", 0),
                msa_items[-1].get("reports", 1) if msa_items else 1
            ),
            "top_category_reports": top_cat.get("reports", 0),
            "bottom_category_reports": cat_items[-1].get("reports", 0) if cat_items else 0,
            "top_to_bottom_category_ratio": safe_div(
                top_cat.get("reports", 0),
                cat_items[-1].get("reports", 1) if cat_items else 1
            ),
        },
        "severity": {
            "loss_per_report_global": overview["avg_loss_per_report"],
            "highest_loss_per_report_age_group": {
                "age_group": highest_lpr_age.get("age_group", ""),
                "loss_per_report": highest_lpr_age.get("loss_per_report", 0),
            },
            "highest_loss_per_report_state": {
                "state": top_lpr_state.get("state", ""),
                "loss_per_report": top_lpr_state.get("loss_per_report", 0),
            },
            "highest_avg_loss_payment_method": {
                "method": max(pay_items, key=lambda x: x["avg_loss_per_report"]).get("method", "") if pay_items else "",
                "avg_loss": max(pay_items, key=lambda x: x["avg_loss_per_report"]).get("avg_loss_per_report", 0) if pay_items else 0,
            },
        },
        "headlines": {
            "top_metro": {
                "name": top_metro.get("metro", ""),
                "reports": top_metro.get("reports", 0),
                "pct": top_metro.get("pct_of_total", 0),
            },
            "top_category": {
                "name": top_cat.get("category", ""),
                "reports": top_cat.get("reports", 0),
                "pct": top_cat.get("pct", 0),
            },
            "top_payment_method": {
                "name": top_pay.get("method", ""),
                "total_loss": top_pay.get("total_loss", 0),
                "pct_of_loss": top_pay.get("pct_of_total_loss", 0),
            },
            "most_vulnerable_age": {
                "age_group": highest_lpr_age.get("age_group", ""),
                "loss_per_report": highest_lpr_age.get("loss_per_report", 0),
                "median_loss": highest_lpr_age.get("median_loss", 0),
            },
            "most_targeted_age": {
                "age_group": most_reports_age.get("age_group", ""),
                "reports": most_reports_age.get("reports", 0),
            },
            "total_reports": overview["total_fraud_reports"],
            "total_loss": overview["cross_check_total_loss"],
            "cagr": trends["cagr_2001_2024_pct"],
        },
    }
    write_json("derived_metrics.json", derived)
    print("  Derived metrics written.")
    return derived


# =========================================================================
# Main
# =========================================================================
def main():
    print("=" * 64)
    print("  FTC CSN 2024 — Advanced Analytics Pipeline")
    print("=" * 64)

    overview = step1_overview()
    msa      = step2_geography_msa()
    state    = step3_geography_state()
    fraud    = step4_fraud_types()
    ftrends  = step5_fraud_type_trends()
    payment  = step6_loss_payment()
    loss_d   = step7_loss_distribution()
    age      = step8_demographics_age()
    trends   = step9_trends()
    derived  = step10_derived(overview, msa, state, fraud, payment, age, trends)

    # ── Final summary ──
    print("\n" + "=" * 64)
    print("  FINAL SUMMARY")
    print("=" * 64)

    print(f"\n  Total Fraud Reports:  {overview['total_fraud_reports']:,}")
    print(f"  Total Loss (official): ${overview['cross_check_total_loss']:,}")

    print("\n  Top 5 Metros:")
    for r in msa["metros"][:5]:
        print(f"    #{r['rank']} {r['metro']}: {r['reports']:,} ({r['pct_of_total']}%)")

    print("\n  Top 5 Categories:")
    for r in fraud["categories"][:5]:
        print(f"    #{r['rank']} {r['category']}: {r['reports']:,} ({r['pct']}%)")

    print(f"\n  Top Payment Method (by loss): "
          f"{payment['methods'][0]['method']} "
          f"(${payment['methods'][0]['total_loss']:,.0f})")

    print(f"\n  Category Concentration (top-10): "
          f"{fraud['concentration']['top_10_share']}%")
    print(f"  Metro Concentration (top-10):    "
          f"{msa['concentration']['top_10_share']}%")

    print(f"\n  All files written to: processed_full/")
    print("=" * 64)


if __name__ == "__main__":
    main()
