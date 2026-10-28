/* Read-only native surface study. Inspection cameras are labelled fixtures,
 * not route evidence. The original A/B comparisons are kept alongside a public
 * elevated-gallery study; reframing cannot establish architectural acceptance. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),E=path.join(D,'evidence/upper-anchor-reference-surfaces');fs.mkdirSync(E,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex'),b=read('development/vertical-city-v02/V02_Upper_Anchor_Build.json'),contract=read('assets/city/vertical-v02/reference_views.json');
const materialContract=read(b.materialContract);
const report={status:'FAIL',entry:b.entry,entrySHA256:sha(b.entry),manifestSHA256:sha(b.manifest),scriptSHA256:sha('scripts/vertical-v02/audit_current_reference_surfaces.cjs'),scope:'Visible source owners/materials from fixed original A/B inspection cameras and one labelled public-gallery angle. No asset, lighting, gameplay or acceptance change.',views:[],errors:[]};
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});let p;try{
 p=await browser.newPage({viewport:{width:1664,height:936}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});await p.goto('http://127.0.0.1:8766/'+b.entry+'?capture=backspool');await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&verticalWorldLifeState().ready&&verticalDiffuseLightingState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);await p.evaluate(()=>startGame(false));
 const views=[...contract.views,{id:'B-public-gallery-study',position:[52,26,300],look:[82,80,450]}];
 for(const view of views){
  const result=await p.evaluate(({view,fov,ownerPalettes})=>{
   camera.position.fromArray(view.position);camera.lookAt(...view.look);camera.fov=fov;camera.aspect=1664/936;camera.zoom=1;camera.updateProjectionMatrix();scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);renderNight(0);
   const owners=new Map();buildingColliders.forEach((b,index)=>{for(const o of[b.mesh,b.lodMesh])if(o)owners.set(o.uuid,{sourceIndex:index,id:b.id,cityBuildingId:b.mesh.userData.cityBuildingId,family:b.family,box:{min:b.box.min.toArray(),max:b.box.max.toArray()}});});
   const frustum=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)),meshes=[];
   scene.traverseVisible(o=>{if(o.isMesh&&(o.frustumCulled===false||frustum.intersectsObject(o)))meshes.push(o)});
   const ray=new THREE.Raycaster(),samples=[],groups=new Map();ray.far=1000;
   for(let y=0;y<18;y++)for(let x=0;x<32;x++){
    const ndc={x:(x+.5)/32*2-1,y:1-(y+.5)/18*2};ray.setFromCamera(ndc,camera);
    const hit=ray.intersectObjects(meshes,false).find(h=>{const o=h.object,m=Array.isArray(o.material)?o.material[h.face?.materialIndex||0]:o.material;return m?.visible!==false&&m?.opacity>.25&&!o.userData?.hero;});
    if(!hit){samples.push({x,y,kind:'sky'});continue;}
    const o=hit.object,m=Array.isArray(o.material)?o.material[hit.face?.materialIndex||0]:o.material,ancestry=[];let owner=null;
    for(let q=o;q&&q!==scene;q=q.parent){if(q.name)ancestry.push(q.name);if(owners.has(q.uuid))owner=owners.get(q.uuid);}
    const colour=o.geometry.attributes.color,emission=o.geometry.attributes.cityEmission,faceIndex=hit.face?.a||0,sourceColour=colour?[colour.getX(faceIndex),colour.getY(faceIndex),colour.getZ(faceIndex)]:null,sourceEmission=emission?[emission.getX(faceIndex),emission.getY(faceIndex),emission.getZ(faceIndex)]:null,palette=ownerPalettes.find(x=>x.sourceIndex===owner?.sourceIndex)?.palette,sourceKind=sourceColour&&sourceEmission?palette?.find(p=>p.color.every((v,i)=>Math.abs(v-sourceColour[i])<1e-5)&&p.emission.every((v,i)=>Math.abs(v-sourceEmission[i])<1e-5))?.kind:null;
    const key=JSON.stringify({owner:owner?.sourceIndex??null,path:ancestry.slice(0,3),material:m.name,type:m.type,sourceKind:sourceKind||'unclassified'});
    if(!groups.has(key))groups.set(key,{key,count:0,owner,ancestry,sourceKind:sourceKind||'unclassified',sourceColour,sourceEmission,receiveShadow:o.receiveShadow,castShadow:o.castShadow,material:{name:m.name,type:m.type,color:m.color?.toArray(),emissive:m.emissive?.toArray(),emissiveIntensity:m.emissiveIntensity,roughness:m.roughness,metalness:m.metalness,map:!!m.map,normalMap:!!m.normalMap,lightMap:!!m.lightMap},examplePoint:hit.point.toArray(),objectData:Object.fromEntries(Object.entries(o.userData||{}).filter(([k,v])=>['string','number','boolean'].includes(typeof v)))});
    const surfaceWorld=o.matrixWorld.clone();if(hit.instanceId!==undefined){const instance=new THREE.Matrix4();o.getMatrixAt(hit.instanceId,instance);surfaceWorld.multiply(instance);}groups.get(key).count++;samples.push({x,y,key,distance:hit.distance,point:hit.point.toArray(),normal:hit.face?.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(surfaceWorld)).normalize().toArray()});
   }
   return{view,fov,clock:verticalWorldLifeState().clock,cameraWorld:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),frustumMeshes:meshes.length,groups:[...groups.values()].sort((a,b)=>b.count-a.count),samples,png:renderer.domElement.toDataURL('image/png')};
  },{view,fov:contract.verticalFOVDegrees||54,ownerPalettes:materialContract.owners});
  const file='development/vertical-city-v02/evidence/upper-anchor-reference-surfaces/'+view.id+'.png';fs.writeFileSync(path.join(R,file),Buffer.from(result.png.split(',')[1],'base64'));delete result.png;result.file=file;result.sha256=sha(file);
  if(view.id==='B'){
   result.diagnosticLighting=await p.evaluate(samples=>{
    const materials=[...new Set([141,160,162].map(i=>buildingColliders[i].mesh.material))],lights=[];scene.traverse(o=>{if(o.isLight)lights.push(o)});
    const env=materials.map(m=>m.envMapIntensity),intensities=lights.map(o=>o.intensity),variants=[];const canvas=document.createElement('canvas');canvas.width=1664;canvas.height=936;const ctx=canvas.getContext('2d',{willReadFrequently:true});function facadePixels(){ctx.drawImage(renderer.domElement,0,0);const data=ctx.getImageData(0,0,1664,936).data,out={};for(const q of samples){const x=Math.floor((q.x+.5)/32*1664),y=Math.floor((q.y+.5)/18*936),i=(y*1664+x)*4,rgb=[data[i],data[i+1],data[i+2]],l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];(out[q.owner]||=[]).push({x,y,rgb,luminance:l,kind:q.kind});}return out;}const baselineFacadePixels=facadePixels();
    try{
     materials.forEach(m=>m.envMapIntensity=0);renderNight(0);variants.push({id:'B-diagnostic-no-tower-environment',scope:'Temporary source-owner reflection isolation only; not shipping appearance',png:renderer.domElement.toDataURL('image/png'),facadePixels:facadePixels()});materials.forEach((m,i)=>m.envMapIntensity=env[i]);
     lights.forEach(o=>o.intensity=0);renderNight(0);variants.push({id:'B-diagnostic-no-direct-lights',scope:'Temporary existing-light isolation only; not shipping appearance',png:renderer.domElement.toDataURL('image/png'),facadePixels:facadePixels()});lights.forEach((o,i)=>o.intensity=intensities[i]);
     for(let i=0;i<4;i++){lights[i].intensity=0;renderNight(0);variants.push({id:'B-diagnostic-no-light-'+i,lightType:lights[i].type,scope:'Temporary one-light isolation; all other lighting remains at the baseline',png:renderer.domElement.toDataURL('image/png'),facadePixels:facadePixels()});lights[i].intensity=intensities[i];}
    }finally{materials.forEach((m,i)=>m.envMapIntensity=env[i]);lights.forEach((o,i)=>o.intensity=intensities[i]);renderNight(0);}
    return{lights:lights.map(o=>({name:o.name,type:o.type,intensity:o.intensity,color:o.color.toArray(),localPosition:o.position.toArray(),worldPosition:o.getWorldPosition(new THREE.Vector3()).toArray(),castShadow:o.castShadow})),environmentIntensities:env,baselineFacadePixels,variants};
   },result.samples.filter(q=>q.key&&result.groups.some(g=>g.key===q.key&&g.owner)).map(q=>({x:q.x,y:q.y,owner:result.groups.find(g=>g.key===q.key).owner.sourceIndex,kind:result.groups.find(g=>g.key===q.key).sourceKind})));
   for(const v of result.diagnosticLighting.variants){v.file='development/vertical-city-v02/evidence/upper-anchor-reference-surfaces/'+v.id+'.png';fs.writeFileSync(path.join(R,v.file),Buffer.from(v.png.split(',')[1],'base64'));delete v.png;v.sha256=sha(v.file);}
  }
  report.views.push(result);console.log(view.id,result.groups.slice(0,8).map(g=>({rays:g.count,owner:g.owner?.sourceIndex,path:g.ancestry.slice(0,3),material:g.material.type})));
 }
 assert.deepEqual(report.errors,[]);report.status='PASS read-only native source-owner/material study; approved-reference architecture gate remains FAIL/incomplete';
}catch(e){report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(D,'V02_Upper_Anchor_Reference_Surfaces.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}})();
