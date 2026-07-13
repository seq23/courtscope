from __future__ import annotations

from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import date, datetime
from hashlib import sha256
from math import exp, log1p
from random import Random
from typing import Any, Iterable

CONTROL_FIELDS = (
    "offense_class",
    "prior_record",
    "plea_trial",
    "age_band",
    "gender",
)

VALID_JUDGE_MATCH_STATES = {
    "EXACT_VERIFIED",
    "ALIAS_VERIFIED",
    "DIVISION_DATE_VERIFIED",
    "SPECIAL_ASSIGNMENT_VERIFIED",
}


@dataclass(frozen=True)
class MethodologyConfig:
    version: str = "2.0.0"
    min_total_cases: int = 50
    min_subgroup_cases: int = 10
    max_missing_rate: float = 0.20
    max_uncertainty_width: float = 45.0
    lookback_years: int = 8
    analysis_end_date: str | None = None
    bootstrap_samples: int = 120
    random_seed: int = 20260713
    incarceration_scale: float = 250.0
    sentence_length_scale: float = 100.0


@dataclass
class ScoreResult:
    judge_id: str
    score: float | None
    label: str
    data_strength: str
    case_count: int
    incarceration_disparity_score: float | None
    sentence_length_disparity_score: float | None
    strongest_signal: str | None
    comparison_groups: list[dict[str, Any]]
    ci_low: float | None
    ci_high: float | None
    window_start: str | None
    window_end: str | None
    publication_status: str
    reasons: list[str]
    methodology_version: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def disparity_label(score: float) -> str:
    if score < 30:
        return "Smaller racial gaps"
    if score < 60:
        return "Moderate racial gaps"
    return "Bigger racial gaps"


def _parse_date(value: Any) -> date | None:
    if value in (None, ""):
        return None
    try:
        return datetime.fromisoformat(str(value)[:10]).date()
    except ValueError:
        return None


def _years_before(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year - years)
    except ValueError:
        return value.replace(year=value.year - years, day=28)


def analysis_window(
    records: list[dict[str, Any]], config: MethodologyConfig
) -> tuple[date | None, date | None]:
    dates = [parsed for row in records if (parsed := _parse_date(row.get("sentence_date")))]
    if not dates:
        return None, None
    end = _parse_date(config.analysis_end_date) if config.analysis_end_date else max(dates)
    if end is None:
        return None, None
    return _years_before(end, config.lookback_years), end


def _inside_window(row: dict[str, Any], start: date, end: date) -> bool:
    sentence_date = _parse_date(row.get("sentence_date"))
    return sentence_date is not None and start <= sentence_date <= end


def publication_gate(
    rows: list[dict[str, Any]], config: MethodologyConfig
) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if len(rows) < config.min_total_cases:
        reasons.append("MIN_TOTAL_CASES")

    counts: dict[str, int] = defaultdict(int)
    missing_race = 0
    for row in rows:
        race = str(row.get("race") or "").strip()
        if not race or race == "Unknown":
            missing_race += 1
        else:
            counts[race] += 1

    if counts.get("White", 0) < config.min_subgroup_cases:
        reasons.append("WHITE_REFERENCE_TOO_SMALL")
    if not any(
        race != "White" and count >= config.min_subgroup_cases
        for race, count in counts.items()
    ):
        reasons.append("NO_SUPPORTED_COMPARISON_GROUP")
    if rows and missing_race / len(rows) > config.max_missing_rate:
        reasons.append("MISSING_RACE_RATE")

    if any(row.get("judge_match_state") not in VALID_JUDGE_MATCH_STATES for row in rows):
        reasons.append("JUDGE_IDENTITY_UNVERIFIED")
    if any(_parse_date(row.get("sentence_date")) is None for row in rows):
        reasons.append("MISSING_SENTENCE_DATE")
    if any(
        bool(row.get("incarceration_to_serve"))
        and (
            row.get("sentence_length_months") in (None, "")
            or float(row.get("sentence_length_months", 0)) <= 0
        )
        for row in rows
    ):
        reasons.append("MISSING_CUSTODIAL_SENTENCE_LENGTH")

    return not reasons, sorted(set(reasons))


