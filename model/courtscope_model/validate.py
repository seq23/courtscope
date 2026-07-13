from __future__ import annotations
from typing import Any
REQUIRED={'judge_id','race','offense_class','prior_record','plea_trial','age_band','gender','incarceration_to_serve','judge_match_state'}
def validate_records(rows:list[dict[str,Any]])->dict[str,Any]:
    errors=[]
    for i,r in enumerate(rows):
        missing=sorted(REQUIRED-r.keys())
        if missing: errors.append({'row':i,'missing':missing})
    return {'valid':not errors,'errors':errors,'rows':len(rows)}
