"""
FTC CSN 2024 — Enrichment & Advanced Analytics Layer
Builds on /processed_full/ outputs. Adds per-capita normalization,
contact method analysis, relative growth, cross-dimensional analysis,
and a danger index.
"""

import json
import math
import re
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent
CSV_DIR = BASE / "data" / "CSVs"
FULL_DIR = BASE / "processed_full"
OUT_DIR = BASE / "processed_enriched"
OUT_DIR.mkdir(exist_ok=True)


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


def load_json(name, directory=FULL_DIR):
    with open(directory / name) as f:
        return json.load(f)


def write_json(name, data):
    path = OUT_DIR / name
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  -> {path.relative_to(BASE)}")


def rcsv(filepath, header_row=2, **kw):
    return pd.read_csv(filepath, header=header_row, encoding="latin-1", **kw)


def safe_div(a, b):
    return round(a / b, 2) if b else 0


# =========================================================================
# STEP 1 — State Per Capita (derive population from FTC per-100K data)
# =========================================================================
def step1_state_per_capita():
    print("\n== Step 1: State Per Capita ==")

    # FTC ranking file has: State, Reports per 100K, # of Reports
    # population = reports / (per_100k / 100_000)
    df = rcsv(CSV_DIR / "2024_CSN_State_Rankings_Fraud_and_Other_Reports.csv")
    df.columns = [c.strip() for c in df.columns]

    df = df[df["State"].notna() & (df["State"].str.strip() != "")]
    df = df[~df["State"].str.startswith("The ")]
    df = df[~df["State"].str.startswith("Source")]

    df["state"] = df["State"].str.strip()
    df["per_100k_fraud_other"] = df["Reports per 100K Population"].apply(parse_num)
    df["reports_fraud_other"] = df["# of Reports"].apply(parse_num).astype(int)
    df["population"] = (df["reports_fraud_other"] / df["per_100k_fraud_other"] * 100_000).round(0).astype(int)

    pop_lookup = dict(zip(df["state"], df["population"]))

    # load state data from processed_full (has fraud-only reports + losses)
    geo = load_json("geography_state.json")
    states = geo["states"]

    enriched = []
    for s in states:
        name = s["state"]
        pop = pop_lookup.get(name, 0)
        reports = s["reports"]
        total_loss = s["total_loss"]

        rp100k = round(reports / pop * 100_000, 2) if pop else 0
        lp100k = round(total_loss / pop * 100_000, 2) if pop else 0

        enriched.append({
            **s,
            "population": pop,
            "reports_per_100k": rp100k,
            "loss_per_100k": lp100k,
        })

    enriched_by_rp = sorted(enriched, key=lambda x: x["reports_per_100k"], reverse=True)
    for i, e in enumerate(enriched_by_rp):
        e["rank_by_reports_per_100k"] = i + 1

    enriched_by_lp = sorted(enriched, key=lambda x: x["loss_per_100k"], reverse=True)
    for i, e in enumerate(enriched_by_lp):
        e["rank_by_loss_per_100k"] = i + 1

    # re-sort by reports descending (original order)
    enriched.sort(key=lambda x: x["reports"], reverse=True)

    result = {
        "state_count": len(enriched),
        "states": enriched,
    }
    write_json("geography_state_per_capita.json", result)

    top_rp = sorted(enriched, key=lambda x: x["reports_per_100k"], reverse=True)[:5]
    top_lp = sorted(enriched, key=lambda x: x["loss_per_100k"], reverse=True)[:5]
    print("  Top 5 by reports/100K:")
    for s in top_rp:
        print(f"    {s['state']}: {s['reports_per_100k']} per 100K (pop {s['population']:,})")
    print("  Top 5 by loss/100K:")
    for s in top_lp:
        print(f"    {s['state']}: ${s['loss_per_100k']:,.0f} per 100K")

    return result, pop_lookup


