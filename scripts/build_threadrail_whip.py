"""Isolated whip-cast candidate; keeps the cartridge and Fusion V6 rollbacks intact."""
from pathlib import Path
import re
R=Path(__file__).resolve().parents[1]
s=(R/'SIGHTLINE_BACKSPOOL_CARTRIDGE.html').read_text()
def change(old,new):
 global s
 assert s.count(old)==1,(old[:100],s.count(old))
 s=s.replace(old,new,1)
start=s.index('/* Authored cartridge timeline;');end=s.index('})(typeof window',start);end=s.index(';',end)+1
s=s[:start]+(R/'scripts/game_whip_cartridge_deployment.js').read_text()+s[end:]
change((R/'scripts/game_threadrail_cartridge_visuals.js').read_text(),(R/'scripts/game_threadrail_cartridge_visibility.js').read_text())
change('const threadrailGame=(()=>{',(R/'scripts/game_threadrail_whip.js').read_text()+'\nconst threadrailGame=(()=>{')
change(' const mastery=createRailMastery();',' const whipCast=createThreadrailWhip(THREE,()=>model);\n const mastery=createRailMastery();')
start=s.index(' function applyCartridgePose(){');end=s.index(' const pendingDevice=',start)
s=s[:start]+s[end:]
change("const deploy=createCartridgeDeployment({valid:validAnchor,hand:index=>{if(pendingAnchor)index=1;", "const deploy=createCartridgeDeployment({valid:validAnchor,gesture:index=>whipCast.gesture(index),handIndex:index=>pendingAnchor?1:index,hand:index=>{")
change("const index=pendingAnchor?1:shot.index,pair=index?'B':'A';", "const index=shot.handIndex,pair=index?'B':'A';")
change("if(dep.clock<shot.releaseAt-.16)continue;", "if(dep.clock<shot.gestureAt)continue;")
# Index-to-pinky cross product points into the palm on this rig; outward-from-hip
# was selecting the back of the glove. Preserve the anatomically correct side.
change('if(normal.dot(outward)<0)normal.negate();','if(normal.dot(outward)>0)normal.negate();')
# Aim is a held-object state, preceding the deployment/cast timeline.
change('const busy=new Set();for(const shot of dep.shots)', "const busy=new Set();if(precisionAt!==null){const index=pendingAnchor?1:0,pair=index?'B':'A',pose=cartridgeHandPose(index);if(pose){cartridgeVisuals.pose('aim-cartridge-'+pair,pose.position,pose.normal,'held',pair,camera.position);busy.add(pair);}}for(const shot of dep.shots)")
change("cartridgeHandPose(index).normal,'folded',pair,camera.position)", "cartridgeHandPose(index).normal,'held',pair,camera.position)")
change('cartridgeContact(a).addScaledVector(normal,.01)', 'cartridgeContact(a).addScaledVector(normal,.016)')
change('cartridgeContact(a).addScaledVector(n,.01)', 'cartridgeContact(a).addScaledVector(n,.016)')
change('cartridgeContact(shot.target).addScaledVector(n,.01)', 'cartridgeContact(shot.target).addScaledVector(n,.016)')

