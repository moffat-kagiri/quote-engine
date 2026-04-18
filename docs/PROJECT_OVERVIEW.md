# Liberty Life Insurance Quote Portal - Project Overview

## Executive Summary

The **Liberty Life Insurance Quote Portal** is a modern, spec-driven quote engine that generates personalized insurance quotes across multiple product lines. The system features a responsive web interface connecting to a Flask backend with sophisticated pricing engines, supporting everything from simple term insurance to complex pension planning and with-profits policies.

**Key Characteristics:**

- **Multi-product support**: Term, Whole Life, Endowment, With-Profits, Pension, Education Savings
- **Spec-driven architecture**: Product definitions, validation rules, and field constraints managed centrally
- **Dual-engine pricing**: Python fallback with optional Excel autorater integration
- **Rich UI interactions**: Dynamic forms, interactive tables, fund allocation controls
- **Legal compliance**: "Expected returns" language to minimize liability, comprehensive benefit disclosures

---

## Project Goals

1. **Automate Quote Generation** - Enable customers and sales teams to generate quotes instantly without manual calculation
2. **Flexible Product Configuration** - Support diverse product lines with different requirements and features
3. **Accurate Pricing** - Leverage proven Excel rate tables with Python fallback for reliability
4. **User-Friendly Experience** - Intuitive form validation, progress tracking, and quote presentation
5. **Compliance & Risk Mitigation** - Proper disclaimers, illustrated returns language, and audit trails

---

## Architecture Overview

```{mermaid}
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/JavaScript)                    │
│  libertyquotes.html + 4 JS modules                               │
│  ├─ libertyquotes-config.js      (UI templates & field mapping) │
│  ├─ libertyquotes-ui.js          (Form logic & interactions)    │
│  ├─ libertyquotes-api.js         (HTTP client & quote calls)    │
│  └─ libertyquotes-output.js      (Quote rendering & email)      │
└──────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌──────────────────────────────────────────────────────────────────┐
│              BACKEND (Flask) - quote_server.py                    │
│  ├─ GET  /productspecs      → Brands, fields, product matrix    │
│  ├─ POST /quote             → Primary: Python or Excel          │
│  └─ POST /quote/fallback    → Forced Python fallback            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
         ┌─────────────────────┴─────────────────────┐
         ↓                                             ↓
    PRICING ENGINES                          CONFIGURATION
    ├─ premiums.py (Python)                 productspecs.py
    │  └─ Calculate quotes for all products  ├─ Products matrix
    │                                        ├─ Field validation
    ├─ excelengine.py                       └─ Payload normalization
    │  └─ Integrate Excel autorater
    │
    ├─ withprofits.py
    │  ├─ Year-by-year fund projection
    │  └─ Death/PTD cost calculation
    │
    └─ pension.py
       └─ Fund accumulation at retirement

┌──────────────────────────────────────────────────────────────────┐
│              DATA & RATES FILES                                   │
│  ├─ rates.json          → Premium factors by product/benefit/term│
│  ├─ soma_rates.xlsx     → Excel autorater workbook (optional)   │
│  └─ requirements.txt    → Python dependencies                   │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Quote Generation

```{mermaid}
USER FILLS FORM
     ↓
Frontend reads input + validates against productspecs
     ↓
POST /quote with normalized payload
     ↓
Backend validates payload again
     ↓
Python engine calculates quote
     ↓
If product=withprofit → WithProfitProjector generates year-by-year table
If product=pension    → PensionProjector calculates fund at maturity
     ↓
Return quote JSON with premium, benefits, details
     ↓
Frontend renders HTML quote + email version
     ↓
