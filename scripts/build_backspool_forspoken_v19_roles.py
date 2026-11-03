"""Source-only v19 running take-off admission; selection is authored.

Clips reuse the committed retargets in assets/backspool/source-movement, so
nothing new is extracted. Roles keep provenance so each can be swapped.
"""
import gzip, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# role: (source id, start, end, playback rate)
CHOICES={
 'jumpMove':('28113cdd',.1,2.0,1),   # air_jump_begin_move_n000a, push-off from a running stride
}
def main():
 names=json.loads(gzip.decompress((ROOT/'assets/backspool/original-motion-names-v12.json.gz').read_bytes()))
 named={e['animationId']:e for e in names['motions']}
 folder=ROOT/'assets/backspool/source-forspoken-v19';folder.mkdir(exist_ok=True)
 roles=[]
 for role,(ident,start,end,rate) in CHOICES.items():
  native=named['0x'+ident]
  clip=json.loads(gzip.decompress((ROOT/'assets/backspool/source-movement'/(ident+'.json.gz')).read_bytes()))
  assert clip['userData']['sourceSha256']==native['sourceSha256'] and 0<=start<end<=clip['duration']+1e-6
  clip['name']='forspoken-v19-'+role;clip['userData']['originalMotionName']=native['originalName']
  path=folder/(role+'-'+ident+'.json.gz');path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
  roles.append(dict(role=role,id=clip['name'],sourceAnimationId='0x'+ident,sourceSha256=native['sourceSha256'],originalMotionName=native['originalName'],dictionaryOffset=native['dictionaryOffset'],url=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),duration=clip['duration'],start=start,end=end,playbackRate=rate,pelvisTranslation=False,verifiedOriginalRole=False,replaceable=True))
 (ROOT/'assets/backspool/traversal-forspoken-v19-roles.json').write_text(json.dumps(dict(schema='backspool-forspoken-v19',sourceOnly=True,roles=roles,originalControllerVerified=False,originalIKVerified=False),indent=2)+'\n')
 print('Admitted',len(roles),'v19 source motion roles')
if __name__=='__main__':main()
