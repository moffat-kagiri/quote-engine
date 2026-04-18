from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS

from excelengine import calculate_quote_from_excel
from premiums import calculate_quote as calculate_python_quote
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

    # Primary: use Python calculations. If unavailable, fall back to Excel autorater.
    try:
        result = calculate_python_quote(payload)
        result.setdefault("details", []).append(["Rating Source", "Python primary (premiums.py)"])
        return jsonify(result)
    except Exception:
        try:
            res = calculate_quote_from_excel(payload)
            res.setdefault("details", []).append(["Rating Source", "Excel autorater (fallback)"])
            res["note"] = (res.get("note") or "") + " Using Excel autorater as fallback."
            return jsonify(res)
        except Exception:
            # final fallback: try python again to return some error payload
            result = calculate_python_quote(payload)
            result["note"] = (result.get("note") or "") + " Returned Python result after autorater failure."
            result.setdefault("details", []).append(["Rating Source", "Python (recovered)"])
            return jsonify(result)


@app.post("/quote/fallback")
def quote_fallback() -> Any:
    payload: Dict[str, Any] = normalize_payload(request.get_json(force=True, silent=True) or {})

    ok, errors = validate_payload(payload)
    if not ok:
        return jsonify({"error": "Validation failed", "messages": errors}), 400

    result = calculate_python_quote(payload)
    result.setdefault("details", []).append(["Rating Source", "Python (premiums.py)"])
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050, debug=True)


