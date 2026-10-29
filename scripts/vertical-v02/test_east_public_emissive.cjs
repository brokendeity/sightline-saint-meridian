/* Deferred same-scene lighting admission, source texel calibration and captures.
 * No room-route or final reference certification is inferred from this test. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../..'),DEV=path.join(ROOT,'development/vertical-city-v02');
const OUT=path.join(DEV,'evidence/east-public-emissive/native');fs.mkdirSync(OUT,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f)));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,f))).digest('hex');
const build=read('development/vertical-city-v02/V02_East_Public_Emissive_Build.json');
const contract=read(build.eastLightingContract);
const gate=read('development/vertical-city-v02/V02_East_Public_Emissive_Master_Validation.json');
assert.equal(sha(build.entry),build.entrySHA256);assert.equal(sha(build.manifest),build.manifestSHA256);
const report={status:'FAIL',entry:build.entry,entrySHA256:build.entrySHA256,manifestSHA256:build.manifestSHA256,
 masterSHA256:build.masterSHA256,testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
 captures:[],gpu:[],errors:[],scope:'Controlled optical fixtures and deferred material admission in one native scene. No route, legal destruction, performance or full-reference acceptance.'};
let browser,page,release;
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
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const original=renderer.render,passes=[];
  renderer.render=function(root,eye){const result=original.call(this,root,eye);if(root===scene&&eye===camera)passes.push({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles});return result;};
  try{renderNight(0);}finally{renderer.render=original;}
  return{cameraWorld:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),fov:camera.fov,
    worldPasses:passes,png:renderer.domElement.toDataURL('image/png')};
 },view);
 const file=path.join(OUT,phase+'-'+view.id+'.png');fs.writeFileSync(file,Buffer.from(data.png.split(',')[1],'base64'));delete data.png;
 report.captures.push({phase,id:view.id,file:path.relative(ROOT,file),sha256:sha(path.relative(ROOT,file)),...data});
}
function bilinear(raw,width,height,uv){
 const half=index=>{const n=raw.readUInt16LE(index*2),s=n>>15?-1:1,e=n>>10&31,f=n&1023;return s*(e?2**(e-15)*(1+f/1024):2**(-14)*f/1024);};
 const x=uv[0]*width-.5,y=uv[1]*height-.5,ix=Math.floor(x),iy=Math.floor(y),tx=x-ix,ty=y-iy;
 return[0,1,2,3].map(k=>{let value=0;for(let j=0;j<2;j++)for(let i=0;i<2;i++)value+=half((Math.min(height-1,Math.max(0,iy+j))*width+Math.min(width-1,Math.max(0,ix+i)))*4+k)*(i?tx:1-tx)*(j?ty:1-ty);return value;});
}
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 page=await browser.newPage({viewport:{width:1664,height:936}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 const permit=new Promise(resolve=>release=resolve);
 await page.route('**/east-public-emissive/runtime/lighting.json',async route=>{await permit;await route.continue();});
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&verticalWorldLifeState().ready&&verticalDiffuseLightingState().ready&&v02FacadeCassettesState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;gameActive=false;});await page.waitForTimeout(100);
 const views=[{id:'A',position:[68,120,225],look:[82,87,350],fov:50},
  {id:'B',position:[80,2,295],look:[80,70,450],fov:50},
  ...[24,52,84].map(floor=>({id:'room-'+floor,position:[97,floor+1.65,309.2],look:[103.2,floor+1.5,310],fov:65}))];
 for(const view of views)await capture('before',view);
 const before=await fingerprint();release();
 await page.waitForFunction(()=>v02EastPublicLightingState().ready||v02EastPublicLightingState().error,null,{timeout:120000});
 report.state=await page.evaluate(()=>v02EastPublicLightingState());assert.equal(report.state.error,null);assert(report.state.ready);
 assert.equal(report.state.sourceMasterSHA256,build.masterSHA256);assert.equal(report.state.rooms.length,3);
 // Restore the same last optical pose before comparing source state.
 await capture('after',views.at(-1));assert.deepEqual(await fingerprint(),before);
 report.preservation={originalBuildings:before.buildings.length,otherDistrictMeshes:before.outside.length,
  roomGeometry:before.roomGeometry.length,contacts:before.contacts.length,lights:before.lights.length,
  allOriginalAttributesTransformsMaterialsPartsUnchanged:true,otherDistrictMaterialsUnchanged:true,
  allRoomGeometryAndContactsUnchanged:true,newDynamicLights:0};
 assert.equal(before.buildings.length,310);
 report.admission=await page.evaluate(()=>{
  const rows=[],leaks=[],root=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture');
  root.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.v02EastPublicSource){
   rows.push({chunk:o.userData.v02Chunk,name:m.name,floor:m.userData.v02EastPublicFloor,
    uv2:o.geometry.attributes.uv2?.count,positions:o.geometry.attributes.position.count,
    diffuse:!!m.lightMap,environment:!!m.envMap,emission:m.emissive.toArray(),emissionIntensity:m.emissiveIntensity,
    flipY:m.lightMap?.flipY,linear:m.lightMap?.encoding===THREE.LinearEncoding});
   if(o.userData.v02Chunk!=='east-public-room-'+m.userData.v02EastPublicFloor)leaks.push(m.name);
  }});return{rows,leaks,coordinateFailures:verticalDistrictState().coordinateFailures};
 });
 assert.equal(report.admission.rows.length,21);assert.deepEqual(report.admission.leaks,[]);
 assert.deepEqual(report.admission.coordinateFailures,[]);
 assert(report.admission.rows.every(r=>r.uv2===r.positions&&r.environment));
 assert.equal(report.admission.rows.filter(r=>r.diffuse).length,15);
 assert(report.admission.rows.filter(r=>r.diffuse).every(r=>r.flipY===false&&r.linear));
 for(const lamp of report.admission.rows.filter(r=>r.name===contract.luminaire.material)){
  assert.deepEqual(lamp.emission,contract.luminaire.emissionColor);assert.equal(lamp.emissionIntensity,96);
 }
 for(const room of contract.rooms){
  const sourceInfo=gate.rooms.find(r=>r.floor===room.floor);
  const witness=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT,sourceInfo.witness))));
  const opaque=witness.filter(t=>['V02_deck','V02_steel','V02_arcade_soffit'].includes(t.material));
  const points=Array.from({length:24},(_,i)=>opaque[Math.floor(i*opaque.length/24)])
   .map(t=>[0,1].map(k=>t.corners.reduce((s,c)=>s+(k?1-c.sourceUV1[k]:c.sourceUV1[k])/3,0)));
  const samples=await page.evaluate(({chunk,points})=>{
   const root=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture').getObjectByName(chunk),found=[];
   root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.lightMap)found.push(m.lightMap);});
   if(!found.length)throw Error('No actual room light map');const atlas=found[0];
   const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false});
   const scene2=new THREE.Scene(),cam2=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
   const material=new THREE.ShaderMaterial({uniforms:{atlas:{value:atlas},coord:{value:new THREE.Vector2()}},
    vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:'uniform sampler2D atlas;uniform vec2 coord;void main(){gl_FragColor=texture2D(atlas,coord);}'});
   const geometry=new THREE.PlaneGeometry(2,2);scene2.add(new THREE.Mesh(geometry,material));
   const old=renderer.getRenderTarget(),out=[];
   try{for(const uv of points){material.uniforms.coord.value.fromArray(uv);renderer.setRenderTarget(rt);renderer.render(scene2,cam2);
    const pixel=new Float32Array(4);renderer.readRenderTargetPixels(rt,0,0,1,1,pixel);out.push({uv,pixel:Array.from(pixel)});}}
   finally{renderer.setRenderTarget(old);rt.dispose();material.dispose();geometry.dispose();}
   return out;
  },{chunk:room.chunk,points});
  const raw=zlib.gunzipSync(fs.readFileSync(path.join(ROOT,room.atlas.url)));
  for(const sample of samples){sample.cpu=bilinear(raw,room.atlas.width,room.atlas.height,sample.uv);sample.error=Math.max(...sample.cpu.map((v,i)=>Math.abs(v-sample.pixel[i])));}
  const maximumError=Math.max(...samples.map(s=>s.error));assert(maximumError<.003,'Actual GPU source atlas sampling differs');
  assert(samples.some(s=>s.pixel.some((v,i)=>i<3&&v>.001)),'All sampled room radiance is black');
  report.gpu.push({floor:room.floor,maximumError,samples});
 }
 // Preserve the earlier after-room84 capture and complete all remaining views.
 for(const view of views.slice(0,-1))await capture('after',view);
 for(const view of views){const a=report.captures.find(c=>c.phase==='before'&&c.id===view.id),b=report.captures.find(c=>c.phase==='after'&&c.id===view.id);assert.deepEqual(a.cameraWorld,b.cameraWorld);assert.deepEqual(a.projection,b.projection);}
 assert.deepEqual(report.errors,[]);
 report.status='PASS native source-light admission, material isolation, original-world preservation and72GPU texel samples; route/visual acceptance separate';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;if(page)await page.screenshot({path:path.join(OUT,'failure.png')}).catch(()=>{});}
finally{release?.();fs.writeFileSync(path.join(DEV,'V02_East_Public_Emissive_Native.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status);}})();
