# With-Profits Policy Implementation Guide

## Overview

The With-Profits policy feature has been implemented as a unit-linked product with accumulation projections and interactive fund management. This guide explains the architecture, features, and how to use the system.

## Features Implemented

### 1. **Backend Projection Engine** (`withprofits.py`)

- **WithProfitProjector class**: Core calculation engine for accumulating fund projections
- **CashFlow class**: Represents annual deposits and withdrawals
- **ProjectionYear class**: Year-by-year breakdown of fund accumulation
- **Guaranteed Return**: Fixed annual growth rate applied to accumulated fund
- **Death/PTD Benefits**:
  - Fixed KES 100,000 minimum guaranteed
  - Death and PTD premiums apply only to the guarantee amount
  - Remaining premium allocated to fund accumulation
  - Benefit at death/PTD = max(100,000, accumulated fund)

### 2. **Frontend Interactive UI**

- **Dynamic Table**: User can add/remove years for flexible policy term
- **Annual Deposits & Withdrawals**: Row-by-row entry for each year
- **Frequency Selection**: Monthly, quarterly, semi-annual, annual, or single premium
- **Running Balance Display**: Shows year-by-year fund projections
- **Automatic Row Generation**: Based on policy term selected

### 3. **Premium Calculation Logic**

For each year:

```{mermaid}
Premium = (Death cost + PTD cost) + (Allocable to fund)
Where:
  Death cost = 100,000 × Death rate
  PTD cost = 100,000 × PTD rate
  Allocable to fund = Total annual premium - Death cost - PTD cost
```

### 4. **Fund Accumulation Formula**

```{mermaid}
Year N Fund Balance = Opening Balance + (Annual contribution - withdrawals) × (1 + GuaranteedReturn)
At Death/PTD = max(100,000, Fund Balance)
```

## File Structure

### Backend Files

- **`backend/withprofits.py`** - NEW: Core projection calculation engine
- **`backend/premiums.py`** - MODIFIED: Added WithProfit product calculation logic
- **`backend/rates.json`** - Already contains Withprofit rates (Death, PTD, GuaranteedReturn)
- **`backend/productspecs.py`** - Already defines "withprofit" product specification

### Frontend Files

- **`frontend/js/libertyquotes-config.js`** - MODIFIED: Added WithProfit form fields and table template
- **`frontend/js/libertyquotes-ui.js`** - MODIFIED: Added WithProfit field building and table management
- **`frontend/js/libertyquotes-output.js`** - MODIFIED: Added projection table rendering

## Rate Configuration

### Current Rates (rates.json - "Withprofit" section)

```json
{
  "Death": { 
    "5": 0.018108000, "6": 0.014419670, ... "20": 0.001740000 
  },
  "PTD": { 
    "5": 0.000046820, "6": 0.000046490, ... "20": 0.000041380 
  },
  "GuaranteedReturn": { 
    "5": 0.09, "6": 0.09, ... "20": 0.09 
  }
}
```

**Notes on Rates**:

- Death rates decline with term duration (higher risk for shorter terms)
- PTD rates are very small (approximately 0.004% annually)
- GuaranteedReturn of 9% is used for fund accumulation
  - ⚠️ **IMPORTANT**: This is high for a guarantee. Consider adjusting to 2-5% depending on your investment strategy
  - This rate is applied to accumulated fund each year

## How It Works

### Step 1: User Selects WithProfit Product

User clicks "With-Profits Policy" from product grid

### Step 2: Enter Personal Details

- Name, DOB, age, gender, etc. (standard fields)

### Step 3: Enter WithProfit-Specific Parameters

1. **Initial Deposit**: Opening fund amount (default: KES 500,000)
2. **Policy Term**: Years of policy (5-35 years)
3. **Annual Premium**: Amount to pay each year (default: KES 100,000)
4. **Projection Frequency**: How often premiums are paid
5. **Deposit/Withdrawal Table**:
   - Auto-generates rows based on policy term
   - User enters annual top-ups and withdrawals
   - Can add/remove years with buttons

### Step 4: Generate Quote

System calculates:

- Death/PTD premiums for guaranteed KES 100,000
- Fund allocation (premium minus cost of death/PTD coverage)
- Year-by-year accumulation with guaranteed returns
- Projection showing running balance each year
- Death/PTD benefit at each year (max of guarantee or accumulated fund)

### Step 5: Display Results

Quote shows:

- **Policy Parameters**: Entry age, term, premium amounts
- **Accumulation Projection Table**:
  - Year | Age | Opening Fund | Annual Deposit | Withdrawal | Premium | Fund Growth | Closing Fund | Death/PTD Benefit
- **Summary Statistics**:
  - Total premiums paid
  - Total deposits and withdrawals
  - Fixed guarantee amount
  - Accumulated fund
  - Total benefit at maturity

## API Integration

### Input Payload (JavaScript → Backend)

```javascript
{
  product: "withprofit",
  age: 35,
  gender: "M",
  smoker: "NS",
  freq: "monthly",
  dob: "1989-04-15",
  
  // WithProfit specific
  withProfit: {
    initialDeposit: 500000,
    term: 15,
    frequency: "annual",
    annualPremium: 100000,
    cashFlows: [
      { year: 1, deposit: 0, withdrawal: 0 },
      { year: 2, deposit: 50000, withdrawal: 0 },
      { year: 3, deposit: 0, withdrawal: 10000 }
    ]
  }
}
```

### Output Response (Backend → Frontend)

