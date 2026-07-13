#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from courtscope_model import MethodologyConfig, compute_judge_scores

rows = json.loads(Path("data/fixtures/model_records.json").read_text(encoding="utf-8"))
results = {
    result.judge_id: result
    for result in compute_judge_scores(
        rows,
        MethodologyConfig(version="2.0.0-test", bootstrap_samples=80),
    )
}

assert results["judge-alpha"].publication_status == "PUBLISHED"
assert results["judge-alpha"].score is not None and results["judge-alpha"].score < 30
assert results["judge-beta"].score is not None and 30 <= results["judge-beta"].score < 60
assert results["judge-gamma"].score is not None and results["judge-gamma"].score >= 60
assert results["judge-delta"].publication_status == "WITHHELD"
assert "MIN_TOTAL_CASES" in results["judge-delta"].reasons

published = [result for result in results.values() if result.publication_status == "PUBLISHED"]
assert len({result.window_start for result in published}) == 1
assert len({result.window_end for result in published}) == 1
assert all(result.incarceration_disparity_score is not None for result in published)
assert all(result.sentence_length_disparity_score is not None for result in published)
assert all(result.score == max(result.incarceration_disparity_score, result.sentence_length_disparity_score) for result in published)
assert all(result.comparison_groups for result in published)
assert all(
    comparison["group"] != "Minority"
    for result in published
    for comparison in result.comparison_groups
)
assert any(
    comparison["incarceration_gap_percentage_points"] is not None
    for result in published
    for comparison in result.comparison_groups
)
assert any(
    comparison["sentence_length_difference_percent"] is not None
    for result in published
    for comparison in result.comparison_groups
)

print("CourtScope methodology v2 deterministic tests passed.")
