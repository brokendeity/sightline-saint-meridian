/* Separate source-authored material study. Keep source geometry/UVs/emission,
 * other source palettes, lights and gameplay unchanged. No final art claim. */
window.v02PaintedCladding=(()=>{
 const state={ready:false,loading:false,error:null,geometryClones:0,vertices:0,owners:[],newDynamicLights:0};
 const key=v=>v.map(x=>x.toFixed(5)).join('/');
 async function build(){
  if(state.ready||state.loading||state.error||!window.verticalDiffuseLightingState?.().ready)return;
  state.loading=true;
  const clones=new Map(),pending=[];
  try{
   const response=await fetch('assets/city/vertical-v02/painted-cladding-study/materials.json');if(!response.ok)throw Error('Painted cladding source HTTP '+response.status);const c=await response.json();
   if(c.schema!=='sm-v02-painted-cladding-study-1'||!c.masterSHA256)throw Error('Missing source material study identity');
   const groups=new Map();for(const change of c.changes){if(change.kind!=='midnight cladding'||!Number.isFinite(change.new.metalness)||!Number.isFinite(change.new.roughness))throw Error('Unexpected painted material change');const list=groups.get(change.sourceIndex)||[];list.push(change);groups.set(change.sourceIndex,list);}
   if(groups.size!==3)throw Error('Expected three retained source owners');
   for(const [index,changes]of groups){
    const owner=buildingColliders[index];if(!owner||owner.mesh.userData.cityBuildingId!==index)throw Error('Paint source owner mismatch');
    const lookup=new Map(changes.map(c=>[key([...c.color,...c.emission]),c]));
    for(const mesh of [owner.mesh,owner.lodMesh]){
     const source=mesh.geometry;let geometry=clones.get(source);
     if(!geometry){
      const colours=source.attributes.color,emissions=source.attributes.cityEmission,reflectance=source.attributes.cityReflectance;
      if(!colours||!emissions||!reflectance||reflectance.count!==colours.count)throw Error('Source PBR attributes missing');
      geometry=source.clone();const values=new Float32Array(reflectance.array);let changed=0;
      for(let i=0;i<colours.count;i++){
       const c=lookup.get(key([colours.getX(i),colours.getY(i),colours.getZ(i),emissions.getX(i),emissions.getY(i),emissions.getZ(i)]));if(!c)continue;
       if(Math.abs(values[i*2]-c.old.metalness)>1e-6||Math.abs(values[i*2+1]-c.old.roughness)>1e-6)throw Error('Source material parameter mismatch');
       values[i*2]=c.new.metalness;values[i*2+1]=c.new.roughness;changed++;
      }
      if(!changed)throw Error('No midnight source vertices matched');geometry.setAttribute('cityReflectance',new THREE.Float32BufferAttribute(values,2));clones.set(source,geometry);state.vertices+=changed;
     }
     pending.push({mesh,geometry});
    }
    state.owners.push({sourceIndex:index,cityBuildingId:owner.mesh.userData.cityBuildingId,sourceMaterials:changes.map(c=>c.material)});
   }
   // No object changes until every source identity/palette/parameter passes.
   for(const {mesh,geometry}of pending)mesh.geometry=geometry;
   state.geometryClones=clones.size;state.sourceMasterSHA256=c.masterSHA256;state.ready=true;state.loading=false;
  }catch(e){for(const g of clones.values())g.dispose();state.loading=false;state.error=String(e);console.error('V02 painted cladding study',e);}
 }
 const timer=setInterval(()=>{if(state.ready||state.error)clearInterval(timer);else build();},100);
 window.v02PaintedCladdingState=()=>JSON.parse(JSON.stringify(state));return{build,state:window.v02PaintedCladdingState};
})();
