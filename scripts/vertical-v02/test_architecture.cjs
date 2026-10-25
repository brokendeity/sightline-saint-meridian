/* Detailed candidate: real import, new public stair/terrace through normal
 * inputs, and explicitly labelled camera-only architectural inspection views. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const{saveEvidence}=require('./evidence_io.cjs');
const cameraProbe=require('./route_camera_probe.cjs');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const entry='SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html',manifest='assets/city/vertical-v02/detailed/manifest.json';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,file))).digest('hex');
const report={status:'FAIL',entry,entrySHA256:hash(entry),manifestSHA256:hash(manifest),scope:'Detailed import and one initial lower-market player/camera fixture. Ordinary walking up and down the new public stair, no jump/Flow/Drive, followed by camera-only inspection captures. Not full detailed-city gameplay, reference or performance acceptance.',trace:[],errors:[],stages:[]};
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});let p;try{
 p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>window.verticalDistrictState&&(verticalDistrictState().ready||verticalDistrictState().error),null,{timeout:120000});
 const load=await p.evaluate(()=>verticalDistrictState());assert.equal(load.error,null,JSON.stringify(load));assert.equal(load.coordinateFailures.length,0);assert.equal(load.phase,'detailed-architecture');report.import=load;
 await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 const metadata=JSON.parse(fs.readFileSync(path.join(R,manifest)));report.route=metadata.detailedPublicRoutes[0];
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(76,24.42,353.9);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=-Math.PI/2;cam.pitch=cam.targetPitch=-.12;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(cam.focus).add(new THREE.Vector3(-4.25,.32,1.35));camera.lookAt(cam.focus);camera.updateMatrixWorld(true);window.archPad={index:0,id:'V02 detailed public-stair controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[archPad]});
 report.cameraProbe=await cameraProbe.install(p);
 const step=async(n=1)=>{const rows=await p.evaluate(n=>{const out=[];for(let i=0;i<n;i++){tickFrame(1/60,false);out.push({p:s.pos.toArray(),v:s.vel.toArray(),grounded:s.onGround,trauma:courier.trauma,camera:camera.position.toArray(),cameraProbe:v02RouteCameraProbe(),mode:s.mode,bank:threadrailGame.state().drive.bank.length,releases:threadrailGame.state().releaseEvents.length,animation:currentAnim})}return out},n);report.trace.push(...rows);return rows.at(-1)};
 await step(4);if(!await p.evaluate(()=>backspoolFlow.walking()))await p.keyboard.press('o');await step(2);
 const capture=async name=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:path.join(D,'evidence/detailed-'+name+'.png')})};
 const move=async target=>{let previous=null,stalled=0;for(let i=0;i<1600;i++){
  const distance=await p.evaluate(t=>{const dx=t[0]-s.pos.x,dz=t[2]-s.pos.z,d=Math.hypot(dx,dz),m=Math.min(1,Math.max(.15,d/(1.65*.22)));archPad.axes[0]=d>.12?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*(.1+.9*m):0;archPad.axes[1]=d>.12?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*(.1+.9*m):0;return d},target);
  const st=await step(distance>.8?3:1);stalled=previous&&Math.hypot(st.p[0]-previous[0],st.p[2]-previous[2])<.0005&&distance>.25?stalled+1:0;previous=st.p;
  if(stalled>60){report.blocked={target,state:st};throw Error('New public route blocked '+JSON.stringify(report.blocked))}
  assert.equal(st.trauma,0,'Public terrace traversal must not injure');assert(st.grounded,'Ordinary stair walking lost support');
  if(distance<.13){await p.evaluate(()=>archPad.axes=[0,0,0,0]);await step(4);assert(Math.abs(st.p[1]-target[1]-.42)<.21,'Wrong stair/terrace support '+JSON.stringify({target,st}));return st;}
 }throw Error('Public terrace waypoint timeout '+JSON.stringify(target))};
 await capture('market-stair-start');
 for(const point of report.route.path)await move(point);report.stages.push({name:'upper public terrace',state:await step()});await capture('market-terrace-gameplay');
 for(const point of [...report.route.path].reverse())await move(point);report.stages.push({name:'lower market return',state:await step()});await capture('market-stair-return');
 const movement=report.trace.slice();assert(movement.every(t=>t.grounded&&t.trauma===0&&t.releases===0));report.publicStair={passed:true,frames:movement.length,seconds:movement.length/60,maximumRise:Math.max(...movement.slice(1).map((t,i)=>t.p[1]-movement[i].p[1])),range:[Math.min(...movement.map(t=>t.p[1])),Math.max(...movement.map(t=>t.p[1]))]};
 const samples=movement.filter(t=>t.cameraProbe);report.walkCamera={samples:samples.length,problemSamples:samples.filter(t=>!Object.values(t.cameraProbe.targets).some(b=>b.framed&&!b.occluded)).length,scope:'Actual animated head/hips at10Hz throughout walking, including new shelter; HUD and between-sample visibility remain separate'};
 assert.equal(report.walkCamera.problemSamples,0,'New public stair or terrace hides/crops the whole measured hero');
 // These are actual rendered canvas pixels from the detailed browser scene.
 // Only the camera is assigned for the labelled architectural inspection;
 // these images do not stand in for gameplay-camera or reference acceptance.
 report.inspectionViews=[];
 for(const[id,position,look]of [
  ['market',[76,36,376],[83,26,355]],
  ['transit',[66.5,116,409],[66.5,108,384]],
  ['observation',[66,139,438],[80,133,420]]]){
  const data=await p.evaluate(({position,look})=>{camera.position.set(...position);camera.lookAt(new THREE.Vector3(...look));camera.fov=54;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderNight(0);return{png:renderer.domElement.toDataURL('image/png'),render:renderer.info.render,memory:renderer.info.memory}}, {position,look});
  const file='evidence/detailed-inspection-'+id+'.png';fs.writeFileSync(path.join(D,file),Buffer.from(data.png.split(',')[1],'base64'));
  report.inspectionViews.push({id,position,look,file,render:data.render,memory:data.memory,scope:'Camera-only local inspection; actual canvas render, DOM HUD is separate. Not sustained performance.'});
 }
 assert.deepEqual(report.errors,[]);assert.equal(hash(entry),report.entrySHA256);assert.equal(hash(manifest),report.manifestSHA256);report.status='PASS detailed import and new zero-resource public terrace stair';console.log(report.status,JSON.stringify(report.publicStair));
 }catch(error){report.failure=String(error);console.error(error);process.exitCode=1;}finally{if(p){await p.evaluate(()=>renderNight(0)).catch(()=>{});await p.screenshot({path:path.join(D,'evidence/detailed-first-final.png')}).catch(()=>{})}await browser.close();saveEvidence(D,'V02_Detailed_First_Input.json',report)}})();
