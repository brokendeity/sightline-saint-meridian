#!/usr/bin/env python3
"""Assess an authored anatomical swing calibration; no retargeted clips are written."""
import json,math
from pathlib import Path
from inspect_forspoken_amdl import qmul,qrotate
from profile_forspoken_movement import sample
ROOT=Path('output/rea-forspoken');IDENTITY=[0.,0.,0.,1.]
def unit(v):
 n=math.sqrt(sum(x*x for x in v))
 if n<1e-10:raise ValueError('Degenerate axis')
 return [x/n for x in v]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def swing(a,b):
 a=unit(a);b=unit(b);d=max(-1,min(1,dot(a,b)))
 if d<-.999999:raise ValueError('Antiparallel axis requires explicit twist choice')
 c=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
 return unit(c+[1+d])
def angle(a,b):return math.degrees(math.acos(max(-1,min(1,dot(unit(a),unit(b))))))
def assess():
 rig=json.loads((ROOT/'hu000-rig.json').read_text());bones=rig['bones'];source={b['name']:b for b in bones}
 target=json.loads(Path('output/rea-naruto/animation-pass/backspool-bind.json').read_text());target={b['name']:b for b in target};world={}
 def wq(n):
  if n not in world:
   b=target[n];world[n]=qmul(wq(b['parent']) if b['parent'] in target else IDENTITY,b['quaternion'])
  return world[n]
 for n in target:wq(n)
 pairs=[('L_Arm','L_ForeArm','mixamorigLeftArm','mixamorigLeftForeArm'),('L_ForeArm','L_Hand','mixamorigLeftForeArm','mixamorigLeftHand'),('R_Arm','R_ForeArm','mixamorigRightArm','mixamorigRightForeArm'),('R_ForeArm','R_Hand','mixamorigRightForeArm','mixamorigRightHand'),('L_UpLeg','L_Leg','mixamorigLeftUpLeg','mixamorigLeftLeg'),('L_Leg','L_Foot','mixamorigLeftLeg','mixamorigLeftFoot'),('R_UpLeg','R_Leg','mixamorigRightUpLeg','mixamorigRightLeg'),('R_Leg','R_Foot','mixamorigRightLeg','mixamorigRightFoot')]
 corrections=[]
 for sn,sc,tn,tc in pairs:
  srcdir=unit([source[sc]['derivedWorldPosition'][j]-source[sn]['derivedWorldPosition'][j] for j in range(3)])
  target_local_axis=unit(target[tc]['position']);tdir=qrotate(world[tn],target_local_axis)
  correction=swing(tdir,srcdir)
  corrections.append(dict(sourceBone=sn,sourceChild=sc,targetBone=tn,targetChild=tc,
   sourceRestModelDirection=srcdir,targetRestModelDirection=tdir,worldSwingQuaternionXYZW=correction,
   originalRestMismatchDegrees=angle(srcdir,tdir)))
 clips=[]
 for aid in ['2811294e','2811294f','2811296d','28112951','281103f8','2811df78']:
  pack='40016-ntl000' if aid in ['2811294e','2811294f','2811296d','28112951'] else '15667-pkr000'
  doc=json.loads((ROOT/'movement-source-tracks'/pack/(aid+'.json')).read_text());tracks={t['boneName']:t for t in doc['tracks'] if t['channel']=='skeletalRotation'}
  old=[];new=[]
  for fraction in [0,.125,.25,.375,.5,.625,.75,.875,1]:
   time=doc['durationSeconds']*fraction;accum={0:IDENTITY}
   def delta(n):
    b=source[n];i=b['index']
    if i not in accum:
     parent=delta(bones[b['parent']]['name']) if b['parent']>=0 else IDENTITY
     accum[i]=qmul(parent,sample(tracks[n],time,True) if n in tracks else IDENTITY)
    return accum[i]
   for c in corrections:
    d=delta(c['sourceBone']);wanted=qrotate(d,c['sourceRestModelDirection']);rest=world[c['targetBone']];axis=unit(target[c['targetChild']]['position'])
    old.append(angle(wanted,qrotate(qmul(d,rest),axis)))
    newq=qmul(qmul(d,c['worldSwingQuaternionXYZW']),rest)
    new.append(angle(wanted,qrotate(newq,axis)))
  clips.append(dict(animationId='0x'+aid,originalPrimaryAxisMaxErrorDegrees=max(old),calibratedPrimaryAxisMaxErrorDegrees=max(new),calibratedPrimaryAxisMeanErrorDegrees=sum(new)/len(new)))
 return dict(schema='forspoken-rest-swing-assessment-v1',status='authored target calibration algebra, not original asset verification',
  targetBasis='Recomposed from native LOCAL bind transforms; external FBX worldQuaternion180Y is intentionally excluded. Both rigs then have anatomical left +X, up +Y, forward approximately +Z.',
  formula='targetWorldQ = sourceAccumulatedDelta * restWorldSwing * targetNativeRestWorldQ',
  corrections=corrections,clips=clips,
  limitations=['Single primary-axis alignment leaves twist underconstrained; hands/palms need secondary anatomical axes or explicit authored roll calibration.',
    'Fixed target lengths and preserved hierarchy are necessary but do not prove contact, jacket safety or acceptable target animation.',
    'Do not apply additional180Y from exported worldQuaternion: native local rig reconstruction already establishes shared model axes.'])
if __name__=='__main__':
 doc=assess();(ROOT/'rest-swing-assessment.json').write_text(json.dumps(doc,indent=2)+'\n')
 assert max(c['calibratedPrimaryAxisMaxErrorDegrees'] for c in doc['clips'])<.0001
 print(json.dumps(doc['clips'],indent=2))
