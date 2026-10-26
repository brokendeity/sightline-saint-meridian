"""Keep exact large native fingerprints in lossless archives with small indexes."""
from pathlib import Path
import json,gzip,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda b:hashlib.sha256(b).hexdigest()
files=[D/'V02_Visual_Candidate_Native.json',*sorted((D/'evidence/fixed-defects/visual-study').glob('*.json'))]
for file in files:
 raw=file.read_bytes();report=json.loads(raw)
 if 'fullEvidence'in report or not('before'in report or'after'in report):continue
 archive=file.with_name(file.stem+'.full.json.gz');compressed=gzip.compress(raw,mtime=0);archive.write_bytes(compressed);assert gzip.decompress(compressed)==raw
 def fingerprint(state):
  return{'buildings':len(state['buildings']),'geometryTransformsAndCompoundPartsSHA256':sha(json.dumps(state['buildings'],sort_keys=True,separators=(',',':')).encode()),**{k:v for k,v in state.items()if k!='buildings'}}
 summary={k:v for k,v in report.items()if k not in['before','after']}
 for key in['before','after']:
  if key in report:summary[key+'Fingerprint']=fingerprint(report[key])
 summary['originalStatePreserved']=report['before']==report['after']if'before'in report and'after'in report else None
 summary['fullEvidence']={'file':archive.name,'sha256':sha(compressed),'rawSHA256':sha(raw),'scope':'Exact original native JSON bytes, including every original source geometry hash, transform and compound collision part. No failed evidence discarded.'};file.write_text(json.dumps(summary,indent=2)+'\n');print(file.name,len(raw),'->',file.stat().st_size,'index +',len(compressed),'archive bytes')
