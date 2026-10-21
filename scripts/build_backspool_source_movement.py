"""Retarget the recovered movement inventory without changing active gameplay.
Every output retains source identity; role selection and physical movement are separate.
"""
import argparse,gzip,hashlib,json,time
from pathlib import Path
from build_forspoken_backspool_pilot import retarget
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'output/rea-forspoken/movement-source-tracks';DEST=ROOT/'assets/backspool/source-movement'
def compact(clip):
 for tr in clip['tracks']:
  stride=4 if tr['type']=='quaternion' else 3;first=tr['values'][:stride]
  if all(abs(x-first[i%stride])<1e-10 for i,x in enumerate(tr['values'])):
   tr['times']=[0,clip['duration']];tr['values']=first*2
 return clip

def main(ids=None):
 DEST.mkdir(exist_ok=True);manifest=json.loads((SOURCE/'manifest.json').read_text());selected=[e for e in manifest['clips'] if not ids or e['animationId'].removeprefix('0x') in ids];results=[]
 if ids and len(selected)!=len(ids):raise ValueError('Unknown or duplicate source IDs')
 for i,entry in enumerate(selected):
  source=json.loads(Path(entry['output']).read_text());id=source['animationId'].removeprefix('0x');clip=compact(retarget(source));clip['name']='source-movement-'+id
  clip['userData'].update(sourcePack=source['sourcePack'],sourceDurationSeconds=source['durationSeconds'],sourcePoseRuleRecovered=True,semanticRole='unassigned; role validation required')
  p=DEST/(id+'.json.gz');p.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0));results.append(dict(id=id,url=p.relative_to(ROOT).as_posix(),duration=clip['duration'],sourcePack=source['sourcePack'],sourceSha256=source['sourceSha256'],sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bytes=p.stat().st_size))
  if i%25==0:print(f'{i+1}/{len(selected)} retargeted',flush=True)
 name='manifest.json' if not ids else 'selected-manifest.json';(DEST/name).write_text(json.dumps(dict(schema='backspool-source-movement-retarget-v1',sourceClips=len(manifest['clips']),exported=len(results),gameplayIntegrated=False,rootMotion='Physics owned; source root translations excluded; native bone lengths retained',clips=results),indent=2)+'\n');print('Retargeted',len(results),'clips;',sum(e['bytes'] for e in results),'compressed bytes',flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--ids',nargs='*');a=p.parse_args();main(a.ids)
