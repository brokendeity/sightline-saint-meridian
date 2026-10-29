/* Native raw triangle/profile inspection and original-city preservation.
 * Optical poses and ray queries are labelled fixtures; route acceptance is separate. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),E=path.join(D,'evidence/slender-crossings/native');fs.mkdirSync(E,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const build=read('development/vertical-city-v02/V02_Slender_Crossings_Build.json'),plan=read('development/vertical-city-v02/V02_Slender_Crossings_Plan.json'),reference=read('development/vertical-city-v02/V02_Reference_Views.json');
const report={status:'FAIL',entry:build.entry,entrySHA256:sha(build.entry),manifestSHA256:sha(build.manifest),masterSHA256:sha(build.master),testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),captures:[],runs:[],errors:[],opticalHeroLightFixture:'Both frozen scenes use the coded Backspool settled characterLight target .32; the first test compared unequal transient settling values and is archived.',scope:'Two full-game native scenes at identical frozen optical poses; dense actual shipping-GLB and physical-support queries. Initial optical fixtures do not establish real-input routes or full visual fidelity.'};let browser;
(async()=>{try{
 for(const[phase,entry]of[['before',build.source],['after',build.entry]]){
  browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});const page=await browser.newPage({viewport:{width:1664,height:936}});
  page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  await page.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&v02EastPublicLightingState().ready&&v02RimShadowState().ready&&!v02RimShadowState().error&&!characterState().busy,null,{timeout:120000});
  await page.evaluate(()=>{window.requestAnimationFrame=()=>0;gameActive=false;characterLight.intensity=.32;adaptiveQuality.enabled=false;renderer.setPixelRatio(1);renderer.setSize(1664,936,false);});await page.waitForTimeout(100);
  const fingerprint=await page.evaluate(async()=>{
   const cache=new Map(),digest=async a=>{if(!cache.has(a))cache.set(a,crypto.subtle.digest('SHA-256',new Uint8Array(a.buffer,a.byteOffset,a.byteLength)).then(v=>Array.from(new Uint8Array(v)).map(x=>x.toString(16).padStart(2,'0')).join('')));return cache.get(a);};
   const geometry=async g=>({attributes:await Promise.all(Object.keys(g.attributes).sort().map(async k=>({name:k,itemSize:g.attributes[k].itemSize,normalized:g.attributes[k].normalized,sha256:await digest(g.attributes[k].array)}))),index:g.index?await digest(g.index.array):null,groups:g.groups});
   const material=m=>({name:m.name,type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity,metalness:m.metalness,roughness:m.roughness,envMapIntensity:m.envMapIntensity,transparent:m.transparent,opacity:m.opacity,side:m.side});
   const buildings=[];for(const b of buildingColliders)buildings.push({id:b.mesh.userData.cityBuildingId,full:await geometry(b.mesh.geometry),lod:await geometry(b.lodMesh.geometry),matrix:b.mesh.matrixWorld.toArray(),lodMatrix:b.lodMesh.matrixWorld.toArray(),material:material(b.mesh.material),parts:b.parts.map(p=>({min:p.box.min.toArray(),max:p.box.max.toArray()}))});
   const lights=[];scene.traverse(o=>{if(o.isLight)lights.push({type:o.type,color:o.color.toArray(),intensity:o.intensity});});
   return{buildings,lights,roads:{ready:roadNetworkState().ready},plaza:{geometry:await geometry(plaza.geometry),matrix:plaza.matrixWorld.toArray(),material:material(plaza.material)}};
  });
  const marketSill=await page.evaluate(()=>{const q=new THREE.Raycaster(new THREE.Vector3(77.125,24.3,353.41),new THREE.Vector3(0,-1,0),0,.45);return{hit:q.intersectObject(scene.getObjectByName('Saint Meridian V02 detailed Blender architecture'),true)[0]?.point.toArray(),support:verticalDistrict.surfaceFeetAt(77.125,353.41,24.42)};});
  const run={phase,entry,marketSill,entrySHA256:sha(entry),fingerprintSHA256:crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex'),state:await page.evaluate(()=>({district:verticalDistrictState(),life:verticalWorldLifeState(),shadows:v02RimShadowState()}))};
  report.runs.push(run);if(phase==='before')report.originalFingerprint=fingerprint;else assert.deepEqual(fingerprint,report.originalFingerprint);
  const views=[...reference.views.map(v=>({...v,fov:reference.verticalFOVDegrees,id:'reference-'+v.id})),{id:'diagnostic-B',position:[80,2,295],look:[80,70,450],fov:50},
   {id:'bridge-top',position:[75.5,29,202.5],look:[75.5,23.8,216],fov:65}];
  for(const view of views){const data=await page.evaluate(view=>{camera.position.fromArray(view.position);camera.lookAt(...view.look);camera.fov=view.fov;camera.aspect=1664/936;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderNight(0);return{cameraWorld:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),png:renderer.domElement.toDataURL('image/png'),calls:runtimePolish.sceneCalls,triangles:runtimePolish.sceneTriangles};},view);
   const file=path.join(E,phase+'-'+view.id+'.png');fs.writeFileSync(file,Buffer.from(data.png.split(',')[1],'base64'));delete data.png;report.captures.push({phase,id:view.id,file:path.relative(R,file),sha256:sha(path.relative(R,file)),...data});
  }
  {
   const profile=await page.evaluate(({designs,phase})=>{
    const root=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture'),ray=new THREE.Raycaster(),keptSupport=[],bad=[];let inside=0,removed=0,supported=0;
    for(const d of designs)for(let i=0;i<140;i++){
     const x=d.x0+(i+.5)*.25,f=Math.min(1,(x-d.x0)/7,(d.x1-x)/7),lo=d.z-3.5+d.southInset*f,hi=d.z+3.5-d.northInset*f;
     for(const z of [lo+.09,d.z,hi-.09]){
      ray.set(new THREE.Vector3(x,d.topY+.3,z),new THREE.Vector3(0,-1,0));ray.near=0;ray.far=.45;const hit=ray.intersectObject(root,true).find(h=>Math.abs(h.point.y-d.topY)<1e-4);inside++;
      if(!hit)bad.push({id:d.id,x,z,kind:'rendered-floor',hit:hit?.point.toArray()});
      const support=verticalDistrict.surfaceFeetAt(x,z,d.topY+.42);supported++;keptSupport.push({id:d.id,x,z,support});if(!Number.isFinite(support)||support<d.topY+.42-1e-4||support>d.topY+.621)bad.push({id:d.id,x,z,kind:'physical-support',support});
     }
     for(const[sign,inset]of[[-1,d.southInset],[1,d.northInset]])if(phase==='after'&&inset*f>.2){
      const z=sign<0?(d.z-3.5+lo)/2:(d.z+3.5+hi)/2;
      ray.set(new THREE.Vector3(x,d.topY+.3,z),new THREE.Vector3(0,-1,0));ray.near=0;ray.far=.45;const hit=ray.intersectObject(root,true)[0];removed++;
      if(hit)bad.push({id:d.id,x,z,kind:'removed-rendered-floor',point:hit.point.toArray()});
      const support=verticalDistrict.surfaceFeetAt(x,z,d.topY+.42);if(Number.isFinite(support))bad.push({id:d.id,x,z,kind:'invisible-floor',support});
     }
    }
    return{inside,removed,supported,bad,keptSupport,supportPolicy:'Rendered support must match the physical sole height; unchanged thresholds up to the established0.2m step limit are accepted.'};
   },{designs:plan.designs,phase});
   run.profile=profile;
   if(phase==='after'){report.profile=profile;assert.deepEqual(profile.keptSupport,report.runs[0].profile.keptSupport);assert.deepEqual(report.profile.bad,[]);assert.equal(run.state.district.collisions,10644);assert.equal(run.state.life.visitors,11);assert.deepEqual(run.state.district.coordinateFailures,[]);}
  }
  await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[]);assert.equal(report.runs[0].fingerprintSHA256,report.runs[1].fingerprintSHA256);assert.deepEqual(report.runs[0].marketSill,report.runs[1].marketSill);
 for(const view of report.captures.filter(c=>c.phase==='before')){const next=report.captures.find(c=>c.phase==='after'&&c.id===view.id);assert.deepEqual(view.cameraWorld,next.cameraWorld);assert.deepEqual(view.projection,next.projection);}
 delete report.originalFingerprint;
 report.status='PASS original-city preservation and dense current GLB/profile/support inspection; real-input and full visual acceptance separate';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;}
finally{fs.writeFileSync(path.join(D,'V02_Slender_Crossings_Native.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status,report.failure||'');}})();
