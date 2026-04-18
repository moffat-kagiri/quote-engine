from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, List, Mapping, Optional, Tuple


@dataclass(frozen=True)
class FieldConstraint:
    """Validation and UI metadata for one input field."""

    field_id: str
    label: str
    data_type: str
    required: bool
    minimum: Optional[float] = None
    maximum: Optional[float] = None
    step: Optional[float] = None
    choices: Tuple[Any, ...] = ()
    placeholder: str = ""
    hint: str = ""


@dataclass(frozen=True)
class ProductSpec:
    """Full product definition for the product matrix."""

    code: str
    brand: str
    display_name: str
    category: str
    description: str
    allowed_entry_age: Tuple[int, int]
    allowed_term_years: Optional[Tuple[int, int]]
    maturity_age_limit: Optional[int]
    allowed_frequencies: Tuple[str, ...]
    allows_joint_life: bool
    allows_partial_maturity: bool
    supports_smoker_rating: bool
    required_fields: Tuple[str, ...]
    optional_fields: Tuple[str, ...]
    financial_limits: Mapping[str, Tuple[Optional[float], Optional[float]]]
    underwriting_flags: Mapping[str, Any]
    default_assumptions: Mapping[str, Any]
    included_benefits: Tuple[str, ...]
    optional_riders: Tuple[str, ...]
    common_exclusions: Tuple[str, ...]
    servicing_features: Tuple[str, ...]
    compliance_requirements: Tuple[str, ...]
    notes: str = ""


BRANDS: Dict[str, Dict[str, str]] = {
    "liberty": {
        "display_name": "Liberty Kenya",
        "currency": "KES",
        "market": "Kenya",
    }
}


FIELD_LIBRARY: Dict[str, FieldConstraint] = {
    "age": FieldConstraint("age", "Age At Entry", "int", True, 18, 70, 1, hint="Entry age 18 to 70 years."),
    "gender": FieldConstraint("gender", "Gender", "str", True, choices=("M", "F")),
    "smoker": FieldConstraint("smoker", "Smoking Status", "str", True, choices=("S", "NS")),
    "freq": FieldConstraint("freq", "Premium Frequency", "str", True, choices=("monthly", "quarterly", "annually")),
    "sa": FieldConstraint("sa", "Sum Assured", "number", False, 100000, 10000000, 50000, placeholder="500000"),
    "term": FieldConstraint("term", "Policy Term (Years)", "int", False, 5, 35, 1),
    "contrib": FieldConstraint("contrib", "Monthly Contribution", "number", False, 2000, 200000, 500),
    "retireAge": FieldConstraint("retireAge", "Retirement Age", "int", False, 55, 65, 1),
    "target": FieldConstraint("target", "Target Fund", "number", False, 200000, 5000000, 100000),
    "escalationRate": FieldConstraint(
        "escalationRate",
        "Sum Assured Escalation Rate (%)",
        "number",
        False,
        0,
        20,
        0.5,
        placeholder="5",
        hint="Annual compounding increase in %.",
    ),
    "childName": FieldConstraint("childName", "Child Name", "str", False),
    "childDob": FieldConstraint("childDob", "Child Date Of Birth", "date", False),
    "partialMat.enabled": FieldConstraint("partialMat.enabled", "Enable Partial Maturity", "bool", False),
    "partialMat.count": FieldConstraint("partialMat.count", "Partial Maturity Count", "int", False, 0, 10, 1),
    "jointLife.enabled": FieldConstraint("jointLife.enabled", "Enable Joint Life", "bool", False),
    "jointLife.age": FieldConstraint("jointLife.age", "Second Life Age", "int", False, 18, 80, 1),
    "jointLife.gender": FieldConstraint("jointLife.gender", "Second Life Gender", "str", False, choices=("M", "F")),
}


