"""Retarget locally decoded NUCC curves; outputs local-only animation data."""
import json,math,bisect,gzip
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'output/rea-naruto/animation-pass'
src=json.loads((BASE/'selected-curves.json').read_text());dest=json.loads((BASE/'backspool-bind.json').read_text())
def mul(a,b):
 x,y,z,w=a;X,Y,Z,W=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]
def inv(q):return [-q[0],-q[1],-q[2],q[3]]
def norm(q):
 n=math.sqrt(sum(x*x for x in q));assert n>.0001;return [x/n for x in q]
def euler(v):
 x,y,z=[math.radians(x)*.5 for x in v];return mul(mul([math.sin(x),0,0,math.cos(x)],[0,math.sin(y),0,math.cos(y)]),[0,0,math.sin(z),math.cos(z)])
def lerpq(a,b,t):
 dot=sum(x*y for x,y in zip(a,b))
 if dot<0:b=[-x for x in b];dot=-dot
 if dot>.9995:return norm([x+(y-x)*t for x,y in zip(a,b)])
 angle=math.acos(max(-1,min(1,dot)));ss=math.sin(angle);return [(x*math.sin((1-t)*angle)+y*math.sin(t*angle))/ss for x,y in zip(a,b)]
def sample(tr,t,quat=False):
 times=tr['times_seconds'];v=tr['values'];i=max(0,min(len(times)-1,bisect.bisect_right(times,t)-1));q=lambda a:norm(inv(a)) if tr['path']=='rotation_quaternion' else euler(a)
 a=q(v[i]) if quat else v[i]
 if i==len(times)-1:return a
 b=q(v[i+1]) if quat else v[i+1];f=(t-times[i])/(times[i+1]-times[i]);return lerpq(a,b,f) if quat else [x+(y-x)*f for x,y in zip(a,b)]
MAJOR=('Arm.','ForeArm.','UpLeg.','Leg.','Spine.','Spine1.','Spine2.','Hips.','Neck.','Head.','Hand.','Foot.')
def angular_speeds(tracks):
 result=[]
 for tr in tracks:
  if tr.get('type')!='quaternion' or not any(n in tr['name'] for n in MAJOR):continue
  for i in range(1,len(tr['times'])):
   dt=tr['times'][i]-tr['times'][i-1];a=tr['values'][4*i-4:4*i];b=tr['values'][4*i:4*i+4]
   if dt>1e-8:result.append(2*math.acos(min(1,abs(sum(x*y for x,y in zip(a,b)))))/dt)
 return result
def percentile(v,p):return sorted(v)[int((len(v)-1)*p)] if v else 0
reference=[]
for entry in json.load(gzip.open(ROOT/'assets/backspool/animations-web.json.gz')):
 if any(x in entry['name'].lower() for x in ['punch','kick','hook','uppercut']):reference.extend(angular_speeds(entry['clip']['tracks']))
