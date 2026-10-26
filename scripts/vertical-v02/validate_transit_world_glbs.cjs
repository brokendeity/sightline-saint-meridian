/* Reject empty selected exports and compare actual glTF node/accessor bounds
 * with the full per-chunk record union before starting the native game. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),THREE=require('../vendor/three-r128.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),file=path.join(R,'assets/city/vertical-v02/transit-world/manifest.json'),m=JSON.parse(fs.readFileSync(file)),by=new Map(m.records.map(r=>[r.id,r]));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),validator=require(path.join(R,'output/local-scratch/train-validation/node_modules/gltf-validator'));
(async()=>{const results=[];
for(const chunk of m.chunks){
 const bytes=fs.readFileSync(path.join(R,chunk.url));assert.equal(sha(bytes),chunk.sha256);const g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert(g.meshes?.length&&g.accessors?.length,'Empty GLB '+chunk.id);
 const bounds=new THREE.Box3();let positionVertices=0;
 function visit(id,parent){const n=g.nodes[id],matrix=new THREE.Matrix4();if(n.matrix)matrix.fromArray(n.matrix);else matrix.compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1])));matrix.premultiply(parent);
  if(n.mesh!==undefined)for(const primitive of g.meshes[n.mesh].primitives){const a=g.accessors[primitive.attributes.POSITION];assert(a.count>0&&a.min&&a.max);positionVertices+=a.count;bounds.union(new THREE.Box3(new THREE.Vector3(...a.min),new THREE.Vector3(...a.max)).applyMatrix4(matrix));}
  for(const child of n.children||[])visit(child,matrix);
 }
 for(const id of g.scenes[g.scene||0].nodes)visit(id,new THREE.Matrix4());assert(positionVertices>0);
 const expected=new THREE.Box3();for(const id of chunk.recordIDs){const b=by.get(id).box;expected.union(new THREE.Box3(new THREE.Vector3(...b.min),new THREE.Vector3(...b.max)));}
 const error=Math.max(bounds.min.distanceTo(expected.min),bounds.max.distanceTo(expected.max));assert(error<.003,'Exported chunk bounds '+chunk.id+' '+error);
 const validation=await validator.validateBytes(new Uint8Array(bytes),{uri:chunk.url});results.push({id:chunk.id,file:chunk.url,sha256:sha(bytes),bytes:bytes.length,vertices:positionVertices,maximumCornerErrorMetres:error,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings,messages:validation.issues.messages});
}
const report={status:results.every(r=>!r.errors&&!r.warnings)?'PASS nonempty transit world exports and Khronos validation':'FAIL transit world GLBs',manifestSHA256:sha(fs.readFileSync(file)),scope:'Actual glTF scene/accessor bounds and Khronos validation, not native gameplay or source-authoring acceptance.',results};fs.writeFileSync(path.join(D,'V02_Transit_World_GLB_Validation.json'),JSON.stringify(report,null,2)+'\n');assert(report.status.startsWith('PASS'));console.log(report.status,results.length,'files');
})().catch(error=>{console.error(error);process.exitCode=1});
