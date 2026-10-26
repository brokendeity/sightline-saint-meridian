/* Read actual packed POSITION vertices, scene transforms and indices. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),THREE=require('../vendor/three-r128.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),file='assets/city/vertical-v02/world-life/air_assets.json',m=JSON.parse(fs.readFileSync(path.join(R,file))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const validator=require(path.join(R,'output/local-scratch/train-validation/node_modules/gltf-validator'));
(async()=>{const results=[];assert.equal(sha(m.master),m.masterSHA256);assert.equal(sha('scripts/vertical-v02/blender_air_vehicles.py'),m.authoringSHA256);
for(const model of m.models){
 const bytes=fs.readFileSync(path.join(R,model.url));assert.equal(sha(model.url),model.sha256);assert.equal(bytes.length,model.bytes);assert.equal(bytes.toString('utf8',0,4),'glTF');
 const jsonLength=bytes.readUInt32LE(12),g=JSON.parse(bytes.toString('utf8',20,20+jsonLength)),binaryOffset=20+jsonLength+8,bounds=new THREE.Box3();let vertices=0,triangles=0,primitives=0;
 function visit(id,parent){const n=g.nodes[id],matrix=new THREE.Matrix4();if(n.matrix)matrix.fromArray(n.matrix);else matrix.compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1])));matrix.premultiply(parent);
  if(n.mesh!==undefined)for(const p of g.meshes[n.mesh].primitives){assert(p.mode===undefined||p.mode===4,'Only triangle geometry admitted');const a=g.accessors[p.attributes.POSITION],v=g.bufferViews[a.bufferView];assert.equal(a.componentType,5126);assert.equal(a.type,'VEC3');assert(!a.sparse);const start=binaryOffset+(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||12;
   for(let i=0;i<a.count;i++)bounds.expandByPoint(new THREE.Vector3(...[0,1,2].map(k=>bytes.readFloatLE(start+i*stride+k*4))).applyMatrix4(matrix));vertices+=a.count;primitives++;triangles+=(p.indices===undefined?a.count:g.accessors[p.indices].count)/3;
  }for(const child of n.children||[])visit(child,matrix);
 }
 for(const id of g.scenes[g.scene||0].nodes)visit(id,new THREE.Matrix4());assert(vertices>0);assert.equal(triangles,model.triangles);
 const err=Math.max(bounds.min.distanceTo(new THREE.Vector3(...model.localBounds.min)),bounds.max.distanceTo(new THREE.Vector3(...model.localBounds.max)));assert(err<.0001,'Actual vertices disagree with authored bounds '+model.id);
 const envelope=new THREE.Box3(new THREE.Vector3(...m.declaredFleetEnvelope.min),new THREE.Vector3(...m.declaredFleetEnvelope.max));assert(envelope.containsBox(bounds),'Actual geometry exceeds route envelope');
 const validation=await validator.validateBytes(new Uint8Array(bytes),{uri:model.url});assert.equal(validation.issues.numErrors,0);assert.equal(validation.issues.numWarnings,0);
 results.push({id:model.id,sha256:sha(model.url),bytes:bytes.length,vertices,triangles,primitives,actualBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},maximumCornerErrorMetres:err,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings});
}
const report={status:'PASS actual fleet vertices, authored bounds and Khronos validation',scope:'All exported mesh vertices and scene transforms, not native appearance or continuous route collision certification.',manifestSHA256:sha(file),masterSHA256:sha(m.master),validatorSHA256:sha('scripts/vertical-v02/validate_air_assets.cjs'),results};fs.writeFileSync(path.join(D,'V02_Air_Assets_Validation.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(error=>{console.error(error);process.exitCode=1});
