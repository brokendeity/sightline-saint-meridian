/* Decoded curve semantics only. This does not invent particle/event behavior. */
window.NativeSequenceTracks=(()=>{
 const cache=new WeakMap(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
 function sample(curve,time){
  let keys=cache.get(curve);if(!keys){keys=curve.keys.filter(k=>k[0]>=0&&[].concat(k[1]).every(Number.isFinite)).sort((a,b)=>a[0]-b[0]);cache.set(curve,keys);}
  if(!keys.length)return null;if(time<=keys[0][0])return [].concat(keys[0][1]);if(time>=keys[keys.length-1][0])return [].concat(keys[keys.length-1][1]);
  let lo=0,hi=keys.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(keys[mid][0]<=time)lo=mid;else hi=mid;}
  const a=[].concat(keys[lo][1]),b=[].concat(keys[hi][1]);
  // Visibility is a toggle; interpolating it creates premature appearances/disappearances.
  if(curve.path==='opacity'||curve.interpolation==='step')return a;
  const f=(time-keys[lo][0])/(keys[hi][0]-keys[lo][0]||1);
  if(curve.path==='rotation_quaternion'||curve.path==='rotation'){qa.fromArray(a).normalize();qb.fromArray(b).normalize();return qa.slerp(qb,f).toArray();}
  return a.map((x,i)=>x+(b[i]-x)*f);
 }
 function createLights(animation,root){
  const map=new Map(),list=[];for(const e of animation.entries){if(![5,6,8].includes(e.format)||map.has(e.name))continue;if(list.length>=8)break;
   const light=e.format===5?new THREE.DirectionalLight(0xffffff,0):e.format===6?new THREE.PointLight(0xffffff,0,10,2):new THREE.AmbientLight(0xffffff,0);
   light.name=e.name;light.userData.sourceEnergy=0;root.add(light);if(light.isDirectionalLight){root.add(light.target);light.target.position.set(0,0,-1);}map.set(e.name,light);list.push(light);
  }return {map,list};
 }
 function applyLight(light,path,value){if(path==='color')light.color.setRGB(...value.slice(0,3).map(v=>THREE.MathUtils.clamp(v,0,1)));if(path==='energy')light.userData.sourceEnergy=THREE.MathUtils.clamp(value[0],0,8);if(path==='location')light.position.fromArray(value);if(path==='cutoff'&&light.isPointLight)light.distance=Math.max(0,value[0])*.01;if(path==='rotation'&&light.isDirectionalLight){const q=new THREE.Quaternion(-value[0],-value[1],-value[2],value[3]).normalize();light.position.set(0,0,1).applyQuaternion(q);light.target.position.set(0,0,0);}}
 function applyMaterial(mat,path,value){if(path==='Alpha'){mat.opacity=THREE.MathUtils.clamp(value[0],0,1);mat.transparent=true;mat.depthWrite=mat.opacity>=1;}if(!mat.map)return;if(path==='U0_LocX')mat.map.offset.x=value[0];if(path==='V0_LocY')mat.map.offset.y=value[0];if(path==='U0_ScaleX')mat.map.repeat.x=value[0];if(path==='V0_ScaleY')mat.map.repeat.y=value[0];}
 function resetMaterial(mat){mat.opacity=1;mat.transparent=true;mat.depthWrite=true;if(mat.map){mat.map.offset.set(0,0);mat.map.repeat.set(1,1);}}
 return {sample,createLights,applyLight,applyMaterial,resetMaterial};
})();
window.NativeSequenceTracks.evaluatePost=(track,time,frameSize)=>{
 if(!(frameSize>0)||track.interpolation!=='FCURVE_INTERPOLATION_LINEAR')return null;
 track._curves=track._curves||new Map();let curve=track._curves.get(frameSize);if(!curve){curve={path:'post',keys:track.keys.map(k=>[k[0]*frameSize/3000,k.slice(1)])};track._curves.set(frameSize,curve);}return NativeSequenceTracks.sample(curve,time);
};