User prints, emails to sales, or starts new quote
```

---

## Products & Features

### 1. **Term Insurance** (Protection Cover)

**Purpose:** Pure risk protection for a fixed period  
**Entry Age:** 18–65 years | **Max Age at Maturity:** 75

**Key Features:**

- Customizable sum assured (KES 100K–10M)
- Variable term (5–35 years)
- Smoker/non-smoker rates
- Optional joint life cover
- Optional partial maturity payouts
- Included benefits:
  - Death Benefit (main cover)
  - Last Expense Benefit
  - Critical Illness Rider
- **Premium Calculation:** Age + gender + smoker status + sum assured

**Example:** KES 500K cover, age 35, 15 years, non-smoker = ~KES 1,500/month

---

### 2. **Whole Life Assurance** (Lifetime Protection with Value)

**Purpose:** Lifelong protection that builds cash value surrenderable after 3 years  
**Entry Age:** 18–60 years

**Key Features:**

- Permanent cover (no expiry)
- Builds guaranteed cash value after policy year 3
- Partial surrender and policy loan options
- Joint life available
- Higher premium than term (lifetime commitment)
- Benefits:
  - Death Benefit (guaranteed, lifetime)
  - Cash Value (surrenderable)
  - Last Expense Benefit
- **Premium Calculation:** Higher base rate due to lifetime nature

**Example:** KES 500K cover, age 35, non-smoker = ~KES 2,500/month

---

### 3. **Endowment/Savings Policy** (Protection + Maturity Payout)

**Purpose:** Disciplined savings with death protection over a fixed term  
**Entry Age:** 18–60 years | **Max Age at Maturity:** 75 | **Term:** 5–30 years

**Key Features:**

- Guaranteed maturity payout
- Full death protection throughout term
- Escalation rate option (increases benefit annually)
- Joint life and partial maturity available
- Educational savings support
- Benefits:
  - Protected Maturity Benefit (guaranteed payout at term end)
  - Death Benefit (greater of sum assured or accumulated fund)
  - Milestone Payouts (optional)
- **Premium Calculation:** Mortality cost + savings component

**Example:** KES 1M target, 20-year term, 5% escalation = ~KES 4,000/month

---

### 4. **With-Profits Policy** (Participating, Bonus-Enabled)

**Purpose:** Flexible accumulation plan where customer can manage deposits/withdrawals with fund growth and bonuses  
**Entry Age:** 18–60 years | **Term:** 5–30 years

**Key Advanced Features:**

- **Initial deposit** to fund the plan
- **Annual premium** (flexible frequency: monthly, quarterly, annual)
- **User-driven cash flows:** Add deposits and withdrawals per year directly in UI
- **Interactive projection table:** Shows year-by-year:
  - Opening balance
  - Annual premium
  - User deposits/withdrawals
  - Death & PTD costs
  - Fund growth (expected return)
  - Closing balance
- **Fund type selection:**
  - Cash (11% expected return)
  - Aggressive (7.5% expected return)
  - Conservative (5% expected return)
  - **Balanced:** Custom mix with real-time return calculation
- **Fixed guarantee:** KES 100K minimum (death/PTD benefit)
- **Bonus structure:** Non-guaranteed reversionary + terminal bonus
- Benefits:
  - Accumulated Fund (primary benefit at maturity)
  - Death/PTD Benefit (greater of guarantee or fund)
  - Flexible withdrawal capability
- **Premium Calculation:** Initial amount + annual premiums allocated to fund after costs

**Example:**

- Initial: KES 500K
- Annual Premium: KES 100K
- Term: 10 years
- Fund Type: Balanced (60% Aggressive, 40% Conservative)
- Projected Fund at Year 10: ~KES 1.5M–1.8M (depending on fund growth)
- Death Benefit: Automatically matches accumulated fund

---

### 5. **Pension Plan** (Retirement Accumulation)

**Purpose:** Long-term retirement savings with skilled investment management  
**Entry Age:** 18–60 years | **Max Age at Maturity:** 70

**Key Features:**

- **Monthly contribution** (KES 2K–200K)
- **Target retirement age** (55–65 years)
- **Fund type selection** (NO cash fund for pension):
  - Aggressive (7.5% expected return)
  - Conservative (5% expected return)
  - **Balanced:** Aggressive + Conservative mix (default 50/50 = 6.25%)
    - User adjusts weights via sliders
    - Real-time expected return calculation
- **Projection window:** Shows accumulation from current age to retirement
- **Annuity conversion:** Standard conversion factor 0.006 → monthly pension
- **Tax relief:** Up to KES 20K/month (Kenya tax law)
- **Prettier visual output:**
  - Large gradient card showing projected fund
  - Monthly pension equivalent display
  - Accumulation period summary
  - Growth visualization bar
- Benefits:
  - Projected Fund at Retirement (highlighted)
  - Estimated Monthly Annuity (pension income)
  - Death Benefit (fund value paid to estate)
  - Tax-deductible contributions
  - Fund switching capability
- **Premium Calculation:** Contribution × frequency multiplier

**Example:**

- Contribution: KES 15,000/month
- Current Age: 30
- Retirement Age: 60
- Fund Type: Balanced (70% Aggressive, 30% Conservative = 7.0% expected return)
- Projected Fund: ~KES 10.8M
- Monthly Pension: ~KES 64,800

---

### 6. **Education Savings Plan** (Goal-Based Savings with Protection)

**Purpose:** Save for child's education with parent death protection and benefit waiver  
**Entry Age:** 18–60 years | **Max Age at Maturity:** 75 | **Term:** 5–25 years

**Key Features:**

- **Target education fund** (KES 200K–5M)
- **Escalation rate** (0–20% p.a.) — increases target annually
- **Child details:** Name and DOB (optional but recommended)
- **Parent death protection:** Premium waiver ensures education fund fully accumulated on parent's death
- **Milestone payouts:** Distribute benefit at secondary, university entrance, graduation
- **Joint life option:** Cover both parents
- **Partial maturity:** Draw from fund before term end if needed
- **Flexible premium:** Monthly, quarterly, semi-annual, annual
- Benefits:
  - Target Education Fund (primary benefit)
  - Parent Death Benefit (remainder on parent death during term)
  - Critical Illness Rider (optional)
  - Premium waiver on parent death
- **Premium Calculation:** Target amount × benefit components

**Example:**

- Target Fund: KES 2M
- Term: 15 years (to university age)
- Escalation: 5%/year
- Parent Age: 35
- Projected Premium: ~KES 9,000/month

---

## Key Technical Features

### 1. **Spec-Driven Form Building**

**What:** Product specifications define which fields appear for each product and validation rules.

**How It Works:**

```{python}
# backend/productspecs.py defines:
PRODUCT_SPECS["pension"] = ProductSpec(
    required_fields=("age", "gender", "freq", "contrib", "retireAge"),
    optional_fields=("pensionFundType", "pensionBalancedWeights"),
    allowed_entry_age=(18, 60),
    financial_limits={"contrib": (2000, 100000000)},
    ...
)

