#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import shutil
import tempfile
from pathlib import Path

from pipeline import process_batch, read_json, write_json

source_root = Path(__file__).resolve().parents[2]
with tempfile.TemporaryDirectory(prefix="courtscope-city-test-") as temp_dir:
    root = Path(temp_dir)
    for relative in [
        "data/cities",
        "data/admin",
        "data/intake/incoming/test-city/test-batch",
        "data/intake/processed",
        "data/intake/rejected",
        "data/cities/published",
        "public/downloads",
    ]:
        (root / relative).mkdir(parents=True, exist_ok=True)
    shutil.copy(source_root / "data/cities/completeness_contract.json", root / "data/cities/completeness_contract.json")
    write_json(root / "data/cities/registry.json", {"version": "1.0.0", "cities": []})

    batch = root / "data/intake/incoming/test-city/test-batch"
    manifest = {
        "city_slug": "test-city",
        "city_name": "Test City",
        "county": "Test County",
        "state": "Test State",
        "batch_id": "test-batch",
        "source_agency": "Official Test Court",
        "source_url": "https://example.gov/courts",
        "source_id": "test-court-export",
        "data_file": "cases.csv",
        "data_dictionary_file": "data-dictionary.txt",
        "coverage_start": "2018-01-01",
        "coverage_end": "2025-12-31",
        "checks": {check: True for check in read_json(source_root / "data/cities/completeness_contract.json")["required_manifest_checks"]},
    }
    write_json(batch / "manifest.json", manifest)
    (batch / "data-dictionary.txt").write_text("Field definitions for the synthetic pipeline test.\n", encoding="utf-8")

    model_rows = read_json(source_root / "data/fixtures/model_records.json")
    names = {"judge-alpha": "Alex Alpha", "judge-beta": "Bailey Beta", "judge-gamma": "Gray Gamma", "judge-delta": "Dana Delta"}
    records = []
    for row in model_rows:
        records.append({
            "case_id": row["record_id"],
            "court": row["court"],
            "division": row["division"],
            "judge_id": row["judge_id"],
            "judge_name": names[row["judge_id"]],
            "judge_match_state": row["judge_match_state"],
            "race": row["race"],
            "offense_class": row["offense_class"],
            "prior_record": row["prior_record"],
            "plea_trial": row["plea_trial"],
            "age_band": row["age_band"],
            "gender": row["gender"],
            "disposition": "Guilty plea" if row["plea_trial"] == "Plea" else "Trial conviction",
            "sentence_date": row["sentence_date"],
            "incarceration_to_serve": row["incarceration_to_serve"],
            "sentence_length_months": row["sentence_length_months"],
            "source_id": "test-court-export",
        })
    with (batch / "cases.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(records[0]))
        writer.writeheader()
        writer.writerows(records)

    receipt = process_batch(batch, root)
    assert receipt["status"] == "PUBLISHED", receipt
    registry = read_json(root / "data/cities/registry.json")
    assert registry["cities"][0]["published"] is True
    assert (root / "data/cities/published/test-city/judges.json").exists()
    assert (root / "public/downloads/test-city/cases.csv").exists()
    assert not batch.exists()
    assert (root / "data/intake/processed/test-city/test-batch/processing_receipt.json").exists()

    rejected = root / "data/intake/incoming/bad-city/bad-batch"
    rejected.mkdir(parents=True)
    bad_manifest = dict(manifest)
    bad_manifest.update({"city_slug": "bad-city", "city_name": "Bad City", "batch_id": "bad-batch"})
    bad_manifest["checks"] = dict(manifest["checks"])
    bad_manifest["checks"]["privacy_review_passed"] = False
    write_json(rejected / "manifest.json", bad_manifest)
    (rejected / "data-dictionary.txt").write_text("dictionary", encoding="utf-8")
    shutil.copy(root / "data/intake/processed/test-city/test-batch/cases.csv", rejected / "cases.csv")
    rejected_receipt = process_batch(rejected, root)
    assert rejected_receipt["status"] == "REJECTED"
    assert any("privacy_review_passed" in error for error in rejected_receipt["errors"])
    assert not (root / "data/cities/published/bad-city").exists()

print("CourtScope city intake, rejection, publication, and retention-lane tests passed.")
