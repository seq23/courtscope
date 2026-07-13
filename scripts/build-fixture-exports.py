from __future__ import annotations
import csv, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'data/fixtures/cases.json'; out=ROOT/'public/downloads'; out.mkdir(parents=True,exist_ok=True)
records=json.loads(source.read_text())
(out/'cases-fixture.json').write_text(json.dumps({"classification":"SYNTHETIC_FIXTURE","records":records},indent=2)+"\n")
fields=list(records[0].keys())
with (out/'cases-fixture.csv').open('w',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields); w.writeheader();
    for row in records: w.writerow({**row,'qualityFlags':'|'.join(row['qualityFlags'])})
try:
    import pyarrow as pa, pyarrow.parquet as pq
    pq.write_table(pa.Table.from_pylist(records),out/'cases-fixture.parquet')
except Exception:
    # Deterministic marker prevents a fake Parquet claim when pyarrow is unavailable.
    (out/'cases-fixture.parquet').write_bytes(b'COURTSCOPE_FIXTURE_PARQUET_REQUIRES_PYARROW\n')
manifest={}
for p in sorted(out.glob('cases-fixture.*')): manifest[p.name]={"sha256":hashlib.sha256(p.read_bytes()).hexdigest(),"bytes":p.stat().st_size,"classification":"SYNTHETIC_FIXTURE"}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+"\n")
