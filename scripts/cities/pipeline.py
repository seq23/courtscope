from __future__ import annotations

import csv
import json
import re
import shutil
import sys
from dataclasses import asdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
MODEL_ROOT = ROOT / "model"
if str(MODEL_ROOT) not in sys.path:
    sys.path.insert(0, str(MODEL_ROOT))

from courtscope_model import MethodologyConfig, compute_judge_scores  # noqa: E402
from courtscope_model.engine import VALID_JUDGE_MATCH_STATES  # noqa: E402


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "unknown"


def parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    normalized = str(value or "").strip().lower()
    if normalized in {"1", "true", "yes", "y", "incarceration", "custodial"}:
        return True
    if normalized in {"0", "false", "no", "n", "probation", "non-custodial", "noncustodial"}:
        return False
    raise ValueError(f"Cannot interpret boolean value: {value!r}")


def parse_number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    return float(value)


def parse_date(value: Any) -> date | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromisoformat(str(value)[:10]).date()
    except ValueError:
        return None


def load_records(path: Path) -> tuple[list[dict[str, Any]], list[str]]:
    suffix = path.suffix.lower()
    if suffix == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            records = [dict(row) for row in reader]
            return records, list(reader.fieldnames or [])
    if suffix == ".json":
        payload = read_json(path)
        if isinstance(payload, dict):
            payload = payload.get("records") or payload.get("cases")
        if not isinstance(payload, list):
            raise ValueError("JSON data file must contain an array or an object with a records/cases array.")
        records = [dict(row) for row in payload]
        headers = sorted({key for row in records for key in row})
        return records, headers
    raise ValueError("Only CSV and JSON structured datasets are accepted by the repo intake workflow.")


def normalize_record(row: dict[str, Any]) -> dict[str, Any]:
    normalized = {key: value for key, value in row.items()}
    normalized["case_id"] = str(row.get("case_id") or "").strip()
    normalized["court"] = str(row.get("court") or "").strip()
    normalized["division"] = str(row.get("division") or "").strip()
    normalized["judge_id"] = str(row.get("judge_id") or "").strip()
    normalized["judge_name"] = str(row.get("judge_name") or "").strip()
    normalized["judge_match_state"] = str(row.get("judge_match_state") or "").strip()
    normalized["race"] = str(row.get("race") or "").strip()
    normalized["offense_class"] = str(row.get("offense_class") or "").strip()
    normalized["prior_record"] = str(row.get("prior_record") or "").strip()
    normalized["plea_trial"] = str(row.get("plea_trial") or "").strip()
    normalized["age_band"] = str(row.get("age_band") or "").strip()
    normalized["gender"] = str(row.get("gender") or "").strip()
    normalized["disposition"] = str(row.get("disposition") or "").strip()
    normalized["sentence_date"] = str(row.get("sentence_date") or "").strip()
    normalized["incarceration_to_serve"] = parse_bool(row.get("incarceration_to_serve"))
    normalized["sentence_length_months"] = parse_number(row.get("sentence_length_months"))
    normalized["source_id"] = str(row.get("source_id") or "").strip()
    return normalized