change("function lifecycle(why){cartridgeVisuals.reset();", "function lifecycle(why){whipCast.reset();cartridgeVisuals.reset();")
change('beginFrame:()=>{restoreSurfPose();', 'beginFrame:()=>{whipCast.restore();restoreSurfPose();')
change("deploy.cancel('COMBAT INTERRUPT');deploy.update(dt);drawProjectiles();", "deploy.cancel('COMBAT INTERRUPT');")
change('applySurfPose(dt);applyCartridgePose();', "applySurfPose(dt);if(backspoolCombat.staggered()||backspoolCombat.activeAction()||backspoolPowers.isRetracing()||backspoolPreviewActive()||[P.IMPACT,P.UNCONTROLLED].includes(s.mode))deploy.cancel('CAST INTERRUPTED');if(precisionAt!==null)whipCast.aim(pendingAnchor?1:0,clockT-precisionAt);else whipCast.apply(deploy.state(),Math.min(dt,.05));deploy.update(dt);drawProjectiles();")
change("if(precisionAt!==null)return backspoolFlow.playSource('tetherAim',clockT-precisionAt,true,.08);", "if(precisionAt!==null){if(s.onGround&&Math.hypot(s.vel.x,s.vel.z)<.3)return backspoolFlow.playSource('relaxedIdle',clockT,true,.12);return false;}")
change('cartridgeAsset:cartridgeVisuals.state(),snapback:', 'cartridgeAsset:cartridgeVisuals.state(),whipCast:whipCast.state(),snapback:')
change("function quickRail(){if(!movementReady())", "function quickRail(){if(!whipCast.isReady()||!cartridgeVisuals.isReady()){say('CARTRIDGE LOADING');return false;}if(!movementReady())")
change("function precisionStart(){", "function precisionStart(){const d=deploy.state();if(d.shots.some(shot=>shot.status!=='attached'||d.clock<shot.gestureUntil)){say('CARTRIDGE CASTING');return false;}if(!whipCast.isReady()||!cartridgeVisuals.isReady()){say('CARTRIDGE LOADING');return false;}")
# Include actual floor meshes in aiming and projectile collision, not only AABB buildings.
terrain = """
 let cartridgeTerrainCount=-1,cartridgeTerrainMeshes=[];
 function cartridgeTerrainHit(ray,far=120){if(cartridgeTerrainCount!==walkables.length){cartridgeTerrainCount=walkables.length;cartridgeTerrainMeshes=walkables.filter(m=>m===ground||m===plaza||m.name?.startsWith('Road /'));for(const mesh of cartridgeTerrainMeshes)mesh.updateWorldMatrix(true,false);}const cast=new THREE.Raycaster(ray.origin,ray.direction,0,far);return cast.intersectObjects(cartridgeTerrainMeshes,false)[0]||null;}
"""
change(' function targetSurface(){const a=backspoolAdvanced.findAnchor();return a&&!a.enemySnapshot?{contact:V(a.contact),normal:V(a.normal),owner:a.owner||a.part}:null;}',terrain+" function targetSurface(){const a=backspoolAdvanced.findAnchor();if(a?.enemySnapshot)return null;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);const hit=cartridgeTerrainHit(ray.ray);if(hit&&(!a||hit.distance<camera.position.distanceTo(V(a.contact))))return{contact:hit.point,normal:(hit.face?.normal||new THREE.Vector3(0,1,0)).clone().transformDirection(hit.object.matrixWorld),owner:hit.object};return a?{contact:V(a.contact),normal:V(a.normal),owner:a.owner||a.part}:null;}")
change('options.push({contact:q,normal:new THREE.Vector3(0,1,0),owner});',"const surfaceHit=cartridgeTerrainHit(new THREE.Ray(p.clone().add(new THREE.Vector3(0,.03,0)),new THREE.Vector3(0,-1,0)),.65);options.push(surfaceHit?{contact:surfaceHit.point,normal:(surfaceHit.face?.normal||new THREE.Vector3(0,1,0)).clone().transformDirection(surfaceHit.object.matrixWorld),owner:surfaceHit.object}:{contact:q,normal:new THREE.Vector3(0,1,0),owner});")
change('  if(from.y>=0&&to.y<=0&&delta.y<0){',"  const floorHit=cartridgeTerrainHit(ray,length+.015);if(floorHit&&(!nearest||floorHit.distance<nearest.distance))nearest={point:floorHit.point,distance:floorHit.distance,owner:floorHit.object};\n  if(from.y>=0&&to.y<=0&&delta.y<0){")
# The inherited combat panel hides touchButtons for Backspool; keep the throw reachable there.
change('function present(){drawCartridgeAssets();', "function present(){const touchHost=document.body.classList.contains('touchPlay')?$('backspoolCombatHUD')?.querySelector('.combatTouch'):$('touchButtons');if(touchHost&&$('tThreadrail').parentNode!==touchHost)touchHost.append($('tThreadrail'));drawCartridgeAssets();")
change("if(up)b.onpointerup=b.onpointercancel=up;$('touchButtons').append(b);", "if(up){b.onpointerup=up;b.onpointercancel=b.onlostpointercapture=()=>{precisionAt=null;aimMarker.visible=false;};}$('touchButtons').append(b);")
change("if(document.body.classList.contains('touchPlay'))for(const id of ['tAfterstep','tThreadrail','tDriveModes'])", "if(document.body.classList.contains('touchPlay'))for(const id of ['tAfterstep','tDriveModes'])")
change('</head>', '<style>body.touchPlay #tThreadrail{min-height:44px;touch-action:none}</style></head>')
change('<title>Tripo Cartridge — ', '<title>Forspoken Whip Cast — ')
# Environment is composed last so subsequent gameplay rebuilds retain it.
from build_vertical_city import apply_environment
s=apply_environment(s)
(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html').write_text(s)
print('Built SIGHTLINE_BACKSPOOL_WHIP_THROW.html')
