"""Frame pacing candidate: removes measured frame-time spikes without changing behaviour.

Builds on the impact FX candidate. Each hook replaces a hot path found by
scripts/vertical-v02/profile_frame_spikes.cjs with an equivalent cheaper one;
results are unchanged by construction (same lookups, same order, same outputs).
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Impact_FX_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
# Halo trucks at a junction checked every walker against every pedestrian edge with a linear find, every frame.
# Edge ids are 'w'+index (the walker tick already indexes them this way); the id check keeps the result identical.
replace("const e=roadNetwork.pedestrian.edges.find(e=>e.id===w.routeEdge);return e&&e.kind==='crosswalk'",
 "const e=w.routeEdge?roadNetwork.pedestrian.edges[+w.routeEdge.slice(1)]:null;return e&&e.id===w.routeEdge&&e.kind==='crosswalk'",
 'indexed pedestrian edge lookup in truck junction yield')
module='scripts/game_v02_frame_pacing.js';version=sha(R/module)[:12]
replace('<script src="scripts/v02_exact_camera_rays.js"></script>',
 '<script src="scripts/v02_exact_camera_rays.js"></script><script src="'+module+'?v='+version+'"></script>','load the frame pacing module')
# Ray broadphase: reuse world bounds while the mesh's transform, matrices, parent matrix and geometry bounds are bit-identical.
replace("let box=mesh.userData.collisionBounds;if(!box){mesh.updateMatrixWorld();if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)}",
 "let box=mesh.userData.collisionBounds;if(!box){if(window.v02FramePacing)box=v02FramePacing.worldBox(mesh);else{mesh.updateMatrixWorld();if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)}}",
 'exact cached ray broadphase bounds')
# Drone searchlights within 70 m cast a 170 m ray every frame through the native per-triangle path; use the exact partitioned path.
replace("hit=beamRaycaster.intersectObjects(obstacleCandidates(origin,end,.1,walkables),false)[0]||null",
 "hit=(window.v02CameraRays?v02CameraRays.intersect(beamRaycaster,obstacleCandidates(origin,end,.1,walkables)):beamRaycaster.intersectObjects(obstacleCandidates(origin,end,.1,walkables),false))[0]||null",
 'partitioned drone searchlight rays')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FRAME_PACING.html';(R/entry).write_text(text)
report={**b,'framePacingModule':module,'framePacingModuleSHA256':sha(R/module),'status':'BUILT frame pacing candidate; matched profile and regressions pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Performance only: equivalent replacements for profiled hot paths. Behaviour, geometry and rules unchanged.'}
(D/'V02_Frame_Pacing_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