def validate_batch(batch_path: Path, root: Path = ROOT) -> dict[str, Any]:
    contract = read_json(root / "data/cities/completeness_contract.json")
    errors: list[str] = []
    warnings: list[str] = []
    manifest_path = batch_path / "manifest.json"
    if not manifest_path.exists():
        return {"valid": False, "errors": ["MISSING_MANIFEST"], "warnings": [], "manifest": None, "records": []}

    try:
        manifest = read_json(manifest_path)
    except Exception as error:  # pragma: no cover - defensive boundary
        return {"valid": False, "errors": [f"INVALID_MANIFEST_JSON:{error}"], "warnings": [], "manifest": None, "records": []}

    required_manifest = [
        "city_slug",
        "city_name",
        "county",
        "state",
        "batch_id",
        "source_agency",
        "source_url",
        "source_id",
        "data_file",
        "data_dictionary_file",
        "coverage_start",
        "coverage_end",
        "checks",
    ]
    for field in required_manifest:
        if manifest.get(field) in (None, "", {}):
            errors.append(f"MISSING_MANIFEST_FIELD:{field}")

    city_slug = str(manifest.get("city_slug") or "")
    batch_id = str(manifest.get("batch_id") or "")
    if city_slug and not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", city_slug):
        errors.append("INVALID_CITY_SLUG")
    if batch_id and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", batch_id):
        errors.append("INVALID_BATCH_ID")

    checks = manifest.get("checks") if isinstance(manifest.get("checks"), dict) else {}
    for check in contract["required_manifest_checks"]:
        if checks.get(check) is not True:
            errors.append(f"MANIFEST_CHECK_FAILED:{check}")

    data_path = batch_path / str(manifest.get("data_file") or "")
    dictionary_path = batch_path / str(manifest.get("data_dictionary_file") or "")
    if not data_path.is_file():
        errors.append("MISSING_DATA_FILE")
    if not dictionary_path.is_file():
        errors.append("MISSING_DATA_DICTIONARY")

    if errors:
        return {"valid": False, "errors": sorted(set(errors)), "warnings": warnings, "manifest": manifest, "records": []}

    try:
        raw_records, headers = load_records(data_path)
    except Exception as error:
        errors.append(f"DATA_FILE_ERROR:{error}")
        return {"valid": False, "errors": errors, "warnings": warnings, "manifest": manifest, "records": []}

    prohibited = {field.lower() for field in contract["prohibited_public_fields"]}
    exposed = sorted(field for field in headers if field.lower() in prohibited)
    if exposed:
        errors.append("PROHIBITED_PERSONAL_FIELDS:" + ",".join(exposed))

    required_fields = set(contract["required_record_fields"])
    missing_columns = sorted(required_fields - set(headers))
    if missing_columns:
        errors.append("MISSING_REQUIRED_COLUMNS:" + ",".join(missing_columns))

    records: list[dict[str, Any]] = []
    if not errors:
        for index, row in enumerate(raw_records, start=2):
            try:
                normalized = normalize_record(row)
            except Exception as error:
                errors.append(f"ROW_{index}_COERCION_ERROR:{error}")
                continue
            for field in required_fields - {"sentence_length_months"}:
                if normalized.get(field) in (None, ""):
                    errors.append(f"ROW_{index}_MISSING_VALUE:{field}")
            if normalized["judge_match_state"] not in VALID_JUDGE_MATCH_STATES:
                errors.append(f"ROW_{index}_UNVERIFIED_JUDGE_IDENTITY")
            if parse_date(normalized["sentence_date"]) is None:
                errors.append(f"ROW_{index}_INVALID_SENTENCE_DATE")
            if normalized["incarceration_to_serve"] and (
                normalized["sentence_length_months"] is None
                or float(normalized["sentence_length_months"]) <= 0
            ):
                errors.append(f"ROW_{index}_MISSING_CUSTODIAL_LENGTH")
            if normalized["source_id"] != manifest.get("source_id"):
                errors.append(f"ROW_{index}_SOURCE_ID_MISMATCH")
            records.append(normalized)

    case_ids = [record.get("case_id") for record in records]
    if len(case_ids) != len(set(case_ids)):
        errors.append("DUPLICATE_CASE_IDENTIFIERS")

    actual_dates = [parsed for record in records if (parsed := parse_date(record.get("sentence_date")))]
    declared_start = parse_date(manifest.get("coverage_start"))
    declared_end = parse_date(manifest.get("coverage_end"))
    if declared_start is None or declared_end is None or declared_start > declared_end:
        errors.append("INVALID_DECLARED_COVERAGE")
    elif actual_dates:
        if min(actual_dates) < declared_start or max(actual_dates) > declared_end:
            errors.append("RECORDS_OUTSIDE_DECLARED_COVERAGE")
        declared_years = set(range(declared_start.year, declared_end.year + 1))
        observed_years = {value.year for value in actual_dates}
        missing_years = sorted(declared_years - observed_years)
        if missing_years:
            errors.append("UNEXPLAINED_EMPTY_YEARS:" + ",".join(map(str, missing_years)))
    else:
        errors.append("NO_VALID_SENTENCE_DATES")

    model_results = []
    if not errors:
        model_results = [
            result.to_dict()
            for result in compute_judge_scores(
                records,
                MethodologyConfig(
                    version="2.0.0",
                    analysis_end_date=str(manifest["coverage_end"]),
                    bootstrap_samples=80,
                ),
            )
        ]
        if not any(result["publication_status"] == "PUBLISHED" for result in model_results):
            errors.append("NO_JUDGE_CLEARED_PUBLICATION_GATES")

    return {
        "valid": not errors,
        "errors": sorted(set(errors)),
        "warnings": warnings,
        "manifest": manifest,
        "records": records,
        "model_results": model_results,
        "record_count": len(records),
    }


def short_name(name: str) -> str:
    parts = [part for part in name.split() if part]
    if len(parts) < 2:
        return name
    return f"{parts[0][0]}. {parts[-1]}"


