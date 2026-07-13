#!/usr/bin/env python3
import argparse,hashlib,json,mimetypes,shutil
from datetime import datetime,timezone
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument('input');ap.add_argument('--source-id',required=True);ap.add_argument('--archive-root',default='data/local-source-archive');ap.add_argument('--request-reference');a=ap.parse_args();p=Path(a.input)
h=hashlib.sha256(p.read_bytes()).hexdigest(); dest=Path(a.archive_root)/a.source_id/h;dest.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest/p.name)
manifest={'sourceId':a.source_id,'sha256':h,'originalFilename':p.name,'archivedPath':str(dest/p.name),'mimeType':mimetypes.guess_type(p.name)[0],'sizeBytes':p.stat().st_size,'retrievedAt':datetime.now(timezone.utc).isoformat().replace('+00:00','Z'),'requestReference':a.request_reference,'immutable':True}
(dest/'manifest.json').write_text(json.dumps(manifest,indent=2)+"\n");print(json.dumps(manifest,indent=2))
