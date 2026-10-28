/* Source-baked static diffuse light. Only the UV2 loggia chunk is admitted.
 * Clone shared materials locally; never attach this atlas to other chunks.
 * The bake replaces scene diffuse, preserving specular/IBL and real emission.
 */
window.verticalDiffuseLighting=(()=>{
 const state={ready:false,loading:false,error:null,chunk:'loggia-rooms',meshes:0,materials:[],newDynamicLights:0,textureBytes:0};
 const selected=new Set(['V02_deck','V02_steel','V02_arcade_soffit','V02_terrace_foliage','V02_loggia_luminaire']);
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');
 async function build(){
  if(state.ready||state.loading||state.error||!window.verticalMaterialResponseState?.().ready)return;
  state.loading=true;let texture;const clones=[];
  try{
   const response=await fetch('assets/city/vertical-v02/diffuse-pilot/runtime/lighting.json');if(!response.ok)throw Error('Diffuse contract HTTP '+response.status);const c=await response.json();
   const root=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture')?.getObjectByName(c.chunk);if(!root)throw Error('Diffuse chunk not loaded');
   const targets=[];root.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(!selected.has(m.name))continue;if(!m.isMeshStandardMaterial||m.transparent)throw Error('Unsupported diffuse target '+m.name);const uv=o.geometry.attributes.uv2;if(!uv||uv.count!==o.geometry.attributes.position.count)throw Error('Missing source UV2 on '+o.name);targets.push({o,m});}});if(!targets.length)throw Error('No diffuse surfaces admitted');
   const r=await fetch(c.atlas.url);if(!r.ok)throw Error('Diffuse atlas HTTP '+r.status);const zipped=new Uint8Array(await r.arrayBuffer());if(await hash(zipped)!==c.atlas.sha256)throw Error('Diffuse atlas hash mismatch');
   const bytes=fflate.gunzipSync(zipped);if(await hash(bytes)!==c.atlas.rawSHA256||bytes.byteLength!==c.atlas.width*c.atlas.height*8)throw Error('Diffuse texels fail source identity');
   const half=new Uint16Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
   texture=new THREE.DataTexture(half,c.atlas.width,c.atlas.height,THREE.RGBAFormat,THREE.HalfFloatType);texture.name='Source loggia full diffuse light / UV2';texture.encoding=THREE.LinearEncoding;texture.flipY=false;texture.generateMipmaps=false;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
   const reflection=targets.find(t=>t.m.envMap)?.m;
   const materials=new Map();for(const {m}of targets){if(materials.has(m))continue;const clone=m.clone();clone.lightMap=texture;clone.lightMapIntensity=1;if(m.name===c.luminaire.material){clone.emissive.fromArray(c.luminaire.emissionColor);clone.emissiveIntensity=c.luminaire.emissionStrength;clone.envMap=reflection.envMap;clone.envMapIntensity=reflection.envMapIntensity;}
    // The old soffit approximation is intentionally absent on these private
    // clones: real source diffuse now owns their motivated ceiling lighting.
    clone.onBeforeCompile=shader=>{const marker='#include <lights_fragment_end>';if(!shader.fragmentShader.includes(marker))throw Error('Unsupported standard-material lighting pipeline');shader.fragmentShader=shader.fragmentShader.replace(marker,marker+`\n// V02 source diffuse replaces native direct/ambient/IBL diffuse once.\nreflectedLight.directDiffuse=vec3(0.);\nreflectedLight.indirectDiffuse=lightMapTexelToLinear(texture2D(lightMap,vUv2)).rgb*lightMapIntensity*material.diffuseColor;`);};
    clone.customProgramCacheKey=()=> 'sm-v02-source-diffuse-uv2-1';clone.userData.v02DiffuseSource=c.masterSHA256;clone.needsUpdate=true;materials.set(m,clone);clones.push(clone);
   }
   // Commit only after every required texture and UV has passed admission.
   for(const {o}of targets){o.material=Array.isArray(o.material)?o.material.map(m=>materials.get(m)||m):materials.get(o.material)||o.material;}
   state.meshes=new Set(targets.map(t=>t.o)).size;state.materials=clones.map(m=>m.name);state.textureBytes=bytes.byteLength;state.sourceMasterSHA256=c.masterSHA256;state.atlasSHA256=c.atlas.sha256;state.width=c.atlas.width;state.height=c.atlas.height;state.policy=c.lighting;state.ready=true;state.loading=false;
  }catch(e){if(!state.ready){for(const m of clones)m.dispose();texture?.dispose();}state.loading=false;state.error=String(e);console.error('V02 source diffuse',e);}
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);
 window.verticalDiffuseLightingState=()=>JSON.parse(JSON.stringify(state));return{build,state:window.verticalDiffuseLightingState};
})();
