/* Original selector-bound pixel equations. Unrecovered runtime bindings stay explicit. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CinematicSourceMaterials=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const IMPLEMENTED=0x1f002;
function finite(v,n){return Array.isArray(v)&&v.length===n&&v.every(Number.isFinite);}
function validateBindings(bindings){if(!bindings||!Number.isFinite(bindings.alphaThreshold)||!Number.isFinite(bindings.alphaScale)||!Number.isFinite(bindings.lighting)||!finite(bindings.ambient,3))throw new Error('Source material requires finite alphaThreshold, alphaScale, lighting and ambient');if(bindings.fogParam&&(!finite(bindings.fogParam,3)||bindings.fogParam[0]===bindings.fogParam[1]))throw new Error('Invalid source fog parameter interval');return bindings;}
function evaluatePixel(sample,color,bindings){const b=validateBindings(bindings);if(!finite(sample,4)||!finite(color,4))throw new Error('Invalid pixel inputs');const alpha=sample[3]*color[3];if(b.alphaThreshold>=alpha)return null;return [0,1,2].map(i=>(sample[i]*color[i]-b.ambient[i])*b.lighting+b.ambient[i]).concat(alpha*b.alphaScale);}
function findRecord(evidence,modelName,meshIndex=0,passIndex=0){for(const bundle of evidence?.bundles||[]){const model=bundle.models.find(x=>x.name===modelName);if(model){const row=model.meshes.find(x=>x.meshIndex===meshIndex&&x.passIndex===passIndex);if(row){const materialName=model.materials[meshIndex]||model.materials[0];return {...row,bundle:bundle.bundle,materialName,chunkMaterial:bundle.materials.find(m=>m.name===materialName)||null,sourceSha256:bundle.sourceSha256};}}}return null;}
function create(THREE,options={}){
 const {record,map=null,bindings=null,strict=false,vertexColors=false}=options;const selector=record?.flags;const exact=bindings?.evidence&&validateBindings(bindings);const supported=selector===IMPLEMENTED;
 if(strict&&(!supported||!exact))throw new Error(!supported?'Unsupported original shader selector: '+selector:'Original shader parameter bindings unresolved');
 const b=exact||{alphaThreshold:0,alphaScale:1,ambient:[0,0,0],lighting:1};
 // Raw NUD factors are intentionally not reinterpreted as guessed D3D enums.
 const mat=new THREE.MeshBasicMaterial({map,color:0xffffff,side:THREE.DoubleSide,transparent:true,depthWrite:false,vertexColors});
 if(map&&(record?.chunkMaterial?.flags&1)){const uv=record.chunkMaterial.UV0;if(finite(uv,4)){map.offset?.set(uv[0],uv[1]);map.repeat?.set(uv[2],uv[3]);}}
 mat.skinning=true;mat.name=record?.materialName||'source material inspection';mat.userData.sourceMaterial={selector,selectorHex:selector===undefined?null:'0x'+selector.toString(16),supportedPixelEquation:supported,verified:false,mode:exact&&supported?'source-equation-with-evidenced-parameters':'source-equation-inspection',parameterNames:{ambient:'g_fogColor.rgb',lighting:'interpolated source fog factor',alphaThreshold:'g_commonParam.x',alphaScale:'g_commonParam.y'},parameterPolicy:exact?'caller supplied evidenced source parameters':'inspection defaults alphaThreshold=0, alphaScale=1, g_fogColor=0, fogFactor=1',unresolved:['Original blend/depth state','Original vertex varying and fog parameter values','Original second render target and framebuffer conversion'],rawRenderState:record?{sourceFactor:record.sourceFactor,destFactor:record.destFactor,alphaTest:record.alphaTest,alphaFunction:record.alphaFunction,refAlpha:record.refAlpha,cullMode:record.cullMode,zBufferOffset:record.zBufferOffset}:null};
 if(!supported){mat.userData.sourceMaterial.mode='untranslated-selector-inspection';return mat;}
 mat.userData.sourceParameters={...b,ambient:b.ambient.slice()};
 mat.onBeforeCompile=shader=>{
  shader.uniforms.sourceThreshold={value:b.alphaThreshold};shader.uniforms.sourceAlphaScale={value:b.alphaScale};shader.uniforms.sourceFogFactor={value:b.lighting};shader.uniforms.sourceFogParam={value:new THREE.Vector3(...(b.fogParam||[0,1,0]))};shader.uniforms.sourceFogEnabled={value:finite(b.fogParam,3)&&b.fogParam[0]!==b.fogParam[1]?1:0};
  shader.vertexShader='uniform vec3 sourceFogParam;\nuniform float sourceFogFactor;\nuniform float sourceFogEnabled;\nvarying float vSourceFog;\n'+shader.vertexShader;
  const project='#include <project_vertex>';if(!shader.vertexShader.includes(project))throw new Error('Unsupported Three projection shader ABI');shader.vertexShader=shader.vertexShader.replace(project,project+'\nvSourceFog=sourceFogEnabled>.5 ? 1.0+sourceFogParam.z*((sourceFogParam.y-gl_Position.w)/(sourceFogParam.y-sourceFogParam.x)-1.0) : sourceFogFactor;\n');shader.uniforms.sourceFogColor={value:new THREE.Vector3(...b.ambient)};
  shader.fragmentShader='varying float vSourceFog;\nuniform float sourceThreshold;\nuniform float sourceAlphaScale;\nuniform float sourceFogFactor;\nuniform vec3 sourceFogColor;\n'+shader.fragmentShader;
  const marker='#include <color_fragment>';if(!shader.fragmentShader.includes(marker))throw new Error('Unsupported Three color shader ABI');
  shader.fragmentShader=shader.fragmentShader.replace(marker,marker+'\nif (sourceThreshold >= diffuseColor.a) discard;\ndiffuseColor.a *= sourceAlphaScale;\ndiffuseColor.rgb = (diffuseColor.rgb-sourceFogColor)*vSourceFog+sourceFogColor;\n');
  mat.userData.sourceUniforms=shader.uniforms;
 };
 mat.customProgramCacheKey=()=> 'nsunsc-source-1f002-v1';return mat;
}
function update(material,patch){const p=material.userData.sourceParameters;if(!p)return false;const b=validateBindings({...p,...patch});Object.assign(p,b);const u=material.userData.sourceUniforms;if(u){u.sourceThreshold.value=b.alphaThreshold;u.sourceAlphaScale.value=b.alphaScale;u.sourceFogFactor.value=b.lighting;if(b.fogParam){if(!finite(b.fogParam,3)||b.fogParam[0]===b.fogParam[1])throw new Error('Invalid source fog parameter interval');u.sourceFogParam.value.set(...b.fogParam);u.sourceFogEnabled.value=1;}u.sourceFogColor.value.set(...b.ambient);}return true;}
// Decode a captured source constant buffer by reflected name and byte range.
// This accepts bytes only; it does not fill missing vectors with inspection defaults.
function decodeConstantBuffer(contract,bytes,evidence){
 if(!contract||!Number.isInteger(contract.bytes)||!Array.isArray(contract.variables))throw new Error('Source buffer reflection required');
 if(!ArrayBuffer.isView(bytes)||bytes.byteLength!==contract.bytes)throw new Error('Complete source constant buffer bytes required');
 if(!Array.isArray(evidence)||!evidence.length)throw new Error('Source buffer evidence required');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),values={};
 for(const row of contract.variables){
  if(!Number.isInteger(row.offset)||!Number.isInteger(row.bytes)||row.offset<0||row.bytes%4||row.offset+row.bytes>view.byteLength)throw new Error('Invalid reflected buffer range');
  values[row.name]=Array.from({length:row.bytes/4},(_,i)=>view.getFloat32(row.offset+i*4,true));
  if(!values[row.name].every(Number.isFinite))throw new Error('Nonfinite source constant buffer');
 }
 return {values,evidence:evidence.slice(),verified:false};
}
function createExplicitPixelMaterial(THREE,options={}){
 const {profile,source,constantVectors,textures,vertexShader,inputDeclarations='',inputAssignments,evidence=[]}=options;
 if(![0xf00a,0x2f00a].includes(profile?.selector))throw new Error('Unsupported body pixel program');
 if(typeof source!=='string'||!source.includes('void sourcePixel(')||typeof vertexShader!=='string'||typeof inputAssignments!=='string')throw new Error('Explicit source program and vertex input adapter required');
 if(!Array.isArray(constantVectors)||constantVectors.length!==profile.requiredConstantVectors||!constantVectors.every(v=>finite(v,4)))throw new Error('Every source constant vector must be supplied');
 if(!Array.isArray(textures)||textures.length!==profile.requiredTextureSlots||textures.some(t=>!t?.isTexture))throw new Error('Every source texture slot must be supplied');
 if(!Array.isArray(evidence)||!evidence.length)throw new Error('Explicit binding evidence required');
 const uniforms={cb0:{value:constantVectors.map(v=>new THREE.Vector4(...v))}};textures.forEach((t,i)=>uniforms['sourceTexture'+i]={value:t});
 const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader:'uniform vec4 cb0['+profile.requiredConstantVectors+'];\n'+textures.map((t,i)=>'uniform sampler2D sourceTexture'+i+';').join('\n')+'\n'+inputDeclarations+'\n'+source+'\nvoid main(){vec4 v[4];'+inputAssignments+'vec4 o[3];sourcePixel(v,o);gl_FragColor=o[0];}'});
 material.userData.sourceMaterial={selector:profile.selector,mode:'explicit-source-pixel-program',verified:false,evidence,sourcePixelSha256:profile.source.sha256,unresolved:['Source vertex input adapter correctness','Original three-target framebuffer composition','Blend, depth and texture sampler state']};return material;
}
return {create,decodeConstantBuffer,createExplicitPixelMaterial,findRecord,evaluatePixel,validateBindings,update,implementedSelectors:[IMPLEMENTED]};
});
