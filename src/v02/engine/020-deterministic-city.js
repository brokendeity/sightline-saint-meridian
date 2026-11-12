// ---------- deterministic city ----------
let seed=918273;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}function range(a,b){return a+(b-a)*rand()}
const environment=[],rayTargets=[],propColliders=[],buildingColliders=[],cameraObstacles=[],walkables=[],anchors=[],enemies=[],projectiles=[],fx=[];
const world=new THREE.Group();scene.add(world);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshStandardMaterial({color:0x0b1018,roughness:.94,metalness:.05}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;world.add(ground);rayTargets.push(ground);walkables.push(ground);
const gridHelper=new THREE.GridHelper(2400,120,0x243146,0x101722);gridHelper.position.y=.012;gridHelper.material.transparent=true;gridHelper.material.opacity=.38;world.add(gridHelper);
function addRoadStrip(x,z,w,d,color=0x111a26){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.05,d),new THREE.MeshStandardMaterial({color,roughness:.75,metalness:.15}));m.position.set(x,.02,z);m.receiveShadow=true;m.userData.legacyRoad=true;world.add(m);}
for(let i=-6;i<=6;i++){addRoadStrip(i*160,0,22,2200);addRoadStrip(0,i*160,2200,22)}
const laneMat=new THREE.MeshBasicMaterial({color:0x376376,transparent:true,opacity:.32});for(let i=-6;i<=6;i++){const a=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,2200),laneMat);a.position.set(i*160,.055,0);a.userData.legacyRoad=true;world.add(a);const b=new THREE.Mesh(new THREE.BoxGeometry(2200,.02,.12),laneMat);b.position.set(0,.055,i*160);b.userData.legacyRoad=true;world.add(b)}
const buildingMats=[0x101826,0x151b2a,0x0e1621,0x1b1e2b].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.68,metalness:.18}));
function registerProp(mesh){propColliders.push({box:new THREE.Box3().setFromObject(mesh),mesh});cameraObstacles.push(mesh)}
function allColliders(start=null,end=start){
 if(!start)return buildingColliders.flatMap(c=>c.parts||[c]).concat(propColliders,window.verticalDistrict?.colliders()||[]);
 const area=new THREE.Box3(start.clone().min(end),start.clone().max(end)).expandByScalar(2);
 return buildingColliders.filter(c=>c.box.intersectsBox(area)).flatMap(c=>c.parts||[c]).concat(propColliders.filter(c=>c.box.intersectsBox(area)),window.verticalDistrict?.colliders(start,end)||[]);
}
function disposeObject(obj){if(!obj)return;obj.removeFromParent?obj.removeFromParent():obj.parent&&obj.parent.remove(obj);const gs=new Set(),ms=new Set();obj.traverse(o=>{if(o.geometry&&!o.userData.sharedAsset)gs.add(o.geometry);if(o.material&&!o.userData.sharedMaterial)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ms.add(m))});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose())}
function addBuilding(x,z,w,d,h,accent){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),buildingMats[Math.floor(rand()*buildingMats.length)]);mesh.position.set(x,h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;world.add(mesh);rayTargets.push(mesh);walkables.push(mesh);const box=new THREE.Box3().setFromObject(mesh);buildingColliders.push({box,mesh});cameraObstacles.push(mesh);
 // Removed the original wraparound accent strips: their overlapping faces produced jagged facade bands.
 if(h>55&&rand()>.35){const roof=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,.35,8),new THREE.MeshStandardMaterial({color:0x192330,emissive:0x0a2733,emissiveIntensity:.7}));roof.position.set(x,h+.18,z);world.add(roof);rayTargets.push(roof);walkables.push(roof);registerProp(roof)}
 if(rand()>.72){const mast=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,range(7,15),6),new THREE.MeshBasicMaterial({color:accent}));mast.position.set(x+range(-w*.25,w*.25),h+mast.geometry.parameters.height/2,z+range(-d*.25,d*.25));world.add(mast);registerProp(mast)} return mesh;}
for(let gx=-6;gx<=6;gx++)for(let gz=-6;gz<=6;gz++){const cx=gx*160,cz=gz*160;if(Math.hypot(cx,cz)<175)continue;const count=rand()>.35?2:1;for(let k=0;k<count;k++){const w=range(46,68),d=range(46,68),h=range(24,160)*(Math.hypot(cx,cz)<500?1.2:1);const ox=(k===0?-1:1)*range(20,37),oz=range(-34,34);addBuilding(cx+ox,cz+oz,w,d,h,rand()>.5?0xff4a1a:0x32f5e7)}}
// central plaza + training pylons
const plaza=new THREE.Mesh(new THREE.CylinderGeometry(115,115,.4,64),new THREE.MeshStandardMaterial({color:0x141b26,roughness:.5,metalness:.28}));plaza.position.y=.2;plaza.receiveShadow=true;world.add(plaza);rayTargets.push(plaza);walkables.push(plaza);
for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=74;const p=new THREE.Mesh(new THREE.BoxGeometry(3,range(12,28),3),new THREE.MeshStandardMaterial({color:0x182231,emissive:i%2?0x052b2a:0x381008,emissiveIntensity:.8}));p.position.set(Math.cos(a)*r,p.geometry.parameters.height/2,Math.sin(a)*r);world.add(p);rayTargets.push(p);registerProp(p)}
// floating route anchors
function addAnchor(x,y,z){const g=new THREE.Group();const shell=new THREE.Mesh(new THREE.OctahedronGeometry(3.7,0),new THREE.MeshStandardMaterial({color:0x172534,metalness:.9,roughness:.18,emissive:0x092829,emissiveIntensity:1}));const ring=new THREE.Mesh(new THREE.TorusGeometry(5.5,.18,6,28),new THREE.MeshBasicMaterial({color:0x32f5e7}));ring.rotation.x=Math.PI/2;g.add(shell,ring);g.position.set(x,y,z);g.userData.isAnchor=true;world.add(g);shell.userData.anchorGroup=g;rayTargets.push(shell);anchors.push({group:g,ring})}
for(let i=0;i<42;i++){const a=rand()*Math.PI*2,r=range(160,1000),y=range(55,240);addAnchor(Math.cos(a)*r,y,Math.sin(a)*r)}
// skyline outer towers
for(let i=0;i<38;i++){const a=i/38*Math.PI*2,r=range(1000,1180),h=range(130,360);addBuilding(Math.cos(a)*r,Math.sin(a)*r,range(45,85),range(45,85),h,i%2?0x8a58ff:0xff4a1a)}

