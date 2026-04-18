"use strict";

const PRODUCT_SPECS_ENDPOINT = "http://localhost:5050/productspecs";
const EXCEL_AUTORATER_ENDPOINT = "http://localhost:5050/quote";
const USE_EXCEL_AUTORATER = true; // keep excel available as fallback
const PYTHON_FALLBACK_ENDPOINT = "http://localhost:5050/quote/fallback";

// Use simple illustrative emojis for product tiles (large visual icon)
const PRODUCT_ICON_BY_CATEGORY = {
  protection: "🛡️",
  protection_with_value: "🏛️",
  savings: "💰",
  participating: "📈",
  retirement: "🏖️",
  goal_savings: "🎓",
};

const SPEC_TO_TEMPLATE_FIELD = {
  sa: "sum-assured",
  term: "term",
  escalationRate: "escalation-rate",
  contrib: "contribution",
  retireAge: "retirement-age",
  target: "target-amount",
  childName: "child-name",
  childDob: "child-dob",
<<<<<<< HEAD
  wpFundType: "withprofit-fund-type",
  wpBalancedWeights: "withprofit-balanced-weights",
  pensionFundType: "pension-fund-type",
  pensionBalancedWeights: "pension-balanced-weights",
=======
>>>>>>> 1591fabd3d48927e80bb401135c77a60004eb3e3
};

const SPEC_TO_INPUT_ID = {
  age: "f-dob",
  sa: "f-sa",
  term: "f-term",
  escalationRate: "f-escalation",
  contrib: "f-contrib",
  retireAge: "f-retire",
  target: "f-target",
};

