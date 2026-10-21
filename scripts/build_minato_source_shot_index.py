"""Deterministic source landmarks for comparison; detected jumps are not certified cuts."""
import gzip,hashlib,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCENE=ROOT/'assets/nsunsc-library/c426d45069048ff1a4d4/scene.json.gz'
def sample(keys,t,quat=False):
 keys=sorted((k for k in keys if k[0]>=0 and all(math.isfinite(v) for v in k[1])),key=lambda k:k[0])
 if t<=keys[0][0]:return keys[0][1]
 if t>=keys[-1][0]:return keys[-1][1]
 for (ta,a),(tb,b) in zip(keys,keys[1:]):
  if ta<=t<=tb:
   f=(t-ta)/(tb-ta);a=list(a);b=list(b)
   if quat and sum(x*y for x,y in zip(a,b))<0:b=[-v for v in b]
   v=[x+(y-x)*f for x,y in zip(a,b)]
   if quat:
    n=math.sqrt(sum(x*x for x in v));return[x/n for x in v]
   return v
 raise ValueError(t)
def camera_at(entry,t):
 curves={c['path']:c['keys'] for c in entry['curves']}
 lens=curves['data.lens'];lens=[[k[1][0]/3000,[k[1][1]]] if isinstance(k[1],list) and len(k[1])==2 else k for k in lens]
 q=sample(curves['rotation_quaternion'],t,True);n=math.sqrt(sum(v*v for v in q));q=[v/n for v in q]
 return dict(position=sample(curves['location'],t),quaternion=q,horizontalFov=sample(lens,t)[0])
def metrics(a,b):
 return dict(positionDeltaSourceCm=math.dist(a['position'],b['position']),rotationDeltaDegrees=2*math.acos(min(1,abs(sum(x*y for x,y in zip(a['quaternion'],b['quaternion'])))))*180/math.pi,horizontalFovDeltaDegrees=abs(a['horizontalFov']-b['horizontalFov']))