// Instanced, emissive 3D façade windows: world geometry, not a flat texture or UI overlay.
(function addArchitecturalDepth(){
 const instances=[];
 for(let i=0;i<buildingColliders.length;i++){
  const c=buildingColliders[i],b=c.box,h=b.max.y-b.min.y,w=b.max.x-b.min.x,d=b.max.z-b.min.z;
  if(i%3===2||h<24)continue;
  const rows=Math.min(13,Math.floor(h/9)),cols=w>60?4:3;
  for(let r=1;r<=rows;r++)for(let col=0;col<cols;col++){
   const ypos=b.min.y+Math.min(h-3,4+r*(h-8)/(rows+1)),x=b.min.x+(col+1)*w/(cols+1);
   instances.push([x,ypos,b.max.z+.075,0,(i+r+col)%9]);
   if(col<3)instances.push([b.max.x+.075,ypos,b.min.z+(col+1)*d/4,Math.PI/2,(i+r+col+4)%9]);
  }
 }
 const geo=new THREE.BoxGeometry(1.6,2.3,.10),mat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.77});
 const mesh=new THREE.InstancedMesh(geo,mat,instances.length),dummy=new THREE.Object3D();
 const palette=[0x2e6878,0x417489,0x1e3143,0x67bbcf,0x243447,0xe39b65,0x233d54,0x2b6677,0x111b27];
 for(let i=0;i<instances.length;i++){const [x,y,z,ry,c]=instances[i];dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new THREE.Color(palette[c]))}
 mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;world.add(mesh);
})();