REF_P95=percentile(reference,.95);REF_MAX=max(reference)
def retarget(src, source_timing=False):
 # Main skeleton has unique names; ignore alternate clumps after first occurrence.
 bones={};
 for b in src['bones']:bones.setdefault(b['name'],b)
 rest={};identity=[0,0,0,1]
 def restq(n):
  if n not in rest:
   b=bones[n];rest[n]=mul(restq(b['parent']) if b['parent'] in bones else identity,euler(b['rotation_degrees_zyx']))
  return rest[n]
 for n in bones:restq(n)
 target={b['name']:b for b in dest};targetrest={}
 def tq(n):
  if n not in targetrest:
   b=target[n];targetrest[n]=mul(tq(b['parent']) if b['parent'] in target else identity,b['quaternion'])
  return targetrest[n]
 for n in target:tq(n)
 mapbones={'mixamorigHips':'pelvis','mixamorigSpine':'spine','mixamorigSpine2':'spine1','mixamorigNeck':'neck','mixamorigHead':'head'}
 for side,short in [('Left','l'),('Right','r')]:
  for part,source in [('Shoulder','clavicle'),('Arm','upperarm'),('ForeArm','forearm'),('Hand','hand'),('UpLeg','thigh'),('Leg','calf'),('Foot','foot'),('ToeBase','toe0')]:mapbones['mixamorig'+side+part]=short+' '+source
 for side,short in [('Left','l'),('Right','r')]:
  for i,finger in enumerate(['Thumb','Index','Middle','Ring','Pinky']):
   for joint in range(1,4):mapbones['mixamorig'+side+'Hand'+finger+str(joint)]=short+' finger'+str(i)+(str(joint-1) if joint>1 else '')
 prefixes=[b['name'][:-7] for b in src['bones'] if b['name'].endswith(' pelvis')]
 observed={tr['bone'] for clip in src['clips'] for tr in clip['tracks']}
 prefix=max(prefixes,key=lambda p:sum(name.startswith(p+' ') or name==p for name in observed))
 mapbones={k:prefix+' '+v for k,v in mapbones.items() if prefix+' '+v in bones};assert len(mapbones)>=19;C=euler([-90,0,0]);out=[]
 for ci,clip in enumerate(src['clips']):
  curves={}
  for track in clip['tracks']:
   pairs=sorted({float(t):v for t,v in zip(track['times_seconds'],track['values']) if t>=0}.items());assert pairs
   curves[(track['bone'],track['path'])]={**track,'times_seconds':[t for t,v in pairs],'values':[v for t,v in pairs]}
  duration=clip['duration_seconds'];times=[i/60 for i in range(math.ceil(duration*60))]+[duration];values={n:[] for n in target}
  for t in times:
   world={};wanted={};tw={}
   def sw(n):
    if n not in world:
     b=bones[n];tr=curves.get((n,'rotation_quaternion')) or curves.get((n,'rotation_euler'));local=sample(tr,t,True) if tr else euler(b['rotation_degrees_zyx']);world[n]=mul(sw(b['parent']) if b['parent'] in bones else identity,local)
    return world[n]
   for n,sn in mapbones.items():wanted[n]=mul(mul(mul(C,mul(sw(sn),inv(rest[sn]))),inv(C)),targetrest[n])
   def target_world(n):
    if n not in tw:
     b=target[n];parent=target_world(b['parent']) if b['parent'] in target else identity;tw[n]=wanted[n] if n in wanted else mul(parent,b['quaternion'])
     if n in values:
      q=norm(mul(inv(parent),tw[n]));prev=values[n][-4:]
      if prev and sum(x*y for x,y in zip(prev,q))<0:q=[-x for x in q]
      values[n].extend(round(x,7) for x in q)
    return tw[n]
   for n in target:target_world(n)
  tracks=[{'name':n+'.quaternion','type':'quaternion','times':times,'values':v} for n,v in values.items()]
  tracks.extend({'name':n+'.position','type':'vector','times':[0,duration],'values':target[n]['position']*2} for n in target)
  tracks.extend({'name':n+'.scale','type':'vector','times':[0,duration],'values':[1,1,1,1,1,1]} for n in target)
  # Retain target proportions and physics-owned root translation. No source root motion.
  # Match the supplied Mixamo combat library's measured angular tempo, not guessed FPS.
  if source_timing:
   out.append({'playbackRate':1,'originalDuration':duration,'timingPolicy':{'policy':'source-seconds-preserved-v2'},'id':'storm-local-'+clip['name'],'name':'Storm '+clip['name'],'sourceFolder':'Local Storm retarget','clip':{'name':'storm-local-'+clip['name'],'duration':duration,'tracks':tracks},'sourceAnimation':clip['name'],'character':src.get('character','1nrt'),'characterLabel':src.get('character_label','Naruto'),'combatRole':clip.get('combatRole','ground')})
   continue
  velocities=angular_speeds(tracks);scale=max(1.25,percentile(velocities,.95)/REF_P95)
  if clip.get('combatRole') in ['ground','air'] or any(x in clip['name'] for x in ['cmb','cma']):scale=max(scale,.9/duration)
  common=tracks[0]['times'];warped=[0.0]
  major=[tr for tr in tracks if tr['type']=='quaternion' and any(n in tr['name'] for n in MAJOR)]
  for i in range(1,len(common)):
   angle=max(2*math.acos(min(1,abs(sum(x*y for x,y in zip(tr['values'][4*i-4:4*i],tr['values'][4*i:4*i+4]))))) for tr in major)
   warped.append(warped[-1]+max((common[i]-common[i-1])*scale,angle/REF_MAX))
  final_duration=warped[-1]
  for tr in tracks:tr['times']=[round(t,7) for t in warped] if tr['type']=='quaternion' else [0,round(final_duration,7)]
  final_speed=angular_speeds(tracks)
  final_scale=max(1,percentile(final_speed,.95)/(REF_P95*.995))
  if final_scale>1:
   for tr in tracks:tr['times']=[round(t*final_scale,7) for t in tr['times']]
   final_duration*=final_scale;final_speed=angular_speeds(tracks)
  out.append({'playbackRate':1,'originalDuration':duration,'timingPolicy':{'mixamoP95':REF_P95,'mixamoMaximum':REF_MAX,'resultP95':percentile(final_speed,.95),'resultMaximum':max(final_speed)},'id':'storm-local-'+clip['name'],'name':'Storm '+clip['name'],'sourceFolder':'Local Storm retarget','clip':{'name':'storm-local-'+clip['name'],'duration':final_duration,'tracks':tracks},'sourceAnimation':clip['name'],'character':src.get('character','1nrt'),'characterLabel':src.get('character_label','Naruto'),'combatRole':clip.get('combatRole', 'ground' if 'cmb' in clip['name'] else 'air' if 'cma' in clip['name'] else 'jump' if 'jmp' in clip['name'] else 'guard' if 'grd' in clip['name'] else 'landing')})
 return out,mapbones
if __name__=='__main__':
 out=[];mappings={}
 for source in [BASE/'selected-curves.json',*sorted(BASE.glob('selected-curves-*.json'))]:
  data=json.loads(source.read_text());clips,mapping=retarget(data);out.extend(clips);mappings[data.get('character','1nrt')]=mapping
 path=ROOT/'assets/backspool/storm-local-clips.json';path.write_text(json.dumps(out,separators=(',',':')));(path.with_suffix('.json.gz')).write_bytes(gzip.compress(path.read_bytes(),compresslevel=9,mtime=0))
 (BASE/'retarget-summary.json').write_text(json.dumps({'clips':len(out),'complete_target_bones':len(dest),'source_axes':'Z-up converted to Y-up','root_motion':'discarded; physics owns translation','tempo_reference':{'p95_radians_per_second':REF_P95,'maximum_radians_per_second':REF_MAX},'target_bind':'backspool-bind.json','mapping':mappings,'durations':{x['name']:x['clip']['duration'] for x in out}},indent=2));print(path,len(out),'clips',len(dest),'bones')
