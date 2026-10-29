/* Native keyboard/controller room entry. One labelled initial fixture per case;
 * all travel after it uses real input events or standard gamepad state. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),zlib=require('zlib');
const ROOT=path.resolve(__dirname,'../..'),DEV=path.join(ROOT,'development/vertical-city-v02');
const OUT=path.join(DEV,'evidence/slender-crossings-room-movement');fs.mkdirSync(OUT,{recursive:true});
const build=JSON.parse(fs.readFileSync(path.join(DEV,'V02_Slender_Crossings_Build.json')));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,f))).digest('hex');
const report={status:'FAIL',entry:build.entry,entrySHA256:sha(build.entry),manifestSHA256:sha(build.manifest),
 testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
 scope:'Normal input enters and exits three actual public rooms, with desktop keyboard and simulated-controller portrait/landscape layouts. Initial fixture only is positioned directly. No physical-device, arbitrary route or visual-quality acceptance.',
 cases:[],errors:[]};
let browser,page,keyHeld=null;
async function steps(n){return page.evaluate(n=>{
 const rows=[];
 for(let i=0;i<n;i++){
  tickFrame(1/60,false);model.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const bones=['Head','Hips','LeftFoot','RightFoot','LeftHand','RightHand'].map(name=>{
   const bone=model.getObjectByName('mixamorig'+name),p=bone.getWorldPosition(new THREE.Vector3()).project(camera);
   return{name,ndc:p.toArray(),framed:Math.abs(p.x)<.99&&Math.abs(p.y)<.99&&p.z>-1&&p.z<1};
  });
  rows.push({position:s.pos.toArray(),velocity:s.vel.toArray(),grounded:s.onGround,mode:s.mode,
   trauma:courier.trauma,sourceAnimation:currentAnim,camera:camera.position.toArray(),
   cameraQuaternion:camera.quaternion.toArray(),fov:camera.fov,bones,
   cameraInside:verticalDistrict.colliders(camera.position,camera.position)
    .filter(c=>camera.position.x>c.box.min.x+.002&&camera.position.x<c.box.max.x-.002&&
      camera.position.y>c.box.min.y+.002&&camera.position.y<c.box.max.y-.002&&
      camera.position.z>c.box.min.z+.002&&camera.position.z<c.box.max.z-.002).map(c=>c.id),
   body:window.v02BodyFramingState?.()||null,
   minimumVisitorGap:Math.min(...verticalWorldLifeState().people.filter(p=>
    p.route.startsWith('east-public-room-')&&Math.abs(p.position[1]-s.pos.y+.42)<.3)
    .map(p=>Math.hypot(p.position[0]-s.pos.x,p.position[2]-s.pos.z)))});
 }
 renderNight(0);return rows;
},n);}
async function key(value){if(keyHeld===value)return;if(keyHeld)await page.keyboard.up(keyHeld);keyHeld=value;if(value)await page.keyboard.down(value);}
async function stop(trace){await key(null);await page.evaluate(()=>{roomPad.axes=[0,0,0,0];});trace.push(...await steps(30));}
async function seek(target,driver,trace,walking){
 for(let frame=0;frame<2600;){
  const delta=await page.evaluate(target=>({dx:target[0]-s.pos.x,dz:target[2]-s.pos.z,d:Math.hypot(target[0]-s.pos.x,target[2]-s.pos.z)}),target);
  if(delta.d<.13){await stop(trace);return;}
  if(driver==='keyboard'){
   const next=Math.abs(delta.dx)>Math.abs(delta.dz)?(delta.dx>0?'d':'a'):(delta.dz>0?'s':'w');await key(next);
  }else{
   await page.evaluate(({target,walking})=>{
    const dx=target[0]-s.pos.x,dz=target[2]-s.pos.z,d=Math.hypot(dx,dz),speed=walking?1.65:6.6;
    const magnitude=Math.min(1,Math.max(.12,d/(speed*.24))),raw=.1+.9*magnitude;
    roomPad.axes[0]=(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d*raw;
    roomPad.axes[1]=-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d*raw;
   },{target,walking});
  }
  const n=delta.d>1.5?3:1,rows=await steps(n);trace.push(...rows);frame+=n;
  if(rows.some(r=>r.trauma>0||!r.grounded))throw Error('Room travel lost safe support '+JSON.stringify(rows.at(-1)));
 }
 throw Error('Room route stalled '+JSON.stringify({target,last:trace.at(-1)}));
}
async function screenshot(name){const file=path.join(OUT,name+'.png');await page.screenshot({path:file});return{file:path.relative(ROOT,file),sha256:sha(path.relative(ROOT,file))};}
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 page=await browser.newPage({viewport:{width:1664,height:936},hasTouch:true});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready&&!v02RimShadowState().error&&verticalWorldLifeState().ready&&verticalWorldLifeState().visitors===11&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
 await page.click('#v02Start');await page.evaluate(()=>window.requestAnimationFrame=()=>0);await page.waitForTimeout(100);
 for(const view of [{id:'desktop',width:1664,height:936,driver:'keyboard'},
                   {id:'portrait',width:430,height:932,driver:'controller'},
                   {id:'landscape',width:932,height:430,driver:'controller'}]){
  await page.setViewportSize({width:view.width,height:view.height});
  await page.waitForFunction(view=>Math.abs(camera.aspect-view.width/view.height)<.001,view);
  for(const floor of [24,52,84]){
   const test={view:view.id,driver:view.driver,floor,walking:view.id==='desktop'&&floor===24,
    fixture:'One supported gallery start at[96,floor+.42,300]; no later actor/camera positioning',captures:[],trace:[],waypoints:[]};
   report.cases.push(test);
   await key(null);
   await page.evaluate(floor=>{
    resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(96,floor+.42,300);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);
    s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));
    camera.position.copy(cam.focus).add(new THREE.Vector3(1.35,.66,4.2364));camera.lookAt(cam.focus);
    window.roomPad={index:0,id:'V02 public-room standard controller',mapping:'standard',connected:true,
      axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[roomPad];
   },floor);
   if(await page.evaluate(()=>backspoolFlow.walking())!==test.walking)await page.keyboard.press('o');
   if(await page.evaluate(()=>threadrailGame.sprinting()))await page.keyboard.press('Shift');
   await steps(120);
   for(const [id,target]of [['gallery',[96,floor,310]],['room',[102.1,floor,310]],['return',[96,floor,310]],['continue',[96,floor,326]],['reverse-gallery',[96,floor,310]],['start-return',[96,floor,300]]]){
    await seek(target,view.driver,test.trace,test.walking);
    test.waypoints.push({id,target,position:await page.evaluate(()=>s.pos.toArray()),frame:test.trace.length});
    test.captures.push({id,...await screenshot(view.id+'-'+floor+'-'+id)});
   }
   assert(test.trace.every(r=>r.grounded&&r.trauma===0&&Math.abs(r.position[1]-floor-.42)<.03),'Floor support changed');
   test.framingFailures=test.trace.filter(r=>r.bones.some(b=>!b.framed)).length;
   test.cameraInsideFailures=test.trace.filter(r=>r.cameraInside.length).length;
   assert.equal(test.cameraInsideFailures,0,'Native camera entered a solid');
   assert.equal(test.framingFailures,0,'Character cropped during native room travel');
   test.minimumVisitorGap=Math.min(...test.trace.map(r=>r.minimumVisitorGap));
   assert(test.minimumVisitorGap>=.87,'Visitor overlaps the hero capsule during ordinary room travel');
   assert(test.trace.every(r=>!r.body||r.body.positionDelta===0),'Composition adapter moved the camera physically');
   test.seconds=test.trace.length/60;
   console.log('PASS',view.id,floor,test.seconds+'s');
  }
 }
 assert.deepEqual(report.errors,[]);
 report.status='PASS nine native public-room entry/return/continuation cases with support, camera and body framing checks; visual/reference/release acceptance separate';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;if(page)await screenshot('failure').catch(()=>{});}
finally{
 if(page){await key(null).catch(()=>{});await page.evaluate(()=>{if(window.roomPad)roomPad.axes=[0,0,0,0];}).catch(()=>{});}
 const traces=report.cases.map(c=>({view:c.view,floor:c.floor,driver:c.driver,trace:c.trace}));
 const file=path.join(OUT,'traces.json.gz');fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(traces),{mtime:0}));
 for(const c of report.cases){c.frames=c.trace.length;delete c.trace;}
 report.traces=path.relative(ROOT,file);report.tracesSHA256=sha(report.traces);
 fs.writeFileSync(path.join(DEV,'V02_Slender_Crossings_Room_Movement.json'),JSON.stringify(report,null,2)+'\n');
 await browser?.close();console.log(report.status);
}})();
