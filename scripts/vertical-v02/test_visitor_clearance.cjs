/* Current full-game visitor interaction: ordinary input after one labelled
 * player fixture per case; NPC routes, positions, clocks and poses untouched. */
const {openMarket,D,R}=require('./market_test_helpers.cjs');
const {saveEvidence}=require('./evidence_io.cjs'),assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const report={status:'FAIL',cases:[],scope:'Actual rigid visitor meshes, supported bounded steps, native camera rays, natural dwell and normal simulated-controller movement. Initial player fixture per case only; no NPC writes. Not all city interactions or physical-device certification.'};
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
report.testSHA256=sha(__filename);
function check(condition,text){assert(condition,text);}
(async()=>{let h;try{
 h=await openMarket(report);const{p,step,move,walking,capture}=h;
 const b=JSON.parse(fs.readFileSync(path.join(R,'development/vertical-city-v02',process.env.V02_GAMEPLAY_BUILD)));
 report.actualModules={};for(const key of ['marketScript','worldLifeScript'])if(b[key])report.actualModules[b[key]]=sha(path.join(R,b[key]));
 await walking(true);
 // Wait for an actual route arrival, then put only the hero on a supported
 // approach. The dwell itself is neither manufactured nor extended.
 let chosen;
 for(let i=0;i<1200;i++){
  await step();chosen=await p.evaluate(()=>verticalWorldLifeState().people.find(x=>x.route==='market-visitors'&&x.dwell>4.5&&x.position[0]>65));
  if(chosen)break;
 }
 check(chosen,'No naturally dwelling market visitor');
 await p.evaluate(point=>{s.pos.set(point[0]-2.4,24.42,point[2]);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);marketPad.axes=[0,0,0,0];},chosen.position);
 const rows=[];
 async function sample(n=1){const before=await p.evaluate(()=>verticalWorldLifeState());await step(n);const data=await p.evaluate(({id,before})=>{
  model.updateMatrixWorld(true);camera.updateMatrixWorld(true);const world=verticalWorldLifeState(),person=world.people.find(x=>x.id===id),object=scene.getObjectByName(person.route+' / visitor '+person.id.slice(person.route.length+1));
  const rays=['Hips','Head'].map(name=>{const point=model.getObjectByName('mixamorig'+name).getWorldPosition(new THREE.Vector3()),delta=point.sub(camera.position),distance=delta.length();return{name,blocked:!!new THREE.Raycaster(camera.position,delta.normalize(),0,distance-.02).intersectObject(object,true).length}});
  const prior=before.people.find(x=>x.id===id),position=new THREE.Vector3(...person.position),actual=scene.getObjectByName('V02 public world life').children.find(x=>x.children.includes(object));actual.updateMatrixWorld(true);
  return{hero:s.pos.toArray(),velocity:s.vel.toArray(),camera:camera.position.toArray(),person,gap:Math.hypot(s.pos.x-position.x,s.pos.z-position.z),move:position.distanceTo(new THREE.Vector3(...prior.position)),support:verticalDistrict.surfaceFeetAt(position.x,position.z,position.y+.42),sole:new THREE.Box3().setFromObject(actual).min.y,rays};
 },{id:chosen.id,before});rows.push(data);return data;}
 let closest=Infinity;
 for(let i=0;i<110;i++){
  // Walk toward the original waiting location, then stop before the point.
  await p.evaluate(point=>{const dx=point[0]-.6-s.pos.x,dz=point[2]-s.pos.z,d=Math.hypot(dx,dz);marketPad.axes[0]=d>.06?(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/d:0;marketPad.axes[1]=d>.06?-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/d:0;},chosen.position);
  const row=await sample();closest=Math.min(closest,row.gap);
 }
 await p.evaluate(()=>marketPad.axes=[0,0,0,0]);for(let i=0;i<120;i++)await sample();
 const first=rows[0],last=rows.at(-1);await capture('visitor-natural-dwell');
 report.cases.push({name:'normal walking approach to a naturally dwelling visitor',chosen,closest,first,last,rows});
 check(closest>=.87-1e-5,'Natural dwell permits player/visitor capsule overlap: '+closest);
 check(rows.every(r=>Math.abs(r.sole-24)<.003&&Math.abs(r.support-24.42)<.02),'Yield left supported visible floor');
 check(rows.every(r=>r.move<=1.6/60+.0001),'Visitor teleported or exceeded supported sidestep speed');
 check(last.person.walked>first.person.walked+.25,'Dwelling visitor never stepped aside');
 const paused=await p.evaluate(()=>{gameActive=false;return verticalWorldLifeState()});await step(90);check(JSON.stringify(await p.evaluate(()=>verticalWorldLifeState()))===JSON.stringify(paused),'Pause mutated world life');await p.evaluate(()=>gameActive=true);
 // Move away through ordinary input and verify the same route progresses.
 await move([62,24,375]);const before=await p.evaluate(id=>verticalWorldLifeState().people.find(p=>p.id===id),chosen.id);await step(900);const after=await p.evaluate(id=>verticalWorldLifeState().people.find(p=>p.id===id),chosen.id);
 check(after.walked>before.walked+1,'Visitor did not resume route');report.cases.push({name:'pause freezes and departure resumes same route',before,after});
 check(report.errors.length===0,'Console errors');report.status='PASS native visitor dwell separation, supported yielding, pause and route recovery';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;}finally{if(h){await h.p.evaluate(()=>renderNight(0)).catch(()=>{});await h.p.screenshot({path:path.join(D,'evidence/visitor-final.png')}).catch(()=>{});await h.browser.close();}saveEvidence(D,'V02_Visitor_Clearance.json',report);console.log(report.status);}})();
