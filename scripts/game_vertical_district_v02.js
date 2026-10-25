/* Blender-authored V02 contact candidate. Original city remains in its own registries. */
const verticalDistrict=(()=>{
 const root=new THREE.Group();root.name='Saint Meridian V02 Blender graybox';
 const state={ready:false,error:null,phase:'graybox-contact',pilot:false,records:0,chunks:0,collisions:0,coordinateFailures:[],stepPasses:0},collisions=[],buckets=new Map(),M=new Map();let metadata;
 const CELL=12,V=a=>new THREE.Vector3(...a);
 const key=(x,y,z)=>x+','+y+','+z;
 function cells(box,fn){for(let x=Math.floor(box.min.x/CELL);x<=Math.floor(box.max.x/CELL);x++)for(let y=Math.floor(box.min.y/CELL);y<=Math.floor(box.max.y/CELL);y++)for(let z=Math.floor(box.min.z/CELL);z<=Math.floor(box.max.z/CELL);z++)fn(key(x,y,z));}
 function query(start=null,end=start){if(!start)return collisions;const area=new THREE.Box3(start.clone().min(end),start.clone().max(end)).expandByScalar(2),found=new Set();cells(area,k=>{for(const c of buckets.get(k)||[])if(c.box.intersectsBox(area))found.add(c)});return [...found];}
 function stepRiserPass(position,c){if(!state.ready||!s.onGround||(!c.v02Stair&&!c.v02Landing)||s.vel.y>0)return false;const b=c.box,padding=playerBodyRadius()+.07+Math.min(.5,Math.hypot(s.vel.x,s.vel.z)/60);return b.max.y<=position.y-.42+(c.v02Stair?.55:.201)+1e-6&&b.max.y>=position.y-.42-.22&&position.x>b.min.x-padding&&position.x<b.max.x+padding&&position.z>b.min.z-padding&&position.z<b.max.z+padding;}
 // NPC positions use sole height, unlike the hero's +.42m origin. The shared
 // ground solver still rejects centre support changes above .2m. Only the
 // capsule's leading/trailing overlap with tagged stair risers is excluded
 // from its horizontal wall sweep; floors, headroom and other walls stay solid.
 function actorRiserPass(from,to,c,radius){if(!state.ready||(!c.v02Stair&&!c.v02Landing)||Math.abs(to.y-from.y)>.201)return false;const b=c.box,feet=Math.max(from.y,to.y),allowance=c.v02Stair?.201+Math.min(.7,radius)*.5+.08:.201;return b.max.y<=feet+allowance+1e-6&&b.max.y>=Math.min(from.y,to.y)-.22;}
 function surfaceFeetAt(x,z,currentY){if(!state.ready)return-Infinity;let h=-Infinity;for(const c of query(new THREE.Vector3(x,currentY-.65,z),new THREE.Vector3(x,currentY+.22,z))){if(!c.v02Walkable)continue;const b=c.box,inset=-.00001,y=b.max.y+.42;if(y>currentY+.201+1e-6)continue;if(x>=b.min.x+inset&&x<=b.max.x-inset&&z>=b.min.z+inset&&z<=b.max.z-inset)h=Math.max(h,y);}return h;}
 async function build(){if(state.ready)return;state.pilot=new URLSearchParams(location.search).has('v02pilot');const folder='assets/city/vertical-v02/'+(state.pilot?'pilot':'graybox');try{
  const response=await fetch(folder+'/manifest.json');if(!response.ok)throw Error('V02 manifest HTTP '+response.status);metadata=await response.json();
  const loaded=await Promise.all(metadata.chunks.map(async chunk=>{const gltf=await new Promise((resolve,reject)=>new THREE.GLTFLoader().load(chunk.url,resolve,undefined,reject));const meshRoot=gltf.scene;meshRoot.name=chunk.id;meshRoot.updateMatrixWorld(true);
   const actual=new THREE.Box3().setFromObject(meshRoot),records=metadata.records.filter(r=>chunk.recordIDs.includes(r.id));const expected=new THREE.Box3();records.forEach(r=>expected.union(new THREE.Box3(V(r.box.min),V(r.box.max))));
   if(actual.min.distanceTo(expected.min)>.003||actual.max.distanceTo(expected.max)>.003)state.coordinateFailures.push({chunk:chunk.id,actual:{min:actual.min.toArray(),max:actual.max.toArray()},expected:{min:expected.min.toArray(),max:expected.max.toArray()}});
   meshRoot.traverse(o=>{if(o.isMesh){const source=o.material;if(!M.has(source.name))M.set(source.name,source);else if(M.get(source.name)!==source){o.material=M.get(source.name);source.dispose();}o.castShadow=o.receiveShadow=true;o.userData.v02Chunk=chunk.id;}});return meshRoot;}));
  if(state.coordinateFailures.length)throw Error('V02 Blender/game coordinate mismatch');
  for(const obj of loaded){root.add(obj);obj.traverse(o=>{if(o.isMesh){walkables.push(o);cameraObstacles.push(o);rayTargets.push(o)}});}scene.add(root);
  for(const r of metadata.records){if(!r.solid)continue;const box=new THREE.Box3(V(r.box.min),V(r.box.max)),owner={id:r.owner,type:'v02-structure',box,nonDestructible:true,damageCount:0,destroyed:false};const c={id:r.id,owner,box,type:'v02-structure',nonDestructible:true,v02Stair:!!r.stair,v02Landing:!!r.walkable&&!r.stair,v02Walkable:!!r.walkable,flight:r.flight};owner.parts=[c];collisions.push(c);cells(box,k=>{if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(c)});}
  state.ready=true;state.records=metadata.records.length;state.chunks=loaded.length;state.collisions=collisions.length;
  const start=document.createElement('button');start.id='v02Start';start.textContent=state.pilot?'Test public stairs':'Enter V02 district';start.style.cssText='margin:12px;padding:12px 18px;background:#143744;border:1px solid #60d8e4;color:#e4fbff;border-radius:6px;cursor:pointer';start.disabled=true;const ready=setInterval(()=>{if(gameReady&&!window.characterState?.().busy){clearInterval(ready);start.disabled=false;}},100);start.onclick=()=>{if(start.disabled)return;startGame(false);if(!gameActive)return;resetPlayer();const p=state.pilot?metadata.paths['V2-VT-A'].points[0]:[55,0,210];s.pos.set(p[0],p[1]+.42,p[2]);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=Math.PI;cam.pitch=cam.targetPitch=-.08;};menu.append(start);

 }catch(e){state.error=String(e);console.error('V02 graybox',e);}}
 const api={build,encounter:id=>metadata?.encounters?.find(e=>e.id===id),colliders:query,stepRiserPass,actorRiserPass,surfaceFeetAt,state:()=>JSON.parse(JSON.stringify({...state,paths:metadata?.paths||{},status:'experimental: not full V02 acceptance'}))};window.verticalDistrict=api;window.verticalDistrictState=api.state;return api;
})();
