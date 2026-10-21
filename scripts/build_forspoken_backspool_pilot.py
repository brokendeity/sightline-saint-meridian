"""Recovered source-delta retarget with authored anatomical correspondence.
Role manifests separately control admission to the isolated gameplay candidate.
"""
import bisect,json,math
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'output/rea-forspoken';ROOT=OUT.parents[1]
def mul(a,b):
 x,y,z,w=a;X,Y,Z,W=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]
def inv(q):return [-q[0],-q[1],-q[2],q[3]]
def norm(q):
 n=math.sqrt(sum(v*v for v in q));return [v/n for v in q]
def rotate(q,v):
 return mul(mul(q,[*v,0]),inv(q))[:3]
def align(a,b):
 na=math.sqrt(sum(x*x for x in a));nb=math.sqrt(sum(x*x for x in b))
 if min(na,nb)<1e-8:raise ValueError('Degenerate anatomical reference axis')
 a=[x/na for x in a];b=[x/nb for x in b];d=sum(x*y for x,y in zip(a,b))
 if d<-.999999:
  axis=[1,0,0] if abs(a[0])<.9 else [0,1,0]
  return norm([a[1]*axis[2]-a[2]*axis[1],a[2]*axis[0]-a[0]*axis[2],a[0]*axis[1]-a[1]*axis[0],0])
 return norm([a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0],1+d])
def sample(tr,t):
 times=tr['timesSeconds'];i=max(0,bisect.bisect_right(times,t)-1);a=tr['values'][i]
 if i==len(times)-1:return a
 b=tr['values'][i+1];f=(t-times[i])/(times[i+1]-times[i]);dot=sum(x*y for x,y in zip(a,b))
 if dot<0:b=[-x for x in b];dot=-dot
 if dot>.9995:return norm([x+(y-x)*f for x,y in zip(a,b)])
 th=math.acos(min(1,dot));return [(x*math.sin((1-f)*th)+y*math.sin(f*th))/math.sin(th) for x,y in zip(a,b)]