# =========================================================================
# STEP 2 — MSA Per Capita (derive from FTC MSA ranking file)
# =========================================================================
def step2_msa_per_capita():
    print("\n== Step 2: MSA Per Capita ==")

    df = rcsv(CSV_DIR / "2024_CSN_Metropolitan_Areas_Fraud_and_Other_Reports.csv")
    df.columns = [c.strip() for c in df.columns]

    df = df[df["Metropolitan Area"].notna() & (df["Metropolitan Area"].str.strip() != "")]
    df = df[~df["Metropolitan Area"].str.contains("Metropolitan Areas are|Source", na=False)]

    df["metro"] = df["Metropolitan Area"].str.strip()
    df["per_100k"] = df["Reports per 100K Population"].apply(parse_num)
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    df["population"] = (df["reports"] / df["per_100k"] * 100_000).round(0).astype(int)

    # FTC ranking file already has a per-capita rank
    if "Rank" in df.columns:
        df["ftc_rank"] = df["Rank"].apply(lambda v: int(parse_num(v)) if str(v).strip().isdigit() else 0)
    else:
        df["ftc_rank"] = 0

    df = df.sort_values("per_100k", ascending=False).reset_index(drop=True)
    df["rank_by_per_100k"] = range(1, len(df) + 1)
    df["rank_by_reports"] = df["reports"].rank(ascending=False, method="min").astype(int)

    total = int(df["reports"].sum())
    df["pct_of_total"] = (df["reports"] / total * 100).round(2)

    items = df[["metro", "reports", "population", "per_100k", "pct_of_total",
                 "rank_by_per_100k", "rank_by_reports"]].to_dict(orient="records")

    result = {
        "total_msa_reports": total,
        "metro_count": len(items),
        "metros": items,
    }
    write_json("geography_msa_per_capita.json", result)
    print(f"  {len(items)} MSAs with population derived")
    for m in items[:5]:
        print(f"    #{m['rank_by_per_100k']} {m['metro']}: {m['per_100k']} per 100K (pop {m['population']:,})")
    return result


# =========================================================================
# STEP 3 — Contact / Channel Methods
# =========================================================================
def step3_contact_methods():
    print("\n== Step 3: Contact Methods ==")

    df = rcsv(CSV_DIR / "2024_CSN_Fraud_Reports_by_Contact_Method.csv")
    df.columns = [c.strip() for c in df.columns]

    df = df[df["Contact Method"].notna() & (df["Contact Method"].str.strip() != "")]
    df = df[~df["Contact Method"].str.contains("Number of|# of|Source|Other contact", na=False)]

    df["contact_method"] = df["Contact Method"].str.strip()
    df["reports"] = df["# of Reports"].apply(parse_num).astype(int)
    pct_col = [c for c in df.columns if "Percentage of all" in c][0]
    df["pct_of_contact_reports"] = df[pct_col].apply(lambda v: round(parse_num(v), 2))
    loss_pct_col = [c for c in df.columns if "dollar loss" in c.lower() or "percentage with" in c.lower()][0]
    df["pct_with_loss"] = df[loss_pct_col].apply(lambda v: round(parse_num(v), 2))
    df["total_loss"] = df["Total $ Lost"].apply(parse_num)
    df["median_loss"] = df["Median $ Loss"].apply(parse_num)

    total_reports = df["reports"].sum()
    total_loss = df["total_loss"].sum()

    df["pct_of_total_reports"] = (df["reports"] / total_reports * 100).round(2)
    df["pct_of_total_loss"] = (df["total_loss"] / total_loss * 100).round(2)
    df["avg_loss_per_report"] = (df["total_loss"] / df["reports"]).round(2)

    overall_avg = total_loss / total_reports if total_reports else 0
    df["loss_per_report_index"] = (df["avg_loss_per_report"] / overall_avg).round(2) if overall_avg else 0

    df["rank_by_reports"] = df["reports"].rank(ascending=False, method="min").astype(int)
    df["rank_by_total_loss"] = df["total_loss"].rank(ascending=False, method="min").astype(int)
    df["rank_by_avg_loss"] = df["avg_loss_per_report"].rank(ascending=False, method="min").astype(int)

    items = df[["contact_method", "reports", "pct_of_total_reports", "pct_with_loss",
                 "total_loss", "pct_of_total_loss", "median_loss",
                 "avg_loss_per_report", "loss_per_report_index",
                 "rank_by_reports", "rank_by_total_loss", "rank_by_avg_loss"]].to_dict(orient="records")

    result = {
        "total_contact_reports": int(total_reports),
        "total_contact_loss": total_loss,
        "overall_avg_loss": round(overall_avg, 2),
        "methods": items,
    }
    write_json("contact_methods.json", result)

    top_loss = sorted(items, key=lambda x: x["total_loss"], reverse=True)[:3]
    print("  Top 3 contact methods by loss:")
    for m in top_loss:
        print(f"    {m['contact_method']}: ${m['total_loss']:,.0f} "
              f"(avg ${m['avg_loss_per_report']:,.0f}/report, index {m['loss_per_report_index']}x)")
    return result


