/* Input-driven movement metrology. Teleport is controlled initial setup only. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../..'),D=path.join(ROOT,'development/vertical-city-v02');
const ENTRY='SIGHTLINE_BACKSPOOL_WHIP_THROW.html',DT=1/60;
(async()=>{
 const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 const trials=[],errors=[];
 try{
  async function trial(name,program,options={}){
   const context=await b.newContext({viewport:{width:1280,height:800}}),p=await context.newPage();
   p.on('pageerror',e=>errors.push({trial:name,error:String(e)}));
   await p.addInitScript(()=>{navigator.getGamepads=()=>[];localStorage.setItem('backspoolControlPreset','traversal')});
   await p.goto('http://127.0.0.1:8766/'+ENTRY+'?capture=backspool');
   await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalCityState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
   await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
   const fixture=await p.evaluate(options=>{
    startGame(false);resetPlayer();clearInput();clearPad();resetMechanicInput();
    backspoolCombat.reset('METROLOGY');backspoolAdvanced.reset('RESPAWN');backspoolFlow.reset('RESPAWN');backspoolHop.reset('RESPAWN');threadrailGame.lifecycle('RESPAWN');
    s.pos.set(40,options.height||.42,70);s.vel.set(0,options.vy||0,0);s.onGround=!options.height;setMode(s.onGround?P.GROUND:P.AIR);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;
    // Query the actual collision registries; keep every original world obstacle.
    const tube=new THREE.Box3(new THREE.Vector3(39,.05,-80),new THREE.Vector3(41,15,72));
    const obstacles=[...buildingColliders.flatMap(c=>(c.parts||[c]).map(p=>({box:p.box,id:p.id||c.id}))),...propColliders].filter(c=>!c.destroyed&&tube.intersectsBox(c.box)).map(c=>c.id||c.type);
    if(options.wall){const m=new THREE.Mesh(new THREE.BoxGeometry(24,30,2),new THREE.MeshStandardMaterial({color:0x203848}));m.position.set(40,15,5);scene.add(m);m.updateMatrixWorld(true);const owner={id:'metrology-wall',mesh:m,box:new THREE.Box3().setFromObject(m),type:'metrology',damageCount:0,nonDestructible:true};propColliders.push(owner);rayTargets.push(m);walkables.push(m);cameraObstacles.push(m);s.pos.set(40,.42,10);}
    for(let i=0;i<3;i++)tickFrame(1/60,false);
    return {position:s.pos.toArray(),obstacles,bank:threadrailGame.state().drive.bank,walking:backspoolFlowState().walking,limits:threadrailGame.state().rail.limits,bodyRadius:BODY_RADIUS,bodyHeight:BODY_HEIGHT,support:supportHeight(s.pos.x,s.pos.z,s.pos.y+.1)};
   },options);
   assert.deepEqual(fixture.obstacles,[],'Clear-strip fixture intersects original geometry');assert.equal(fixture.bank.length,0,'Fresh fixture has banked impulses');
   const frames=[],notes=[];
   const step=n=>p.evaluate(n=>{const a=[];for(let i=0;i<n;i++){tickFrame(1/60,false);const f=backspoolFlowState(),adv=backspoolAdvancedState(),t=threadrailGame.state();a.push({pos:s.pos.toArray(),vel:s.vel.toArray(),grounded:s.onGround,support:supportHeight(s.pos.x,s.pos.z,s.pos.y+.1),mode:s.mode,sprinting:t.sprint,action:f.action,advanced:adv.kind,advancedMotion:adv.motion?.kind,bank:t.drive.bank.map(x=>({id:x.id,action:x.action})),release:t.drive.lastRelease,correction:f.contactCorrection,owner:t.owner.owner,reason:adv.reason});}return a},n).then(a=>{a.forEach(r=>frames.push({...r,t:frames.length*DT}));return frames.at(-1)});
   try{await program({p,step,notes,frames});}catch(e){notes.push({failure:String(e)});}
   const start=fixture.position,end=frames.at(-1)?.pos||start,speeds=frames.map(f=>Math.hypot(f.vel[0],f.vel[2]));
   const airborne=frames.findIndex(f=>!f.grounded),land=frames.findIndex((f,i)=>i>airborne&&airborne>=0&&f.grounded),apex=frames.reduce((best,f,i)=>f.pos[1]>(frames[best]?.pos[1]??-Infinity)?i:best,0);
   const result={name,method:'Fresh browser context; DOM keyboard input; fixed 1/60 simulation ticks. Controlled initial positioning only; no movement/animation speed overrides.',fixture:{...fixture,wall:!!options.wall,fallSetup:!!options.height},duration:frames.length*DT,distance:Math.hypot(end[0]-start[0],end[2]-start[2]),maxHeight:Math.max(...frames.map(f=>f.pos[1]))-start[1],peakHorizontalSpeed:Math.max(...speeds),endHorizontalSpeed:speeds.at(-1),airborneAt:airborne>=0?airborne*DT:null,apexAt:apex*DT,landedAt:land>=0?land*DT:null,flightDistance:land>=0?Math.hypot(frames[land].pos[0]-frames[Math.max(0,airborne-1)].pos[0],frames[land].pos[2]-frames[Math.max(0,airborne-1)].pos[2]):null,notes,frames};
   trials.push(result);fs.writeFileSync(path.join(D,'V02_Movement_Measurements_Clean.json'),JSON.stringify({entry:ENTRY,entrySHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,ENTRY))).digest('hex'),simulationStep:DT,trials,errors,limitations:['Controlled fixtures are not route acceptance.','Only trials listed here are measured; rail transfers and projectile limits require separate physical tests.','Wall fixture is temporary metrology geometry, not a certified city route.','No original Forspoken equivalence claim.']},null,2));
   console.log(JSON.stringify(Object.fromEntries(Object.entries(result).filter(([k])=>k!=='frames'))));await context.close();
  }
  await trial('ordinary run 3s',async({p,step})=>{await p.keyboard.down('w');await step(180)});
  await trial('walk toggle 3s',async({p,step})=>{await p.keyboard.press('o');await p.keyboard.down('w');await step(180)});
  await trial('Flow toggle 3s',async({p,step})=>{await p.keyboard.press('Shift');await p.keyboard.down('w');await step(180)});
  await trial('stationary short jump',async({p,step})=>{await p.keyboard.down('Space');await step(5);await p.keyboard.up('Space');await step(145)});
  await trial('stationary held jump',async({p,step})=>{await p.keyboard.down('Space');await step(35);await p.keyboard.up('Space');await step(115)});
  await trial('ordinary running jump',async({p,step})=>{await p.keyboard.down('w');await step(45);await p.keyboard.down('Space');await step(12);await p.keyboard.up('Space');await step(130)});
  await trial('Flow forward jump',async({p,step})=>{await p.keyboard.press('Shift');await p.keyboard.down('w');await step(70);await p.keyboard.down('Space');await step(12);await p.keyboard.up('Space');await step(130)});
  await trial('air control from stationary jump',async({p,step})=>{await p.keyboard.down('Space');await step(12);await p.keyboard.up('Space');await p.keyboard.down('d');await step(120)});
  await trial('unbraked 12m drop',async({step})=>{await step(180)},{height:12.42});
  await trial('held Jump 12m fall brake',async({p,step})=>{await p.keyboard.down('Space');await step(150);await p.keyboard.up('Space');await step(100)},{height:12.42,vy:-8});
  await trial('Flow physical footplant then Drive',async({p,step,notes})=>{await p.keyboard.press('Shift');await p.keyboard.down('w');await step(70);notes.push({beforeDrive:await p.evaluate(()=>threadrailGame.state().drive)});await p.keyboard.press('e');await step(50)});
  await trial('wall climb and repeated upward boosts',async({p,step,notes})=>{await p.keyboard.press('Shift');await p.keyboard.down('w');await step(45);notes.push({beforeBoost:await p.evaluate(()=>({pos:s.pos.toArray(),adv:backspoolAdvancedState()}))});for(let i=0;i<3;i++){await p.keyboard.press('Space');await step(35)}await p.keyboard.up('w');await step(160)},{wall:true});
  assert.deepEqual(errors,[]);assert(trials.every(t=>!t.notes.some(n=>n.failure)),'Trial program failed; inspect notes');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
