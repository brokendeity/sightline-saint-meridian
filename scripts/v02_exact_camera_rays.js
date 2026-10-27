/* Exact camera-only spatial partition for immutable V02 buffer meshes.
 * Leaves delegate triangle/side/UV/near/far tests to this build's native Three
 * Mesh.raycast. Original meshes, attributes, indices and render graph are untouched.
 * Mutable original buildings and any unsupported mesh use the native path. */
(()=>{
 'use strict';
 const cache=new WeakMap(),watched=new WeakSet(),native=THREE.Mesh.prototype.raycast,stats={builds:0,invalidations:0,queries:0,acceleratedMeshes:0,nativeMeshes:0,leafTests:0,indexBytes:0,buildMs:0};
 const inverse=new THREE.Matrix4(),localRay=new THREE.Ray(),vertex=new THREE.Vector3();
 function eligible(o){const g=o.geometry;return o.isMesh&&!o.isSkinnedMesh&&!o.isInstancedMesh&&o.userData.v02Chunk&&o.raycast===native&&g?.isBufferGeometry&&g.attributes.position?.itemSize===3&&!Array.isArray(o.material)&&!g.morphAttributes.position?.length&&g.drawRange.start===0&&g.drawRange.count===Infinity&&(g.index?.count||g.attributes.position.count)>=1536;}
 function signature(g){const p=g.attributes.position,i=g.index;return{p,pv:p.version,pa:p.array,pc:p.count,i,iv:i?.version,ia:i?.array,ic:i?.count};}
 function same(a,b){return Object.keys(a).every(k=>a[k]===b[k]);}
 function release(item){for(const leaf of item.leaves)leaf.geometry.dispose();stats.indexBytes-=item.bytes;}
 function build(g,sig){
  const start=performance.now(),p=g.attributes.position,index=g.index,triangles=(index?.count||p.count)/3;
  if(!Number.isInteger(triangles))return null;
  const bounds=new Float64Array(triangles*6),centres=new Float64Array(triangles*3),ids=Array.from({length:triangles},(_,i)=>i),leaves=[];let bytes=0;
  for(let f=0;f<triangles;f++){
   const at=f*6;bounds[at]=bounds[at+1]=bounds[at+2]=Infinity;bounds[at+3]=bounds[at+4]=bounds[at+5]=-Infinity;
   for(let k=0;k<3;k++){vertex.fromBufferAttribute(p,index?index.getX(f*3+k):f*3+k);for(let axis=0;axis<3;axis++){const v=vertex.getComponent(axis);bounds[at+axis]=Math.min(bounds[at+axis],v);bounds[at+3+axis]=Math.max(bounds[at+3+axis],v);}}
   for(let axis=0;axis<3;axis++)centres[f*3+axis]=(bounds[at+axis]+bounds[at+3+axis])*.5;
  }
  function node(faces){
   const box=new THREE.Box3();for(const f of faces){const at=f*6;box.min.x=Math.min(box.min.x,bounds[at]);box.min.y=Math.min(box.min.y,bounds[at+1]);box.min.z=Math.min(box.min.z,bounds[at+2]);box.max.x=Math.max(box.max.x,bounds[at+3]);box.max.y=Math.max(box.max.y,bounds[at+4]);box.max.z=Math.max(box.max.z,bounds[at+5]);}box.expandByScalar(.000001);
   if(faces.length<=96){
    const sorted=faces.sort((a,b)=>a-b),indices=new Uint32Array(sorted.length*3);for(let f=0;f<sorted.length;f++)for(let k=0;k<3;k++)indices[f*3+k]=index?index.getX(sorted[f]*3+k):sorted[f]*3+k;
    const geometry=new THREE.BufferGeometry();for(const[name,attribute]of Object.entries(g.attributes))geometry.setAttribute(name,attribute);geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.boundingBox=box;geometry.boundingSphere=box.getBoundingSphere(new THREE.Sphere());
    const proxy=new THREE.Mesh(geometry),leaf={box,geometry,proxy,faces:Uint32Array.from(sorted)};leaves.push(leaf);bytes+=indices.byteLength+leaf.faces.byteLength;return leaf;
   }
   const size=box.getSize(new THREE.Vector3()),axis=size.x>=size.y&&size.x>=size.z?0:size.y>=size.z?1:2;faces.sort((a,b)=>centres[a*3+axis]-centres[b*3+axis]||a-b);const mid=Math.floor(faces.length/2);return{box,left:node(faces.slice(0,mid)),right:node(faces.slice(mid))};
  }
  const tree=node(ids);stats.builds++;stats.indexBytes+=bytes;stats.buildMs+=performance.now()-start;return{signature:sig,tree,leaves,bytes};
 }
 function meshHits(raycaster,o,out){
  if(!eligible(o)){stats.nativeMeshes++;o.raycast(raycaster,out);return;}
  const sig=signature(o.geometry);let item=cache.get(o.geometry);if(item&&!same(item.signature,sig)){release(item);cache.delete(o.geometry);stats.invalidations++;item=null;}
  if(!item){item=build(o.geometry,sig);if(!item){o.raycast(raycaster,out);return;}cache.set(o.geometry,item);if(!watched.has(o.geometry)){const geometry=o.geometry;watched.add(geometry);geometry.addEventListener('dispose',()=>{const old=cache.get(geometry);if(old){release(old);cache.delete(geometry);}});}}
  stats.acceleratedMeshes++;inverse.copy(o.matrixWorld).invert();localRay.copy(raycaster.ray).applyMatrix4(inverse);const hits=[];
  function visit(n){if(!localRay.intersectsBox(n.box))return;if(n.left){visit(n.left);visit(n.right);return;}stats.leafTests++;const proxy=n.proxy;proxy.material=o.material;proxy.matrixWorld.copy(o.matrixWorld);const found=[];native.call(proxy,raycaster,found);for(const hit of found){hit.object=o;hit.faceIndex=n.faces[hit.faceIndex];hits.push(hit);}}
  visit(item.tree);hits.sort((a,b)=>a.faceIndex-b.faceIndex);out.push(...hits);
 }
 function intersect(raycaster,objects){stats.queries++;const out=[];for(const o of objects){if(!o.layers.test(raycaster.layers))continue;meshHits(raycaster,o,out);}out.sort((a,b)=>a.distance-b.distance);return out;}
 window.v02CameraRays={intersect,state:()=>({...stats,scope:'Exact static V02 camera triangles; native fallback for original and unsupported meshes'})};
})();
