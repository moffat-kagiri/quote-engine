"use strict";

async function _parseQuoteResponse(resp, endpointLabel) {
  if (resp.ok) return await resp.json();

  let errPayload = {};
  try {
    errPayload = await resp.json();
  } catch (_ignored) {
    errPayload = {};
  }

  const msg = errPayload.error || `${endpointLabel} responded ${resp.status}`;
  const err = new Error(msg);
  err.status = resp.status;
  err.validationMessages = Array.isArray(errPayload.messages) ? errPayload.messages : [];
  err.isValidationError = resp.status === 400;
  throw err;
}

async function CALC_getExcelAutoraterQuote(payload) {
  const resp = await fetch(EXCEL_AUTORATER_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });

  return _parseQuoteResponse(resp, "Excel autorater");
}

async function CALC_getQuote(payload) {
  if (USE_EXCEL_AUTORATER) {
    try {
      return await CALC_getExcelAutoraterQuote(payload);
    } catch (err) {
      if (err.isValidationError) throw err;
      console.warn("[QuoteEngine] Excel autorater unavailable; trying Python fallback.", err.message);
      showToast("Excel autorater unavailable - using Python fallback estimates");
      return CALC_getPythonFallbackQuote(payload);
    }
  }

  return CALC_getPythonFallbackQuote(payload);
}

async function CALC_getPythonFallbackQuote(payload) {
  const resp = await fetch(PYTHON_FALLBACK_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12000),
  });

  return _parseQuoteResponse(resp, "Fallback server");
}

// Primary quoting goes through the backend Excel autorater endpoint. If that
// route fails, we retry against the pure-Python fallback endpoint.
