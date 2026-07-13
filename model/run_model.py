#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from courtscope_model import MethodologyConfig, compute_judge_scores
from courtscope_model.sensitivity import coarsened_exact_matching_balance
from courtscope_model.validate import validate_records

parser = argparse.ArgumentParser()
parser.add_argument("input")
parser.add_argument("--out", default="data/runtime/model-run")
parser.add_argument("--version", default="2.0.0")
parser.add_argument("--analysis-end-date")
args = parser.parse_args()

input_path = Path(args.input)
rows = json.loads(input_path.read_text(encoding="utf-8"))
validation = validate_records(rows)
if not validation["valid"]:
    raise SystemExit(json.dumps(validation, indent=2))

output_path = Path(args.out)
output_path.mkdir(parents=True, exist_ok=True)
config = MethodologyConfig(version=args.version, analysis_end_date=args.analysis_end_date)
results = [result.to_dict() for result in compute_judge_scores(rows, config)]
sensitivity = coarsened_exact_matching_balance(rows)

(output_path / "score_results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
(output_path / "sensitivity.json").write_text(json.dumps(sensitivity, indent=2), encoding="utf-8")

receipt = {
    "run_id": hashlib.sha256(
        (args.input + datetime.now(timezone.utc).isoformat()).encode("utf-8")
    ).hexdigest()[:16],
    "methodology_version": args.version,
    "input": args.input,
    "input_sha256": hashlib.sha256(input_path.read_bytes()).hexdigest(),
    "records": len(rows),
    "scores_published": sum(result["publication_status"] == "PUBLISHED" for result in results),
    "scores_withheld": sum(result["publication_status"] == "WITHHELD" for result in results),
    "window_start": next((result["window_start"] for result in results if result["window_start"]), None),
    "window_end": next((result["window_end"] for result in results if result["window_end"]), None),
    "completed_at": datetime.now(timezone.utc).isoformat(),
}
(output_path / "model_receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
print(json.dumps(receipt, indent=2))
