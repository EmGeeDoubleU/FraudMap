"""
FTC Consumer Sentinel Network 2024 — Data Processing Pipeline
Reads raw CSVs, computes key metrics, outputs clean JSON for charts.
"""

import json
import os
import re
import glob
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent
CSV_DIR = BASE / "data" / "CSVs"
OUT_DIR = BASE / "processed"
OUT_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_num(val):
    """Turn '1,234' or '$1,234' or '$275M' or '38%' into a number."""
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
    print(f"  ✓ wrote {path.relative_to(BASE)}")


def read_csv_smart(filepath, header_row=2, **kwargs):
    """Read a CSN csv — skip the title row and blank row (rows 0,1)."""
    return pd.read_csv(filepath, header=header_row, encoding="latin-1", **kwargs)


# =========================================================================
# STEP 1 — Overview Metrics
# =========================================================================
def step1_overview():
    print("\n── Step 1: Overview ──")
    df = read_csv_smart(CSV_DIR / "2024_CSN_State_Fraud_Reports_and_Losses.csv")
    df.columns = [c.strip() for c in df.columns]

    # drop footer rows
    df = df[df["State"].notna() & (df["State"].str.strip() != "")]
    df = df[~df["State"].str.startswith("The ")]
    df = df[~df["State"].str.startswith("Source")]

    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["total_loss"] = df["Total $ Loss"].apply(parse_num)
    df["median_loss"] = df["Median $ Loss"].apply(parse_num)

    total_reports = int(df["reports"].sum())
    total_loss = float(df["total_loss"].sum())
    avg_loss = round(total_loss / total_reports, 2) if total_reports else 0
    median_loss = float(df["median_loss"].median())

    overview = {
        "total_reports": total_reports,
        "total_loss": total_loss,
        "avg_loss_per_report": avg_loss,
        "median_loss": round(median_loss, 2),
    }
    write_json("overview.json", overview)
    print(f"  total_reports = {total_reports:,}")
    print(f"  total_loss    = ${total_loss:,.0f}")
    return overview


# =========================================================================
# STEP 2 — Geography MSA
# =========================================================================
def step2_geography_msa():
    print("\n── Step 2: Geography MSA ──")
    msa_dir = CSV_DIR / "State MSA Fraud and Other data"
    frames = []
    for fp in sorted(msa_dir.glob("*.csv")):
        tmp = pd.read_csv(fp, header=2)
        tmp.columns = [c.strip() for c in tmp.columns]
        col_reports = [c for c in tmp.columns if "reports" in c.lower() or c == "# of Reports"][0]
        col_metro = [c for c in tmp.columns if "metropolitan" in c.lower() or "metro" in c.lower()][0]
        tmp = tmp.rename(columns={col_metro: "metro", col_reports: "reports_raw"})
        tmp = tmp[["metro", "reports_raw"]]
        tmp = tmp[tmp["metro"].notna() & (~tmp["metro"].str.contains("Source|Metropolitan Areas are", na=False))]
        tmp["reports"] = tmp["reports_raw"].apply(parse_num).astype(int)
        frames.append(tmp[["metro", "reports"]])

    combined = pd.concat(frames, ignore_index=True)
    grouped = combined.groupby("metro", as_index=False)["reports"].max()

    total = int(grouped["reports"].sum())
    grouped = grouped.sort_values("reports", ascending=False).reset_index(drop=True)
    grouped["rank"] = range(1, len(grouped) + 1)
    grouped["pct_of_total"] = (grouped["reports"] / total * 100).round(2)

    result = grouped[["metro", "reports", "pct_of_total", "rank"]].to_dict(orient="records")
    write_json("geography_msa.json", result)
    print(f"  {len(result)} metros processed")
    print("  Top 5 metros:")
    for r in result[:5]:
        print(f"    #{r['rank']} {r['metro']}: {r['reports']:,} ({r['pct_of_total']}%)")
    return result


