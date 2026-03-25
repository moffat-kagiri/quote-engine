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
};
