#!/usr/bin/env python3
"""CourtScope Phase 4 official-extract importer.
Accepts JSON ({records:[...]}) or CSV. Never fetches a portal and never bypasses access controls.
Writes immutable artifact metadata, normalized records, quarantine records and an ingestion receipt.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,re,uuid
from datetime import datetime,timezone
from pathlib import Path
REQUIRED=('case_number','court','division','sentencing_judge','disposition','sentence_date')
ALLOWED_DISPOSITIONS={'GUILTY PLEA':'GUILTY_PLEA','TRIAL CONVICTION':'TRIAL_CONVICTION','ACQUITTAL':'ACQUITTAL','DISMISSAL':'DISMISSAL','NOLLE PROSEQUI':'NOLLE_PROSEQUI','DIVERSION':'DIVERSION','TRANSFER':'TRANSFER','MERGED COUNT':'MERGED_COUNT'}

def now(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def sha256(p):
 h=hashlib.sha256();
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
 return h.hexdigest()
def load_records(p):
 if p.suffix.lower()=='.csv':
  with p.open(newline='',encoding='utf-8-sig') as f:return list(csv.DictReader(f))
 data=json.loads(p.read_text()); return data['records'] if isinstance(data,dict) and 'records' in data else data
def parse_nonneg(v,field,issues):
 if v in (None,''): return None
 try:
  n=float(v)
  if n<0: raise ValueError
  return n
 except: issues.append({'reason':'SENTENCE_CONTRADICTION','field':field,'value':v}); return None
def clean(v): return str(v).strip() if v is not None else ''
def norm_record(r,idx,artifact_id):
 issues=[]
 for k in REQUIRED:
  if not clean(r.get(k)): issues.append({'reason':'MISSING_SOURCE_PROVENANCE' if k=='case_number' else 'REQUIRED_FIELD_MISSING','field':k})
 disp=ALLOWED_DISPOSITIONS.get(clean(r.get('disposition')).upper())
 if not disp: issues.append({'reason':'UNKNOWN_DISPOSITION','field':'disposition','value':r.get('disposition')})
 case=clean(r.get('case_number'))
 if case and not re.match(r'^[A-Za-z0-9][A-Za-z0-9._/-]+$',case): issues.append({'reason':'CONFLICTING_CASE_IDENTIFIERS','field':'case_number','value':case})
 sentence={k:parse_nonneg(r.get(k),k,issues) for k in ('incarceration_months','suspended_months','probation_months')}
 if sentence['incarceration_months'] is not None and sentence['suspended_months'] is not None and sentence['suspended_months']>sentence['incarceration_months']: issues.append({'reason':'SENTENCE_CONTRADICTION','field':'suspended_months','value':sentence['suspended_months']})
 rid=f"case_{hashlib.sha256((case or str(idx)).encode()).hexdigest()[:16]}"
 normalized={'id':rid,'publicCaseNumber':case,'indictmentNumber':clean(r.get('indictment_number')) or None,'court':clean(r.get('court')),'division':clean(r.get('division')),'sentencingJudgeRaw':clean(r.get('sentencing_judge')),'judgeMatchState':'UNRESOLVED','filingDate':clean(r.get('filing_date')) or None,'dispositionDate':clean(r.get('disposition_date')) or None,'sentenceDate':clean(r.get('sentence_date')) or None,'disposition':disp,'pleaTrial':clean(r.get('plea_trial')).upper() or None,'charge':{'originalCode':clean(r.get('charge_code')) or None,'originalDescription':clean(r.get('charge_description')) or None,'offenseClass':clean(r.get('offense_class')) or None,'mappingStatus':'UNMAPPED','mappingVersion':'charge-map-0.1.0'},'sentence':sentence,'demographics':{'race':clean(r.get('race')) or None,'gender':clean(r.get('gender')) or None,'ageAtSentence':clean(r.get('age_at_sentence')) or None},'criminalHistory':{'classification':clean(r.get('prior_record_class')) or None,'availabilityStatus':'DIRECTLY_AVAILABLE' if clean(r.get('prior_record_class')) else 'NOT_AVAILABLE'},'sourceArtifactId':artifact_id,'sourceRecordLocator':f'row:{idx+1}','modelCandidate':False}
 provenance=[{'entityType':'court_case','entityId':rid,'fieldName':k,'sourceArtifactId':artifact_id,'sourceRecordLocator':f'row:{idx+1}','sourceField':k,'classification':'OBSERVED','transformationVersion':'phase4-normalizer-1.0.0'} for k in r.keys()]
 return normalized,provenance,issues

def main():
 ap=argparse.ArgumentParser(); ap.add_argument('input'); ap.add_argument('--source-id',required=True); ap.add_argument('--out',default='data/runtime/phase4'); ap.add_argument('--request-reference'); args=ap.parse_args()
 p=Path(args.input); out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
 checksum=sha256(p); artifact_id=f'art_{checksum[:20]}'; run_id=f'run_{uuid.uuid4().hex[:20]}'; started=now(); records=load_records(p)
 normalized=[]; prov=[]; quarantine=[]
 for i,r in enumerate(records):
  n,pr,issues=norm_record(r,i,artifact_id)
  if issues: quarantine.append({'id':f'q_{uuid.uuid4().hex[:16]}','sourceRecordLocator':f'row:{i+1}','reasons':issues,'rawRecord':r,'status':'OPEN'})
  else: normalized.append(n); prov.extend(pr)
 artifact={'id':artifact_id,'sourceId':args.source_id,'originalFilename':p.name,'storageKey':f'raw-official/{args.source_id}/{checksum}/{p.name}','sha256':checksum,'sizeBytes':p.stat().st_size,'retrievedAt':started,'retrievalMethod':'authorized_manual_or_records_response_import','requestReference':args.request_reference,'immutable':True}
 receipt={'id':run_id,'sourceId':args.source_id,'sourceArtifactId':artifact_id,'status':'PARTIAL_SUCCESS' if quarantine else 'SUCCESS','parserVersion':'official-extract-importer-1.0.0','schemaVersion':'phase4-1.0.0','startedAt':started,'finishedAt':now(),'rowsRead':len(records),'casesCreated':len(normalized),'casesUpdated':0,'casesUnchanged':0,'recordsQuarantined':len(quarantine),'warnings':['Judge identities remain unresolved until matched against verified historical terms.'],'rollbackReference':artifact_id}
 for name,obj in [('artifact.json',artifact),('normalized_cases.json',normalized),('provenance.json',prov),('quarantine.json',quarantine),('ingestion_receipt.json',receipt)]: (out/name).write_text(json.dumps(obj,indent=2)+"\n")
 print(json.dumps(receipt,indent=2))
 if quarantine: raise SystemExit(2)
if __name__=='__main__': main()