def build():
 raw=SCENE.read_bytes();scene=json.loads(gzip.decompress(raw));dispatch_path=ROOT/'assets/nsunsc-library/minato-action-dispatch.json';dispatch=json.loads(dispatch_path.read_text());rows=[]
 effects_path=ROOT/'assets/nsunsc-library/minato-effect-runtime.json';effects=json.loads(effects_path.read_text())
 audio_path=ROOT/'assets/nsunsc-library/original-audio/minato3mntspl1.json';audio=json.loads(audio_path.read_text())
 for a in scene['animations']:
  if a['name'] not in ['3mntspl1_atk','3mntspl1_dmg','3mntspl1_s','3mntspl1_cut','3mntspl1_cut_nc','3mntspl1_atk_e']:continue
  cameras=[e for e in a['entries'] if e['format']==2];r=dict(name=a['name'],durationSeconds=a['duration'],frameSizeTicks=a['frameSize'],durationTicks=a['frameCount'],loop=a['loop'],cameraEntries=[],visibilityTransitions=[],sourceCommands=[],effectEvents=[],audioEvents=[],bodyRootTracks=[])
  for entry in cameras:
   samples=[];candidates=[];last=None
   count=round(a['duration']*30)
   for frame in range(count+1):
    time=frame/30;pose=camera_at(entry,time);record=dict(frame=frame,sourceSeconds=time,**pose)
    if last:
     change=metrics(last,pose);record.update(change)
     reasons=[]
     if change['positionDeltaSourceCm']>=100:reasons.append('position moves at least 100 source cm in one source frame')
     if change['rotationDeltaDegrees']>=20:reasons.append('rotation changes at least 20 degrees in one source frame')
     if change['horizontalFovDeltaDegrees']>=5:reasons.append('horizontal FOV changes at least 5 degrees in one source frame')
     if reasons:candidates.append(dict(**record,reasons=reasons,status='candidate discontinuity or fast motion; compare footage before calling a camera cut'))
    samples.append(record);last=pose
   r['cameraEntries'].append(dict(name=entry['name'],clump=entry['clump'],channelKeyCounts={c['path']:len(c['keys']) for c in entry['curves']},samples=samples,discontinuityCandidates=candidates,shotBoundaryCandidates=[c for c in candidates if c['positionDeltaSourceCm']>=400 and c['rotationDeltaDegrees']>=60]))
  for ci,clump in enumerate(a['clumps']):
   if clump['name'] not in ['3mntbod1','3mnvbod1','1cmnbod1']:continue
   roots={b['name'] for b in clump['bones'][:3]}
   for entry in a['entries']:
    if entry['clump']==ci and entry['name'] in roots:r['bodyRootTracks'].append(dict(clump=ci,rig=clump['name'],entry=entry['name'],curves=entry['curves'],space='raw source local coordinate; not hierarchy-composed'))
  for record in effects['records']:
   if record['name']!=a['name']:continue
   for generator in record['events']:
    resources=[v for v in record['resources'] if v['generatorIndex']==generator['generator']]
    for event in generator['events']:r['effectEvents'].append(dict(generator=generator['generator'],sourceSeconds=event['seconds'],command=event['command'],packed=event['packed'],resources=resources))
  r['effectEvents'].sort(key=lambda e:(e['sourceSeconds'],e['generator']))
  for event in audio['events']:
   if event['animation']==a['name']+'_snd':r['audioEvents'].append(dict(sourceSeconds=event['event']['sourceSeconds'],sourceFrame=event['event']['sourceFrame'],cueName=event['event']['cueName'],dispatchType=event['event']['dispatchType']))
  for entry in a['entries']:
   for c in entry['curves']:
    if c['path'] not in ['opacity','Alpha']:continue
    prev=None
    for time,value in c['keys']:
     v=value[0] if isinstance(value,list) else value;state=abs(v)>.001
     if state!=prev:r['visibilityTransitions'].append(dict(sourceSeconds=time,sourceFrame=time*30,clump=entry['clump'],entry=entry['name'],format=entry['format'],channel=c['path'],visible=state,rawValue=v));prev=state
  for d in dispatch['rows']:
   if d['timeline']==a['name']:r['sourceCommands']=[dict(offset=c['offset'],sourceFrame=c['sourceFrame'],name=c['name'],opcode=c['opcode'],extension=c.get('extension'),nominalSourceSeconds=c['sourceFrame']/30,timebaseStatus='30 Hz alignment candidate; command runtime clock and conditions must be resolved separately') for c in d['commands']]
  r['visibilityTransitions'].sort(key=lambda v:(v['sourceSeconds'],v['clump'],v['entry']));rows.append(r)
 return dict(schemaVersion=1,id='source:3mntspl1-shot-index',source={**scene['source'],'sceneSidecar':'assets/nsunsc-library/c426d45069048ff1a4d4/scene.json.gz','sceneSidecarSha256':hashlib.sha256(raw).hexdigest(),'dispatchSha256':hashlib.sha256(dispatch_path.read_bytes()).hexdigest(),'effectManifestSha256':hashlib.sha256(effects_path.read_bytes()).hexdigest(),'audioManifestSha256':hashlib.sha256(audio_path.read_bytes()).hexdigest()},clock=dict(sourceTicksPerSecond=3000,sourceFramesPerSecond=30,note='Decoded ANM frameSize=100. Each source frame is 100 ticks.'),timelines=rows,verified=False,limits=['Threshold-detected discontinuities also include fast pans and actor motion; they are not authoritative shot boundaries.','Source ANM durations do not establish runtime transition times.','Visibility markers are source channel changes, not certified attack/hit/effect spawn semantics.','Camera quaternion inverse conversion is retained from importer; view-space convention still needs original image comparison.','Lens FLOATLINEAR records use embedded ticks, not exported array indices.','Command nominal seconds are alignment aids, not recovered conditional execution.'])
if __name__=='__main__':
 out=ROOT/'assets/nsunsc-library/minato-source-shot-index.json';d=build();out.write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({'output':str(out),'timelines':len(d['timelines']),'cameraCandidates':{r['name']:sum(len(e['discontinuityCandidates']) for e in r['cameraEntries']) for r in d['timelines']}}))
