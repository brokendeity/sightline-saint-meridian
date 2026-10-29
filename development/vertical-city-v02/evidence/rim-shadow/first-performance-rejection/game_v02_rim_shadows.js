/* Existing source SUN, bounded static architectural shadow map. Separate shadow
 * scene shares actual geometry; no duplicate geometry enters gameplay/contacts.
 * A separate offscreen renderer.render establishes the public render-state
 * lifecycle. Calling shadowMap.render outside it is invalid in pinned r128.
 */
window.v02RimShadows=(()=>{
 const expected=new URL(document.currentScript.src).searchParams.get('contract');
 const state={ready:false,error:null,loading:false,updates:0,casters:0,shadowDrawCalls:0,lastUpdateMs:0};
 const stage=new THREE.Scene(),rows=[],depths=new Set(),emptyCamera=new THREE.PerspectiveCamera(30,1,.5,1),scratch=new THREE.WebGLRenderTarget(1,1);let contract,dirty=true;
 emptyCamera.position.set(10000,10000,10000);emptyCamera.lookAt(10000,10001,10000);emptyCamera.updateMatrixWorld(true);
 const hash=async raw=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw))).map(v=>v.toString(16).padStart(2,'0')).join('');
 function add(source,owner=null){
  if(!source.isMesh||source.isSkinnedMesh||source.isInstancedMesh)return;
  const sourceMaterials=Array.isArray(source.material)?source.material:[source.material];
  if(sourceMaterials.every(m=>m.transparent))return;
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});
  // Original imported buildings carry material semantics per vertex. Glazing
  // (.1 metalness) must not become a solid shadow plate in this static map.
  if(source.geometry.attributes.cityReflectance){
   depth.onBeforeCompile=shader=>{
    shader.vertexShader='attribute vec2 cityReflectance;varying float vRimOpaque;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRimOpaque=step(.105,cityReflectance.x);');
    shader.fragmentShader='varying float vRimOpaque;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vRimOpaque<.5)discard;');
   };depth.customProgramCacheKey=()=> 'v02-static-rim-glass-mask-1';
  }
  depths.add(depth);
  const materials=sourceMaterials.map(m=>new THREE.MeshBasicMaterial({visible:!m.transparent,side:THREE.DoubleSide}));
  const proxy=new THREE.Mesh(source.geometry,Array.isArray(source.material)?materials:materials[0]);
  proxy.customDepthMaterial=depth;proxy.name='Shadow only / '+source.name;proxy.castShadow=true;
  proxy.matrixAutoUpdate=false;proxy.frustumCulled=true;stage.add(proxy);
  rows.push({source,owner,proxy,materials,geometry:null,positionVersion:-1,indexVersion:-1,damage:-1,destroyed:null});
 }
 function sync(){
  for(const row of rows){
   const {source,owner,proxy}=row;source.updateWorldMatrix(true,false);
   const dead=!!owner?.destroyed;
   const damage=owner?.damageCount||0,pv=source.geometry.attributes.position?.version||0,iv=source.geometry.index?.version||0;
   if(row.geometry!==source.geometry||row.positionVersion!==pv||row.indexVersion!==iv||row.damage!==damage||row.destroyed!==dead||!proxy.matrix.equals(source.matrixWorld)){
    dirty=true;row.geometry=source.geometry;row.positionVersion=pv;row.indexVersion=iv;row.damage=damage;row.destroyed=dead;
    proxy.geometry=source.geometry;proxy.visible=!dead;proxy.matrix.copy(source.matrixWorld);proxy.matrixWorld.copy(source.matrixWorld);
   }
  }
 }
 function present(){
  if(!state.ready)return;
  try{
   sync();if(!dirty)return;
   const mark=performance.now();rim.updateMatrixWorld(true);rim.target.updateMatrixWorld(true);stage.updateMatrixWorld(true);
   rim.shadow.needsUpdate=true;const oldAuto=renderer.info.autoReset;renderer.info.autoReset=false;
   const calls=renderer.info.render.calls;
   const target=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel();
   try{renderer.setRenderTarget(scratch);renderer.render(stage,emptyCamera);}
   finally{renderer.setRenderTarget(target,face,mip);renderer.info.autoReset=oldAuto;}
   state.shadowDrawCalls=renderer.info.render.calls-calls;state.lastUpdateMs=performance.now()-mark;
   state.updates++;dirty=false;state.activeCasters=rows.filter(row=>row.proxy.visible).length;
  }catch(error){state.error=String(error);state.ready=false;console.error('V02 rim shadow update',error);}
 }
 async function build(){
  if(state.ready||state.loading||state.error||!window.v02EastPublicLightingState?.().ready||!window.v02FacadeCassettesState?.().ready)return;
  state.loading=true;
  try{
   if(THREE.REVISION!=='128')throw Error('Static shadow cache requires audited Three r128');
   const response=await fetch('assets/city/vertical-v02/rim-shadow/contract.json');if(!response.ok)throw Error('Rim source contract HTTP '+response.status);
   const bytes=new Uint8Array(await response.arrayBuffer());if(await hash(bytes)!==expected)throw Error('Rim source contract identity');
   contract=JSON.parse(new TextDecoder().decode(bytes));const light=contract.sourceLight,settings=contract.runtimeShadow;
   const originalDirection=rim.target.position.clone().sub(rim.position).normalize();
   if(originalDirection.distanceTo(new THREE.Vector3(...light.toward))>3e-7||Math.abs(rim.intensity-light.intensity)>1e-6||rim.color.toArray().some((v,i)=>Math.abs(v-light.color[i])>1e-7))throw Error('Source/native warm-light mismatch');
   for(const owner of buildingColliders)if(owner.mesh){
    add(owner.mesh,owner);
    owner.mesh.traverse(root=>{
     if(root===owner.mesh||!(root.name.startsWith('V02 original-owner fittings / ')||root.name.startsWith('V02 source cassette surrounds / ')))return;
     root.traverse(object=>add(object,owner));
    });
   }
   const architecture=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture');
   if(!architecture)throw Error('Missing source district');architecture.traverse(object=>add(object));
   if(rows.length<310)throw Error('Incomplete static architectural caster collection');
   const center=new THREE.Vector3(...settings.center),toward=new THREE.Vector3(...light.toward);
   rim.target.position.copy(center);rim.position.copy(center).addScaledVector(toward,-settings.lightDistance);
   rim.castShadow=true;rim.shadow.autoUpdate=false;rim.shadow.mapSize.set(settings.mapSize,settings.mapSize);
   Object.assign(rim.shadow.camera,{left:-settings.halfWidth,right:settings.halfWidth,bottom:-settings.halfHeight,top:settings.halfHeight,near:settings.near,far:settings.far});
   rim.shadow.camera.updateProjectionMatrix();rim.shadow.bias=settings.bias;rim.shadow.normalBias=settings.normalBias;rim.shadow.radius=settings.radius;
   const shadowLight=rim.clone();shadowLight.name='Offscreen existing-rim shadow pass';shadowLight.shadow=rim.shadow;
   shadowLight.target=rim.target.clone();stage.add(shadowLight,shadowLight.target);
   state.ready=true;state.loading=false;state.casters=rows.length;state.sourceMasterSHA256=contract.masterSHA256;state.contractSHA256=expected;
   state.scope=contract.policy;
   const oldPresent=verticalAppearance.present;verticalAppearance.present=function(...args){const result=oldPresent.apply(this,args);present();return result;};
   present();
  }catch(error){state.loading=false;state.error=String(error);console.error('V02 rim shadow admission',error);}
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);
 window.v02RimShadowState=()=>JSON.parse(JSON.stringify(state));
 return{build,present,state:window.v02RimShadowState};
})();
