#!/usr/bin/env python3
import argparse,json,hashlib
from pathlib import Path
from datetime import datetime,timezone
from courtscope_model import MethodologyConfig,compute_judge_scores
from courtscope_model.validate import validate_records
from courtscope_model.sensitivity import coarsened_exact_matching_balance
p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('--out',default='data/runtime/model-run');p.add_argument('--version',default='1.0.0');a=p.parse_args()
rows=json.loads(Path(a.input).read_text())
val=validate_records(rows)
if not val['valid']: raise SystemExit(json.dumps(val,indent=2))
out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
results=[r.to_dict() for r in compute_judge_scores(rows,MethodologyConfig(version=a.version))]
sensitivity=coarsened_exact_matching_balance(rows)
(out/'score_results.json').write_text(json.dumps(results,indent=2))
(out/'sensitivity.json').write_text(json.dumps(sensitivity,indent=2))
receipt={'run_id':hashlib.sha256((a.input+datetime.now(timezone.utc).isoformat()).encode()).hexdigest()[:16],'methodology_version':a.version,'input':a.input,'input_sha256':hashlib.sha256(Path(a.input).read_bytes()).hexdigest(),'records':len(rows),'scores_published':sum(r['publication_status']=='PUBLISHED' for r in results),'scores_withheld':sum(r['publication_status']=='WITHHELD' for r in results),'completed_at':datetime.now(timezone.utc).isoformat()}
(out/'model_receipt.json').write_text(json.dumps(receipt,indent=2))
print(json.dumps(receipt,indent=2))
