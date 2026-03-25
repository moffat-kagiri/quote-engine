"use strict";

let _specData = { brands: {}, fields: {}, products: {} };
let _selectedProduct = null;
let _quoteData = {};

document.addEventListener("DOMContentLoaded", async () => {
  await UI_loadProductSpecs();
  UI_buildProductGrid();
  UI_wireCommonValidation();
});

async function UI_loadProductSpecs() {
  try {
    const resp = await fetch(PRODUCT_SPECS_ENDPOINT, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) throw new Error(`Productspec server responded ${resp.status}`);
    const data = await resp.json();
    if (!data || !data.products || Object.keys(data.products).length === 0) {
      throw new Error("No productspec data returned.");
    }
    _specData = data;
  } catch (err) {
    console.error("[Productspecs]", err.message);
    showToast("Unable to load product specifications from backend. Start quote_server.py.");
    _specData = { brands: {}, fields: {}, products: {} };
  }
}

function _getProductSpec(product) {
  return _specData.products?.[product] || null;
}

function _getProductView(product) {
  const spec = _getProductSpec(product) || {};
  return {
    label: spec.display_name || product,
    desc: spec.description || "",
    icon: PRODUCT_ICON_BY_CATEGORY[spec.category] || "Product",
  };
}

function _getProductTemplateFields(spec) {
  const orderedSpecFields = ["sa", "term", "escalationRate", "contrib", "retireAge", "target", "childName", "childDob"];
  const allFields = new Set([...(spec.required_fields || []), ...(spec.optional_fields || [])]);
  return orderedSpecFields
    .filter(field => allFields.has(field))
    .map(field => SPEC_TO_TEMPLATE_FIELD[field])
    .filter(Boolean);
}

function UI_buildProductGrid() {
  const grid = document.getElementById("product-grid");
  const products = Object.entries(_specData.products || {});

  if (!products.length) {
    grid.innerHTML = '<div class="section-sub">No products available. Check backend /productspecs endpoint.</div>';
    return;
  }

  grid.innerHTML = products.map(([key, spec]) => {
    const icon = PRODUCT_ICON_BY_CATEGORY[spec.category] || "🔷";
    const displayName = spec.display_name || key;
    return `
      <div class="product-card" data-product="${key}" onclick="UI_selectProduct(this)">
        <div class="product-check">v</div>
        <span class="product-icon">${icon}</span>
        <div class="product-name">${displayName}</div>
        <div class="product-desc">${spec.description || ""}</div>
      </div>`;
  }).join("");
}

function UI_selectProduct(card) {
  document.querySelectorAll(".product-card").forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");
  _selectedProduct = card.dataset.product;
  document.getElementById("btn-next-1").disabled = false;
  _clearFieldError("f-dob");
}

function UI_goToStep1() {
  _setScreen(1);
}

function UI_goToStep2() {
  if (!_selectedProduct) return;
  const view = _getProductView(_selectedProduct);
  _buildProductFields(_selectedProduct);
  document.getElementById("form-title").textContent = `${view.label} - Your Details`;
  _setScreen(2);
}

