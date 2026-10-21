"""Lazy, body-only previews of the expanded Frey inventory, never role admission."""
import gzip,hashlib,json
from pathlib import Path
from build_forspoken_backspool_pilot import retarget
from build_backspool_source_movement import compact
ROOT=Path(__file__).resolve().parents[1]
def main():
 source=json.loads((ROOT/'output/rea-forspoken/full-player-inventory/manifest.json').read_text())
 previous=json.loads((ROOT/'assets/backspool/source-movement/manifest.json').read_text())['clips']
 previous={(c['id'],c['sourceSha256']):c for c in previous}
 out=ROOT/'assets/backspool/source-player';out.mkdir(exist_ok=True);rows=[]
 entries={p['path']:p['entry'] for p in source['packages']}
 for i,c in enumerate(c for c in source['clips'] if c['status']=='decoded' and '/facial/' not in c['pack']):
  ident=c['animationId'][2:];entry=entries[c['pack']];cached=previous.get((ident,c['sourceSha256']))
  if cached:url=cached['url'];digest=cached['sha256']
  else:
   path=out/(str(entry)+'-'+ident+'.json.gz');url=path.relative_to(ROOT).as_posix()
   if not path.exists():
    data=compact(retarget(json.loads(Path(c['output']).read_text())))
    data['name']='forspoken-preview-'+str(entry)+'-'+ident
    data['userData'].update(sourcePack=c['pack'],semanticRole='unassigned preview',previewOnly=True)
    path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0))
   digest=hashlib.sha256(path.read_bytes()).hexdigest()
  rows.append(dict(id='forspoken-preview-'+str(entry)+'-'+ident,name='Forspoken / '+c['pack'].split('/pack/')[-1]+' / '+ident,sourceUrl=url,sourceAnimationId=c['animationId'],sourcePack=c['pack'],sourceSha256=c['sourceSha256'],sha256=digest,duration=c['durationSeconds'],gameplayIntegrated=False,verifiedOriginalRole=False,previewOnly=True))
  if i%50==0:print('Preview export',i+1,flush=True)
 doc=dict(schema='backspool-full-source-preview-v1',scope=source['scope'],bodyOnly=True,originalControllerRecovered=False,clips=rows,sourceCounts=source['counts'],limitations=['Body retarget previews only; no source facial, cloth, equipment or original IK.','A source animation ID is not a verified gameplay move identity.','Source archive and package-qualified IDs avoid collisions.'])
 (ROOT/'assets/backspool/source-player-preview-index.json').write_text(json.dumps(doc,indent=2)+'\n');print('COMPLETE',len(rows),flush=True)
if __name__=='__main__':main()