```javascript
{
  premium: 8333,  // Monthly display amount
  benefits: [
    { risk: "Fixed Guarantee", coverage: "KES 100,000", ... },
    { risk: "Accumulated Fund", coverage: "KES 1,234,567", ... },
    { risk: "Total Benefit", coverage: "KES 1,234,567", highlight: true }
  ],
  details: [
    ["Age at Entry", "35 yrs"],
    ["Policy Term", "15 yrs"],
    ...
  ],
  withProfitProjection: {
    projection_years: [
      {
        year: 1, age: 35, opening_balance: 500000,
        annual_deposit: 0, annual_withdrawal: 0,
        allocable_to_fund: 95000, fund_growth: 8550,
        closing_balance: 603550,
        total_at_death_ptd: 603550
      },
      ...
    ],
    summary: {
      total_premiums: 1500000,
      total_deposits: 50000,
      total_withdrawals: 10000,
      total_accumulated_fund: 2800000,
      total_at_maturity: 2800000
    }
  }
}
```

## Usage Scenarios

### Scenario 1: Simple Annual Contribution

- Initial: KES 500,000
- Annual: KES 100,000
- Term: 10 years
- No additional deposits/withdrawals
- Result: Shows accumulated fund projections

### Scenario 2: With Top-ups

- Initial: KES 500,000
- Annual: KES 50,000
- Year 5: Add KES 200,000 top-up
- Year 8: Add KES 150,000 top-up
- Result: Projection reflects increased fund growth from top-ups

### Scenario 3: With Withdrawals

- Initial: KES 1,000,000
- Annual: KES 75,000
- Year 3: Withdraw KES 100,000
- Year 7: Withdraw KES 150,000
- Result: Projection shows impact of withdrawals on fund balance

### Scenario 4: Flexible Premium Frequency

- Choose "monthly" to see monthly premium equivalent
- Choose "quarterly" for quarterly payments
- Choose "single" for lump sum
- Display shows premium for selected frequency

## Age and Term Rules

- **Entry Age**: 18-60 years (per productspecs.py)
- **Policy Term**: 5-30 years
- **Maturity Age Limit**: 75 years (calculated from entry age + term)

## Death/PTD Calculation Details

### Year 1 Example (15-year policy, KES 100,000 annual premium)

```{mermaid}
Death rate for 15-year term: 0.00307 (0.307% p.a.)
PTD rate for 15-year term: 0.00004286 (0.004286% p.a.)

Death benefit cost: 100,000 × 0.00307 = KES 307
PTD benefit cost: 100,000 × 0.00004286 = KES 4.29
Total cost per year: KES 311.29

Allocable to fund: 100,000 - 311.29 = KES 99,688.71

Fund growth (9% p.a.): 99,688.71 × 0.09 = KES 8,972
Closing balance: 500,000 + 99,688.71 + 8,972 = KES 608,660.71
Benefit at death: max(100,000, 608,660.71) = KES 608,660.71
```

## Important Notes

1. **Guaranteed Return Rate**: The 9% rate in rates.json is relatively high. Verify this is appropriate for your product design. Consider updating to 2-5% for more realistic guarantees.

2. **Death/PTD Costs**: These are calculated on the KES 100,000 fixed guarantee only, not on the accumulated fund.

3. **Premium Allocation**: The system assumes premium frequency is converted to annual equivalents for calculation purposes.

4. **Withdrawals**: Withdrawals reduce the fund balance and thus affect future growth projections.

5. **Single Premium**: When "single" frequency is selected, premium = 0 in the frequency multiplier (no recurring payment needed).

6. **Year-by-Year Flexibility**: Users can add unlimited years to the policy term, allowing for complex projections with varying deposits and withdrawals.

## Testing Checklist

- [ ] Generate quote with basic WithProfit parameters
- [ ] Verify projection table displays correctly
- [ ] Test adding/removing rows from deposit/withdrawal table
- [ ] Test different frequency selections
- [ ] Verify death/PTD benefit calculations
- [ ] Test with multiple top-ups and withdrawals
- [ ] Verify rates are loaded correctly from rates.json
- [ ] Test printing quote (should include projection table)
- [ ] Test email sending (should capture WithProfit details)
- [ ] Verify responsive layout on mobile browsers

## Customization Options

### Adjust Guaranteed Return Rate

Edit `backend/rates.json`:

```{json}
"GuaranteedReturn": {
  "5": 0.04,    // Changed from 0.09
  "6": 0.04,
  ...
}
```

### Modify Death/PTD Minimum Guarantee

Edit `backend/withprofits.py`:

```{python}
FIXED_GUARANTEE = 150000  # Changed from 100,000
```

### Change Age/Term Restrictions

Edit `backend/productspecs.py` - "withprofit" ProductSpec:

```{python}
allowed_entry_age=(18, 65),  # Adjust range
allowed_term_years=(3, 40),  # Adjust range
maturity_age_limit=80,       # Adjust limit
```

## Troubleshooting

### Issue: Projection shows KES 0 for fund

**Solution**: Verify annual premium is entered. If premium = 0, fund won't grow.

### Issue: Table not showing any rows

**Solution**: Ensure policy term is entered (minimum 5 years).

### Issue: Death rate lookup fails

**Solution**: Check that rates.json has Withprofit section with Death, PTD, and GuaranteedReturn rates for the selected term.

### Issue: Premium calculation seems wrong

**Solution**: Remember death/PTD costs apply to KES 100,000 guarantee only, not the full premium.

## Future Enhancements

1. **Interactive Charts**: Add year-by-year graphs showing fund growth
2. **Comparison Tool**: Compare WithProfit vs other products
3. **Scenario Analysis**: "What-if" calculator for different return rates
4. **Bonus Additions**: Include reversionary and terminal bonus projections
5. **Inflation Adjustment**: Option to escalate premiums annually
6. **Tax Efficiency**: Show tax-adjusted projections
