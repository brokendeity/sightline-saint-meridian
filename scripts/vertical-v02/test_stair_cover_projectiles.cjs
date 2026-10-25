/* Isolated native projectile-solver fixture, not enemy AI or a route certificate.
 * Reuses formerly open reference gunpoints; no direct damage/collision calls,
 * enemy muting, invulnerability, or hero position writes after initial setup. */
const {openMarket,R,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs'),fs=require('fs'),assert=require('assert/strict');
const report={status:'FAIL',scope:'One local hero setup at the observed C90.4 landing. Native pooled projectiles from each formerly open reference emitter; actual world solver must stop each before the hero. Does not certify enemy AI or all possible firing positions.',results:[]};
(async()=>{let h;try{
 h=await openMarket(report);const{p,step}=h;
 const before=JSON.parse(fs.readFileSync(D+'/V02_C_Stair_Exposure_Before.json'));
 report.beforeManifestSHA256=before.manifestSHA256;
 const origins=before.samples.filter(r=>!r.insideSource.length&&r.open);assert.equal(origins.length,12);
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(66.535,90.82,375.55);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(cam.focus).add(new THREE.Vector3(4,2,4));camera.lookAt(cam.focus);camera.updateMatrixWorld(true)});
 await step(2);const initial=await p.evaluate(()=>courier.trauma);assert.equal(initial,0);
 for(const origin of origins){
  const emitted=await p.evaluate(origin=>{scene.updateMatrixWorld(true);const m=combatProjectilePool.find(m=>!projectiles.some(p=>p.m===m));if(!m)throw Error('Projectile pool busy');m.material=combatProjectileMaterials[0];m.scale.setScalar(1);m.position.fromArray(origin);const target=s.pos.clone().add(new THREE.Vector3(0,.9,0)),direction=target.clone().sub(m.position).normalize(),distance=m.position.distanceTo(target),ray=new THREE.Raycaster(m.position,direction,0,distance),hit=ray.intersectObjects(obstacleCandidates(m.position,target),false)[0];scene.add(m);projectiles.push({m,d:direction,life:4,speed:58,source:null,fixtureTag:'V02_C_COVER'});return{origin,target:target.toArray(),expectedBlocker:hit?{mesh:hit.object.name,point:hit.point.toArray(),distance:hit.distance}:null}},origin.origin);
  assert(emitted.expectedBlocker,'No physical blocker from '+JSON.stringify(origin));let last,removed=false;
  for(let frame=0;frame<80;frame++){
   const prior=await p.evaluate(()=>projectiles.find(p=>p.fixtureTag==='V02_C_COVER')?.m.position.toArray());
   await step();last=await p.evaluate(()=>({remaining:!!projectiles.find(p=>p.fixtureTag==='V02_C_COVER'),p:s.pos.toArray(),trauma:courier.trauma,grounded:s.onGround}));
   if(!last.remaining){removed=true;last.lastProjectilePosition=prior;last.frames=frame+1;break;}
  }
  report.results.push({...emitted,...last});assert(removed,'Native projectile not removed');assert.equal(last.trauma,0,'Cover allowed damage');assert(last.grounded);assert(Math.hypot(last.p[0]-66.535,last.p[2]-375.55)<.03,'Hero moved out of fixture');
 }
 report.glass=await p.evaluate(()=>{const glass=[];scene.traverse(o=>{if(o.isMesh&&o.material?.name==='V02_glass')glass.push({name:o.name,transparent:o.material.transparent,opacity:o.material.opacity})});return glass});
 assert(report.glass.length&&report.glass.every(m=>m.transparent&&m.opacity>.2&&m.opacity<.25),'Tinted glass alpha was not retained by runtime import');
 for(const [name,position,look]of [['inside',[70,94,379],[65,92,375.5]],['outside',[78,96,365],[66,94,380]]]){
  await p.evaluate(({position,look})=>{camera.position.fromArray(position);camera.lookAt(new THREE.Vector3(...look));camera.updateMatrixWorld(true);renderNight(0)},{position,look});
  await p.screenshot({path:D+'/evidence/station-stair-cover-'+name+'-inspection.png'});
 }
 report.inspectionCameras='Two explicitly positioned local inspection views, after projectile tests; no route or camera-gameplay claim.';
 assert.deepEqual(report.errors,[]);report.status='PASS twelve formerly open reference projectiles stopped by physical cover';console.log(report.status);
 }catch(e){report.failure=String(e);console.error(e);process.exitCode=1;}finally{if(h)await h.browser.close();saveEvidence(D,'V02_C_Stair_Cover_Projectiles.json',report)}})();
