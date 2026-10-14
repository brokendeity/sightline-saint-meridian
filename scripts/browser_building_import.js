// Eight Blender-authored families; floor pivots, shared geometry and one draw per building.
const importedCity={status:'loading',families:[],buildings:0,near:0,far:0,error:null};
function importedBuildingMaterial(){
 const holder=new THREE.Mesh(new THREE.BufferGeometry(),new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,emissive:0xffffff,emissiveIntensity:1}));applyToonVisuals(holder);
 const mat=holder.material,previous=mat.onBeforeCompile;
 mat.onBeforeCompile=shader=>{previous(shader);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 cityEmission; varying vec3 vCityEmission;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCityEmission=cityEmission;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCityEmission;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vCityEmission;');};
 mat.customProgramCacheKey=()=> 'SaintMeridianBuildingVertexEmission1';holder.geometry.dispose();return mat;
}
function prepareBuildingTemplate(root){
 root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),full={position:[],normal:[],color:[],cityEmission:[]},low={position:[],normal:[],color:[],cityEmission:[]};
 if(size.toArray().some(v=>!Number.isFinite(v)||v<=0))throw Error('Invalid building bounds');
 root.traverse(o=>{if(!o.isMesh)return;const source=o.geometry,p=source.attributes.position,n=source.attributes.normal,normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld),v=new THREE.Vector3(),normal=new THREE.Vector3();
  const detailed=/panel.?seams|mullion|louvers|silver.?floor.?seams|door.?handles|facade.?grooves/i.test(o.name),groups=source.groups.length?source.groups:[{start:0,count:source.index?source.index.count:p.count,materialIndex:0}];
  for(const group of groups){const material=Array.isArray(o.material)?o.material[group.materialIndex]:o.material,tint=(/Midnight alloy/i.test(material.name)?new THREE.Color(.018,.038,.053):material.color.clone()).multiplyScalar(1.18),emission=material.emissive.clone().multiplyScalar(material.emissiveIntensity||1);if(/cyan|pale lamps/i.test(material.name))emission.multiplyScalar(1.4);
   for(let k=group.start;k<Math.min(source.index?source.index.count:p.count,group.start+group.count);k++){const vertex=source.index?source.index.getX(k):k;v.fromBufferAttribute(p,vertex).applyMatrix4(o.matrixWorld);normal.fromBufferAttribute(n,vertex).applyMatrix3(normalMatrix).normalize();const pos=[(v.x-center.x)/size.x,(v.y-bounds.min.y)/size.y,(v.z-center.z)/size.z];for(const dst of detailed?[full]:[full,low]){dst.position.push(...pos);dst.normal.push(normal.x,normal.y,normal.z);dst.color.push(tint.r,tint.g,tint.b);dst.cityEmission.push(emission.r,emission.g,emission.b)}}
  }
 });
 function make(data){const g=new THREE.BufferGeometry();for(const key of Object.keys(data))g.setAttribute(key,new THREE.Float32BufferAttribute(data[key],3));g.computeBoundingBox();g.computeBoundingSphere();return g}
 const template={geometry:make(full),lod:make(low),bounds,size,center};const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m))});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());return template;
}
function buildingFamily(id,h){return h>190?(id%2?6:7):h>110?(id%2?1:7):h>65?(id%3?0:3):[2,4,5,3][id%4]}
function removeLegacyBuildingDetails(){
 architecture.visible=false;world.children.filter(o=>o.isInstancedMesh).forEach(o=>o.visible=false);districtArt.children.filter(o=>o.isInstancedMesh).forEach(o=>o.visible=false);
 // Retire flat-shell roof props, storefront cards and fans; the imported models supply these details.
 for(let i=propColliders.length-1;i>=0;i--){const p=propColliders[i];if(!buildingColliders.some(c=>p.box.min.y>=c.box.max.y-1&&p.box.min.x>=c.box.min.x&&p.box.max.x<=c.box.max.x&&p.box.min.z>=c.box.min.z&&p.box.max.z<=c.box.max.z))continue;p.mesh.visible=false;for(const registry of [rayTargets,walkables,cameraObstacles]){const at=registry.indexOf(p.mesh);if(at>=0)registry.splice(at,1)}propColliders.splice(i,1)}
 for(const f of streetAtmosphere.fans)f.parent.remove(f);streetAtmosphere.fans=[];
 const atmosphere=streetAtmosphere.rain.parent;atmosphere.children.filter(o=>o.isInstancedMesh&&o.material.map).forEach(o=>o.visible=false);streetAtmosphere.stats.storeInteriors=0;
}
function updateImportedBuildingLOD(){
 if(importedCity.status!=='ready')return;let near=0,far=0;const distance=performanceBudget.quality==='mobile'?310:460;
 for(const c of buildingColliders){if(!c.importedKind)continue;const close=!!c.damageCount||c.box.distanceToPoint(camera.position)<distance;c.mesh.visible=!c.destroyed&&close;c.lodMesh.visible=!c.destroyed&&!close;c.mesh.castShadow=close&&c.box.distanceToPoint(camera.position)<320;if(c.mesh.visible)near++;else if(c.lodMesh.visible)far++}
 importedCity.near=near;importedCity.far=far;
}
async function importBlenderCity(){
 try{
  const response=await fetch('buildings/saint_meridian/collisions.json');if(!response.ok)throw Error('Collision asset HTTP '+response.status);const metadata=await response.json(),loader=new THREE.GLTFLoader();
  const templates=await Promise.all(metadata.map(data=>new Promise((resolve,reject)=>loader.load('buildings/saint_meridian/'+data.file,g=>{try{resolve(prepareBuildingTemplate(g.scene))}catch(e){reject(e)}},undefined,reject))));
  // Commit only after every asset loads, so failed downloads retain the complete original city.
  const material=importedBuildingMaterial();removeLegacyBuildingDetails();
  importedCity.families=templates.map((t,i)=>({file:metadata[i].file,count:0,triangles:t.geometry.attributes.position.count/3,lodTriangles:t.lod.attributes.position.count/3}));
  buildingColliders.forEach((c,id)=>{const size=c.box.getSize(new THREE.Vector3()),family=buildingFamily(id,size.y),t=templates[family],mesh=c.mesh;mesh.geometry.dispose();mesh.geometry=t.geometry;mesh.material=material;mesh.position.y=c.box.min.y;mesh.scale.set(size.x,size.y,size.z);mesh.userData.sharedAsset=true;mesh.userData.cityBuildingId=id;c.importedKind='blender_'+(family+1);c.family=family;c.sharedGeometry=true;c.originalBounds=c.box.clone();
   c.parts=metadata[family].boxes.map(b=>{const lo=new THREE.Vector3(...b.min),hi=new THREE.Vector3(...b.max);for(const v of [lo,hi]){v.x=(v.x-t.center.x)/t.size.x*size.x+mesh.position.x;v.y=(v.y-t.bounds.min.y)/t.size.y*size.y+mesh.position.y;v.z=(v.z-t.center.z)/t.size.z*size.z+mesh.position.z}return{box:new THREE.Box3(lo,hi),mesh,owner:c,role:b.role}});c.initialPartCount=c.parts.length;
   const lod=new THREE.Mesh(t.lod,material);lod.position.copy(mesh.position);lod.scale.copy(mesh.scale);lod.receiveShadow=true;lod.userData.sharedAsset=true;lod.userData.cityLOD=true;world.add(lod);c.lodMesh=lod;mesh.updateMatrixWorld(true);importedCity.families[family].count++;
  });
  // Mount remaining district signs and steam to the new facades, using the real mesh surface.
  for(const o of [...districtArt.children.filter(o=>o.isMesh&&!o.isInstancedMesh),...streetAtmosphere.steam]){const c=buildingColliders.find(c=>o.position.x>=c.box.min.x-1&&o.position.x<=c.box.max.x+1&&o.position.z>=c.box.min.z-1&&o.position.z<=c.box.max.z+1);if(!c)continue;const front=o.position.z>c.mesh.position.z,dir=new THREE.Vector3(0,0,front?-1:1),from=new THREE.Vector3(o.position.x,o.position.y,front?c.box.max.z+2:c.box.min.z-2),hit=new THREE.Raycaster(from,dir,0,c.box.max.z-c.box.min.z+5).intersectObject(c.mesh,false)[0];if(hit)o.position.z=hit.point.z+(front?.08:-.08);else{o.visible=false;o.userData.unmounted=true;}}
  importedCity.status='ready';importedCity.buildings=buildingColliders.length;
  for(const c of courier.civilians)if(!c.rescued)c.group.position.copy(roofSpawnPoint(c.roof));for(const g of courier.guards)g.group.position.copy(roofSpawnPoint(g.roof).add(new THREE.Vector3(2,0,0)));syncRescueAnchors();recoverPenetration();updateImportedBuildingLOD();return importedCity;
 }catch(error){importedCity.status='fallback';importedCity.error=String(error.message||error);console.error('Blender city import failed',error);$('assetNote').textContent='Building download failed; original city remains playable.';return importedCity}
}
window.importedCityState=()=>({...importedCity,families:importedCity.families.map(f=>({...f}))});