# Frontend fetches /productspecs and:
# 1. Renders only required/optional fields for that product
# 2. Enforces min/max values from financial_limits
# 3. Validates user input before submission
```

**Benefits:**

- Single source of truth for product rules
- Easy to add new fields or products
- Consistent validation client + server-side

---

### 2. **Dual-Engine Pricing**

**Primary:** Python (`premiums.py`)  

- Fast, no dependencies beyond Flask
- Works offline (no Excel required)
- Illustrative rates built-in

**Fallback:** Excel (`excelengine.py` + `soma_rates.xlsx`)  

- Uses proven, audited Excel rate tables
- Can integrate live Excel workbooks
- More accurate for complex rate structures

**Fallback Chain:**

```{mermaid}
/quote
  ├─ Try Python engine → success, return
  ├─ On exception, try Excel engine
  ├─ If Excel also fails, return Python result with error note
```

---

### 3. **With-Profits Year-by-Year Projection**

**Class:** `WithProfitProjector` (backend/withprofits.py)

**Calculation Logic (per year):**

```{mermaid}
1. Opening Balance = Previous Year's Closing
2. Annual Premium = User input (allocated after costs)
3. User Deposits/Withdrawals = From interactive table
4. Death Cost = 0.25% × balance  (approx)
5. PTD Cost = 0.05% × balance    (approx)
6. Balance After Costs = Opening + Premium + Deposits - Withdrawals - Costs
7. Fund Growth = Balance After Costs × Expected Return Rate
8. Closing Balance = Balance After Costs + Fund Growth
9. Death/PTD Benefit = MAX(100K guarantee, Closing Balance)
```

**Output:** JSON with 10–30 year rows → Rendered in HTML table on quote

---

### 4. **Pension Fund Accumulation with Fund Selection**

**Class:** `PensionProjector` (backend/pension.py)

**Calculation:**

```{mermaid}
Fund = Monthly Contribution × [(1 + r/12)^(months) - 1] / (r/12)

