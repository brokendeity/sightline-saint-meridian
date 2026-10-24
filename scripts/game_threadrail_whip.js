/* Recovered Forspoken upper-body curves, with authored Backspool release timing. */
(function(root){'use strict';
function createThreadrailWhip(THREE,getModel){
 let spec=null,error=null,bound=null,curves=[],saved=[],diagnostic=null;const clips=[];
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 async function load(url){const r=await fetch(url);if(!r.ok)throw Error('Whip asset '+r.status+': '+url);return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json()}
 const ready=(async()=>{try{const r=await fetch('assets/backspool/threadrail-whip/manifest.json');if(!r.ok)throw Error('Whip manifest '+r.status);spec=(await r.json()).gameplay;for(const url of [spec.rightUrl,spec.leftUrl])clips.push(THREE.AnimationClip.parse(await load(url)));return true;}catch(e){error=String(e);console.error(error);return false;}})();
 function restore(){for(const [bone,q]of saved)bone.quaternion.copy(q);saved=[];diagnostic=null;}
 function bind(){const model=getModel();if(!model)return false;if(model!==bound){restore();bound=model;curves=clips.map(clip=>clip.tracks.filter(t=>/mixamorig(Spine\d*|Neck|Head|(Left|Right)(Shoulder|Arm|ForeArm|Hand.*))\.quaternion$/.test(t.name)).map(t=>({bone:model.getObjectByName(t.name.split('.')[0]),curve:t.createInterpolant()})).filter(x=>x.bone));}return true;}
 function gesture(index){if(!spec||clips.length!==2)return null;return{offset:index*spec.castSpacing,releaseDelay:(spec.releaseSourceTime-spec.sourceStart)/spec.rate,duration:(spec.sourceEnd-spec.sourceStart)/spec.rate+spec.blendOut,sourceAnimationId:spec.sourceAnimationId};}
 function grip(index,weight){if(weight<=0)return;const side=index?'Left':'Right',hand=bound.getObjectByName('mixamorig'+side+'Hand');if(!hand)return;bound.updateMatrixWorld(true);
 const wrist=hand.getWorldPosition(new THREE.Vector3()),middle=bound.getObjectByName(hand.name+'Middle1'),a=bound.getObjectByName(hand.name+'Index1'),b=bound.getObjectByName(hand.name+'Pinky1'),hips=bound.getObjectByName('mixamorigHips');if(!middle||!a||!b||!hips)return;
 const forward=middle.getWorldPosition(new THREE.Vector3()).sub(wrist).normalize(),across=a.getWorldPosition(new THREE.Vector3()).sub(b.getWorldPosition(new THREE.Vector3())),normal=forward.clone().cross(across).normalize();if(normal.dot(wrist.clone().sub(hips.getWorldPosition(new THREE.Vector3())))>0)normal.negate();
 for(const finger of ['Index','Middle','Ring','Pinky','Thumb'])for(let j=1;j<=3;j++){const bone=bound.getObjectByName(hand.name+finger+j),child=bound.getObjectByName(hand.name+finger+(j+1));if(!bone||!child)continue;bound.updateMatrixWorld(true);const direction=child.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize(),axis=forward.clone().cross(normal);if(axis.lengthSq()<1e-8)continue;axis.normalize();const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion()),angle=(finger==='Thumb'?[.18,.42,.35]:[.24,.72,.56])[j-1]*weight,world=new THREE.Quaternion().setFromAxisAngle(axis,angle),local=parent.clone().invert().multiply(world).multiply(parent);bone.quaternion.premultiply(local).normalize();}bound.updateMatrixWorld(true);
 }
 function aim(index,age){restore();if(!spec||clips.length!==2||!bind())return;const sourceTime=.15,weight=smooth(age/.10);
  for(const item of curves[index]){saved.push([item.bone,item.bone.quaternion.clone()]);item.bone.quaternion.slerp(new THREE.Quaternion().fromArray(item.curve.evaluate(sourceTime)),weight);}
  grip(index,weight);bound.updateMatrixWorld(true);diagnostic={hand:index?'left':'right',sourceAnimationId:spec.sourceAnimationId,originalMotionName:spec.originalMotionName,authoredMirror:!!index,sourceTime,weight,phase:'aim',releaseSourceTime:spec.releaseSourceTime};
 }
 function apply(state,dt){restore();if(!spec||clips.length!==2||!bind()||!state.shots.length)return;const clock=state.clock+dt;
  const shot=[...state.shots].reverse().find(s=>clock>=s.gestureAt&&clock<s.gestureUntil);if(!shot)return;
  const age=clock-shot.gestureAt,duration=(spec.sourceEnd-spec.sourceStart)/spec.rate;
  let sourceTime=spec.sourceStart+Math.min(age,duration)*spec.rate;
  // The crossing frame displays the release pose itself before the physical projectile samples its palm.
  if(state.clock<shot.releaseAt&&clock>=shot.releaseAt-1e-8)sourceTime=spec.releaseSourceTime;
  const weight=smooth(age/spec.blendIn)*smooth((shot.gestureUntil-clock)/spec.blendOut),index=shot.handIndex;
  for(const item of curves[index]){saved.push([item.bone,item.bone.quaternion.clone()]);item.bone.quaternion.slerp(new THREE.Quaternion().fromArray(item.curve.evaluate(sourceTime)),weight);}
  grip(index,clock<shot.releaseAt?weight*(1-smooth((sourceTime-.22)/.08)):0);bound.updateMatrixWorld(true);diagnostic={throwId:shot.throwId,hand:index?'left':'right',sourceAnimationId:spec.sourceAnimationId,originalMotionName:spec.originalMotionName,authoredMirror:!!index,sourceTime,weight,phase:clock<shot.releaseAt?'windup':age<duration?'follow-through':'recovery',releaseSourceTime:spec.releaseSourceTime};
 }
 return{ready,isReady:()=>clips.length===2&&!error,gesture,apply,aim,restore,reset:restore,state:()=>({ready:clips.length===2&&!error,error,active:diagnostic&&{...diagnostic},sourceAnimationId:spec?.sourceAnimationId||null,releaseTiming:'authored'})};
}
root.createThreadrailWhip=createThreadrailWhip;
})(typeof window!=='undefined'?window:globalThis);