def _solve_linear_system(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(vector)
    augmented = [list(map(float, matrix[row])) + [float(vector[row])] for row in range(size)]

    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        if abs(augmented[pivot][column]) < 1e-12:
            continue
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        divisor = augmented[column][column]
        augmented[column] = [value / divisor for value in augmented[column]]

        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            if abs(factor) < 1e-15:
                continue
            augmented[row] = [
                augmented[row][index] - factor * augmented[column][index]
                for index in range(size + 1)
            ]

    return [augmented[index][size] for index in range(size)]


def _control_features(rows: list[dict[str, Any]]) -> list[tuple[str, str]]:
    features: list[tuple[str, str]] = []
    for field in CONTROL_FIELDS:
        categories = sorted({str(row.get(field) or "Unknown") for row in rows})
        # The first sorted category is the reference category. All others become indicators.
        features.extend((field, category) for category in categories[1:])
    return features


def _adjusted_residuals(
    rows: list[dict[str, Any]], outcome: str
) -> dict[str, list[float]]:
    if outcome == "incarceration":
        usable = [row for row in rows if row.get("incarceration_to_serve") is not None]
        values = [float(bool(row.get("incarceration_to_serve"))) for row in usable]
    elif outcome == "sentence_length":
        usable = [
            row
            for row in rows
            if bool(row.get("incarceration_to_serve"))
            and row.get("sentence_length_months") not in (None, "")
            and float(row.get("sentence_length_months", 0)) > 0
        ]
        values = [log1p(float(row["sentence_length_months"])) for row in usable]
    else:
        raise ValueError(f"Unknown outcome: {outcome}")

    if not usable:
        return {}

    features = _control_features(usable)
    width = 1 + len(features)
    xtx = [[0.0 for _ in range(width)] for _ in range(width)]
    xty = [0.0 for _ in range(width)]
    designs: list[list[float]] = []

    for row, value in zip(usable, values):
        design = [1.0] + [
            1.0 if str(row.get(field) or "Unknown") == category else 0.0
            for field, category in features
        ]
        designs.append(design)
        for left in range(width):
            xty[left] += design[left] * value
            for right in range(width):
                xtx[left][right] += design[left] * design[right]

    # A tiny ridge term stabilizes sparse categorical combinations without changing the model's job.
    for index in range(1, width):
        xtx[index][index] += 1e-6

    coefficients = _solve_linear_system(xtx, xty)
    residuals: dict[str, list[float]] = defaultdict(list)
    for row, value, design in zip(usable, values, designs):
        prediction = sum(weight * coefficient for weight, coefficient in zip(design, coefficients))
        residuals[str(row.get("race") or "Unknown")].append(value - prediction)
    return dict(residuals)


def _mean(values: list[float]) -> float:
    return sum(values) / len(values)


def _outcome_comparisons(
    rows: list[dict[str, Any]], outcome: str, config: MethodologyConfig
) -> dict[str, dict[str, Any]]:
    residuals = _adjusted_residuals(rows, outcome)
    white = residuals.get("White", [])
    if len(white) < config.min_subgroup_cases:
        return {}

    comparisons: dict[str, dict[str, Any]] = {}
    for group in sorted(residuals):
        if group in {"White", "Unknown"}:
            continue
        group_values = residuals[group]
        if len(group_values) < config.min_subgroup_cases:
            continue

        residual_gap = _mean(group_values) - _mean(white)
        if outcome == "incarceration":
            signed_gap = residual_gap
            display_gap = round(signed_gap * 100, 1)
            score = min(100.0, round(abs(signed_gap) * config.incarceration_scale, 1))
        else:
            signed_gap = exp(residual_gap) - 1.0
            display_gap = round(signed_gap * 100, 1)
            score = min(100.0, round(abs(signed_gap) * config.sentence_length_scale, 1))

        comparisons[group] = {
            "score": score,
            "signed_gap": round(signed_gap, 6),
            "display_gap": display_gap,
            "group_cases": len(group_values),
            "white_cases": len(white),
        }
    return comparisons


def _component_analysis(
    rows: list[dict[str, Any]], config: MethodologyConfig
) -> tuple[float | None, float | None, list[dict[str, Any]], tuple[str, str, float, float] | None]:
    incarceration = _outcome_comparisons(rows, "incarceration", config)
    sentence_length = _outcome_comparisons(rows, "sentence_length", config)
    groups = sorted(set(incarceration) | set(sentence_length))
    comparisons: list[dict[str, Any]] = []
    signals: list[tuple[str, str, float, float]] = []

    for group in groups:
        inc = incarceration.get(group)
        length = sentence_length.get(group)
        comparisons.append(
            {
                "group": group,
                "reference": "White",
                "incarceration_score": inc["score"] if inc else None,
                "incarceration_gap_percentage_points": inc["display_gap"] if inc else None,
                "incarceration_group_cases": inc["group_cases"] if inc else 0,
                "incarceration_white_cases": inc["white_cases"] if inc else 0,
                "sentence_length_score": length["score"] if length else None,
                "sentence_length_difference_percent": length["display_gap"] if length else None,
                "sentence_length_group_cases": length["group_cases"] if length else 0,
                "sentence_length_white_cases": length["white_cases"] if length else 0,
            }
        )
        if inc:
            signals.append(("incarceration", group, float(inc["signed_gap"]), float(inc["score"])))
        if length:
            signals.append(("sentence_length", group, float(length["signed_gap"]), float(length["score"])))

    inc_score = max((item["score"] for item in incarceration.values()), default=None)
    length_score = max((item["score"] for item in sentence_length.values()), default=None)
    strongest = max(signals, key=lambda item: item[3], default=None)
    return inc_score, length_score, comparisons, strongest


def _strongest_signal_text(signal: tuple[str, str, float, float] | None) -> str | None:
    if signal is None:
        return None
    outcome, group, signed_gap, _score = signal
    if outcome == "incarceration":
        if signed_gap > 0:
            return f"{group} defendants had the higher adjusted incarceration-to-serve rate in the comparison with White defendants."
        if signed_gap < 0:
            return f"White defendants had the higher adjusted incarceration-to-serve rate in the comparison with {group} defendants."
        return f"The adjusted incarceration-to-serve rates for {group} and White defendants were nearly the same."
    if signed_gap > 0:
        return f"{group} defendants had the longer adjusted incarceration sentences in the comparison with White defendants."
    if signed_gap < 0:
        return f"White defendants had the longer adjusted incarceration sentences in the comparison with {group} defendants."
    return f"The adjusted incarceration sentence lengths for {group} and White defendants were nearly the same."


def _quantile(values: list[float], probability: float) -> float:
    if not values:
        raise ValueError("Cannot calculate a quantile from an empty list")
    ordered = sorted(values)
    position = (len(ordered) - 1) * probability
    lower = int(position)
    upper = min(lower + 1, len(ordered) - 1)
    fraction = position - lower
    return ordered[lower] * (1 - fraction) + ordered[upper] * fraction


def _bootstrap_interval(
    judge_id: str, rows: list[dict[str, Any]], config: MethodologyConfig
) -> tuple[float | None, float | None]:
    if config.bootstrap_samples <= 0 or len(rows) < config.min_total_cases:
        return None, None

    seed_material = f"{config.random_seed}:{config.version}:{judge_id}".encode("utf-8")
    seed = int(sha256(seed_material).hexdigest()[:16], 16)
    randomizer = Random(seed)
    estimates: list[float] = []

    for _ in range(config.bootstrap_samples):
        sample = [rows[randomizer.randrange(len(rows))] for _ in range(len(rows))]
        inc_score, length_score, _comparisons, _strongest = _component_analysis(sample, config)
        if inc_score is None or length_score is None:
            continue
        estimates.append(max(inc_score, length_score))

    if len(estimates) < max(30, config.bootstrap_samples // 3):
        return None, None
    return round(_quantile(estimates, 0.025), 1), round(_quantile(estimates, 0.975), 1)


def _data_strength(case_count: int, uncertainty_width: float) -> str:
    if case_count >= 300 and uncertainty_width <= 20:
        return "Strong"
    if case_count >= 120 and uncertainty_width <= 35:
        return "Moderate"
    return "Limited"


def _withheld(
    judge_id: str,
    case_count: int,
    start: date | None,
    end: date | None,
    reasons: list[str],
    config: MethodologyConfig,
    incarceration_score: float | None = None,
    sentence_length_score: float | None = None,
    comparisons: list[dict[str, Any]] | None = None,
    ci_low: float | None = None,
    ci_high: float | None = None,
) -> ScoreResult:
    return ScoreResult(
        judge_id=judge_id,
        score=None,
        label="Not Enough Data",
        data_strength="Not Enough Data",
        case_count=case_count,
        incarceration_disparity_score=incarceration_score,
        sentence_length_disparity_score=sentence_length_score,
        strongest_signal=None,
        comparison_groups=comparisons or [],
        ci_low=ci_low,
        ci_high=ci_high,
        window_start=start.isoformat() if start else None,
        window_end=end.isoformat() if end else None,
        publication_status="WITHHELD",
        reasons=sorted(set(reasons)),
        methodology_version=config.version,
    )


def compute_judge_scores(
    records: Iterable[dict[str, Any]], config: MethodologyConfig | None = None
) -> list[ScoreResult]:
    config = config or MethodologyConfig()
    all_rows = [dict(record) for record in records]
    start, end = analysis_window(all_rows, config)
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in all_rows:
        grouped[str(row.get("judge_id") or "")].append(row)

    results: list[ScoreResult] = []
    for judge_id, judge_rows in sorted(grouped.items()):
        if not judge_id:
            continue
        if start is None or end is None:
            results.append(_withheld(judge_id, 0, start, end, ["NO_ANALYSIS_WINDOW"], config))
            continue

        rows = [row for row in judge_rows if _inside_window(row, start, end)]
        gate_ok, reasons = publication_gate(rows, config)
        if not gate_ok:
            results.append(_withheld(judge_id, len(rows), start, end, reasons, config))
            continue

        inc_score, length_score, comparisons, strongest = _component_analysis(rows, config)
        if inc_score is None:
            reasons.append("NO_SUPPORTED_INCARCERATION_COMPARISON")
        if length_score is None:
            reasons.append("NO_SUPPORTED_SENTENCE_LENGTH_COMPARISON")
        if reasons:
            results.append(
                _withheld(
                    judge_id,
                    len(rows),
                    start,
                    end,
                    reasons,
                    config,
                    inc_score,
                    length_score,
                    comparisons,
                )
            )
            continue

        score = round(max(float(inc_score), float(length_score)), 1)
        ci_low, ci_high = _bootstrap_interval(judge_id, rows, config)
        if ci_low is None or ci_high is None:
            results.append(
                _withheld(
                    judge_id,
                    len(rows),
                    start,
                    end,
                    ["UNCERTAINTY_ESTIMATE_UNAVAILABLE"],
                    config,
                    inc_score,
                    length_score,
                    comparisons,
                )
            )
            continue

        uncertainty_width = ci_high - ci_low
        if uncertainty_width > config.max_uncertainty_width:
            results.append(
                _withheld(
                    judge_id,
                    len(rows),
                    start,
                    end,
                    ["UNCERTAINTY_WIDTH"],
                    config,
                    inc_score,
                    length_score,
                    comparisons,
                    ci_low,
                    ci_high,
                )
            )
            continue

        results.append(
            ScoreResult(
                judge_id=judge_id,
                score=score,
                label=disparity_label(score),
                data_strength=_data_strength(len(rows), uncertainty_width),
                case_count=len(rows),
                incarceration_disparity_score=round(float(inc_score), 1),
                sentence_length_disparity_score=round(float(length_score), 1),
                strongest_signal=_strongest_signal_text(strongest),
                comparison_groups=comparisons,
                ci_low=ci_low,
                ci_high=ci_high,
                window_start=start.isoformat(),
                window_end=end.isoformat(),
                publication_status="PUBLISHED",
                reasons=[],
                methodology_version=config.version,
            )
        )

    return results