PRODUCT_SPECS: Dict[str, ProductSpec] = {
    "term": ProductSpec(
        code="term",
        brand="liberty",
        display_name="Protection Cover",
        category="protection",
        description="Pure risk cover for a fixed period.",
        allowed_entry_age=(18, 65),
        allowed_term_years=(5, 35),
        maturity_age_limit=75,
        allowed_frequencies=("monthly", "quarterly", "annually"),
        allows_joint_life=True,
        allows_partial_maturity=True,
        supports_smoker_rating=True,
        required_fields=("age", "gender", "smoker", "freq", "sa", "term"),
        optional_fields=("partialMat.enabled", "partialMat.count", "jointLife.enabled", "jointLife.age", "jointLife.gender"),
        financial_limits={"sa": (100000, 10000000)},
        underwriting_flags={"medical_required_above_sa": 3000000, "max_policy_count": 5},
        default_assumptions={"mortality_loading": 0.0025, "male_factor": 1.15, "smoker_factor": 1.40},
        included_benefits=("Death Benefit", "Last Expense Cover", "Critical Illness"),
        optional_riders=("Accidental Death Benefit", "Waiver Of Premium", "Disability Income"),
        common_exclusions=("Suicide within waiting period", "Fraud or non-disclosure", "Sanctions restrictions"),
        servicing_features=("Beneficiary update", "Policy reinstatement", "Frequency switch"),
        compliance_requirements=("KYC documents", "PIN", "Beneficiary details", "Signed application"),
        notes="No maturity value under standard term contract.",
    ),
    "wholelife": ProductSpec(
        code="wholelife",
        brand="liberty",
        display_name="Whole Life Assurance",
        category="protection_with_value",
        description="Lifetime cover with potential surrender value.",
        allowed_entry_age=(18, 60),
        allowed_term_years=None,
        maturity_age_limit=None,
        allowed_frequencies=("monthly", "quarterly", "annually"),
        allows_joint_life=True,
        allows_partial_maturity=False,
        supports_smoker_rating=True,
        required_fields=("age", "gender", "smoker", "freq", "sa"),
        optional_fields=("jointLife.enabled", "jointLife.age", "jointLife.gender"),
        financial_limits={"sa": (100000, 10000000)},
        underwriting_flags={"cash_value_starts_after_year": 3, "medical_required_above_sa": 3000000},
        default_assumptions={"mortality_loading": 0.0040, "male_factor": 1.12, "smoker_factor": 1.45},
        included_benefits=("Death Benefit", "Last Expense Cover", "Guaranteed Cash Value"),
        optional_riders=("Critical Illness", "Hospital Cash", "Waiver Of Premium"),
        common_exclusions=("War risks", "Fraud or non-disclosure", "Sanctions restrictions"),
        servicing_features=("Policy loan", "Partial surrender", "Paid-up option"),
        compliance_requirements=("KYC documents", "Source of funds", "Medical evidence where required"),
    ),
    "endowment": ProductSpec(
        code="endowment",
        brand="liberty",
        display_name="Endowment/Savings Policy",
        category="savings",
        description="Protection plus disciplined savings to a maturity date.",
        allowed_entry_age=(18, 60),
        allowed_term_years=(5, 30),
        maturity_age_limit=75,
        allowed_frequencies=("monthly", "quarterly", "annually"),
        allows_joint_life=False,
        allows_partial_maturity=False,
        supports_smoker_rating=True,
        required_fields=("age", "gender", "smoker", "freq", "sa", "term"),
        optional_fields=(),
        financial_limits={"sa": (100000, 10000000)},
        underwriting_flags={"medical_required_above_sa": 2500000},
        default_assumptions={"savings_loading_factor": 1.3},
        included_benefits=("Death Benefit", "Maturity Benefit", "Last Expense"),
        optional_riders=("Premium Waiver", "Hospital Cash"),
        common_exclusions=("Fraud or non-disclosure", "Sanctions restrictions"),
        servicing_features=("Policy loan", "Paid-up option", "Maturity claim processing"),
        compliance_requirements=("KYC documents", "Beneficiary details", "Signed direct debit mandate"),
    ),
    "withprofit": ProductSpec(
        code="withprofit",
        brand="liberty",
        display_name="With-Profits Policy",
        category="participating",
        description="Participating policy with bonuses declared by the fund.",
        allowed_entry_age=(18, 60),
        allowed_term_years=(5, 30),
        maturity_age_limit=75,
        allowed_frequencies=("monthly", "quarterly", "annually"),
        allows_joint_life=False,
        allows_partial_maturity=False,
        supports_smoker_rating=False,
<<<<<<< HEAD
        required_fields=("age", "gender", "freq"),
=======
        required_fields=("age", "gender", "freq", "sa", "term"),
>>>>>>> 1591fabd3d48927e80bb401135c77a60004eb3e3
        optional_fields=(),
        financial_limits={"sa": (100000, 10000000), "escalationRate": (0, 20)},
        underwriting_flags={"bonus_non_guaranteed": True},
        default_assumptions={"illustrated_bonus_rate": 0.055, "escalation_rate": 0.05},
        included_benefits=("Basic Sum Assured", "Reversionary Bonus", "Terminal Bonus"),
        optional_riders=("Accidental Death Benefit",),
        common_exclusions=("Fraud or non-disclosure", "Sanctions restrictions"),
        servicing_features=("Annual bonus statement", "Policyholder dividend notice"),
        compliance_requirements=("KYC documents", "Suitability disclosure acknowledgement"),
    ),
    "pension": ProductSpec(
        code="pension",
        brand="liberty",
        display_name="Pension Plan",
        category="retirement",
        description="Long-term retirement accumulation plan.",
        allowed_entry_age=(18, 60),
        allowed_term_years=None,
        maturity_age_limit=70,
        allowed_frequencies=("monthly", "quarterly", "annually"),
        allows_joint_life=False,
        allows_partial_maturity=False,
        supports_smoker_rating=False,
        required_fields=("age", "gender", "freq", "contrib", "retireAge"),
        optional_fields=("pensionFundType", "pensionBalancedWeights"),
        financial_limits={"contrib": (2000, 100000000)},
        underwriting_flags={"tax_relief_limit_per_month": 30000},
        default_assumptions={"growth_rate": 0.08, "annuity_conversion_factor": 0.006},
        included_benefits=("Projected Retirement Fund", "Estimated Monthly Annuity", "Death Benefit"),
        optional_riders=("Additional voluntary contributions",),
        common_exclusions=("Tax law change risk", "Market return risk"),
        servicing_features=("Fund switching", "Contribution holiday", "Partial withdrawal after vesting"),
        compliance_requirements=("KYC documents", "PIN", "Nomination form", "Retirement benefit regulations"),
    ),
    "education": ProductSpec(
        code="education",
        brand="liberty",
        display_name="Education Savings Plan",
        category="goal_savings",
        description="Savings for education milestones with parent protection.",
        allowed_entry_age=(18, 60),
        allowed_term_years=(5, 20),
        maturity_age_limit=75,
        allowed_frequencies=("monthly", "quarterly", "semiannual", "annually"),
        allows_joint_life=True,
        allows_partial_maturity=True,
        supports_smoker_rating=False,
        required_fields=("age", "gender", "freq", "target", "term", "escalationRate"),
        optional_fields=("childName", "childDob", "partialMat.enabled", "partialMat.count", "jointLife.enabled", "jointLife.age", "jointLife.gender"),
        financial_limits={"target": (200000, 5000000), "term": (5, 25), "escalationRate": (0, 20)},
        underwriting_flags={"premium_waiver_on_parent_death": True},
        default_assumptions={"funding_factor": 1.22, "escalation_rate": 0.05},
        included_benefits=("Target Fund", "Milestone Disbursements", "Parent Death Benefit"),
        optional_riders=("Accidental Death Benefit", "Critical Illness"),
        common_exclusions=("Fraud or non-disclosure", "Sanctions restrictions"),
        servicing_features=("Milestone rescheduling", "Beneficiary updates", "Education planning support"),
        compliance_requirements=("KYC documents", "Child details", "Proof of relationship where needed"),
    ),
}