Where:
  r = Annual return rate based on fund type:
    - Aggressive: 7.5%
    - Conservative: 5.0%
    - Balanced: Weighted average (e.g., 50% Agg + 50% Cons = 6.25%)

  months = (Retirement Age - Current Age) × 12
```

**Feature:** Real-time calculation of expected return as user adjusts balanced weights:

```{javascript}
// Frontend updates in real-time while user moves sliders
Expected Return = (Agg% / 100) × 0.075 + (Cons% / 100) × 0.05
```

---

### 5. **Dynamic Form Validation**

**Client-Side (Frontend):**

- Min/max constraints from productspecs
- Required field enforcement
- Type checking (number, date, etc.)
- Real-time error highlighting

**Server-Side (Backend):**

- Authoritative validation in `validate_payload()`
- Range checks on age, term, contributions
- Mandatory field validation
- Smoker rating support per product
- Errors returned in `{"error": "...", "messages": [...]}`

**Example Validation Flow:**

```{mermaid}
User enters Age: 75
↓
Frontend checks: Age 75 > Pension Max 60
↓
Highlights field error: "Age must be 18–60"
↓
Submit button disabled until corrected
↓
Backend double-checks on POST (defense-in-depth)
```

---

### 6. **Quote Rendering & Email Integration**

**HTML Rendering** (libertyquotes-output.js):

- Quote header with product, customer, reference
- Policyholder details section
- Policy parameters (rates, term, fund type)
- Key benefits grid
- Complimentary benefits badges
- Projections (With-Profits table or Pension graphic)
- Disclaimer & important notes

**Email Generation:**

- Text-based email body with all key details
- Prefilled `mailto:` link with sales email
- Client CC'd for transparency
- Professional formatting

---

## Frontend Modules

### libertyquotes.html

**Role:** Single-page application shell  
**Responsibilities:**

- 3-step wizard UI (Select Product → Your Details → Quote Summary)
- Progress bar
- Loading overlay
- Toast notifications
- Form container + quote container
- Print/email buttons

### libertyquotes-config.js

**Role:** UI templates and configuration  
**Definitions:**

- `FIELD_TEMPLATES` — HTML for each form field (sum-assured, contribution, retirement-age, etc.)
- `SPEC_TO_TEMPLATE_FIELD` — Map spec field names to template IDs
- `FIELD_TEMPLATES["pension-fund-type"]` — Pension fund selector (no cash fund)
- `FIELD_TEMPLATES["pension-balanced-weights"]` — Pension weight sliders
- `FIELD_TEMPLATES["withprofit-fund-type"]` — WP fund selector (includes cash)
- `FIELD_TEMPLATES["withprofit-balanced-weights"]` — WP weight sliders
- `WITHPROFIT_TABLE_HTML` — Interactive cash flow table template

### libertyquotes-ui.js

**Role:** Form logic and user interactions  
**Key Functions:**

- `UI_buildProductGrid()` — Render product cards
- `_buildProductFields(product)` — Inject product-specific form fields
- `_buildPensionFields()` — Special form layout for pension
- `_buildWithProfitFields()` — Special form layout for with-profits
- `UI_toggleBalancedWeights(productType)` — Show/hide weight sliders
- `UI_updateBalancedWeights(productType)` — Recalculate blended return
- `UI_getFundReturnRate(productType)` — Get effective fund return
- `UI_validateBeforeSubmit(spec)` — Client-side validation
- `UI_submitForQuote()` — Collect form data, call API
- `UI_getWithProfitCashFlows()` — Extract user deposits/withdrawals

### libertyquotes-api.js

**Role:** HTTP communication  
**Endpoints Called:**

- `GET /productspecs` → Fetch product definitions
- `POST /quote` → Submit quote request
- `POST /quote/fallback` → Force Python engine

**Response Handling:**

- Parse JSON
- Extract premium, benefits, details
- Handle validation errors from backend
- Apply error highlighting to fields

### libertyquotes-output.js

**Role:** Quote rendering and email building  
**Key Functions:**

- `RENDER_quoteHTML({...})` — Main quote HTML generator
- `_renderWithProfitProjection(projectionData)` — Year-by-year table HTML
- `_renderPensionProjection({...})` — Pension graphic (gradient card, metrics cards, bar chart)
- `_buildEmailBody({...})` — Plain-text email version
- `UI_sendToSales()` — Trigger email client with prefilled content

---

## Backend Modules

### quote_server.py

**Role:** Flask application and API routing  
**Endpoints:**

```{mermaid}
GET /productspecs
  Returns: { brands, fields, products }
  Purpose: Frontend source of truth for UI generation

