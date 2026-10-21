#!/usr/bin/env python3
import json,math
from inspect_forspoken_pose_consumption import ROOT,IDENTITY,consume,inspect
from inspect_forspoken_amdl import qmul
rig=json.loads((ROOT/'hu000-rig.json').read_text());bones=rig['bones']
t={0:[0,0,0]}
for b in bones[1:]:t[b['index']]=[b['derivedWorldPosition'][j]-bones[b['parent']]['derivedWorldPosition'][j] for j in range(3)]
q=[0,math.sin(.25),0,math.cos(.25)]
out=consume(rig,{1:q},t)
assert math.dist(out['accumulatedDeltaRotations'][2],q)<1e-6
assert math.dist(out['modelRotations'][2],qmul(q,bones[2]['sourceRotationXYZW']))<1e-6
root=consume(rig,{0:q,1:q},dict(t,**{}))
assert math.dist(root['modelRotations'][2],out['modelRotations'][2])<1e-6
assert root['modelRotations'][0]==q
for b in bones[1:]:
 p=b['parent'];i=b['index']
 assert abs(math.dist(out['modelPositions'][i],out['modelPositions'][p])-math.dist(t[i],[0,0,0]))<1e-6
report=inspect();assert report['validation']['defaultPosePositionMaxError']<1e-5
print('Pose consumer default5977bones, parent delta inheritance, root isolation and fixed displacement lengths pass')
