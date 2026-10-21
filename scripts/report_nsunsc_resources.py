"""Report exact source-path coverage separately from successful pointer resolution."""
import json,gzip,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
def report():
 assets=json.loads((DEST/'billboards-index.json').read_text())['assets'];lookup=collections.defaultdict(set)
 for a in assets:
  ref=a.get('sourceReference')
  if ref and ref.get('status')=='resolved' and a.get('modelReference',{}).get('status')=='resolved':lookup[(a['name'],ref['path'].replace('\\','/'))].add(a['sha256'])
 counts=collections.Counter();missing=collections.Counter()
 for p in DEST.glob('*/particle-sections.json.gz'):
  for record in json.loads(gzip.decompress(p.read_bytes()))['records']:
   for resource in record.get('resources',[]):
    ref=resource['reference']
    if ref.get('type')!='NuccChunkBillboard':continue
    matches=lookup.get((ref['name'],ref['path'].replace('\\','/')),set());counts['exact' if len(matches)==1 else 'ambiguous' if matches else 'missing']+=1
    if not matches:missing[(ref['name'],ref['path'])]+=1
 result=dict(counts=dict(counts),missing=[dict(name=n,path=p,references=c) for (n,p),c in missing.most_common()],boundary='Exact identity coverage is not source-faithful emitter simulation or proof of all texture/material dependencies.');(DEST/'particle-resource-coverage.json').write_text(json.dumps(result,indent=2));print(json.dumps(dict(counts=dict(counts),distinctMissing=len(missing))))
if __name__=='__main__':report()
