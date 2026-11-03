"""Source-only v17 ground start, stop and 180-degree turn admission; selection is authored.

Clips reuse the committed retargets in assets/backspool/source-movement, so
nothing new is extracted. Retargeting drops the source root, which is where
Forspoken keeps the yaw of a 180-degree turn; for turn roles that root yaw is
baked back into the hips relative to the final heading, so the runtime can
snap facing to the new direction and let the clip show the spin.
"""
import gzip, hashlib, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# Decoded tracks live beside the project, outside the repository checkout.
TRACKS=ROOT.parent/'output/rea-forspoken'
# role: (source id, start, end, playback rate, bake root yaw). Windows come
# from source root speed: starts stop at the first stride, stops at rest.
CHOICES={
 'moveStart':('281132cb',0,.60,1.2,False),      # ntl_move_begin_gear3_f000a
 'moveStartFast':('281132ca',0,.60,1.2,False),  # ntl_move_begin_gear4_f000a
 'moveStartTurn':('2811295a',0,.75,1.25,True),  # ntl_move_begin_gear3_l180a, root yaw 0-180 by .7s
 'moveStopWalk':('28112e35',0,1.40,1.3,False),  # ntl_move_stop_gear2_f000a, at rest by 1.48s
 'moveStop':('28112965',0,1.25,1.3,False),      # ntl_move_stop_gear3_f000a, at rest by 1.22s
 'moveStopFast':('2811296a',0,1.20,1.3,False),  # ntl_move_stop_gear4_f000a, at rest by 1.18s
 'moveTurn':('281132be',0,.80,1.2,True),        # ntl_move_veer_gear3_l180a
 'moveTurnFast':('28112967',0,.75,1.2,True),    # ntl_move_veer_gear4_l180a
}
def yaw(q):
 x,y,z,w=q;return math.atan2(2*(x*z+w*y),1-2*(x*x+y*y))
def root_yaw(source):
 track=next((t for t in source['tracks'] if t['boneIndex']==0 and t['channel']=='rootRotation'),None)
 if track is None:raise ValueError('Turn role needs a source root rotation')
 times=track['timesSeconds'];angles=[];previous=None
 for q in track['values']:
  a=yaw(q)
  if previous is not None:a=previous+math.remainder(a-previous,math.tau)
  angles.append(a);previous=a
 def at(t):
  if t<=times[0]:return angles[0]
  for i in range(1,len(times)):
   if t<=times[i]:k=(t-times[i-1])/max(1e-9,times[i]-times[i-1]);return angles[i-1]+(angles[i]-angles[i-1])*k
  return angles[-1]
 return at,angles[-1]
def bake_yaw(clip,source):
 at,final=root_yaw(source)
 hips=next(t for t in clip['tracks'] if t['name']=='mixamorigHips.quaternion');v=hips['values']
 for i,t in enumerate(hips['times']):
  a=(at(t)-final)/2;s,c=math.sin(a),math.cos(a);x,y,z,w=v[i*4:i*4+4]
  # Pre-multiply a world-Y rotation; the hips parent frame is Y-up.
  v[i*4:i*4+4]=[c*x+s*z,c*y+s*w,c*z-s*x,c*w-s*y]
 clip['userData']['rootYawBaked']=dict(totalDegrees=round(math.degrees(final-at(0)),2),relativeTo='final heading')
def main():
 names=json.loads(gzip.decompress((ROOT/'assets/backspool/original-motion-names-v12.json.gz').read_bytes()))
 named={e['animationId']:e for e in names['motions']}
 sources={e['animationId']:e['output'] for e in json.loads((TRACKS/'movement-source-tracks/manifest.json').read_text())['clips']}
 folder=ROOT/'assets/backspool/source-forspoken-v17';folder.mkdir(exist_ok=True)
 roles=[]
 for role,(ident,start,end,rate,turn) in CHOICES.items():
  native=named['0x'+ident]
  clip=json.loads(gzip.decompress((ROOT/'assets/backspool/source-movement'/(ident+'.json.gz')).read_bytes()))
  assert clip['userData']['sourceSha256']==native['sourceSha256']
  if turn:
   source=json.loads(Path(sources['0x'+ident]).read_text());assert source['sourceSha256']==native['sourceSha256'];bake_yaw(clip,source)
  clip['name']='forspoken-v17-'+role;clip['userData']['originalMotionName']=native['originalName']
  assert 0<=start<end<=clip['duration']+1e-6
  path=folder/(role+'-'+ident+'.json.gz');path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
  roles.append(dict(role=role,id=clip['name'],sourceAnimationId='0x'+ident,sourceSha256=native['sourceSha256'],originalMotionName=native['originalName'],dictionaryOffset=native['dictionaryOffset'],url=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),duration=clip['duration'],start=start,end=end,playbackRate=rate,pelvisTranslation=False,rootYawBaked=turn,verifiedOriginalRole=False,replaceable=True))
 (ROOT/'assets/backspool/traversal-forspoken-v17-roles.json').write_text(json.dumps(dict(schema='backspool-forspoken-v17',sourceOnly=True,roles=roles,originalControllerVerified=False,originalIKVerified=False),indent=2)+'\n')
 print('Admitted',len(roles),'v17 source motion roles')
if __name__=='__main__':main()
