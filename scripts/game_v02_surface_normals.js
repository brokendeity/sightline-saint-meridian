/* A two-sided source triangle may share a plane with its reversed decorative
 * backing. Triangle order must not put an incoming cartridge inside the solid.
 * Keep the exact hit and collision; orient the returned normal toward the ray. */
window.v02SurfaceNormals=(()=>{
 const original=verticalDistrict.cartridgeSurface;
 const state={requests:0,corrections:0,recent:[],policy:'Incoming-ray-facing normal on two-sided source surface hits; contact, owner, reach and clearance unchanged'};
 verticalDistrict.cartridgeSurface=function(ray,ownerId,far=120){
  const hit=original.call(this,ray,ownerId,far);state.requests++;
  if(!hit||hit.normal.dot(ray.direction)<=0)return hit;
  const normal=hit.normal.clone().negate();state.corrections++;
  state.recent.push({ownerId,contact:hit.contact.toArray(),sourceNormal:hit.normal.toArray(),normal:normal.toArray()});
  if(state.recent.length>16)state.recent.shift();
  // Preserve the lower-level cached query, which may be reused unchanged.
  return{...hit,normal};
 };
 window.v02SurfaceNormalsState=()=>JSON.parse(JSON.stringify(state));
 return{state:window.v02SurfaceNormalsState};
})();