// Phase B: visual cladding only. No additions to collision, support or ray-target registries.
// Decoration fits within body-shell clearance; roof overlays stay below the existing .42 m clearance.
const architecture=new THREE.Group();architecture.name='Saint Meridian architecture';world.add(architecture);
const architectureStats={families:[0,0,0,0,0],instances:0,signs:0};
(function buildArchitecture(){
 let visualSeed=41791;function vr(){visualSeed=(Math.imul(visualSeed,1664525)+1013904223)>>>0;return visualSeed/4294967296}
 const facadeColors=['#39292e','#273a46','#34424f','#173944','#353a38'];
 const familyMaterials=facadeColors.map((color,family)=>{
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
  if(family===0||family===2){for(let row=0;row<32;row++){const offset=(row%2)*32;for(let col=-1;col<9;col++){ctx.fillStyle=family===0?['#473139','#30282d','#51393b'][Math.floor(vr()*3)]:['#3b4651','#303d48','#46505a'][Math.floor(vr()*3)];ctx.fillRect(col*64+offset+2,row*16+1,60,14)}}}
  else{for(let x=0;x<512;x+=64){ctx.fillStyle=family===3?'#244956':'#46535b';ctx.fillRect(x,0,2,512)}for(let y=0;y<512;y+=64){ctx.fillStyle='#172630';ctx.fillRect(0,y,512,2)}}
  for(let i=0;i<3500;i++){ctx.fillStyle=vr()>.5?'rgba(255,225,210,.025)':'rgba(0,0,0,.045)';ctx.fillRect(vr()*512,vr()*512,1+vr()*3,2)}
  const map=new THREE.CanvasTexture(c);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(4,6);map.encoding=THREE.sRGBEncoding;map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  return new THREE.MeshStandardMaterial({map,color:0xffffff,roughness:family===3?.42:.86,metalness:family===3?.32:.08});
 });
 const batches=new Map();function box(key,color,roughness=.85){if(!batches.has(key))batches.set(key,{transforms:[],geometry:new THREE.BoxGeometry(1,1,1),material:new THREE.MeshStandardMaterial({color,roughness,metalness:.15})});return batches.get(key)}
 const masonry=box('cornices',0x4d4a50),iron=box('ironwork',0x172934),glass=box('shop glass',0x142f39,.28),warm=box('warm interiors',0x70402e),roof=box('roof grates',0x263a43);
 warm.material.emissive.setHex(0x6f3218);warm.material.emissiveIntensity=.55;glass.material.emissive.setHex(0x073f4d);glass.material.emissiveIntensity=.4;
 function add(batch,x,y,z,w,h,d,ry=0){batch.transforms.push([x,y,z,w,h,d,ry]);architectureStats.instances++}
 const names=['NOVA DINER','MERCER SQUARE','RIVIERA HOTEL','HAVEN MARKET','MERIDIAN APARTMENTS','SAINT MERIDIAN SUPPLY','EASTON HEIGHTS','NIGHT OWL RECORDS','SUNDAY BAKERY','GLASS WHARF','NOVA TRANSIT','AFTER HOURS','12TH STREET','CIVIC ARCHIVES','LANTERN NOODLES','MERIDIAN RADIO'];
 const atlas=document.createElement('canvas');atlas.width=atlas.height=2048;const ctx=atlas.getContext('2d');const signColors=['#70c7da','#db76ac','#e692b0','#dfb16d'];
 const signBatches=[];
 for(let i=0;i<names.length;i++){
  const x=(i%4)*512,y=Math.floor(i/4)*512,col=signColors[i%4];ctx.fillStyle='#09101b';ctx.fillRect(x,y,512,512);ctx.strokeStyle=col;ctx.lineWidth=7;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.strokeRect(x+24,y+62,464,388);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=col;ctx.font='bold 48px sans-serif';
  const words=names[i].split(' ');const lines=words.length>2?[words.slice(0,-1).join(' '),words[words.length-1]]:words;lines.forEach((line,j)=>{let fs=48;while(ctx.measureText(line).width>440&&fs>22){ctx.font='bold '+(--fs)+'px sans-serif'}ctx.fillText(line,x+256,y+210+j*66);ctx.font='bold 48px sans-serif'});ctx.font='18px monospace';ctx.fillStyle='#9c9da9';ctx.shadowBlur=0;ctx.fillText('SAINT MERIDIAN  /  EST. 2041',x+256,y+406);
  const geo=new THREE.PlaneGeometry(1,1),uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,(i%4+uv.getX(j))/4,(3-Math.floor(i/4)+uv.getY(j))/4);signBatches.push({transforms:[],geometry:geo,material:null});
 }
 const signMap=new THREE.CanvasTexture(atlas);signMap.encoding=THREE.sRGBEncoding;signMap.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());const signMaterial=new THREE.MeshBasicMaterial({map:signMap,color:0xffffff,side:THREE.DoubleSide});signBatches.forEach(b=>b.material=signMaterial);
 for(let i=0;i<buildingColliders.length;i++){
  const c=buildingColliders[i],b=c.box,x=c.mesh.position.x,z=c.mesh.position.z,w=b.max.x-b.min.x,d=b.max.z-b.min.z,h=b.max.y;
  const batchStart=new Map([...batches.values(),...signBatches].map(batch=>[batch,batch.transforms.length]));
  const family=(Math.floor(Math.abs(x)/160)+Math.floor(Math.abs(z)/160)*3)%5;c.mesh.material=familyMaterials[family];architectureStats.families[family]++;
  const front=b.max.z+.10,right=b.max.x+.10,step=family===3?12:8,floors=Math.floor((h-10)/step);
  // Three-part building rhythm: storefront base, repeated middle, crown fascia.
  add(masonry,x,7.8,front,w,.55,.17);add(masonry,x,h-2.3,front,w,1.25,.24);add(masonry,right,h-2.3,z,.24,1.25,d);
  if(family!==3){for(let f=1;f<floors;f+=family===1?2:3){const y=8+f*step;add(masonry,x,y,front,w,.24,.12);add(masonry,right,y,z,.12,.24,d)}}
  for(let k=0;k<3;k++){const sx=x+(k-1)*w*.27;add(glass,sx,3.6,front, w*.22,4.5,.08);add(iron,sx,1.25,front+.03,w*.24,.25,.08);add(iron,sx+w*.115,3.6,front+.05,.16,4.7,.09);if(family===0||family===2)add(warm,sx,4.3,front+.02,w*.16,1.3,.04)}
  // Shallow balcony/fire-escape relief stays inside the existing body-radius clearance.
  if(family===0||family===1){for(let f=1;f<Math.min(floors,12);f++){const y=8+f*step,fx=x-w*.27;add(iron,fx,y,front+.10,7,.16,.28);add(iron,fx,y+1.1,front+.18,7,.12,.12);for(let k=0;k<5;k++)add(iron,fx-3+k*1.5,y+.55,front+.18,.09,1.1,.10);add(iron,fx+3.3,y+step*.5,front+.2,.12,step,.12)}}
  if(family===2||family===4){for(let k=0;k<3;k++){const sx=x+(k-1)*w*.25;add(masonry,sx,h*.52,front,.6,h-10,.18)}}
  // Roof machinery drawn as low grates/panels; landing plane remains the original flat roof.
  add(roof,x+w*.22,h+.045,z-d*.2,6,.08,5);add(iron,x-w*.2,h+.025,z+d*.2,4,.04,3);
  for(let k=0;k<5;k++)add(masonry,x+w*.22-2+k,h+.09,z-d*.2,.13,.04,4.5);
  // Visible service conduit and vents on side wall, no new blocking volumes.
  add(iron,right,z===0?10:h*.46,z-d*.3,.16,Math.max(5,h-12),.16);
  if(i%2===0){add(roof,right+.04,9,z, .20,2,3);add(iron,right+.12,9,z,.12,1.7,2.7)}
  if(Math.hypot(x,z)<850||i%4===0){const n=(i*7+family*3)%names.length;signBatches[n].transforms.push([x,6.1,front+.18,Math.min(15,w*.35),4.2,1,0]);architectureStats.signs++;
   if(i%3===0){const vn=(n+2)%names.length;signBatches[vn].transforms.push([right+.15,h*.58,z,9,13,1,Math.PI/2]);architectureStats.signs++}}
  if(i%5===0){signBatches[(i+8)%names.length].transforms.push([x,h-5,front+.18,18,7,1,0]);architectureStats.signs++}
  // Four-sided treatment: repeat this building's modules around its opposite faces.
  for(const batch of [...batches.values(),...signBatches]){const begin=batchStart.get(batch),end=batch.transforms.length;for(let j=begin;j<end;j++){const t=batch.transforms[j];batch.transforms.push([2*x-t[0],t[1],2*z-t[2],t[3],t[4],t[5],t[6]+Math.PI]);if(signBatches.includes(batch))architectureStats.signs++;else architectureStats.instances++}}
 }
 const dummy=new THREE.Object3D();for(const batch of [...batches.values(),...signBatches]){if(!batch.transforms.length)continue;const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.transforms.length);for(let i=0;i<batch.transforms.length;i++){const [x,y,z,w,h,d,ry]=batch.transforms[i];dummy.position.set(x,y,z);dummy.rotation.set(0,ry,0);dummy.scale.set(w,h,d);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=true;mesh.frustumCulled=false;architecture.add(mesh)}
})();

