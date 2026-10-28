/* Source-corner verification and lossless room packaging. No runtime promotion. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../development/vertical-city-v02/tools/package.json',import.meta.url));
const {NodeIO,PropertyType}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {dedup,prune,join}=require('@gltf-transform/functions');
const THREE=createRequire(import.meta.url)('../vendor/three-r128.js');
const validator=require('gltf-validator');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const DEV=path.join(ROOT,'development/vertical-city-v02');
const OUT=path.join(ROOT,'assets/city/vertical-v02/east-public-loggias/runtime');
fs.mkdirSync(OUT,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=f=>fs.readFileSync(path.join(ROOT,f));
const read=f=>JSON.parse(bytes(f));
const author=read('development/vertical-city-v02/V02_East_Public_Loggias_Authoring.json');
const sourceGate=read('development/vertical-city-v02/V02_East_Public_Loggias_Master_Validation.json');
const plan=read('development/vertical-city-v02/V02_East_Public_Loggias_Plan.json');
assert(sourceGate.status.startsWith('PASS'));
assert.equal(sha(bytes(author.master)),author.masterSHA256);
assert.equal(sourceGate.masterSHA256,author.masterSHA256);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const rawManifest=read('assets/city/vertical-v02/east-public-loggias/manifest.json');
const results=[];
function semantic(d){
  return JSON.stringify(d.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>({
    name:n.getName(),matrix:n.getWorldMatrix(),primitives:n.getMesh().listPrimitives().map(p=>({
      mode:p.getMode(),material:p.getMaterial().getName(),
      indices:Array.from(p.getIndices().getArray()),
      attributes:Object.fromEntries(p.listSemantics().sort().map(k=>{
        const a=p.getAttribute(k).getArray();
        return[k,sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength))];
      }))
    }))
  })));
}
function materialState(d){
  return JSON.stringify(d.getRoot().listMaterials().map(m=>({
    name:m.getName(),base:m.getBaseColorFactor(),metal:m.getMetallicFactor(),rough:m.getRoughnessFactor(),
    emission:m.getEmissiveFactor(),strength:m.getExtension('KHR_materials_emissive_strength')?.getEmissiveStrength()||1,
    alphaMode:m.getAlphaMode(),alphaCutoff:m.getAlphaCutoff(),doubleSided:m.getDoubleSided(),
    normalScale:m.getNormalScale(),occlusion:m.getOcclusionStrength(),
    textures:['BaseColor','MetallicRoughness','Normal','Occlusion','Emissive'].map(k=>{
      const t=m['get'+k+'Texture']();
      if(!t)return null;
      const i=m['get'+k+'TextureInfo'](),transform=i.getExtension('KHR_texture_transform');
      return{name:k,mime:t.getMimeType(),image:sha(Buffer.from(t.getImage())),uv:i.getTexCoord(),
        filters:[i.getMinFilter(),i.getMagFilter(),i.getWrapS(),i.getWrapT()],
        transform:transform?{offset:transform.getOffset(),scale:transform.getScale(),rotation:transform.getRotation()}:null};
    })
  })));
}
function corners(d){
  const triangles=[];
  for(const node of d.getRoot().listNodes()){
    if(!node.getMesh())continue;
    const w=node.getWorldMatrix();
    const matrix=new THREE.Matrix4().fromArray(w),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
    const transform=(v,point)=>[0,1,2].map(i=>w[i]*v[0]+w[i+4]*v[1]+w[i+8]*v[2]+(point?w[i+12]:0));
    for(const p of node.getMesh().listPrimitives()){
      assert.equal(p.getMode(),4);
      const pos=p.getAttribute('POSITION').getArray(),normal=p.getAttribute('NORMAL').getArray();
      const uv=p.getAttribute('TEXCOORD_0').getArray(),ids=p.getIndices().getArray();
      for(let i=0;i<ids.length;i+=3){
        const cs=[];
        for(let j=0;j<3;j++){
          const k=ids[i+j];
          const attributes={};
          for(const semantic of p.listSemantics()){
            const accessor=p.getAttribute(semantic),size=accessor.getElementSize();
            const value=Array.from(accessor.getArray().slice(k*size,(k+1)*size));
            if(semantic==='POSITION')attributes[semantic]=transform(value,true);
            else if(semantic==='NORMAL')attributes[semantic]=new THREE.Vector3(...value).applyMatrix3(normalMatrix).normalize().toArray();
            else if(semantic==='TANGENT')attributes[semantic]=[...new THREE.Vector3(...value.slice(0,3)).transformDirection(matrix).toArray(),value[3]*Math.sign(matrix.determinant())];
            else attributes[semantic]=value;
          }
          cs.push({position:attributes.POSITION,normal:attributes.NORMAL,uv:attributes.TEXCOORD_0,attributes});
        }
        triangles.push({material:p.getMaterial().getName(),corners:cs});
      }
    }
  }
  return triangles;
}
function bakeStaticTransforms(d){
  // glTF Transform4.3.0 applyTangentMatrix writes v3[0] before computing
  // v3[1]/v3[2], corrupting rotated tangents. Do not patch the installed vendor.
  // Bake immutable input triples explicitly, then join identity-space nodes.
  const nodes=d.getRoot().listNodes(),world=new Map(nodes.map(n=>[n,n.getWorldMatrix()]));
  for(const node of nodes){
    assert(!node.getSkin());
    const source=node.getMesh();if(!source)continue;
    const matrix=new THREE.Matrix4().fromArray(world.get(node)),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
    const mesh=d.createMesh(source.getName()).setExtras(source.getExtras());
    for(const primitive of source.listPrimitives()){
      const copy=primitive.clone();
      for(const name of primitive.listSemantics()){
        const accessor=primitive.getAttribute(name),input=accessor.getArray(),size=accessor.getElementSize();
        const output=new input.constructor(input);
        if(['POSITION','NORMAL','TANGENT'].includes(name))for(let i=0;i<input.length;i+=size){
          const v=new THREE.Vector3(input[i],input[i+1],input[i+2]);
          if(name==='POSITION')v.applyMatrix4(matrix);
          else if(name==='NORMAL')v.applyMatrix3(normalMatrix).normalize();
          else v.transformDirection(matrix);
          output[i]=v.x;output[i+1]=v.y;output[i+2]=v.z;
          if(name==='TANGENT')output[i+3]=input[i+3]*Math.sign(matrix.determinant());
        }
        copy.setAttribute(name,accessor.clone().setArray(output));
      }
      if(primitive.getIndices())copy.setIndices(primitive.getIndices().clone().setArray(new (primitive.getIndices().getArray().constructor)(primitive.getIndices().getArray())));
      mesh.addPrimitive(copy);
    }
    node.setMesh(mesh);
  }
  for(const node of nodes)node.setTranslation([0,0,0]).setRotation([0,0,0,1]).setScale([1,1,1]);
}
const cell=t=>[0,1,2].map(i=>Math.floor(t.corners.reduce((s,c)=>s+c.position[i],0)/3/.1));
const key=t=>t.material+'|'+cell(t).join(',');
function lookup(bins,t){
  const c=cell(t),out=[];
  // Adjacent cells avoid decimal-rounding discontinuities at bin boundaries.
  // Full oriented corner comparison below still establishes the match.
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)
    for(const candidate of bins.get(t.material+'|'+[c[0]+x,c[1]+y,c[2]+z].join(','))||[])
      if(!candidate.__consumed)out.push(candidate);
  return out;
}
for(const chunk of author.exports){
  const input=bytes(chunk.url);
  assert.equal(sha(input),chunk.sha256);
  const witnessInfo=sourceGate.witnesses.find(x=>x.id===chunk.id);
  const witnessBytes=bytes(witnessInfo.file);
  assert.equal(sha(witnessBytes),witnessInfo.sha256);
  const witness=JSON.parse(zlib.gunzipSync(witnessBytes)),bins=new Map();
  for(const t of witness){const k=key(t);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(t);}
  const doc=await io.readBinary(input),actual=corners(doc);
  assert.equal(actual.length,witness.length);
  let maxPositionError=0,maxNormalError=0,maxUVError=0;
  for(const t of actual){
    const list=lookup(bins,t);assert(list.length,'Missing source triangle '+key(t));
    let match=-1,errors;
    for(let i=0;i<list.length&&match<0;i++)for(let r=0;r<3;r++){
      let pe=0,ne=0,ue=0;
      for(let j=0;j<3;j++){
        const a=t.corners[j],b=list[i].corners[(j+r)%3];
        pe=Math.max(pe,...a.position.map((v,k)=>Math.abs(v-b.position[k])));
        ne=Math.max(ne,...a.normal.map((v,k)=>Math.abs(v-b.normal[k])));
        ue=Math.max(ue,Math.abs(a.uv[0]-b.sourceUV[0]),Math.abs(a.uv[1]-(1-b.sourceUV[1])));
      }
      if(pe<4e-5&&ne<1e-4&&ue<3e-5){match=i;errors={pe,ne,ue};break;}
    }
    if(match<0)console.error(JSON.stringify({actual:t,source:list.slice(0,3)}));
    assert(match>=0,'Source corner/normal/UV/orientation mismatch '+key(t));
    list[match].__consumed=true;
    maxPositionError=Math.max(maxPositionError,errors.pe);
    maxNormalError=Math.max(maxNormalError,errors.ne);
    maxUVError=Math.max(maxUVError,errors.ue);
  }
  assert([...bins.values()].every(list=>list.every(t=>t.__consumed)));
  const mats=materialState(doc),renderedBins=new Map();
  for(const triangle of actual){const k=key(triangle);if(!renderedBins.has(k))renderedBins.set(k,[]);renderedBins.get(k).push(triangle);}
  bakeStaticTransforms(doc);
  await doc.transform(dedup({propertyTypes:[PropertyType.TEXTURE,PropertyType.ACCESSOR]}),join({keepNamed:false,cleanup:false}));
  const joined=corners(doc),maximumBatchErrors={};assert.equal(joined.length,actual.length);
  for(const triangle of joined){
    const candidates=lookup(renderedBins,triangle);assert(candidates.length,'Batch source triangle missing '+key(triangle));
    let found=-1,acceptedErrors;
    for(let i=0;i<candidates.length&&found<0;i++)for(let rotation=0;rotation<3;rotation++){
      let valid=true;const errors={};
      for(let j=0;j<3;j++){
        const a=triangle.corners[j].attributes,b=candidates[i].corners[(j+rotation)%3].attributes;
        if(Object.keys(a).sort().join()!==Object.keys(b).sort().join()){valid=false;break;}
        for(const name of Object.keys(a)){
          const delta=Math.max(...a[name].map((v,k)=>Math.abs(v-b[name][k])));
          const tolerance=['NORMAL','TANGENT'].includes(name)?1e-4:name==='POSITION'?4e-5:name.startsWith('TEXCOORD')?3e-5:1e-7;
          if(delta>tolerance){valid=false;break;}errors[name]=Math.max(errors[name]||0,delta);
        }
      }
      if(valid){found=i;acceptedErrors=errors;break;}
    }
    if(found<0)console.error(JSON.stringify({stage:'batch',actual:triangle,source:candidates.map(t=>({triangle:t,error:Math.min(...[0,1,2].map(r=>Math.max(...triangle.corners.flatMap((c,j)=>c.position.map((v,k)=>Math.abs(v-t.corners[(j+r)%3].position[k]))))))})).sort((a,b)=>a.error-b.error).slice(0,1)}));
    assert(found>=0,'Batch changed a rendered corner '+key(triangle));candidates[found].__consumed=true;
    for(const[name,value]of Object.entries(acceptedErrors))maximumBatchErrors[name]=Math.max(maximumBatchErrors[name]||0,value);
  }
  assert([...renderedBins.values()].every(list=>list.every(t=>t.__consumed)));
  await doc.transform(prune({keepAttributes:true,keepLeaves:false}));
  const attrs=semantic(doc),shipping=await io.writeBinary(doc),decoded=await io.readBinary(shipping);
  assert.equal(semantic(decoded),attrs);assert.equal(materialState(decoded),mats);
  const validation=await validator.validateBytes(shipping,{uri:chunk.id+'.glb'});
  assert.equal(validation.issues.numErrors,0);
  assert.equal(validation.issues.numWarnings,0);
  const file=path.join(OUT,chunk.id+'.glb');fs.writeFileSync(file,shipping);
  const record=rawManifest.chunks.find(c=>c.id===chunk.id);
  Object.assign(record,{sourceRawURL:chunk.url,sourceRawSHA256:chunk.sha256,
    url:path.relative(ROOT,file),sha256:sha(shipping),bytes:shipping.length});
  results.push({id:chunk.id,rawURL:chunk.url,rawSHA256:chunk.sha256,rawBytes:input.length,
    shippingURL:record.url,shippingSHA256:record.sha256,shippingBytes:shipping.length,
    sourceWitnessSHA256:witnessInfo.sha256,triangles:actual.length,maxPositionError,maxNormalError,maxUVError,
    allRenderedCornerAttributesPreserved:true,maximumBatchErrors,materialAndTextureParametersExact:true,
    khronosErrors:validation.issues.numErrors,khronosWarnings:validation.issues.numWarnings});
}
rawManifest.status='PACKAGED room source; diffuse lighting, native input and visual acceptance pending';
const manifestBytes=Buffer.from(JSON.stringify(rawManifest,null,2)+'\n');
fs.writeFileSync(path.join(OUT,'manifest.json'),manifestBytes);
const manifestHash=sha(manifestBytes),recordMap=new Map(rawManifest.records.map(r=>[r.id,r]));
const controlled=new Set(plan.changes.map(c=>c.after.id));
const parentFolder=path.dirname(plan.sourceManifest);
for(const name of ['collisions.json','structure_ownership.json','threadrail_surfaces.json']){
  const input=path.join(parentFolder,name),data=read(input);
  data.sourcePhysicalMetadataSHA256=sha(bytes(input));
  data.sourceManifestSHA256=manifestHash;
  if(name==='collisions.json'){
    data.colliders=data.colliders.map(c=>controlled.has(c.id)?{...c,box:recordMap.get(c.id).box}:c);
    data.colliders.push(...plan.additions.filter(r=>r.solid).map(r=>({id:r.id,owner:r.owner,box:r.box,solid:true,walkable:r.walkable})));
    const seen=new Set();for(const c of data.colliders){assert(!seen.has(c.id));seen.add(c.id);assert.deepEqual(c.box,recordMap.get(c.id).box);}
    assert.deepEqual([...seen].sort(),rawManifest.records.filter(r=>r.solid).map(r=>r.id).sort());
  }
  if(name==='structure_ownership.json'){
    data.structures.push(...plan.additions.map(r=>({id:r.id,owner:r.owner,collection:r.collection,
      operation:'Independent-frame gallery-connected public room',nonDestructible:true})));
    assert.equal(new Set(data.structures.map(r=>r.id)).size,rawManifest.records.length);
  }
  if(name==='threadrail_surfaces.json'){
    data.physicalSurfaceColliders=data.physicalSurfaceColliders.map(c=>controlled.has(c.id)?{...c,box:recordMap.get(c.id).box}:c);
    data.physicalSurfaceColliders.push(...plan.additions.filter(r=>r.solid).map(r=>({id:r.id,owner:r.owner,box:r.box})));
    data.physicalSurfaceGeometry=rawManifest.chunks.map(c=>({id:c.id,url:c.url,recordIDs:c.recordIDs}));
    data.status='Source geometry only; actual room attachment/input validation pending';
  }
  fs.writeFileSync(path.join(OUT,name),JSON.stringify(data,null,2)+'\n');
}
const report={staticBatchingPolicy:'Source local meshes retained in Blender; explicit immutable-triple transform baking avoids glTF Transform4.3.0 tangent in-place update bug; full rendered-corner comparison remains authoritative',status:'PASS every source corner and transform-preserving offline batching; room gameplay/lighting unadmitted',
  toolLockSHA256:sha(bytes('development/vertical-city-v02/tools/package-lock.json')),
  toolVersions:Object.fromEntries(['core','functions','extensions'].map(name=>[name,read('development/vertical-city-v02/tools/node_modules/@gltf-transform/'+name+'/package.json').version])),
  masterSHA256:author.masterSHA256,sourceGateSHA256:sha(bytes('development/vertical-city-v02/V02_East_Public_Loggias_Master_Validation.json')),
  packageScriptSHA256:sha(bytes('scripts/vertical-v02/package_east_public_loggias.mjs')),
  manifestSHA256:manifestHash,results,scope:'No current playable entry modified. Source full-diffuse bake, native contacts/camera/room access and final reference acceptance still required.'};
fs.writeFileSync(path.join(DEV,'V02_East_Public_Loggias_Package.json'),JSON.stringify(report,null,2)+'\n');
console.log(report.status,results.length,'chunks',results.reduce((s,r)=>s+r.triangles,0),'source triangles');
