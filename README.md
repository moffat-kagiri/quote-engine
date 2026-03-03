# Quotes Project

## Structure

- `frontend/libertyquotes.html` - spec-driven quote UI (loads product definitions from backend)
- `backend/quote_server.py` - Flask API (`/productspecs`, `/quote`, `/quote/fallback`)
- `backend/productspecs.py` - product matrix, field constraints, payload normalization, validation, age-from-DOB utility
- `backend/excelengine.py` - product-specific Excel autorater integration
- `backend/premiums.py` - generic Python fallback premium engine
- `backend/soma_rates.xlsx` - Excel autorater workbook
- `requirements.txt` - Python dependencies

## Prerequisites

- Python 3.10+
- `pip`
- Microsoft Excel + `xlwings` (only if you want live Excel autorater calculations)

## Setup

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If you only want Python fallback ratings (no Excel autorater), you can skip `xlwings` by installing manually:

```powershell
pip install Flask flask-cors
```

## Run Backend

From the project root:

```powershell
python backend\quote_server.py
```

Server runs on `http://127.0.0.1:5050`.

### API Endpoints

- `GET /productspecs`
  - Returns `brands`, `fields`, and `products` from `productspecs.py`
  - Frontend uses this as the source of truth for product cards and validation limits
- `POST /quote`
  - Primary engine (Excel autorater where configured, otherwise Python fallback)
- `POST /quote/fallback`
  - Always Python fallback (`premiums.py`)

## Open Frontend

Open this file in your browser:

- `frontend/libertyquotes.html`

Frontend calls:

- `http://localhost:5050/productspecs`
- `http://localhost:5050/quote`
- `http://localhost:5050/quote/fallback`

## Validation Behavior

- Frontend enforces dynamic constraints from backend product specs (age range, term range, financial limits)
- Backend performs authoritative validation via `validate_payload(...)`
- Validation errors from backend are surfaced in the frontend form
- Age can be derived from `dob` server-side via `calculate_age_from_dob(...)`

## Escalation Rate

- `escalationRate` is required for:
  - `withprofit`
  - `education`
- Frontend renders this as `Escalation Rate (% p.a.)`
- It is validated against product constraints and passed to pricing engines

## Quick Validation

From the project root:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
python -m py_compile backend\productspecs.py backend\premiums.py backend\excelengine.py backend\quote_server.py
```