def retarget(src,preserve_pelvis=False):
 sourceRig=json.loads((OUT/'hu000-rig.json').read_text());sourceBones={b['name']:b for b in sourceRig['bones']};sourceNames={b['index']:b['name'] for b in sourceRig['bones']};target=json.loads((ROOT/'output/rea-naruto/animation-pass/backspool-bind.json').read_text());target={b['name']:b for b in target};mapping=json.loads((OUT/'backspool-body-mapping.json').read_text())['bodyMappings'];identity=[0,0,0,1];rest={}
 def rq(n):
  if n not in rest:
   b=target[n];rest[n]=mul(rq(b['parent']) if b['parent'] in target else identity,b['quaternion'])
  return rest[n]
 for n in target:rq(n)
 byname={t['boneName']:t for t in src['tracks'] if t['channel']=='skeletalRotation'};mapping={m['targetName']:m['sourceName'] for m in mapping}
 for side,prefix in [('Left','L_'),('Right','R_')]:
  for finger in ['Thumb','Index','Middle','Ring','Pinky']:
   for index,suffix in enumerate(['','1','2','End'],1):
    tn='mixamorig'+side+'Hand'+finger+str(index);sn=prefix+finger+suffix
    if tn not in target or sn not in sourceBones:raise ValueError('Missing finger correspondence '+tn+' / '+sn)
    mapping[tn]=sn
 # Align anatomical rest directions before applying animated model-axis deltas.
 # The bind-file world transforms include an external 180Y model rotation; use
 # recomputed local-hierarchy transforms above, never that external transform.
 positions={}
 def rp(n):
  if n not in positions:
   bone=target[n];parent=bone['parent'];v=rotate(rest[parent] if parent in target else identity,bone['position']);positions[n]=[a+b for a,b in zip(rp(parent) if parent in target else [0,0,0],v)]
  return positions[n]
 for n in target:rp(n)
 chains=[['mixamorigHips','mixamorigSpine','mixamorigSpine1','mixamorigSpine2','mixamorigNeck','mixamorigHead']]+[['mixamorig'+side+part for part in ['Shoulder','Arm','ForeArm','Hand']] for side in ['Left','Right']]+[['mixamorig'+side+part for part in ['UpLeg','Leg','Foot','ToeBase']] for side in ['Left','Right']]
 chains += [['mixamorig'+side+'Hand'+finger+str(i) for i in range(1,5)] for side in ['Left','Right'] for finger in ['Thumb','Index','Middle','Ring','Pinky']]
 calibration={}
 for chain in chains:
  for n,child in zip(chain,chain[1:]):
   tv=[b-a for a,b in zip(positions[n],positions[child])];sv=[b-a for a,b in zip(sourceBones[mapping[n]]['derivedWorldPosition'],sourceBones[mapping[child]]['derivedWorldPosition'])];calibration[n]=align(tv,sv)
  calibration[chain[-1]]=calibration[chain[-2]]
 # A palm has two anatomical axes: wrist-to-middle and index-to-pinky.
 # Resolve the residual twist rather than inheriting an arbitrary forearm roll.
 for side in ['Left','Right']:
  hand='mixamorig'+side+'Hand';middle=hand+'Middle1';index=hand+'Index1';pinky=hand+'Pinky1'
  def difference(points,a,b):return [y-x for x,y in zip(points[a],points[b])]
  tp={n:positions[n] for n in [hand,middle,index,pinky]};sp={n:sourceBones[mapping[n]]['derivedWorldPosition'] for n in tp}
  tf=difference(tp,hand,middle);sf=difference(sp,hand,middle);primary=align(tf,sf);axis=[x/math.sqrt(sum(y*y for y in sf)) for x in sf]
  ta=rotate(primary,difference(tp,index,pinky));sa=difference(sp,index,pinky)
  def projected(v):
   d=sum(x*y for x,y in zip(v,axis));v=[x-d*y for x,y in zip(v,axis)];n=math.sqrt(sum(x*x for x in v))
   if n<1e-8:raise ValueError('Degenerate palm frame')
   return [x/n for x in v]
  ta=projected(ta);sa=projected(sa);cross=[ta[1]*sa[2]-ta[2]*sa[1],ta[2]*sa[0]-ta[0]*sa[2],ta[0]*sa[1]-ta[1]*sa[0]];angle=math.atan2(sum(a*b for a,b in zip(axis,cross)),sum(a*b for a,b in zip(ta,sa)));twist=[*[x*math.sin(angle/2) for x in axis],math.cos(angle/2)];calibration[hand]=mul(twist,primary)
 duration=src['durationSeconds'];times=[i/60 for i in range(math.ceil(duration*60))]+[duration];values={n:[] for n in target}
 for t in times:
  sourceWorldDelta={}
  def source_delta(name):
   if name not in sourceWorldDelta:
    bone=sourceBones[name];parent=source_delta(sourceNames[bone['parent']]) if bone['parent']>=0 else identity;local=sample(byname[name],t) if name in byname else identity;sourceWorldDelta[name]=mul(parent,local)
   return sourceWorldDelta[name]
  wanted={n:mul(source_delta(sn),mul(calibration[n],rest[n])) for n,sn in mapping.items()};world={}
  def wq(n):
   if n not in world:
    b=target[n];parent=wq(b['parent']) if b['parent'] in target else identity;world[n]=wanted.get(n,mul(parent,b['quaternion']));q=norm(mul(inv(parent),world[n]));prev=values[n][-4:]
    if prev and sum(x*y for x,y in zip(prev,q))<0:q=[-x for x in q]
    values[n]+=q
   return world[n]
  for n in target:wq(n)
 tracks=[{'name':n+'.quaternion','type':'quaternion','times':times,'values':v} for n,v in values.items()]
 tracks +=[{'name':n+'.position','type':'vector','times':[0,duration],'values':b['position']*2} for n,b in target.items()]
 # C_Hip is the root of the body hierarchy, not a limb-length parameter.
 # Preserve its source-local movement separately from Trans/Layer/Map travel.
 # This optional candidate policy never changes the immutable earlier exports.
 if preserve_pelvis:
  hip=next((tr for tr in src['tracks'] if tr['channel']=='skeletalTranslation' and tr['boneName']=='C_Hip'),None)
  rest_hip=sourceBones['C_Hip']['defaultPoseModelSpaceOffset'][:3]
  scale=positions['mixamorigHips'][1]/sourceBones['C_Hip']['derivedWorldPosition'][1]
  if not math.isfinite(scale) or scale<=0:raise ValueError('Invalid pelvis unit conversion')
  if hip:
   values=[]
   for t in times:
    ts=hip['timesSeconds'];i=max(0,bisect.bisect_right(ts,t)-1);a=hip['values'][i]
    if i+1<len(ts):
     f=(t-ts[i])/(ts[i+1]-ts[i]);a=[x+(y-x)*f for x,y in zip(a,hip['values'][i+1])]
    values.extend(target['mixamorigHips']['position'][j]+(a[j]-rest_hip[j])*scale for j in range(3))
   tr=next(tr for tr in tracks if tr['name']=='mixamorigHips.position');tr.update(times=times,values=values)
 record={'name':'Forspoken vault pilot — parent-composed source-delta experiment','duration':duration,'tracks':tracks,'userData':{'sourceSha256':src['sourceSha256'],'sourceAnimationId':src['animationId'],'retargetVerified':False,'gameplayIntegrated':False,'sourceRootTranslationApplied':False,'interpretation':'parent-composed model-space deltas per Ghidra140507700; authored target correspondence + anatomical rest-axis calibration; standard slerp approximation; root/contact not integrated','mappedBodyBones':22,'mappedFingerBones':40,'handFrameCalibration':True,'anatomicalRestCalibration':True,'calibrationWorldSwings':calibration}}
 if preserve_pelvis:record['userData'].update(pelvisTranslationPolicy='Source C_Hip delta from source rest, scaled by target/source pelvis rest height; limb offsets fixed; Trans/Layer/Map excluded',pelvisUnitScale=scale,pelvisTranslationApplied=hip is not None)
 return record

def main(animation_id='2811b68d'):
 src=json.loads((OUT/('vault-source-tracks/'+animation_id+'.json')).read_text());record=retarget(src)
 (OUT/('backspool-vault-pilot.json' if animation_id=='2811b68d' else 'backspool-vault-'+animation_id+'.json')).write_text(json.dumps(record,separators=(',',':'))+'\n');print('Pilot only:',record['userData']['mappedBodyBones'],'mapped body bones at source duration',record['duration'])
if __name__=='__main__':
 import argparse
 parser=argparse.ArgumentParser();parser.add_argument('--animation-id',default='2811b68d');main(parser.parse_args().animation_id)
