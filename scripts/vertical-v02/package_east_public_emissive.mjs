/* Isolated fixture-light admission and static room-asset batching. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {semantic,materialState,corners,bakeStaticTransforms,compareRenderedCorners} from './static_gltf_batch_v02.mjs';

const require=createRequire(new URL('../../development/vertical-city-v02/tools/package.json',import.meta.url));
const {NodeIO,PropertyType}=require('@gltf-transform/core');
const {ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {dedup,prune,join}=require('@gltf-transform/functions');
const validator=require('gltf-validator');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const DEV=path.join(ROOT,'development/vertical-city-v02');
const OUT=path.join(ROOT,'assets/city/vertical-v02/east-public-emissive/runtime');
fs.mkdirSync(OUT,{recursive:true});
const bytes=f=>fs.readFileSync(path.join(ROOT,f));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=f=>JSON.parse(bytes(f));
const author=read('development/vertical-city-v02/V02_East_Public_Emissive_Authoring.json');
const gateFile='development/vertical-city-v02/V02_East_Public_Emissive_Master_Validation.json';
const gate=read(gateFile);
assert(gate.status.startsWith('PASS'));
assert.equal(gate.masterSHA256,author.masterSHA256);
assert.equal(sha(bytes(author.master)),author.masterSHA256);
assert.equal(sha(bytes('scripts/vertical-v02/blender_east_public_emissive.py')),author.scriptSHA256);
assert.equal(sha(bytes('scripts/vertical-v02/validate_east_public_emissive_master.py')),gate.validatorSHA256);
assert.equal(sha(bytes('scripts/vertical-v02/v02_saved_scene_snapshots.py')),gate.savedSceneSnapshotSHA256);
const parentFolder='assets/city/vertical-v02/east-public-loggias/runtime';
const parent=read(parentFolder+'/manifest.json');
const parentPack=read('development/vertical-city-v02/V02_East_Public_Loggias_Package.json');
assert.equal(sha(bytes(parentFolder+'/manifest.json')),parentPack.manifestSHA256);
assert.equal(parentPack.masterSHA256,author.sourceMasterSHA256);
const manifest=structuredClone(parent),io=new NodeIO().registerExtensions(ALL_EXTENSIONS),results=[];
for(const model of author.exports){
  const raw=bytes(model.url);assert.equal(sha(raw),model.sha256);
  const doc=await io.readBinary(raw),actual=corners(doc);
  const witnessInfo=gate.rooms.find(r=>'east-public-room-'+r.floor===model.id);
  const witnessBytes=bytes(witnessInfo.witness);assert.equal(sha(witnessBytes),witnessInfo.witnessSHA256);
  const source=JSON.parse(zlib.gunzipSync(witnessBytes)).map(t=>({material:t.material,corners:t.corners.map(c=>({
    position:c.position,normal:c.normal,uv:[c.sourceUV[0],1-c.sourceUV[1]],
    attributes:{POSITION:c.position,NORMAL:c.normal,TEXCOORD_0:[c.sourceUV[0],1-c.sourceUV[1]],
      TEXCOORD_1:[c.sourceUV1[0],1-c.sourceUV1[1]]}
  }))}));
  assert(actual.every(t=>t.corners.every(c=>c.attributes.TEXCOORD_1)));
  const witnessComparison=compareRenderedCorners(actual,source,['TANGENT']);
  const priorChunk=parent.chunks.find(c=>c.id===model.id);
  assert(priorChunk);assert.equal(sha(bytes(priorChunk.url)),priorChunk.sha256);
  const prior=corners(await io.readBinary(bytes(priorChunk.url)));
  const priorComparison=compareRenderedCorners(actual.map(t=>({...t,material:t.material==='V02_east_loggia_luminaire_v2'?'V02_east_loggia_luminaire':t.material})),prior,['TEXCOORD_1']);
  const materials=materialState(doc);
  bakeStaticTransforms(doc);
  await doc.transform(dedup({propertyTypes:[PropertyType.TEXTURE,PropertyType.ACCESSOR]}),
    join({keepNamed:false,cleanup:false}),prune({keepAttributes:true,keepLeaves:false}));
  const batched=corners(doc),batchComparison=compareRenderedCorners(batched,actual);
  const signature=semantic(doc),packed=await io.writeBinary(doc),decoded=await io.readBinary(packed);
  assert.equal(semantic(decoded),signature);assert.equal(materialState(decoded),materials);
  const validation=await validator.validateBytes(packed,{uri:model.id+'-uv2.glb'});
  assert.equal(validation.issues.numErrors,0);assert.equal(validation.issues.numWarnings,0);
  const file=path.join(OUT,model.id+'-uv2.glb');fs.writeFileSync(file,packed);
  const chunk=manifest.chunks.find(c=>c.id===model.id);
  Object.assign(chunk,{sourceRawURL:model.url,sourceRawSHA256:model.sha256,
    url:path.relative(ROOT,file),sha256:sha(packed),bytes:packed.length});
  results.push({id:model.id,rawURL:model.url,rawSHA256:model.sha256,rawBytes:raw.length,
    shippingURL:chunk.url,shippingSHA256:chunk.sha256,shippingBytes:packed.length,
    witnessComparison,priorComparison,batchComparison,
    materialTextureSamplerParametersExact:true,khronosErrors:0,khronosWarnings:0,
    primitives:decoded.getRoot().listMeshes().reduce((s,m)=>s+m.listPrimitives().length,0)});
}
assert.equal(results.length,3);
manifest.eastPublicLighting={master:author.master,masterSHA256:author.masterSHA256,
  sourceMasterSHA256:author.sourceMasterSHA256,rooms:author.rooms.map(r=>r.floor),newDynamicLights:0};
manifest.status='SOURCE-LIT ROOM CANDIDATE; real-input and native visual acceptance pending';
assert.deepEqual(manifest.records,parent.records);
const manifestBytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(OUT,'manifest.json'),manifestBytes);
const manifestSHA256=sha(manifestBytes);
for(const file of ['collisions.json','structure_ownership.json','threadrail_surfaces.json']){
  const input=bytes(parentFolder+'/'+file),data=JSON.parse(input);
  data.sourcePhysicalMetadataSHA256=sha(input);data.sourceManifestSHA256=manifestSHA256;
  if(file==='threadrail_surfaces.json')data.physicalSurfaceGeometry=manifest.chunks.map(c=>({id:c.id,url:c.url,recordIDs:c.recordIDs}));
  fs.writeFileSync(path.join(OUT,file),JSON.stringify(data,null,2)+'\n');
}
const rooms=author.rooms.map(room=>{
  for(const spec of [room.atlas,room.reflection]){
    const compressed=bytes(spec.url);assert.equal(sha(compressed),spec.sha256);
    const raw=zlib.gunzipSync(compressed);assert.equal(sha(raw),spec.rawSHA256);
    assert.equal(raw.length,spec.width*spec.height*8);
  }
  assert.equal(room.reflection.sourceMasterSHA256,author.masterSHA256);
  return{floor:room.floor,chunk:room.chunk,atlas:room.atlas,reflection:room.reflection,
    primitives:results.find(r=>r.id===room.chunk).primitives};
});
const contract={version:1,master:author.master,masterSHA256:author.masterSHA256,
  sourceMasterSHA256:author.sourceMasterSHA256,manifestSHA256,rooms,
  luminaire:author.luminaire,
  opaqueDiffuseNames:['V02_deck','V02_steel','V02_arcade_soffit','V02_terrace_foliage','V02_east_loggia_luminaire_v2'],
  lighting:author.lighting,bakeScope:author.bakeScope,newDynamicLights:0,
  scope:'Source lighting on new east rooms only; no global palette, light, old loggia or hero changes'};
fs.writeFileSync(path.join(OUT,'lighting.json'),JSON.stringify(contract,null,2)+'\n');
const report={status:'PASS source UV2 witnesses, parent rendered attributes, batch geometry and HDR identity; native/input acceptance pending',
  masterSHA256:author.masterSHA256,sourceMasterSHA256:author.sourceMasterSHA256,
  sourceGateSHA256:sha(bytes(gateFile)),packageScriptSHA256:sha(bytes('scripts/vertical-v02/package_east_public_emissive.mjs')),
  batchHelperSHA256:sha(bytes('scripts/vertical-v02/static_gltf_batch_v02.mjs')),
  toolLockSHA256:sha(bytes('development/vertical-city-v02/tools/package-lock.json')),
  manifestSHA256,contractSHA256:sha(bytes('assets/city/vertical-v02/east-public-emissive/runtime/lighting.json')),
  parentManifestSHA256:parentPack.manifestSHA256,recordsUnchanged:true,
  unchangedChunks:parent.chunks.length-results.length,results,
  scope:'Independent source/export lighting data only. Current browser orientation, camera/contact, route, gameplay, reference and performance acceptance remain separate.'};
fs.writeFileSync(path.join(DEV,'V02_East_Public_Emissive_Package.json'),JSON.stringify(report,null,2)+'\n');
console.log(report.status,results.length,'UV2 room chunks');
