"""Separate V02 graybox using the exact latest gameplay; V1 remains unchanged."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2]
s=(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html').read_text();source_hash=hashlib.sha256(s.encode()).hexdigest()
old=(R/'scripts/game_vertical_city.js').read_text();assert s.count(old)==1,'V1 module/source mismatch'
# Preserve current real train/traffic as a provisional starting point, remove superseded V1 architecture.
v=old;a=v.index('function construct(){');b=v.index(' const points=',a);v=v[:a]+'function construct(){const L=layout;'+v[b:]
a=v.index(' for(const x of [62,104])');b=v.index(' for(const [j,y]of L.trafficBands.entries())',a);v=v[:a]+v[b:]
s=s.replace(old,v,1)
from encounter_adapter import compose_encounters
s=compose_encounters(s)
# Native warnings must describe the hero's current control preset. Traversal
# reservesX/R for cartridges; its unconditional evade isC/D-padDown.
old="showBanner('INCOMING SHOT','MOVE OFF THE RED LINE · E / X DODGE · Q / LB TIMED BRACE')";assert s.count(old)==1
hint="characterState().active==='backspool'?(document.body.classList.contains('touchPlay')?'MOVE OFF THE RED LINE · EVADE OR GUARD':window.threadrailGame?.preset()==='traversal'?'MOVE OFF THE RED LINE · C / D-PAD DOWN EVADE · RMB / LT GUARD':'MOVE OFF THE RED LINE · C / X EVADE · RMB / LT GUARD'):(document.body.classList.contains('touchPlay')?'MOVE OFF THE RED LINE · DODGE OR BRACE':'MOVE OFF THE RED LINE · E / X DODGE · Q / LB TIMED BRACE')"
s=s.replace(old,"showBanner('INCOMING SHOT',"+hint+")",1)
# During fast drops the smoothed focus can remain above a roof while the
# actor is already below it. In that descent, collision starts at the body,
# rather than certifying visibility only from that stale composition target.
old='const rayStart=cam.focus.clone().add(new THREE.Vector3(0,flightAligned?0:.18,0));'
assert s.count(old)==1
new="const rayStart=!flightAligned&&!s.onGround&&s.vel.y<-2&&characterState().active==='backspool'?s.pos.clone().add(new THREE.Vector3(0,1.5,0)):cam.focus.clone().add(new THREE.Vector3(0,flightAligned?0:.18,0));"
s=s.replace(old,new,1)
# A low landing pose can be hidden even when the standing focus clears a
# roof edge. Correct only an observed opaque blockage of both actual body
# anchors, using the same final shared collision solver.
old='camera.position.copy(constrainCameraPosition(rayStart,camera.position,flightAligned));const lookDistance='
assert s.count(old)==1
repair="""camera.position.copy(constrainCameraPosition(rayStart,camera.position,flightAligned));
 if(!flightAligned&&characterState().active==='backspool'){
  model.updateMatrixWorld(true);const body=[];let blocked=0;
  for(const name of ['mixamorigHips','mixamorigHead']){const bone=model.getObjectByName(name);if(!bone)break;const point=bone.getWorldPosition(new THREE.Vector3()),delta=point.clone().sub(camera.position),distance=delta.length();body.push(point);visibilityRaycaster.set(camera.position,delta.normalize());visibilityRaycaster.far=Math.max(0,distance-.02);const hits=visibilityRaycaster.intersectObjects(obstacleCandidates(camera.position,point),false);if(hits.some(hit=>{const m=Array.isArray(hit.object.material)?hit.object.material[hit.face?.materialIndex||0]:hit.object.material;return m?.visible!==false&&!(m?.transparent&&m.opacity<.5)}))blocked++;}
  if(body.length===2&&blocked===2)camera.position.copy(constrainCameraPosition(body[0],camera.position,false));
 }
 const lookDistance="""
s=s.replace(old,repair,1)
needle='function updatePlayer(dt,realDt=dt)';assert s.count(needle)==1;s=s.replace(needle,(R/'scripts/game_vertical_district_v02.js').read_text()+'\n'+needle,1)
# External candidate module executes after all shared combat/mission declarations.
needle='</body>';assert s.count(needle)==1;s=s.replace(needle,'<script src="scripts/game_vertical_encounters_v02.js"></script><script src="scripts/game_vertical_market_v02.js"></script><script src="scripts/game_vertical_pursuit_v02.js"></script><script src="scripts/game_vertical_discovery_v02.js"></script>'+needle,1)
old='verticalCity.build();}},100);';assert s.count(old)==1;s=s.replace(old,'verticalCity.build();verticalDistrict.build();}},100);')
old='if(!start)return buildingColliders.flatMap(c=>c.parts||[c]).concat(propColliders);';assert s.count(old)==1;s=s.replace(old,'if(!start)return buildingColliders.flatMap(c=>c.parts||[c]).concat(propColliders,window.verticalDistrict?.colliders()||[]);')
old='.concat(propColliders.filter(c=>c.box.intersectsBox(area)));';assert s.count(old)==1;s=s.replace(old,'.concat(propColliders.filter(c=>c.box.intersectsBox(area)),window.verticalDistrict?.colliders(start,end)||[]);')
old='return Math.max(h,window.backspoolFlow?.terrainHeight(x,z,currentY)??-Infinity)';assert s.count(old)==1;s=s.replace(old,'return Math.max(h,window.backspoolFlow?.terrainHeight(x,z,currentY)??-Infinity,window.verticalDistrict?.surfaceFeetAt(x,z,currentY)??-Infinity)')
# Only explicitly tagged new stair risers get ground step treatment; original colliders are unchanged.
old='for(const c of allColliders(start,end)){\n  const b=c.box;';assert s.count(old)==1;s=s.replace(old,'for(const c of allColliders(start,end)){\n  if(window.verticalDistrict?.stepRiserPass(start,c))continue;\n  const b=c.box;')
old='for(const c of allColliders(s.pos)){const b=c.box,lo=';assert s.count(old)==1;s=s.replace(old,'for(const c of allColliders(s.pos)){if(window.verticalDistrict?.stepRiserPass(s.pos,c))continue;const b=c.box,lo=')
# New grouped GLBs have immutable structural owners rather than one destructible
# mesh per collider. Honour that ownership in both impact mutation paths; keep
# decals, sound, debris and normal solid landing/collision responses active.
old='if(!c||c.prop||c.destroyed)return false;';assert s.count(old)==1;s=s.replace(old,'if(!c||c.prop||c.destroyed||c.nonDestructible||!c.mesh)return false;')
old='if(owner&&speed>=28&&!owner.destroyed)';assert s.count(old)==1;s=s.replace(old,'if(owner&&speed>=28&&!owner.destroyed&&!owner.nonDestructible)')
s=s.replace('<title>Forspoken Whip Cast — ', '<title>Saint Meridian V02 Graybox — ')
name='SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html';(R/name).write_text(s)
(R/'development/vertical-city-v02/V02_Graybox_Build.json').write_text(json.dumps({'entry':name,'sha256':hashlib.sha256(s.encode()).hexdigest(),'sourceEntry':'SIGHTLINE_BACKSPOOL_WHIP_THROW.html','sourceSHA256':source_hash,'scope':'V1 static vertical prototype replaced with Blender modular graybox only in candidate; actual train/scenic traffic retained provisionally. Original game and all older HTML untouched.','gate':'Input acceptance pending'},indent=2)+'\n')
print('Built',name)