POST /quote
  Body: { product, age, dob, gender, smoker, freq, ... }
  Returns: { premium, benefits, details, note, [projections] }
  Logic: Try Python → Excel → Python (recovery)

POST /quote/fallback
  Body: Same as /quote
  Returns: Python engine result only
  Purpose: Bypass Excel for testing/debugging
```

### productspecs.py

**Role:** Product definitions, validation, normalization  
**Key Classes:**

- `FieldConstraint` — Metadata for one form field
- `ProductSpec` — Full product definition (entry age, term, benefits, etc.)

**Key Functions:**

- `normalize_payload(...)` — Normalize user input (handle aliases, defaults)
- `validate_payload(...)` — Authoritative validation
- `list_product_codes(brand)` — Get products by brand
- `calculate_age_from_dob(dob)` — Server-side age calculation

**Data Structures:**

```python
BRANDS = {
    "liberty": {"display_name": "Liberty Kenya", "currency": "KES", ...}
}

FIELD_LIBRARY = {
    "age": FieldConstraint(...),
    "contrib": FieldConstraint(...),
    "pensionFundType": FieldConstraint(...),
    ...
}

PRODUCT_SPECS = {
    "term": ProductSpec(...),
    "wholelife": ProductSpec(...),
    "pension": ProductSpec(...),
    "withprofit": ProductSpec(...),
    ...
}
```

### premiums.py

**Role:** Core quote calculation engine  
**Key Functions:**

- `_term_monthly_premium(age, gender, smoker, sa, term)` — Term insurance
- `_whole_life_monthly_premium(age, gender, smoker, sa)` — Whole life
- `_endowment_monthly_premium(age, gender, smoker, sa, term)` — Endowment
- `_pension_fund(contrib, age, retire_age, rate)` — Pension accumulation
- `calculate_quote(payload)` — Main dispatcher, routes to product-specific logic

**Process:**

1. Normalize payload
2. Extract product type
3. Extract base fields (age, gender, smoker, etc.)
4. Route to product-specific calculation:
   - Term → mortality × age/gender/smoker factors
   - Whole Life → higher mortality × lifetime commitment
   - Endowment → mortality + savings component
   - Pension → contribution × compounding at selected rate
   - With-Profit → WithProfitProjector.project(...)
   - Education → benefit-based calculation
5. Return `{"premium": X, "benefits": [...], "details": [...], "note": "...", ...}`

### withprofits.py

**Role:** With-Profit policy year-by-year projection  
**Classes:**

- `CashFlow(year, deposit, withdrawal)` — One year's user cash flow
- `ProjectionYear(...)` — One year of projection data (15+ fields)
- `WithProfitProjector` — Main calculation engine

**Key Logic:**

```python
for year in 1 to term:
    opening_balance = previous_balance
    annual_premium = from_user_input
    user_deposits, withdrawals = from_cash_flows_table
    
    death_cost = balance × death_rate[term]
    ptd_cost = balance × ptd_rate[term]
    
    balance_after_costs = opening + premium + deposits - withdrawals - costs
    fund_growth = balance_after_costs × guaranteed_return_rate
    closing_balance = balance_after_costs + fund_growth
    
    store_year_data(year, opening, closing, growth, ...)
