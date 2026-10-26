/* Labelled station fixture, then only actual standard-controller movement.
 * No route-node teleporting, health writes, power releases or train writes. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const{saveEvidence}=require('./evidence_io.cjs');
const worldLife=process.env.V02_STAGE==='world-life',R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),evidenceFolder=worldLife?'world-life-station':'transit-station',E=path.join(D,'evidence',evidenceFolder);fs.mkdirSync(E,{recursive:true});
const report={status:'FAIL',entry:worldLife?'SIGHTLINE_SAINT_MERIDIAN_V02_WORLD_LIFE.html':'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_STATION.html',manifest:'assets/city/vertical-v02/transit-world/manifest.json',scope:'Local public station approach, full waiting platform return and real guard/screen contact. Single initial station fixture; not a full street-to-station route or train boarding acceptance.',trace:[],results:[],captures:[],errors:[]};
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');report.hashes=Object.fromEntries([report.entry,report.manifest,'scripts/game_vertical_transit_v02.js','scripts/vertical_transit_core_v02.js'].map(f=>[f,sha(f)]));
if(worldLife)for(const file of['scripts/game_vertical_world_life_v02.js','scripts/game_aerial_traffic_core_v02.js','assets/city/vertical-v02/world-life/air_routes.json','assets/city/vertical-v02/world-life/air_assets.json','assets/city/vertical-v02/world-life/ambient_routes.json'])report.hashes[file]=sha(file);
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});let p;
try{
 p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto('http://127.0.0.1:8766/'+report.entry+'?capture=backspool');await p.waitForFunction(()=>window.verticalDistrictState?.().error||window.verticalTransitState?.().error||gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&window.verticalTransitState?.().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
 assert.equal(await p.evaluate(()=>verticalDistrictState().error),null,'District import rejected actual geometry');assert.equal(await p.evaluate(()=>verticalTransitState().error),null);
 if(worldLife){await p.waitForFunction(()=>window.verticalWorldLifeState?.().ready,null,{timeout:120000});assert.equal(await p.evaluate(()=>verticalWorldLifeState().error),null);}
 await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 report.setup=await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(73,100.42,382);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=-Math.PI/2;cam.pitch=cam.targetPitch=-.08;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.2,0));camera.position.copy(s.pos).add(new THREE.Vector3(-4.25,2.4,1.35));camera.lookAt(cam.focus);camera.updateMatrixWorld(true);window.stationPad={index:0,id:'V02 station normal-input controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[stationPad];return{position:s.pos.toArray(),equipment:threadrailGame.state()};});
 assert.equal(report.setup.equipment.drive.bank.length,0,'Public route must start with an empty Drive bank');
 let frame=0;
 const step=async(n=1)=>{const rows=await p.evaluate(n=>{const rows=[];for(let i=0;i<n;i++){tickFrame(1/60,false);rows.push({p:s.pos.toArray(),v:s.vel.toArray(),grounded:s.onGround,active:gameActive,trauma:courier.trauma,mode:s.mode,clock:verticalTransitState().motion.clock,trainPhase:verticalTransitState().motion.phase,camera:camera.position.toArray()});}return rows},n);frame+=n;report.trace.push(...rows);return rows.at(-1);};
 const stop=async()=>{await p.evaluate(()=>{stationPad.axes[0]=stationPad.axes[1]=0});await step(8);};
 const move=async t=>{let st;const began=frame;for(let i=0;i<1800;i++){
  const d=await p.evaluate(t=>{const dx=t[0]-s.pos.x,dz=t[2]-s.pos.z,d=Math.hypot(dx,dz),m=Math.min(1,Math.max(.16,d/1.4));stationPad.axes[0]=d>.14?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*(.1+.9*m):0;stationPad.axes[1]=d>.14?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*(.1+.9*m):0;return d},t);st=await step(d>1?3:1);
  assert(st.active&&st.trauma===0,'Station walk interrupted or injured');if(d<.16){await stop();assert(Math.abs(st.p[1]-100.42)<.2,'Lost platform support');report.results.push({target:t,frames:frame-began,seconds:(frame-began)/60,pass:true});console.log('station walk',t,frame);return st;}
 }throw Error('Station walk timeout '+JSON.stringify({t,st}));};
 const capture=async(name,inspection)=>{if(inspection)await p.evaluate(()=>{camera.position.set(93,111,419);camera.lookAt(76.5,101,378);camera.updateMatrixWorld(true)});await p.evaluate(()=>renderNight(0));await p.screenshot({path:path.join(E,name+'.png')});report.captures.push({file:'evidence/'+evidenceFolder+'/'+name+'.png',scope:inspection?'Explicit camera-only station/track inspection':'Actual third-person player camera'});};
 await step(10);const loaded=await p.evaluate(()=>verticalDistrictState());assert.deepEqual(loaded.coordinateFailures,[]);report.loaded=loaded;
 for(const t of [[73,100,385.4],[76.55,100,385.4],[76.55,100,405]])await move(t);
 await capture('north-platform');
 // Attempt to walk into the rail corridor. The visible screen, not a hidden
 // wall or a train teleport, must stop this normal ground movement.
 await p.evaluate(()=>{stationPad.axes[0]=Math.cos(cam.yaw);stationPad.axes[1]=Math.sin(cam.yaw);});await step(120);await stop();
 const screen=await p.evaluate(()=>({position:s.pos.toArray(),grounded:s.onGround}));assert(screen.grounded&&screen.position[0]<77.58&&Math.abs(screen.position[1]-100.42)<.2,'Rail-edge screen did not contain player');report.screenContact=screen;
 await move([76.55,100,405]);await move([76.55,100,352]);await capture('south-platform');await move([76.55,100,385.4]);await move([73,100,385.4]);
 // The guard outside the intentional opening remains solid and visible.
 await move([73,100,383]);await p.evaluate(()=>{stationPad.axes[0]=Math.cos(cam.yaw);stationPad.axes[1]=Math.sin(cam.yaw)});await step(120);await stop();
 const guard=await p.evaluate(()=>({position:s.pos.toArray(),grounded:s.onGround}));assert(guard.grounded&&guard.position[0]<74.45,'Adjacent retained guard disappeared');report.guardContact=guard;await move([73,100,383]);await move([73,100,385.4]);await move([73,100,382]);
 await capture('concourse-return');await capture('structure-inspection',true);
 const equipment=await p.evaluate(()=>threadrailGame.state());report.finalEquipment=equipment;assert.equal(equipment.releaseEvents.length,0);assert(report.trace.every(r=>r.grounded&&r.trauma===0&&Math.abs(r.p[1]-100.42)<.2));assert.deepEqual(report.errors,[]);report.simulationSeconds=frame/60;report.status='PASS local public station walking and boundary contacts';
 if(worldLife){report.worldLife=await p.evaluate(()=>verticalWorldLifeState());assert.equal(report.worldLife.error,null);assert.equal(report.worldLife.aircraft,36);assert.equal(report.worldLife.visitors,8);assert(report.worldLife.people.every(p=>p.walked>0));assert(Math.abs(report.worldLife.clock-report.trace.at(-1).clock)<1/60);}
}catch(error){report.failure=String(error);console.error(error);process.exitCode=1;if(p){report.failureState=await p.evaluate(()=>({district:window.verticalDistrictState?.(),transit:window.verticalTransitState?.()})).catch(()=>null);await p.screenshot({path:path.join(E,'failure.png')}).catch(()=>{});}}
finally{saveEvidence(D,worldLife?'V02_World_Life_Station_Input.json':'V02_Transit_Station_Input.json',report);await browser.close();console.log(JSON.stringify({status:report.status,targets:report.results.length,frames:report.trace.length,errors:report.errors,failure:report.failure}));}})();
