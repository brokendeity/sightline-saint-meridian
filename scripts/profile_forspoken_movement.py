#!/usr/bin/env python3
"""Static source-curve kinematic profiles, explicitly NOT gameplay or contact truth."""
import argparse,bisect,hashlib,json,math
from pathlib import Path
from inspect_forspoken_amdl import qmul,qrotate
ROOT=Path('output/rea-forspoken'); ID=[0.,0.,0.,1.]
JOINTS=['C_Hip','C_Head','L_Foot','R_Foot','L_Hand','R_Hand','L_Leg','R_Leg']
def norm(q):
 n=math.sqrt(sum(v*v for v in q));return [v/n for v in q]
def sample(track,t,rotation=False):
 times=track['timesSeconds'];i=max(0,bisect.bisect_right(times,t)-1);a=track['values'][i]
 if i>=len(times)-1:return a
 b=track['values'][i+1];span=times[i+1]-times[i];f=(t-times[i])/span if span else 0
 if rotation:
  dot=sum(x*y for x,y in zip(a,b))
  if dot<0:b=[-x for x in b];dot=-dot
  if dot>.9995:return norm([x+(y-x)*f for x,y in zip(a,b)])
  theta=math.acos(min(1.,dot));den=math.sin(theta)
  return [(x*math.sin((1-f)*theta)+y*math.sin(f*theta))/den for x,y in zip(a,b)]
 return [x+(y-x)*f for x,y in zip(a,b)]
def peaks(xs,prominence):
 return [i for i in range(2,len(xs)-2) if xs[i]>xs[i-1] and xs[i]>=xs[i+1] and xs[i]-min(xs[max(0,i-8):i+9])>=prominence]
