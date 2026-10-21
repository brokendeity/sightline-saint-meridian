"""Integration regression: rebuilding metadata must preserve identity-bound extensions."""
import gzip,json,hashlib,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
def snapshots(pattern,fields):
 result={}
 for p in DEST.glob(pattern):
  data=json.loads(gzip.decompress(p.read_bytes()))
  for r in data['records']:
   value={k:r[k] for k in fields if k in r};result[(p.parent.name,r['name'],r['sha256'])]=hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()
 return result
if __name__=='__main__':
 fields=['references','resources','emissionEvents','generatorConfigs','eventGeneratorCountMatches'];before=snapshots('*/particle-sections.json.gz',fields);billboards=snapshots('*/billboards.json.gz',['modelReference','sourceReference'])
 for script in ['decode_nsunsc_particle_sections.py','decode_nsunsc_billboards.py']:subprocess.run([sys.executable,str(ROOT/'scripts'/script)],cwd=ROOT,check=True)
 assert before==snapshots('*/particle-sections.json.gz',fields),'particle extensions changed during rebuild'
 assert billboards==snapshots('*/billboards.json.gz',['modelReference','sourceReference']),'billboard source identities changed during rebuild'
 print(f'Preserved {len(before)} particle records and {len(billboards)} billboard identities through metadata rebuilds.')
