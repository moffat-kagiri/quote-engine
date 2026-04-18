#!/usr/bin/env python3
"""
Test the quote_server API with WithProfit product.
"""

import json
import urllib.request
import urllib.error

# Test payload for WithProfit with MONTHLY frequency
payload = {
    "product": "withprofit",
    "age": 40,
    "gender": "M",
    "smoker": False,
    "freq": "annually",  # Required field
    "withProfit": {
        "initialDeposit": 500000,
        "term": 10,
        "frequency": "monthly",  # Monthly frequency
        "annualPremium": 8333,  # This will be multiplied by 12 to get 100,000 annually
        "cashFlows": [
            {"year": 3, "deposit": 50000, "withdrawal": 0},
            {"year": 5, "deposit": 0, "withdrawal": 30000},
        ]
    }
}

# Send POST request
url = "http://localhost:5050/quote"
headers = {"Content-Type": "application/json"}
data = json.dumps(payload).encode('utf-8')

try:
    request = urllib.request.Request(url, data=data, headers=headers, method='POST')
    with urllib.request.urlopen(request, timeout=10) as response:
        result = json.loads(response.read().decode('utf-8'))
        
        print("=" * 70)
        print("WITHPROFIT QUOTE API TEST")
        print("=" * 70)
        
        # Check for errors
        if result.get("error"):
            print(f"\n[ERROR] {result['error']}")
            if result.get("details"):
                print(f"  Details: {result['details']}")
        else:
            print(f"\n[OK] Quote generated successfully!")
            
            # List top-level keys in response
            print(f"\nResponse keys: {list(result.keys())}")
            
            print(f"\nProduct: {result.get('product', 'N/A')}")
            print(f"Premium: KES {result.get('premium', 0):,}")
            
            # Check for projection data
            if "withProfitProjection" in result:
                proj = result["withProfitProjection"]
                summary = proj.get("summary", {})
                print(f"\n[OK] Projection data found!")
                print(f"  Initial Deposit: KES {int(summary.get('initial_deposit', 0)):,}")
                print(f"  Annual Premium: KES {int(summary.get('annual_premium', 0)):,}")
                print(f"  Total Accumulated: KES {int(summary.get('total_accumulated_fund', 0)):,}")
                print(f"  Death/PTD Benefit: KES {int(summary.get('death_ptd_benefit_at_maturity', 0)):,}")
                print(f"  Guaranteed Return: {summary.get('guaranteed_return_rate', 0) * 100:.1f}% p.a.")
                print(f"\n  Total Death Costs: KES {int(summary.get('total_death_costs', 0)):,}")
                print(f"  Total PTD Costs: KES {int(summary.get('total_ptd_costs', 0)):,}")
                
                # Show first year details
                if proj.get("projection_years"):
                    year1 = proj["projection_years"][0]
                    print(f"\n  Year 1 Details:")
                    print(f"    Opening Balance: KES {int(year1.get('opening_balance', 0)):,}")
                    print(f"    Annual Premium: KES {int(year1.get('annual_premium', 0)):,}")
                    print(f"    Death Cost: KES {int(year1.get('death_cost', 0)):,}")
                    print(f"    PTD Cost: KES {int(year1.get('ptd_cost', 0)):,}")
                    print(f"    Closing Balance: KES {int(year1.get('closing_balance', 0)):,}")
            else:
                print("\n[WARNING] No projection data (withProfitProjection) in response")
                if "details" in result:
                    print(f"\nDetails in response:")
                    for detail in result["details"]:
                        print(f"  {detail}")
                
            # Show benefits if available
            if "benefits" in result:
                print(f"\nBenefits ({len(result['benefits'])} items):")
                for i, benefit in enumerate(result["benefits"][:3]):
                    print(f"  {i+1}. {benefit.get('risk', 'N/A')}: {benefit.get('coverage', 'N/A')}")
        
        print("\n" + "=" * 70)
        
except urllib.error.URLError as e:
    print(f"[ERROR] Connection error: {e}")
    print("  Make sure Flask server is running on http://localhost:5050")
except json.JSONDecodeError as e:
    print(f"[ERROR] JSON decode error: {e}")
    print("  Response may not be valid JSON")
except Exception as e:
    print(f"[ERROR] Unexpected error: {e}")
