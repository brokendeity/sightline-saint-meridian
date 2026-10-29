/* Source-witnessed static batching and explicit polygon contact metadata. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import zlib from 'node:zlib';
import assert from 'node:assert/strict';import{createRequire}from'node:module';import{fileURLToPath}from'node:url';
import{semantic,materialState,corners,bakeStaticTransforms,compareRenderedCorners}from'./static_gltf_batch_v02.mjs';
const require=createRequire(new URL('../../development/vertical-city-v02/tools/package.json',import.meta.url));
const{NodeIO,PropertyType}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions'),{dedup,prune,join}=require('@gltf-transform/functions'),validator=require('gltf-validator');
const R=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),D=path.join(R,'development/vertical-city-v02'),O=path.join(R,'assets/city/vertical-v02/slender-crossings/runtime');fs.mkdirSync(O,{recursive:true});
const bytes=f=>fs.readFileSync(path.join(R,f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(bytes(f));
const a=read('development/vertical-city-v02/V02_Slender_Crossings_Authoring.json'),g=read('development/vertical-city-v02/V02_Slender_Crossings_Master_Validation.json'),plan=read('development/vertical-city-v02/V02_Slender_Crossings_Plan.json');
assert(g.status.startsWith('PASS'));assert.equal(g.masterSHA256,a.masterSHA256);assert.equal(sha(bytes(a.master)),a.masterSHA256);assert.equal(g.validatorSHA256,sha(bytes('scripts/vertical-v02/validate_slender_crossing_master.py')));assert.equal(a.scriptSHA256,sha(bytes('scripts/vertical-v02/blender_slender_crossings.py')));
const manifest=read('assets/city/vertical-v02/slender-crossings/manifest.json');assert.equal(sha(bytes('assets/city/vertical-v02/slender-crossings/manifest.json')),a.manifestSHA256);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),results=[];
for(const model of a.exports){
 const raw=bytes(model.url);assert.equal(sha(raw),model.sha256);const doc=await io.readBinary(raw),actual=corners(doc),w=g.witnesses.find(w=>w.id===model.id),wraw=bytes(w.file);assert.equal(sha(wraw),w.sha256);
 const expected=JSON.parse(zlib.gunzipSync(wraw)).map(t=>({material:t.material,corners:t.corners.map(c=>({position:c.position,normal:c.normal,uv:[c.uvs[0][0],1-c.uvs[0][1]],
  attributes:{POSITION:c.position,NORMAL:c.normal,...Object.fromEntries(c.uvs.map((uv,i)=>['TEXCOORD_'+i,[uv[0],1-uv[1]]]))}}))}));
 const witnessComparison=compareRenderedCorners(actual,expected,['TANGENT']),materials=materialState(doc);
 bakeStaticTransforms(doc);await doc.transform(dedup({propertyTypes:[PropertyType.TEXTURE,PropertyType.ACCESSOR]}),join({keepNamed:false,cleanup:false}),prune({keepAttributes:true,keepLeaves:false}));
 const batchComparison=compareRenderedCorners(corners(doc),actual),sig=semantic(doc),packed=await io.writeBinary(doc),decoded=await io.readBinary(packed);assert.equal(semantic(decoded),sig);assert.equal(materialState(decoded),materials);
 const validation=await validator.validateBytes(packed,{uri:model.id+'.glb'});assert.equal(validation.issues.numErrors,0);assert.equal(validation.issues.numWarnings,0);
 const file=path.join(O,model.id+'.glb');fs.writeFileSync(file,packed);const chunk=manifest.chunks.find(c=>c.id===model.id);assert(chunk);Object.assign(chunk,{sourceRawURL:model.url,sourceRawSHA256:model.sha256,url:path.relative(R,file),sha256:sha(packed),bytes:packed.length});
 results.push({id:model.id,rawSHA256:model.sha256,shippingSHA256:chunk.sha256,shippingBytes:packed.length,witnessComparison,batchComparison,khronosErrors:0,khronosWarnings:0,primitives:decoded.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().length,0)});
}
assert.equal(results.length,8);manifest.status='SOURCE/BATCH CANDIDATE — native, real input, current world life, lighting coupling and final acceptance pending';
const manifestRaw=Buffer.from(JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(O,'manifest.json'),manifestRaw);const manifestSHA256=sha(manifestRaw);
const colliders=manifest.records.filter(r=>r.solid).map(r=>({id:r.id,owner:r.owner,box:r.box,solid:true,walkable:!!r.walkable}));assert.equal(colliders.length,10644);
fs.writeFileSync(path.join(O,'collisions.json'),JSON.stringify({sourceManifestSHA256:manifestSHA256,colliders},null,2)+'\n');
fs.writeFileSync(path.join(O,'structure_ownership.json'),JSON.stringify({sourceManifestSHA256:manifestSHA256,structures:manifest.records.map(r=>({id:r.id,owner:r.owner,collection:r.collection,operation:r.collisionOnly?'Explicit source-bound physical decomposition':'Source-rendered geometry, preserved or controlled flared bridge edit',nonDestructible:true}))},null,2)+'\n');
const rail=read('assets/city/vertical-v02/east-public-emissive/runtime/threadrail_surfaces.json');rail.sourceManifestSHA256=manifestSHA256;rail.physicalSurfaceColliders=colliders.map(({solid,walkable,...r})=>r);rail.physicalSurfaceGeometry=manifest.chunks.map(c=>({id:c.id,url:c.url,recordIDs:c.recordIDs}));
rail.status='Source physical metadata only; current real two-cartridge route acceptance pending';fs.writeFileSync(path.join(O,'threadrail_surfaces.json'),JSON.stringify(rail,null,2)+'\n');
const ambient=read('assets/city/vertical-v02/east-public-emissive/runtime/ambient_routes.json');ambient.parentAmbientSHA256=sha(bytes('assets/city/vertical-v02/east-public-emissive/runtime/ambient_routes.json'));ambient.worldManifestSHA256=manifestSHA256;ambient.placementPolicy='Unchanged routes on revised source bridges. Current full-native support and player/yield evidence still required.';
fs.writeFileSync(path.join(O,'ambient_routes.json'),JSON.stringify(ambient,null,2)+'\n');
const report={status:'PASS reopened source/raw/batched rendered attributes and Khronos validation; native/gameplay pending',masterSHA256:a.masterSHA256,manifestSHA256,
 sourceGateSHA256:sha(bytes('development/vertical-city-v02/V02_Slender_Crossings_Master_Validation.json')),scriptSHA256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),batchHelperSHA256:sha(bytes('scripts/vertical-v02/static_gltf_batch_v02.mjs')),results,
 records:manifest.records.length,collisions:colliders.length,reusedChunks:manifest.chunks.length-results.length,scope:'Original city is not duplicated. Floor/guard physical decomposition follows the actual source profile. Inherited room bake scene coupling, current input and visual acceptance remain open.'};
fs.writeFileSync(path.join(D,'V02_Slender_Crossings_Package.json'),JSON.stringify(report,null,2)+'\n');console.log(report.status,results.length,'chunks',colliders.length,'contacts');
