/* Retarget a clip between two skeletons that share Mixamo bone names but not bone orientations or units
 * (for example Backspool's Mixamo FBX clips onto a Tripo "Mixamo preset" export such as Loadout).
 * Both skeletons must be in their rest pose, standing in a similar T/A pose and facing the same way in
 * world space when this runs. For every bone the clip's world-space rotation change from the source rest
 * pose is applied to the target rest pose, then converted back to the target bone's local space.
 * Hips translation is carried over as a world-space offset scaled by hip height; with inPlace the
 * horizontal part is dropped so a movement owner can move the character instead. */
(()=>{
 'use strict';
 const Q=THREE.Quaternion,V=THREE.Vector3;
 function skeleton(root){
  // First bone of each name, parents before children, with the fixed world rotation above each root bone.
  const map=new Map();root.traverse(o=>{if(o.isBone&&!map.has(o.name))map.set(o.name,o);});
  const depth=b=>{let d=0;for(let p=b.parent;p;p=p.parent)d++;return d;};
  const order=[...map.values()].sort((a,b)=>depth(a)-depth(b));
  const boneParent=b=>b.parent&&b.parent.isBone&&map.get(b.parent.name)===b.parent?b.parent.name:null;
  const fixedParentW=new Map();for(const b of order)if(!boneParent(b))fixedParentW.set(b.name,b.parent?b.parent.getWorldQuaternion(new Q()):new Q());
  const restW=new Map(order.map(b=>[b.name,b.getWorldQuaternion(new Q())]));
  return{map,order,boneParent,fixedParentW,restW};
 }
 function retargetClip(clip,sourceRoot,targetRoot,opts={}){
  const hipsName=opts.hips||'mixamorigHips';
  sourceRoot.updateMatrixWorld(true);targetRoot.updateMatrixWorld(true);
  const S=skeleton(sourceRoot),T=skeleton(targetRoot);
  const rot=new Map();for(const t of clip.tracks){const m=t.name.match(/^(.+)\.quaternion$/);if(m&&S.map.has(m[1]))rot.set(m[1],t.createInterpolant());}
  const posTrack=clip.tracks.find(t=>t.name===hipsName+'.position'),pos=posTrack&&posTrack.createInterpolant();
  const times=[...new Set(clip.tracks.flatMap(t=>Array.from(t.times)))].sort((a,b)=>a-b);
  const sh=S.map.get(hipsName),th=T.map.get(hipsName);
  const shRest=sh.getWorldPosition(new V()),thRest=th.getWorldPosition(new V());
  const shBase=sh.parent?sh.parent.getWorldPosition(new V()):new V(),thBase=th.parent?th.parent.getWorldPosition(new V()):new V();
  const ratio=(thRest.y-thBase.y)/Math.max(1e-6,shRest.y-shBase.y);
  const shParentW=sh.parent?sh.parent.matrixWorld.clone():new THREE.Matrix4();
  const thParentInv=th.parent?th.parent.matrixWorld.clone().invert():new THREE.Matrix4();
  const shared=T.order.filter(b=>S.map.has(b.name));
  const out=new Map(shared.map(b=>[b.name,[]])),hipsOut=[];
  const sW=new Map(),tW=new Map(),inv=new Q();
  for(const time of times){
   for(const b of S.order){
    const n=b.name,local=rot.has(n)?new Q().fromArray(rot.get(n).evaluate(time)):b.quaternion.clone();
    const p=S.boneParent(b);sW.set(n,(p?sW.get(p):S.fixedParentW.get(n)).clone().multiply(local));
   }
   for(const b of shared){
    const n=b.name;
    const w=sW.get(n).clone().multiply(inv.copy(S.restW.get(n)).invert()).multiply(T.restW.get(n));
    tW.set(n,w);
    const p=T.boneParent(b);let pw=p?tW.get(p):T.fixedParentW.get(n);
    if(!pw)pw=T.restW.get(p);                       // a target-only parent bone keeps its rest rotation
    out.get(n).push(...pw.clone().invert().multiply(w).toArray());
   }
   if(pos){
    const off=new V().fromArray(pos.evaluate(time)).applyMatrix4(shParentW).sub(shRest).multiplyScalar(ratio);
    if(opts.inPlace){off.x=0;off.z=0;}
    hipsOut.push(...thRest.clone().add(off).applyMatrix4(thParentInv).toArray());
   }
  }
  const tracks=[...out].map(([n,v])=>new THREE.QuaternionKeyframeTrack(n+'.quaternion',times,v));
  if(pos)tracks.push(new THREE.VectorKeyframeTrack(hipsName+'.position',times,hipsOut));
  return new THREE.AnimationClip(opts.name||clip.name,clip.duration,tracks);
 }
 window.MixamoRetarget={retargetClip};
})();
