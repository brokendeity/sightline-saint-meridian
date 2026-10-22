"""Source-only v15 contact and directional motion admission; transitions are authored."""
import gzip, hashlib, json
from pathlib import Path
from build_forspoken_backspool_pilot import retarget
from build_backspool_source_movement import compact
ROOT=Path(__file__).resolve().parents[1]
# Bounded source segments at moderate, declared playback rates. Original names
# prove clip identity, not the original game's contextual selection or IK.
CHOICES={
 'frontFlip':('2811ec86',0,1.40,1.2),
 'backFlip':('2811ec56',0,1.40,1.2),
 'sideFlipLeft':('2811ec58',0,1.40,1.2),
 'sideFlipRight':('2811ec87',0,1.40,1.2),
 'twistFlip':('2811ad2b',1.20,3.40,1.4),
 'groundRoll':('2811e9e1',0,1.45,1.2),
 'roll':('2811a88a',0,1.25,1),
 'rollLeft':('2811a83b',0,1.55,1.15),
 'rollRight':('2811ac36',0,1.55,1.15),
 'rollBack':('2811a875',0,1.55,1.15),
 'land':('2811041c',0,1.10,1),
 'landMove':('2811a75f',0,2/3,1),
 'landBack':('2811ab84',0,2/3,1),
 'landHard':('2811040b',0,1.20,1),
 'backstep':('2811b193',0,.48,1),
}
def main():
 names=json.loads(gzip.decompress((ROOT/'assets/backspool/original-motion-names-v12.json.gz').read_bytes()))
 named={e['animationId']:e for e in names['motions']}
 index=json.loads((ROOT/'output/rea-forspoken/movement-kinematic-profiles.json').read_text())['clips']
 source_index=json.loads((ROOT/'output/rea-forspoken/movement-source-tracks/manifest.json').read_text())['clips']
 sources={e['animationId']:e['output'] for e in source_index}
 for e in index:sources.setdefault(e['animationId'],e['sourceTrackFile'])
 folder=ROOT/'assets/backspool/source-landing-roll-v15';folder.mkdir(exist_ok=True)
 roles=[]
 for role,(ident,start,end,rate) in CHOICES.items():
  native=named['0x'+ident]
  if '0x'+ident not in sources:raise ValueError('Source tracks required '+ident)
  source=json.loads(Path(sources['0x'+ident]).read_text())
  assert source['sourceSha256']==native['sourceSha256']
  clip=compact(retarget(source,preserve_pelvis=True));clip['name']='forspoken-flow-'+role
  assert 0<=start<end<=clip['duration']+1e-6
  clip['userData']['originalMotionName']=native['originalName']
  path=folder/(role+'-'+ident+'.json.gz');path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
  roles.append(dict(role=role,id=clip['name'],sourceAnimationId='0x'+ident,sourceSha256=source['sourceSha256'],originalMotionName=native['originalName'],dictionaryOffset=native['dictionaryOffset'],url=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),duration=clip['duration'],start=start,end=end,playbackRate=rate,pelvisTranslation=True,verifiedOriginalRole=False,roleEvidence='Recovered source motion and original dictionary label; selected segment, contact and transitions authored for Backspool.'))
 (ROOT/'assets/backspool/traversal-landing-roll-roles-v15.json').write_text(json.dumps(dict(schema='backspool-landing-roll-v15',sourceOnly=True,roles=roles,originalControllerVerified=False,originalIKVerified=False),indent=2)+'\n')
 print('Admitted',len(roles),'named source motion roles')
if __name__=='__main__':main()
