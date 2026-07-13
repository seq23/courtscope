from __future__ import annotations
from dataclasses import dataclass, asdict
from math import exp, sqrt
from collections import defaultdict
from typing import Iterable, Any

@dataclass(frozen=True)
class MethodologyConfig:
    version: str = "1.0.0"
    min_total_cases: int = 50
    min_subgroup_cases: int = 10
    max_missing_rate: float = 0.20
    max_ci_width: float = 30.0
    score_midpoint: float = 50.0
    disparity_scale: float = 14.0

@dataclass
class ScoreResult:
    judge_id: str
    score: float | None
    label: str
    data_strength: str
    case_count: int
    disparity_log_odds: float | None
    ci_low: float | None
    ci_high: float | None
    publication_status: str
    reasons: list[str]
    methodology_version: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

def _label(score: float) -> str:
    if score >= 80: return "More Fair"
    if score >= 60: return "Moderately Fair"
    return "Less than Fair"

def _strength(n: int, ci_width: float, missing: float) -> str:
    if n >= 300 and ci_width <= 12 and missing <= .05: return "Strong"
    if n >= 120 and ci_width <= 20 and missing <= .12: return "Moderate"
    return "Limited"

def publication_gate(rows: list[dict[str, Any]], config: MethodologyConfig) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if len(rows) < config.min_total_cases: reasons.append("MIN_TOTAL_CASES")
    groups = defaultdict(int)
    missing = 0
    for r in rows:
        race = r.get("race")
        if not race: missing += 1
        else: groups[str(race)] += 1
    if len(groups) < 2: reasons.append("INSUFFICIENT_RACE_GROUPS")
    if groups and min(groups.values()) < config.min_subgroup_cases: reasons.append("MIN_SUBGROUP_CASES")
    if rows and missing / len(rows) > config.max_missing_rate: reasons.append("MISSINGNESS")
    if any(r.get("judge_match_state") not in {"EXACT_VERIFIED","ALIAS_VERIFIED","DIVISION_DATE_VERIFIED","SPECIAL_ASSIGNMENT_VERIFIED"} for r in rows):
        reasons.append("JUDGE_IDENTITY")
    return (not reasons, reasons)

def _adjusted_disparity(rows: list[dict[str, Any]]) -> tuple[float, float]:
    """Deterministic transparent baseline estimator.
    Outcome is incarceration-to-serve. Adjustment uses exact strata over offense class,
    prior record, plea/trial, age band and gender. Returns log odds ratio and SE.
    """
    strata: dict[tuple, dict[str, list[int]]] = defaultdict(lambda: defaultdict(list))
    for r in rows:
        race = str(r.get("race") or "Unknown")
        key = (r.get("offense_class"), r.get("prior_record"), r.get("plea_trial"), r.get("age_band"), r.get("gender"))
        strata[key][race].append(int(bool(r.get("incarceration_to_serve"))))
    reference = "White"
    numer = denom = 0.0
    variance = 0.0
    compared = 0
    for by_race in strata.values():
        if reference not in by_race: continue
        ref = by_race[reference]
        other_values = [v for k, vals in by_race.items() if k != reference and k != "Unknown" for v in vals]
        if not other_values: continue
        a = sum(other_values) + .5; b = len(other_values)-sum(other_values)+.5
        c = sum(ref)+.5; d = len(ref)-sum(ref)+.5
        lor = __import__('math').log((a/b)/(c/d))
        w = 1.0/(1/a+1/b+1/c+1/d)
        numer += w*lor; denom += w; variance += w; compared += len(other_values)+len(ref)
    if denom == 0: return 0.0, 99.0
    return numer/denom, sqrt(1/denom)

def compute_judge_scores(records: Iterable[dict[str, Any]], config: MethodologyConfig | None = None) -> list[ScoreResult]:
    config = config or MethodologyConfig()
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in records: grouped[str(row.get("judge_id"))].append(dict(row))
    out: list[ScoreResult] = []
    for judge_id, rows in sorted(grouped.items()):
        ok, reasons = publication_gate(rows, config)
        if not ok:
            out.append(ScoreResult(judge_id,None,"Not Enough Data","Not Enough Data",len(rows),None,None,None,"WITHHELD",reasons,config.version)); continue
        disparity, se = _adjusted_disparity(rows)
        raw = 100.0/(1.0+exp((abs(disparity)-0.05)*config.disparity_scale))
        score = max(0.0,min(100.0,round(raw,1)))
        ci_span = min(49.0,1.96*se*25)
        low=max(0.0,round(score-ci_span,1)); high=min(100.0,round(score+ci_span,1))
        if high-low > config.max_ci_width:
            out.append(ScoreResult(judge_id,None,"Not Enough Data","Not Enough Data",len(rows),round(disparity,4),low,high,"WITHHELD",["UNCERTAINTY_WIDTH"],config.version)); continue
        missing=sum(1 for r in rows if not r.get("race"))/len(rows)
        out.append(ScoreResult(judge_id,score,_label(score),_strength(len(rows),high-low,missing),len(rows),round(disparity,4),low,high,"PUBLISHED",[],config.version))
    return out
