# Quotes Project

## Structure

- `frontend/libertyquotes.html` - user interface for quote generation
- `backend/quote_server.py` - Flask API (`/quote`, `/quote/fallback`)
- `backend/excelengine.py` - product-specific Excel autorater integration
- `backend/premiums.py` - generic Python fallback premium engine
- `backend/productspecs.py` - product matrix/specifications and validation
- `backend/soma_rates.xlsx` - Excel autorater workbook

## Prerequisites

- Python 3.10+
- `pip`
- Microsoft Excel + `xlwings` (only if you want live Excel autorater calculations)

## Setup

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install flask flask-cors xlwings
```

If you only want Python fallback ratings (no Excel autorater), you can skip `xlwings`:

```powershell
pip install flask flask-cors
```

## Run Backend

From the project root:

```powershell
python backend\quote_server.py
```

Server runs on `http://127.0.0.1:5050`.

Endpoints:

- `POST /quote` - primary engine (Excel where available, else Python fallback)
- `POST /quote/fallback` - always Python fallback (`premiums.py`)

## Open Frontend

Open this file in your browser:

- `frontend/libertyquotes.html`

The frontend is already configured to call:

- `http://localhost:5050/quote`
- `http://localhost:5050/quote/fallback`

## Quick Validation

From the project root:

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
python -m py_compile backend\productspecs.py backend\premiums.py backend\excelengine.py backend\quote_server.py
```
