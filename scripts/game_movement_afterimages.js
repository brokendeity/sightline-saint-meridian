/* Actual posed body snapshots in one bounded draw batch. No cloned skeletons or actor writes. */
(function(root){'use strict';
 function createMovementAfterimages(T,scene,options={}){
  const capacity=3,footCapacity=8,group=new T.Group();group.name='Backspool / performed movement silhouettes';scene.add(group);
  const slots=Array.from({length:capacity},()=>({age:0,life:0,kind:null,shift:new T.Vector3(),anchor:new T.Vector3(),settle:false}));
  let model=null,parts=[],vertices=0,indices=0,body=null,positions=null,disposed=false,clock=0,pending=[],cursor=0,footCursor=0,captures=0,seen=new Set(),last=null,peakCaptureMs=0;
  const point=new T.Vector3(),base=new T.Matrix4(),matrix=new T.Matrix4(),scale=new T.Vector3(),quaternion=new T.Quaternion(),up=new T.Vector3(0,1,0);
  const opacities=Array(3).fill(0),shifts=Array.from({length:3},()=>new T.Vector3()),colors=Array.from({length:3},()=>new T.Color(0xa7e9f2));
  const material=new T.ShaderMaterial({uniforms:{alpha:{value:opacities},shift:{value:shifts},tint:{value:colors}},vertexShader:'attribute float snapshot;uniform vec3 shift[3];uniform float alpha[3];uniform vec3 tint[3];varying float a;varying vec3 color;void main(){a=snapshot<.5?alpha[0]:snapshot<1.5?alpha[1]:alpha[2];color=snapshot<.5?tint[0]:snapshot<1.5?tint[1]:tint[2];vec3 offset=snapshot<.5?shift[0]:snapshot<1.5?shift[1]:shift[2];gl_Position=projectionMatrix*viewMatrix*vec4(position+offset,1.0);}',fragmentShader:'varying float a;varying vec3 color;void main(){if(a<.002)discard;gl_FragColor=vec4(color,a);}',transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,toneMapped:false,blending:T.AdditiveBlending});
  const footMaterial=new T.MeshBasicMaterial({color:0xa7e9f2,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide,toneMapped:false});
  const footGeometry=new T.CircleGeometry(1,10),feet=new T.InstancedMesh(footGeometry,footMaterial,footCapacity);feet.name='Performed supported footfalls';feet.frustumCulled=false;feet.visible=false;group.add(feet);
  const footprints=Array.from({length:footCapacity},()=>({life:0,age:0,p:new T.Vector3(),yaw:0}));
  function reduced(){return !!options.reducedMotion?.();}
  function remember(id){if(id==null)return false;id=String(id);if(seen.has(id))return false;seen.add(id);if(seen.size>96)seen.delete(seen.values().next().value);return true;}
  function reset(reason='RESET'){for(const s of slots)s.life=0;for(const f of footprints)f.life=0;pending=[];opacities.fill(0);if(body)body.visible=false;feet.visible=false;seen.clear();last={kind:'reset',reason};}
  function bind(next){if(next===model)return;reset('MODEL CHANGE');if(body){group.remove(body);body.geometry.dispose();body=null;}model=next;parts=[];vertices=indices=0;if(!model)return;
   model.traverse(mesh=>{if(!mesh.isMesh||mesh.userData.toonOutline||!mesh.geometry?.attributes.position)return;const n=mesh.geometry.attributes.position.count;parts.push({mesh,offset:vertices,matrices:mesh.isSkinnedMesh?new Float64Array(mesh.skeleton.bones.length*16):null});vertices+=n;indices+=mesh.geometry.index?.count||n;});
   const geometry=new T.BufferGeometry();positions=new T.BufferAttribute(new Float32Array(vertices*capacity*3),3);positions.setUsage(T.DynamicDrawUsage);geometry.setAttribute('position',positions);
   const ids=new Float32Array(vertices*capacity),topology=new Uint32Array(indices*capacity);let k=0;
   for(let s=0;s<capacity;s++){ids.fill(s,s*vertices,(s+1)*vertices);for(const part of parts){const idx=part.mesh.geometry.index,n=idx?.count||part.mesh.geometry.attributes.position.count;for(let i=0;i<n;i++)topology[k++]=s*vertices+part.offset+(idx?idx.getX(i):i);}}
   geometry.setAttribute('snapshot',new T.BufferAttribute(ids,1));geometry.setIndex(new T.BufferAttribute(topology,1));body=new T.Mesh(geometry,material);body.frustumCulled=false;body.visible=false;body.name='Pooled actual body silhouettes';group.add(body);
  }
  function capture(kind,shift=new T.Vector3(),settle=false){if(!body||disposed)return false;const at=typeof performance!=='undefined'?performance.now():0,i=cursor++%capacity,s=slots[i];model.updateMatrixWorld(true);
   for(const part of parts){const mesh=part.mesh,source=mesh.geometry.attributes.position,si=mesh.geometry.attributes.skinIndex,sw=mesh.geometry.attributes.skinWeight;
    if(part.matrices&&!si.normalized&&!sw.normalized){
     base.multiplyMatrices(mesh.matrixWorld,mesh.bindMatrixInverse);const world=base.elements;
     for(let b=0;b<mesh.skeleton.bones.length;b++){matrix.copy(base).multiply(mesh.skeleton.bones[b].matrixWorld).multiply(mesh.skeleton.boneInverses[b]).multiply(mesh.bindMatrix);part.matrices.set(matrix.elements,b*16);}
     const a=source.array,joints=si.array,weights=sw.array,rows=part.matrices;
     for(let v=0;v<source.count;v++){const x=a[v*3],y=a[v*3+1],z=a[v*3+2];let px=0,py=0,pz=0,total=0;for(let k=0;k<4;k++){const w=weights[v*4+k];if(!w)continue;const b=joints[v*4+k]*16;px+=w*(rows[b]*x+rows[b+4]*y+rows[b+8]*z+rows[b+12]);py+=w*(rows[b+1]*x+rows[b+5]*y+rows[b+9]*z+rows[b+13]);pz+=w*(rows[b+2]*x+rows[b+6]*y+rows[b+10]*z+rows[b+14]);total+=w;}positions.setXYZ(i*vertices+part.offset+v,px+world[12]*(1-total),py+world[13]*(1-total),pz+world[14]*(1-total));}
    }else for(let v=0;v<source.count;v++){point.fromBufferAttribute(source,v);if(mesh.isSkinnedMesh)mesh.boneTransform(v,point);point.applyMatrix4(mesh.matrixWorld);positions.setXYZ(i*vertices+part.offset+v,point.x,point.y,point.z);}
   }
   positions.needsUpdate=true;Object.assign(s,{age:0,life:reduced()?.14:kind==='landing'?.25:.30,kind,settle});s.shift.copy(shift);model.getWorldPosition(s.anchor);colors[i].setHex(kind==='landing'?0xd9ddff:0x9ce3ed);opacities[i]=kind==='landing'?.22:.17;shifts[i].copy(shift);body.visible=true;captures++;peakCaptureMs=Math.max(peakCaptureMs,(typeof performance!=='undefined'?performance.now():at)-at);return true;
  }
  function release(e){if(disposed||!model||!e||!remember('release:'+e.id))return false;const d=e.deltaVelocity;if(!d||![d.x,d.y,d.z].every(Number.isFinite)||Math.hypot(d.x,d.y,d.z)<.001)return false;
   const count=reduced()?1:e.mode==='ghoststep'||e.mode==='double-step'?3:1;for(let i=0;i<count;i++)pending.push({at:clock+i*.055,kind:'ghoststep'});pending=pending.slice(-capacity);last={kind:'release',id:e.id,mode:e.mode,count};return true;
  }
  function landing(e){if(disposed||!model||!e||!remember('landing:'+e.id)||!Number.isFinite(e.impact)||e.impact<3)return false;
   const v=e.velocity||{x:0,y:0,z:0},offset=new T.Vector3(-v.x*.022,.18,-v.z*.022).clampLength(0,.3);capture('landing',offset,true);last={kind:'landing',id:e.id,impact:e.impact};return true;
  }
  function footplant(e){if(disposed||!model||reduced()||!e?.position||!remember('foot:'+e.id))return false;const p=e.position;if(![p.x,p.y,p.z,e.yaw||0].every(Number.isFinite))return false;const f=footprints[footCursor++%footCapacity];f.p.set(p.x,p.y+.012,p.z);f.yaw=e.yaw||0;f.age=0;f.life=.32;return true;}
  function update(dt,c={}){if(disposed)return;dt=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;clock+=dt;if(c.model&&c.model!==model)bind(c.model);group.visible=c.hero==='backspool'&&c.active!==false;if(!group.visible){reset('INACTIVE');return;}
   for(const s of slots){s.age+=dt;if(s.life<=0)continue;const t=Math.min(1,s.age/s.life),i=slots.indexOf(s);opacities[i]=(s.kind==='landing'?.22:.17)*(1-t)*(1-t);shifts[i].copy(s.shift).multiplyScalar(s.settle?1-t:1);if(s.settle){model.getWorldPosition(point);point.sub(s.anchor);shifts[i].addScaledVector(point,t*t*(3-2*t));}if(t>=1)s.life=0;}
   const due=pending.filter(x=>x.at<=clock);pending=pending.filter(x=>x.at>clock);for(const e of due)capture(e.kind);
   if(body)body.visible=slots.some(s=>s.life>0);let n=0;for(const f of footprints){if(f.life<=0)continue;f.age+=dt;const t=f.age/f.life;if(t>=1){f.life=0;continue;}quaternion.setFromAxisAngle(up,f.yaw);quaternion.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2));scale.set(.075*(1-t),.17*(1-t),1);matrix.compose(f.p,quaternion,scale);feet.setMatrixAt(n++,matrix);}feet.count=n;feet.instanceMatrix.needsUpdate=true;feet.visible=n>0;
  }
  function state(){return{bound:!!model,disposed,sourceVertices:vertices,sourceIndices:indices,capacity,active:slots.filter(s=>s.life>0).length,activeKinds:slots.filter(s=>s.life>0).map(s=>s.kind),footCapacity,footprints:footprints.filter(f=>f.life>0).length,pending:pending.length,drawCalls:group.visible?Number(!!body?.visible)+Number(feet.visible):0,maxDrawCalls:2,captures,peakCaptureMs,last:last?{...last}:null};}
  function dispose(){if(disposed)return;reset('DISPOSE');disposed=true;body?.geometry.dispose();material.dispose();footGeometry.dispose();footMaterial.dispose();scene.remove(group);model=null;parts=[];}
  return{bind,release,landing,footplant,update,reset,state,dispose};
 }
 root.createMovementAfterimages=createMovementAfterimages;if(typeof module!=='undefined')module.exports={createMovementAfterimages};
})(typeof window!=='undefined'?window:globalThis);
