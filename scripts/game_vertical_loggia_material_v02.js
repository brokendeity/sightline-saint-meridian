/* Blender-authored PBR reflectance. Geometry, gameplay and lighting unchanged. */
window.verticalMaterialResponse=(()=>{
 const state={ready:false,loading:false,error:null,owners:[],materials:0,reflectanceVertices:0,newDynamicLights:0};
 const path='assets/city/vertical-v02/loggia-terraces/materials.json';
 const key=(c,e)=>[...c,...e].map(v=>v.toFixed(5)).join('/');
 async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');}
 function attribute(g,palette){
  if(g.attributes.cityReflectance)return;
  const colors=g.attributes.color,emission=g.attributes.cityEmission;
  if(!colors||!emission||colors.count!==emission.count)throw Error('Original facade reflectance attributes missing');
  const lookup=new Map(palette.map(p=>[key(p.color,p.emission),p])),values=new Float32Array(colors.count*2);
  for(let i=0;i<colors.count;i++){
   const p=lookup.get(key([colors.getX(i),colors.getY(i),colors.getZ(i)],[emission.getX(i),emission.getY(i),emission.getZ(i)]));
   if(!p)throw Error('Original source palette absent from Blender material contract at vertex '+i);
   values[i*2]=p.metalness;values[i*2+1]=p.roughness;
  }
  g.setAttribute('cityReflectance',new THREE.Float32BufferAttribute(values,2));state.reflectanceVertices+=colors.count;
 }
 function originalMaterial(environment,intensity){
  const m=new THREE.MeshStandardMaterial({name:'V02 source-authored corridor tower PBR',color:0xffffff,vertexColors:true,
   emissive:0xffffff,emissiveIntensity:1,metalness:1,roughness:1,envMap:environment,envMapIntensity:intensity});
  m.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 cityEmission;attribute vec2 cityReflectance;varying vec3 vCityEmission;varying vec2 vCityReflectance;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvCityEmission=cityEmission;vCityReflectance=cityReflectance;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCityEmission;varying vec2 vCityReflectance;')
    .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vCityEmission;')
    .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vCityReflectance.y;')
    .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vCityReflectance.x;');
  };
  cityVisualPolish.material(m);
  m.customProgramCacheKey=()=> 'sm-v02-source-pbr-reflectance-1';return m;
 }
 async function build(){
  if(state.ready||state.loading||state.error||!window.verticalAppearanceState?.().ready)return;
  state.loading=true;let dataTexture,pmrem;
  try{
   const response=await fetch(path);if(!response.ok)throw Error('Material contract HTTP '+response.status);const c=await response.json();
   const r=await fetch(c.environment.url);if(!r.ok)throw Error('Local reflection probe HTTP '+r.status);
   const zipped=new Uint8Array(await r.arrayBuffer());if(await digest(zipped)!==c.environment.sha256)throw Error('Reflection probe hash mismatch');
   const raw=fflate.gunzipSync(zipped);if(await digest(raw)!==c.environment.rawSHA256)throw Error('Reflection radiance hash mismatch');
   if(raw.byteLength!==c.environment.width*c.environment.height*8)throw Error('Reflection probe byte count');
   const half=new Uint16Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
   dataTexture=new THREE.DataTexture(half,c.environment.width,c.environment.height,THREE.RGBAFormat,THREE.HalfFloatType);
   dataTexture.mapping=THREE.EquirectangularReflectionMapping;dataTexture.encoding=THREE.LinearEncoding;dataTexture.flipY=false;dataTexture.needsUpdate=true;
   pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
   const target=pmrem.fromEquirectangular(dataTexture);target.texture.name='V02 actual corridor scene-linear reflected radiance';
   // Complete all admission before any owner receives its new material.
   for(const o of c.owners){const b=buildingColliders[o.sourceIndex];if(!b||b.mesh.userData.cityBuildingId!==o.cityBuildingId)throw Error('PBR owner mismatch '+o.id);attribute(b.mesh.geometry,o.palette);attribute(b.lodMesh.geometry,o.palette);}
   const m=originalMaterial(target.texture,c.environment.intensity);
   const authored=new Map(c.materials.map(m=>[m.name,m])),seen=new Set(),admitted=[];
   const roots=[scene.getObjectByName('Saint Meridian V02 detailed Blender architecture'),...c.owners.map(o=>buildingColliders[o.sourceIndex].mesh)];
   for(const root of roots)root?.traverse(o=>{if(!o.isMesh)return;for(const mat of Array.isArray(o.material)?o.material:[o.material]){
    if(seen.has(mat)||!mat.isMeshStandardMaterial)continue;seen.add(mat);const source=authored.get(mat.name);if(!source)continue;
    if(!Number.isFinite(source.metalness)||!Number.isFinite(source.roughness))throw Error('Invalid saved material '+mat.name);
    admitted.push({mat,source});
   }});
   state.materialChanges=admitted.map(({mat,source})=>({name:mat.name,metalness:mat.metalness,roughness:mat.roughness,metalnessMap:!!mat.metalnessMap,roughnessMap:!!mat.roughnessMap,sourceMetalnessLinked:source.metalnessLinked,sourceRoughnessLinked:source.roughnessLinked,policy:'Preserve GLTF factors and texture maps, including linked Blender roughness'}));
   for(const o of c.owners){const b=buildingColliders[o.sourceIndex];b.mesh.material=m;b.lodMesh.material=m;state.owners.push({id:o.id,sourceIndex:o.sourceIndex,cityBuildingId:o.cityBuildingId});}
   for(const {mat}of admitted){mat.envMap=target.texture;mat.envMapIntensity=c.environment.intensity;mat.needsUpdate=true;state.materials++;}
   state.environment={width:c.environment.width,height:c.environment.height,bytes:c.environment.bytes,position:c.environment.position,static:true,sourceMasterSHA256:c.masterSHA256};
   state.ready=true;state.loading=false;
  }catch(e){state.error=String(e);state.loading=false;console.error('V02 material response',e);}
  finally{dataTexture?.dispose();pmrem?.dispose();}
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);
 window.verticalMaterialResponseState=()=>JSON.parse(JSON.stringify(state));return{build,state:window.verticalMaterialResponseState};
})();
