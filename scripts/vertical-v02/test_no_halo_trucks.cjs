/* No halo trucks: the truck model is never requested, no truck objects or truck colliders exist, the halo state reports
   zero vehicles, and the city runs 10 s with Backspool walking (simulated controller) without page errors.
   Labelled setup: Backspool placed on the lower public loop, then a simulated controller follows the loop. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_No_Halo_Trucks_Build.json')));
 const out=process.env.V02_TRUCKS_OUT||'development/vertical-city-v02/evidence/no-halo-trucks';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1100,height:700}}),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
 await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:180000});
 await p.click('#v02Start');
 const graph=JSON.parse(fs.readFileSync('development/vertical-city-v02/V02_Movement_Graph.json')),nm=new Map(graph.nodes.map(n=>[n.id,n.position])),route=graph.loops.find(x=>x.id==='lower').nodes.map(id=>nm.get(id));
 const r=await p.evaluate(route=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(55,24.42,210);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);
  window.tPad={index:0,id:'t',mapping:'standard',connected:true,axes:[.3,-1,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[tPad];const start=s.pos.clone();
  let ri=1;for(let i=0;i<600;i++){let q=route[ri],dx=q[0]-s.pos.x,dz=q[2]-s.pos.z,d=Math.hypot(dx,dz);if(d<.3){ri=ri+1<route.length?ri+1:1;q=route[ri];dx=q[0]-s.pos.x;dz=q[2]-s.pos.z;d=Math.hypot(dx,dz);}const m=Math.min(1,Math.max(.12,d/6.16));tPad.axes[0]=(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/Math.max(d,1e-9)*(.1+.9*m);tPad.axes[1]=(dx*Math.sin(cam.yaw)+dz*Math.cos(cam.yaw))/Math.max(d,1e-9)*(.1+.9*m);tickFrame(1/60,i%4===0);}const truckObjects=[];scene.traverse(o=>{if(/halo surveillance truck/i.test(o.name))truckObjects.push(o.name)});
  const truckColliders=propColliders.filter(c=>/halo surveillance truck/i.test(c.mesh?.name||'')).length,truckObstacles=cameraObstacles.filter(o=>/halo surveillance truck/i.test(o.name)).length;
  return{state:haloTruckState(),truckObjects,truckColliders,truckObstacles,root:haloTrucks.root.children.length,moved:s.pos.distanceTo(start)};},route);
 await p.evaluate(()=>renderNight(0));await p.screenshot({path:out+'/street.png'});
 const truckRequests=requests.filter(u=>/milktruck/i.test(u));
 assert.deepEqual(truckRequests,[],'The truck model is never requested');
 assert(r.state.count===0&&r.state.vehicles.length===0&&r.root===0&&r.truckObjects.length===0&&r.truckColliders===0&&r.truckObstacles===0,'No trucks, truck colliders or truck obstacles: '+JSON.stringify(r));
 assert(r.moved>5,'Backspool walked under the simulated controller: '+r.moved);assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),results:r,truckRequests,errors},null,1));
 console.log('PASS no halo trucks',JSON.stringify({removed:r.state.removed,moved:+r.moved.toFixed(1)}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