function UI_startOver() {
  _selectedProduct = null;
  document.querySelectorAll(".product-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("btn-next-1").disabled = true;
  _setScreen(1);
}

function _setScreen(n) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(`screen-${n}`).classList.add("active");
  ["pill-1", "pill-2", "pill-3"].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove("active", "done");
    if (i + 1 === n) el.classList.add("active");
    else if (i + 1 < n) el.classList.add("done");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function _buildProductFields(product) {
  const spec = _getProductSpec(product);
  const container = document.getElementById("product-fields");
  if (!spec) {
    container.innerHTML = '<div class="section-sub">Unable to load product specification.</div>';
    return;
  }

  const templateFields = _getProductTemplateFields(spec);

  let html = '<div class="subsection-label">Product Details</div><div class="form-grid">';
  templateFields.forEach(fid => {
    html += FIELD_TEMPLATES[fid] || "";
  });
  html += "</div>";

  // If this is the Education product, render benefit selection checkboxes
  if ((spec.code || product) === "education") {
    html += `
    <div class="subsection-label">Select Benefits</div>
    <div class="form-grid">
      <div class="form-group span-2">
        <label>Benefits (Death is mandatory)</label>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
          <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="benefit-death" checked disabled /> Death</label>
          <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="benefit-ptd" /> PTD</label>
          <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="benefit-ci" /> Critical Illness</label>
          <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="benefit-retrenchment" /> Retrenchment</label>
          <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="benefit-doubleacc" /> Double Accident</label>
          <label style="display:flex;align-items:center;gap:6px;"><input type="checkbox" id="benefit-wopdisability" /> WOP Disability</label>
        </div>
        <span class="hint">Tick optional benefits to include their premium components.</span>
      </div>
    </div>`;
  }

  if ((spec.optional_fields || []).includes("partialMat.enabled")) {
    html += `
    <div class="toggle-row" onclick="UI_toggleSection('partial-mat-content','partial-mat-switch')">
      <div>
        <div class="toggle-label">Partial Maturities</div>
        <div class="toggle-sub">Allow partial payouts before full maturity</div>
      </div>
      <div class="toggle-switch" id="partial-mat-switch"></div>
    </div>
    <div class="toggle-content" id="partial-mat-content">
      <div class="toggle-section-title">Partial Maturity Configuration</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Number of Partial Maturities</label>
          <input type="number" id="f-partial-count" min="1" max="10" step="1" placeholder="e.g. 3" />
          <span class="hint">Each payout typically equals a set % of the sum assured</span>
        </div>
      </div>
    </div>`;
  }

  if ((spec.optional_fields || []).includes("jointLife.enabled")) {
    html += `
    <div class="toggle-row" onclick="UI_toggleSection('joint-life-content','joint-life-switch')">
      <div>
        <div class="toggle-label">Joint Life Cover</div>
        <div class="toggle-sub">Add a second life to this policy</div>
      </div>
      <div class="toggle-switch" id="joint-life-switch"></div>
    </div>
    <div class="toggle-content" id="joint-life-content">
      <div class="toggle-section-title">Second Life - Personal Details</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="f-jl-name" placeholder="e.g. Kendi Ochieng" />
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="f-jl-dob" />
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="f-jl-gender">
            <option value="">-- select --</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" id="f-jl-email" placeholder="e.g. kendi@example.com" />
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" id="f-jl-phone" placeholder="e.g. +254 7XX XXX XXX" />
        </div>
        <div class="form-group">
          <label>Employment Status</label>
          <select id="f-jl-employment">
            <option value="employed">Employed</option>
            <option value="unemployed">Unemployed</option>
          </select>
        </div>
      </div>
    </div>`;
  }

  container.innerHTML = html;
  _applyProductConstraints(spec);
  UI_wireProductValidation(spec);
}

function UI_toggleSection(contentId, switchId) {
  const content = document.getElementById(contentId);
  const sw = document.getElementById(switchId);
  if (!content || !sw) return;
  const isOpen = content.classList.contains("open");
  content.classList.toggle("open", !isOpen);
  sw.classList.toggle("on", !isOpen);
}

function UI_formatCurrencyInput(input) {
  const raw = input.value.replace(/[^0-9]/g, "");
  input.value = raw ? parseInt(raw, 10) : "";
}

function UI_wireCommonValidation() {
  const dobInput = document.getElementById("f-dob");
  if (!dobInput) return;
  ["input", "change", "blur"].forEach(evt => {
    dobInput.addEventListener(evt, () => _validateAgeField(_getProductSpec(_selectedProduct), false));
  });
}

function UI_wireProductValidation(spec) {
  ["sa", "term", "escalationRate", "contrib", "retireAge", "target"].forEach(field => {
    const id = SPEC_TO_INPUT_ID[field];
    const input = document.getElementById(id);
    if (!input) return;
    ["input", "change", "blur"].forEach(evt => {
      input.addEventListener(evt, () => _validateNumericField(field, spec, false));
    });
  });
}

function _applyProductConstraints(spec) {
  if (!spec) return;

  const ageRange = spec.allowed_entry_age || [18, 70];
  const dobInput = document.getElementById("f-dob");
  if (dobInput) {
    const [minAge, maxAge] = ageRange;
    const bounds = _getDobBounds(minAge, maxAge);
    dobInput.min = bounds.minDate;
    dobInput.max = bounds.maxDate;
    dobInput.dataset.minAge = String(minAge);
    dobInput.dataset.maxAge = String(maxAge);
  }

  const termInput = document.getElementById("f-term");
  if (termInput) {
    const termRange = spec.allowed_term_years || [_fieldMin("term"), _fieldMax("term")];
    if (termRange[0] != null) termInput.min = termRange[0];
    if (termRange[1] != null) termInput.max = termRange[1];
  }

  _applyFinancialLimit("sa", "f-sa", spec);
  _applyFinancialLimit("escalationRate", "f-escalation", spec);
  _applyFinancialLimit("target", "f-target", spec);
  _applyFinancialLimit("contrib", "f-contrib", spec);

  const retireInput = document.getElementById("f-retire");
  if (retireInput) {
    const min = _fieldMin("retireAge");
    const max = _fieldMax("retireAge");
    if (min != null) retireInput.min = min;
    if (max != null) retireInput.max = max;
  }
}

function _fieldMin(field) {
  return _specData.fields?.[field]?.minimum ?? null;
}

function _fieldMax(field) {
  return _specData.fields?.[field]?.maximum ?? null;
}

function _applyFinancialLimit(field, inputId, spec) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const financial = spec.financial_limits?.[field] || [null, null];
  const min = financial[0] != null ? financial[0] : _fieldMin(field);
  const max = financial[1] != null ? financial[1] : _fieldMax(field);
  if (min != null) input.min = min;
  if (max != null) input.max = max;
}