def list_brand_names() -> List[str]:
    return sorted(BRANDS.keys())


def list_product_codes(brand: Optional[str] = None) -> List[str]:
    if brand is None:
        return sorted(PRODUCT_SPECS.keys())
    return sorted([code for code, spec in PRODUCT_SPECS.items() if spec.brand == brand])


def get_product_spec(product: str) -> ProductSpec:
    return PRODUCT_SPECS[product]


def calculate_age_from_dob(dob_value: Any, as_of: Optional[date] = None) -> Optional[int]:
    """Return age from a YYYY-MM-DD date string/date, or None if invalid."""

    if dob_value in (None, ""):
        return None

    parsed: Optional[date] = None
    if isinstance(dob_value, datetime):
        parsed = dob_value.date()
    elif isinstance(dob_value, date):
        parsed = dob_value
    elif isinstance(dob_value, str):
        try:
            parsed = datetime.strptime(dob_value, "%Y-%m-%d").date()
        except ValueError:
            return None

    if parsed is None:
        return None

    today = as_of or date.today()
    age = today.year - parsed.year
    if (today.month, today.day) < (parsed.month, parsed.day):
        age -= 1
    return age


def normalize_payload(payload: Mapping[str, Any]) -> Dict[str, Any]:
    """Normalize aliases from UI and server callers into one shape."""

    normalized = dict(payload)
    if "contribution" in normalized and "contrib" not in normalized:
        normalized["contrib"] = normalized.get("contribution")
    if "jointLife" not in normalized:
        normalized["jointLife"] = {}
    if "partialMat" not in normalized:
        normalized["partialMat"] = {}
    if "escalation_rate" in normalized and "escalationRate" not in normalized:
        normalized["escalationRate"] = normalized.get("escalation_rate")
    if "escalation" in normalized and "escalationRate" not in normalized:
        normalized["escalationRate"] = normalized.get("escalation")
    if normalized.get("age") in (None, "") and normalized.get("dob"):
        calculated_age = calculate_age_from_dob(normalized.get("dob"))
        if calculated_age is not None:
            normalized["age"] = calculated_age
    # Ensure benefits structure exists and Death is enabled by default for products
    if "benefits" not in normalized or not isinstance(normalized.get("benefits"), Mapping):
        # default benefit set (Death mandatory, others optional)
        normalized["benefits"] = {
            "Death": True,
            "PTD": False,
            "CriticalIllness": False,
            "Retrenchment": False,
            "DoubleAccident": False,
        }
    else:
        # ensure Death is present and True by default if missing
        b = dict(normalized.get("benefits") or {})
        if "Death" not in b:
            b["Death"] = True
        normalized["benefits"] = b
    return normalized


