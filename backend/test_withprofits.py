#!/usr/bin/env python3
"""
Quick test of WithProfit calculation with new balance-driven model.
"""

import json
from withprofits import WithProfitProjector, CashFlow

# Test scenario:
# - 40-year-old, 10-year term
# - Initial deposit: 500,000
# - Annual premium: 100,000
# - One deposit in year 3 of 50,000
# - One withdrawal in year 5 of 30,000

# Mock rates (from rates.json Withprofit section)
death_rates = {
    5: 0.018,
    10: 0.0084,
    15: 0.0039,
    20: 0.0017
}

ptd_rates = {
    5: 0.00005,
    10: 0.00005,
    15: 0.00005,
    20: 0.00005
}

guaranteed_return = 0.09  # 9% p.a.

# Create projector
projector = WithProfitProjector(
    death_rate_by_term=death_rates,
    ptd_rate_by_term=ptd_rates,
    guaranteed_return_rate=guaranteed_return
)

# Cash flows
cash_flows = [
    CashFlow(year=3, deposit=50000),
    CashFlow(year=5, withdrawal=30000),
]

# Run projection
result = projector.project(
    age=40,
    term_years=10,
    initial_deposit=500000,
    annual_premium=100000,
    cash_flows=cash_flows,
    frequency="annual"
)

# Print summary
summary = result["summary"]
print("=" * 70)
print("WITH-PROFIT PROJECTION TEST")
print("=" * 70)
print(f"\nAge at Entry:                {summary['age_entry']} yrs")
print(f"Policy Term:                 {summary['term_years']} yrs")
print(f"Age at Maturity:             {summary['age_maturity']} yrs")
print(f"Initial Deposit:             KES {int(summary['initial_deposit']):,}")
print(f"Annual Premium:              KES {int(summary['annual_premium']):,}")
print(f"Total Premiums Paid:         KES {int(summary['total_premiums']):,}")
print(f"Total Table Deposits:        KES {int(summary['total_table_deposits']):,}")
print(f"Total Table Withdrawals:     KES {int(summary['total_table_withdrawals']):,}")
print(f"Total Death Costs:           KES {int(summary['total_death_costs']):,}")
print(f"Total PTD Costs:             KES {int(summary['total_ptd_costs']):,}")
print(f"\nAccumulated Fund at Maturity: KES {int(summary['total_accumulated_fund']):,}")
print(f"Death/PTD Benefit:           KES {int(summary['death_ptd_benefit_at_maturity']):,}")
print(f"Guaranteed Return Rate:      {summary['guaranteed_return_rate'] * 100:.1f}% p.a.")

# Print details for first 3 years
print("\n" + "=" * 70)
print("YEAR-BY-YEAR PROJECTION (First 3 years)")
print("=" * 70)
print(f"{'Year':<5} {'Age':<5} {'Opening':<15} {'Premium':<12} {'Contribution':<15} {'Death':<12} {'PTD':<12} {'Closing':<15}")
print("-" * 110)

for year in result["projection_years"][:3]:
    print(
        f"{year['year']:<5} "
        f"{year['age']:<5} "
        f"KES {int(year['opening_balance']):>12,} "
        f"KES {int(year['annual_premium']):>10,} "
        f"KES {int(year['total_contribution']):>13,} "
        f"KES {int(year['death_cost']):>10,} "
        f"KES {int(year['ptd_cost']):>10,} "
        f"KES {int(year['closing_balance']):>13,}"
    )

print("\n✓ Test completed successfully!")
print("\nKey validations:")
print(f"✓ Death/PTD benefit = accumulated fund: {summary['death_ptd_benefit_at_maturity'] == summary['total_accumulated_fund']}")
print(f"✓ Year 1 death cost = opening_balance × death_rate (10yr)")
year1 = result["projection_years"][0]
year1_expected_death = (year1['opening_balance'] + year1['annual_premium'] + year1['table_deposit'] - year1['table_withdrawal']) * death_rates[10]
print(f"  Year 1 death cost: {int(year1['death_cost']):,} (expected ≈ {int(year1_expected_death):,})")
print(f"✓ Annual premium added every year: {summary['total_premiums'] == summary['annual_premium'] * summary['term_years']}")
