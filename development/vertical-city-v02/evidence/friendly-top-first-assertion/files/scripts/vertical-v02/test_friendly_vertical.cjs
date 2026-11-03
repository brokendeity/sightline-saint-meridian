const{openMarket,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs'),assert=require('assert/strict');
const report={status:'FAIL',cases:[],scope:'Four controlled airborne starting fixtures; all recovery through native gravity/capsule/static sweeps. No pose, NPC, health or velocity edits after each initial setup. Not all possible crowd or ledge arrangements.'};
(async()=>{let h;try{h=await openMarket(report);const{p,step,capture}=h;
 for(const offset of [[0,0],[.25,0],[-.25,0],[0,.25]]){
  await p.evaluate(offset=>{const point=verticalMarketState().civilians[0].position;resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(point[0]+offset[0],point[1]+5,point[2]+offset[1]);s.vel.set(0,-1,0);s.onGround=false;setMode(P.AIR);marketPad.axes=[0,0,0,0];},offset);
  const rows=[];for(let i=0;i<300;i++){await step();rows.push(await p.evaluate(()=>({position:s.pos.toArray(),velocity:s.vel.toArray(),grounded:s.onGround,mode:s.mode,health:100-courier.trauma,hits:destruction.hits,contacts:v02FriendlyContactState().contacts,deflections:v02FriendlyContactState().topDeflections,last:v02FriendlyContactState().last})));}
  const final=rows.at(-1);assert(final.grounded&&final.mode==='GROUND','Hero remains suspended on a civilian');assert(Math.abs(final.position[1]-24.42)<.02,'Hero did not reach the supported market floor');
  assert(rows.every(r=>r.health===100&&r.hits===rows[0].hits),'Friendly top contact caused health/destruction');assert(rows.some(r=>r.last?.id==='Market resident / rescue'),'No actual friendly body contact');
  assert(rows.every((r,i)=>!i||Math.hypot(...r.position.map((v,k)=>v-rows[i-1].position[k]))<.35),'Recovery teleported the hero');
  report.cases.push({offset,final,trace:rows});await capture('friendly-top-'+offset.join('-'));
 }
 assert.deepEqual(report.errors,[]);report.status='PASS four native friendly-top fall recoveries, supported landing and no damage/teleport';
}catch(e){report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{await h?.browser.close();saveEvidence(D,'V02_Friendly_Vertical.json',report);console.log(report.status);}})();
