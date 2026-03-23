from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from excelengine import calculate_quote_from_excel
from premiums import calculate_quote as calculate_fallback_quote
from productspecs import BRANDS, FIELD_LIBRARY, PRODUCT_SPECS, normalize_payload, validate_payload


app = Flask(__name__)
CORS(app)


@app.get("/productspecs")
def productspecs() -> Any:
    return jsonify(
        {
            "brands": BRANDS,
            "fields": {key: asdict(value) for key, value in FIELD_LIBRARY.items()},
            "products": {key: asdict(value) for key, value in PRODUCT_SPECS.items()},
        }
    )


@app.post("/quote")
def quote() -> Any:
    payload: Dict[str, Any] = normalize_payload(request.get_json(force=True, silent=True) or {})

    ok, errors = validate_payload(payload)
    if not ok:
        return jsonify({"error": "Validation failed", "messages": errors}), 400

    try:
        return jsonify(calculate_quote_from_excel(payload))
    except Exception:
        result = calculate_fallback_quote(payload)
        result["note"] = (result.get("note") or "") + " Using Python fallback rates because Excel autorater is unavailable."
        result.setdefault("details", []).append(["Rating Source", "Python fallback (premiums.py)"])
        return jsonify(result)


@app.post("/quote/fallback")
def quote_fallback() -> Any:
    payload: Dict[str, Any] = normalize_payload(request.get_json(force=True, silent=True) or {})

    ok, errors = validate_payload(payload)
    if not ok:
        return jsonify({"error": "Validation failed", "messages": errors}), 400

    result = calculate_fallback_quote(payload)
    result.setdefault("details", []).append(["Rating Source", "Python fallback (premiums.py)"])
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)