def describe_comparison(comparison: dict[str, Any]) -> list[str]:
    group = comparison["group"]
    lines: list[str] = []
    incarceration_gap = comparison.get("incarceration_gap_percentage_points")
    if incarceration_gap is not None:
        if abs(float(incarceration_gap)) < 0.5:
            lines.append(f"The adjusted incarceration-to-serve rates for {group} and White defendants were nearly the same.")
        elif float(incarceration_gap) > 0:
            lines.append(f"{group} defendants had an adjusted incarceration-to-serve rate {abs(float(incarceration_gap)):.1f} percentage points higher than White defendants.")
        else:
            lines.append(f"White defendants had an adjusted incarceration-to-serve rate {abs(float(incarceration_gap)):.1f} percentage points higher than {group} defendants.")
    length_gap = comparison.get("sentence_length_difference_percent")
    if length_gap is not None:
        if abs(float(length_gap)) < 1:
            lines.append(f"Adjusted incarceration sentence lengths for {group} and White defendants were nearly the same.")
        elif float(length_gap) > 0:
            lines.append(f"{group} defendants had adjusted incarceration sentences about {abs(float(length_gap)):.1f}% longer than White defendants.")
        else:
            lines.append(f"White defendants had adjusted incarceration sentences about {abs(float(length_gap)):.1f}% longer than {group} defendants.")
    return lines


