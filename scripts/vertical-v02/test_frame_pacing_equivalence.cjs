/* Frame pacing equivalence: the cached ray broadphase bounds and the partitioned drone/camera rays return exactly what the
   original code returns. While the live city runs (train, trucks, walkers moving; Backspool walking under a simulated
   controller), each frame compares, for random segments around the player and the train:
   - obstacleCandidates (cached bounds) vs the original inline computation (fresh updateMatrixWorld + transformed box);
   - v02CameraRays.intersect vs native Raycaster.intersectObjects over walkables and camera obstacles (object, face, distance).
   Also checks the truck junction yield (indexed edge lookup) against the original linear find for every walker.
   Labelled setup: Backspool placed on the lower public loop. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/V02_Frame_Pacing_Build.json'));
 const out=process.env.V02_PACING_OUT||'development/vertical-city-v02/evidence/frame-pacing';fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1100,height:700}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&characterState().active==='backspool'&&!characterState().busy&&window.v02FramePacing,null,{timeout:180000});
 await p.click('#v02Start');
 const results=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(55,24.42,210);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;
  window.eqPad={index:0,id:'eq',mapping:'standard',connected:true,axes:[0,-1,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[eqPad];
  const original=(start,end,padding=.3,targets=cameraObstacles)=>{const area=new THREE.Box3(start.clone().min(end),start.clone().max(end)).expandByScalar(padding),o=[];for(const mesh of targets){if(!mesh.geometry?.attributes.position?.count)continue;let box=mesh.userData.collisionBounds;if(!box){mesh.updateMatrixWorld();if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();box=mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)}if(box.intersectsBox(area)&&(!mesh.userData.collisionOwner?.parts||mesh.userData.collisionOwner.parts.some(p=>p.box.intersectsBox(area))))o.push(mesh)}return o;};
  let seed=12345;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const r={frames:0,segments:0,candidateMismatches:0,rays:0,hits:0,rayMismatches:0,yieldChecks:0,yieldMismatches:0,trainSegments:0,examples:[]};
  const rc=new THREE.Raycaster(),train=scene.getObjectByName('Train_Front_lod0');
  for(let f=0;f<900;f++){if(f%240===0)eqPad.axes=[Math.sin(f),-.8,0,0];tickFrame(1/60,f%3===0);r.frames++;
   for(let k=0;k<4;k++){const nearTrain=k===3&&train;const c=nearTrain?train.getWorldPosition(new THREE.Vector3()):s.pos.clone();if(nearTrain)r.trainSegments++;
    const a=c.clone().add(new THREE.Vector3((rnd()-.5)*40,rnd()*30-5,(rnd()-.5)*40)),dir=new THREE.Vector3(rnd()-.5,rnd()-.6,rnd()-.5).normalize(),len=5+rnd()*165,b=a.clone().addScaledVector(dir,len);
    for(const [list,pad] of [[cameraObstacles,.3],[walkables,.1]]){const y=obstacleCandidates(a,b,pad,list),x=original(a,b,pad,list);r.segments++;if(x.length!==y.length||x.some((m,i)=>m!==y[i])){r.candidateMismatches++;if(r.examples.length<5)r.examples.push({kind:'candidates',f,x:x.length,y:y.length});}
     rc.set(a,dir);rc.far=len;const n=rc.intersectObjects(x,false),m=v02CameraRays.intersect(rc,y);r.rays++;r.hits+=n.length;
     if(n.length!==m.length||n.some((h,i)=>h.object!==m[i].object||h.faceIndex!==m[i].faceIndex||Math.abs(h.distance-m[i].distance)>1e-9)){r.rayMismatches++;if(r.examples.length<5)r.examples.push({kind:'ray',f,n:n.length,m:m.length,first:[n[0]?.distance,m[0]?.distance]});}}}
   for(const w of streetAtmosphere.walkers){const e1=roadNetwork.pedestrian.edges.find(e=>e.id===w.routeEdge),e2=w.routeEdge?roadNetwork.pedestrian.edges[+w.routeEdge.slice(1)]:null,ok1=!!(e1&&e1.kind==='crosswalk'),ok2=!!(e2&&e2.id===w.routeEdge&&e2.kind==='crosswalk');r.yieldChecks++;if(ok1!==ok2||(e1&&e1!==e2))r.yieldMismatches++;}}
  r.pacing=v02FramePacing.state();r.cameraRays=v02CameraRays.state();return r;});
 assert(results.segments>=7000&&results.rays>=7000&&results.hits>1000,'Enough segments, rays and hits were compared: '+JSON.stringify(results));
 assert(results.trainSegments>0&&results.pacing.boxesReused>0&&results.pacing.boxesComputed>0,'Both cached and recomputed bounds were exercised');
 assert.equal(results.candidateMismatches,0,'Cached broadphase bounds select exactly the original candidates: '+JSON.stringify(results.examples));
 assert.equal(results.rayMismatches,0,'Partitioned rays return exactly the native hits: '+JSON.stringify(results.examples));
 assert(results.yieldChecks>0&&results.yieldMismatches===0,'Indexed crossing lookup matches the linear find');
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/equivalence.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),results,errors},null,1));
 console.log('PASS equivalence',JSON.stringify({segments:results.segments,rays:results.rays,hits:results.hits,yield:results.yieldChecks,reused:results.pacing.boxesReused,computed:results.pacing.boxesComputed}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