// Phase C: district treatments are visual assignments to existing clusters, not new canonical geography.
const districtDefinitions=[
 {name:'SUNDAY ROW',color:0xeeb16d,wall:0x483239,tag:'BAKERIES / MARKET / OLD MERIDIAN'},
 {name:'MERCER SQUARE',color:0xe16faa,wall:0x34243e,tag:'HOTELS / MUSIC / NIGHTLIFE'},
 {name:'GLASS WHARF',color:0x69bbc9,wall:0x18343d,tag:'COMMERCE / SKYWAYS / TRANSIT'},
 {name:'CIVIC QUARTER',color:0xd6be79,wall:0x263d3c,tag:'ARCHIVES / THE FIRST WITNESS'}
];
function districtIndex(x,z){return z>=0?(x<0?0:1):(x<0?2:3)}
const districtCounts=[0,0,0,0],districtArt=new THREE.Group();districtArt.name='District identity';scene.add(districtArt);
(function addDistrictIdentity(){
 const bands=[],corners=[];const materialCache=new Map();
 for(const c of buildingColliders){const x=c.mesh.position.x,z=c.mesh.position.z,id=districtIndex(x,z),d=districtDefinitions[id],b=c.box;districtCounts[id]++;
  const key=id+':'+c.mesh.material.uuid;if(!materialCache.has(key)){const mat=c.mesh.material.clone();mat.color.setHex(d.wall).lerp(new THREE.Color(0xffffff),.55);materialCache.set(key,mat)}c.mesh.material=materialCache.get(key);
  bands.push({id,x,y:b.max.y-2,z:b.max.z+.25,w:b.max.x-b.min.x});corners.push({id,x:b.min.x-.23,y:b.max.y*.65,z:b.max.z+.23,h:Math.min(24,b.max.y*.25)});
 }
 const dummy=new THREE.Object3D();for(let id=0;id<4;id++){
  const geo=new THREE.BoxGeometry(1,1,1),mat=new THREE.MeshBasicMaterial({color:districtDefinitions[id].color});const selected=bands.filter(b=>b.id===id),mesh=new THREE.InstancedMesh(geo,mat,selected.length);
  selected.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.rotation.set(0,0,0);dummy.scale.set(b.w,.17,.09);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.frustumCulled=false;districtArt.add(mesh);
  const chosen=corners.filter(b=>b.id===id),edge=new THREE.InstancedMesh(geo,mat,chosen.length);chosen.forEach((b,i)=>{dummy.position.set(b.x,b.y,b.z);dummy.scale.set(.11,b.h,.11);dummy.updateMatrix();edge.setMatrixAt(i,dummy.matrix)});edge.frustumCulled=false;districtArt.add(edge);
 }
 function signTexture(title,subtitle,color){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#07151e';ctx.fillRect(0,0,1024,256);ctx.strokeStyle='#'+color.toString(16).padStart(6,'0');ctx.lineWidth=5;ctx.strokeRect(12,12,1000,232);ctx.fillStyle=ctx.strokeStyle;ctx.textAlign='center';ctx.font='bold 76px sans-serif';ctx.fillText(title,512,122);ctx.font='24px monospace';ctx.fillStyle='#b4c5cc';ctx.fillText(subtitle,512,189);const map=new THREE.CanvasTexture(c);map.encoding=THREE.sRGBEncoding;return map}
 for(let id=0;id<4;id++){const d=districtDefinitions[id],map=signTexture(d.name,d.tag,d.color),mat=new THREE.MeshBasicMaterial({map,side:THREE.DoubleSide}),nodes=buildingColliders.filter(c=>districtIndex(c.mesh.position.x,c.mesh.position.z)===id).sort((a,b)=>a.mesh.position.lengthSq()-b.mesh.position.lengthSq()).slice(0,3);
  for(const c of nodes){const b=c.box;const sign=new THREE.Mesh(new THREE.PlaneGeometry(28,7),mat);sign.position.set(c.mesh.position.x,b.max.y-5,b.max.z+.32);districtArt.add(sign);const rear=sign.clone();rear.position.z=b.min.z-.32;rear.rotation.y=Math.PI;districtArt.add(rear)}
 }
 // Scene-only landmark. Its base is beyond the playable city perimeter.
 const witness=new THREE.Group();witness.name='The First Witness';witness.position.set(240,300,-1460);scene.add(witness);
 const teal=new THREE.MeshStandardMaterial({color:0x226872,emissive:0x0a3842,emissiveIntensity:.55,metalness:.62,roughness:.43,fog:false});
 const dark=new THREE.MeshStandardMaterial({color:0x112b39,emissive:0x041018,metalness:.65,roughness:.4,fog:false});
 const gold=new THREE.MeshStandardMaterial({color:0xb9a878,emissive:0x44391f,emissiveIntensity:.6,metalness:.8,roughness:.33,fog:false});
 const glow=new THREE.MeshBasicMaterial({color:0x8be0da,fog:false}),black=new THREE.MeshBasicMaterial({color:0x07121b,fog:false}),iris=new THREE.MeshBasicMaterial({color:0xb3d79a,fog:false});
 function mesh(geometry,material,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);witness.add(m);return m}
 function ball(material,x,y,z,sx,sy,sz){return mesh(new THREE.SphereGeometry(1,24,16),material,x,y,z,sx,sy,sz)}
 function link(a,b,r,material){const v=new THREE.Vector3().subVectors(b,a),m=mesh(new THREE.CylinderGeometry(r,r*1.08,v.length(),12),material,0,0,0);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m}
 mesh(new THREE.CylinderGeometry(205,250,300,16),dark,0,-150,0);mesh(new THREE.CylinderGeometry(175,205,85,16),dark,0,42.5,0);mesh(new THREE.CylinderGeometry(178,178,8,32),gold,0,88,0);
 mesh(new THREE.CylinderGeometry(77,136,285,18),teal,0,232,0);ball(teal,0,365,0,104,55,58);mesh(new THREE.CylinderGeometry(39,45,48,16),gold,0,409,0);
 ball(dark,0,482,0,85,101,62);ball(teal,0,477,10,80,92,59);
 // Segmented aureole and illuminated inner rim, in three dimensions.
 const halo=mesh(new THREE.TorusGeometry(140,4.5,8,72),gold,0,487,-28);const haloLight=mesh(new THREE.TorusGeometry(141,1.4,6,72),glow,0,487,-22);
 for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const tile=mesh(new THREE.BoxGeometry(39,56,9),gold,Math.sin(a)*150,487+Math.cos(a)*150,-34);tile.rotation.z=-a;const inset=mesh(new THREE.BoxGeometry(32,46,10),glow,Math.sin(a)*150,487+Math.cos(a)*150,-28);inset.rotation.z=-a}
 // Single almond eye framed in gold, unmistakable above the skyline.
 const shape=new THREE.Shape();shape.moveTo(-62,0);shape.quadraticCurveTo(0,50,62,0);shape.quadraticCurveTo(0,-42,-62,0);
 mesh(new THREE.ShapeGeometry(shape,24),gold,0,492,72);mesh(new THREE.ShapeGeometry(shape,24),glow,0,492,73,.87,.78,1);ball(iris,0,492,78,34,31,8);ball(black,0,492,88,19,26,6);const pupilMaterial=new THREE.ShaderMaterial({fog:false,toneMapped:false,vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(.008,.018,.025,1.);}'});mesh(new THREE.CircleGeometry(1,40),pupilMaterial,0,492,100,19,26,1);ball(glow,-9,505,103,4,5,2);
 mesh(new THREE.BoxGeometry(40,15,15),gold,0,440,60);ball(teal,-43,433,44,25,20,28);ball(teal,43,433,44,25,20,28);
 const leftShoulder=new THREE.Vector3(-100,360,0),leftElbow=new THREE.Vector3(-155,283,20),leftWrist=new THREE.Vector3(-155,383,45);
 link(leftShoulder,leftElbow,27,teal);link(leftElbow,leftWrist,23,teal);ball(gold,-155,367,45,27,12,27);ball(teal,-155,403,48,31,38,15);
 for(let i=0;i<4;i++){link(new THREE.Vector3(-178+i*15,409,48),new THREE.Vector3(-180+i*15,459-Math.abs(i-1.5)*5,48),6,teal);ball(gold,-180+i*15,443,49,6.4,4,7)}link(new THREE.Vector3(-124,399,50),new THREE.Vector3(-113,427,50),7,teal);
 link(new THREE.Vector3(100,360,0),new THREE.Vector3(154,306,32),28,teal);link(new THREE.Vector3(154,306,32),new THREE.Vector3(170,375,68),24,teal);ball(gold,167,365,66,28,12,25);
 mesh(new THREE.BoxGeometry(148,95,15),gold,181,405,58);mesh(new THREE.BoxGeometry(130,78,16),glow,181,405,68);ball(teal,170,377,89,35,26,16);for(let i=0;i<4;i++)link(new THREE.Vector3(145+i*15,375,94),new THREE.Vector3(145+i*15,422,93),6,teal);
 // Robe bands, civic medallion and readable dedication.
 for(let i=0;i<5;i++){const ring=mesh(new THREE.TorusGeometry(92+i*9,2,6,48),gold,0,285-i*31,0);ring.rotation.x=Math.PI/2}
 mesh(new THREE.BoxGeometry(64,58,5),gold,0,350,58);mesh(new THREE.BoxGeometry(49,44,6),glow,0,350,61);
 const dedication=new THREE.Mesh(new THREE.PlaneGeometry(202,50),new THREE.MeshBasicMaterial({map:signTexture('THE FIRST WITNESS','FOR THOSE WHO BUILD  /  FOR THOSE TO COME',0xd8c28b),fog:false}));dedication.position.set(0,176,125);witness.add(dedication);
 witness.userData.scenic=true;window.firstWitness=witness;
})();

