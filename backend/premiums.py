from __future__ import annotations

from typing import Any, Dict, Mapping
import json
import os

from productspecs import normalize_payload
from withprofits import WithProfitProjector, CashFlow


# Load rate factors from rates.json (lazy-loaded)
_RATES: Dict[str, Any] = {}


def _load_rates() -> Dict[str, Any]:
    global _RATES
    if _RATES:
        return _RATES
    path = os.path.join(os.path.dirname(__file__), "rates.json")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            _RATES = json.load(fh)
    except Exception:
        _RATES = {}
    return _RATES


def _get_rate_factor(product: str, benefit: str, term: int) -> float:
    rates = _load_rates()
    # rates.json uses capitalised product keys like "Education"
    prod_key = product.capitalize()
    try:
        # navigate to the specific benefit and its term entry
        return float(
            rates.get("products", {}).get(prod_key, {}).get("benefits", {}).get(benefit, {}).get(str(term), 0) or 0
        )
    except Exception:
        return 0.0


# Load rate factors from rates.json (lazy-loaded)
_RATES: Dict[str, Any] = {}


def _load_rates() -> Dict[str, Any]:
    global _RATES
    if _RATES:
        return _RATES
    path = os.path.join(os.path.dirname(__file__), "rates.json")
    try:
        with open(path, "r", encoding="utf-8") as fh:
            _RATES = json.load(fh)
    except Exception:
        _RATES = {}
    return _RATES


def _get_rate_factor(product: str, benefit: str, term: int) -> float:
    rates = _load_rates()
    # rates.json uses capitalised product keys like "Education"
    prod_key = product.capitalize()
    try:
        # navigate to the specific benefit and its term entry
        return float(
            rates.get("products", {}).get(prod_key, {}).get("benefits", {}).get(benefit, {}).get(str(term), 0) or 0
        )
    except Exception:
        return 0.0


_FREQ_MULT = {
    # baseline: monthly = 1 (monthly premium)
    # quarterly/ semiannual/ annual use discounted multipliers per business rule
    "monthly": 1,
    "quarterly": 2.9,
    "semiannual": 5.5,
    "annually": 10,
}


def _term_monthly_premium(age: int, gender: str, smoker: str, sa: float, term: int) -> int:
    base = sa * 0.0025
    base *= 1 + (age - 30) * 0.04
    if gender == "M":
        base *= 1.15
    if smoker == "S":
        base *= 1.40
    return round(base / 12)


def _whole_life_monthly_premium(age: int, gender: str, smoker: str, sa: float) -> int:
    base = sa * 0.004
    base *= 1 + (age - 25) * 0.045
    if gender == "M":
        base *= 1.12
    if smoker == "S":
        base *= 1.45
    return round(base / 12)


def _endowment_monthly_premium(age: int, gender: str, smoker: str, sa: float, term: int) -> int:
    mort = _term_monthly_premium(age, gender, smoker, sa, term)
    return round(mort + sa / (term * 12 * 1.3))


def _pension_fund(contrib: float, age: int, retire_age: int, rate: float = 0.08) -> int:
    """Calculate pension fund accumulation at retirement age.
    
    Args:
        contrib: Monthly contribution in KES
        age: Current age
        retire_age: Target retirement age
        rate: Annual return rate (default 0.08 = 8%)
    
    Returns:
        Projected fund value at retirement
    """
    months = (retire_age - age) * 12
    return round(contrib * (((1 + rate / 12) ** months - 1) / (rate / 12)))