```

### pension.py

**Role:** Pension plan projection  
**Classes:**

- `ProjectionYear(...)` — One year of accumulation detail
- `PensionProjector` — Pension-specific calculation engine
- `CashFlow` — For flexible deposits/withdrawals (future enhancement)

**Key Logic:**

```python
fund = monthly_contrib × [(1 + r/12)^months - 1] / (r/12)

# Where r is determined by fund type:
if fund_type == "balanced":
    r = (weight_agg × 0.075) + (weight_cons × 0.05)
else:
    r = fund_rates[fund_type]

annuity = fund × 0.006  # Standard conversion factor
```

### excelengine.py

**Role:** Integrate Excel autorater  
**Function:** `calculate_quote_from_excel(payload)`  
**When Used:** If `/quote` Python engine fails and Excel is available

**Configuration:**

- Path to `soma_rates.xlsx`
- Pass payload to Excel (via xlwings)
- Parse Excel results back to JSON

---

## rates.json Structure

**Purpose:** Premium factors, death rates, PTD rates for each product  
**Format:**

```json
{
  "products": {
    "Term": {
      "benefits": {
        "Death": { "5": 0.0025, "10": 0.0028, "15": 0.0032, ... },
        "PTD": { "5": 0.0005, ... }
      }
    },
    "Pension": {
      "benefits": {
        "Death": { "5": 0.001, "10": 0.0015, ... },
        "PTD": { "5": 0.0002, ... }
      }
    },
    "Withprofit": {
      "GuaranteedReturn": { "5": 0.09, "10": 0.09, ... }
    }
  }
}
```

**Usage in Code:**

```python
factor = _get_rate_factor("term", "Death", 10)  # Returns 0.0028
death_cost = balance × factor
```

---

## Setting Up & Running

### Prerequisites

- Python 3.10+
- pip
- (Optional) Microsoft Excel + xlwings for Excel autorater

### Installation

```bash
# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows PowerShell

# Install dependencies (minimal)
pip install Flask flask-cors

# Or with Excel support
pip install Flask flask-cors xlwings

# Check installation
python -m py_compile backend\productspecs.py backend\premiums.py backend\quote_server.py
```

### Running Backend

```bash
cd /path/to/quotes
python backend\quote_server.py
# Serves on http://127.0.0.1:5050
```

### Running Frontend

```bash
# Simply open in browser
open frontend/libertyquotes.html

# Or serve via Python:
python -m http.server 8000  # Serves on localhost:8000
```

### API Testing

```powershell
# Check /productspecs
Invoke-RestMethod -Uri http://localhost:5050/productspecs | ConvertTo-Json | Out-String

