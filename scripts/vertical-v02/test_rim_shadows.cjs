/* Deferred same-scene optical comparison and static-cache invalidation fixtures.
 * Invalidation fixtures deliberately mutate/restore setup; they are not legal-input destruction acceptance. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../..'),DEV=path.join(ROOT,'development/vertical-city-v02');
const OUT=path.join(DEV,'evidence/rim-shadow/native');fs.mkdirSync(OUT,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,f))).digest('hex');
const build=JSON.parse(fs.readFileSync(path.join(DEV,'V02_Rim_Shadow_Build.json')));
const report={status:'FAIL',entry:build.entry,entrySHA256:sha(build.entry),scriptSHA256:sha(build.script),
 contractSHA256:sha(build.contract),masterSHA256:sha(build.master),testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
 captures:[],errors:[],scope:'Same-scene source geometry/contact preservation, optical A/B and controlled cache lifecycle. Not final visual, legal-input destruction, broad gameplay or sustained-performance acceptance.'};
let page,browser,release;
async function fingerprint(){return page.evaluate(async()=>{
 const cache=new Map();
 const digest=async a=>{if(!cache.has(a))cache.set(a,crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).then(v=>[...new Uint8Array(v)].map(x=>x.toString(16).padStart(2,'0')).join('')));return cache.get(a);};
 const geometry=async g=>({attributes:await Promise.all(Object.entries(g.attributes).map(async([name,a])=>({name,count:a.count,itemSize:a.itemSize,normalized:a.normalized,sha256:await digest(a.array)}))),groups:g.groups,index:g.index?await digest(g.index.array):null});
 const buildings=[];for(const b of buildingColliders)buildings.push({id:b.mesh.userData.cityBuildingId,
  matrix:b.mesh.matrixWorld.toArray(),lodMatrix:b.lodMesh.matrixWorld.toArray(),full:await geometry(b.mesh.geometry),lod:await geometry(b.lodMesh.geometry),
  material:b.mesh.material.uuid,lodMaterial:b.lodMesh.material.uuid,parts:(b.parts||[]).map(p=>({min:p.box.min.toArray(),max:p.box.max.toArray()})),destroyed:b.destroyed});
 const district=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture'),outside=[],rooms=[];
 const targetChunks=new Set(['east-public-room-24','east-public-room-52','east-public-room-84']);
 district.traverse(o=>{if(!o.isMesh)return;const row={name:o.name,chunk:o.userData.v02Chunk,geometry:o.geometry.uuid,matrix:o.matrixWorld.toArray(),materials:(Array.isArray(o.material)?o.material:[o.material]).map(m=>m.uuid)};(targetChunks.has(row.chunk)?rooms:outside).push(row);});
 const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({id:o.uuid,type:o.type,color:o.color.toArray(),intensity:o.intensity});});
 return{buildings,outside,roomGeometry:rooms.map(({materials,...row})=>row),lights,
  contacts:verticalDistrict.colliders().map(c=>({id:c.id,min:c.box.min.toArray(),max:c.box.max.toArray(),walkable:c.v02Walkable})),
  roads:{ready:roadNetworkState().ready,laneCount:roadNetworkState().vehicleLanes??roadNetworkState().lanes}};
});}

async function capture(phase,view){
 const data=await page.evaluate(view=>{
  camera.position.fromArray(view.position);camera.lookAt(...view.look);camera.fov=view.fov;camera.aspect=1664/936;
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderNight(0);
  return{cameraWorld:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),
   calls:runtimePolish.sceneCalls,triangles:runtimePolish.sceneTriangles,png:renderer.domElement.toDataURL('image/png'),shadow:window.v02RimShadowState?.()};
 },view);
 const file=path.join(OUT,phase+'-'+view.id+'.png');fs.writeFileSync(file,Buffer.from(data.png.split(',')[1],'base64'));delete data.png;
 report.captures.push({phase,id:view.id,file:path.relative(ROOT,file),sha256:sha(path.relative(ROOT,file)),...data});
}
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 page=await browser.newPage({viewport:{width:1664,height:936}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 const permit=new Promise(resolve=>release=resolve);
 await page.route('**/rim-shadow/contract.json',async route=>{await permit;await route.continue();});
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02FacadeCassettesState().ready&&!characterState().busy,null,{timeout:120000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;gameActive=false;adaptiveQuality.enabled=false;renderer.setPixelRatio(1);renderer.setSize(1664,936,false);});await page.waitForTimeout(100);
 const reference=JSON.parse(fs.readFileSync(path.join(DEV,'V02_Reference_Views.json')));report.referenceViewsSHA256=sha('development/vertical-city-v02/V02_Reference_Views.json');
 const views=[...reference.views.map(v=>({...v,id:'reference-'+v.id,fov:reference.verticalFOVDegrees})),{id:'A',position:[68,120,225],look:[82,87,350],fov:50},{id:'B',position:[80,2,295],look:[80,70,450],fov:50},
  ...[24,52,84].map(floor=>({id:'room-'+floor,position:[97,floor+1.65,309.2],look:[103.2,floor+1.5,310],fov:65}))];
 for(const view of views)await capture('before',view);
 const before=await fingerprint();
 report.sceneBefore=await page.evaluate(()=>({children:scene.children.length,geometry:renderer.info.memory.geometries,
  direction:rim.target.position.clone().sub(rim.position).normalize().toArray(),renderTarget:renderer.getRenderTarget()?.uuid||null}));
 release();await page.waitForFunction(()=>v02RimShadowState().ready||v02RimShadowState().error,null,{timeout:120000});
 report.state=await page.evaluate(()=>v02RimShadowState());assert.equal(report.state.error,null);assert(report.state.ready);assert.equal(report.state.updates,1);
 for(const view of views)await capture('after',view);
 assert.deepEqual(await fingerprint(),before);
 for(const view of views){const a=report.captures.find(c=>c.phase==='before'&&c.id===view.id),b=report.captures.find(c=>c.phase==='after'&&c.id===view.id);
  assert.deepEqual(a.cameraWorld,b.cameraWorld);assert.deepEqual(a.projection,b.projection);assert.equal(a.calls,b.calls);assert.equal(a.triangles,b.triangles);assert.equal(b.shadow.updates,1);}
 report.preservation={originalBuildings:before.buildings.length,contacts:before.contacts.length,lights:before.lights.length,
  originalBuildingAttributesTransformsMaterialsPartsUnchanged:true,allDistrictGeometryMaterialsUnchanged:true,mainRenderCallsTrianglesUnchanged:true};
 report.invalidation=await page.evaluate(()=>{
  const owner=buildingColliders[141],original=owner.mesh.geometry,count=owner.damageCount,dead=owner.destroyed;
  const updates=()=>v02RimShadowState().updates,initial=updates();
  const clone=original.clone();owner.mesh.geometry=clone;renderNight(0);const replaced=updates();
  owner.damageCount=(count||0)+1;renderNight(0);const damaged=updates();
  owner.destroyed=true;renderNight(0);const removed=updates(),reduced=v02RimShadowState().activeCasters;
  owner.destroyed=dead;owner.damageCount=count;owner.mesh.geometry=original;renderNight(0);const restored=updates(),active=v02RimShadowState().activeCasters;
  clone.dispose();
  const rt=new THREE.WebGLRenderTarget(7,7),old=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
  owner.damageCount=(count||0)+1;renderer.setRenderTarget(rt);v02RimShadows.present();const targetRestored=renderer.getRenderTarget()===rt;
  renderer.setRenderTarget(old,face,mip);owner.damageCount=count;renderNight(0);rt.dispose();
  const beforeStable=updates();for(let i=0;i<60;i++)renderNight(0);const afterStable=updates();
  return{initial,replaced,damaged,removed,restored,reduced,active,targetRestored,beforeStable,afterStable,state:v02RimShadowState()};
 });
 const i=report.invalidation;assert.equal(i.replaced,i.initial+1);assert.equal(i.damaged,i.replaced+1);assert.equal(i.removed,i.damaged+1);assert.equal(i.restored,i.removed+1);
 assert(i.reduced<i.active);assert(i.targetRestored);assert.equal(i.beforeStable,i.afterStable);assert.equal(i.state.error,null);
 assert.deepEqual(await fingerprint(),before);assert.deepEqual(report.errors,[]);
 report.sceneAfter=await page.evaluate(()=>({children:scene.children.length,direction:rim.target.position.clone().sub(rim.position).normalize().toArray()}));
 assert.equal(report.sceneAfter.children,report.sceneBefore.children);
 assert(Math.hypot(...report.sceneAfter.direction.map((v,i)=>v-report.sceneBefore.direction[i]))<3e-7);
 report.status='PASS bounded source/native optical and static shadow-cache checks; manual visual review and sustained benchmark pending';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;}
finally{release?.();fs.writeFileSync(path.join(DEV,'V02_Rim_Shadow_Native.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status,report.failure||'');}})();