def calculate_quote(payload: Mapping[str, Any]) -> Dict[str, Any]:
    """Generic Python fallback quote engine (replacement for JS_FALLBACK_ENGINE)."""

    p = normalize_payload(payload)
    product = p.get("product")
    age = int(p.get("age") or 0)
    gender = str(p.get("gender") or "")
    smoker = str(p.get("smoker") or "NS")
    sa = float(p.get("sa") or 0)
    term = int(p.get("term") or 0)
    contrib = float(p.get("contrib") or 0)
    retire_age = int(p.get("retireAge") or 60)
    target = float(p.get("target") or 0)
    escalation_rate = float(p.get("escalationRate") or 0)
    freq = str(p.get("freq") or "monthly")
    freq_mult = _FREQ_MULT.get(freq, 1)

    joint_life = p.get("jointLife") or {}
    partial_mat = p.get("partialMat") or {}

    premium = 0
    benefits = []
    free_benefits = []
    note = ""
    details = []

    if product == "term":
        mp = _term_monthly_premium(age, gender, smoker, sa, term)
        premium = mp * freq_mult
        le = min(sa * 0.05, 150000)
        ci = sa * 0.5
        details = [["Sum Assured", f"KES {int(sa):,}"], ["Policy Term", f"{term} yrs"], ["Cover Expiry Age", f"{age + term} yrs"]]
        benefits = [
            {"risk": "Death Benefit", "coverage": f"KES {int(sa):,}", "note": "On death within term", "highlight": True},
            {"risk": "Last Expense Cover", "coverage": f"KES {int(le):,}", "note": "Immediate payout", "highlight": False},
            {"risk": "Critical Illness", "coverage": f"KES {int(ci):,}", "note": "50% of Sum Assured", "highlight": False},
        ]
        if partial_mat.get("enabled") and (partial_mat.get("count") or 0) > 0:
            count = int(partial_mat["count"])
            slice_amount = round(sa * 0.1)
            benefits.append(
                {
                    "risk": f"Partial Maturity x{count}",
                    "coverage": f"KES {slice_amount:,} each",
                    "note": "Subject to policy conditions",
                    "highlight": False,
                }
            )
        free_benefits = ["Grief counselling support", "Funeral service directory access"]
        note = "No maturity value. Cover lapses if premiums are not maintained."

    elif product == "wholelife":
        mp = _whole_life_monthly_premium(age, gender, smoker, sa)
        premium = mp * freq_mult
        le = min(sa * 0.08, 200000)
        cv5 = round(mp * 12 * 5 * 0.45)
        details = [["Sum Assured", f"KES {int(sa):,}"], ["Cover Duration", "Whole of Life"], ["Indicative Cash Value (5yr)", f"KES {cv5:,}"]]
        benefits = [
            {"risk": "Death Benefit", "coverage": f"KES {int(sa):,}", "note": "Payable any time", "highlight": True},
            {"risk": "Last Expense Cover", "coverage": f"KES {int(le):,}", "note": "Within 48 hrs", "highlight": False},
            {"risk": "Guaranteed Cash Value", "coverage": "After year 3", "note": "Partial surrender allowed", "highlight": False},
        ]
        free_benefits = ["Medical second opinion service", "Annual policy review", "Grief counselling"]
        note = "Policy acquires cash surrender value after year 3."

    elif product == "endowment":
        mp = _endowment_monthly_premium(age, gender, smoker, sa, term)
        premium = mp * freq_mult
        mat = round(sa * 1.15)
        le = min(sa * 0.06, 100000)
        details = [["Sum Assured", f"KES {int(sa):,}"], ["Policy Term", f"{term} yrs"], ["Maturity Age", f"{age + term} yrs"]]
        benefits = [
            {"risk": "Death Benefit", "coverage": f"KES {int(sa):,}", "note": "On death before maturity", "highlight": False},
            {"risk": "Maturity Benefit", "coverage": f"KES {mat:,}", "note": "Paid at end of term", "highlight": True},
            {"risk": "Last Expense", "coverage": f"KES {int(le):,}", "note": "Immediate payout", "highlight": False},
        ]
        free_benefits = ["Premium waiver on total disability", "Policy loan facility", "Paid-up option"]
        note = "Maturity benefit includes estimated non-guaranteed additions."

    elif product == "withprofit":
        # Use enhanced WithProfit projector for accurate accumulation calculations
        from withprofits import CashFlow
        
        # Get With-Profit specific data from payload
        wp_data = p.get("withProfit") or {}
        initial_deposit = float(wp_data.get("initialDeposit") or sa or 500000)
        wp_term = int(wp_data.get("term") or term or 5)
        premium_amount = float(wp_data.get("annualPremium") or 0)  # Amount per payment period
        wp_frequency = str(wp_data.get("frequency") or freq or "annual")
        wp_cash_flows = wp_data.get("cashFlows") or []
        
        # Convert premium to annual amount based on payment frequency
        frequency_multipliers = {
            "monthly": 12,
            "quarterly": 4,
            "semiannual": 2,
            "annual": 1,
            "single": 0  # Single premium doesn't cascade
        }
        multiplier = frequency_multipliers.get(wp_frequency, 1)
        wp_annual_premium = premium_amount * multiplier if multiplier > 0 else (premium_amount if wp_frequency == "single" else 0)
        
        # Convert cash flows to CashFlow objects
        cash_flows = []
        for cf in wp_cash_flows:
            if isinstance(cf, dict):
                cash_flows.append(CashFlow(
                    year=int(cf.get("year") or 0),
                    deposit=float(cf.get("deposit") or 0),
                    withdrawal=float(cf.get("withdrawal") or 0)
                ))
        
        # Get rate dictionaries for all terms from rates.json
        rates = _load_rates()
        withprofit_benefits = rates.get("products", {}).get("Withprofit", {}).get("benefits", {})
        death_rate_dict = {int(k): float(v) for k, v in withprofit_benefits.get("Death", {}).items()}
        ptd_rate_dict = {int(k): float(v) for k, v in withprofit_benefits.get("PTD", {}).items()}
        guaranteed_return_dict = {int(k): float(v) for k, v in withprofit_benefits.get("GuaranteedReturn", {}).items()}
        
        # Default to term if in dict, otherwise use the closest available
        if wp_term not in death_rate_dict:
            available_terms = sorted(death_rate_dict.keys())
            if available_terms:
                wp_term = available_terms[-1]  # Use the highest available term
        
        death_rate = death_rate_dict.get(wp_term, 0.01)
        ptd_rate = ptd_rate_dict.get(wp_term, 0.00005)
        guaranteed_return = guaranteed_return_dict.get(wp_term, 0.09)
        
        # Create projector and generate projection
        projector = WithProfitProjector(
            death_rate_by_term=death_rate_dict,
            ptd_rate_by_term=ptd_rate_dict,
            guaranteed_return_rate=guaranteed_return
        )
        
        projection_result = projector.project(
            age=age,
            term_years=wp_term,
            initial_deposit=initial_deposit,
            annual_premium=wp_annual_premium,
            cash_flows=cash_flows,
            frequency=wp_frequency
        )
        
        # Prepare premium for display (convert back to selected frequency)
        monthly_premium = round(wp_annual_premium / 12) if wp_annual_premium > 0 else 0
        freq_mults = {"monthly": 1, "quarterly": 2.9, "semiannual": 5.5, "annually": 10, "single": 0}
        premium = round(monthly_premium * freq_mults.get(wp_frequency, 1))
        
        summary = projection_result.get("summary", {})
        final_balance = summary.get("total_accumulated_fund", 0)
        death_ptd_benefit = summary.get("death_ptd_benefit_at_maturity", final_balance)
        total_death_costs = summary.get("total_death_costs", 0)
        total_ptd_costs = summary.get("total_ptd_costs", 0)
        
        # Build details and benefits display
        details = [
            ["Age at Entry", f"{age} yrs"],
            ["Policy Term", f"{wp_term} yrs"],
            ["Age at Maturity", f"{age + wp_term} yrs"],
            ["Initial Deposit", f"KES {int(initial_deposit):,}"],
            ["Annual Premium", f"KES {int(wp_annual_premium):,}"],
            ["Expected Return Rate", f"{guaranteed_return * 100:.1f}% p.a."],
            ["Projected Fund at Maturity", f"KES {int(final_balance):,}"],
            ["Death/PTD Benefit", f"KES {int(death_ptd_benefit):,}"],
        ]
        
        benefits = [
            {"risk": "Accumulated Fund", "coverage": f"KES {int(final_balance):,}", "note": f"Projected fund value at {guaranteed_return * 100:.1f}% expected return", "highlight": False},
            {"risk": "Death/PTD Benefit", "coverage": f"KES {int(death_ptd_benefit):,}", "note": "Equal to accumulated fund balance at time of claim", "highlight": True},
            {"risk": "Total Insurance Costs", "coverage": f"KES {int(total_death_costs + total_ptd_costs):,}", "note": "Total death and PTD premiums over policy term", "highlight": False},
        ]
        
        free_benefits = [
            "Annual projection statements",
            "Online fund tracking dashboard",
            "Flexible top-ups and withdrawals",
            "Transparent cost structure",
        ]
        
        note = "Projections are illustrative based on expected returns. Death/PTD benefits equal the accumulated balance, with costs deducted annually before growth calculation. Actual returns may be higher or lower."
        
        # Attach projection data for output rendering
        p["_withprofit_projection"] = projection_result

    elif product == "pension":
        premium = contrib * freq_mult
        years = retire_age - age
        
        # Determine fund return rate based on fund type selection
        fund_type = p.get("pensionFundType") or "balanced"
        fund_rates = {
            "aggressive": 0.075,
            "conservative": 0.05,
            "balanced": 0.0625  # Default balanced: 50/50 aggressive+conservative = (7.5+5)/2 = 6.25%
        }
        
        if fund_type == "balanced":
            # Get weights from payload (if provided)
            weight_aggressive = float(p.get("pensionBalancedWeightsAgg") or 50) / 100
            weight_conservative = float(p.get("pensionBalancedWeightsCons") or 50) / 100
            total_weight = weight_aggressive + weight_conservative
            
            if total_weight > 0:
                # Normalize weights
                weight_aggressive = weight_aggressive / total_weight
                weight_conservative = weight_conservative / total_weight
                pension_return_rate = (weight_aggressive * 0.075) + (weight_conservative * 0.05)
            else:
                pension_return_rate = 0.0625
        else:
            pension_return_rate = fund_rates.get(fund_type, 0.0625)
        
        # Calculate fund using selected return rate
        fund = _pension_fund(contrib, age, retire_age, rate=pension_return_rate)
        annuity = round(fund * 0.006)
        db = round(contrib * 12 * years * 0.5)
        
        details = [
            ["Monthly Contribution", f"KES {int(contrib):,}"],
            ["Retirement Age", f"{retire_age} yrs"],
            ["Accumulation Period", f"{years} yrs"],
            ["Selected Fund Type", f"{fund_type.capitalize()}"],
            ["Expected Return Rate", f"{pension_return_rate * 100:.2f}% p.a. (illustrated)"],
        ]
        benefits = [
            {"risk": "Projected Fund at Retirement", "coverage": f"KES {fund:,}", "note": f"Illustrated at {pension_return_rate * 100:.2f}% expected return", "highlight": True},
            {"risk": "Estimated Monthly Annuity", "coverage": f"KES {annuity:,}", "note": "Illustrative monthly pension", "highlight": True},
            {"risk": "Death Benefit", "coverage": f"KES {db:,}", "note": "Fund value paid to estate", "highlight": False},
        ]
        free_benefits = [
            "Tax-deductible up to KES 20,000/month",
            "Investment choice (Aggressive / Conservative / Balanced)",
            "Partial withdrawal after vesting",
        ]
        note = f"Projections at {pension_return_rate * 100:.2f}% p.a. expected returns. Actual returns depend on fund performance and market conditions."

    elif product == "education":
        # New benefit-based premium calculation
        # Base amount for benefit calculations: prefer `sa` if present, otherwise `target`
        base_amount = sa if sa and sa > 0 else target
        if not base_amount:
            raise ValueError("Missing sum-assured/target for education quote.")

        selected_benefits = p.get("benefits") or {}
        # benefit names we support
        benefit_names = ["Death", "PTD", "CriticalIllness", "Retrenchment", "DoubleAccident", "WOPDisability"]

        # compute monthly component for each enabled benefit using rates.json factors (monthly factors)
        benefit_components = {}
        for bname in benefit_names:
            if not selected_benefits.get(bname):
                benefit_components[bname] = 0.0
                continue
            factor = _get_rate_factor("education", bname, int(term or 0))
            monthly_comp = base_amount * factor
            benefit_components[bname] = monthly_comp

        single_monthly = sum(benefit_components.values())

        # Joint life premium: 0.85 * single life premium
        joint_monthly = 0.0
        if joint_life.get("enabled"):
            jl_employment = joint_life.get("employmentStatus") or "employed"
            retrench_monthly = benefit_components.get("Retrenchment", 0.0)
            if jl_employment == "unemployed":
                # joint life not eligible for retrenchment: deduct that component
                joint_monthly = 0.85 * max(0.0, single_monthly - retrench_monthly)
            else:
                joint_monthly = 0.85 * single_monthly

        phcf_levy = 0.0025 * (single_monthly + joint_monthly)
        total_monthly = single_monthly + joint_monthly + phcf_levy
        premium = round(total_monthly * freq_mult)

        # build details and benefits summary for the UI
        projected_target = round(base_amount * ((1 + (escalation_rate / 100.0)) ** (term or 0)))
        m1 = round(projected_target * 0.25)
        m2 = round(projected_target * 0.35)
        m3 = round(projected_target * 0.40)
        details = [
            ["Initial Target Education Fund", f"KES {int(target):,}"],
            ["Escalation Rate", f"{escalation_rate:.2f}% p.a. (compounding)"],
            ["Projected Target at Maturity", f"KES {int(projected_target):,}"],
            ["Policy Term", f"{term} yrs"],
        ]

        benefits = []
        # list benefit cards from selected benefits and computed components
        for bname in benefit_names:
            if not selected_benefits.get(bname):
                continue
            # Coverage display per product definitions (display only — not used for pricing)
            if bname == "Death":
                cov = f"KES {int(base_amount):,}"
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,}"
            elif bname == "PTD":
                cov = f"KES {int(base_amount):,}"
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,}"
            elif bname == "CriticalIllness":
                cov = f"KES {int(round(0.35 * base_amount)):,}"
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,} — Pays 35% of Sum Assured on diagnosis"
            elif bname == "DoubleAccident":
                cov = f"KES {int(2 * base_amount):,}"
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,} — Pays 2x Sum Assured for accidental death"
            elif bname == "Retrenchment":
                # display waiver of 6 months' premiums (use single_monthly to derive amount)
                waiver_amt = int(round(single_monthly * 6))
                cov = f"Waiver of 6 months' premiums (KES {waiver_amt:,})"
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,} — Waives 6 months' premiums on retrenchment"
            elif bname == "WOPDisability":
                # display waiver of premiums for remaining term
                remaining_premium = int(round(single_monthly * (term or 12)))
                cov = f"Premium waiver for remaining {term or 12} years"
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,} — Waives all premiums on permanent disability"
            else:
                cov = ""
                note = f"Monthly premium component: KES {round(benefit_components.get(bname,0)):,}"

            benefits.append({
                "risk": bname,
                "coverage": cov,
                "note": note,
                "highlight": bname == "Death",
            })

        # partial maturities (unchanged behaviour)
        if partial_mat.get("enabled") and (partial_mat.get("count") or 0) > 0:
            count = int(partial_mat["count"])
            slice_amount = round(target * 0.08)
            benefits.append(
                {
                    "risk": f"Partial Maturity x{count}",
                    "coverage": f"KES {slice_amount:,} each",
                    "note": "Subject to policy conditions",
                    "highlight": False,
                }
            )
        free_benefits = [
            "Premium waiver on parent death/disability",
            "Scholarship advisory service",
            "University placement support",
        ]
        note = "Education premiums shown are benefit-based; PHCF levy included."

    else:
        raise ValueError(f"Unsupported product '{product}'.")

    if joint_life.get("enabled"):
        premium = round(premium * 1.85) 
        # Joint life policies typically get a 15% discount compared to two separate policies, 
        # so we apply a 85% loading instead of doubling the premium.
        details.append(["Joint Life", "Enabled (illustrative 15% discount)"])

    result = {
        "premium": round(premium),
        "benefits": benefits,
        "freeBenefits": free_benefits,
        "note": note,
        "details": details,
    }
    
    # Include WithProfit projection data if available
    if product == "withprofit" and "_withprofit_projection" in p:
        result["withProfitProjection"] = p["_withprofit_projection"]
    
    return result