# =========================================================================
# STEP 4 — Category Relative Growth
# =========================================================================
def step4_category_relative_growth():
    print("\n== Step 4: Category Relative Growth ==")

    trends = load_json("fraud_types_trends.json")
    categories = trends["categories"]

    # total market growth 2022→2024
    total_2022 = 5_317_751
    total_2024 = 6_471_708
    market_growth = round((total_2024 - total_2022) / total_2022 * 100, 2)

    enriched = []
    for cat in categories:
        abs_growth = cat.get("change_2022_2024_pct")
        if abs_growth is None:
            continue
        relative = round(abs_growth - market_growth, 2)
        enriched.append({
            "category": cat["category"],
            "reports_2022": cat["reports_2022"],
            "reports_2024": cat["reports_2024"],
            "absolute_growth_pct": abs_growth,
            "market_growth_pct": market_growth,
            "relative_growth_pct": relative,
            "share_2022_pct": cat["share_2022_pct"],
            "share_2024_pct": cat["share_2024_pct"],
            "share_change_pp": cat["share_change_pp"],
            "outperforming_market": relative > 0,
        })

    enriched.sort(key=lambda x: x["relative_growth_pct"], reverse=True)
    for i, e in enumerate(enriched):
        e["rank_by_relative_growth"] = i + 1

    result = {
        "market_growth_2022_2024_pct": market_growth,
        "categories_outperforming": sum(1 for e in enriched if e["outperforming_market"]),
        "categories_underperforming": sum(1 for e in enriched if not e["outperforming_market"]),
        "categories": enriched,
    }
    write_json("category_relative_growth.json", result)

    print(f"  Market growth (2022-2024): {market_growth}%")
    print(f"  Outperforming: {result['categories_outperforming']} | Underperforming: {result['categories_underperforming']}")
    print("  Top 3 by relative growth:")
    for r in enriched[:3]:
        print(f"    {r['category']}: +{r['relative_growth_pct']}pp above market")
    return result


# =========================================================================
# STEP 5 — Cross Category × Payment (assessment)
# =========================================================================
def step5_cross_category_payment():
    print("\n== Step 5: Cross Category × Payment ==")

    result = {
        "status": "not_available",
        "reason": "The FTC Consumer Sentinel dataset provides category reports and payment "
                  "method reports as separate aggregations. There is no row-level linkage "
                  "between individual report categories and payment methods used, so a true "
                  "cross-tabulation cannot be computed from the published CSVs.",
        "workaround_note": "Proportional estimation could be attempted but would be "
                           "statistically unreliable. The FTC does publish some cross-cuts "
                           "in their full report (e.g., top scam types by payment method) "
                           "but those are not available in the CSV extracts.",
    }
    write_json("cross_category_payment.json", result)
    print("  Skipped — no direct linkage in the dataset (documented in output)")
    return result