def build_city_artifacts(validation: dict[str, Any], root: Path = ROOT) -> dict[str, Any]:
    manifest = validation["manifest"]
    records = validation["records"]
    model_results = validation["model_results"]
    city_slug = manifest["city_slug"]
    now = utc_now()
    today = now.date().isoformat()

    judge_rows: dict[str, dict[str, Any]] = {}
    for record in records:
        judge_rows.setdefault(record["judge_id"], record)

    judges: list[dict[str, Any]] = []
    judge_slug_by_id: dict[str, str] = {}
    used_slugs: set[str] = set()
    judge_metadata = manifest.get("judge_metadata") if isinstance(manifest.get("judge_metadata"), dict) else {}

    for result in model_results:
        source = judge_rows[result["judge_id"]]
        base_slug = slugify(source["judge_name"])
        slug = base_slug
        if slug in used_slugs:
            slug = f"{base_slug}-{slugify(result['judge_id'])[-8:]}"
        used_slugs.add(slug)
        judge_slug_by_id[result["judge_id"]] = slug
        comparisons = [
            {
                "group": item["group"],
                "reference": item["reference"],
                "incarcerationScore": item.get("incarceration_score"),
                "incarcerationGapPercentagePoints": item.get("incarceration_gap_percentage_points"),
                "sentenceLengthScore": item.get("sentence_length_score"),
                "sentenceLengthDifferencePercent": item.get("sentence_length_difference_percent"),
            }
            for item in result["comparison_groups"]
        ]
        highlights: list[str] = []
        if result.get("strongest_signal"):
            highlights.append(result["strongest_signal"])
        for item in result["comparison_groups"]:
            for line in describe_comparison(item):
                if line not in highlights:
                    highlights.append(line)
                if len(highlights) >= 3:
                    break
            if len(highlights) >= 3:
                break
        if result["publication_status"] != "PUBLISHED":
            highlights = [
                "CourtScope withheld the score because the publication gates were not met.",
                "Not Enough Data is not a positive or negative finding about the judge.",
            ]
        metadata = judge_metadata.get(result["judge_id"], {}) if isinstance(judge_metadata, dict) else {}
        judges.append(
            {
                "slug": slug,
                "name": source["judge_name"],
                "shortName": short_name(source["judge_name"]),
                "court": source["court"],
                "division": source["division"],
                "score": result["score"],
                "label": result["label"],
                "dataStrength": result["data_strength"],
                "caseCount": result["case_count"],
                "nextElectionYear": metadata.get("next_election_year"),
                "trend": "Not yet established",
                "confidenceInterval": [result["ci_low"], result["ci_high"]] if result["ci_low"] is not None else None,
                "incarcerationDisparityScore": result["incarceration_disparity_score"],
                "sentenceLengthDisparityScore": result["sentence_length_disparity_score"],
                "strongestSignal": result["strongest_signal"],
                "comparisonHighlights": highlights,
                "comparisonGroups": comparisons,
                "analysisWindow": f"Verified records from {result['window_start']} through {result['window_end']}.",
            }
        )

    window_start = next((result["window_start"] for result in model_results if result["window_start"]), None)
    window_end = next((result["window_end"] for result in model_results if result["window_end"]), None)
    public_cases: list[dict[str, Any]] = []
    for record in records:
        sentence_date = parse_date(record["sentence_date"])
        inside_window = bool(
            sentence_date
            and window_start
            and window_end
            and date.fromisoformat(window_start) <= sentence_date <= date.fromisoformat(window_end)
        )
        public_cases.append(
            {
                "id": f"CS-{city_slug.upper()}-{slugify(record['case_id']).upper()}",
                "publicCaseNumber": record["case_id"],
                "judgeSlug": judge_slug_by_id[record["judge_id"]],
                "court": record["court"],
                "division": record["division"],
                "disposition": record["disposition"],
                "sentenceType": "Custodial" if record["incarceration_to_serve"] else "Non-custodial",
                "sentenceLengthMonths": record["sentence_length_months"] if record["incarceration_to_serve"] else None,
                "pleaTrial": record["plea_trial"],
                "offenseGroup": record["offense_class"],
                "priorRecordBand": record["prior_record"],
                "sourceId": record["source_id"],
                "collectedAt": today,
                "verifiedAt": today,
                "includedInModel": inside_window,
                "methodologyVersion": "2.0.0",
                "qualityFlags": [],
            }
        )

    city_dir = root / "data/cities/published" / city_slug
    write_json(city_dir / "judges.json", judges)
    write_json(city_dir / "cases.json", public_cases)
    release = {
        "releaseId": f"{city_slug}-{manifest['batch_id']}",
        "citySlug": city_slug,
        "batchId": manifest["batch_id"],
        "sourceAgency": manifest["source_agency"],
        "sourceUrl": manifest["source_url"],
        "sourceId": manifest["source_id"],
        "recordCount": len(public_cases),
        "judgesPublished": sum(judge["score"] is not None for judge in judges),
        "coverageStart": manifest["coverage_start"],
        "coverageEnd": manifest["coverage_end"],
        "analysisWindowStart": window_start,
        "analysisWindowEnd": window_end,
        "methodologyVersion": "2.0.0",
        "publishedAt": now.isoformat(),
    }
    write_json(city_dir / "release.json", release)

    download_dir = root / "public/downloads" / city_slug
    download_dir.mkdir(parents=True, exist_ok=True)
    write_json(download_dir / "cases.json", public_cases)
    with (download_dir / "cases.csv").open("w", encoding="utf-8", newline="") as handle:
        fieldnames = list(public_cases[0]) if public_cases else []
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in public_cases:
            csv_row = {key: json.dumps(value) if isinstance(value, list) else value for key, value in row.items()}
            writer.writerow(csv_row)
    write_json(
        download_dir / "manifest.json",
        {
            "citySlug": city_slug,
            "published": True,
            "release": release,
            "files": ["cases.csv", "cases.json"],
            "notice": "This public projection excludes defendant names and other prohibited personal fields.",
        },
    )

    registry_path = root / "data/cities/registry.json"
    registry = read_json(registry_path)
    city_record = {
        "slug": city_slug,
        "name": manifest["city_name"],
        "county": manifest["county"],
        "state": manifest["state"],
        "status": "PUBLISHED",
        "dashboardVisible": True,
        "published": True,
        "downloadsAvailable": True,
        "dataMode": "published",
        "courts": sorted({record["court"] for record in records}),
        "coverageStart": manifest["coverage_start"],
        "coverageEnd": manifest["coverage_end"],
        "lastUpdated": today,
        "releaseId": release["releaseId"],
        "notice": "Official city data passed the completeness, privacy, identity, methodology, and release gates.",
    }
    existing = next((item for item in registry["cities"] if item["slug"] == city_slug), None)
    if existing:
        existing.update(city_record)
    else:
        registry["cities"].append(city_record)
    registry["cities"] = sorted(registry["cities"], key=lambda item: item["name"])
    write_json(registry_path, registry)
    return {"release": release, "judges": len(judges), "cases": len(public_cases)}


def move_batch(batch_path: Path, destination_root: Path, city_slug: str, batch_id: str) -> Path:
    destination = destination_root / city_slug / batch_id
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        shutil.rmtree(destination)
    shutil.move(str(batch_path), str(destination))
    return destination


