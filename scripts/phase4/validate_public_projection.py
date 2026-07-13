#!/usr/bin/env python3
import json,sys
from pathlib import Path
PROHIBITED={'defendant_name','name','date_of_birth','dob','street_address','booking_photo','email','phone','raw_person_identifier'}
def walk(v,path='root'):
 if isinstance(v,dict):
  for k,x in v.items():
   if k.lower() in PROHIBITED and x not in (None,''): raise ValueError(f'prohibited public field at {path}.{k}')
   walk(x,f'{path}.{k}')
 elif isinstance(v,list):
  for i,x in enumerate(v): walk(x,f'{path}[{i}]')
for f in sys.argv[1:]: walk(json.loads(Path(f).read_text()))
print('Public projection privacy validation passed.')
