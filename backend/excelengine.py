from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Mapping, MutableMapping, Optional

from premiums import calculate_quote as generic_quote
from productspecs import normalize_payload


class AutoraterNotConfiguredError(Exception):
    pass


@dataclass(frozen=True)
class AutoraterConfig:
    workbook_path: str
    input_sheet: str
    output_sheet: str
    input_cells: Mapping[str, str]
    output_cells: Mapping[str, str]


DEFAULT_AUTORATER_MAP: Dict[str, AutoraterConfig] = {
    "education": AutoraterConfig(
        workbook_path="soma_rates.xlsx",
        input_sheet="Premium Calculation",
        output_sheet="Outputs",
        input_cells={
            "age": "F11",
            "gender": "F12",
            "term": "F13",
            "target": "F14",
            "freq": "F15",
        },
        output_cells={
            "premium": "C2",
        },
    ),
    "term": AutoraterConfig(
        workbook_path="soma_rates.xlsx",
        input_sheet="Premium Calculation",
        output_sheet="Outputs",
        input_cells={
            "age": "F11",
            "gender": "F12",
            "term": "F13",
            "sa": "F14",
            "freq": "F15",
        },
        output_cells={
            "premium": "C2",
        },
    ),
}


def calculate_quote_from_excel(
    payload: Mapping[str, Any],
    autorater_map: Optional[Mapping[str, AutoraterConfig]] = None,
    base_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """Rate using a product-specific Excel autorater, then merge with generic quote structure."""

    p = normalize_payload(payload)
    product = str(p.get("product") or "")
    config_map = autorater_map or DEFAULT_AUTORATER_MAP

    if product not in config_map:
        raise AutoraterNotConfiguredError(f"No autorater configured for product '{product}'.")

    cfg = config_map[product]
    root = base_dir or Path(__file__).resolve().parent
    wb_path = (root / cfg.workbook_path).resolve()
    if not wb_path.exists():
        raise FileNotFoundError(f"Autorater workbook not found: {wb_path}")

    outputs = _run_with_xlwings(wb_path, cfg, p)

    quote = generic_quote(p)
    if "premium" in outputs and outputs["premium"] is not None:
        quote["premium"] = round(float(outputs["premium"]))
        note = quote.get("note") or ""
        suffix = f" Figures rated from Excel autorater ({wb_path.name})."
        quote["note"] = (note + suffix).strip()
    quote.setdefault("details", []).append(["Rating Source", f"Excel autorater: {wb_path.name}"])
    return quote


def _run_with_xlwings(workbook_path: Path, config: AutoraterConfig, payload: Mapping[str, Any]) -> MutableMapping[str, Any]:
    """Use desktop Excel recalculation so formulas are evaluated correctly."""

    try:
        import xlwings as xw
    except ImportError as exc:
        raise RuntimeError("xlwings is required for live Excel autorater calculations.") from exc

    app = xw.App(visible=False, add_book=False)
    app.display_alerts = False
    app.screen_updating = False
    workbook = None
    try:
        workbook = app.books.open(str(workbook_path))
        input_sheet = workbook.sheets[config.input_sheet]
        output_sheet = workbook.sheets[config.output_sheet]

        for payload_key, cell in config.input_cells.items():
            input_sheet.range(cell).value = _resolve_payload_value(payload, payload_key)

        app.calculate()

        outputs: MutableMapping[str, Any] = {}
        for name, cell in config.output_cells.items():
            outputs[name] = output_sheet.range(cell).value
        return outputs
    finally:
        if workbook is not None:
            workbook.close(save=False)
        app.quit()


def _resolve_payload_value(payload: Mapping[str, Any], key: str) -> Any:
    cur: Any = payload
    for part in key.split("."):
        if isinstance(cur, Mapping):
            cur = cur.get(part)
        else:
            cur = None
        if cur is None:
            break
    return cur
