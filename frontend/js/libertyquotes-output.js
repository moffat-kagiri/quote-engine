"use strict";

function RENDER_quoteHTML({ ref, today, product, person, freq, result, jointLife, partialMat }) {
  const { firstname, lastname, dob, age, gender, smoker, occupation, employer, email, phone, idno } = person;
  const { premium, benefits, freeBenefits, note, details } = result;
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

    <div class="quote-section">
      <div class="qs-title">Premium Payable (Select your preferred frequency)</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
        <div style="border: 2px solid ${freq === 'monthly' ? 'var(--primary-blue)' : '#e0e0e0'}; border-radius: 8px; padding: 12px; background: ${freq === 'monthly' ? 'var(--pale-blue)' : '#f0f5fa'}; text-align: center;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Monthly</div>
          <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Pay 12× per year</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--primary-blue);">KES ${allFreqPremiums.monthly.toLocaleString()}</div>
        </div>
        <div style="border: 2px solid ${freq === 'quarterly' ? 'var(--primary-blue)' : '#e0e0e0'}; border-radius: 8px; padding: 12px; background: ${freq === 'quarterly' ? 'var(--pale-blue)' : '#f0f5fa'}; text-align: center;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Quarterly</div>
          <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Pay 4× per year</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--primary-blue);">KES ${allFreqPremiums.quarterly.toLocaleString()}</div>
        </div>
        <div style="border: 2px solid ${freq === 'semiannual' ? 'var(--primary-blue)' : '#e0e0e0'}; border-radius: 8px; padding: 12px; background: ${freq === 'semiannual' ? 'var(--pale-blue)' : '#f0f5fa'}; text-align: center;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Semi-Annual</div>
          <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Pay 2× per year</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--primary-blue);">KES ${allFreqPremiums.semiannual.toLocaleString()}</div>
        </div>
        <div style="border: 2px solid ${freq === 'annually' ? 'var(--primary-blue)' : '#e0e0e0'}; border-radius: 8px; padding: 12px; background: ${freq === 'annually' ? 'var(--pale-blue)' : '#f0f5fa'}; text-align: center;">
          <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Annual</div>
          <div style="font-size: 11px; color: #999; margin-bottom: 8px;">Pay once per year</div>
          <div style="font-size: 16px; font-weight: 600; color: var(--primary-blue);">KES ${allFreqPremiums.annually.toLocaleString()}</div>
        </div>
      </div>
    </div>

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
