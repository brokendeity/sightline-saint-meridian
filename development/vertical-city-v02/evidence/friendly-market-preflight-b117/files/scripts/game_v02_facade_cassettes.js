/* Source-authored original-owner rainscreen surrounds. Decorative geometry;
 * existing glazing, contacts, original owner damage and gameplay stay intact. */
window.v02FacadeCassettes=(()=>{
 const state={ready:false,loading:false,error:null,owners:[],features:0,hidden:0,triangles:0,newDynamicLights:0,newCollisionRecords:0},owners=[];
 const hash=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('');
 const key=p=>Math.floor(p.x/4)+','+Math.floor(p.y/4)+','+Math.floor(p.z/4);
 function contains(b,p,e=.002){return p.x>=b.min[0]-e&&p.x<=b.max[0]+e&&p.y>=b.min[1]-e&&p.y<=b.max[1]+e&&p.z>=b.min[2]-e&&p.z<=b.max[2]+e;}
 async function build(){
  if(state.ready||state.loading||state.error||!window.verticalDiffuseLightingState?.().ready)return;
  state.loading=true;const prepared=[];
  try{
   const response=await fetch('assets/city/vertical-v02/facade-cassettes/runtime.json.gz');if(!response.ok)throw Error('Cassette manifest HTTP '+response.status);const c=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await response.arrayBuffer()))));if(c.schema!=='sm-v02-runtime-cassettes-1'||c.chunks.length!==3)throw Error('Unsupported source cassette manifest');
   for(const chunk of c.chunks){
    const owner=buildingColliders[chunk.sourceIndex];if(!owner||owner.mesh.userData.cityBuildingId!==chunk.cityBuildingId)throw Error('Cassette original owner mismatch');const r=await fetch(chunk.url);if(!r.ok)throw Error('Cassette source HTTP '+r.status);const zipped=new Uint8Array(await r.arrayBuffer());if(await hash(zipped)!==chunk.compressedSHA256)throw Error('Cassette archive identity');const bytes=fflate.gunzipSync(zipped);if(await hash(bytes)!==chunk.shippingSHA256)throw Error('Cassette decoded identity');const gltf=await new Promise((yes,no)=>new THREE.GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',yes,no)),root=gltf.scene;root.name='V02 source cassette surrounds / '+chunk.owner;root.updateMatrixWorld(true);
    const buckets=new Map(),features=chunk.features.map(f=>({...f,hidden:false,vertices:0}));for(let i=0;i<features.length;i++){const b=features[i].box;for(let x=Math.floor((b.min[0]-.002)/4);x<=Math.floor((b.max[0]+.002)/4);x++)for(let y=Math.floor((b.min[1]-.002)/4);y<=Math.floor((b.max[1]+.002)/4);y++)for(let z=Math.floor((b.min[2]-.002)/4);z<=Math.floor((b.max[2]+.002)/4);z++){const k=x+','+y+','+z;if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(i);}}
    const meshes=[];root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,byFeature=new Map();for(let i=0;i<a.count;i++){const p=o.localToWorld(new THREE.Vector3().fromBufferAttribute(a,i)),id=(buckets.get(key(p))||[]).find(j=>contains(features[j].box,p));if(id===undefined)throw Error('Cassette vertex outside source envelope');if(!byFeature.has(id))byFeature.set(id,[]);byFeature.get(id).push(i);features[id].vertices++;}o.castShadow=false;o.receiveShadow=true;o.material.envMap=owner.mesh.material.envMap;o.material.envMapIntensity=owner.mesh.material.envMapIntensity;meshes.push({o,a,byFeature});});
    if(features.some(f=>!f.vertices))throw Error('Cassette source feature has no geometry');prepared.push({id:chunk.owner,owner,root,features,meshes,lastDamage:owner.damageCount||0,triangles:chunk.triangles});
   }
   for(const p of prepared){scene.add(p.root);p.owner.mesh.attach(p.root);owners.push(p);state.features+=p.features.length;state.triangles+=p.triangles;}state.sourceMasterSHA256=c.sourceMasterSHA256;state.ready=true;state.loading=false;
   const original=verticalAppearance.present;verticalAppearance.present=function(){original();present();};
  }catch(e){for(const p of prepared)p.root.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose()});state.loading=false;state.error=String(e);console.error('V02 facade cassettes',e);}
 }
 function present(){
  if(!state.ready)return;
  for(const r of owners){if(r.owner.destroyed){r.root.visible=false;continue;}if((r.owner.damageCount||0)===r.lastDamage)continue;r.lastDamage=r.owner.damageCount||0;
   const supports=p=>r.owner.parts.some(part=>{const b=part.box;return p[0]>=b.min.x-.025&&p[0]<=b.max.x+.025&&p[1]>=b.min.y-.025&&p[1]<=b.max.y+.025&&p[2]>=b.min.z-.025&&p[2]<=b.max.z+.025;});
   r.features.forEach((f,id)=>{if(f.hidden||[f.sourcePoint,...f.sourceProbes.map(p=>p.point)].every(supports))return;f.hidden=true;state.hidden++;for(const m of r.meshes){const ids=m.byFeature.get(id);if(!ids?.length)continue;const p=new THREE.Vector3().fromBufferAttribute(m.a,ids[0]);for(const i of ids)m.a.setXYZ(i,p.x,p.y,p.z);m.a.needsUpdate=true;}});
  }
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);window.v02FacadeCassettesState=()=>JSON.parse(JSON.stringify({...state,owners:owners.map(r=>({id:r.id,parent:r.root.parent===r.owner.mesh,features:r.features.length,hidden:r.features.filter(f=>f.hidden).length,visible:r.root.visible&&r.owner.mesh.visible&&!r.owner.destroyed}))}));return{build,present,state:window.v02FacadeCassettesState};
})();
