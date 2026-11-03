/* Reproduce real friendly-body contacts using ordinary controller input.
 * Only a labelled initial hero fixture is positioned per case. No NPC,
 * collision, health, clock, velocity or route edits during input playback. */
const fs=require('fs'),crypto=require('crypto');
const{openMarket,selectHero,D,R}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs'),assert=require('assert/strict'),path=require('path');
const report={status:'FAIL',testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),cases:[],scope:'Current native friendly contacts, walking approaches, supported sidesteps and route continuation, pause/resume and both heroes. One labelled hero fixture per case; no NPC/health/velocity writes during input. Not physical hardware or final city certification.'};
(async()=>{let h;try{
 h=await openMarket(report);const{p,step,walking,capture}=h;await walking(true);
 const admission=await p.evaluate(()=>{const route=verticalMarketState().config.patrols[0],a=new THREE.Vector3(...route[0]),b=new THREE.Vector3(...route[1]);return{staticClear:backspoolCombat.safeStaticGroundMove(a,b.clone(),.38),liveClear:backspoolCombat.safeGroundMove(a,b.clone(),.38),route};});
 assert(admission.staticClear&&!admission.liveClear,'Static route admission and live occupied movement were not separated');report.cases.push({name:'static route admission retains live friendly occupancy for actual movement',admission});

 async function initial(point){await p.evaluate(point=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.fromArray(point);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);marketPad.axes=[0,0,0,0];s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.12;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.2,0));camera.position.copy(s.pos).add(new THREE.Vector3(1.35,2.4,4.24));camera.lookAt(s.pos.clone().add(new THREE.Vector3(0,1.5,-15)));camera.updateMatrixWorld(true);},point);if(!await p.evaluate(()=>backspoolFlow.walking()))await p.keyboard.press('o');}
 async function moveStraight(target,frames,id,kind){const rows=[];for(let i=0;i<frames;i++){
  await p.evaluate(t=>{const dx=t[0]-s.pos.x,dz=t[2]-s.pos.z,d=Math.hypot(dx,dz);marketPad.axes[0]=d>.08?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d:0;marketPad.axes[1]=d>.08?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d:0;},target);await step();
  rows.push(await p.evaluate(({id,kind})=>{const group=kind==='market'?scene.getObjectByName('Market resident / rescue'):streetAtmosphere.walkers[id].group;group.updateMatrixWorld(true);const foot=new THREE.Vector3(group.position.x,group.position.y,group.position.z),sole=new THREE.Box3().setFromObject(group).min.y,street=kind==='street'?streetAtmosphere.walkers[id]:null,support=street?(street.v02SupportY??group.position.y):group.position.y;return{support,route:street?{edge:street.routeEdge,distance:street.routeDistance,waiting:street.routeWaiting}:null,hero:s.pos.toArray(),velocity:s.vel.toArray(),position:foot.toArray(),sole,grounded:s.onGround,trauma:courier.trauma,gap:Math.hypot(s.pos.x-foot.x,s.pos.z-foot.z),phase:verticalMarketState().phase,destructionHits:destruction.hits,bodyContacts:window.v02FriendlyContactState?((d)=>({contacts:d.contacts,streetWaits:d.streetWaits,last:d.last,actors:d.actors.length}))(v02FriendlyContactState()):null};},{id,kind}));
 }
 await p.evaluate(()=>marketPad.axes=[0,0,0,0]);await step(12);return rows;}
 const resident=await p.evaluate(()=>verticalMarketState().civilians[0]);
 await initial([resident.position[0],resident.position[1]+.42,resident.position[2]-3]);
 const fixed=await moveStraight([resident.position[0],resident.position[1],resident.position[2]+2],220,0,'market');
 assert(Math.min(...fixed.map(x=>x.gap))>=.93,'Fixed resident body penetration');assert(fixed.every(x=>x.trauma===0&&x.phase==='idle'),'Friendly approach changed health or incident phase');assert(fixed.every(x=>x.destructionHits===fixed[0].destructionHits),'Friendly body made surface damage');
 report.cases.push({name:'fixed stranded resident before escort',fixture:'Initial supported market approach; resident remains at actual incident anchor',minimum:Math.min(...fixed.map(x=>x.gap)),trace:fixed});await capture('fixed-resident-body');
 async function steer(target,limit=1600){for(let i=0;i<limit;i++){
  const distance=await p.evaluate(t=>{const dx=t[0]-s.pos.x,dz=t[2]-s.pos.z,d=Math.hypot(dx,dz);marketPad.axes[0]=d>.13?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d:0;marketPad.axes[1]=d>.13?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d:0;return d},target);await step();if(distance<.16){await p.evaluate(()=>marketPad.axes=[0,0,0,0]);await step(12);return;}
 }throw Error('Normal-input detour stalled '+JSON.stringify(target));}
 const fixedPosition=await p.evaluate(()=>s.pos.toArray());
 for(const t of [[resident.position[0]+1.35,24,fixedPosition[2]],[resident.position[0]+1.35,24,resident.position[2]+2],[resident.position[0],24,resident.position[2]+2]])await steer(t);
 const fixedAfter=await p.evaluate(()=>({hero:s.pos.toArray(),resident:verticalMarketState().civilians[0],trauma:courier.trauma}));
 assert(fixedAfter.hero[2]>resident.position[2]+1.5,'Hero could not continue around resident');assert.deepEqual(fixedAfter.resident.position,resident.position,'Fixed resident was displaced');assert.equal(fixedAfter.trauma,0);report.cases.push({name:'normal-input detour around fixed incident body',final:fixedAfter});await capture('fixed-resident-detour');
 const site=await p.evaluate(()=>{
  const choices=streetAtmosphere.walkers.map((w,index)=>({w,index})).filter(({w})=>w.routeEdge&&w.group.position.length()<700).sort((a,b)=>a.w.group.position.lengthSq()-b.w.group.position.lengthSq());
  for(const{w,index}of choices){const edge=roadNetwork.pedestrian.edges.find(e=>e.id===w.routeEdge);if(!edge||edge.kind!=='sidewalk'||w.routeDistance<8||w.routeDistance>edge.length-8)continue;const direction=new THREE.Vector3(Math.sin(w.group.rotation.y),0,Math.cos(w.group.rotation.y));
   const feet=w.v02SupportY??w.group.position.y,from=w.group.position.clone().addScaledVector(direction,3.5),to=w.group.position.clone().addScaledVector(direction,-4);from.y=supportHeight(from.x,from.z,feet+1);to.y=from.y;
   const staticHit=typeof sweptStaticCharacterHit==='function'?sweptStaticCharacterHit(from,to):sweptCharacterHit(from,to);if(Math.abs(from.y-feet-.42)>.04||staticHit)continue;
   return{index,position:w.group.position.toArray(),from:from.toArray(),to:to.toArray(),route:w.routeEdge,kind:edge.kind};}
  throw Error('No supported real ground pedestrian approach');
 });
 report.streetFixture=site;await initial(site.from);
 const street=await moveStraight(site.to,240,site.index,'street');report.cases.push({name:'original road-owned pedestrian',fixture:site,minimum:Math.min(...street.map(x=>x.gap)),trace:street});await capture('street-pedestrian-body');
 assert(Math.min(...street.map(x=>x.gap))>=.87,'Street pedestrian body penetration');assert(street.every(x=>x.trauma===0),'Street contact caused health loss');assert(street.every(x=>Math.abs(x.sole-x.support)<.003),'Street pedestrian visible foot offset');assert(street.some(x=>x.route.waiting),'Street walker never waited for hero occupancy');
 const beforePause=await p.evaluate(()=>({contact:v02FriendlyContactState(),walker:streetAtmosphere.walkers[14].group.position.toArray(),clock:roadNetworkState().clock}));
 await p.click('#v02Tools');await step(60);assert.equal(await p.evaluate(()=>gameActive),false);assert.deepEqual(await p.evaluate(()=>v02FriendlyContactState()),beforePause.contact,'Pause changed friendly simulation');
 await p.click('#start');await step(2);assert.equal(await p.evaluate(()=>gameActive),true);
 const streetStart=await p.evaluate(i=>streetAtmosphere.walkers[i].group.position.toArray(),site.index),hero=await p.evaluate(()=>s.pos.toArray());
 for(const t of [[site.from[0]+1.4,0,hero[2]],[site.to[0]+1.4,0,site.to[2]],[site.to[0],0,site.to[2]]])await steer(t);
 const resumedBefore=await p.evaluate(i=>streetAtmosphere.walkers[i].group.position.toArray(),site.index);await step(180);const resumed=await p.evaluate(i=>streetAtmosphere.walkers[i].group.position.toArray(),site.index);
 assert(Math.hypot(resumed[0]-resumedBefore[0],resumed[2]-resumedBefore[2])>1,'Street walker did not resume');report.cases.push({name:'street detour, pause/resume and same NPC continuation',before:streetStart,after:resumed,hero:await p.evaluate(()=>s.pos.toArray())});await capture('street-pedestrian-detour');
 await selectHero(p,'sightline',step,report);
 const other=await p.evaluate(i=>{const w=streetAtmosphere.walkers[i],direction=new THREE.Vector3(Math.sin(w.group.rotation.y),0,Math.cos(w.group.rotation.y));return{from:w.group.position.clone().addScaledVector(direction,3).setY((w.v02SupportY??w.group.position.y)+.42).toArray(),to:w.group.position.clone().addScaledVector(direction,-3).toArray()}},site.index);
 await initial(other.from);const sightline=await moveStraight(other.to,150,site.index,'street');assert(Math.min(...sightline.map(x=>x.gap))>=.87,'Sightline crossed a friendly body');assert(sightline.every(x=>x.trauma===0),'Sightline friendly contact caused damage');report.cases.push({name:'Sightline uses the same live body solver',minimum:Math.min(...sightline.map(x=>x.gap)),trace:sightline});await capture('sightline-street-body');

 report.status='PASS native friendly body clearance, detours, street support, pause/resume and both heroes';console.log(report.cases.map(c=>({name:c.name,minimum:c.minimum})));
 assert.deepEqual(report.errors,[]);
}catch(error){report.status='FAIL fixture or native contact probe';report.failure=error.stack||String(error);console.error(error);process.exitCode=1;}finally{if(h)await h.browser.close();saveEvidence(D,'V02_Friendly_Contacts_Native.json',report);}})();
