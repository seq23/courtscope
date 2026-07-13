#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from pipeline import ROOT, sync_admin_status

parser = argparse.ArgumentParser()
parser.add_argument("--root", default=str(ROOT))
args = parser.parse_args()
print(json.dumps(sync_admin_status(Path(args.root).resolve()), indent=2))