function _getDobBounds(minAge, maxAge) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
  return { minDate: _toYMD(minDate), maxDate: _toYMD(maxDate) };
}

function _toYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function _setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const group = input.closest(".form-group") || input.parentElement;
  if (!group) return;

  let el = group.querySelector(`.field-error[data-for="${inputId}"]`);
  if (!message) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("span");
    el.className = "hint field-error";
    el.dataset.for = inputId;
    el.style.color = "#c0392b";
    group.appendChild(el);
  }
  el.textContent = message;
}

function _clearFieldError(inputId) {
  _setFieldError(inputId, "");
}

function _validateAgeField(spec, silent) {
  const dob = document.getElementById("f-dob")?.value;
  if (!dob || !spec) return true;

  const age = _calcAge(dob);
  const [minAge, maxAge] = spec.allowed_entry_age || [18, 70];
  if (age < minAge || age > maxAge) {
    const msg = `Entry age must be between ${minAge} and ${maxAge} for this product.`;
    if (!silent) _setFieldError("f-dob", msg);
    return false;
  }
  _clearFieldError("f-dob");
  return true;
}

function _validateNumericField(field, spec, silent) {
  const inputId = SPEC_TO_INPUT_ID[field];
  const input = document.getElementById(inputId);
  if (!input || !spec) return true;

  const required = (spec.required_fields || []).includes(field);
  const value = _safeNum(inputId);
  if (required && value == null) {
    if (!silent) _setFieldError(inputId, "This field is required.");
    return false;
  }
  if (value == null) {
    _clearFieldError(inputId);
    return true;
  }

  let min = null;
  let max = null;

  if (field === "term" && spec.allowed_term_years) {
    min = spec.allowed_term_years[0];
    max = spec.allowed_term_years[1];
  } else if (spec.financial_limits?.[field]) {
    min = spec.financial_limits[field][0];
    max = spec.financial_limits[field][1];
  } else {
    min = _fieldMin(field);
    max = _fieldMax(field);
  }

  if (min != null && value < min) {
    if (!silent) _setFieldError(inputId, `Minimum allowed is ${min}.`);
    return false;
  }
  if (max != null && value > max) {
    if (!silent) _setFieldError(inputId, `Maximum allowed is ${max}.`);
    return false;
  }

  _clearFieldError(inputId);
  return true;
}

function UI_applyBackendValidationMessages(messages) {
  messages.forEach(msg => {
    const requiredMatch = msg.match(/^Missing required field:\s*(.+)$/);
    if (requiredMatch) {
      const field = requiredMatch[1].trim();
      const inputId = SPEC_TO_INPUT_ID[field];
      if (inputId) _setFieldError(inputId, "This field is required.");
      return;
    }

    if (msg.toLowerCase().includes("entry age must be between")) {
      _setFieldError("f-dob", msg);
      return;
    }
    if (msg.toLowerCase().startsWith("term must be between")) {
      _setFieldError("f-term", msg);
      return;
    }
    if (msg.toLowerCase().startsWith("sa must")) {
      _setFieldError("f-sa", msg);
      return;
    }
    if (msg.toLowerCase().startsWith("escalationrate must")) {
      _setFieldError("f-escalation", msg);
      return;
    }
    if (msg.toLowerCase().startsWith("target must")) {
      _setFieldError("f-target", msg);
      return;
    }
    if (msg.toLowerCase().startsWith("contrib must")) {
      _setFieldError("f-contrib", msg);
    }
  });
}

function UI_validateBeforeSubmit(spec) {
  let ok = true;

  [
    ["f-firstname", "First name is required."],
    ["f-lastname", "Last name is required."],
    ["f-dob", "Date of birth is required."],
    ["f-gender", "Gender is required."],
    ["f-email", "Email is required."],
    ["f-occupation", "Occupation is required."],
  ].forEach(([id, msg]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!String(el.value || "").trim()) {
      _setFieldError(id, msg);
      ok = false;
    }
  });

  if (!_validateAgeField(spec, false)) ok = false;

  ["sa", "term", "escalationRate", "contrib", "retireAge", "target"].forEach(field => {
    if (!_validateNumericField(field, spec, false)) ok = false;
  });

  const partialEnabled = document.getElementById("partial-mat-content")?.classList.contains("open") || false;
  const partialCount = _safeNum("f-partial-count");
  if (partialEnabled && (partialCount == null || partialCount < 1 || partialCount > 10)) {
    _setFieldError("f-partial-count", "Partial maturities must be between 1 and 10.");
    ok = false;
  }

  return ok;
}

