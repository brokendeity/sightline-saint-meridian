from pathlib import Path

root = Path(__file__).resolve().parents[1]
target = root / 'SIGHTLINE_SAINT_MERIDIAN_TOON.html'
baseline = root / '.pre-road-infrastructure.html'
source = baseline.read_text()

def replace(old, new):
    global source
    assert old in source, old[:100]
    source = source.replace(old, new, 1)

replace('const grid=new THREE.GridHelper', 'const gridHelper=new THREE.GridHelper')
replace('grid.position.y=.012;grid.material.transparent=true;grid.material.opacity=.38;world.add(grid);', 'gridHelper.position.y=.012;gridHelper.material.transparent=true;gridHelper.material.opacity=.38;world.add(gridHelper);')
replace('grid.material.opacity=.13;', 'gridHelper.material.opacity=.13;')
replace('m.receiveShadow=true;world.add(m);}\nfor(let i=-6;', 'm.receiveShadow=true;m.userData.legacyRoad=true;world.add(m);}\nfor(let i=-6;')
replace('world.add(a);const b=new THREE.Mesh(new THREE.BoxGeometry(2200,.02,.12)', 'a.userData.legacyRoad=true;world.add(a);const b=new THREE.Mesh(new THREE.BoxGeometry(2200,.02,.12)')
replace('b.position.set(0,.055,i*160);world.add(b)', 'b.position.set(0,.055,i*160);b.userData.legacyRoad=true;world.add(b)')
replace('for(const w of this.walkers){if(w.group.position.distanceToSquared(camera.position)>300*300)', 'for(const w of this.walkers){if(w.routeEdge)continue;if(w.group.position.distanceToSquared(camera.position)>300*300)')
replace('function supportHeight(x,z,currentY){let h=.42;', 'function supportHeight(x,z,currentY){let h=window.roadNetwork?.surfaceFeetAt(x,z,currentY)??.42;')
replace('if(s.pos.y<.6)surfaceY=Math.hypot(s.pos.x,s.pos.z)<115?.4:0;', 'if(s.pos.y<.9){const roadFloor=window.roadNetwork?.surfaceAt(s.pos.x,s.pos.z)||0;if(Math.hypot(s.pos.x,s.pos.z)<115){if(s.pos.y<.6)surfaceY=.4;}else if(Math.abs(s.pos.y-roadFloor-.42)<.035)surfaceY=roadFloor;}')
replace('const floor=supportHeight(s.pos.x,s.pos.z,Math.max(prevY,s.pos.y));if(s.pos.y<=floor', 'const floor=supportHeight(s.pos.x,s.pos.z,Math.max(prevY,s.pos.y));if(s.onGround&&s.vel.y<=0&&s.pos.y>floor&&s.pos.y-floor<=.201)s.pos.y=floor;if(s.pos.y<=floor')
replace('updateWorld(worldDt);updateCourier(dt);', 'updateWorld(worldDt);roadNetwork.tick(worldDt);updateCourier(dt);')
replace('mechanics:mechanicPolishState(),coordinates:', 'mechanics:mechanicPolishState(),roads:roadNetworkState(),coordinates:')
replace('scene.traverse(o=>{if(o.isInstancedMesh){', 'scene.traverse(o=>{if(o.userData.streetInfrastructure)return;if(o.isInstancedMesh){')
replace('scene.traverse(o=>{if(!o.isInstancedMesh)return;for(let j=0;', 'scene.traverse(o=>{if(o.userData.streetInfrastructure||!o.isInstancedMesh)return;for(let j=0;')

relocate = '''function relocateStreetLamps(points){
 if(!points.length)return;const glow=glows.filter(e=>e.lamp),light=anchors.filter(e=>e.kind==='lamp');
 lamps.forEach((e,i)=>{const old=e.position.clone().add(new THREE.Vector3(0,6.9,0)),emitter=nightEmitters.find(n=>!n.owner&&n.position.distanceTo(old)<.01),point=points[Math.floor(i*points.length/lamps.length)%points.length];e.position.copy(point);const high=point.clone().add(new THREE.Vector3(0,6.9,0));if(emitter)emitter.position.copy(high);if(light[i])light[i].position.copy(high);if(glow[i])glow[i].position.copy(point)});update(0);
}
'''
replace('return {build,material,update,state,root,isSourceValid:entry=>!damaged(entry)};', relocate+'return {build,material,asphaltMaterial,update,state,root,relocateStreetLamps,isSourceValid:entry=>!damaged(entry)};')
replace('const cityImportPromise=importBlenderCity();', (root/'scripts/game_road_infrastructure.js').read_text()+'\nconst cityImportPromise=importBlenderCity().then(result=>{roadNetwork.build();return result;});')
target.write_text(source)
print('Integrated road infrastructure:', target.stat().st_size)