# =========================================================================
# STEP 3 — Geography State
# =========================================================================
def step3_geography_state():
    print("\n── Step 3: Geography State ──")
    df = read_csv_smart(CSV_DIR / "2024_CSN_State_Fraud_Reports_and_Losses.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["State"].notna() & (df["State"].str.strip() != "")]
    df = df[~df["State"].str.startswith("The ")]
    df = df[~df["State"].str.startswith("Source")]

    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["total_loss"] = df["Total $ Loss"].apply(parse_num)
    df["median_loss"] = df["Median $ Loss"].apply(parse_num)
    df["pct_reporting_loss"] = df["% Reporting $ Loss"].apply(
        lambda v: round(parse_num(str(v).replace("%", "")) if "%" not in str(v) else parse_num(v), 2)
    )

    total = int(df["reports"].sum())
    df["pct_of_total"] = (df["reports"] / total * 100).round(2)

    result = (
        df[["State", "reports", "total_loss", "median_loss", "pct_of_total"]]
        .rename(columns={"State": "state"})
        .sort_values("reports", ascending=False)
        .to_dict(orient="records")
    )
    write_json("geography_state.json", result)
    print(f"  {len(result)} states/territories processed")
    return result


# =========================================================================
# STEP 4 — Fraud Types
# =========================================================================
def step4_fraud_types():
    print("\n── Step 4: Fraud Types ──")
    df = read_csv_smart(CSV_DIR / "2024_CSN_Report_Categories.csv")
    df.columns = [c.strip() for c in df.columns]
    df = df[df["Rank"].notna()]
    df = df[df["Rank"].apply(lambda v: str(v).strip().isdigit())]

    df["rank"] = df["Rank"].astype(int)
    df["category"] = df["Category"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["pct"] = df["Percentage"].apply(lambda v: round(parse_num(v), 2))

    result = df[["category", "reports", "pct", "rank"]].to_dict(orient="records")
    write_json("fraud_types.json", result)
    print(f"  {len(result)} categories")
    print("  Top 5 categories:")
    for r in result[:5]:
        print(f"    #{r['rank']} {r['category']}: {r['reports']:,} ({r['pct']}%)")
    return result


# =========================================================================
# STEP 5 — Loss & Payment
# =========================================================================
def step5_loss_payment():
    print("\n── Step 5: Loss & Payment ──")
    df = read_csv_smart(CSV_DIR / "2024_CSN_Fraud_Reports_by_Payment_Method.csv")
    df.columns = [c.strip() for c in df.columns]

    df = df[df["Payment Method"].notna() & (df["Payment Method"].str.strip() != "")]
    df = df[~df["Payment Method"].str.contains("Number of|# of|Source", na=False)]

    df["method"] = df["Payment Method"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["total_loss"] = df["Total $ Loss"].apply(parse_num)

    total_loss_all = df["total_loss"].sum()
    df["pct_of_total_loss"] = (df["total_loss"] / total_loss_all * 100).round(2)
    df["avg_loss_per_report"] = (df["total_loss"] / df["reports"]).round(2)

    result = (
        df[["method", "reports", "total_loss", "pct_of_total_loss", "avg_loss_per_report"]]
        .sort_values("total_loss", ascending=False)
        .to_dict(orient="records")
    )
    write_json("loss_payment.json", result)
    top = result[0]
    print(f"  Top payment method by loss: {top['method']} (${top['total_loss']:,.0f})")
    return result


# =========================================================================
# STEP 6 — Loss Distribution
# =========================================================================
def step6_loss_distribution():
    print("\n── Step 6: Loss Distribution ──")
    with open(CSV_DIR / "2024_CSN_Fraud_Reports_by_Amount_Lost.csv", encoding="latin-1") as f:
        content = f.read()

    broad_buckets = []
    fine_buckets = []
    section = None

    for row_line in content.splitlines():
        stripped = row_line.strip()
        if not stripped or stripped == ",":
            continue

        if "Reported Fraud Losses in $1 - $10,000" in stripped:
            section = "broad"
            continue
        if "Reported Fraud Losses in $1 - $1,000 Range" in stripped:
            section = "fine"
            continue
        if section is None:
            continue

        m = re.match(r'^"?(\$[\d,]+\s*-\s*\$[\d,]+|More than \$[\d,]+)"?,"?([\d,]+)"?', stripped)
        if m:
            rng = m.group(1).strip()
            cnt = int(m.group(2).replace(",", ""))
            target = broad_buckets if section == "broad" else fine_buckets
            target.append({"range": rng, "reports": cnt})

    result = {
        "broad": broad_buckets,
        "fine": fine_buckets,
    }
    write_json("loss_distribution.json", result)
    print(f"  {len(broad_buckets)} broad buckets, {len(fine_buckets)} fine buckets")
    return result


# =========================================================================
# STEP 7 — Demographics Age
# =========================================================================
def step7_demographics_age():
    print("\n── Step 7: Demographics Age ──")
    df = read_csv_smart(CSV_DIR / "2024_CSN_Reported_Frauds_and_Losses_by_Age.csv")
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

    result = df[["age_group", "reports", "pct", "total_loss", "median_loss",
                  "pct_reporting_loss", "loss_per_report"]].to_dict(orient="records")
    write_json("demographics_age.json", result)
    print(f"  {len(result)} age groups")
    return result


# =========================================================================
# STEP 8 — Trends
# =========================================================================
def step8_trends():
    print("\n── Step 8: Trends ──")

    # --- yearly totals ---
    df_total = read_csv_smart(CSV_DIR / "2024_CSN_Report_Count.csv")
    df_total.columns = [c.strip() for c in df_total.columns]
    df_total = df_total[df_total["Year"].notna()]
    df_total = df_total[df_total["Year"].apply(lambda v: str(v).strip().isdigit())]
    df_total["year"] = df_total["Year"].astype(int)
    df_total["reports"] = df_total["# of Reports"].apply(parse_num).astype(int)
    df_total = df_total.sort_values("year").reset_index(drop=True)

    yearly_totals = df_total[["year", "reports"]].to_dict(orient="records")

    # YoY growth
    yoy = []
    for i in range(1, len(df_total)):
        prev = df_total.iloc[i - 1]["reports"]
        curr = df_total.iloc[i]["reports"]
        growth = round((curr - prev) / prev * 100, 2) if prev else 0
        yoy.append({
            "year": int(df_total.iloc[i]["year"]),
            "reports": int(curr),
            "yoy_growth_pct": growth,
        })

    # --- by type ---
    df_type = read_csv_smart(CSV_DIR / "2024_CSN_Number_of_Reports_by_Type.csv")
    df_type.columns = [c.strip() for c in df_type.columns]
    df_type = df_type[df_type["Year"].notna()]
    df_type = df_type[df_type["Year"].apply(lambda v: str(v).strip().isdigit())]
    df_type["year"] = df_type["Year"].astype(int)
    df_type["fraud"] = df_type["Fraud"].apply(parse_num).astype(int)
    df_type["identity_theft"] = df_type["Identity Theft"].apply(parse_num).astype(int)
    df_type["other"] = df_type["Other"].apply(parse_num).astype(int)
    df_type = df_type.sort_values("year")

    by_type = df_type[["year", "fraud", "identity_theft", "other"]].to_dict(orient="records")

    result = {
        "yearly_totals": yearly_totals,
        "yoy_growth": yoy,
        "by_type": by_type,
    }
    write_json("trends.json", result)
    print(f"  {len(yearly_totals)} years of data")
    return result


# =========================================================================
# Main
# =========================================================================
def main():
    print("=" * 60)
    print("FTC CSN 2024 — Data Processing Pipeline")
    print("=" * 60)

    overview = step1_overview()
    msa = step2_geography_msa()
    step3_geography_state()
    fraud = step4_fraud_types()
    payment = step5_loss_payment()
    step6_loss_distribution()
    step7_demographics_age()
    step8_trends()

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total reports:       {overview['total_reports']:,}")
    print(f"Total loss:          ${overview['total_loss']:,.0f}")
    print()
    print("Top 5 Metros:")
    for r in msa[:5]:
        print(f"  #{r['rank']} {r['metro']}: {r['reports']:,}")
    print()
    print("Top 5 Categories:")
    for r in fraud[:5]:
        print(f"  #{r['rank']} {r['category']}: {r['reports']:,}")
    print()
    top_pay = max(payment, key=lambda x: x["total_loss"])
    print(f"Top payment method by loss: {top_pay['method']} (${top_pay['total_loss']:,.0f})")
    print()
    print("All JSON files written to: processed/")
    print("=" * 60)


if __name__ == "__main__":
    main()