async function UI_submitForQuote() {
  const spec = _getProductSpec(_selectedProduct);
  if (!spec) {
    showToast("No specification loaded for selected product.");
    return;
  }

  if (!UI_validateBeforeSubmit(spec)) {
    showToast("Please correct highlighted validation errors.");
    return;
  }

  const firstname = document.getElementById("f-firstname").value.trim();
  const lastname = document.getElementById("f-lastname").value.trim();
  const dob = document.getElementById("f-dob").value;
  const gender = document.getElementById("f-gender").value;
  const email = document.getElementById("f-email").value.trim();
  const smoker = document.getElementById("f-smoker").value;
  const occupation = document.getElementById("f-occupation").value.trim();
  const employer = document.getElementById("f-employer").value.trim();
  const phone = document.getElementById("f-phone").value.trim();
  const idno = document.getElementById("f-idno").value.trim();
  const freq = document.getElementById("f-freq").value;
  const age = _calcAge(dob);

  const sa = _safeNum("f-sa");
  const term = _safeNum("f-term");
  const escalationRate = _safeNum("f-escalation");
  const contrib = _safeNum("f-contrib");
  const retireAge = _safeNum("f-retire");
  const target = _safeNum("f-target");
  const childName = document.getElementById("f-childname")?.value.trim() || "";
  const childDob = document.getElementById("f-childdob")?.value || "";

  const partialEnabled = document.getElementById("partial-mat-content")?.classList.contains("open") || false;
  const partialCount = _safeNum("f-partial-count") || 0;
  const partialMat = { enabled: partialEnabled, count: partialCount };

  const jlEnabled = document.getElementById("joint-life-content")?.classList.contains("open") || false;
  const jointLife = {
    enabled: jlEnabled,
    name: document.getElementById("f-jl-name")?.value.trim() || "",
    dob: document.getElementById("f-jl-dob")?.value || "",
    gender: document.getElementById("f-jl-gender")?.value || "",
    email: document.getElementById("f-jl-email")?.value.trim() || "",
    phone: document.getElementById("f-jl-phone")?.value.trim() || "",
  };
  if (jlEnabled && jointLife.dob) {
    jointLife.age = _calcAge(jointLife.dob);
  }
  // read joint employment status if present
  const jlEmploymentEl = document.getElementById("f-jl-employment");
  if (jlEmploymentEl) jointLife.employmentStatus = jlEmploymentEl.value || "employed";

  // benefit selections (education)
  const benefits = {
    Death: document.getElementById("benefit-death")?.checked || true,
    PTD: document.getElementById("benefit-ptd")?.checked || false,
    CriticalIllness: document.getElementById("benefit-ci")?.checked || false,
    Retrenchment: document.getElementById("benefit-retrenchment")?.checked || false,
    DoubleAccident: document.getElementById("benefit-doubleacc")?.checked || false,
    WOPDisability: document.getElementById("benefit-wopdisability")?.checked || false,
  };

  const payload = {
    product: _selectedProduct,
    age,
    dob,
    gender,
    smoker,
    freq,
    sa: sa !== null ? sa : null,
    term: term !== null ? term : null,
    escalationRate: escalationRate !== null ? escalationRate : null,
    contrib: contrib !== null ? contrib : null,
    retireAge: retireAge !== null ? retireAge : null,
    target: target !== null ? target : null,
    childName,
    childDob,
    partialMat,
    jointLife,
    benefits,
  };

  document.getElementById("loading-overlay").classList.add("show");
  let result;
  try {
    result = await CALC_getQuote(payload);
  } catch (err) {
    if (Array.isArray(err.validationMessages) && err.validationMessages.length) {
      UI_applyBackendValidationMessages(err.validationMessages);
      showToast(err.validationMessages[0]);
    } else {
      showToast(err.message || "Unable to generate quote at this time.");
    }
    return;
  } finally {
    document.getElementById("loading-overlay").classList.remove("show");
  }

  const ref = _makeRef();
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const person = { firstname, lastname, dob, age, gender, smoker, occupation, employer, email, phone, idno };

  document.getElementById("quote-container").innerHTML =
    RENDER_quoteHTML({ ref, today, product: _selectedProduct, person, freq, result, jointLife, partialMat });

  _quoteData = {
    ref,
    today,
    person,
    product: _selectedProduct,
    freq,
    result,
    jointLife,
    partialMat,
    emailBody: _buildEmailBody({ ref, today, person, product: _selectedProduct, freq, result, jointLife, partialMat }),
  };
  _setScreen(3);
}

function _safeNum(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const v = parseFloat(el.value);
  return Number.isNaN(v) ? null : v;
}

function _calcAge(dob) {
  const today = new Date();
  const bd = new Date(dob);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

function _makeRef() {
  return `LIQ-${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3400);
}
