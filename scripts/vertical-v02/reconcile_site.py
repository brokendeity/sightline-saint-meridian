"""Reconcile design intent with live compound boxes. No gameplay certification."""
from pathlib import Path
import json,math
D=Path(__file__).resolve().parents[2]/'development/vertical-city-v02'
world=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text());study=json.loads((D/'blueprint-source/V02_CurrentBranch_SiteStudy_Manifest.json').read_text());old=json.loads((D/'blueprint-source/V02_Existing_Lots_Source_Reconstructed.json').read_text())['buildings']
def overlap(a,b):return all(a['min'][i]<b['max'][i]-1e-6 and a['max'][i]>b['min'][i]+1e-6 for i in range(3))
def bounds(x,y,z,w,h,d):return {'min':[x-w/2,y-h/2,z-d/2],'max':[x+w/2,y+h/2,z+d/2]}
def clashes(b):return [{'building':c['id'],'part':p['id'],'role':p['role']}for c in world['buildings']for p in c['parts']if overlap(b,p['box'])]
mapping=[]
for a,b in zip(old,world['buildings']):
 e=b['collisionEnvelope'];center=[(e['min'][i]+e['max'][i])/2 for i in range(3)];size=[e['max'][i]-e['min'][i]for i in range(3)]
 delta={'centerXZ':math.hypot(center[0]-a['x'],center[2]-a['z']),'width':size[0]-a['w'],'depth':size[2]-a['d'],'height':size[1]-a['h']}
 mapping.append({'blueprintID':a['id'],'runtimeID':b['id'],'sourceIndex':b['sourceIndex'],'comparison':'source index mapping; center/size checked','delta':delta,'envelopeMatches':max(abs(n)for n in delta.values())<.001,'actualPartCount':len(b['parts']),'visualBounds':b['visualWorldBounds']})
proposals=[]
for item in study['new_v02']['crossings']:
 b=bounds(item['x'],item['y']-.3,item['z'],item['width'],.6,item['depth']);head=bounds(item['x'],item['y']+1.1,item['z'],item['width'],2.2,item['depth']);hits=clashes(b);hh=clashes(head)
 proposals.append({**item,'deckBounds':b,'deckConflicts':hits,'headroomConflicts':hh,'spatialStatus':'conflict'if hits or hh else 'compound-box clear; gameplay not tested','adjustmentCandidates':[]})
 # Search local offsets without moving or resizing any existing building.
 for z in range(int(item['z'])-30,int(item['z'])+31,2):
  deck=bounds(item['x'],item['y']-.3,z,item['width'],.6,item['depth']);head=bounds(item['x'],item['y']+1.1,z,item['width'],2.2,item['depth'])
  if not clashes(deck) and not clashes(head):proposals[-1]['adjustmentCandidates'].append({'x':item['x'],'y':item['y'],'z':z,'status':'box/headroom precheck only; supports/endpoints/camera/normal-input traversal pending'})
spines=[]
for item in study['new_v02']['segmented_spines']:
 samples=[]
 for z in range(item['z0'],item['z1'],5):
  b=bounds(item['x'],item['y']+.95,z+2.5,6,2.5,5);hits=clashes(b)
  samples.append({'z0':z,'z1':z+5,'conflicts':hits,'box':b})
 spines.append({**item,'segments':samples,'blockedSegments':sum(bool(s['conflicts'])for s in samples)})
report={'authority':world['provenance'],'method':'Strict positive-volume AABB intersection against actual compound structural boxes; no triangle sweep, supports, facade portal, train or gameplay certification.','crossings':proposals,'segmentedSpines':spines,'v1Rejections':world['readiness']['vertical']['rejected'],'allV1FailuresPreserved':True}
(D/'V02_Clearance_Report.json').write_text(json.dumps(report,indent=2)+'\n')
manifest={'status':'LIVE SPATIAL RECONCILIATION; REVISED DESIGN STILL PENDING','authority':world['provenance'],'buildingMapping':mapping,'mappingMatches':sum(m['envelopeMatches']for m in mapping),'mappingMismatches':sum(not m['envelopeMatches']for m in mapping),'proposedCrossings':proposals,'spineSummary':[{'id':s['id'],'blockedSegments':s['blockedSegments'],'segmentCount':len(s['segments'])}for s in spines],'protected':{'buildings':len(world['buildings']),'activeLanes':sum(l['active']for l in world['roads']['lanes']),'pedestrianEdges':len(world['roads']['pedestrian']['edges']),'missionAnchors':len(world['missions']['anchors'])},'nextGate':'Measure active movement, resolve conflicts into ability-aware routes, then Blender blockout; do not import the schematic as final geometry.'}
(D/'V02_Reconciled_Site_Manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
lines=['# V02 live-world discrepancy report','',f"Live source: `{world['provenance']['commit']}`; entry SHA-256 `{world['provenance']['entrySHA256']}`.",'',f"310 index-mapped envelopes: {manifest['mappingMatches']} agree within 1 mm; {manifest['mappingMismatches']} differ. Matching outer envelopes do not prove imported facade or roof equivalence.",'','## Proposed crossings']
for c in proposals:lines.append(f"- {c['id']}: {c['spatialStatus']}; deck conflicts {len(c['deckConflicts'])}, headroom conflicts {len(c['headroomConflicts'])}. {len(c['adjustmentCandidates'])} local offsets pass box/headroom checks only.")
lines+=['','## Side spines']+[f"- {s['id']}: {s['blockedSegments']}/{len(s['segments'])} 5 m segments obstructed. Whole-span admission is unsuitable."for s in spines]
lines+=['','## Export gaps and next work','Roof top candidates are collision-box projections, not accepted walkable surfaces. Mission export covers the initialized mission only. Spawn/reset source entrypoints need a separate catalog. Source families, exact normalized meshes and world transforms are exported, allowing later triangle-level checks. No proposed route is certified. No game geometry has been changed in this phase.']
(D/'V02_Discrepancy_Report.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'matchingEnvelopes':manifest['mappingMatches'],'mismatches':manifest['mappingMismatches'],'crossings':[(c['id'],c['spatialStatus'],len(c['adjustmentCandidates']))for c in proposals],'spines':manifest['spineSummary']},indent=2))
