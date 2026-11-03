"""Source-only v20 crouch transition admission; selection is authored.

Clips reuse the committed retargets in assets/backspool/source-movement, so
nothing new is extracted. Forspoken has no crouch-to-stand clip, so
crouchUp is the crouch-down window played backwards; that reversal is an
authored derivative and is marked as such.
"""
import gzip, hashlib, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
# role: (source id, start, end, playback rate, reversed)
CHOICES={
 'crouchDown':('2811bc53',0,.9,1.2,False),   # cuh_shift_from_neutral_n000a, crouched by .8s
 'crouchUp':('2811bc53',0,.9,1.2,True),      # the same window reversed
 'crouchStart':('2811bc6e',0,.7,1,False),    # cuh_move_begin_gear1_f000a, walking by .7s
 'crouchStop':('2811bcfd',0,1.1,1.1,False),  # cuh_move_stop_gear1_f000a, settled by 1.1s
}
def sample(track,t):
 times,values=track['times'],track['values'];n=4 if track['type']=='quaternion' else 3
 if t<=times[0]:return values[:n]
 for i in range(1,len(times)):
  if t<=times[i]:
   k=(t-times[i-1])/max(1e-9,times[i]-times[i-1]);a,b=values[(i-1)*n:i*n],values[i*n:(i+1)*n]
   if n==4 and sum(x*y for x,y in zip(a,b))<0:b=[-x for x in b]
   v=[x+(y-x)*k for x,y in zip(a,b)]
   if n==4:m=math.sqrt(sum(x*x for x in v));v=[x/m for x in v]
   return v
 return values[-n:]
def reverse(clip,start,end):
 # Rebase the window to 0..end-start with time running backwards, keeping every source key.
 for track in clip['tracks']:
  keys=sorted({start,end,*[t for t in track['times'] if start<t<end]})
  track['values']=[x for t in reversed(keys) for x in sample(track,t)]
  track['times']=[round(end-t,6) for t in reversed(keys)]
 clip['duration']=end-start
def main():
 names=json.loads(gzip.decompress((ROOT/'assets/backspool/original-motion-names-v12.json.gz').read_bytes()))
 named={e['animationId']:e for e in names['motions']}
 folder=ROOT/'assets/backspool/source-forspoken-v20';folder.mkdir(exist_ok=True)
 roles=[]
 for role,(ident,start,end,rate,backwards) in CHOICES.items():
  native=named['0x'+ident]
  clip=json.loads(gzip.decompress((ROOT/'assets/backspool/source-movement'/(ident+'.json.gz')).read_bytes()))
  assert clip['userData']['sourceSha256']==native['sourceSha256'] and 0<=start<end<=clip['duration']+1e-6
  if backwards:reverse(clip,start,end);clip['userData']['authoredDerivative']='window %.2f-%.2fs played in reverse'%(start,end);start,end=0,end-start
  clip['name']='forspoken-v20-'+role;clip['userData']['originalMotionName']=native['originalName']
  path=folder/(role+'-'+ident+'.json.gz');path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
  roles.append(dict(role=role,id=clip['name'],sourceAnimationId='0x'+ident,sourceSha256=native['sourceSha256'],originalMotionName=native['originalName'],dictionaryOffset=native['dictionaryOffset'],url=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),duration=clip['duration'],start=start,end=end,playbackRate=rate,pelvisTranslation=False,reversed=backwards,verifiedOriginalRole=False,replaceable=True))
 (ROOT/'assets/backspool/traversal-forspoken-v20-roles.json').write_text(json.dumps(dict(schema='backspool-forspoken-v20',sourceOnly=True,roles=roles,originalControllerVerified=False,originalIKVerified=False),indent=2)+'\n')
 print('Admitted',len(roles),'v20 crouch roles')
if __name__=='__main__':main()
