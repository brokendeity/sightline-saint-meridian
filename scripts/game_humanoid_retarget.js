/* Retarget a clip between two humanoid skeletons that differ in bone names, bone orientations, units and rest pose
 * (for example the Runner Action pack's UE-style mannequin onto Loadout's Tripo "Mixamo preset" skeleton).
 * Both skeletons must be in their rest pose when this runs. The source is turned about world Y to face the same
 * way as the target for the duration of the call. For every mapped bone the rest pose is first aligned: the source
 * bone is swung so it points along the target bone (an A-pose arm is lifted into a T-pose arm), which gives a fixed
 * frame offset between the two bones. The clip is then sampled on the source with a mixer, and each target bone gets
 * the source bone's world rotation times that offset, converted back to the target bone's local space.
 * Hips translation is carried over as a world-space offset scaled by hip height; with inPlace the horizontal part
 * is dropped so a movement owner can move the character instead, and maxHipsRise caps how far the hips may rise
 * above standing height (in-place jumps that keep their height in the pelvis would otherwise add to physics). Root travel is measured and returned so callers
 * can time-scale locomotion to the speed the game expects. With mirror, each target bone follows the opposite side's
 * source bone reflected across the character's centre plane, which turns a left-foot kick into a right-foot kick.
 * With faceEnd the whole pose is turned about world Y so the clip ends facing forward: a 180-degree turn clip then
 * starts facing back and finishes along the new heading, as the game expects once it has snapped yaw to that heading. */