# Sample quote request (Term Insurance)
$body = @{
    product = "term"
    age = 35
    gender = "M"
    smoker = "NS"
    freq = "monthly"
    sa = 500000
    term = 15
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5050/quote -Method Post -Body $body -ContentType "application/json"

# Sample quote request (Pension)
$body = @{
    product = "pension"
    age = 30
    gender = "F"
    smoker = "NS"
    freq = "monthly"
    contrib = 15000
    retireAge = 60
    pensionFundType = "balanced"
    pensionBalancedWeightsAgg = 70
    pensionBalancedWeightsCons = 30
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5050/quote -Method Post -Body $body -ContentType "application/json"
```

---

## Key Code Locations

| Feature | File(s) | Key Functions |
| ---- | ---- | ---- |
| Product Definitions | `productspecs.py` | `PRODUCT_SPECS`, `FIELD_LIBRARY` |
| Form Building | `libertyquotes-config.js`, `libertyquotes-ui.js` | `FIELD_TEMPLATES`, `_buildProductFields()` |
| Fund Selection (Pension) | `libertyquotes-config.js`, `libertyquotes-ui.js`, `premiums.py` | `"pension-fund-type"`, `UI_updateBalancedWeights("pension")`, pension calculation branch |
| Fund Selection (WP) | `libertyquotes-config.js`, `libertyquotes-ui.js` | `"withprofit-fund-type"`, `UI_updateBalancedWeights("wp")` |
| Balanced Weight Calculation | `libertyquotes-ui.js`, `premiums.py` | `UI_getFundReturnRate()`, `UI_updateBalancedWeights()` |
| With-Profits Projection | `withprofits.py`, `premiums.py`, `libertyquotes-output.js` | `WithProfitProjector.project()`, `_renderWithProfitProjection()` |
| Pension Projection | `pension.py`, `premiums.py`, `libertyquotes-output.js` | `PensionProjector.project()`, `_renderPensionProjection()` |
| Quote API | `quote_server.py` | `@app.post("/quote")` |
| Validation | `productspecs.py` | `validate_payload()` |
| Premium Calculation | `premiums.py` | `calculate_quote()` |
| Email Building | `libertyquotes-output.js` | `_buildEmailBody()` |

---

## Compliance & Legal Language

### Guaranteed vs. Expected Returns

**Change Made (April 2026):**

- Replaced "guaranteed return" language with "expected returns" throughout customer-facing copy
- Rationale: Reduces legal liability by being precise about what customers should expect vs. what is guaranteed

**Impact:**

- With-Profit: "Running balance grows with expected returns based on fund type" (not "accumulates at guaranteed rate")
- Pension: Shows "Expected Return Rate: X% p.a. (illustrated)" and disclaimers that actual returns may vary
- All benefit notes specify "Illustrated at [rate]% expected return"

### Disclaimers & Important Notes

**All Quotes Include:**

- "This is an illustrative quote. Actual premiums and benefits depend on full underwriting."
- "Projections based on expected returns; actual returns depend on fund performance and market conditions."
- "Occupation class assigned during underwriting."
- "Quote valid for 30 days."
- "Please consult a financial advisor for personalized advice."

**Product-Specific Notes:**

- **Term:** "No maturity value. Cover lapses if premiums not maintained."
- **Pension:** "Actual returns depend on fund performance and market conditions."
- **With-Profits:** "Non-guaranteed additions subject to company discretion."
- **Education:** "Coverage continues even if parent becomes disabled."

---

## Development Guide

### Adding a New Field

1. **Define in productspecs.py:**

   ```python
   FIELD_LIBRARY["my_field"] = FieldConstraint(
       field_id="my_field",
       label="My Field Label",
       data_type="number",  # or "int", "str", "date", "bool"
       required=True,
       minimum=1000,
       maximum=100000,
       hint="Enter a value..."
   )
   ```

2. **Add to product's spec:**

   ```python
   PRODUCT_SPECS["my_product"] = ProductSpec(
       ...
       required_fields=("age", "gender", ..., "my_field"),
       financial_limits={"my_field": (1000, 100000)},
       ...
   )
   ```

3. **Create HTML template in libertyquotes-config.js:**

   ```javascript
   FIELD_TEMPLATES["my_field"] = `
     <div class="form-group">
       <label>My Field Label <span style="color:#c0392b">*</span></label>
       <input type="number" id="f-my-field" min="1000" max="100000" placeholder="..." />
       <span class="hint">Enter a value between 1000 and 100000</span>
     </div>
   `;
   ```

4. **Map spec field to template in libertyquotes-config.js:**

   ```javascript
   SPEC_TO_TEMPLATE_FIELD = {
       ...
       myField: "my_field",
   };
   ```

5. **Handle in quote calculation (premiums.py):**

   ```python
   elif product == "my_product":
       my_field = float(p.get("myField") or 0)
       # Use value in calculation
   ```

6. **Test:**
   - Set the field value in the form
   - Submit quote
   - Verify backend receives normalized field name
   - Check calculation is correct

### Adding a New Product

1. **Define ProductSpec in productspecs.py** — Copy existing product, modify code, display_name, allowed_entry_age, fields, benefits
2. **Create HTML templates** — One for each required/optional field
3. **Add calculation logic in premiums.py** — New elif branch for product code
4. **Test in browser** — Select product, fill form, generate quote
5. **Update documentation** — Add to this file under Products section

### Debugging Quote Calculations

```python
# Enable Python debugger in quote_server.py
import pdb

@app.post("/quote")
def quote():
    payload = normalize_payload(request.get_json(...) or {})
    pdb.set_trace()  # Debug here
    result = calculate_python_quote(payload)
    return jsonify(result)
```

Or use `/quote/fallback` to force Python engine and add print statements.

---

## Future Enhancements

1. **Database Integration** — Store quotes and customer history
2. **Advanced Underwriting** — Medical questionnaire, medical underwriting rules
3. **Quote Export** — PDF generation, policy illustration documents
4. **Admin Dashboard** — Monitor quotes, premiums, customer engagement
5. **Mobile App** — Native iOS/Android apps for agents
6. **Multi-Currency** — Support USD, GBP, other currencies
7. **Premium Financing** — Integration with loan products
8. **Flexible Payments** — Standing orders, mobile money, installments
9. **Real-Time Rate Updates** — Fetch rates from external APIs
10. **Predictive Underwriting** — ML-based medical assessment

---

## Support & Documentation

**Additional Docs:**

- [With-Profits Quick Start](WITHPROFITS_QUICKSTART.md) — Detailed With-Profits guide
- [With-Profits Implementation](WITHPROFITS_IMPLEMENTATION.md) — Technical deep-dive
- [Premium Cascade](PREMIUM_CASCADE_IMPLEMENTATION.md) — Benefit calculation logic

**Contact:**

- Questions about products? Check PRODUCT_SPECS in productspecs.py
- Questions about math? See premiums.py and withprofits.py
- Questions about UI? See libertyquotes-*.js files
- Questions about API? See quote_server.py

---

## Glossary

- **SA (Sum Assured)** – The amount covered by the policy (e.g., KES 500,000)
- **Term** – Duration in years (e.g., 15 years)
- **Frequency** – Premium payment schedule (monthly, quarterly, annually, etc.)
- **PMT (Premium)** – Regular payment amount (e.g., KES 1,500/month)
- **Death Benefit** – Amount payable if policyholder dies
- **PTD (Permanent Total Disability)** – Payout if policyholder becomes permanently disabled
- **Annuity** – Regular payment over time (pension income)
- **Fund** – Investment account that grows over time
- **Balanced Fund** – Mix of two or more investment types
- **Expected Return** – Projected annual growth rate (% p.a.)
- **Maturity** – Date policy ends and final benefit is payable
- **Escalation** – Annual increase in benefit (e.g., 5% per year)
- **Rider** – Optional additional benefit
- **Underwriting** – Process of assessing risk and issuing policy

---

**Document Version:** 1.0  
**Last Updated:** April 15, 2026  
**Author:** Project Team
