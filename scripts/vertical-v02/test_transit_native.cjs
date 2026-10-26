/* Real candidate import and simulation. Camera/initial hero setup is labelled;
 * no train position/speed/phase writes. Motion comes only from tickFrame. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const adapterOnly=process.env.TRANSIT_ADAPTER_ONLY==='1';
const stationWorld=process.env.V02_TRANSIT_WORLD==='station',reportName=stationWorld?'V02_Transit_Station_Native.json':'V02_Transit_Native.json';
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),E=path.join(D,'evidence/'+(stationWorld?'transit-station-cycle':adapterOnly?'transit-wheel-revision':'transit-first'));fs.mkdirSync(E,{recursive:true});
const{saveEvidence}=require('./evidence_io.cjs');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const report={scope:'Actual V02 transit candidate import, normal simulation-clock movement, station door/pause and camera collision. Not boarding, pedestrian, support continuity or full release acceptance.',entry:'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT.html',errors:[],trace:[],captures:[],tests:[]};
if(stationWorld)report.entry='SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_STATION.html';
report.mode=adapterOnly?'Native adapter-only cycle after initial whole-game frames; NOT a full-world gameplay regression':'Whole-game tickFrame for every train frame';
report.hashes=Object.fromEntries([report.entry,'assets/city/vertical-v02/'+(stationWorld?'transit-world':'detailed')+'/manifest.json','assets/city/vertical-v02/transit/assets.json','assets/city/vertical-v02/transit/definition.json','scripts/game_vertical_transit_v02.js','scripts/vertical_transit_core_v02.js'].map(f=>[f,sha(f)]));
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});let p;
try{
 p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto('http://127.0.0.1:8766/'+report.entry+'?capture=backspool');
 await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&window.verticalTransitState?.().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
 await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(67,100.42,382);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=Math.PI/2;cam.pitch=cam.targetPitch=0;});
 const settled=await p.evaluate(()=>{for(let i=0;i<120;i++)tickFrame(1/60,false);return{position:s.pos.toArray(),grounded:s.onGround,active:gameActive};});
 assert(settled.grounded&&settled.active&&Math.abs(settled.position[1]-100.42)<.2,'Station inspection fixture is not physically supported');report.initialWholeGameFrames=120;report.settledFixture=settled;
 let previousPhase;
 const step=async n=>{const rows=await p.evaluate(({n,adapterOnly})=>{const rows=[];for(let i=0;i<n;i++){if(adapterOnly)verticalTransit.tick(1/60);else tickFrame(1/60,false);if(i%10===0||i===n-1){const t=verticalTransitState();rows.push({motion:t.motion,carriages:t.carriages,player:s.pos.toArray(),active:gameActive});}}return rows},{n,adapterOnly});report.trace.push(...rows);const st=rows.at(-1);if(previousPhase!==st.motion.phase){previousPhase=st.motion.phase;console.log('transit phase',st.motion.phase,st.motion.clock,st.motion.arrivals)}return st;};
 const capture=async(name,position,look)=>{
  // In the deterministic fixture RAF is stopped. Wait for the real resize
  // event before the explicit render, otherwise a late canvas resize clears it.
  await p.waitForFunction(()=>{const size=renderer.getSize(new THREE.Vector2());return size.x===innerWidth&&size.y===innerHeight&&Math.abs(camera.aspect-innerWidth/innerHeight)<1e-6},null,{polling:50,timeout:5000});
  const pixels=await p.evaluate(({position,look})=>{camera.position.fromArray(position);camera.lookAt(...look);camera.updateMatrixWorld(true);renderNight(0);const gl=renderer.getContext(),w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,data=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);let colored=0,samples=0;for(let i=0;i<data.length;i+=4*97){samples++;if(data[i]+data[i+1]+data[i+2]>10)colored++;}return{width:w,height:h,coloredFraction:colored/samples};}, {position,look});
  assert(pixels.coloredFraction>.05,'Scene canvas is blank after resize '+JSON.stringify(pixels));
  await p.screenshot({path:path.join(E,name+'.png')});report.captures.push({file:path.relative(D,path.join(E,name+'.png')),scope:'Explicit camera-only inspection',position,look,pixels});};
 let st=await step(1);const initial=await p.evaluate(()=>({transit:verticalTransitState(),city:verticalCityState(),meshes:scene.getObjectByName('V02 scheduled transit').children.length,old:scene.getObjectByName('Saint Meridian vertical canyon').children.map(o=>o.name)}));
 assert.equal(initial.transit.carriages.length,4);assert.equal(initial.transit.trackChunks,20);assert.equal(initial.city.legacyTrain,false,'Old duplicate train still active');assert.equal(initial.city.train,true,'Existing city diagnostics do not expose the replacement service');assert(!initial.old.some(n=>n.includes('Vertical batch')),'Old track instancing remains');assert.equal(initial.transit.carriages[0].doors.length,0);assert(initial.transit.carriages.slice(1).every(c=>c.doors.length===8&&c.bogies.length===2&&c.wheelAngles.length===4));report.tests.push({name:'actual imported lead, three articulated passenger cars and replacement track; no old train',pass:true,initial});
 await capture('approach',[99,112,426],[80,101,366]);
 for(let i=0;st.motion.phase!=='dwell'&&i<400;i++)st=await step(6);
 assert.equal(st.motion.phase,'dwell');assert.equal(st.motion.speed,0);assert(Math.abs(st.carriages[0].position[2]-402)<.02);
 for(const c of st.carriages.slice(1))for(const d of c.doors){const dz=Math.abs(d.position[2]-d.homeZ);assert(Math.abs(dz-(d.side==='left'?.7:0))<1e-6,'Wrong station door side or displacement');}
 report.tests.push({name:'scheduled arrival aligns all cars; only left passenger doors open while stopped',pass:true,arrival:st});await capture('station-dwell',[70,104.2,397],[80,101.2,378]);
 // Pause through the actual game flag; clocks, wheel/door transforms and events must freeze.
 const paused=await p.evaluate(()=>{gameActive=false;return verticalTransitState()});await step(180);assert.deepEqual(await p.evaluate(()=>verticalTransitState()),paused);await p.evaluate(()=>gameActive=true);report.tests.push({name:'native game pause freezes all transit timelines and transforms',pass:true});
 const cameraContact=await p.evaluate(stationWorld=>{const origin=new THREE.Vector3(stationWorld?84:76.5,101.3,387),candidate=new THREE.Vector3(stationWorld?76.5:87,101.3,387);const targets=obstacleCandidates(origin,candidate,.22),ray=new THREE.Raycaster(origin,candidate.clone().sub(origin).normalize(),0,origin.distanceTo(candidate));const hits=ray.intersectObjects(targets,false);const fixed=constrainCameraPosition(origin,candidate);return{origin:origin.toArray(),candidate:candidate.toArray(),fixed:fixed.toArray(),hits:hits.slice(0,4).map(h=>({name:h.object.name,distance:h.distance,transit:!!h.object.userData.transitDynamic}))};},stationWorld);
 assert(cameraContact.hits[0]?.transit,'The first camera obstruction must be the train, not a station guard');assert(stationWorld?cameraContact.fixed[0]<84&&cameraContact.fixed[0]>81.45:cameraContact.fixed[0]>76.5&&cameraContact.fixed[0]<78.55,'Camera did not stop at actual train side');report.tests.push({name:'isolated shared camera collision stops at actual moving passenger geometry',pass:true,cameraContact});
 for(let i=0;st.motion.phase!=='approach'&&i<140;i++)st=await step(6);
 assert.equal(st.motion.phase,'approach');assert.equal(st.motion.door,0);
 let corner=false;
 for(let i=0;st.motion.arrivals<2&&i<1400;i++){
  st=await step(6);
  if(!corner&&st.carriages[0].position[2]>530&&st.motion.speed>1){corner=true;await capture('turn',[123,118,591],[97,101,547]);report.turn=st;}
 }
 assert.equal(st.motion.arrivals,2);assert(corner);assert(st.carriages.slice(1).every(c=>c.wheelAngles.some(a=>Math.abs(a)>50)));
 assert(report.trace.some(r=>r.carriages.slice(1).some(c=>c.bogies.some(b=>Math.abs(b.yaw)>.1))));report.tests.push({name:'full loop returns to precise station stop with measured articulated bogie and wheel motion',pass:true,secondArrival:st});
 for(const r of report.trace){assert(r.motion.speed>=0&&r.motion.speed<=16+1e-7);assert(!r.motion.door||r.motion.speed===0);assert(r.carriages.every(c=>c.position.every(Number.isFinite)));}
 await p.setViewportSize({width:430,height:932});await capture('portrait',[97,112,420],[80,101,370]);await p.setViewportSize({width:932,height:430});await capture('landscape',[99,112,426],[80,101,366]);
 report.stateText=await p.evaluate(()=>JSON.parse(render_game_to_text()));assert.deepEqual(report.errors,[]);report.status='PASS bounded native transit behavior';
}catch(error){report.status='FAIL';report.failure=String(error);console.error(error);process.exitCode=1;if(p)await p.screenshot({path:path.join(E,'failure.png')}).catch(()=>{});}
finally{saveEvidence(D,reportName,report);await browser.close();console.log(JSON.stringify({status:report.status,tests:report.tests.map(t=>t.name),samples:report.trace.length,failure:report.failure,errors:report.errors}));}})();
