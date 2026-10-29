/* Legal walking approach to the new curved parapets. Each case has one labelled
 * setup pose; actual keyboard input drives all motion afterward. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),zlib=require('zlib');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),E=path.join(D,'evidence/slender-crossings-guards');fs.mkdirSync(E,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const b=read('development/vertical-city-v02/V02_Slender_Crossings_Build.json'),plan=read('development/vertical-city-v02/V02_Slender_Crossings_Plan.json');
const report={status:'FAIL',entry:b.entry,entrySHA256:sha(b.entry),manifestSHA256:sha(b.manifest),testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),cases:[],errors:[],scope:'Thirty-three normal walking approaches to retained curved parapets, three span positions per guarded side. Labelled initial setup only. No high-speed impact, leap-over/fall or physical-device acceptance.'};let browser,page;
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});page=await browser.newPage({viewport:{width:1280,height:800}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:8766/'+b.entry+'?capture=backspool');await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready&&!v02RimShadowState().error&&!characterState().busy,null,{timeout:120000});
 await page.click('#v02Start');await page.evaluate(()=>window.requestAnimationFrame=()=>0);await page.waitForTimeout(100);
 for(const d of plan.designs){
  const guards=plan.changes.filter(c=>c.before.sourceSurface===d.id&&c.before.guardrail&&c.before.solid);
  for(const c of guards){const sign=c.before.center[2]>d.z?1:-1;
   for(const [tag,x]of[['west-flare',d.x0+3.5],['middle',(d.x0+d.x1)/2],['east-flare',d.x1-3.5]]){
    const f=Math.min(1,(x-d.x0)/7,(d.x1-x)/7),edge=sign<0?d.z-3.5+d.southInset*f:d.z+3.5-d.northInset*f,z=edge-sign*.85;
    await page.evaluate(({x,z,y})=>{startGame(false);resetPlayer();clearInput();clearPad();resetMechanicInput();s.pos.set(x,y+.42,z);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));for(let i=0;i<3;i++)tickFrame(1/60,false);}, {x,z,y:d.topY});
    if(await page.evaluate(()=>threadrailGame.sprinting()))await page.keyboard.press('Shift');if(!await page.evaluate(()=>backspoolFlow.walking()))await page.keyboard.press('o');
    const initial=await page.evaluate(()=>({position:s.pos.toArray(),trauma:courier.trauma,radius:playerBodyRadius()}));const key=sign<0?'w':'s';await page.keyboard.down(key);
    const trace=await page.evaluate(()=>{const out=[];for(let i=0;i<90;i++){tickFrame(1/60,false);out.push({position:s.pos.toArray(),velocity:s.vel.toArray(),grounded:s.onGround,trauma:courier.trauma});}return out;});await page.keyboard.up(key);await page.evaluate(()=>{for(let i=0;i<12;i++)tickFrame(1/60,false);renderNight(0);});
    assert(trace.every(r=>r.grounded&&Math.abs(r.position[1]-d.topY-.42)<.05&&r.trauma===initial.trauma),'Guard approach lost safe support');
    assert(trace.every(r=>sign*(r.position[2]-edge)<=-.30),'Actor passed through the visible parapet');
    assert(trace.every(r=>Math.abs(r.position[0]-x)<.25),'Unexpected sideways displacement at curved contact');
    const last=trace.at(-1);assert(Math.abs(last.position[2]-initial.position[2])>.04,'No ordinary input movement occurred');assert(Math.hypot(last.velocity[0],last.velocity[2])<.3,'Walking did not stop at guard');
    const row={bridge:d.id,guard:c.before.id,side:sign,position:tag,setup:initial,edge,final:last,frames:trace.length,trace};
    if(tag==='middle'&&sign<0){const file=path.join(E,d.id+'.png');await page.screenshot({path:file});row.capture=path.relative(R,file);row.captureSHA256=sha(row.capture);}
    report.cases.push(row);console.log('PASS',d.id,sign,tag);
   }
  }
 }
 assert.equal(report.cases.length,33);assert.deepEqual(report.errors,[]);report.status='PASS33 normal-input curved-guard walking approaches; broader traversal/destruction/release acceptance separate';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;if(page)await page.screenshot({path:path.join(E,'failure.png')}).catch(()=>{});}
finally{const file=path.join(E,'traces.json.gz');fs.writeFileSync(file,zlib.gzipSync(JSON.stringify(report.cases.map(({trace,...row})=>({...row,trace})))));for(const row of report.cases)delete row.trace;report.traceFile=path.relative(R,file);report.traceSHA256=sha(report.traceFile);fs.writeFileSync(path.join(D,'V02_Slender_Crossings_Guards.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status);}})();
