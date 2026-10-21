"""Candidate-only role banks with source pelvis motion; older banks stay intact."""
import gzip,hashlib,json
from pathlib import Path
from build_forspoken_backspool_pilot import retarget
from build_backspool_source_movement import compact
ROOT=Path(__file__).resolve().parents[1]
NAMES=['traversal-flow-roles','traversal-locomotion-roles','traversal-ladder-roles','traversal-crouch-roles','traversal-advanced-source-roles']
def main():
 entries=json.loads((ROOT/'output/rea-forspoken/movement-source-tracks/manifest.json').read_text())['clips'];source={e['animationId']:e for e in entries};out=ROOT/'assets/backspool/source-contact-v4';out.mkdir(exist_ok=True);cache={}
 for name in NAMES:
  m=json.loads((ROOT/'assets/backspool'/(name+'.json')).read_text())
  for r in m['roles']:
   ident=r['sourceAnimationId']
   if ident not in cache:
    data=compact(retarget(json.loads(Path(source[ident]['output']).read_text()),preserve_pelvis=True));p=out/(ident[2:]+'.json.gz');p.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0));cache[ident]=dict(url=p.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest())
   r.update(**cache[ident],pelvisTranslation=True)

  m.update(pelvisTranslation=True,rootTravelApplied=False,origin='Recovered source rotations plus normalized C_Hip motion; gameplay role semantics remain authored')
  (ROOT/'assets/backspool'/(name+'-contact-v4.json')).write_text(json.dumps(m,indent=2)+'\n')
 print('Exported',len(cache),'isolated contact-motion clips across',len(NAMES),'role banks')
if __name__=='__main__':main()
