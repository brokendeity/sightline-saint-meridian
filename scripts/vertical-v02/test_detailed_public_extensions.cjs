/* Actual access to both new public architectural destinations. Each scenario
 * has a labelled initial fixture; its route uses ordinary input throughout. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
assert.equal(process.env.V02_STAGE,'detailed','Do not accidentally certify the graybox');
const{openMarket,D,R}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs');
const report={status:'FAIL',scope:'New market graph access/ascent/return, plus a separately labelled observation-pavilion fixture. Ordinary walk input only; no jumps, health writes, power releases or route-node teleporting.',results:[],setups:[]};
(async()=>{let h;try{
 h=await openMarket(report);const{p,move,step,walking}=h;
 const metadata=JSON.parse(fs.readFileSync(path.join(R,report.manifest))),edges=metadata.navigation.edges;
 const capture=async name=>{await p.evaluate(()=>renderNight(0));await p.screenshot({path:path.join(D,'evidence/detailed-public-'+name+'.png')})};
 await walking(true);report.setups.push({scenario:'market',position:[62,24.42,375],scope:'Initial helper fixture only; subsequently walk to the market information node'});
 for(const t of [[62,24,357],[64,24,357],[64,24,356]])await move(t);
 for(const id of ['detail-market-access','detail-market-ascent','detail-market-ascent-return','detail-market-access-return']){
   const edge=edges.find(e=>e.id===id);assert(edge,id);const start=h.frames();
   for(const point of edge.path)await move(point);
   report.results.push({id,pass:true,seconds:(h.frames()-start)/60,from:edge.source,to:edge.destination,ability:edge.ability});
   if(id==='detail-market-ascent')await capture('market-terrace');
 }
 await capture('market-return');
 assert(report.trace.every(t=>t.grounded&&t.trauma===0),'Public market extension lost support or caused injury');
 assert.equal(await p.evaluate(()=>threadrailGame.state().releaseEvents.length),0);
 // A new scenario begins here. No inter-layer traversal claim is made from
 // this controlled setup; the retained discovery tour tests that public link.
 report.setups.push({scenario:'observation',position:[76,128.42,420],scope:'Separate initial public-deck fixture; not a traversal between graph nodes'});
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(76,128.42,420);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=-Math.PI/2;cam.pitch=cam.targetPitch=-.12;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.32,0));camera.position.copy(cam.focus).add(new THREE.Vector3(-4.25,.32,1.35));camera.lookAt(cam.focus);camera.updateMatrixWorld(true);marketPad.axes=[0,0,0,0]});
 await step(4);await walking(true);const start=h.frames();
 for(const t of [[76,128,420],[80.4,128,420],[80.4,128,424],[76,128,424],[76,128,420]])await move(t);
 await capture('observation-return');
 assert(report.trace.every(t=>t.grounded&&t.trauma===0));assert.equal(await p.evaluate(()=>threadrailGame.state().releaseEvents.length),0);
 report.results.push({id:'observation-pavilion',pass:true,seconds:(h.frames()-start)/60,scope:'Ordinary supported west-entry walk into shelter, along windscreen and out again'});
 assert.deepEqual(report.errors,[]);report.status='PASS new market directed access/stair edges and observation shelter walking';console.log(report.status,JSON.stringify(report.results));
 }catch(error){report.failure=String(error);console.error(error);process.exitCode=1}finally{
  if(h){await h.p.evaluate(()=>renderNight(0)).catch(()=>{});await h.p.screenshot({path:path.join(D,'evidence/detailed-public-final.png')}).catch(()=>{});await h.browser.close()}
  saveEvidence(D,'V02_Detailed_Public_Extensions.json',report);
 }
})();
