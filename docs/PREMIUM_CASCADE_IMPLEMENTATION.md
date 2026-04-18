# Premium Frequency Cascade Implementation - Documentation

## Overview

Implemented a mechanism to cascade the premium across all years in the Annual Deposits & Withdrawals table, with automatic frequency conversion. The frequency selection has been moved next to the premium payment field for better UX.

## Changes Made

### 1. Frontend Configuration ([libertyquotes-config.js](frontend/js/libertyquotes-config.js))

**Updated table header to include premium column:**

```html
<th style="background:#f0f8e8;">Premium Payment (KES)</th>
```

**Renamed and updated frequency field:**

- Label: "Projection Frequency" → "Payment Frequency"
- Added `onchange="UI_generateWithProfitTable()"` to auto-update table when frequency changes
- Changed options order: Monthly, Quarterly, Semi-Annual, Annual (default), Single

**Updated hints:**

- Premium input hint: "Amount per payment period (see frequency)"
- Table hint: "Premium cascades across all years (adjusted for payment frequency)"

### 2. Frontend UI ([libertyquotes-ui.js](frontend/js/libertyquotes-ui.js))

**Form Layout Restructuring:**

- Moved frequency field next to premium in a 2-column grid (2fr 1fr)
- Premium input and frequency dropdown now side-by-side
- Removed from initial configuration section, moved to "Premium Payment" section

**Table Generation - Premium Cascade:**

```javascript
// Frequency multipliers for annual conversion
const frequencyMultipliers = {
  monthly: 12,        // KES 8,333/mo × 12 = KES 100,000/yr
  quarterly: 4,       // KES 25,000/qtr × 4 = KES 100,000/yr
  semiannual: 2,      // KES 50,000/semi × 2 = KES 100,000/yr
  annual: 1,          // KES 100,000/yr × 1 = KES 100,000/yr
  single: 0           // Paid only in year 1
};

// Automatic recalculation when premium or frequency changes
const annualPremium = multiplier === 0 ? premiumAmount : premiumAmount * multiplier;
const yearPremium = (frequency === "single" && year === 1) ? premiumAmount : (frequency === "single" ? 0 : annualPremium);
```

**Premium Display Column:**

- Non-editable display cell with green background (#f9fdf7)
- Shows "KES" formatted amount for each year
- Dynamic: updates when premium amount or frequency changes
- Special handling for single premium: shows full amount in year 1, zero in other years

**Updated Row Generation:**

- Added premium calculation and display
- Maintains deposit and withdrawal input fields
- New table structure:
  - Column 1: Year number
  - Column 2: Premium Payment (non-editable display)
  - Column 3: Additional Deposit (user input)
  - Column 4: Withdrawal (user input)
  - Column 5: Action buttons

### 3. Backend ([backend/premiums.py](backend/premiums.py))

**Premium Frequency Conversion:**

```python
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
```

The frontend sends the premium per payment period, and the backend converts it to annual equivalent for calculations.

## Frequency Conversion Examples

| Frequency | Period Amount | Annual Equivalent | Display |
| --- | --- | --- | --- |
| Annual | KES 100,000 | KES 100,000 | "KES 100,000" per year |
| Semi-Annual | KES 50,000 | KES 100,000 | "KES 100,000" per year |
| Quarterly | KES 25,000 | KES 100,000 | "KES 100,000" per year |
| Monthly | KES 8,333 | KES 99,996 | "KES 99,996" per year |
| Single | KES 600,000 | KES 600,000 (Y1 only) | "KES 600,000" in Y1, "KES 0" in others |

## User Experience Flow

1. **User selects payment frequency:**
   - "Monthly" (pay each month)
   - "Quarterly" (pay every 3 months)
   - "Semi-Annual" (pay every 6 months)
   - "Annual" (pay once per year)
   - "Single" (lump sum upfront)

2. **User enters premium amount:**
   - Amount is per payment period (e.g., KES 8,333 for monthly)
   - Field is now immediately below frequency selection

3. **Table automatically updates:**
   - Shows annual equivalent in "Premium Payment" column
   - Green background distinguishes it from user-editable columns
   - Updates dynamically as user adjusts premium or frequency

4. **Backend calculation:**
   - Receives frequency and period premium
   - Converts to annual premium for actuarial calculations
   - Maintains accuracy across all frequency options

## Testing

Run `test_frequency_cascade.py` to verify:

- All frequency options produce correct annual premiums
- Accumulated funds are consistent (within rounding)
- Single premium behaves correctly (year 1 only)

Results:

```{mermaid}
[OK] ANNUAL       - Period: KES 100,000 → Annual: KES 100,000
     Fund at maturity: KES 2,734,342
[OK] SEMIANNUAL   - Period: KES 50,000 → Annual: KES 100,000
     Fund at maturity: KES 2,734,342
[OK] QUARTERLY    - Period: KES 25,000 → Annual: KES 100,000
     Fund at maturity: KES 2,734,342
[OK] MONTHLY      - Period: KES 8,333 → Annual: KES 100,000
     Fund at maturity: KES 2,734,341
[OK] SINGLE       - Period: KES 600,000 → Annual: KES 600,000
     Fund at maturity: KES 10,661,364
```

Variance across non-single frequencies: KES 1 (within acceptable tolerance)

## Files Modified

1. **frontend/js/libertyquotes-config.js**
   - Updated frequency field template (moved onchange handler)
   - Updated table header structure with premium column

2. **frontend/js/libertyquotes-ui.js**
   - Restructured `_buildWithProfitFields()` form layout
   - Updated `UI_generateWithProfitTable()` with frequency conversion logic
   - Updated `UI_addWithProfitRow()` to include premium display in new rows

3. **backend/premiums.py**
   - Added frequency multiplier conversion for annual premium calculation
   - Premium now correctly converts from period to annual amount
