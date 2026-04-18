# With-Profits Policy - Quick Start Guide

## What Was Built

A complete **interactive With-Profits policy quoting system** with:

✅ **Backend Projection Engine** - Calculates fund accumulation year-by-year  
✅ **Interactive UI Table** - User can manage annual deposits and withdrawals  
✅ **Premium Breakdown** - Death/PTD costs separated from fund allocation  
✅ **Flexible Frequency** - Monthly, quarterly, semi-annual, annual, or single premium  
✅ **Extended Policy Terms** - Add/remove years dynamically  
✅ **Visual Projection Output** - Year-by-year table with running balances  

## How Users Access It

1. **Launch Quote Portal** → Run `python backend/quote_server.py`
2. **Open Browser** → Navigate to the Liberty Life portal
3. **Select "With-Profits Policy"** → From product grid (participating category 📈)
4. **Fill Personal Details** → Name, age, gender, contact info
5. **Enter WithProfit Parameters**:
   - Initial Deposit (e.g., KES 500,000)
   - Policy Term (e.g., 15 years)
   - Annual Premium (e.g., KES 100,000)
   - Projection Frequency (choose one)
6. **Add Top-ups/Withdrawals** → In the interactive table (optional)
7. **Generate Quote** → View year-by-year fund projections
8. **Print or Email** → Share with sales team

## Key Features Explained

### Fixed Guarantee (KES 100,000)
- Minimum guaranteed payment on death or permanent total disability
- Death/PTD premium costs apply ONLY to this guarantee
- Fund accumulated above this amount

### Premium Allocation
For a KES 100,000 annual premium:
- ~KES 307/year → Death benefit on guarantee
- ~KES 4/year → PTD benefit on guarantee  
- ~KES 99,689/year → Goes into accumulating fund

### Fund Growth
- Each year's fund balance grows at **9% guaranteed return**
- Formula: `Fund = Previous Balance + Premium Allocation + Growth`
- Users can withdraw from fund in specific years

### Death/PTD Benefit
- Always pays the **GREATER** of:
  - KES 100,000 (fixed guarantee), OR
  - Accumulated fund amount
- So benefit grows as fund accumulates

## Example Projection

**Policy Details**:
- Entry Age: 35 years
- Term: 10 years
- Initial Deposit: KES 500,000
- Annual Premium: KES 100,000
- No top-ups or withdrawals

**Year 1 Calculation**:
```
Opening Balance:       KES 500,000
Annual Premium:        KES 100,000
Death Cost (307/yr):   (KES 311)
Allocable to Fund:     KES 99,689
Fund Growth (9%):      KES 8,972
Closing Balance:       KES 608,660
Death/PTD Benefit:     KES 608,660 ✓ (exceeds 100k guarantee)
```

**Year 10 Result**:
- Total Premiums Paid: KES 1,000,000
- Accumulated Fund: ~KES 1,800,000+
- Total Benefit at Death/PTD: ~KES 1,800,000+

## File Changes Made

### New Files
- **`backend/withprofits.py`** - Core calculation engine
  - `WithProfitProjector` class
  - `CashFlow` and `ProjectionYear` dataclasses
  - Year-by-year accumulation logic

- **`WITHPROFITS_IMPLEMENTATION.md`** - Complete technical documentation

### Modified Files
- **`backend/premiums.py`**
  - Imports new `withprofits` module
  - Added WithProfit product calculation branch
  - Passes projection data to output renderer

- **`frontend/js/libertyquotes-config.js`**
  - Added WithProfit form fields (initial, term, frequency)
  - Added interactive table HTML template

- **`frontend/js/libertyquotes-ui.js`**
  - Added `_buildWithProfitFields()` function
  - Added `UI_generateWithProfitTable()` for row creation
  - Added `UI_addWithProfitRow()` / `UI_removeWithProfitRow()` for table management
  - Added `UI_getWithProfitCashFlows()` to collect deposits/withdrawals
  - Updated `UI_submitForQuote()` to handle WithProfit data

