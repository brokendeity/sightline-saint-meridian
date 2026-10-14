from pathlib import Path
root=Path(__file__).resolve().parents[1];p=root/'SIGHTLINE_SAINT_MERIDIAN_TOON.html';s=p.read_text();assert '// Static mesh broadphase preserves' not in s
s=s.replace('const cityImportPromise=importBlenderCity();',(root/'scripts/game_runtime_polish.js').read_text()+'\nconst cityImportPromise=importBlenderCity();',1)
s=s.replace('function updateDroneSearchlight(e){','function updateDroneSearchlight(e,dt=1/60){',1)
a=s.index('const ray=new THREE.Raycaster(origin,scan,0,170),hit=ray.intersectObjects(walkables,false)[0],length=hit?hit.distance:170;',s.index('function updateDroneSearchlight'))
old='const ray=new THREE.Raycaster(origin,scan,0,170),hit=ray.intersectObjects(walkables,false)[0],length=hit?hit.distance:170;'
new='''e.searchClock=(e.searchClock??((enemies.indexOf(e)%9)*.02))+dt;const near=origin.distanceToSquared(s.pos)<70*70,interval=e.alertState==='CHASE'||near?0:origin.distanceToSquared(camera.position)>350*350?.18:.12;let hit=e.cachedSearchHit;
 if(!e.searchCached||e.searchClock>=interval){const end=origin.clone().addScaledVector(scan,170);beamRaycaster.set(origin,scan);beamRaycaster.far=170;hit=beamRaycaster.intersectObjects(obstacleCandidates(origin,end,.1,walkables),false)[0]||null;e.cachedSearchHit=hit;e.searchCached=true;e.searchClock=0;runtimePolish.beamRaycasts++;}else runtimePolish.beamCacheHits++;const length=hit?Math.min(170,origin.distanceTo(hit.point)):170;'''
s=s[:a]+s[a:].replace(old,new,1)
s=s.replace('updateDroneSearchlight(e);e.shot-=dt','updateDroneSearchlight(e,dt);e.shot-=dt',1)
old="function enemyHasSight(e){if(e.blindTimer>0)return false;const direction=s.pos.clone().add(new THREE.Vector3(0,1,0)).sub(e.group.position),distance=direction.length();const ray=new THREE.Raycaster(e.group.position,direction.normalize(),0,distance);return !ray.intersectObjects(cameraObstacles,false).length}"
new="function enemyHasSight(e){if(e.blindTimer>0)return false;const target=s.pos.clone().add(new THREE.Vector3(0,1,0)),direction=target.clone().sub(e.group.position),distance=direction.length();visibilityRaycaster.set(e.group.position,direction.normalize());visibilityRaycaster.far=distance;return !visibilityRaycaster.intersectObjects(obstacleCandidates(e.group.position,target),false).length}"
assert old in s;s=s.replace(old,new,1)
a=s.index(' const rayStart=cam.focus.clone()',s.index('function updateCamera(dt)'));b=s.index('\n if(cameraShake',a)
s=s[:a]+" const rayStart=cam.focus.clone().add(new THREE.Vector3(0,flightAligned?0:.18,0));desired.copy(constrainCameraPosition(rayStart,desired,flightAligned));"+s[b:]
s=s.replace('const lookDistance=aiming?28:', 'camera.position.copy(constrainCameraPosition(rayStart,camera.position,flightAligned));const lookDistance=aiming?28:',1)
s=s.replace('function updateHUD(force=false){hudRefresh+=1/60;','function updateHUD(force=false,dt=1/60){hudRefresh+=dt;',1)
s=s.replace('railReadSystem.tick(dt);updateHUD();','railReadSystem.tick(dt);updateHUD(false,dt);',1)
old='function loop(){requestAnimationFrame(loop);const elapsed=Math.min(clock.getDelta(),.25),steps=Math.max(1,Math.ceil(elapsed/(1/60)));for(let i=0;i<steps;i++)tickFrame(elapsed/steps,false);renderNight(elapsed)}'
new='function loop(){requestAnimationFrame(loop);const elapsed=Math.min(clock.getDelta(),.25),steps=frameScheduler.consume(elapsed);for(let i=0;i<steps;i++)tickFrame(frameScheduler.step,false);renderNight(elapsed)}'
assert old in s;s=s.replace(old,new,1)
s=s.replace('function activateGame(){document.body','function activateGame(){frameScheduler.reset();document.body',1)
s=s.replace('function pauseGame(){if(courier.resultsOpen)return;','function pauseGame(){if(courier.resultsOpen)return;frameScheduler.reset();',1)
s=s.replace('presentation:presentationPolishState(),courier:', 'presentation:presentationPolishState(),runtime:runtimePolishState(),courier:',1)
p.write_text(s)