def process_batch(batch_path: Path, root: Path = ROOT) -> dict[str, Any]:
    batch_path = batch_path.resolve()
    validation = validate_batch(batch_path, root)
    manifest = validation.get("manifest") or {}
    city_slug = str(manifest.get("city_slug") or batch_path.parent.name or "unknown-city")
    batch_id = str(manifest.get("batch_id") or batch_path.name)
    now = utc_now()

    if not validation["valid"]:
        destination = move_batch(batch_path, root / "data/intake/rejected", city_slug, batch_id)
        receipt = {
            "status": "REJECTED",
            "citySlug": city_slug,
            "batchId": batch_id,
            "processedAt": now.isoformat(),
            "errors": validation["errors"],
            "warnings": validation["warnings"],
        }
        write_json(destination / "processing_receipt.json", receipt)
        sync_admin_status(root)
        return receipt

    artifacts = build_city_artifacts(validation, root)
    destination = move_batch(batch_path, root / "data/intake/processed", city_slug, batch_id)
    receipt = {
        "status": "PUBLISHED",
        "citySlug": city_slug,
        "batchId": batch_id,
        "processedAt": now.isoformat(),
        "cleanupEligibleAt": (now + timedelta(days=30)).isoformat(),
        "recordCount": validation["record_count"],
        "release": artifacts["release"],
        "warnings": validation["warnings"],
    }
    write_json(destination / "processing_receipt.json", receipt)
    sync_admin_status(root)
    return receipt


def scan_receipts(root: Path, lane: str) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    lane_path = root / "data/intake" / lane
    if not lane_path.exists():
        return results
    for receipt_path in sorted(lane_path.glob("*/*/processing_receipt.json")):
        receipt = read_json(receipt_path)
        receipt["lane"] = lane
        receipt["path"] = str(receipt_path.parent.relative_to(root))
        results.append(receipt)
    return results


def sync_admin_status(root: Path = ROOT) -> dict[str, Any]:
    incoming = [path for path in (root / "data/intake/incoming").glob("*/*") if path.is_dir()]
    rejected = scan_receipts(root, "rejected")
    processed = scan_receipts(root, "processed")
    registry = read_json(root / "data/cities/registry.json")
    now = utc_now()
    cleanup_items: list[dict[str, Any]] = []
    for receipt in processed:
        eligible_at = receipt.get("cleanupEligibleAt")
        if not eligible_at:
            continue
        eligible = datetime.fromisoformat(eligible_at.replace("Z", "+00:00")) <= now
        cleanup_items.append(
            {
                "citySlug": receipt["citySlug"],
                "batchId": receipt["batchId"],
                "path": receipt["path"],
                "eligibleAt": eligible_at,
                "eligible": eligible,
                "status": "READY" if eligible else "RETAINED",
            }
        )

    status_path = root / "data/admin/city_pipeline_status.json"
    cleanup_path = root / "data/admin/cleanup_queue.json"
    status_body = {
        "summary": {
            "incoming": len(incoming),
            "rejected": len(rejected),
            "processed": len(processed),
            "publishedCities": sum(bool(city.get("published")) for city in registry["cities"]),
            "cleanupReady": sum(bool(item["eligible"]) for item in cleanup_items),
        },
        "batches": sorted(
            rejected + processed,
            key=lambda item: item.get("processedAt", ""),
            reverse=True,
        ),
    }
    previous_status = read_json(status_path) if status_path.exists() else {}
    status_changed = any(previous_status.get(key) != value for key, value in status_body.items())
    status = {"updatedAt": now.isoformat() if status_changed else previous_status.get("updatedAt", now.isoformat()), **status_body}
    if status_changed or not status_path.exists():
        write_json(status_path, status)

    cleanup_body = {"retentionDays": 30, "items": cleanup_items}
    previous_cleanup = read_json(cleanup_path) if cleanup_path.exists() else {}
    cleanup_changed = any(previous_cleanup.get(key) != value for key, value in cleanup_body.items())
    cleanup = {"updatedAt": now.isoformat() if cleanup_changed else previous_cleanup.get("updatedAt", now.isoformat()), **cleanup_body}
    if cleanup_changed or not cleanup_path.exists():
        write_json(cleanup_path, cleanup)
    return status


def cleanup_processed(root: Path = ROOT, execute: bool = False) -> dict[str, Any]:
    sync_admin_status(root)
    queue = read_json(root / "data/admin/cleanup_queue.json")
    eligible = [item for item in queue["items"] if item.get("eligible")]
    removed: list[str] = []
    if execute:
        for item in eligible:
            target = root / item["path"]
            if target.exists() and target.is_dir():
                shutil.rmtree(target)
                removed.append(item["path"])
        sync_admin_status(root)
    return {"eligible": [item["path"] for item in eligible], "removed": removed, "execute": execute}