- **`frontend/js/libertyquotes-output.js`**
  - Added `_renderWithProfitProjection()` function
  - Displays year-by-year projection table in quote output

### Unchanged (Already Configured)
- **`backend/rates.json`** - Already has Withprofit rates
- **`backend/productspecs.py`** - Already defines withprofit product

## Testing the System

### Quick Test
1. Start server: `python backend/quote_server.py`
2. Select "With-Profits Policy"
3. Enter details:
   - Name/DOB (arbitrary values)
   - Initial Deposit: 500000
   - Term: 10
   - Premium: 100000
4. Keep deposit/withdrawal table blank
5. Generate quote → Should show 10-year projection

### Advanced Test (With Top-ups)
1. In the table, add:
   - Year 3: Deposit 200,000
   - Year 6: Deposit 150,000
2. Generate quote → Fund should grow faster due to top-ups

### Test Withdrawals
1. In the table, add:
   - Year 4: Withdrawal 100,000
   - Year 8: Withdrawal 50,000
2. Generate quote → Fund should reduce, affecting future growth

## Important Considerations

### Guaranteed Return Rate (9%)
⚠️ **This is HIGH**. Typical insurance guarantees are 2-5%.

**To adjust**:
- Edit `backend/rates.json`
- Find `Withprofit.GuaranteedReturn`
- Change `0.09` to your desired rate (e.g., `0.03` for 3%)

### Minimum Guarantee (KES 100,000)
Currently hard-coded as `FIXED_GUARANTEE = 100000` in `withprofits.py`

**To change**:
- Edit line in `backend/withprofits.py`
- Update accordingly in rate calculations

### Age/Term Restrictions
- Entry: 18-60 years
- Term: 5-30 years
- Maturity cap: 75 years

**To adjust**: Edit `backend/productspecs.py` - "withprofit" specification

## Rate Configuration Details

From `rates.json` → `Withprofit.benefits`:

| Term | Death Rate | PTD Rate | Guaranteed Return |
|------|-----------|---------|-------------------|
| 5    | 0.0181    | 0.0000468 | 0.09 (9%) |
| 10   | 0.0070    | 0.0000439 | 0.09 (9%) |
| 15   | 0.0031    | 0.0000429 | 0.09 (9%) |
| 20   | 0.0017    | 0.0000414 | 0.09 (9%) |

**Key points**:
- Death rates decline with longer terms (lower risk)
- PTD rates stay very small (~0.004%)
- Guaranteed return is flat 9% across all terms

## Common Use Cases

### Case 1: Regular Saver
- Annual Premium: KES 120,000/year
- Frequency: Annual
- Term: 20 years
- Result: Long-term wealth accumulation with guaranteed minimum

### Case 2: Lump Sum with Annual Top-ups
- Initial: KES 2,000,000
- Annual Premium: KES 50,000
- Flexible withdrawals as needed
- Result: Flexible fund management

### Case 3: Youth Protection Plan
- Entry Age: 25
- Annual: KES 60,000
- Term: 30 years (to age 55)
- No withdrawals
- Result: Solid retirement fund

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No projection table appears | Verify premium amount > 0 |
| Rows don't show in table | Ensure term ≥ 5 years |
| Premium appears too high | Check rate calculations; may be in-line with policy design |
| Guarantee not showing | Verify rates.json loads correctly |

## Next Steps

1. **Test end-to-end** with sample customers
2. **Adjust guaranteed return rate** if 9% doesn't match your product
3. **Review rate factors** with actuarial team
4. **Customize minimum guarantee** amount if needed
5. **Add bonus calculations** (reversionary/terminal) if desired
6. **Implement inflation escalation** for premiums (future enhancement)

## Support

For detailed technical information, refer to:
- **Full Docs**: `WITHPROFITS_IMPLEMENTATION.md`
- **Code**: `backend/withprofits.py` (well-documented)
- **Config**: Check `rates.json` for rate values
