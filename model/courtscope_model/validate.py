from __future__ import annotations

from typing import Any

REQUIRED = {
    "judge_id",
    "race",
    "offense_class",
    "prior_record",
    "plea_trial",
    "age_band",
    "gender",
    "incarceration_to_serve",
    "sentence_length_months",
    "sentence_date",
    "judge_match_state",
}


def validate_records(rows: list[dict[str, Any]]) -> dict[str, Any]:
    errors: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        missing = sorted(REQUIRED - row.keys())
        if missing:
            errors.append({"row": index, "missing": missing})
            continue
        if bool(row.get("incarceration_to_serve")) and row.get("sentence_length_months") in (None, "", 0, "0"):
            errors.append({"row": index, "invalid": ["sentence_length_months_required_for_incarceration"]})
    return {"valid": not errors, "errors": errors, "rows": len(rows)}
