const{saveEvidence}=require('./evidence_io.cjs');
/* Physical source-cast/projectile metrology. Fixture/camera setup is labelled. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const D=path.resolve(__dirname,'../../development/vertical-city-v02');
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']}),results=[],errors=[];try{
 for(const distance of [8,30,60,95,105]){
 const context=await b.newContext(),p=await context.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>navigator.getGamepads=()=>[]);await p.goto('http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_WHIP_THROW.html?capture=backspool');
 await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalCityState().ready&&characterState().active==='backspool'&&!characterState().busy&&threadrailGame.state().whipCast.ready&&threadrailCartridgeState().ready,null,{timeout:120000});
 await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 await p.evaluate(distance=>{startGame(false);resetPlayer();clearInput();s.pos.set(40,.42,70);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;const m=new THREE.Mesh(new THREE.BoxGeometry(12,12,1),new THREE.MeshStandardMaterial({color:0x264251}));m.position.set(40,6,70-distance-.5);scene.add(m);m.updateMatrixWorld(true);const owner={id:'metrology-target',mesh:m,box:new THREE.Box3().setFromObject(m),type:'metrology',nonDestructible:true,damageCount:0};propColliders.push(owner);rayTargets.push(m);walkables.push(m);cameraObstacles.push(m);for(let i=0;i<3;i++)tickFrame(1/60,false);},distance);
 const trace=[],step=async n=>{const a=await p.evaluate(n=>{const a=[];for(let i=0;i<n;i++){tickFrame(1/60,false);const t=threadrailGame.state();a.push({clock:t.deployment.clock,position:t.motion.position,velocity:t.motion.velocity,rail:t.rail.current,railCount:t.rail.rails.length,message:t.lastMessage,deployment:t.deployment,owner:t.owner.owner});}return a},n);trace.push(...a);return a.at(-1)};
 for(const target of [[40,0,69],[40,8,70-distance]]){await p.keyboard.down('r');await step(26);await p.evaluate(target=>{camera.position.set(40,4,75);camera.lookAt(...target);camera.updateMatrixWorld(true)},target);await p.keyboard.up('r');await step(Math.ceil(distance/42*60)+75);}
 const state=await p.evaluate(()=>threadrailGame.state()),events=state.deployment.events;
 const shots=events.filter(e=>e.type==='release').map(release=>{const impact=events.find(e=>e.type==='impact'&&e.handIndex===release.handIndex&&e.time>=release.time);return{release,impact,flightSeconds:impact?impact.time-release.time:null}});
 const result={distance,fixture:'Temporary solid target panel at x40, front z70-distance. Actor begins at [40,.42,70]; original city retained. Camera is aimed at each target before key-up. No direct rail creation.',limits:state.rail.limits,railCount:state.rail.rails.length,rails:state.rail.rails,anchors:state.rail.anchors,status:state.deployment.status,message:state.lastMessage,shots,trace};
 results.push(result);saveEvidence(D,'V02_Cartridge_Measurements.json',{entry:'SIGHTLINE_BACKSPOOL_WHIP_THROW.html',results,errors,limitations:['Projectile/attachment tests only; these are not approved city routes.','No inference of rail ride speed from maxSpeed configuration.','Transfer and Pop require additional input trials.']});console.log(JSON.stringify({distance,rails:result.railCount,status:result.status,message:result.message,flights:shots.map(s=>s.flightSeconds)}));await context.close();
 }
 assert.deepEqual(errors,[]);assert(results.slice(0,4).every(r=>r.railCount===1),'Within-envelope physical connection failed');assert.equal(results.at(-1).railCount,0,'Above-envelope connection admitted');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