const FIELD_TEMPLATES = {
  "sum-assured": `
    <div class="form-group">
      <label>Sum Assured (KES) <span style="color:#c0392b">*</span></label>
      <div class="currency-wrap">
        <span class="currency-prefix">KES</span>
        <input type="number" id="f-sa" min="100000" max="10000000" step="50000"
          placeholder="500,000" value=""
          oninput="UI_formatCurrencyInput(this)" />
      </div>
      <span class="hint">Minimum KES 100,000 · Maximum KES 10,000,000</span>
    </div>`,

  term: `
    <div class="form-group">
      <label>Policy Term (Years) <span style="color:#c0392b">*</span></label>
      <input type="number" id="f-term" min="5" max="35" step="1" placeholder="e.g. 15" />
      <span class="hint">Between 5 and 35 years</span>
    </div>`,

  "escalation-rate": `
    <div class="form-group">
      <label>Escalation Rate (% p.a.) <span style="color:#c0392b">*</span></label>
      <input type="number" id="f-escalation" min="0" max="20" step="0.5" placeholder="e.g. 5" />
      <span class="hint">Compounding annual increase in sum assured</span>
    </div>`,

  contribution: `
    <div class="form-group">
      <label>Monthly Pension Contribution (KES) <span style="color:#c0392b">*</span></label>
      <div class="currency-wrap">
        <span class="currency-prefix">KES</span>
        <input type="number" id="f-contrib" min="2000" max="200000" step="500"
          placeholder="10,000" value=""
          oninput="UI_formatCurrencyInput(this)" />
      </div>
      <span class="hint">Minimum KES 2,000/month</span>
    </div>`,

  "retirement-age": `
    <div class="form-group">
      <label>Target Retirement Age</label>
      <select id="f-retire">
        <option value="55">55 years</option>
        <option value="60" selected>60 years</option>
        <option value="65">65 years</option>
      </select>
    </div>`,

  "target-amount": `
    <div class="form-group">
      <label>Target Education Fund (KES) <span style="color:#c0392b">*</span></label>
      <div class="currency-wrap">
        <span class="currency-prefix">KES</span>
        <input type="number" id="f-target" min="200000" max="5000000" step="100000"
          placeholder="1,000,000" value=""
          oninput="UI_formatCurrencyInput(this)" />
      </div>
      <span class="hint">Minimum KES 200,000 · Maximum KES 5,000,000</span>
    </div>`,

  "child-name": `
    <div class="form-group">
      <label>Child's Name</label>
      <input type="text" id="f-childname" placeholder="e.g. Zawadi Ochieng" />
    </div>`,

  "child-dob": `
    <div class="form-group">
      <label>Child's Date of Birth</label>
      <input type="date" id="f-childdob" />
    </div>`,
<<<<<<< HEAD

  "withprofit-initial": `
    <div class="form-group">
      <label>Initial Deposit (KES) <span style="color:#c0392b">*</span></label>
      <div class="currency-wrap">
        <span class="currency-prefix">KES</span>
        <input type="number" id="f-wp-initial" min="100000" max="10000000" step="50000"
          placeholder="500,000" value="500000"
          oninput="UI_formatCurrencyInput(this)" />
      </div>
      <span class="hint">First premium allocated to accumulate fund</span>
    </div>`,

  "withprofit-term": `
    <div class="form-group">
      <label>Policy Term (Years) <span style="color:#c0392b">*</span></label>
      <input type="number" id="f-wp-term" min="5" max="35" step="1" placeholder="e.g. 15" value="10" />
      <span class="hint">Between 5 and 35 years</span>
    </div>`,

  "withprofit-frequency": `
    <div class="form-group">
      <label>Projection Frequency</label>
      <select id="f-wp-frequency">
        <option value="annual">Annual</option>
        <option value="semiannual">Semi-Annual</option>
        <option value="quarterly">Quarterly</option>
        <option value="monthly">Monthly</option>
        <option value="single">Single Premium</option>
      </select>
    </div>`,

  "withprofit-fund-type": `
    <div class="form-group">
      <label>Fund Type <span style="color:#c0392b">*</span></label>
      <select id="f-wp-fund-type" onchange="UI_toggleBalancedWeights('wp')">
        <option value="cash">Cash (11% p.a.)</option>
        <option value="aggressive">Aggressive (7.5% p.a.)</option>
        <option value="conservative">Conservative (5% p.a.)</option>
        <option value="balanced" selected>Balanced (Custom Mix)</option>
      </select>
      <span class="hint">Select your investment fund type or customize balanced allocation</span>
    </div>`,

  "withprofit-balanced-weights": `
    <div class="form-group" id="wp-balanced-weights-wrapper" style="display:none;">
      <label style="color:#333;margin-bottom:8px;">Balanced Fund Allocation</label>
      <div style="border:1px solid #A6CBDB;border-radius:4px;padding:12px;background:#f9fbfd;">
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:0.85rem;margin-bottom:4px;">Cash <span id="wp-cash-pct">0</span>%</label>
          <input type="range" id="f-wp-weight-cash" min="0" max="100" value="0" step="5" style="width:100%;" oninput="UI_updateBalancedWeights('wp')" />
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:0.85rem;margin-bottom:4px;">Aggressive <span id="wp-aggressive-pct">50</span>%</label>
          <input type="range" id="f-wp-weight-aggressive" min="0" max="100" value="50" step="5" style="width:100%;" oninput="UI_updateBalancedWeights('wp')" />
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:0.85rem;margin-bottom:4px;">Conservative <span id="wp-conservative-pct">50</span>%</label>
          <input type="range" id="f-wp-weight-conservative" min="0" max="100" value="50" step="5" style="width:100%;" oninput="UI_updateBalancedWeights('wp')" />
        </div>
        <div style="background:#e8f0f8;padding:8px;border-radius:3px;font-size:0.78rem;color:#666;">
          <div>Expected Return: <strong id="wp-balanced-return">6.25%</strong> p.a.</div>
        </div>
      </div>
    </div>`,

  "pension-fund-type": `
    <div class="form-group">
      <label>Fund Type <span style="color:#c0392b">*</span></label>
      <select id="f-pension-fund-type" onchange="UI_toggleBalancedWeights('pension')">
        <option value="aggressive">Aggressive (7.5% p.a.)</option>
        <option value="conservative">Conservative (5% p.a.)</option>
        <option value="balanced" selected>Balanced (Custom Mix)</option>
      </select>
      <span class="hint">Select your investment fund type or customize balanced allocation</span>
    </div>`,

  "pension-balanced-weights": `
    <div class="form-group" id="pension-balanced-weights-wrapper" style="display:none;">
      <label style="color:#333;margin-bottom:8px;">Balanced Fund Allocation</label>
      <div style="border:1px solid #A6CBDB;border-radius:4px;padding:12px;background:#f9fbfd;">
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:0.85rem;margin-bottom:4px;">Aggressive <span id="pension-aggressive-pct">50</span>%</label>
          <input type="range" id="f-pension-weight-aggressive" min="0" max="100" value="50" step="5" style="width:100%;" oninput="UI_updateBalancedWeights('pension')" />
        </div>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:0.85rem;margin-bottom:4px;">Conservative <span id="pension-conservative-pct">50</span>%</label>
          <input type="range" id="f-pension-weight-conservative" min="0" max="100" value="50" step="5" style="width:100%;" oninput="UI_updateBalancedWeights('pension')" />
        </div>
        <div style="background:#e8f0f8;padding:8px;border-radius:3px;font-size:0.78rem;color:#666;">
          <div>Expected Return: <strong id="pension-balanced-return">6.25%</strong> p.a.</div>
        </div>
      </div>
    </div>`,
};

// WithProfit table HTML template (injected into product-fields)
const WITHPROFIT_TABLE_HTML = `
<div class="subsection-label">Annual Deposits & Withdrawals</div>
<div style="overflow-x:auto;margin-bottom:16px;">
  <table id="wp-cashflow-table" style="width:100%;border-collapse:collapse;font-size:0.78rem;">
    <thead>
      <tr style="background:#e8f0f8;border-bottom:2px solid #A6CBDB;">
        <th style="padding:8px;text-align:left;font-weight:700;border-right:1px solid #A6CBDB;">Year</th>
        <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Annual Deposit (KES)</th>
        <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Annual Withdrawal (KES)</th>
        <th style="padding:8px;text-align:center;font-weight:700;">Action</th>
      </tr>
    </thead>
    <tbody id="wp-cashflow-body">
      <!-- Rows injected by JavaScript -->
    </tbody>
  </table>
</div>
<button class="btn btn-outline" onclick="UI_addWithProfitRow()" style="font-size:0.72rem;padding:6px 14px;">+ Add Another Year</button>
<span class="hint" style="display:block;margin-top:8px;">Enter annual top-ups and withdrawals. Running balance grows with expected returns based on your selected fund type.</span>`;

=======
};
>>>>>>> 1591fabd3d48927e80bb401135c77a60004eb3e3
