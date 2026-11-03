/* One supported hero/camera starting fixture, then only standard controller and
 * visible Pause/Resume. No damage-count, collider, target, rail or NPC edits. */
const{openMarket,selectHero,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs'),assert=require('assert/strict');
const report={status:'FAIL',scope:'A real Sightline rail shot into a loaded original city facade, geometry/nav revision and pedestrian continuity, native pause and debris disposal. One legal breach is not complete destruction/collapse or original courier acceptance.'};
(async()=>{let h;try{h=await openMarket(report);const{p,step,capture}=h;await selectHero(p,'sightline',step,report);
 const site=await p.evaluate(()=>{
  for(const [index,owner]of buildingColliders.entries()){
   if(!owner.importedKind||owner.destroyed||owner.nonDestructible||courier.civilians.some(c=>c.roof===owner)||owner.box.getCenter(new THREE.Vector3()).length()>650)continue;
   for(const c of owner.parts||[owner]){
    const b=c.box;if(b.max.y<8||b.min.y>1||b.max.x-b.min.x<5||b.max.z-b.min.z<5)continue;
    for(const normal of[new THREE.Vector3(0,0,1),new THREE.Vector3(0,0,-1),new THREE.Vector3(1,0,0),new THREE.Vector3(-1,0,0)]){
     const axis=normal.x?'x':'z',point=b.getCenter(new THREE.Vector3());point[axis]=normal[axis]>0?b.max[axis]:b.min[axis];point.y=1.4;
     const from=point.clone().addScaledVector(normal,10);from.y=supportHeight(from.x,from.z,1);if(from.y>1)continue;
     const near=point.clone().addScaledVector(normal,.8).setY(from.y);
     if(sweptStaticCharacterHit(from,near))continue;
     if(v02FriendlyContactState().actors.some(a=>Math.abs(a.position[1]-from.y+.42)<2&&Math.hypot(a.position[0]-from.x,a.position[2]-from.z)<3))continue;
     window.__legalImpactOwner=owner;return{index,from:from.toArray(),normal:normal.toArray(),yaw:Math.atan2(normal.x,normal.z),part:b.min.toArray().concat(b.max.toArray()),initialDamage:owner.damageCount||0,initialParts:owner.parts?.length,initialNavigation:actionWorldState().navigation.version};
    }
   }
  }throw Error('No real supported city facade approach');
 });report.site=site;
 await p.evaluate(site=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.fromArray(site.from);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=site.yaw;cam.pitch=cam.targetPitch=-.03;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(s.pos).add(new THREE.Vector3(...site.normal).multiplyScalar(4.25)).add(new THREE.Vector3(0,2,0));camera.lookAt(cam.focus);marketPad.axes=[0,0,0,0];marketPad.buttons[6]={pressed:true,value:1};},site);
 await step(60);report.aim=await p.evaluate(()=>({point:s.target?.toArray(),intended:s.targetObj===__legalImpactOwner.mesh,normal:s.targetNormal.toArray(),hero:s.pos.toArray()}));assert(report.aim.intended,'Initial native aim did not acquire the selected facade '+JSON.stringify(report.aim));
 await p.evaluate(()=>marketPad.buttons[7]={pressed:true,value:1});await step();await p.evaluate(()=>marketPad.buttons[7]={pressed:false,value:0});
 const rows=[];let previous=await p.evaluate(()=>streetAtmosphere.walkers.map(w=>w.group.position.toArray()));
 for(let i=0;i<360;i++){await step();const row=await p.evaluate(()=>({hero:s.pos.toArray(),mode:s.mode,damage:__legalImpactOwner.damageCount||0,parts:__legalImpactOwner.parts?.length,nav:actionWorldState().navigation.version,debris:destruction.debris.length,hits:destruction.hits,walkers:streetAtmosphere.walkers.map(w=>w.group.position.toArray()),civilianRoles:courier.civilians.map(c=>({role:c.role,rescued:c.rescued,position:c.group.position.toArray()}))}));
  row.maximumWalkerStep=Math.max(...row.walkers.map((a,j)=>Math.hypot(...a.map((v,k)=>v-previous[j][k]))));previous=row.walkers;rows.push(row);if(row.damage>site.initialDamage&&row.nav>site.initialNavigation&&i>90)break;
 }
 report.damageTrace=rows;const damaged=rows.find(r=>r.damage>site.initialDamage);assert(damaged,'Real input did not damage original building');assert(rows.some(r=>r.mode==='TRANSIT'),'No legal rail flight occurred');assert(rows.at(-1).nav>site.initialNavigation,'Damage did not refresh navigation');assert(rows.every(r=>r.maximumWalkerStep<.35),'Navigation refresh teleported a pedestrian');await p.evaluate(()=>marketPad.buttons[6]={pressed:false,value:0});await capture('legal-building-breach');
 await p.click('#v02Tools');await step(2);const paused=await p.evaluate(()=>({active:gameActive,life:destruction.debris.map(d=>d.life),clock:actionWorld.clock(),nav:actionWorldState().navigation.version}));await step(60);assert.deepEqual(await p.evaluate(()=>({active:gameActive,life:destruction.debris.map(d=>d.life),clock:actionWorld.clock(),nav:actionWorldState().navigation.version})),paused,'Paused destruction simulation advanced');await p.click('#start');await step(480);
 report.final=await p.evaluate(()=>({damage:__legalImpactOwner.damageCount,parts:__legalImpactOwner.parts.length,debris:destruction.debris.length,nav:actionWorldState().navigation,hero:s.pos.toArray()}));assert.equal(report.final.debris,0,'Expired impact debris lingered');assert.deepEqual(report.errors,[]);report.status='PASS native Sightline shot breaches real original facade, refreshes navigation, preserves observed walker continuity and pauses/disposes debris';
}catch(e){report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{if(h){await h.p.evaluate(()=>renderNight(0)).catch(()=>{});await h.p.screenshot({path:D+'/evidence/legal-destruction-final.png'}).catch(()=>{});await h.browser.close();}saveEvidence(D,'V02_Legal_Destruction_Input.json',report);console.log(report.status);}})();
