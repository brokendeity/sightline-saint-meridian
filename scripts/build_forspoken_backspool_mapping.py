"""Preparation only: explicit authored body correspondence, no motion export."""
import hashlib,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'output/rea-forspoken'
def mul(a,b):
 x,y,z,w=a;X,Y,Z,W=b;return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]
def inv(q):return [-q[0],-q[1],-q[2],q[3]]
def main():
 sp=OUT/'hu000-rig.json';tp=ROOT/'output/rea-naruto/animation-pass/backspool-bind.json';rig=json.loads(sp.read_text());src={b['name']:b for b in rig['bones']};targets={b['name']:b for b in json.loads(tp.read_text())};mapping={'mixamorigHips':'C_Hip','mixamorigSpine':'C_Spine','mixamorigSpine1':'C_Spine1','mixamorigSpine2':'C_Spine3','mixamorigNeck':'C_Neck','mixamorigHead':'C_Head'}
 for side,short in [('Left','L'),('Right','R')]:
  for t,s in [('Shoulder','Shoulder'),('Arm','Arm'),('ForeArm','ForeArm'),('Hand','Hand'),('UpLeg','UpLeg'),('Leg','Leg'),('Foot','Foot'),('ToeBase','Toe')]:mapping['mixamorig'+side+t]=short+'_'+s
 rows=[]
 for t,s in mapping.items():
  a=src[s];b=targets[t];sq=a['sourceRotationXYZW'];tq=b['worldQuaternion'];identity=mul(sq,inv(sq));rest=mul(identity,tq)
  error=1-abs(sum(x*y for x,y in zip(rest,tq)))
  if abs(error)>1e-5:raise ValueError('Rest mapping drift')
  rows.append(dict(sourceName=s,sourceBoneId=hex(a['sourceBoneId']),sourceIndex=a['index'],targetName=t,sourceWorldRestQuaternion=sq,targetWorldRestQuaternion=tq,targetLocalRestQuaternion=b['quaternion'],targetLocalPosition=b['position'],restMappingError=abs(error)))
 record=dict(schema='forspoken-backspool-correspondence-v1',status='authored body mapping; no decoded motion exported',sourceRigSha256=hashlib.sha256(sp.read_bytes()).hexdigest(),targetBindSha256=hashlib.sha256(tp.read_bytes()).hexdigest(),bodyMappings=rows,policy={'rotation':'candidate world delta: sourceAnimatedWorld * inverse(sourceWorldRest), then delta * targetWorldRest; requires playback validation','translation':'preserve target rest translations and limb lengths; source root travel must be routed through collision-checked physics','unmapped':'retain native target rest/secondary policies; do not assign source garment bones to jacket','spine':'authored correspondence collapses additional source spine joints; validate torso bends before admission'},pending=['Packed rotation/vector decoder','Source temporal accumulation and coordinate conventions during motion','Root travel scale and contact markers','Target animation tests, joint continuity and jacket deformation','Visual validation against original movement'])
 (OUT/'backspool-body-mapping.json').write_text(json.dumps(record,indent=2)+'\n');print('Prepared',len(rows),'body correspondences; no gameplay changes')
if __name__=='__main__':main()
