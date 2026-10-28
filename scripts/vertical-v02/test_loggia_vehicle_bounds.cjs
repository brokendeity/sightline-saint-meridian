/* Complete loaded-vertex radial bounds for the existing train and air assets.
 * Articulation is bounded analytically, not by sampling a few route positions.
 * Combine this with the continuous Bezier-hull clearance proof. No motion or
 * original city acceptance is inferred from this isolated envelope check. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex'),build=read('development/vertical-city-v02/V02_Loggia_Terraces_Build.json'),clearance=read('development/vertical-city-v02/V02_Loggia_Terraces_Clearance.json'),air=read('assets/city/vertical-v02/world-life/air_assets.json');
const report={status:'FAIL',scope:'Loaded original train body, arbitrary bogie yaw/wheel rotation, full configured sliding-door range, coupling convexity and complete air-model vertices. Only the additional loggia-versus-existing-transit separation is certified by combination with the continuous clearance hull.',entry:build.entry,hashes:{},errors:[]};
for(const f of [build.entry,build.manifest,'assets/city/vertical-v02/transit/assets.json','assets/city/vertical-v02/transit/definition.json','assets/city/vertical-v02/world-life/air_assets.json','assets/city/vertical-v02/world-life/air_routes.json','scripts/game_vertical_transit_v02.js','scripts/game_vertical_world_life_v02.js','scripts/vertical-v02/test_loggia_vehicle_bounds.cjs','development/vertical-city-v02/V02_Loggia_Terraces_Clearance.json'])report.hashes[f]=sha(f);
for(const m of air.models){assert.equal(sha(m.url),m.sha256);report.hashes[m.url]=sha(m.url);}
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(String(e)));await p.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalTransitState().ready&&verticalWorldLifeState().ready&&verticalMaterialResponseState().ready,null,{timeout:120000});await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 report.bounds=await p.evaluate(async({air})=>{
  const V=()=>new THREE.Vector3(),M=()=>new THREE.Matrix4(),root=scene.getObjectByName('V02 scheduled transit');root.updateMatrixWorld(true);
  const invariant=(ok,msg)=>{if(!ok)throw Error(msg)},relative=(o,origin)=>M().copy(origin.matrixWorld).invert().multiply(o.matrixWorld);
  function radius(o,origin){const matrix=relative(o,origin),a=o.geometry.getAttribute('position'),v=V();let r=0;for(let i=0;i<a.count;i++)r=Math.max(r,v.fromBufferAttribute(a,i).applyMatrix4(matrix).length());return{r,vertices:a.count};}
  function sphereScale(matrix){const a=V().setFromMatrixColumn(matrix,0),b=V().setFromMatrixColumn(matrix,1),c=V().setFromMatrixColumn(matrix,2),lengths=[a.length(),b.length(),c.length()];invariant(Math.max(...lengths)-Math.min(...lengths)<1e-5&&Math.max(Math.abs(a.dot(b)),Math.abs(a.dot(c)),Math.abs(b.dot(c)))<1e-5,'Expected rotation and uniform scale, no shear');return Math.max(...lengths);}
  function identity(matrix){const a=matrix.elements,b=M().elements;return Math.max(...a.map((v,i)=>Math.abs(v-b[i])))<1e-5;}
  const cars=[];
  for(let i=0;i<4;i++){
   const car=scene.getObjectByName('V02 carriage '+i);invariant(car,'Missing actual loaded car '+i);invariant(Math.abs(sphereScale(car.matrixWorld)-1)<1e-5,'Route pivot is not unit scale');const meshes=[];car.traverse(o=>{if(o.isMesh)meshes.push(o)});let maxRadius=0,vertices=0;const parts=[];
   for(const mesh of meshes){let bogie=null,axle=null,door=null;for(let o=mesh;o&&o!==car;o=o.parent){if(o.userData.transitRole==='bogie')bogie=o;if(o.userData.transitRole==='wheelAxle')axle=o;if(o.userData.transitRole==='slidingDoor')door=o;}let r,proof,detail;
    if(bogie){
     // Runtime assigns the car-local point on the same route to this pivot.
     invariant(identity(relative(bogie.parent,car)),'Bogie parent is not car-local');const scale=sphereScale(bogie.matrixWorld);
     if(axle){const geometry=radius(mesh,axle),pivot=axle.getWorldPosition(V()).applyMatrix4(M().copy(bogie.matrixWorld).invert()),axleScale=sphereScale(relative(axle,bogie));r=1.05+(pivot.length()+geometry.r*axleScale)*scale;proof='Route-following bogie pivot minus1.05m; arbitrary bogie yaw and full axle rotation enclosed by pivot-offset plus vertex sphere';detail={geometryRadius:geometry.r,pivotRadius:pivot.length(),axleScale,bogieScale:scale};vertices+=geometry.vertices;}
     else{const geometry=radius(mesh,bogie);r=1.05+geometry.r*scale;proof='Route-following bogie pivot minus1.05m plus rigid vertex sphere under arbitrary yaw';vertices+=geometry.vertices;}
    }else if(door){
     invariant(Number.isFinite(door.userData.homeX)&&Number.isFinite(door.userData.homeZ)&&Number.isFinite(door.userData.slideMetres),'Door source travel metadata missing');
     const parent=relative(door.parent,car),scale=sphereScale(parent),closed=door.position.clone();closed.x=door.userData.homeX;closed.z=door.userData.homeZ;
     const closedMatrix=parent.clone().multiply(M().compose(closed,door.quaternion,door.scale)).multiply(M().copy(door.matrixWorld).invert().multiply(mesh.matrixWorld)),a=mesh.geometry.getAttribute('position'),v=V();let base=0;for(let k=0;k<a.count;k++)base=Math.max(base,v.fromBufferAttribute(a,k).applyMatrix4(closedMatrix).length());
     r=base+scale*(.10+Math.abs(door.userData.slideMetres));vertices+=a.count;proof='Every closed-pose vertex plus triangle-inequality bound for entire0.10m plug and configured sliding range';detail={closedRadius:base,slide:door.userData.slideMetres,parentScale:scale};
    }else{const geometry=radius(mesh,car);r=geometry.r;vertices+=geometry.vertices;proof='Every actual rigid body vertex relative to the route pivot';}
    invariant(Number.isFinite(r),'Nonfinite radial bound');maxRadius=Math.max(maxRadius,r);parts.push({mesh:mesh.name,bound:r,proof,...detail});
   }
   cars.push({id:i,meshes:meshes.length,vertices,maxRadius,parts});
  }
  // Coupling endpoints are rigid car-local points. A cylinder between them is
  // contained in their convex hull expanded by its0.10m radius. The route proof
  // uses a convex bounding box; endpoints may lie at different route distances.
  const couplingRadius=Math.max(Math.hypot(.62,7),Math.hypot(.62,6.85))+.10;
  const aircraft=[];
  for(const asset of air.models){const object=await new Promise((resolve,reject)=>new THREE.GLTFLoader().load(asset.url,g=>resolve(g.scene),undefined,reject));object.updateMatrixWorld(true);let maxRadius=0,vertices=0,meshes=0;object.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.getAttribute('position'),v=V();for(let k=0;k<a.count;k++)maxRadius=Math.max(maxRadius,v.fromBufferAttribute(a,k).applyMatrix4(o.matrixWorld).length());vertices+=a.count;meshes++;});aircraft.push({id:asset.id,meshes,vertices,maxRadius});object.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
  return{cars,couplingRadius,aircraft,maximumTrainRadius:Math.max(couplingRadius,...cars.map(c=>c.maxRadius)),maximumAirRadius:Math.max(...aircraft.map(c=>c.maxRadius)),transit:verticalTransitState(),worldLife:verticalWorldLifeState().aircraft};
 },{air});
 assert.equal(report.bounds.cars.length,4);assert(report.bounds.cars.every(c=>c.vertices>0));assert(report.bounds.maximumTrainRadius<=clearance.train.radius,'Loaded train/articulation escapes clearance radius');assert(report.bounds.maximumAirRadius<=clearance.airRadius,'Actual source air geometry escapes radius');assert.equal(report.bounds.worldLife,read('assets/city/vertical-v02/world-life/air_routes.json').lanes.reduce((n,l)=>n+l.count,0));assert.deepEqual(report.errors,[]);report.status='PASS complete native train/air vertex and analytic articulation bounds within the continuous route hull radii';console.log(report.status,report.bounds.maximumTrainRadius,report.bounds.maximumAirRadius);
}catch(e){report.failure=String(e);console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(D,'V02_Loggia_Terraces_Vehicle_Bounds.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}})();
