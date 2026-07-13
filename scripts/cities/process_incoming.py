#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline import ROOT, process_batch, sync_admin_status

parser = argparse.ArgumentParser(description="Process all complete city batches in the incoming lane.")
parser.add_argument("--root", default=str(ROOT))
args = parser.parse_args()
root = Path(args.root).resolve()
receipts = []
for batch in sorted((root / "data/intake/incoming").glob("*/*")):
    if batch.is_dir():
        receipts.append(process_batch(batch, root))
status = sync_admin_status(root)
print(json.dumps({"receipts": receipts, "status": status["summary"]}, indent=2))
# Rejected batches are isolated exceptions, not repository-wide failures.
# The rejection receipt and admin status carry the outcome while other batches continue.
raise SystemExit(0)