// Phase D: bounded scenic atmosphere. No new physics/support/rail-target geometry.
// Bounded world-space ripple events, adapted from WaterFloor's ring evaluation.
const wetSurfaces={patches:[],events:Array.from({length:8},()=>new THREE.Vector4(0,0,-100,0)),time:0,index:0,step:0,rainClock:0,emitted:{},
 patchAt(point){return this.patches.find(p=>Math.abs(point.y-p.y)<1.2&&((point.x-p.x)/(p.vertical?p.w/2:p.h/2))**2+((point.z-p.z)/(p.vertical?p.h/2:p.w/2))**2<.86);},
 emit(point,strength=1,kind='impact'){if(reducedMotion.matches||!this.patchAt(point))return false;const event=this.events[this.index];event.set(point.x,point.z,this.time,Math.min(2,strength));this.index=(this.index+1)%8;this.emitted[kind]=(this.emitted[kind]||0)+1;return true;},
 update(dt){if(!gameActive||reducedMotion.matches)return;this.time+=dt;const speed=Math.hypot(s.vel.x,s.vel.z);if(s.onGround&&!inputAiming()&&speed>1){this.step+=dt;const interval=speed>9?.2:speed>4.6?.29:.45;if(this.step>=interval){this.step%=interval;this.emit(s.pos,speed>9?1.1:.65,'step')}}else this.step=0;
 this.rainClock+=dt;if(this.rainClock>.25){this.rainClock=0;const nearby=this.patches.filter(p=>Math.hypot(p.x-s.pos.x,p.z-s.pos.z)<140);if(nearby.length){const p=nearby[Math.floor(this.time*7)%nearby.length];this.emit(new THREE.Vector3(p.x,p.y,p.z),.22,'rain')}}
 if(streetAtmosphere.puddleMaterial){streetAtmosphere.puddleMaterial.uniforms.time.value=this.time;streetAtmosphere.puddleMaterial.uniforms.ripples.value=this.events;}}
};
const streetAtmosphere={time:0,rain:null,rainUniforms:null,steam:[],walkers:[],fans:[],stats:{puddles:0,steam:0,walkers:0,storeInteriors:0},update(dt){
 this.time+=reducedMotion.matches?0:dt;
 this.rain.visible=!reducedMotion.matches;this.rainUniforms.time.value=this.time;this.rainUniforms.anchor.value.copy(camera.position);
 for(const p of this.steam){if(!p.visible)continue;p.material.uniforms.time.value=this.time;p.quaternion.copy(camera.quaternion)}
 for(const f of this.fans)f.rotation.y=this.time*.7;
 for(const w of this.walkers){if(w.routeEdge)continue;if(w.group.position.distanceToSquared(camera.position)>300*300)continue;const t=this.time*w.speed+w.phase;w.group.position.copy(w.start).lerp(w.end,.5+.5*Math.sin(t));w.group.rotation.y=Math.cos(t)>=0?w.yaw:w.yaw+Math.PI;w.left.rotation.x=Math.sin(t*9)*.23;w.right.rotation.x=-Math.sin(t*9)*.23}
}};
(function addStreetLife(){
 let seedD=74183;function dr(){seedD=(Math.imul(seedD,1664525)+1013904223)>>>0;return seedD/4294967296}
 const group=new THREE.Group();group.name='Rain-kissed street atmosphere';scene.add(group);
 // Wet-surface material variation: no real-time mirrors and no gameplay geometry changes.
 const rough=document.createElement('canvas');rough.width=rough.height=256;const ctx=rough.getContext('2d');ctx.fillStyle='#969696';ctx.fillRect(0,0,256,256);for(let i=0;i<75;i++){const x=dr()*256,y=dr()*256,r=8+dr()*27,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'#252525');g.addColorStop(1,'#969696');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)}const roughMap=new THREE.CanvasTexture(rough);roughMap.wrapS=roughMap.wrapT=THREE.RepeatWrapping;roughMap.repeat.set(14,14);ground.material.roughnessMap=roughMap;ground.material.roughness=.62;
 world.children.forEach(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height===.05){o.material.roughnessMap=roughMap;o.material.roughness=.38;o.material.metalness=.24}});
 const glowMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,uniforms:{time:{value:0},ripples:{value:wetSurfaces.events}},vertexShader:`varying vec2 uv0;varying vec3 tint;varying vec2 worldXZ;void main(){uv0=uv;tint=instanceColor;vec4 wp=modelMatrix*instanceMatrix*vec4(position,1.);worldXZ=wp.xz;gl_Position=projectionMatrix*viewMatrix*wp;}`,fragmentShader:`varying vec2 uv0;varying vec3 tint;varying vec2 worldXZ;uniform float time;uniform vec4 ripples[8];void main(){vec2 p=(uv0-.5)*2.;float mask=pow(max(0.,1.-dot(p,p)),1.6);if(mask<.005)discard;float shimmer=.65+.35*sin(uv0.y*95.+sin(uv0.x*12.+time*.25)*3.);float ripple=0.;for(int i=0;i<8;i++){float age=time-ripples[i].z;if(age>=0.&&age<2.){float d=length(worldXZ-ripples[i].xy);for(int r=0;r<2;r++){float elapsed=age-float(r)*.16;if(elapsed>=0.){float ring=1.-smoothstep(.04,.12,abs(d-elapsed*(2.4+ripples[i].w)));ripple+=ring*exp(-elapsed*2.)*ripples[i].w;}}}}ripple=clamp(ripple,0.,1.);vec3 color=mix(tint,vec3(.50,.85,.89),ripple*.85);gl_FragColor=vec4(color,mask*(.18*shimmer+ripple*.55));}`});streetAtmosphere.puddleMaterial=glowMat;
 const patches=[];for(let i=0;i<240;i++){const road=Math.floor(dr()*13)-6,along=(dr()-.5)*1900,vertical=dr()>.5,x=vertical?road*160+(dr()-.5)*16:along,z=vertical?along:road*160+(dr()-.5)*16;
 if(Math.hypot(x,z)<118||allColliders().some(c=>x>c.box.min.x-2&&x<c.box.max.x+2&&z>c.box.min.z-2&&z<c.box.max.z+2))continue;patches.push({x,z,vertical,id:districtIndex(x,z),w:2+dr()*5,h:7+dr()*15})}
 for(const [x,z,w,h] of [[-18,26,7,12],[18,-26,7,12],[36,8,6,13],[-36,-8,6,13],[6,40,5,10],[-6,-40,5,10]])patches.push({x,z,w,h,y:.415,vertical:true,id:districtIndex(x,z)});patches.forEach(p=>p.y=p.y??.065);wetSurfaces.patches=patches;
 const puddles=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),glowMat,patches.length),dummy=new THREE.Object3D();patches.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(-Math.PI/2,0,p.vertical?0:Math.PI/2);dummy.scale.set(p.w,p.h,1);dummy.updateMatrix();puddles.setMatrixAt(i,dummy.matrix);puddles.setColorAt(i,new THREE.Color(districtDefinitions[p.id].color).multiplyScalar(.72))});puddles.frustumCulled=false;group.add(puddles);streetAtmosphere.stats.puddles=patches.length;
 // Light-catching fine rain, camera-local volume. Line segments stay distinct from flight effects.
 const count=650,positions=new Float32Array(count*6),offsets=new Float32Array(count*2);for(let i=0;i<count;i++){const x=(dr()-.5)*160,y=dr()*110,z=(dr()-.5)*160,len=.8+dr()*1.7;positions.set([x,y,z,x-.13,y-len,z+.06],i*6);offsets[i*2]=offsets[i*2+1]=dr()}
 const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));rainGeo.setAttribute('phase',new THREE.BufferAttribute(offsets,1));
 const rainUniforms={time:{value:0},anchor:{value:new THREE.Vector3()},gain:{value:1}};const rainMat=new THREE.ShaderMaterial({uniforms:rainUniforms,transparent:true,depthWrite:false,vertexShader:`attribute float phase;uniform float time;uniform float gain;uniform vec3 anchor;varying float fade;void main(){vec3 p=position;float drop=mod(phase*110.+time*29.,110.);p.y-=drop;p.x+=sin(time*.4+phase*6.)*.6;p+=anchor;fade=.14*(1.-smoothstep(25.,85.,length(position.xz)));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);fade*=gain*smoothstep(.08,.28,length(gl_Position.xy/gl_Position.w));}`,fragmentShader:`varying float fade;void main(){gl_FragColor=vec4(.39,.59,.65,fade);}`});
 const rain=new THREE.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;group.add(rain);streetAtmosphere.rain=rain;streetAtmosphere.rainUniforms=rainUniforms;
 // Shared soft steam cards on existing facade vents, away from roof landing areas.
 const steamGeometry=new THREE.PlaneGeometry(5,11);
 for(let i=0;i<buildingColliders.length;i+=11){const c=buildingColliders[i],b=c.box,mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},phase:{value:dr()*6}},vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 uv0;uniform float time;uniform float phase;void main(){vec2 p=uv0;p.x+=sin(p.y*10.-time*.6+phase)*.07;float r=length(vec2((p.x-.5)*2.5,(p.y-.5)*1.5));float smoke=pow(max(0.,1.-r),2.)*sin(p.y*3.14159)*(.11+.035*sin(time*.5+phase));gl_FragColor=vec4(.50,.64,.67,smoke);}`});const puff=new THREE.Mesh(steamGeometry,mat);puff.position.set(c.mesh.position.x,b.min.y+6,b.max.z+.35);group.add(puff);streetAtmosphere.steam.push(puff)}streetAtmosphere.stats.steam=streetAtmosphere.steam.length;
 // Shadowed inhabitants behind shop glazing; silhouettes are baked into one shared texture.
 const interior=document.createElement('canvas');interior.width=512;interior.height=256;const ic=interior.getContext('2d'),gradient=ic.createLinearGradient(0,0,0,256);gradient.addColorStop(0,'#47322d');gradient.addColorStop(.7,'#241e28');gradient.addColorStop(1,'#101821');ic.fillStyle=gradient;ic.fillRect(0,0,512,256);ic.fillStyle='#050c14';for(let i=0;i<5;i++){const x=40+i*105;ic.beginPath();ic.arc(x,145,10,0,Math.PI*2);ic.fill();ic.fillRect(x-8,153,16,60)}ic.fillRect(0,218,512,13);ic.fillStyle='#a57c51';for(let i=0;i<4;i++)ic.fillRect(10+i*128,50,60,4);const interiorMap=new THREE.CanvasTexture(interior);interiorMap.encoding=THREE.sRGBEncoding;
 const interiors=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:interiorMap}),buildingColliders.length);for(let i=0;i<buildingColliders.length;i++){const c=buildingColliders[i],b=c.box;dummy.position.set(c.mesh.position.x,2.75,b.max.z+.20);dummy.rotation.set(0,0,0);dummy.scale.set((b.max.x-b.min.x)*.18,2.4,1);dummy.updateMatrix();interiors.setMatrixAt(i,dummy.matrix)}interiors.frustumCulled=false;group.add(interiors);streetAtmosphere.stats.storeInteriors=buildingColliders.length;
 // Low-profile roof fan caps animate existing rooftop service areas without changing landing volumes.
 const fanMaterial=new THREE.MeshStandardMaterial({color:0x283d44,metalness:.5,roughness:.7}),bladeGeo=new THREE.BoxGeometry(3,.06,.22);
 for(let i=0;i<buildingColliders.length;i+=13){const c=buildingColliders[i],b=c.box,g=new THREE.Group();g.position.set(c.mesh.position.x+(b.max.x-b.min.x)*.22,b.max.y+.14,c.mesh.position.z-(b.max.z-b.min.z)*.2);for(let k=0;k<3;k++){const blade=new THREE.Mesh(bladeGeo,fanMaterial);blade.rotation.y=k*Math.PI/3;g.add(blade)}group.add(g);streetAtmosphere.fans.push(g)}
 // Sparse, nonblocking ambient pedestrians on clear street routes. They are scenic, not mission actors.
 const coats=[0x253d48,0x463346,0x53463c].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.95}));const headMat=new THREE.MeshStandardMaterial({color:0x71605c,roughness:.95});const bodyGeo=new THREE.CylinderGeometry(.18,.23,.72,6),headGeo=new THREE.SphereGeometry(.13,8,6),limbGeo=new THREE.BoxGeometry(.10,.56,.12);
 function clearPath(a,b){return allColliders().every(c=>{const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minZ=Math.min(a.z,b.z),maxZ=Math.max(a.z,b.z);return maxX<c.box.min.x-2||minX>c.box.max.x+2||maxZ<c.box.min.z-2||minZ>c.box.max.z+2})}
 for(let attempt=0;attempt<250&&streetAtmosphere.walkers.length<28;attempt++){const road=(Math.floor(dr()*11)-5)*160,along=(dr()-.5)*1400,vertical=dr()>.5,a=new THREE.Vector3(vertical?road+8:along,0,vertical?along:road+8),b=a.clone();if(vertical)b.z+=18+dr()*22;else b.x+=18+dr()*22;if(Math.hypot(a.x,a.z)<120||!clearPath(a,b))continue;
  const g=new THREE.Group(),mat=coats[attempt%3],body=new THREE.Mesh(bodyGeo,mat);body.position.y=.95;g.add(body);const head=new THREE.Mesh(headGeo,headMat);head.position.y=1.48;g.add(head);const left=new THREE.Mesh(limbGeo,mat),right=new THREE.Mesh(limbGeo,mat);left.position.set(-.11,.34,0);right.position.set(.11,.34,0);g.add(left,right);const arm=new THREE.Mesh(new THREE.BoxGeometry(.52,.10,.12),mat);arm.position.y=1.06;g.add(arm);g.position.copy(a);group.add(g);streetAtmosphere.walkers.push({group:g,start:a,end:b,phase:dr()*Math.PI*2,speed:.055+dr()*.025,yaw:vertical?0:Math.PI/2,left,right});
 }streetAtmosphere.stats.walkers=streetAtmosphere.walkers.length;
})();

// Phase E: spatially bounded visual detail; gameplay geometry stays fully present.
const detailChunks=[],detailFrustum=new THREE.Frustum(),detailProjection=new THREE.Matrix4(),detailPoint=new THREE.Vector3();
(function partitionVisualDetails(){
 const sources=architecture.children.filter(m=>m.isInstancedMesh);
 for(const source of sources){source.geometry.computeBoundingBox();const tiles=new Map(),mat=new THREE.Matrix4(),pos=new THREE.Vector3(),color=new THREE.Color();
  for(let i=0;i<source.count;i++){source.getMatrixAt(i,mat);pos.setFromMatrixPosition(mat);const key=Math.floor(pos.x/400)+':'+Math.floor(pos.z/400);if(!tiles.has(key))tiles.set(key,[]);if(source.instanceColor)source.getColorAt(i,color);tiles.get(key).push({matrix:mat.clone(),color:source.instanceColor?color.clone():null})}
  for(const entries of tiles.values()){const mesh=new THREE.InstancedMesh(source.geometry,source.material,entries.length),box=new THREE.Box3();for(let i=0;i<entries.length;i++){mesh.setMatrixAt(i,entries[i].matrix);if(entries[i].color)mesh.setColorAt(i,entries[i].color);box.union(source.geometry.boundingBox.clone().applyMatrix4(entries[i].matrix))}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=false;mesh.receiveShadow=source.receiveShadow;mesh.frustumCulled=false;architecture.add(mesh);detailChunks.push({mesh,box,range:source.geometry.type==='PlaneGeometry'?1000:560})}
  architecture.remove(source);source.instanceMatrix=null;
 }
})();
const performanceBudget={visibleChunks:0,totalChunks:detailChunks.length,pedestrians:0,steam:0,targetClock:0,quality:matchMedia('(pointer: coarse)').matches?'mobile':'desktop'};
function updateVisualBudget(dt=0){
 camera.updateMatrixWorld();detailProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);detailFrustum.setFromProjectionMatrix(detailProjection);let visible=0;
 for(const c of buildingColliders)c.mesh.castShadow=c.box.distanceToPoint(camera.position)<650;
 for(const c of detailChunks){const near=c.box.distanceToPoint(camera.position);c.mesh.visible=near<c.range&&detailFrustum.intersectsBox(c.box);if(c.mesh.visible)visible++}performanceBudget.visibleChunks=visible;updateImportedBuildingLOD();
 let pedestrians=0,steam=0;for(const w of streetAtmosphere.walkers){w.group.visible=w.group.position.distanceToSquared(camera.position)<240*240;if(w.group.visible)pedestrians++}
 for(const p of streetAtmosphere.steam){p.visible=!p.userData.unmounted&&p.position.distanceToSquared(camera.position)<280*280;if(p.visible)steam++}for(const fan of streetAtmosphere.fans)fan.visible=fan.position.distanceToSquared(camera.position)<320*320;
 performanceBudget.pedestrians=pedestrians;performanceBudget.steam=steam;
 streetAtmosphere.rain.geometry.setDrawRange(0,performanceBudget.quality==='mobile'?600:1300);
 const aimed=inputAiming();streetAtmosphere.rainUniforms.gain.value=(aimed?.48:s.mode===P.TRANSIT?.65:1)*courier.rainStrength;
 const label=$('railTargetReadout');label.style.display=aimed&&gameActive?'block':'none';performanceBudget.targetClock+=dt;if(aimed&&performanceBudget.targetClock>=.08){performanceBudget.targetClock=0;const hit=s.target?sweptCharacterHit(s.pos,s.target):null,blocked=hit&&!isIntendedRailContact(hit,s.targetObj,s.target,s.targetNormal);const risk=forecastArrival();const type=s.targetObj?.userData.enemy?'VECTOR STRIKE':s.targetObj?.userData.anchorGroup?'ANCHOR':s.targetObj?'SURFACE RAIL':'OPEN SKY';label.textContent=s.overloadRecovery>0?'RAIL COOLING':blocked?'VECTOR BLOCKED':s.target?type+' · '+Math.round(s.pos.distanceTo(s.target))+' m':'NO TARGET';if(s.target)label.textContent=risk.tier+' · '+label.textContent;label.style.color='#'+risk.color.toString(16).padStart(6,'0');targetMarker.material.color.setHex(risk.color);laserMat.color.setHex(risk.color)}
}
window.phaseEStats=()=>({...performanceBudget});

// Browser-native interpretation of RealToon's inspected visual feature set; not a Unity shader port.
const toonRamp=new THREE.DataTexture(new Uint8Array([38,90,170,255]),4,1,THREE.LuminanceFormat);toonRamp.minFilter=toonRamp.magFilter=THREE.NearestFilter;toonRamp.generateMipmaps=false;toonRamp.needsUpdate=true;
const toonMaterials=new Map();let toonMaterialCount=0;
function applyToonVisuals(root){root.traverse(o=>{if(!o.isMesh||o.userData.toonOutline)return;const transform=old=>{
 if(!old||old.roughnessMap||!(old.isMeshStandardMaterial||old.isMeshPhongMaterial))return old;if(toonMaterials.has(old))return toonMaterials.get(old);
 const mat=new THREE.MeshToonMaterial({color:old.color.clone(),map:old.map,normalMap:old.normalMap,normalScale:old.normalScale?.clone(),bumpMap:old.bumpMap,bumpScale:old.bumpScale,emissive:old.emissive.clone(),emissiveMap:old.emissiveMap,emissiveIntensity:old.emissiveIntensity,gradientMap:toonRamp,side:old.side,transparent:old.transparent,opacity:old.opacity,alphaTest:old.alphaTest,vertexColors:old.vertexColors,skinning:!!o.isSkinnedMesh,fog:old.fog});
 mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`float edge=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
 float luminance=dot(outgoingLight,vec3(.2126,.7152,.0722));
 outgoingLight*=mix(vec3(.62,.72,1.0),vec3(1.0),smoothstep(.04,.24,luminance));
 outgoingLight+=vec3(.10,.22,.24)*edge*.32;
 vec3 worldN=inverseTransformDirection(normal,viewMatrix);
 vec3 worldV=inverseTransformDirection(normalize(vViewPosition),viewMatrix);
 float celGloss=smoothstep(.88,.92,dot(worldN,normalize(normalize(vec3(-.47,.84,.24))+worldV)));
 outgoingLight+=vec3(.13,.16,.18)*celGloss;
 #include <output_fragment>`)};mat.customProgramCacheKey=()=> 'SaintMeridianToon1';toonMaterials.set(old,mat);toonMaterialCount++;return mat};o.material=Array.isArray(o.material)?o.material.map(transform):transform(o.material)});}
function outlineCharacter(root){const bodies=[];root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.toonOutline)bodies.push(o)});for(const source of bodies){
 const material=new THREE.ShaderMaterial({side:THREE.BackSide,skinning:true,depthWrite:true,uniforms:{width:{value:.65}},vertexShader:`#include <common>
 #include <skinning_pars_vertex>
 uniform float width;
 void main(){
 #include <beginnormal_vertex>
 #include <skinbase_vertex>
 #include <skinnormal_vertex>
 #include <begin_vertex>
 #include <skinning_vertex>
 transformed+=normalize(objectNormal)*width;
 #include <project_vertex>
 }`,fragmentShader:`void main(){gl_FragColor=vec4(.015,.025,.045,1.);}`});
 const outline=new THREE.SkinnedMesh(source.geometry,material);outline.skeleton=source.skeleton;outline.bindMatrix.copy(source.bindMatrix);outline.bindMatrixInverse.copy(source.bindMatrixInverse);outline.userData.toonOutline=true;outline.frustumCulled=false;outline.castShadow=false;source.add(outline);
 }}
applyToonVisuals(scene);