(()=>{
 'use strict';
 const Q=THREE.Quaternion,V=THREE.Vector3;
 // UE-style mannequin names (Runner Action pack, UE4-like rigs) to Mixamo names without the "mixamorig" prefix.
 const UE_TO_MIXAMO=(()=>{
  const m={pelvis:'Hips',spine_01:'Spine',spine_02:'Spine1',spine_03:'Spine2',neck_01:'Neck',head:'Head'};
  for(const [s,S] of [['l','Left'],['r','Right']]){
   Object.assign(m,{['clavicle_'+s]:S+'Shoulder',['upperarm_'+s]:S+'Arm',['lowerarm_'+s]:S+'ForeArm',['hand_'+s]:S+'Hand',
    ['thigh_'+s]:S+'UpLeg',['calf_'+s]:S+'Leg',['foot_'+s]:S+'Foot',['ball_'+s]:S+'ToeBase'});
   for(const [f,F] of [['thumb','Thumb'],['index','Index'],['middle','Middle'],['ring','Ring'],['pinky','Pinky']])
    for(const i of [1,2,3])m[f+'_0'+i+'_'+s]=S+'Hand'+F+i;
  }
  return m;
 })();
 function bones(root){const map=new Map();root.traverse(o=>{if(o.isBone&&!map.has(o.name))map.set(o.name,o);});return map;}
 const depth=b=>{let d=0;for(let p=b.parent;p;p=p.parent)d++;return d;};
 // Facing from the arms: a character facing +Z has its left arm at +X.
 function facing(left,right){const l=left.getWorldPosition(new V()),r=right.getWorldPosition(new V());const f=l.sub(r).cross(new V(0,1,0));return Math.atan2(f.x,f.z);}

 function retargetClip(clip,sourceRoot,targetRoot,opts={}){
  const prefix=opts.prefix??'mixamorig',names=opts.map||UE_TO_MIXAMO,srcHips=opts.sourceHips||'pelvis',tgtHips=opts.targetHips||prefix+'Hips';
  const S=bones(sourceRoot),T=bones(targetRoot);
  const pairs=Object.entries(names).filter(([s,t])=>S.has(s)&&T.has(prefix+t)).map(([s,t])=>({s:S.get(s),t:T.get(prefix+t)})).sort((a,b)=>depth(a.t)-depth(b.t));
  const byTarget=new Map(pairs.map(p=>[p.t,p]));
  const side=n=>n.replace(/_l$/,'_R').replace(/_r$/,'_l').replace(/_R$/,'_r');
  if(opts.mirror)for(const p of pairs)p.m=S.get(side(p.s.name))||p.s;
  // Turn the source to face the target; restored before returning.
  const yaw0=sourceRoot.rotation.y,limb=(m,side)=>m.get(side);
  sourceRoot.updateMatrixWorld(true);targetRoot.updateMatrixWorld(true);
  const fs=facing(limb(S,opts.sourceLeftArm||'upperarm_l'),limb(S,opts.sourceRightArm||'upperarm_r')),ft=facing(T.get(prefix+'LeftArm'),T.get(prefix+'RightArm'));
  sourceRoot.rotation.y=yaw0+(ft-fs);sourceRoot.updateMatrixWorld(true);
  // Mirror plane: through the character's up and forward axes; its normal is his left-right axis.
  const n=new V(Math.cos(ft),0,-Math.sin(ft));
  const reflect=q=>{const v=new V(q.x,q.y,q.z),k=2*v.dot(n);return new Q(k*n.x-v.x,k*n.y-v.y,k*n.z-v.z,q.w);};
  const saved=[...S.values()].map(b=>[b,b.position.clone(),b.quaternion.clone(),b.scale.clone()]);
  // Rest alignment: swing each source bone onto its target bone's direction (towards the first mapped child).
  const childOf=p=>pairs.find(c=>{for(let a=c.t.parent;a;a=a.parent){if(a===p.t)return true;if(byTarget.has(a))return false;}return false;});
  for(const p of pairs){
   p.sRest=p.s.getWorldQuaternion(new Q());p.tRest=p.t.getWorldQuaternion(new Q());
   const c=childOf(p);
   if(c){const sd=c.s.getWorldPosition(new V()).sub(p.s.getWorldPosition(new V())),td=c.t.getWorldPosition(new V()).sub(p.t.getWorldPosition(new V()));
    p.align=sd.lengthSq()>1e-10&&td.lengthSq()>1e-10?new Q().setFromUnitVectors(sd.normalize(),td.normalize()):new Q();}
   else p.align=byTarget.get(p.t.parent)?.align?.clone()||new Q();
   p.offset=p.align.clone().multiply(p.sRest).invert().multiply(p.tRest);
  }
  if(opts.mirror)for(const p of pairs){p.mRest=reflect(p.m.getWorldQuaternion(new Q()));p.tail=p.align.clone().invert().multiply(p.tRest);}
  const sh=S.get(srcHips),th=T.get(tgtHips);
  // With sourceRootNode the hips move relative to that node (a Unity-style root carrying the trajectory), so a
  // jump's height comes from the game's physics rather than the clip.
  const rootNode=opts.sourceRootNode?sourceRoot.getObjectByName(opts.sourceRootNode):null,rootAt=()=>rootNode?rootNode.getWorldPosition(new V()):new V();
  const shRest=sh.getWorldPosition(new V()).sub(rootAt()),thRest=th.getWorldPosition(new V());
  const sBase=sourceRoot.getWorldPosition(new V()),tBase=targetRoot.getWorldPosition(new V());
  const ratio=(thRest.y-tBase.y)/Math.max(1e-6,shRest.y+(rootNode?rootAt().y:0)-sBase.y);
  const thParentInv=th.parent.matrixWorld.clone().invert();
  // Sample on the source with a mixer; tracks for nodes the source lacks (IK helpers) and scale tracks are dropped.
  const has=n=>!!sourceRoot.getObjectByName(n);
  const usable=new THREE.AnimationClip(clip.name,clip.duration,clip.tracks.filter(tr=>{const [n,prop]=tr.name.split('.');return prop!=='scale'&&has(n);}));
  // Played once and clamped, so sampling at the clip's end gives its last frame rather than wrapping to the first.
  const mixer=new THREE.AnimationMixer(sourceRoot),action=mixer.clipAction(usable);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  const fps=opts.fps||30,count=Math.max(2,Math.round(clip.duration*fps)+1),times=[...Array(count)].map((_,i)=>Math.min(clip.duration,i/fps));
  if(times.at(-1)<clip.duration)times.push(clip.duration);
  // faceEnd: the hips' yaw change over the whole clip, undone on every frame.
  let face=new Q();
  if(opts.faceEnd){
   // Its own mixer: finishing a play-once action pauses it, which would freeze the main sampling below.
   const probe=new THREE.AnimationMixer(sourceRoot),pa=probe.clipAction(usable);pa.setLoop(THREE.LoopOnce,1);pa.clampWhenFinished=true;pa.play();probe.setTime(clip.duration);sourceRoot.updateMatrixWorld(true);
   const d=sh.getWorldQuaternion(new Q()).multiply(pairs.find(p=>p.s===sh).sRest.clone().invert());pa.stop();probe.uncacheRoot(sourceRoot);
   const f0=new V(Math.sin(ft),0,Math.cos(ft)),f1=f0.clone().applyQuaternion(d).setY(0);if(f1.lengthSq()>1e-8)face.setFromAxisAngle(new V(0,1,0),-(Math.atan2(f1.x,f1.z)-ft));}
  const out=new Map(pairs.map(p=>[p,[]])),hipsOut=[],travel=[],tW=new Map();
  for(const time of times){
   mixer.setTime(time);sourceRoot.updateMatrixWorld(true);
   for(const p of pairs){
    const w=face.clone().multiply(opts.mirror?reflect(p.m.getWorldQuaternion(new Q())).multiply(p.mRest.clone().invert()).multiply(p.tail):p.s.getWorldQuaternion(new Q()).multiply(p.offset));tW.set(p.t,w);
    const parent=byTarget.has(p.t.parent)?tW.get(p.t.parent):p.t.parent.getWorldQuaternion(new Q());
    out.get(p).push(...parent.clone().invert().multiply(w).toArray());
   }
   const hp=sh.getWorldPosition(new V());travel.push(hp.clone());
   const off=hp.clone().sub(rootAt()).sub(shRest).multiplyScalar(ratio);if(opts.mirror)off.addScaledVector(n,-2*off.dot(n));off.applyQuaternion(face);if(opts.inPlace){off.x=0;off.z=0;}if(opts.maxHipsRise!=null)off.y=Math.min(off.y,opts.maxHipsRise);
   hipsOut.push(...thRest.clone().add(off).applyMatrix4(thParentInv).toArray());
  }
  action.stop();mixer.uncacheRoot(sourceRoot);
  for(const [b,p,q,s] of saved){b.position.copy(p);b.quaternion.copy(q);b.scale.copy(s);}
  sourceRoot.rotation.y=yaw0;sourceRoot.updateMatrixWorld(true);
  const tracks=pairs.map(p=>new THREE.QuaternionKeyframeTrack(p.t.name+'.quaternion',times,out.get(p)));
  tracks.push(new THREE.VectorKeyframeTrack(th.name+'.position',times,hipsOut));
  const result=new THREE.AnimationClip(opts.name||clip.name,clip.duration,tracks);
  const d=travel.at(-1).clone().sub(travel[0]);d.y=0;
  result.userData={retarget:{bones:pairs.length,ratio,travelM:d.length()*ratio,speed:clip.duration>0?d.length()*ratio/clip.duration:0}};
  return result;
 }
 window.HumanoidRetarget={retargetClip,UE_TO_MIXAMO};
})();
