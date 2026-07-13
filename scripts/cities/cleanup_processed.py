#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline import ROOT, cleanup_processed

parser = argparse.ArgumentParser(description="Review or remove processed city intake packages after retention.")
parser.add_argument("--root", default=str(ROOT))
parser.add_argument("--execute", action="store_true")
parser.add_argument("--confirm", default="")
args = parser.parse_args()
if args.execute and args.confirm != "DELETE_ELIGIBLE_PROCESSED_BATCHES":
    raise SystemExit("Execution requires --confirm DELETE_ELIGIBLE_PROCESSED_BATCHES")
print(json.dumps(cleanup_processed(Path(args.root).resolve(), execute=args.execute), indent=2))
