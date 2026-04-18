"""
Pension Plan Projection Engine

Handles accumulation projections for pension plans including:
- Initial deposits and top-ups
- Scheduled withdrawals
- Running balance calculations with fund-based returns
- Multiple fund type options with flexible weighting
"""

from __future__ import annotations
from typing import Dict, List, Any, Mapping, Optional
from dataclasses import dataclass, asdict


@dataclass
class CashFlow:
    """Represents a single year's deposit/withdrawal."""
    year: int
    deposit: float = 0.0
    withdrawal: float = 0.0

    def net_flow(self) -> float:
        """Return net cash flow (deposit - withdrawal)."""
        return self.deposit - self.withdrawal


@dataclass
class ProjectionYear:
    """Year-by-year projection detail."""
    year: int
    age: int
    opening_balance: float
    annual_premium: float
    table_deposit: float
    table_withdrawal: float
    total_contribution: float
    death_cost: float
    ptd_cost: float
    balance_after_costs: float
    fund_growth: float
    closing_balance: float
    death_ptd_benefit: float


class PensionProjector:
    """
    Projects pension plan accumulation over time.
    
    Key design:
    - Opening balance + annual premium + table deposits - table withdrawals
    - Death/PTD costs calculated on the accumulated balance at each year
    - Remaining balance grows at fund return rate (based on fund type)
    - Death/PTD benefit = accumulated balance
    - Supports multiple fund types: Conservative, Aggressive, Balanced (custom weightings)
    """

    def __init__(self, 
                 death_rate_by_term: Dict[int, float],
                 ptd_rate_by_term: Dict[int, float],
                 fund_return_rate: float):
        """
        Initialize with rate factors.
        
        Args:
            death_rate_by_term: Dict mapping term_years to annual death rate
            ptd_rate_by_term: Dict mapping term_years to annual PTD rate
            fund_return_rate: Annual fund return rate based on selected fund type (e.g., 0.075 for 7.5%)
        """
        self.death_rate_by_term = death_rate_by_term
        self.ptd_rate_by_term = ptd_rate_by_term
        self.fund_return_rate = fund_return_rate

    def project(self,
                age: int,
                term_years: int,
                initial_deposit: float,
                annual_premium: float,
                cash_flows: List[CashFlow],
                frequency: str = "annual") -> Dict[str, Any]:
        """
        Project pension accumulation over term.
        
        Args:
            age: Current age of policyholder
            term_years: Policy term in years
            initial_deposit: Starting balance
            annual_premium: Annual premium (recurring every year)
            cash_flows: List of additional deposits/withdrawals per year
            frequency: Premium frequency (affects display, but calculation is annual)
        
        Returns:
            Dict with projection details and year-by-year breakdown
        """
        
        # Build year-by-year projections
        projection_years: List[ProjectionYear] = []
        balance = initial_deposit
        
        for year in range(1, term_years + 1):
            current_age = age + year - 1
            
            # Get rates for this term (with boundary handling)
            death_rate = self._get_rate(term_years, self.death_rate_by_term)
            ptd_rate = self._get_rate(term_years, self.ptd_rate_by_term)
            
            # Opening balance
            opening_balance = balance
            
            # Get cash flows from table for this year
            cf = self._get_cash_flow(year, cash_flows)
            table_deposit = cf.deposit if cf else 0.0
            table_withdrawal = cf.withdrawal if cf else 0.0
            
            # Total contribution: annual premium + table deposits - table withdrawals
            total_contribution = annual_premium + table_deposit - table_withdrawal
            
            # Add contribution to balance
            balance_with_contribution = opening_balance + total_contribution
            
            # Calculate death/PTD costs based on CURRENT accumulated balance
            death_cost = balance_with_contribution * death_rate
            ptd_cost = balance_with_contribution * ptd_rate
            total_cost = death_cost + ptd_cost
            
            # Balance after costs
            balance_after_costs = balance_with_contribution - total_cost
            
            # Apply fund return to remaining balance
            fund_growth = balance_after_costs * self.fund_return_rate
            closing_balance = balance_after_costs + fund_growth
            
            # Benefit at death/PTD = accumulated balance
            death_ptd_benefit = closing_balance
            
            # Store year projection
            py = ProjectionYear(
                year=year,
                age=current_age,
                opening_balance=opening_balance,
                annual_premium=annual_premium,
                table_deposit=table_deposit,
                table_withdrawal=table_withdrawal,
                total_contribution=total_contribution,
                death_cost=death_cost,
                ptd_cost=ptd_cost,
                balance_after_costs=balance_after_costs,
                fund_growth=fund_growth,
                closing_balance=closing_balance,
                death_ptd_benefit=death_ptd_benefit
            )
            projection_years.append(py)
            
            # Update balance for next year
            balance = closing_balance
        
        # Summary
        final_year = projection_years[-1] if projection_years else None
        total_accumulated = final_year.closing_balance if final_year else 0.0
        total_death_ptd_benefit = final_year.death_ptd_benefit if final_year else 0.0
        total_premiums_paid = annual_premium * term_years
        total_table_deposits = sum(cf.deposit for cf in cash_flows) if cash_flows else 0.0
        total_table_withdrawals = sum(cf.withdrawal for cf in cash_flows) if cash_flows else 0.0
        total_death_costs = sum(py.death_cost for py in projection_years)
        total_ptd_costs = sum(py.ptd_cost for py in projection_years)
        
        return {
            "projection_years": [asdict(py) for py in projection_years],
            "summary": {
                "age_entry": age,
                "age_maturity": age + term_years,
                "term_years": term_years,
                "frequency": frequency,
                "initial_deposit": initial_deposit,
                "annual_premium": annual_premium,
                "total_premiums": total_premiums_paid,
                "total_table_deposits": total_table_deposits,
                "total_table_withdrawals": total_table_withdrawals,
                "total_death_costs": round(total_death_costs, 2),
                "total_ptd_costs": round(total_ptd_costs, 2),
                "total_accumulated_fund": round(total_accumulated, 2),
                "death_ptd_benefit_at_maturity": round(total_death_ptd_benefit, 2),
                "fund_return_rate": self.fund_return_rate,
            }
        }

    def _get_rate(self, duration: int, rate_dict: Dict[int, float]) -> float:
        """
        Retrieve rate for a given duration with boundary handling.
        
        - For durations < 5: use 5-year rate
        - For durations > 20: use 20-year rate
        - Otherwise: use exact match or closest available
        """
        if duration < 5:
            return float(rate_dict.get(5, 0.0))
        if duration > 20:
            return float(rate_dict.get(20, 0.0))
        if duration in rate_dict:
            return float(rate_dict[duration])
        
        # Find closest available rate
        sorted_terms = sorted([int(k) for k in rate_dict.keys()])
        if sorted_terms:
            # Find closest term
            for term in sorted_terms:
                if term >= duration:
                    return float(rate_dict[term])
            # If no term >= duration, use the highest
            return float(rate_dict[sorted_terms[-1]])
        return 0.0

    def _get_cash_flow(self, year: int, cash_flows: List[CashFlow]) -> Optional[CashFlow]:
        """Get cash flow for a specific year."""
        for cf in cash_flows:
            if cf.year == year:
                return cf
        return None
