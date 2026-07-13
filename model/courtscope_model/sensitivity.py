from __future__ import annotations
from collections import defaultdict
from typing import Any

def coarsened_exact_matching_balance(rows: list[dict[str, Any]]) -> dict[str, Any]:
    strata=defaultdict(lambda: defaultdict(int))
    for r in rows:
        key=(r.get('offense_class'),r.get('prior_record'),r.get('plea_trial'),r.get('age_band'),r.get('gender'))
        strata[key][str(r.get('race') or 'Unknown')]+=1
    usable={str(k):v for k,v in strata.items() if len([g for g in v if g!='Unknown'])>=2}
    retained=sum(sum(v.values()) for v in usable.values())
    return {'method':'coarsened_exact_matching','strata_total':len(strata),'strata_usable':len(usable),'records_retained':retained,'retention_rate':retained/len(rows) if rows else 0}
