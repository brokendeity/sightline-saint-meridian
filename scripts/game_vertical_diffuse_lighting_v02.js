/* Real source diffuse and room-local reflected radiance. The three room nodes
 * reuse existing triangles; no city geometry, contacts or dynamic lights added.
 * Clone materials per room because the city importer shares them globally.
 */
window.verticalDiffuseLighting=(()=>{
 const state={ready:false,loading:false,error:null,chunk:'loggia-rooms',meshes:0,materials:[],rooms:[],newDynamicLights:0,textureBytes:0};
 const diffuseNames=new Set(['V02_deck','V02_steel','V02_arcade_soffit','V02_terrace_foliage','V02_loggia_luminaire']);
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
 async function textureFromSource(c,equirect=false){const r=await fetch(c.url);if(!r.ok)throw Error('Source lighting HTTP '+r.status);const zipped=new Uint8Array(await r.arrayBuffer());if(await hash(zipped)!==c.sha256)throw Error('Source lighting archive hash mismatch');const bytes=fflate.gunzipSync(zipped);if(await hash(bytes)!==c.rawSHA256||bytes.byteLength!==c.width*c.height*8)throw Error('Source lighting texels fail identity');const data=new Uint16Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),t=new THREE.DataTexture(data,c.width,c.height,THREE.RGBAFormat,THREE.HalfFloatType);t.encoding=THREE.LinearEncoding;t.flipY=false;t.generateMipmaps=false;t.minFilter=t.magFilter=THREE.LinearFilter;if(equirect)t.mapping=THREE.EquirectangularReflectionMapping;t.needsUpdate=true;return t;}
 async function build(){
  if(state.ready||state.loading||state.error||!window.verticalMaterialResponseState?.().ready)return;
  state.loading=true;let atlas,pmrem;const clones=[],environments=[],sourceTextures=[];
  try{
   const response=await fetch('assets/city/vertical-v02/diffuse-pilot/runtime/lighting.json');if(!response.ok)throw Error('Diffuse contract HTTP '+response.status);const c=await response.json();
   const root=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture')?.getObjectByName(c.chunk);if(!root)throw Error('Diffuse chunk not loaded');
   const targets=[];root.traverse(o=>{if(!o.isMesh)return;let owner=o;while(owner&&owner!==root&&!owner.userData.v02ReflectionFloor)owner=owner.parent;const floor=owner?.userData.v02ReflectionFloor;if(![40,68,100].includes(floor))throw Error('Missing authored reflection-room identity');if(Array.isArray(o.material))throw Error('Unexpected grouped lighting material');const m=o.material,uv=o.geometry.attributes.uv2;if(!m.isMeshStandardMaterial||!uv||uv.count!==o.geometry.attributes.position.count)throw Error('Missing source PBR/UV2 on '+o.name);targets.push({o,m,floor});});
   if(targets.length!==21||c.localReflectionProbes?.length!==3)throw Error('Incomplete three-room source lighting');
   atlas=await textureFromSource(c.atlas);atlas.name='Source loggia full diffuse light / UV2';pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();const roomEnvironments=new Map();
   for(const spec of c.localReflectionProbes){if(spec.sourceMasterSHA256!==c.masterSHA256)throw Error('Mixed source reflection version');const hdr=await textureFromSource(spec,true);sourceTextures.push(hdr);const env=pmrem.fromEquirectangular(hdr);env.texture.name='Source loggia '+spec.floor+' reflected radiance';environments.push(env);roomEnvironments.set(spec.floor,env.texture);}
   const materials=new Map();for(const {m,floor}of targets){const key=floor+'/'+m.uuid;if(materials.has(key))continue;const clone=m.clone();clone.envMap=roomEnvironments.get(floor);clone.envMapIntensity=1;
    if(m.name===c.luminaire.material){clone.emissive.fromArray(c.luminaire.emissionColor);clone.emissiveIntensity=c.luminaire.emissionStrength;}
    if(diffuseNames.has(m.name)){if(m.transparent)throw Error('Transparent diffuse bake unsupported');clone.lightMap=atlas;clone.lightMapIntensity=1;
     // Real source diffuse replaces the older approximate soffit fill here.
     clone.onBeforeCompile=shader=>{const marker='#include <lights_fragment_end>';if(!shader.fragmentShader.includes(marker))throw Error('Unsupported standard-material lighting pipeline');shader.fragmentShader=shader.fragmentShader.replace(marker,marker+`\nreflectedLight.directDiffuse=vec3(0.);\nreflectedLight.indirectDiffuse=lightMapTexelToLinear(texture2D(lightMap,vUv2)).rgb*lightMapIntensity*material.diffuseColor;`);};clone.customProgramCacheKey=()=> 'sm-v02-source-diffuse-uv2-2';
    }
    clone.userData.v02DiffuseSource=c.masterSHA256;clone.userData.v02ReflectionFloor=floor;clone.needsUpdate=true;materials.set(key,clone);clones.push(clone);
   }
   // Commit after every UV, room, asset hash and probe has passed admission.
   for(const {o,m,floor}of targets)o.material=materials.get(floor+'/'+m.uuid);
   state.meshes=targets.length;state.materials=clones.map(m=>({name:m.name,floor:m.userData.v02ReflectionFloor,diffuse:!!m.lightMap}));state.rooms=c.localReflectionProbes.map(p=>({floor:p.floor,position:p.position,sha256:p.sha256}));state.textureBytes=c.atlas.rawBytes+c.localReflectionProbes.reduce((s,p)=>s+p.rawBytes,0);state.sourceMasterSHA256=c.masterSHA256;state.atlasSHA256=c.atlas.sha256;state.width=c.atlas.width;state.height=c.atlas.height;state.policy=c.lighting;state.ready=true;state.loading=false;
  }catch(e){if(!state.ready){for(const m of clones)m.dispose();atlas?.dispose();for(const e of environments)e.dispose();}state.loading=false;state.error=String(e);console.error('V02 source lighting',e);}
  finally{for(const t of sourceTextures)t.dispose();pmrem?.dispose();}
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);window.verticalDiffuseLightingState=()=>JSON.parse(JSON.stringify(state));return{build,state:window.verticalDiffuseLightingState};
})();
