#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline import ROOT, process_batch

parser = argparse.ArgumentParser(description="Validate and publish one complete, privacy-safe city data batch.")
parser.add_argument("batch_path", help="Path to data/intake/incoming/<city>/<batch>/")
parser.add_argument("--root", default=str(ROOT))
args = parser.parse_args()
receipt = process_batch(Path(args.batch_path), Path(args.root).resolve())
print(json.dumps(receipt, indent=2))
raise SystemExit(0 if receipt["status"] == "PUBLISHED" else 2)
