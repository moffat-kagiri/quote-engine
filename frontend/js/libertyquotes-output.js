"use strict";

function RENDER_quoteHTML({ ref, today, product, person, freq, result, jointLife, partialMat }) {
  const { firstname, lastname, dob, age, gender, smoker, occupation, employer, email, phone, idno } = person;
  const { premium, benefits, freeBenefits, note, details, withProfitProjection } = result;
  const cfg = _getProductView(product);
  const freqLabel = { monthly: "Monthly", quarterly: "Quarterly", semiannual: "Semi-Annual", annually: "Annual" }[freq];
  const gLabel = { M: "Male", F: "Female" }[gender] || gender;
  const sLabel = smoker === "S" ? "Smoker" : "Non-Smoker";
  
  // Compute premiums for all frequencies from the monthly premium
  // The result.premium is already multiplied by the frequency multiplier; convert back to monthly
  const freqMults = { monthly: 1, quarterly: 2.9, semiannual: 5.5, annually: 10 };
  const monthlyPremium = Math.round(premium / (freqMults[freq] || 1));
  const allFreqPremiums = {
    monthly: monthlyPremium,
    quarterly: Math.round(monthlyPremium * 2.9),
    semiannual: Math.round(monthlyPremium * 5.5),
    annually: Math.round(monthlyPremium * 10)
  };

  const detailRows = (details || []).map(([label, value]) =>
    `<div class="info-row"><span class="info-label">${label}</span><span class="info-val">${value}</span></div>`
  ).join("");

  const benefitCards = benefits.map(benefit => `
    <div class="benefit-card">
      <div class="bc-label">${benefit.risk}</div>
      <div class="bc-val ${benefit.highlight ? "highlight" : ""}">${benefit.coverage}</div>
      <div class="bc-note">${benefit.note || ""}</div>
    </div>`).join("");

  const freeBadges = (freeBenefits || []).map(benefit =>
    `<span class="free-benefit-badge">&#10003; ${benefit}</span>`
  ).join("");

  const jointLifeGender = ({ M: "M", F: "F" }[jointLife?.gender] || "");
  const jlRow = (jointLife?.enabled && jointLife.name) ? `
    <div class="info-row" style="background:#f0f5fa;padding:6px 10px;border-radius:3px;margin-top:6px;">
      <span class="info-label">Joint Life</span>
      <span class="info-val">${jointLife.name}${jointLife.age ? ` &middot; Age ${jointLife.age}` : ""}${jointLifeGender ? ` &middot; ${jointLifeGender}` : ""}</span>
    </div>` : "";

  const pmRow = (partialMat?.enabled && partialMat.count > 0) ? `
    <div class="info-row">
      <span class="info-label">Partial Maturities</span>
      <span class="info-val">${partialMat.count} instalments</span>
    </div>` : "";

  // WithProfit projection section
  const withProfitProjectionHtml = withProfitProjection ? _renderWithProfitProjection(withProfitProjection) : "";
  
  // Pension projection section (for pension products)
  let retireAge = null;
  if (details) {
    const retireAgeDetail = details.find(d => d[0] === "Retirement Age");
    if (retireAgeDetail) {
      const match = retireAgeDetail[1].match(/(\d+)/);
      retireAge = match ? parseInt(match[1]) : null;
    }
  }
  const pensionProjectionHtml = (product === "pension" && retireAge) ? 
    _renderPensionProjection({ details, benefits, person: { age }, retire_age: retireAge, age }) : "";

  return `
  <div class="quote-header">
    <div>
      <div class="qh-label">Official Quote - Illustrative</div>
      <div class="qh-product">${cfg.label}</div>
      <div class="qh-sub">Prepared for ${firstname} ${lastname} &middot; ${today}</div>
    </div>
    <div class="quote-ref">
      <span>Quote Reference</span>
      <strong>${ref}</strong>
      <div style="margin-top:5px;font-size:0.62rem;color:#556677;">Valid for 30 days</div>
    </div>
  </div>
  <div class="quote-body">

    <div class="quote-section">
      <div class="qs-title">Policyholder Details</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
        <div class="info-row"><span class="info-label">Full Name</span><span class="info-val">${firstname} ${lastname}</span></div>
        <div class="info-row"><span class="info-label">Date of Birth</span><span class="info-val">${new Date(dob).toLocaleDateString("en-GB")}</span></div>
        <div class="info-row"><span class="info-label">Age at Entry</span><span class="info-val">${age} yrs</span></div>
        <div class="info-row"><span class="info-label">Gender</span><span class="info-val">${gLabel}</span></div>
        <div class="info-row"><span class="info-label">Smoker Status</span><span class="info-val">${sLabel}</span></div>
        <div class="info-row"><span class="info-label">Occupation</span><span class="info-val">${occupation}</span></div>
        ${employer ? `<div class="info-row"><span class="info-label">Employer</span><span class="info-val">${employer}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Email</span><span class="info-val" style="font-size:0.72rem">${email}</span></div>
        <div class="info-row"><span class="info-label">Phone</span><span class="info-val">${phone || "&mdash;"}</span></div>
        <div class="info-row"><span class="info-label">ID / Passport</span><span class="info-val">${idno || "&mdash;"}</span></div>
        ${jlRow}
      </div>
    </div>

    <div class="quote-section">
      <div class="qs-title">Policy Parameters</div>
      ${detailRows}
      ${pmRow}
    </div>

    ${withProfitProjectionHtml}
    ${pensionProjectionHtml}

    <div class="quote-section">
      <div class="qs-title">Key Benefits (Risk - Coverage)</div>
      <div class="benefit-grid">${benefitCards}</div>
    </div>

    ${freeBadges ? `
    <div class="quote-section">
      <div class="qs-title">Complimentary Benefits</div>
      <div style="margin-top:4px">${freeBadges}</div>
    </div>` : ""}

    <div class="quote-section">
      <div class="qs-title">Important Notes</div>
      <div class="disclaimer">
        Warning: ${note || ""} All figures are illustrative estimates for discussion only and do not constitute a binding offer.
        Final premiums and benefits are subject to full underwriting and acceptance.
        Occupation class will be assigned during underwriting.
        This quote is valid for 30 days from issue. Ref: <strong>${ref}</strong>.
      </div>
    </div>

  </div>`;
}

function _buildEmailBody({ ref, today, person, product, freq, result, jointLife, partialMat }) {
  const { firstname, lastname, email, phone, idno, age, gender, smoker, occupation, employer } = person;
  const cfg = _getProductView(product);
  const { premium, benefits } = result;
  const freqMults = { monthly: 1, quarterly: 2.9, semiannual: 5.5, annually: 10 };
  const monthlyPremium = Math.round(premium / (freqMults[freq] || 1));
  const freqLabel = { monthly: "Monthly", quarterly: "Quarterly", semiannual: "Semi-Annual", annually: "Annual" }[freq];
  const benefitLines = benefits.map(benefit => `  - ${benefit.risk}: ${benefit.coverage}`).join("\n");
  const jlSection = (jointLife?.enabled && jointLife.name) ? `\nJOINT LIFE
  Name:   ${jointLife.name}
  DOB:    ${jointLife.dob || "-"}
  Gender: ${jointLife.gender || "-"}
  Email:  ${jointLife.email || "-"}
  Phone:  ${jointLife.phone || "-"}\n` : "";
  const pmSection = (partialMat?.enabled && partialMat.count > 0)
    ? `\n  Partial Maturities requested: ${partialMat.count} instalments\n`
    : "";

  return `Dear Sales Team,

A new quote has been generated via the Liberty Life portal and requires processing.

=======================================
QUOTE REFERENCE: ${ref}
DATE:            ${today}
PRODUCT:         ${cfg.label}
=======================================

MAIN LIFE
  Full Name:     ${firstname} ${lastname}
  Email:         ${email}
  Phone:         ${phone || "Not provided"}
  ID/Passport:   ${idno || "Not provided"}
  Age at Entry:  ${age} years
  Gender:        ${gender === "M" ? "Male" : "Female"}
  Smoker:        ${smoker === "S" ? "Smoker" : "Non-Smoker"}
  Occupation:    ${occupation} (class to be assigned at underwriting)
  Employer:      ${employer || "Not provided"}
${jlSection}
MONTHLY PREMIUM: KES ${monthlyPremium.toLocaleString()}
${freqLabel.toUpperCase()} PAYMENT: KES ${premium.toLocaleString()} (${freqLabel})
${pmSection}
KEY BENEFITS
${benefitLines}

=======================================
ACTION REQUIRED
  1. Assign occupation class based on occupation: "${occupation}"
  2. Conduct full underwriting review
  3. Contact client to confirm documentation
  4. Process application if all requirements are met

Client has received a copy of this quote.
=======================================
Auto-generated by Liberty Life Portal - Do not reply directly.`;
}

function UI_sendToSales() {
  const { emailBody, ref, person } = _quoteData;
  if (!emailBody) return;
  const to = "sales@libertyke.co.ke";
  const subject = encodeURIComponent(`Liberty Life Application - Ref: ${ref} - ${person.email}`);
  const body = encodeURIComponent(emailBody);
  window.location.href = `mailto:${to}?cc=${encodeURIComponent(person.email)}&subject=${subject}&body=${body}`;
  showToast("Email client opened. Ready to send to sales!");
}

/**
 * RENDER WITH-PROFIT PROJECTION
 * Renders year-by-year accumulation table and summary for With-Profit products
 */
function _renderWithProfitProjection(projectionData) {
  if (!projectionData || !projectionData.projection_years) {
    return "";
  }

  const years = projectionData.projection_years || [];
  const summary = projectionData.summary || {};
  
  // Build projection table rows
  const tableRows = years.map((year, idx) => `
    <tr style="border-bottom:1px solid #dde4ed;${idx % 2 === 0 ? 'background:#f9fbfd;' : ''}">
      <td style="padding:7px 8px;text-align:center;font-weight:600;font-size:0.78rem;">${year.year}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">${year.age}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">KES ${Math.round(year.opening_balance).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">KES ${Math.round(year.annual_premium).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">KES ${Math.round(year.table_deposit).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">KES ${Math.round(year.table_withdrawal).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">KES ${Math.round(year.death_cost).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;">KES ${Math.round(year.ptd_cost).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;color:#0d7a3a;font-weight:600;">KES ${Math.round(year.fund_growth).toLocaleString()}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-size:0.76rem;font-weight:600;">KES ${Math.round(year.closing_balance).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
    <div class="quote-section">
      <div class="qs-title">With-Profit Accumulation Projection</div>
      <div style="overflow-x:auto;margin:12px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:0.73rem;">
          <thead>
            <tr style="background:#e8f0f8;border-bottom:2px solid #A6CBDB;white-space:nowrap;">
              <th style="padding:8px;text-align:center;font-weight:700;border-right:1px solid #A6CBDB;">Year</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Age</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Opening Balance</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Annual Premium</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Deposit</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Withdrawal</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">Death Cost</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;">PTD Cost</th>
              <th style="padding:8px;text-align:right;font-weight:700;border-right:1px solid #A6CBDB;color:#0d7a3a;">Fund Growth</th>
              <th style="padding:8px;text-align:right;font-weight:700;">Closing Balance</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:12px;background:#f7fafd;border:1px solid #c8dcea;border-radius:3px;margin-top:12px;">
        <div>
          <div class="info-row"><span class="info-label">Initial Deposit</span><span class="info-val">KES ${Math.round(summary.initial_deposit || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Annual Premium</span><span class="info-val">KES ${Math.round(summary.annual_premium || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Total Premiums Paid</span><span class="info-val">KES ${Math.round(summary.total_premiums || 0).toLocaleString()}</span></div>
        </div>
        <div>
          <div class="info-row"><span class="info-label">Total Table Deposits</span><span class="info-val">KES ${Math.round(summary.total_table_deposits || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Total Table Withdrawals</span><span class="info-val">KES ${Math.round(summary.total_table_withdrawals || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Accumulated Fund</span><span class="info-val" style="color:#0d7a3a;font-weight:700;">KES ${Math.round(summary.total_accumulated_fund || 0).toLocaleString()}</span></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr;gap:16px;padding:12px;background:#fff8f0;border:1px solid #e8d4c0;border-radius:3px;margin-top:12px;">
        <div>
          <div class="info-row"><span class="info-label">Total Death Costs</span><span class="info-val">KES ${Math.round(summary.total_death_costs || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Total PTD Costs</span><span class="info-val">KES ${Math.round(summary.total_ptd_costs || 0).toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Death/PTD Benefit at Maturity</span><span class="info-val" style="color:#112760;font-weight:700;">KES ${Math.round(summary.death_ptd_benefit_at_maturity || 0).toLocaleString()}</span></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * RENDER PENSION PROJECTION
 * Displays a clean, graphic-focused view of pension fund at retirement
 */
function _renderPensionProjection({ details, benefits, person, retire_age, age }) {
  if (!details || !benefits) {
    return "";
  }
  
  // Extract key values from benefits and details
  const fundBenefit = benefits.find(b => b.risk === "Projected Fund at Retirement");
  const annuityBenefit = benefits.find(b => b.risk === "Estimated Monthly Annuity");
  const fundValue = fundBenefit ? fundBenefit.coverage : "KES 0";
  const monthlyPension = annuityBenefit ? annuityBenefit.coverage : "KES 0";
  
  // Extract numeric values
  const fundNum = parseInt(fundValue.replace(/[^\d]/g, "")) || 0;
  const monthlyNum = parseInt(monthlyPension.replace(/[^\d]/g, "")) || 0;
  const yearsUntilRetirement = retire_age - age;
  
  // Create a simple bar chart visualization
  const maxFund = 10000000; // 10M for scale reference
  const fundBarWidth = Math.min(90, (fundNum / maxFund) * 100);
  
  return `
    <div class="quote-section">
      <div class="qs-title">Retirement Fund Projection</div>
      
      <!-- Main Retirement Fund Visual -->
      <div style="background:linear-gradient(135deg, #2563eb 0%, #0d7a3a 100%);border-radius:8px;padding:28px;color:white;margin-bottom:20px;text-align:center;">
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.9);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Projected Fund at Age ${retire_age}</div>
        <div style="font-size:2.8rem;font-weight:700;font-family:'Courier New',monospace;margin:12px 0;">${fundValue}</div>
        <div style="font-size:0.8rem;color:rgba(255,255,255,0.85);">Based on ${yearsUntilRetirement}-year accumulation with expected returns</div>
      </div>
      
      <!-- Key Metrics Cards -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="border:1.5px solid #c8dcea;border-radius:6px;padding:16px;background:#f9fbfd;">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#556677;letter-spacing:0.04em;margin-bottom:6px;">Estimated Monthly Pension</div>
          <div style="font-size:1.6rem;font-weight:700;font-family:'Courier New',monospace;color:#112760;">${monthlyPension}</div>
          <div style="font-size:0.65rem;color:#6b7a8d;margin-top:4px;">Monthly income in retirement</div>
        </div>
        
        <div style="border:1.5px solid #c8dcea;border-radius:6px;padding:16px;background:#f9fbfd;">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:#556677;letter-spacing:0.04em;margin-bottom:6px;">Accumulation Period</div>
          <div style="font-size:1.6rem;font-weight:700;font-family:'Courier New',monospace;color:#112760;">${yearsUntilRetirement} Years</div>
          <div style="font-size:0.65rem;color:#6b7a8d;margin-top:4px;">From age ${age} to ${retire_age}</div>
        </div>
      </div>
      
      <!-- Fund Growth Visualization -->
      <div style="background:#f0f5fa;border-radius:6px;padding:16px;margin-bottom:20px;">
        <div style="font-size:0.75rem;font-weight:700;color:#556677;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.03em;">Growth Visualization</div>
        <div style="background:white;border-radius:4px;padding:8px;border:1px solid #dde4ed;">
          <div style="display:flex;align-items:center;height:32px;background:linear-gradient(90deg, #2563eb 0%, #0d7a3a 100%);border-radius:3px;width:${fundBarWidth}%;transition:width 0.6s ease;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.65rem;color:#6b7a8d;margin-top:6px;">
          <span>KES 0</span>
          <span>KES 10M (reference)</span>
        </div>
      </div>
      
      <!-- Information Cards -->
      <div style="display:grid;grid-template-columns:1fr;gap:12px;">
        <div style="background:#fffbf3;border-left:4px solid #f59e0b;border-radius:4px;padding:12px;font-size:0.75rem;color:#78350f;line-height:1.5;">
          <strong>How this works:</strong> Your monthly contributions accumulate over ${yearsUntilRetirement} years with expected returns based on your fund selection. At retirement, this fund can be converted to regular monthly income or taken as a lump sum.
        </div>
        
        <div style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:4px;padding:12px;font-size:0.75rem;color:#18711f;line-height:1.5;">
          <strong>Important:</strong> These projections are illustrative estimates based on expected returns and do not guarantee any specific outcome. Actual returns depend on fund performance and market conditions. Please consult with a financial advisor for personalized advice.
        </div>
      </div>
    </div>
  `;
}
