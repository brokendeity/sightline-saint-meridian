"""Resolve final cut-in sprite resources by exact archive member and texture name."""
import json,gzip,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/nsunsc-library'
def main():
 table=json.loads((DEST/'finisher-variants.json').read_text());indices=collections.defaultdict(list)
 for p in DEST.glob('*/index.json'):
  r=json.loads(p.read_text());indices[Path(r['path']).name.removesuffix('.xfbin')].append(r)
 pairs={};cache={}
 for record in table['records']:
  for g in record['groups']:
   if not g['file'] or not g['resourceName']:continue
   key=(Path(g['file'].replace('\\','/')).name.removesuffix('.xfbin'),g['resourceName']);item=pairs.setdefault(key,dict(file=g['file'],resourceName=g['resourceName'],selectors=[],textures=[]))
   item['selectors'].append(dict(row=record['rowIndex'],headers=record['headers'],group=g['groupIndex'],targetIdentity=g['targetIdentity'],flag=g['flag']))
 for (filename,name),item in pairs.items():
  for r in indices.get(filename,[]):
   if r.get('status')!='extracted':continue
   if r['key'] not in cache:cache[r['key']]=json.loads(gzip.decompress((ROOT/r['scene']).read_bytes()))
   for texture in cache[r['key']]['textures']:
    if texture['name']==name:item['textures'].append(dict(**texture,bundle=r['key'],sourceArchive=r['archive'],sourceMember=r['path'],sourceSha256=r['sha256']))
  item['status']='resolved image' if len(item['textures'])==1 else 'multiple source variants' if item['textures'] else 'unresolved image'
 result=dict(version=1,items=list(pairs.values()),stats=dict(uniquePairs=len(pairs),resolved=sum(i['status']=='resolved image' for i in pairs.values()),unresolved=sum(i['status']=='unresolved image' for i in pairs.values()),multiple=sum(i['status']=='multiple source variants' for i in pairs.values())),source='assets/nsunsc-library/finisher-variants.json',boundary='Verified victim/context-selected final cut-in images, not animation phases or invented cinematic ordering.');(DEST/'cutin-catalog.json').write_text(json.dumps(result,separators=(',',':')));print(result['stats'])
if __name__=='__main__':main()