def validate_payload(payload: Mapping[str, Any]) -> Tuple[bool, List[str]]:
    """Light validation against the product specification matrix."""

    errors: List[str] = []
    normalized = normalize_payload(payload)
    product = str(normalized.get("product", "")).strip()
    if product not in PRODUCT_SPECS:
        return False, [f"Unsupported product '{product}'."]

    spec = PRODUCT_SPECS[product]
    for field in spec.required_fields:
        value = _deep_get(normalized, field)
        if value in (None, ""):
            errors.append(f"Missing required field: {field}")

    age = normalized.get("age")
    if age is not None:
        min_age, max_age = spec.allowed_entry_age
        if age < min_age or age > max_age:
            errors.append(f"Entry age must be between {min_age} and {max_age} for {product}.")

    term = normalized.get("term")
    if term is not None and spec.allowed_term_years is not None:
        min_term, max_term = spec.allowed_term_years
        if term < min_term or term > max_term:
            errors.append(f"Term must be between {min_term} and {max_term} years for {product}.")

    # For education product ensure Death benefit is enabled
    if product == "education":
        benefits = normalized.get("benefits") or {}
        if not benefits.get("Death"):
            errors.append("Death benefit must be enabled for education policies.")

    for limit_field, (minimum, maximum) in spec.financial_limits.items():
        value = normalized.get(limit_field)
        if value is None:
            continue
        if minimum is not None and value < minimum:
            errors.append(f"{limit_field} must be at least {minimum}.")
        if maximum is not None and value > maximum:
            errors.append(f"{limit_field} must be at most {maximum}.")

    return len(errors) == 0, errors


def _deep_get(payload: Mapping[str, Any], path: str) -> Any:
    cur: Any = payload
    for part in path.split("."):
        if not isinstance(cur, Mapping) or part not in cur:
            return None
        cur = cur[part]
    return cur

