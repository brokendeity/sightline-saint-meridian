/* Impact feel: surface-aware debris chunks, dust, sparks, fading decals, flash lights, distance shake and hit-stop.
   One pooled system for every impact source (crashes, shots, landings, melee). Nothing here moves the actor or
   touches collision; debris only reads the ground height. Pools are fixed size, so cost is bounded. */
(()=>{
 if(typeof THREE==='undefined'||typeof scene==='undefined')return;
 const rand=(a,b)=>a+Math.random()*(b-a),UP=new THREE.Vector3(0,1,0),tmp=new THREE.Vector3(),tmpQ=new THREE.Quaternion(),tmpM=new THREE.Matrix4(),tmpS=new THREE.Vector3();
 // Surface profiles: chunk mesh and colours, counts per unit strength, dust, sparks, decal art, flash colour and sound.
 const SURFACES={
  concrete:{chunk:'rock',colors:[0xa4a8ae,0x8c9097,0xc2c5c9],chunks:16,speed:7,bounce:.32,dust:0x8b8f96,dustCount:6,sparks:0,decal:'crack',flash:0xffb46e,sound:'thud'},
  asphalt:{chunk:'rock',colors:[0x6c6762,0x7d766e,0x5a5652],chunks:12,speed:6,bounce:.24,dust:0x6f6455,dustCount:8,sparks:0,decal:'crater',flash:0xffa860,sound:'dirt'},
  metal:{chunk:'shard',colors:[0xc4cad0,0x9aa2aa,0xe0e4e8],chunks:5,speed:8,bounce:.45,dust:0x9aa3ab,dustCount:2,sparks:22,decal:'dent',flash:0xd8ecff,sound:'clink'},
  glass:{chunk:'glass',colors:[0x9fdcea,0xc8f0f6,0x7fc6d6],chunks:12,speed:7,bounce:.4,dust:0xc7e6ee,dustCount:2,sparks:6,decal:'star',flash:0xbfefff,sound:'glass'},
  body:{chunk:null,colors:[],chunks:0,speed:5,bounce:0,dust:0xc2b8a8,dustCount:3,sparks:14,decal:null,flash:0xffd08a,sound:null}};
 const stats={bursts:0,hits:0,bySurface:{},chunksSpawned:0,chunksResting:0,decalsSpawned:0,decalsFaded:0,sparksSpawned:0,dustSpawned:0,flashes:0,hitStops:0,lastBurst:null};

 // ---- Chunk meshes: jagged low-poly rock, flat metal shards, thin glass slivers. One InstancedMesh each.
 function jagged(seed){const g=new THREE.IcosahedronGeometry(1,0),p=g.attributes.position,map=new Map();let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(3)).join();if(!map.has(k))map.set(k,.62+r()*.55);const f=map.get(k);p.setXYZ(i,p.getX(i)*f,p.getY(i)*f*(.7+r()*.1),p.getZ(i)*f);}
  g.computeVertexNormals();return g;}
 const CAP=220;
 function pool(geometry,material){const mesh=new THREE.InstancedMesh(geometry,material,CAP);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.count=0;
  for(let i=0;i<CAP;i++){mesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));mesh.setColorAt(i,new THREE.Color(1,1,1));}scene.add(mesh);return{mesh,items:new Array(CAP).fill(null),cursor:0};}
 const chunkPools={rock:pool(jagged(7),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,metalness:0,flatShading:true})),
  shard:pool(new THREE.TetrahedronGeometry(1,0).scale(1,.22,.55),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35,metalness:.85,flatShading:true})),
  glass:pool(new THREE.TetrahedronGeometry(1,0).scale(1,.06,.7),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.08,metalness:.2,flatShading:true,transparent:true,opacity:.62,depthWrite:false}))};
 function groundAt(x,z,y){const h=typeof supportHeight==='function'?supportHeight(x,z,y+.6):.42;return Number.isFinite(h)?h-.42:0;}
 function spawnChunk(kind,color,pos,vel,size){const P=chunkPools[kind];let slot=-1;for(let n=0;n<CAP;n++){const i=(P.cursor+n)%CAP;if(!P.items[i]){slot=i;break;}}
  if(slot<0){slot=P.cursor;}P.cursor=(slot+1)%CAP;
  P.items[slot]={pos:pos.clone(),vel:vel.clone(),q:new THREE.Quaternion().setFromEuler(new THREE.Euler(rand(0,6.3),rand(0,6.3),rand(0,6.3))),axis:new THREE.Vector3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize(),spin:rand(4,13),size,scale:1,ground:groundAt(pos.x,pos.z,pos.y),groundTick:0,rest:0,life:0};
  P.mesh.setColorAt(slot,new THREE.Color(color).multiplyScalar(rand(.8,1.15)));P.mesh.instanceColor.needsUpdate=true;stats.chunksSpawned++;}
 function updateChunks(dt){let resting=0;for(const kind in chunkPools){const P=chunkPools[kind];let top=0;
  for(let i=0;i<CAP;i++){const c=P.items[i];if(!c)continue;top=i+1;c.life+=dt;
   if(c.rest<=0||c.vel.lengthSq()>.0001){c.vel.y-=22*dt;c.pos.addScaledVector(c.vel,dt);
    if(++c.groundTick%4===0)c.ground=groundAt(c.pos.x,c.pos.z,c.pos.y);const floor=c.ground+c.size*.55;
    if(c.pos.y<floor){c.pos.y=floor;if(c.vel.y<-1.4){c.vel.y=-c.vel.y*(P.bounce??.3);c.vel.x*=.78;c.vel.z*=.78;c.spin*=.7;}else{c.vel.y=0;const f=Math.exp(-6.5*dt);c.vel.x*=f;c.vel.z*=f;c.spin*=f;if(Math.hypot(c.vel.x,c.vel.z)<.12){c.vel.set(0,0,0);c.spin=0;}}}
    if(c.vel.lengthSq()<=.0001&&c.pos.y<=floor+.001)c.rest=c.rest||c.life;}
   if(c.spin>0)c.q.multiply(tmpQ.setFromAxisAngle(c.axis,c.spin*dt));
   if(c.rest>0){resting++;const age=c.life-c.rest;if(age>5)c.scale=Math.max(0,1-(age-5)/.6);}
   if(c.life>14||c.scale<=0){P.items[i]=null;P.mesh.setMatrixAt(i,tmpM.makeScale(0,0,0));continue;}
   tmpS.setScalar(c.size*c.scale);P.mesh.setMatrixAt(i,tmpM.compose(c.pos,c.q,tmpS));}
  P.mesh.count=top;P.mesh.instanceMatrix.needsUpdate=true;}stats.chunksResting=resting;}
 for(const k of Object.keys(SURFACES))if(SURFACES[k].chunk)chunkPools[SURFACES[k].chunk].bounce=SURFACES[k].bounce;

 // ---- Dust: soft lingering clouds (normal blending, not additive, so they read as dust, not glow).
 function softTexture(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.45,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
 const dustMap=softTexture(),dust=[];
 for(let i=0;i<56;i++){const m=new THREE.SpriteMaterial({map:dustMap,transparent:true,depthWrite:false,opacity:0,fog:true}),sp=new THREE.Sprite(m);sp.visible=false;scene.add(sp);dust.push({sp,life:0,max:1,vel:new THREE.Vector3(),grow:1,base:1,peak:.5});}
 let dustCursor=0;
 function spawnDust(color,pos,vel,size,max,peak){const d=dust[dustCursor];dustCursor=(dustCursor+1)%dust.length;d.sp.position.copy(pos);d.vel.copy(vel);d.life=0;d.max=max;d.base=size;d.grow=size*rand(1.6,2.4);d.peak=peak;d.sp.material.color.setHex(color);d.sp.material.rotation=rand(0,6.3);d.sp.visible=true;stats.dustSpawned++;}
 function updateDust(dt){for(const d of dust){if(!d.sp.visible)continue;d.life+=dt;const t=d.life/d.max;if(t>=1){d.sp.visible=false;d.sp.material.opacity=0;continue;}
  d.vel.multiplyScalar(Math.exp(-2.6*dt));d.vel.y+=.35*dt;d.sp.position.addScaledVector(d.vel,dt);const s=d.base+(d.grow-d.base)*(1-Math.pow(1-t,2));d.sp.scale.set(s,s,1);d.sp.material.opacity=d.peak*(t<.12?t/.12:Math.pow(1-(t-.12)/.88,1.6));}}

 // ---- Sparks: glowing streaks stretched along their velocity (instanced, additive; WebGL lines are only 1 px wide).
 const SPARKS=320,sparks=new Array(SPARKS).fill(null),sparkMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1).translate(0,0,-.5),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false}),SPARKS);
 sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);sparkMesh.frustumCulled=false;for(let i=0;i<SPARKS;i++){sparkMesh.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));sparkMesh.setColorAt(i,new THREE.Color(0,0,0));}sparkMesh.count=0;scene.add(sparkMesh);let sparkCursor=0;
 const sparkLook=new THREE.Matrix4(),sparkTail=new THREE.Vector3(),sparkColor=new THREE.Color();
 function spawnSpark(color,pos,vel,max){sparks[sparkCursor]={pos:pos.clone(),vel:vel.clone(),life:0,max,color:new THREE.Color(color),width:rand(.012,.024)};sparkCursor=(sparkCursor+1)%SPARKS;stats.sparksSpawned++;}
 function updateSparks(dt){let top=0;for(let i=0;i<SPARKS;i++){const s=sparks[i];if(!s)continue;s.life+=dt;if(s.life>=s.max){sparks[i]=null;sparkMesh.setMatrixAt(i,tmpM.makeScale(0,0,0));continue;}top=i+1;
  s.vel.y-=9.8*dt;s.vel.multiplyScalar(Math.exp(-1.8*dt));s.pos.addScaledVector(s.vel,dt);const k=1-s.life/s.max,len=Math.max(.04,s.vel.length()*.045);
  sparkTail.copy(s.pos).addScaledVector(s.vel,-1);sparkLook.lookAt(s.pos,sparkTail,UP);tmpQ.setFromRotationMatrix(sparkLook);tmpS.set(s.width*(.5+k*.5),s.width*(.5+k*.5),len);
  sparkMesh.setMatrixAt(i,tmpM.compose(s.pos,tmpQ,tmpS));sparkMesh.setColorAt(i,sparkColor.copy(s.color).multiplyScalar(k*k*1.6));}
  sparkMesh.count=top;sparkMesh.instanceMatrix.needsUpdate=true;if(sparkMesh.instanceColor)sparkMesh.instanceColor.needsUpdate=true;}

 // ---- Decals: procedural damage art, normal-aligned, visible 30 s then faded over 2 s and destroyed.
 function decalTexture(kind,seed){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};x.translate(128,128);
  const cracks=(n,len,width,color)=>{x.strokeStyle=color;x.lineCap='round';for(let i=0;i<n;i++){let a=r()*6.283,px=0,py=0;x.lineWidth=width;x.beginPath();x.moveTo(0,0);const segs=4+Math.floor(r()*4);for(let k=0;k<segs;k++){a+=(r()-.5)*.9;const l=len*(.12+r()*.2);px+=Math.cos(a)*l;py+=Math.sin(a)*l;x.lineTo(px,py);}x.stroke();}};
  const blot=(radius,inner,outer)=>{const g=x.createRadialGradient(0,0,0,0,0,radius);g.addColorStop(0,inner);g.addColorStop(1,outer);x.fillStyle=g;x.beginPath();x.arc(0,0,radius,0,6.283);x.fill();};
  if(kind==='crack'){blot(78,'rgba(60,58,56,.35)','rgba(60,58,56,0)');
   // Chipped core: an irregular light patch of exposed concrete with a dark lip.
   x.beginPath();for(let i=0;i<=14;i++){const a=i/14*6.283,rr=26+r()*20;i?x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):x.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}x.closePath();x.fillStyle='rgba(176,172,166,.9)';x.fill();x.lineWidth=3;x.strokeStyle='rgba(40,38,36,.75)';x.stroke();
   blot(12,'rgba(22,21,20,.9)','rgba(22,21,20,.3)');
   // Fissures taper and branch instead of radiating evenly.
   const fissure=(px,py,a,len,w,depth)=>{x.strokeStyle='rgba(18,17,16,.85)';x.lineCap='round';let l=len;while(l>4&&w>.35){const step=6+r()*10;a+=(r()-.5)*.7;const nx=px+Math.cos(a)*step,ny=py+Math.sin(a)*step;x.lineWidth=w;x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();px=nx;py=ny;l-=step;w*=.9;if(depth<2&&r()<.16)fissure(px,py,a+(r()<.5?-1:1)*(.5+r()*.6),l*.5,w*.7,depth+1);}};
   const n=6+Math.floor(r()*3);for(let i=0;i<n;i++){const a=i/n*6.283+r()*.5;fissure(Math.cos(a)*30,Math.sin(a)*30,a,60+r()*55,2.6,0);}}
  else if(kind==='crater'){blot(118,'rgba(20,17,14,.0)','rgba(20,17,14,0)');const g=x.createRadialGradient(0,0,8,0,0,112);g.addColorStop(0,'rgba(8,7,6,.95)');g.addColorStop(.55,'rgba(26,22,18,.8)');g.addColorStop(.78,'rgba(70,62,52,.45)');g.addColorStop(1,'rgba(40,36,30,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,112,0,6.283);x.fill();cracks(11,170,2.5,'rgba(10,9,8,.8)');}
  else if(kind==='dent'){blot(46,'rgba(190,198,206,.0)','rgba(190,198,206,0)');x.strokeStyle='rgba(205,212,220,.75)';x.lineWidth=7;x.beginPath();x.arc(0,0,22,0,6.283);x.stroke();blot(19,'rgba(10,11,13,1)','rgba(25,27,30,.9)');for(let i=0;i<10;i++){x.strokeStyle='rgba(215,222,230,.45)';x.lineWidth=1.2;const a=r()*6.283;x.beginPath();x.moveTo(Math.cos(a)*24,Math.sin(a)*24);x.lineTo(Math.cos(a)*(40+r()*40),Math.sin(a)*(40+r()*40));x.stroke();}}
  else if(kind==='star'){cracks(12,200,1.6,'rgba(225,245,250,.85)');x.strokeStyle='rgba(225,245,250,.55)';x.lineWidth=1;for(let ring=1;ring<4;ring++){x.beginPath();for(let i=0;i<=12;i++){const a=i/12*6.283,rr=ring*22*(.85+r()*.3);i?x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):x.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}x.stroke();}blot(8,'rgba(240,252,255,.9)','rgba(240,252,255,.2)');}
  else{blot(70,'rgba(12,9,8,.85)','rgba(12,9,8,0)');blot(18,'rgba(255,140,60,.55)','rgba(120,40,10,0)');}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
 const decalArt={};for(const k of ['crack','crater','dent','star','scorch'])decalArt[k]=[decalTexture(k,11),decalTexture(k,977)];
 const decalGeometry=new THREE.PlaneGeometry(1,1),decals=[],DECAL_CAP=64,DECAL_HOLD=30,DECAL_FADE=2;
 function spawnDecal(kind,point,normal,size){const art=decalArt[kind];if(!art)return;const m=new THREE.MeshBasicMaterial({map:art[Math.floor(Math.random()*art.length)],transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,opacity:1,fog:true});
  const d=new THREE.Mesh(decalGeometry,m);d.position.copy(point).addScaledVector(normal,.025);d.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);d.rotateZ(rand(0,6.283));d.scale.set(size,size,1);d.renderOrder=2;scene.add(d);
  decals.push({mesh:d,age:0,hold:DECAL_HOLD});stats.decalsSpawned++;
  // Over the cap, the oldest decal starts its fade now instead of vanishing.
  const live=decals.filter(x=>x.age<x.hold);if(live.length>DECAL_CAP)live[0].hold=live[0].age;}
 function updateDecals(dt){for(let i=decals.length-1;i>=0;i--){const d=decals[i];d.age+=dt;if(d.age<=d.hold)continue;const t=(d.age-d.hold)/DECAL_FADE;if(t>=1){scene.remove(d.mesh);d.mesh.material.dispose();decals.splice(i,1);stats.decalsFaded++;continue;}d.mesh.material.opacity=1-t;}}
 function clearInside(box){for(let i=decals.length-1;i>=0;i--)if(box.containsPoint(decals[i].mesh.position)){scene.remove(decals[i].mesh);decals[i].mesh.material.dispose();decals.splice(i,1);}}

 // ---- Flash: two point lights live in the scene permanently at zero intensity, so shaders never recompile.
 const flashes=[0,1].map(()=>{const l=new THREE.PointLight(0xffffff,0,8,2);l.castShadow=false;scene.add(l);return{light:l,peak:0,age:1};});let flashCursor=0;
 function flash(color,pos,strength){const f=flashes[flashCursor];flashCursor=(flashCursor+1)%flashes.length;f.light.color.setHex(color);f.light.position.copy(pos);f.peak=Math.min(7,2.2+strength*3.2);f.light.distance=6+strength*4;f.age=0;stats.flashes++;}
 function updateFlashes(dt){for(const f of flashes){f.age+=dt;f.light.intensity=f.age<.14?f.peak*Math.exp(-f.age*22):0;}}

 // ---- Feel: distance shake and a short world hit-stop for massive impacts.
 let stopLeft=0;
 function shake(pos,amount){if(typeof cameraShake==='undefined'||typeof camera==='undefined')return;const d=camera.position.distanceTo(pos),k=Math.max(0,1-d/45);if(k>0)cameraShake=Math.max(cameraShake,amount*k);}
 function stop(seconds){stopLeft=Math.max(stopLeft,Math.min(.1,seconds));stats.hitStops++;}
 function sound(kind,strength){if(!kind||typeof gameAudio==='undefined'||!gameAudio.tone)return;const p=Math.min(1.4,Math.max(.4,strength));
  if(kind==='clink'){gameAudio.tone(1850,1720,.28,.07*p);gameAudio.tone(2760,2610,.2,.05*p);gameAudio.burst(.05,.12*p,7200);}
  else if(kind==='glass'){gameAudio.tone(3300,2900,.16,.05*p);gameAudio.burst(.32,.13*p,8200);}
  else if(kind==='dirt'){gameAudio.tone(72,30,.42,.24*p,'triangle');gameAudio.burst(.38,.17*p,850);}
  else{gameAudio.tone(98,38,.36,.24*p);gameAudio.burst(.3,.2*p,1500);}}

 // ---- Public entry points.
 function surfaceFor(collider,normal){if(collider?.surface)return collider.surface;if(!collider)return normal&&normal.y>.6?'asphalt':'concrete';if(collider.owner?.surface)return collider.owner.surface;
  if(collider.prop||collider.type||collider.id&&!collider.importedKind)return 'metal';return 'concrete';}
 function coneDir(normal,spread){const t=Math.abs(normal.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0),a=new THREE.Vector3().crossVectors(normal,t).normalize(),b=new THREE.Vector3().crossVectors(normal,a);const ang=rand(0,6.283),r=Math.tan(spread)*Math.sqrt(Math.random());return normal.clone().addScaledVector(a,Math.cos(ang)*r).addScaledVector(b,Math.sin(ang)*r).normalize();}
 // strength: about .25 for a shot, 1 for a heavy crash or hard landing, 2-3 for a collapse.
 function burst(point,normal,options={}){const n=(normal||UP).clone().normalize(),surface=options.surface||surfaceFor(options.collider,n),S=SURFACES[surface]||SURFACES.concrete,strength=Math.max(.1,options.strength??1),source=options.source||'impact',at=point.clone().addScaledVector(n,.06);
  stats.bursts++;stats.bySurface[surface]=(stats.bySurface[surface]||0)+1;stats.lastBurst={surface,strength:+strength.toFixed(2),source,point:point.toArray().map(v=>+v.toFixed(2))};
  const ground=n.y>.6;
  if(S.chunk){const count=Math.min(60,Math.round(S.chunks*Math.sqrt(strength)+(source==='shot'?1:3)));for(let i=0;i<count;i++){const dir=coneDir(n,ground?1.05:.9);if(ground)dir.y=Math.max(dir.y,.45);const speed=S.speed*rand(.45,1.15)*Math.sqrt(strength);
   spawnChunk(S.chunk,S.colors[i%S.colors.length],at.clone().add(new THREE.Vector3(rand(-.15,.15),rand(-.05,.15),rand(-.15,.15)).multiplyScalar(Math.min(2,strength))),dir.multiplyScalar(speed).add(new THREE.Vector3(0,ground?1.5:2.5,0)),(source==='shot'?rand(.04,.09):rand(.08,.24))*Math.min(2.2,.75+strength*.45));}}
  const puffs=Math.round(S.dustCount*Math.min(2.5,.5+strength*.8));for(let i=0;i<puffs;i++){const dir=coneDir(n,1.2);spawnDust(S.dust,at.clone().addScaledVector(dir,rand(.1,.5)),dir.multiplyScalar(rand(.6,2.2)*Math.min(2,.6+strength*.6)).add(new THREE.Vector3(0,rand(.1,.6),0)),rand(.35,.7)*Math.min(2.4,.6+strength*.6),rand(.9,1.6),rand(.32,.55));}
  if(ground&&strength>=.7){for(let i=0;i<10;i++){const a=i/10*6.283,dir=new THREE.Vector3(Math.cos(a),.08,Math.sin(a));spawnDust(S.dust,at.clone().addScaledVector(dir,.4),dir.multiplyScalar(rand(2.5,4)*Math.min(1.8,strength)),rand(.5,.8),rand(1,1.5),.42);}}
  for(let i=0;i<Math.round(S.sparks*Math.min(2,.6+strength*.5));i++)spawnSpark(i%3?0xffd9a0:0xffffff,at,coneDir(n,1).multiplyScalar(rand(4,11)),rand(.18,.42));
  if(S.decal&&options.decal!==false){const kind=source==='shot'&&surface==='concrete'?'scorch':ground&&surface!=='metal'?'crater':S.decal;spawnDecal(kind,point,n,(source==='shot'?rand(.35,.55):rand(.9,1.4))*Math.min(4,.6+strength*.9));}
  if(strength>=.2)flash(S.flash,at.clone().addScaledVector(n,.4),strength);
  shake(point,Math.min(.6,.06+strength*.16));if(options.stop)stop(options.stop);else if(strength>=1.6)stop(.08);
  sound(S.sound,strength);return stats.lastBurst;}
 // Melee hits on bodies: sparks, a dust puff and, for heavy hits, a flash and a hit-stop.
 function hit(point,direction,options={}){const dir=(direction&&direction.lengthSq()>.0001?direction.clone():new THREE.Vector3(0,0,-1)).normalize(),heavy=!!options.heavy,blocked=!!options.blocked;stats.hits++;
  const color=blocked?0x9fe8ff:0xffc985,count=blocked?10:heavy?20:9;for(let i=0;i<count;i++)spawnSpark(i%4?color:0xffffff,point,coneDir(dir,.95).multiplyScalar(rand(3,heavy?10:7)),rand(.12,.3));
  for(let i=0;i<(heavy?4:2);i++)spawnDust(SURFACES.body.dust,point.clone().addScaledVector(coneDir(dir,1.3),.15),coneDir(dir,1.2).multiplyScalar(rand(.6,1.6)),rand(.25,.45),rand(.45,.8),.3);
  if(heavy&&!blocked){flash(SURFACES.body.flash,point,1.1);stop(options.stop??.07);}shake(point,blocked?.05:heavy?.28:.1);}
 function update(dt){if(stopLeft>0)stopLeft=Math.max(0,stopLeft-dt);const d=Math.min(.05,dt);updateChunks(d);updateDust(d);updateSparks(d);updateDecals(d);updateFlashes(d);}
 window.impactFX={burst,hit,update,surfaceFor,clearInside,timeScale:()=>stopLeft>0?.04:1,
  state:()=>({...stats,bySurface:{...stats.bySurface},activeChunks:Object.values(chunkPools).reduce((n,P)=>n+P.items.filter(Boolean).length,0),activeDust:dust.filter(d=>d.sp.visible).length,activeSparks:sparks.filter(Boolean).length,
   decals:decals.map(d=>({age:+d.age.toFixed(2),opacity:+d.mesh.material.opacity.toFixed(3)})),flashIntensity:Math.max(...flashes.map(f=>f.light.intensity)),hitStop:stopLeft,surfaces:Object.keys(SURFACES)}),
  // Test hook: chunk positions and ground heights, to check bounce and rest.
  chunks:()=>Object.entries(chunkPools).flatMap(([kind,P])=>P.items.filter(Boolean).map(c=>({kind,y:+c.pos.y.toFixed(3),ground:+c.ground.toFixed(3),size:+c.size.toFixed(3),speed:+c.vel.length().toFixed(3),rest:c.rest>0})))};
})();
