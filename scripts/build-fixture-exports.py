from __future__ import annotations
import csv, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'data/fixtures/cases.json'
out = ROOT / 'data/fixtures/exports'
out.mkdir(parents=True, exist_ok=True)
records = json.loads(source.read_text())
(out / 'cases-fixture.json').write_text(json.dumps({'classification': 'SYNTHETIC_FIXTURE', 'records': records}, indent=2) + '\n')
fields = list(records[0].keys())
with (out / 'cases-fixture.csv').open('w', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=fields)
    writer.writeheader()
    for row in records:
        writer.writerow({**row, 'qualityFlags': '|'.join(row['qualityFlags'])})
manifest = {}
for path in sorted(out.glob('cases-fixture.*')):
    manifest[path.name] = {
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'bytes': path.stat().st_size,
        'classification': 'SYNTHETIC_FIXTURE',
        'publicDownload': False,
    }
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
