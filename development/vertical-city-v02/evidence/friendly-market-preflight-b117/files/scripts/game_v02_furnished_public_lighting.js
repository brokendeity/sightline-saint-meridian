/* Source lighting for three new public rooms. Commit materials atomically after
 * source hashes, UV2 and room reflection dependencies have been validated. */
window.v02EastPublicLighting=(()=>{
 const scriptURL=new URL(document.currentScript.src),expectedContract=scriptURL.searchParams.get('contract');
 const state={ready:false,loading:false,error:null,rooms:[],materials:[],newDynamicLights:0,textureBytes:0};
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
 async function sourceTexture(spec,equirect=false){
  const response=await fetch(spec.url);if(!response.ok)throw Error('Room lighting HTTP '+response.status);
  const compressed=new Uint8Array(await response.arrayBuffer());if(await hash(compressed)!==spec.sha256)throw Error('Room lighting archive identity');
  const raw=fflate.gunzipSync(compressed);if(raw.byteLength!==spec.width*spec.height*8||await hash(raw)!==spec.rawSHA256)throw Error('Room lighting texel identity');
  const data=new Uint16Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
  const texture=new THREE.DataTexture(data,spec.width,spec.height,THREE.RGBAFormat,THREE.HalfFloatType);
  texture.encoding=THREE.LinearEncoding;texture.flipY=false;texture.generateMipmaps=false;
  texture.minFilter=texture.magFilter=THREE.LinearFilter;
  if(equirect)texture.mapping=THREE.EquirectangularReflectionMapping;
  texture.needsUpdate=true;return texture;
 }
 async function build(){
  if(state.ready||state.loading||state.error||!window.verticalDiffuseLightingState?.().ready||!window.v02FacadeCassettesState?.().ready)return;
  state.loading=true;const materials=[],atlases=[],sourceHDRs=[],environments=[];let pmrem;
  try{
   if(!/^[a-f0-9]{64}$/.test(expectedContract||''))throw Error('Missing expected source-room contract identity');
   const response=await fetch('assets/city/vertical-v02/furnished-public-rooms/runtime/lighting.json');
   if(!response.ok)throw Error('Room contract HTTP '+response.status);
   const bytes=new Uint8Array(await response.arrayBuffer());if(await hash(bytes)!==expectedContract)throw Error('Room contract version mismatch');
   const contract=JSON.parse(new TextDecoder().decode(bytes));if(contract.rooms.length!==3)throw Error('Incomplete public-room lighting');
   const district=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture');if(!district)throw Error('Missing loaded district');
   const diffuseNames=new Set(contract.opaqueDiffuseNames),staged=[];
   pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
   for(const room of contract.rooms){
    if(room.reflection.sourceMasterSHA256!==contract.masterSHA256)throw Error('Mixed room source reflection');
    const root=district.getObjectByName(room.chunk);if(!root)throw Error('Missing public-room chunk '+room.chunk);
    const targets=[];root.traverse(object=>{
     if(!object.isMesh)return;
     const uv=object.geometry.attributes.uv2,position=object.geometry.attributes.position;
     if(!uv||uv.count!==position.count)throw Error('Missing source UV2 on '+object.name);
     const list=Array.isArray(object.material)?object.material:[object.material];
     for(const material of list)if(!material.isMeshStandardMaterial)throw Error('Non-PBR public-room material '+material.name);
     targets.push({object,list});
    });
    if(!targets.length)throw Error('Empty public-room geometry');
    const atlas=await sourceTexture(room.atlas);atlas.name='Source east room '+room.floor+' isolated new-fixture diffuse / UV2';atlases.push(atlas);
    const hdr=await sourceTexture(room.reflection,true);sourceHDRs.push(hdr);
    const environment=pmrem.fromEquirectangular(hdr);environment.texture.name='Source east room '+room.floor+' reflected radiance';environments.push(environment);
    const clones=new Map();
    for(const {list}of targets)for(const material of list){
     if(clones.has(material.uuid))continue;
     const clone=material.clone();clone.envMap=environment.texture;clone.envMapIntensity=1;
     if(material.name===contract.luminaire.material){clone.emissive.fromArray(contract.luminaire.emissionColor);clone.emissiveIntensity=contract.luminaire.emissionStrength;}
     if(diffuseNames.has(material.name)){
      if(clone.transparent)throw Error('Transparent source-diffuse binding '+material.name);
      clone.lightMap=atlas;clone.lightMapIntensity=1;
      // Standard PBR lightMap adds this isolated new-fixture contribution
      // exactly once. Retain all live direct/ambient lighting. No full-bake
      // diffuse replacement or hand-added duplicate light-map term is used.
      clone.onBeforeCompile=()=>{};
      clone.customProgramCacheKey=()=> 'sm-v02-east-room-local-emissive-1';
     }
     clone.userData.v02EastPublicSource=contract.masterSHA256;clone.userData.v02EastPublicFloor=room.floor;
     clone.needsUpdate=true;clones.set(material.uuid,clone);materials.push(clone);
    }
    for(const target of targets)staged.push({object:target.object,material:Array.isArray(target.object.material)?target.list.map(m=>clones.get(m.uuid)):clones.get(target.list[0].uuid)});
    state.rooms.push({floor:room.floor,chunk:room.chunk,meshes:targets.length,primitives:room.primitives,
     atlasSHA256:room.atlas.sha256,reflectionSHA256:room.reflection.sha256,probe:room.reflection.position});
    state.textureBytes+=room.atlas.rawBytes+room.reflection.rawBytes;
   }
   for(const target of staged)target.object.material=target.material;
   state.materials=materials.map(m=>({name:m.name,floor:m.userData.v02EastPublicFloor,diffuse:!!m.lightMap}));
   state.sourceMasterSHA256=contract.masterSHA256;state.contractSHA256=expectedContract;
   state.bakeScope=contract.bakeScope;state.scope='New-fixture emissive-only source light maps loaded; live global lighting retained; gameplay and final visual acceptance remain separate';
   state.ready=true;state.loading=false;
  }catch(error){
   for(const material of materials)material.dispose();for(const texture of atlases)texture.dispose();for(const environment of environments)environment.dispose();
   state.rooms=[];state.textureBytes=0;state.loading=false;state.error=String(error);console.error('V02 east public lighting',error);
  }finally{for(const texture of sourceHDRs)texture.dispose();pmrem?.dispose();}
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);
 window.v02EastPublicLightingState=()=>JSON.parse(JSON.stringify(state));return{build,state:window.v02EastPublicLightingState};
})();
