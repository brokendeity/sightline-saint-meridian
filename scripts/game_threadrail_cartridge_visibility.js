/* Visible aimed/held and surface-mounted cartridges. Visuals never own rail physics. */
function createThreadrailCartridgeVisuals(THREE,scene){
 const root=new THREE.Group();root.name='Threadrail cartridge assets';scene.add(root);
 const instances=new Map(),report={ready:false,error:null,sourceTask:'b71871c5-e9e6-4e89-b6f7-723182ab3c8e',diameter:.12,thickness:.03};let template=null,clock=0;
 const rimGeometry=new THREE.TorusGeometry(.0395,.0009,6,32);rimGeometry.rotateX(-Math.PI/2);const rimMaterial=new THREE.MeshBasicMaterial({color:0x36cfff,toneMapped:false});
 const mountGeometry=new THREE.CircleGeometry(.14,32);mountGeometry.rotateX(-Math.PI/2);const mountMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 localUv;void main(){localUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 localUv;void main(){float r=length(localUv-.5)*2.;float a=pow(1.-smoothstep(0.,1.,r),2.)*.45;gl_FragColor=vec4(.08,.58,1.,a);}'});
 const up=new THREE.Vector3(0,1,0),q=new THREE.Quaternion(),offset=new THREE.Vector3();
 const promise=new Promise((resolve,reject)=>new THREE.GLTFLoader().load('assets/backspool/threadrail-cartridge/backspool_threadrail_cartridge_game.glb',g=>{template=g.scene;template.updateMatrixWorld(true);report.modelBounds=new THREE.Box3().setFromObject(template).getSize(new THREE.Vector3()).toArray();report.ready=true;resolve(report)},undefined,e=>{report.error=String(e.message||e);reject(e)}));promise.catch(e=>console.warn('Cartridge asset unavailable',e));
 function acquire(id,pair='A'){
  if(instances.has(id))return instances.get(id);if(!template)return null;
  const group=template.clone(true);group.name='Cartridge '+id;group.scale.setScalar(1.5);const fins=[],jaws=[],details=[],meshes=[];let spool=null;
  group.traverse(o=>{if(o.isMesh){meshes.push(o);o.castShadow=false;o.receiveShadow=true;o.frustumCulled=true;if(o.name.startsWith('A_B_Identifier')){o.material=o.material.clone();o.material.color.setRGB(...(pair==='A'?[.45,.006,.009]:[.005,.13,.5]));o.material.emissive.setHex(pair==='A'?0x40040b:0x002459);}}if(o.name.startsWith('AnchorFin_'))fins.push({node:o,position:o.position.clone()});if(o.name.startsWith('LockingJaw_'))jaws.push({node:o,rotation:o.quaternion.clone()});if(o.name==='A_Label')o.visible=pair==='A';if(o.name==='B_Label'){o.visible=pair==='B';o.position.y=.0105;}if(o.name==='Spool_Core'){spool=o;o.material=o.material.clone();}if(o.name.startsWith('AnchorFin_')||o.name.startsWith('LockingJaw_'))details.push(o);});
  const rim=new THREE.Mesh(rimGeometry,rimMaterial);rim.name='Cartridge blue edge light';rim.position.y=.001;rim.visible=false;group.add(rim);const mountGlow=new THREE.Mesh(mountGeometry,mountMaterial);mountGlow.name='Surface core light spill';mountGlow.position.y=-.013;mountGlow.visible=false;group.add(mountGlow);root.add(group);const instance={id,pair,group,fins,jaws,spool,details,meshes,deploy:0,mode:'folded',lastMode:null,seen:true,position:new THREE.Vector3(),rim,mountGlow,socket:group.getObjectByName('ThreadExit')};instances.set(id,instance);return instance;
 }
 // World-space history keeps the streak behind the spinning cartridge, not rotating with it.
 const trailMaterial=new THREE.LineBasicMaterial({color:0x65dcff,transparent:true,opacity:.85,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
 function speedTrail(i,position,mode){
  if(!i.trail&&mode!=='flight')return;
  if(!i.trail){const data=new Float32Array(72),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(data,3));const line=new THREE.LineSegments(geometry,trailMaterial);line.name='Cartridge speed streak '+i.id;line.frustumCulled=false;root.add(line);i.trail={line,geometry,data,points:[]};}
  const t=i.trail;if(mode!=='flight'){t.points=[];t.line.visible=false;return;}
  if(!t.points.length||t.points[0].distanceToSquared(position)>1e-8)t.points.unshift(position.clone());t.points=t.points.slice(0,9);let n=0,distance=0;
  const put=(a,b)=>{if(n+6<=t.data.length){t.data.set([a.x,a.y,a.z,b.x,b.y,b.z],n);n+=6;}};
  for(let k=1;k<t.points.length;k++){const a=t.points[k-1],b=t.points[k],span=a.distanceTo(b);if(distance+span>2.8){if(span>0)put(a,a.clone().lerp(b,(2.8-distance)/span));break;}put(a,b);distance+=span;}
  if(t.points.length>1){const dir=t.points[0].clone().sub(t.points[1]).normalize(),side=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0));if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();for(const sign of [-1,1]){const a=position.clone().addScaledVector(dir,-.12).addScaledVector(side,sign*.065),b=a.clone().addScaledVector(dir,-.42);put(a,b);}}
  t.geometry.setDrawRange(0,n/3);t.geometry.attributes.position.needsUpdate=true;t.line.visible=n>0;
 }
 function begin(dt){clock+=Math.max(0,Math.min(dt||0,.05));for(const i of instances.values())i.seen=false;}
 function pose(id,position,normal,mode,pair,viewPosition){const i=acquire(id,pair);if(!i)return null;i.seen=true;i.group.visible=true;i.mode=mode;for(const mesh of i.meshes){mesh.visible=mesh.name.startsWith('Lower_Housing_Trim')&&id.startsWith('belt-')?false:mesh.name==='DockingClip'?id.startsWith('belt-'):mode==='holder'?false:mesh.name==='A_Label'?pair==='A':mesh.name==='B_Label'?pair==='B':true;}const target=mode==='anchored'?1:0;i.deploy+=(target-i.deploy)*(1-Math.exp(-22*Math.min(.05,Math.max(0,report.dt||1/60))));i.group.position.copy(position);i.group.quaternion.setFromUnitVectors(up,normal.clone().normalize());if(mode==='flight')i.group.quaternion.multiply(q.setFromAxisAngle(up,clock*35));
  for(const f of i.fins){f.node.position.copy(f.position);const d=f.node.userData.deployOffset;if(d)f.node.position.add(offset.fromArray(d).multiplyScalar(i.deploy));}
  for(const j of i.jaws)j.node.quaternion.copy(j.rotation).multiply(q.setFromAxisAngle(new THREE.Vector3(0,0,1),-.9*i.deploy));
  if(i.spool){i.spool.rotation.y=clock*(mode==='folded'?1:mode==='flight'?20:5);i.spool.material.emissiveIntensity=mode==='held'?1.6:mode==='folded'?.3:mode==='flight'?1.4:2.4;}
  const distance=viewPosition?position.distanceTo(viewPosition):0;for(const o of i.details)o.visible=distance<12&&i.deploy>.02;
  speedTrail(i,position,mode);i.rim.visible=mode==='held'||mode==='flight'||mode==='anchored';i.mountGlow.visible=mode==='anchored';i.mountGlow.scale.setScalar(.35+.65*i.deploy);i.group.updateWorldMatrix(true,false);i.position.copy(position);return i;
 }
 function end(){for(const [id,i]of instances)if(!i.seen){if(i.trail){root.remove(i.trail.line);i.trail.geometry.dispose();}root.remove(i.group);i.group.traverse(o=>{if(o.isMesh&&(o.name.startsWith('A_B_Identifier')||o.name==='Spool_Core'))o.material.dispose()});instances.delete(id);}}
 function socket(id,fallback){const i=instances.get(id);return i?.socket?i.socket.getWorldPosition(new THREE.Vector3()):fallback.clone();}
 function reset(){for(const i of instances.values())i.seen=false;end();}
 return{ready:promise,isReady:()=>report.ready,begin:(dt)=>{report.dt=dt;begin(dt)},pose,end,socket,reset,state:()=>({...report,count:instances.size,instances:[...instances.values()].map(i=>({id:i.id,pair:i.pair,mode:i.mode,deployment:i.deploy,faceNormal:up.clone().applyQuaternion(i.group.quaternion).toArray(),position:i.position.toArray(),threadExit:socket(i.id,i.position).toArray(),coreIntensity:i.spool?.material.emissiveIntensity||0,surfaceGlow:i.mountGlow.visible,speedTrail:!!i.trail?.line.visible,trailPoints:i.trail?.points.length||0}))})};
}