def extent(v):return [max(x[j] for x in v)-min(x[j] for x in v) for j in range(3)]
def profile(record,rig,hz=20):
 path=Path(record['output']);src=json.loads(path.read_text());bones=rig['bones'];by_name={b['name']:b for b in bones}
 names=set(JOINTS)
 for name in list(names):
  p=by_name[name]['parent']
  while p>=0:names.add(bones[p]['name']);p=bones[p]['parent']
 ordered=sorted((by_name[n] for n in names),key=lambda b:b['depth'])
 rotation={t['boneName']:t for t in src['tracks'] if t['channel']=='skeletalRotation'}
 trans={t['boneName']:t for t in src['tracks'] if t['channel']=='skeletalTranslation'}
 root=next((t for t in src['tracks'] if t['channel']=='rootTranslation'),None)
 duration=src['durationSeconds'];times=[i/hz for i in range(math.ceil(duration*hz))]+[duration]
 positions={n:[] for n in JOINTS};roots=[]
 for t in times:
  accum={0:ID};world={0:[0,0,0]}
  for bone in ordered:
   i=bone['index'];p=bone['parent'];n=bone['name']
   if p<0:continue
   q=sample(rotation[n],t,True) if n in rotation else ID
   accum[i]=qmul(accum[p],q)
   reference=sample(trans[n],t)[:3] if n in trans else bone['defaultPoseModelSpaceOffset'][:3]
   offset=qrotate(accum[p],reference);world[i]=[world[p][j]+offset[j] for j in range(3)]
  for n in JOINTS:positions[n].append(world[by_name[n]['index']])
  roots.append(sample(root,t)[:3] if root else [0,0,0])
 body_height=by_name['C_Head']['derivedWorldPosition'][1]
 feet=positions['L_Foot']+positions['R_Foot'];floor=min(v[1] for v in feet);contacts={}
 for n in ['L_Foot','R_Foot']:
  ps=positions[n];flags=[]
  for i,p in enumerate(ps):
   lo=max(0,i-1);hi=min(len(ps)-1,i+1);dt=max(1e-9,times[hi]-times[lo]);vy=(ps[hi][1]-ps[lo][1])/dt
   flags.append(p[1]-floor<.025*body_height and abs(vy)<.15*body_height)
  contacts[n]=dict(lowSlowVerticalFraction=sum(flags)/len(flags),candidateIntervalsSeconds=[])
  start=None
  for i,f in enumerate(flags+[False]):
   if f and start is None:start=i
   if not f and start is not None:
    if i-start>=2:contacts[n]['candidateIntervalsSeconds'].append([times[start],times[min(i,len(times)-1)]])
    start=None
 leg=[positions['L_Foot'][i][2]-positions['R_Foot'][i][2] for i in range(len(times))]
 arm=[positions['L_Hand'][i][2]-positions['R_Hand'][i][2] for i in range(len(times))]
 legp=peaks(leg,.025*body_height);armp=peaks(arm,.025*body_height)
 cadence=len(legp)/duration if duration else 0
 root_delta=[roots[-1][j]-roots[0][j] for j in range(3)]
 root_path=sum(math.dist(roots[i],roots[i-1]) for i in range(1,len(roots)))
 body_ranges={n:extent(ps) for n,ps in positions.items()}
 # First/last pose closure excludes actor root and uses all observed body marker positions.
 closure=sum(math.dist(ps[0],ps[-1]) for ps in positions.values())/len(positions)/body_height
 family=Path(record['pack']).stem
 evidence=[]
 if family=='ntl000':
  if closure<.06 and cadence>=.5:evidence.append('cyclic terrestrial locomotion candidate')
  if root_path/duration>1.8:evidence.append('higher root-speed candidate')
  if closure<.025 and max(body_ranges['L_Foot'])<.12*body_height:evidence.append('low-motion/idle candidate')
 if family=='ldr000':evidence.append('ladder family: ascent/descent/transition unknown without graph label')
 if family=='swm000':evidence.append('swim family: loop/entry/exit unknown without graph label')
 if family=='cuh000':evidence.append('crouch family: loop/transition unknown without graph label')
 if family=='air000':evidence.append('air family: takeoff/fall/landing unknown without graph label')
 return dict(animationId=src['animationId'],pack=record['pack'],sourceTrackFile=str(path),
  sourceSha256=src['sourceSha256'],durationSeconds=duration,sampleHz=hz,samples=len(times),
  root=dict(hasTrack=root is not None,netDisplacementSourceUnits=root_delta,pathLengthSourceUnits=root_path,
   averagePathSpeedSourceUnitsPerSecond=root_path/duration,rangeSourceUnits=extent(roots)),
  bodyMarkerRangesSourceUnits=body_ranges,normalizedLoopClosureError=closure,
  legAlternationPeaksSeconds=[times[i] for i in legp],armAlternationPeaksSeconds=[times[i] for i in armp],
  legCycleRateHzHeuristic=cadence,footContactCandidates=contacts,
  sampledBodyMarkers=dict(timesSeconds=times,positionsSourceUnits=positions),
  classification=dict(sourcePackFamily=family,kinematicHints=evidence,verifiedMoveName=None,
    certainty='source family is literal archive provenance; individual move names remain unverified'))
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--sample-hz',type=int,default=20);args=parser.parse_args()
 if not 5<=args.sample_hz<=60:raise ValueError('Sample rate outside bounded5..60Hz')
 rig=json.loads((ROOT/'hu000-rig.json').read_text());manifest=json.loads((ROOT/'movement-source-tracks/manifest.json').read_text())
 result=[];out=ROOT/'movement-kinematic-profiles';out.mkdir(exist_ok=True)
 for i,clip in enumerate(manifest['clips']):
  rec=profile(clip,rig,args.sample_hz);target=out/(Path(clip['output']).parent.name+'-'+clip['animationId'][2:]+'.json');target.write_text(json.dumps(rec,separators=(',',':'))+'\n')
  result.append({k:v for k,v in rec.items() if k!='sampledBodyMarkers'}|dict(profileFile=str(target)))
  if i%50==0:print(f'Profiled {i+1}/{len(manifest["clips"])}',flush=True)
 doc=dict(schema='forspoken-source-kinematic-profiles-v1',sourceRigSha256=rig['source']['sha256'],count=len(result),
  limitations=['No motion is assigned an exact original move name without source graph linkage.',
   'Root source-unit distance does not establish original controller displacement or world-unit conversion.',
   'Foot intervals are low-height/slow-vertical-motion candidates, not recovered collision/contact markers.',
   'Standard shortest-path slerp approximates recovered rotation interpolation; IK, physics and scale processors are excluded.',
   'Marker trajectories are in model coordinates without actor root translation/rotation; root curves are reported separately.'],clips=result)
 (ROOT/'movement-kinematic-profiles.json').write_text(json.dumps(doc,indent=2)+'\n')
 print('Complete',len(result))
if __name__=='__main__':main()
