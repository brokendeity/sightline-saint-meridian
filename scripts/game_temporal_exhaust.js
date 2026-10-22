/* Temporal Exhaust: scene-owned, bounded visual pulses; never writes actor/model transforms. */
(function(root){
'use strict';
function createTemporalExhaust(THREE,scene,options){
 options=options||{};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),finite=v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);
 const capacities={slivers:48,rings:24,threads:64,slices:12};
 const pools={};for(const name in capacities)pools[name]=Array.from({length:capacities[name]},()=>({life:0,age:0,delay:0,origin:new THREE.Vector3(),direction:new THREE.Vector3(),right:new THREE.Vector3(),up:new THREE.Vector3(),bodyRight:new THREE.Vector3(),bodyUp:new THREE.Vector3()}));
 const group=new THREE.Group();group.name='Backspool / Temporal Exhaust';scene.add(group);
 const outlet=new THREE.Vector3(),boneQuaternion=new THREE.Quaternion(),offset=new THREE.Vector3(),rear=new THREE.Vector3(),bodyRight=new THREE.Vector3(),bodyUp=new THREE.Vector3();
 const temp=new THREE.Vector3(),point=new THREE.Vector3(),center=new THREE.Vector3();
 let model=null,bone=null,source='unbound',enabled=true,disposed=false,clock=0,lastRelease=null,lastBank=null,lastReset='initial',emitted=0,overwritten=0,sequence=0;
 const seenReleases=new Set(),seenBanks=new Set(),direction=new THREE.Vector3(0,0,1);
 const vertexShader='attribute vec4 tint; varying vec4 vTint; void main(){vTint=tint;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
 const fragmentShader='varying vec4 vTint; void main(){gl_FragColor=vTint;}';
 const batches={};
 function batch(name,vertices,lines){
  const geometry=new THREE.BufferGeometry(),positions=new THREE.BufferAttribute(new Float32Array(vertices*3),3),tints=new THREE.BufferAttribute(new Float32Array(vertices*4),4);
  positions.setUsage(THREE.DynamicDrawUsage);tints.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('position',positions);geometry.setAttribute('tint',tints);geometry.setDrawRange(0,0);
  const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false});
  const object=lines?new THREE.LineSegments(geometry,material):new THREE.Mesh(geometry,material);object.name='Temporal '+name;object.frustumCulled=false;object.renderOrder=3;object.visible=false;group.add(object);return batches[name]={geometry,positions,tints,material,object,count:0};
 }
 batch('slivers',48*6,false);batch('rings',24*24*6,false);batch('threads',64*2,true);batch('slices',12*7*6,false);
 function vertex(b,p,alpha,violet){const i=b.count++;b.positions.setXYZ(i,p.x,p.y,p.z);b.tints.setXYZW(i,violet?.76:.76,violet?.62:.96,1,alpha);}
 function quad(b,c,r,u,w,h,a,violet,shear){
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]],order=[0,1,2,0,2,3];
  for(const i of order){const xy=corners[i];point.copy(c).addScaledVector(r,xy[0]*w+xy[1]*(shear||0)).addScaledVector(u,xy[1]*h);vertex(b,point,a,violet);}
 }
 function remember(set,id){if(id===undefined||id===null)return true;id=String(id);if(set.has(id))return false;set.add(id);if(set.size>96)set.delete(set.values().next().value);return true;}
 function attachment(){
  if(!model||!bone)return false;model.updateMatrixWorld(true);bone.getWorldPosition(outlet);bone.getWorldQuaternion(boneQuaternion);
  const o=options.outletOffsetMeters||{x:0,y:-.020,z:-.190};offset.set(o.x||0,o.y||0,o.z||0).applyQuaternion(boneQuaternion);outlet.add(offset);
  rear.set(0,0,-1).applyQuaternion(boneQuaternion);bodyRight.set(1,0,0).applyQuaternion(boneQuaternion);bodyUp.set(0,1,0).applyQuaternion(boneQuaternion);return finite(outlet);
 }
 function reset(reason){for(const name in pools)for(const p of pools[name])p.life=0;for(const name in batches){const b=batches[name];b.count=0;b.object.visible=false;b.geometry.setDrawRange(0,0);}refraction.visible=false;refraction.material.uniforms.strength.value=0;refractionRemaining=0;lastReset=reason||'reset';seenBanks.clear();seenReleases.clear();return state();}
 function bind(next){if(model===next)return !!bone;reset('model bind');model=next||null;bone=null;source='unbound';if(model){for(const name of ['mixamorigHips','Hips','hips','mixamorigSpine','Spine']){bone=model.getObjectByName(name);if(bone){source='bone:'+name;break;}}if(!bone){bone=model;source='model fallback';}attachment();}return !!bone;}
 function allocate(name,delay,life,axis,strength,index,inward){
  const pool=pools[name];let p=pool.find(p=>p.life<=0);if(!p){p=pool.reduce((a,b)=>(a.life-a.age)<(b.life-b.age)?a:b);overwritten++;}
  p.life=life;p.age=0;p.delay=delay;p.origin.copy(outlet);p.direction.copy(axis);p.bodyRight.copy(bodyRight);p.bodyUp.copy(bodyUp);p.right.copy(bodyRight).addScaledVector(axis,-bodyRight.dot(axis));
  if(p.right.lengthSq()<.02)p.right.copy(bodyUp).addScaledVector(axis,-bodyUp.dot(axis));if(p.right.lengthSq()<.02)p.right.set(1,0,0);p.right.normalize();p.up.crossVectors(axis,p.right).normalize();
  p.strength=strength;p.index=index;p.inward=!!inward;p.seed=(++sequence*2.3999632297)%6.283185307;emitted++;return p;
 }
 function bank(event){if(disposed||!enabled||!attachment()||!remember(seenBanks,event&&event.id))return false;lastBank={id:event&&event.id,at:clock,type:event&&(event.type||event.source)};for(let i=0;i<5;i++)allocate('threads',i*.012,.18,rear,.22,i,true);allocate('rings',0,.19,rear,.22,0,true);return true;}
 let refractionRemaining=0,refractionSupported=null,captureCount=0,captureRect=null;
 const textureSize=128,pixels=new Uint8Array(textureSize*textureSize*3),texture=new THREE.DataTexture(pixels,textureSize,textureSize,THREE.RGBFormat);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;
 const refractionMaterial=new THREE.ShaderMaterial({uniforms:{localFrame:{value:texture},strength:{value:0},phase:{value:0},maskScale:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D localFrame;uniform float strength;uniform float phase;uniform float maskScale;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*maskScale;float mask=(1.0-smoothstep(.12,.48,length(p)))*strength;vec2 uv=clamp(vUv+vec2(sin(vUv.y*39.0+phase),cos(vUv.x*31.0-phase))*.018*mask,.01,.99);gl_FragColor=vec4(texture2D(localFrame,uv).rgb,mask*.19);}',transparent:true,depthWrite:false,depthTest:true,toneMapped:false});
 const refraction=new THREE.Mesh(new THREE.PlaneGeometry(1,1),refractionMaterial);refraction.name='Temporal outlet / bounded local refraction';refraction.visible=false;refraction.frustumCulled=false;refraction.renderOrder=2;group.add(refraction);
 function release(event){
  if(disposed||!enabled||!event||!finite(event.deltaVelocity)||!attachment())return false;
  const dv=event.deltaVelocity,amount=Math.hypot(dv.x,dv.y,dv.z);if(amount<.001||!remember(seenReleases,event.id))return false;
  direction.set(-dv.x,-dv.y,-dv.z).normalize();const strength=clamp(amount/12,.3,1.2),brake=event.mode==='brake'||event.mode==='fall-brake',strong=amount>=13||event.perfect===true;
  lastRelease={id:event.id,at:clock,mode:event.mode||'standard',perfect:!!event.perfect,magnitude:amount,deltaVelocity:{x:dv.x,y:dv.y,z:dv.z},direction:{x:direction.x,y:direction.y,z:direction.z},braking:brake};
  const rings=strong?6:brake?5:3;for(let i=0;i<rings;i++){const p=allocate('rings',i*(brake?.022:.034),brake?.23:.30,direction,strength,i,false);p.brake=brake;}
  for(let i=0;i<(strong?15:10);i++){const p=allocate('slivers',(i%4)*.013,.22+(i%3)*.027,direction,strength,i,false);p.brake=brake;}
  for(let i=0;i<(strong?20:12);i++)allocate('threads',(i%5)*.012,.24,direction,strength,i,false);
  for(let i=0;i<(strong?4:2);i++)allocate('slices',.025+i*.052,.19,direction,strength,i,false);
  refractionRemaining=strong?.27:.18;return true;
 }
 function update(dt,context){
  if(disposed)return;context=context||{};dt=Number.isFinite(dt)?clamp(dt,0,.1):0;clock+=dt;if(context.model&&context.model!==model)bind(context.model);
  const wasEnabled=enabled;enabled=context.active!==false&&(!context.hero||String(context.hero).toLowerCase()==='backspool');if(!enabled){if(wasEnabled)reset('inactive / hero switch');return;}if(!attachment())return;
  for(const name in batches)batches[name].count=0;
  for(const name in pools)for(const p of pools[name]){
   if(p.life<=0)continue;p.age+=dt;const age=p.age-p.delay;if(age<0)continue;if(age>=p.life){p.life=0;continue;}
   const t=age/p.life,fade=Math.sin(Math.PI*Math.min(1,t*1.6))*Math.pow(1-t,1.4),spread=p.inward?.026:.032+.10*p.strength,tangent=Math.sin(p.seed)*spread,other=Math.cos(p.seed)*spread;
   center.copy(p.inward?outlet:p.origin).addScaledVector(p.direction,p.inward?.09*(1-t):.022+t*(p.brake?.43:.48+.40*p.strength));
   if(name==='rings'){
    const b=batches.rings,radius=p.inward?.072*(1-t):(.047+t*(p.brake?.17:.22))*clamp(p.strength,.65,1.1),width=p.inward?.003:.004*(1-t)+.001;
    for(let j=0;j<24;j++){if((j+p.index*2)%8<3)continue;const a=j/24*Math.PI*2+p.index*.41,an=(j+1)/24*Math.PI*2+p.index*.41;for(const v of [[a,radius-width],[a,radius+width],[an,radius+width],[a,radius-width],[an,radius+width],[an,radius-width]]){point.copy(center).addScaledVector(p.right,Math.cos(v[0])*v[1]).addScaledVector(p.up,Math.sin(v[0])*v[1]*(p.brake?1:.78));vertex(b,point,fade*(p.inward?.22:.46),j%5===0);}}
   }else if(name==='slivers'){
    center.addScaledVector(p.right,tangent*(1+t)).addScaledVector(p.up,other*(1+t));const bend=Math.sin(t*Math.PI)*.045*Math.sin(p.seed);center.addScaledVector(p.right,bend);
    quad(batches.slivers,center,p.right,p.direction,(.007+(p.index%3)*.004)*(1-t),(.045+.095*p.strength)*(1-t*.55),fade*.28,p.index%3===0,.018*Math.sin(p.seed));
   }else if(name==='threads'){
    center.addScaledVector(p.right,tangent).addScaledVector(p.up,other);const b=batches.threads;point.copy(center);vertex(b,point,fade*(p.inward?.23:.63),p.index%4===0);point.addScaledVector(p.direction,(p.inward?-.025:.055+.075*p.strength)*(1-t));vertex(b,point,0,p.index%4===0);
   }else{
    const b=batches.slices,k=(.63+.24*p.strength)*(1-t*.35),a=fade*.085;center.addScaledVector(p.direction,p.index*.025);const pieces=[[0,0,.105,.060],[0,.095,.033,.030],[-.132,-.005,.025,.064],[.132,-.005,.025,.064],[-.052,-.115,.031,.063],[.052,-.115,.031,.063],[0,.044,.075,.016]];
    for(const q of pieces){temp.copy(center).addScaledVector(p.bodyRight,q[0]*k).addScaledVector(p.bodyUp,q[1]*k);quad(b,temp,p.bodyRight,p.bodyUp,q[2]*k,q[3]*k,a,true,p.index*.003);}
   }
  }
  for(const name in batches){const b=batches[name];b.positions.needsUpdate=true;b.tints.needsUpdate=true;b.geometry.setDrawRange(0,b.count);b.object.visible=b.count>0;}
  refractionRemaining=Math.max(0,refractionRemaining-dt);if(refractionRemaining<=0){refraction.visible=false;refractionMaterial.uniforms.strength.value=0;}
 }
 const screen=new THREE.Vector3(),screenSide=new THREE.Vector3(),viewSize=new THREE.Vector2(),copyOrigin=new THREE.Vector2();
 function capture(renderer,camera){
  if(disposed||!enabled||!bone||refractionRemaining<=0||options.refraction===false||refractionSupported===false){refraction.visible=false;return false;}
  if(!renderer||typeof renderer.copyFramebufferToTexture!=='function'||!camera){refractionSupported=false;refraction.visible=false;return false;}
  // Caller has just rendered the world. One 128px square copy; no second world render.
  renderer.getDrawingBufferSize(viewSize);if(viewSize.x<textureSize||viewSize.y<textureSize){refraction.visible=false;return false;}
  screen.copy(outlet).project(camera);if(screen.z<-1||screen.z>1||Math.abs(screen.x)>1.1||Math.abs(screen.y)>1.1){refraction.visible=false;return false;}
  const depth=screen.z;screenSide.copy(outlet).addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion),.22).project(camera);const diameterPixels=Math.abs(screenSide.x-screen.x)*viewSize.x;refractionMaterial.uniforms.maskScale.value=Math.max(1,textureSize/Math.max(1,diameterPixels));
  const x=clamp(Math.round((screen.x*.5+.5)*viewSize.x-textureSize/2),0,viewSize.x-textureSize),y=clamp(Math.round((screen.y*.5+.5)*viewSize.y-textureSize/2),0,viewSize.y-textureSize);
  copyOrigin.set(x,y);try{renderer.copyFramebufferToTexture(copyOrigin,texture);refractionSupported=true;captureCount++;captureRect={x,y,width:textureSize,height:textureSize};}catch(error){refractionSupported=false;refraction.visible=false;return false;}
  // Match the captured screen rectangle exactly, then use only its faint central mask.
  screen.set((x+textureSize/2)/viewSize.x*2-1,(y+textureSize/2)/viewSize.y*2-1,screen.z).unproject(camera);screenSide.set((x+textureSize)/viewSize.x*2-1,(y+textureSize/2)/viewSize.y*2-1,depth).unproject(camera);
  refraction.position.copy(screen);camera.getWorldQuaternion(refraction.quaternion);const width=screen.distanceTo(screenSide)*2;refraction.scale.set(width,width,1);refractionMaterial.uniforms.strength.value=clamp(refractionRemaining/.18,0,1);refractionMaterial.uniforms.phase.value=clock*31;refraction.visible=true;return true;
 }
 function state(){const activeCounts={};for(const name in pools)activeCounts[name]=pools[name].filter(p=>p.life>0).length;return{bound:!!bone,source,enabled,disposed,outletPosition:{x:outlet.x,y:outlet.y,z:outlet.z},outletOffsetMeters:options.outletOffsetMeters||{x:0,y:-.020,z:-.190},emissionDirection:{x:direction.x,y:direction.y,z:direction.z},activeCounts,capacities:{...capacities},activeTotal:Object.values(activeCounts).reduce((a,b)=>a+b,0),visibleDrawCalls:Object.values(batches).filter(b=>b.object.visible).length+(refraction.visible?1:0),maxDrawCalls:5,lastRelease,lastBank,lastReset,emitted,overwritten,refraction:{supported:refractionSupported,remaining:refractionRemaining,captureCount,rect:captureRect,textureSize}};}
 function dispose(){if(disposed)return;reset('dispose');disposed=true;group.parent&&group.parent.remove(group);for(const name in batches){batches[name].geometry.dispose();batches[name].material.dispose();}refraction.geometry.dispose();refractionMaterial.dispose();texture.dispose();model=bone=null;source='disposed';}
 return{bind,bank,release,update,reset,state,capture,dispose};
}
root.createTemporalExhaust=createTemporalExhaust;if(typeof module!=='undefined')module.exports={createTemporalExhaust};
})(typeof window!=='undefined'?window:globalThis);