# =========================================================================
# STEP 6 — Danger Index
# =========================================================================
def step6_danger_index():
    print("\n== Step 6: Danger Index ==")

    fraud_types = load_json("fraud_types.json")
    rel_growth = load_json("category_relative_growth.json", OUT_DIR)
    overview = load_json("overview.json")

    categories = fraud_types["categories"]
    growth_lookup = {c["category"]: c for c in rel_growth["categories"]}

    # We need per-category loss data. The Report_Type CSV has top-10 with loss info.
    # Read from the raw CSV for the top-10 fraud categories with loss data.
    df = rcsv(CSV_DIR / "2024_CSN_Fraud_Reports_by_Contact_Method.csv")  # wrong file, need Report_Type
    # Actually read the Report_Type file which has top-10 fraud with loss info
    rt = pd.read_csv(CSV_DIR / "2024_CSN_Report_Type.csv", header=None, encoding="latin-1")
    # Parse the top 10 fraud section (rows with rank 1-10, columns: Rank, Category, Reports, %Loss, TotalLoss, MedianLoss)
    loss_lookup = {}
    for _, row in rt.iterrows():
        vals = [str(v).strip() if pd.notna(v) else "" for v in row]
        if vals and vals[0].isdigit():
            rank = int(vals[0])
            if 1 <= rank <= 10 and len(vals) >= 6:
                cat_name = vals[1].strip()
                total_loss = parse_num(vals[4])
                n_reports = parse_num(vals[2])
                if n_reports > 0:
                    loss_lookup[cat_name] = {
                        "total_loss": total_loss,
                        "reports": int(n_reports),
                        "avg_loss": round(total_loss / n_reports, 2),
                    }

    overall_avg_loss = overview["avg_loss_per_report"]
    total_reports = sum(c["reports"] for c in categories)

    items = []
    for cat in categories:
        name = cat["category"]
        reports = cat["reports"]

        # frequency: share of total reports, normalized 0-1
        freq_raw = reports / total_reports if total_reports else 0

        # severity: avg_loss / overall_avg, capped and normalized
        loss_info = loss_lookup.get(name)
        if loss_info and loss_info["avg_loss"] > 0:
            severity_raw = loss_info["avg_loss"] / overall_avg_loss if overall_avg_loss else 0
        else:
            severity_raw = 0

        # growth: relative growth from step 4
        g = growth_lookup.get(name)
        growth_raw = g["relative_growth_pct"] if g else 0

        items.append({
            "category": name,
            "reports": reports,
            "frequency_raw": freq_raw,
            "severity_raw": severity_raw,
            "growth_raw": growth_raw,
            "has_loss_data": loss_info is not None,
        })

    # normalize each dimension to 0-1
    max_freq = max(i["frequency_raw"] for i in items) or 1
    max_sev = max(i["severity_raw"] for i in items) or 1
    growth_vals = [i["growth_raw"] for i in items]
    min_growth = min(growth_vals)
    max_growth = max(growth_vals)
    growth_range = max_growth - min_growth if max_growth != min_growth else 1

    for i in items:
        i["frequency_score"] = round(i["frequency_raw"] / max_freq, 4)
        i["severity_score"] = round(i["severity_raw"] / max_sev, 4)
        i["growth_score"] = round((i["growth_raw"] - min_growth) / growth_range, 4)

        # weighted danger index: 0.4 freq + 0.4 severity + 0.2 growth
        i["danger_index"] = round(
            0.4 * i["frequency_score"] +
            0.4 * i["severity_score"] +
            0.2 * i["growth_score"],
            4
        )

    items.sort(key=lambda x: x["danger_index"], reverse=True)
    for idx, i in enumerate(items):
        i["rank"] = idx + 1

    # clean output
    output_items = []
    for i in items:
        output_items.append({
            "category": i["category"],
            "reports": i["reports"],
            "frequency_score": i["frequency_score"],
            "severity_score": i["severity_score"],
            "growth_score": i["growth_score"],
            "danger_index": i["danger_index"],
            "rank": i["rank"],
            "has_loss_data": i["has_loss_data"],
        })

    result = {
        "methodology": {
            "weights": {"frequency": 0.4, "severity": 0.4, "growth": 0.2},
            "normalization": "min-max to 0-1 scale per dimension",
            "severity_note": "Based on avg loss per report for top-10 fraud categories; "
                             "categories without per-category loss data score 0 on severity",
        },
        "categories": output_items,
    }
    write_json("danger_index.json", result)

    print("  Top 5 by Danger Index:")
    for i in output_items[:5]:
        print(f"    #{i['rank']} {i['category']}: {i['danger_index']:.4f} "
              f"(freq={i['frequency_score']:.2f} sev={i['severity_score']:.2f} grow={i['growth_score']:.2f})")
    return result


# =========================================================================
# Main
# =========================================================================
def main():
    print("=" * 64)
    print("  FTC CSN 2024 — Enrichment & Advanced Analytics")
    print("=" * 64)

    state_pc, pop_lookup = step1_state_per_capita()
    msa_pc = step2_msa_per_capita()
    contact = step3_contact_methods()
    rel_growth = step4_category_relative_growth()
    cross = step5_cross_category_payment()
    danger = step6_danger_index()

    # ── Final summary ──
    print("\n" + "=" * 64)
    print("  FINAL SUMMARY")
    print("=" * 64)

    top_rp = sorted(state_pc["states"], key=lambda x: x["reports_per_100k"], reverse=True)[:5]
    top_lp = sorted(state_pc["states"], key=lambda x: x["loss_per_100k"], reverse=True)[:5]

    print("\n  Top 5 States by Reports per 100K:")
    for s in top_rp:
        print(f"    {s['state']}: {s['reports_per_100k']} per 100K")

    print("\n  Top 5 States by Loss per 100K:")
    for s in top_lp:
        print(f"    {s['state']}: ${s['loss_per_100k']:,.0f} per 100K")

    top_contact = sorted(contact["methods"], key=lambda x: x["total_loss"], reverse=True)[:3]
    print("\n  Top 3 Contact Methods by Loss:")
    for m in top_contact:
        print(f"    {m['contact_method']}: ${m['total_loss']:,.0f}")

    top_rel = rel_growth["categories"][:3]
    print("\n  Top 3 Categories by Relative Growth:")
    for r in top_rel:
        print(f"    {r['category']}: +{r['relative_growth_pct']}pp above market")

    top_danger = danger["categories"][:5]
    print("\n  Top 5 Categories by Danger Index:")
    for d in top_danger:
        print(f"    #{d['rank']} {d['category']}: {d['danger_index']:.4f}")

    print(f"\n  All files written to: processed_enriched/")
    print("=" * 64)


if __name__ == "__main__":
    main()
