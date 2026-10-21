"""Package recovered source vault curves retargeted to native Backspool proportions.
Candidate only; no source executable logic or root translation is shipped.
"""
import gzip,hashlib,json
from pathlib import Path
from build_forspoken_backspool_pilot import retarget
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/rea-forspoken';ASSETS=ROOT/'assets/backspool'
def build():
 entries=[]
 for path in sorted((OUT/'vault-source-tracks').glob('28*.json')):
  source=json.loads(path.read_text());clip=retarget(source);id='traversal-source-'+path.stem
  clip['name']=id;entries.append(dict(id=id,name='Recovered vault '+source['animationId'],clip=clip,sourceSha256=source['sourceSha256'],sourceAnimationId=source['animationId'],sourceDuration=source['durationSeconds'],origin='recovered motion; authored Backspool retarget and travel policy'))
 if len(entries)!=6:raise ValueError('Expected the six source vault clips')
 target=ASSETS/'traversal-source-vault-candidate.json.gz';target.write_bytes(gzip.compress(json.dumps(entries,separators=(',',':')).encode(),mtime=0))
 dense=json.loads((OUT/'pilot-validation.json').read_text())['dense'];first=entries[0];duration=first['clip']['duration'];anchors=[dict(time=r['time'],minimumY=r['bounds']['min'][1]) for r in dense];anchors.append(dict(time=duration,minimumY=anchors[-1]['minimumY']))
 manifest=dict(version=1,origin='Recovered source vaults with authored target mapping; candidate acceptance pending',packUrl=target.relative_to(ROOT).as_posix(),packSha256=hashlib.sha256(target.read_bytes()).hexdigest(),activeBuildChanged=False,roles=[dict(role='vault',id=first['id'],sourceId=first['id'],sourceAnimationId=first['sourceAnimationId'],sourceStart=0,sourceEnd=duration,playbackRate=1,duration=duration,sourceSha256=first['sourceSha256'],rootTranslation='physics-owned; native bone lengths and local translations retained',visualAnchor=anchors,sourcePoseConsumer='Ghidra FUN_140507700 parent-composed no-scale skeletal path',gameplayBehavior='authored swept vault path; not original movement code')],clips=[dict(id=e['id'],sourceAnimationId=e['sourceAnimationId'],duration=e['sourceDuration'],sourceSha256=e['sourceSha256']) for e in entries])
 (ASSETS/'traversal-source-segments.json').write_text(json.dumps(manifest,indent=2)+'\n');print('Six retargeted vaults packaged:',target.stat().st_size,'bytes; first vault selected for isolated candidate')
if __name__=='__main__':build()
