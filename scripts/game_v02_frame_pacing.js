/* V02 frame pacing: removes profiled frame-time spikes without changing results.
 * 1. worldBox(mesh): the ray broadphase's world-space bounds for meshes without collision bounds. The old path re-ran
 *    updateMatrixWorld, cloned and transformed the bounding box for every mesh on every query. The box is now reused
 *    while the mesh's local transform, matrices, parent matrix and geometry bounds are bit-identical to when it was
 *    computed; any difference (the train, carved geometry, re-parenting) takes the original path.
 * 2. Camera-ray partitions (v02_exact_camera_rays.js) were built lazily on the first ray toward each large mesh,
 *    10-45 ms each in play. They are now built while the menu is up, then during idle time within the idle deadline.
 *    Partitions are the same ones the lazy path builds, so hits are unchanged. */
(()=>{
 'use strict';
 const SNAP=10+16+16+16+6,cache=new WeakMap(),warmed=new WeakSet(),stats={boxesComputed:0,boxesReused:0,warmed:0,warmMs:0,warmMenuMs:0,warmIdleMs:0,pending:0,complete:false};
 function write(c,mesh){const a=c.snap,p=mesh.position,q=mesh.quaternion,s=mesh.scale,bb=mesh.geometry.boundingBox;let i=0;
  a[i++]=p.x;a[i++]=p.y;a[i++]=p.z;a[i++]=q.x;a[i++]=q.y;a[i++]=q.z;a[i++]=q.w;a[i++]=s.x;a[i++]=s.y;a[i++]=s.z;
  for(const m of [mesh.matrix,mesh.matrixWorld,mesh.parent.matrixWorld])for(let k=0;k<16;k++)a[i++]=m.elements[k];
  a[i++]=bb.min.x;a[i++]=bb.min.y;a[i++]=bb.min.z;a[i++]=bb.max.x;a[i++]=bb.max.y;a[i++]=bb.max.z;}
 function unchanged(c,mesh){const a=c.snap,p=mesh.position,q=mesh.quaternion,s=mesh.scale,bb=mesh.geometry.boundingBox;let i=0;
  if(a[i++]!==p.x||a[i++]!==p.y||a[i++]!==p.z||a[i++]!==q.x||a[i++]!==q.y||a[i++]!==q.z||a[i++]!==q.w||a[i++]!==s.x||a[i++]!==s.y||a[i++]!==s.z)return false;
  for(const m of [mesh.matrix,mesh.matrixWorld,mesh.parent.matrixWorld])for(let k=0;k<16;k++)if(a[i++]!==m.elements[k])return false;
  return a[i++]===bb.min.x&&a[i++]===bb.min.y&&a[i++]===bb.min.z&&a[i++]===bb.max.x&&a[i++]===bb.max.y&&a[i++]===bb.max.z;}
 function worldBox(mesh){
  const g=mesh.geometry,c=cache.get(mesh),simple=mesh.parent&&!mesh.children.length&&mesh.matrixAutoUpdate;
  if(c&&simple&&!mesh.matrixWorldNeedsUpdate&&c.parent===mesh.parent&&c.bb===g.boundingBox&&g.boundingBox&&unchanged(c,mesh)){stats.boxesReused++;return c.box;}
  mesh.updateMatrixWorld();if(!g.boundingBox)g.computeBoundingBox();const box=g.boundingBox.clone().applyMatrix4(mesh.matrixWorld);stats.boxesComputed++;
  if(simple){const entry=c||{snap:new Float64Array(SNAP)};entry.box=box;entry.parent=mesh.parent;entry.bb=g.boundingBox;write(entry,mesh);if(!c)cache.set(mesh,entry);}
  return box;}
 // ---- Camera-ray partition warm-up.
 const ray=new THREE.Raycaster(new THREE.Vector3(0,-1e6,0),new THREE.Vector3(0,-1,0),0,1e-6);let queue=[],lastScan=0,scanned=0;
 const triangles=m=>{const g=m.geometry;return g?.isBufferGeometry?(g.index?.count||g.attributes.position?.count||0)/3:0};
 function scan(){let list=[];try{list=[...new Set([...(typeof cameraObstacles!=='undefined'?cameraObstacles:[]),...(typeof walkables!=='undefined'?walkables:[])])];}catch(e){return;}
  if(list.length===scanned)return;scanned=list.length;queue=list.filter(m=>m.isMesh&&m.userData?.v02Chunk&&!warmed.has(m.geometry)&&triangles(m)>=512).sort((a,b)=>triangles(b)-triangles(a));stats.pending=queue.length;stats.complete=!queue.length;}
 function warmOne(){const m=queue.shift();stats.pending=queue.length;if(!m||warmed.has(m.geometry))return 0;const t=performance.now();window.v02CameraRays.intersect(ray,[m]);warmed.add(m.geometry);stats.warmed++;const ms=performance.now()-t;stats.warmMs+=ms;if(!queue.length)stats.complete=true;return ms;}
 function frame(now){requestAnimationFrame(frame);if(!window.v02CameraRays||typeof gameReady==='undefined'||!gameReady)return;if(now-lastScan>1000){lastScan=now;scan();}
  if(typeof gameActive!=='undefined'&&!gameActive&&queue.length){const end=performance.now()+12;while(queue.length&&performance.now()<end)stats.warmMenuMs+=warmOne();}}
 function idle(deadline){schedule();if(typeof gameActive==='undefined'||!gameActive||!queue.length||!window.v02CameraRays)return;
  // Spend idle time only on a partition expected to fit (about 1.1 us per triangle measured on the V02 meshes).
  while(queue.length&&deadline.timeRemaining()>triangles(queue[0])*.0011+1)stats.warmIdleMs+=warmOne();}
 function schedule(){if(window.requestIdleCallback)requestIdleCallback(idle,{timeout:1000});}
 requestAnimationFrame(frame);schedule();
 window.v02FramePacing={worldBox,state:()=>({...stats,scope:'Exact reuse of ray broadphase bounds; camera-ray partitions built on the menu and in idle time'})};
})();
