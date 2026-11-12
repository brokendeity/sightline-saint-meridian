


// User-supplied FBX replaces the scenic guardian at exactly the existing world-space height.
const statueReplacement={status:'loading',height:0,error:null};
// Progressive GLB scenic delivery is owned by actionWorld.

// Surface damage and bounded ballistic rubble. Building holes affect both meshes and swept collision.
const destruction={decals:[],debris:[],hits:0,last:0,damaged:new Set()};
function roofSpawnPoint(c){const parts=(c.parts||[c]).filter(p=>!c.importedKind||(p.box.max.x-p.box.min.x>2&&p.box.max.z-p.box.min.z>2));if(!parts.length)return new THREE.Vector3(c.mesh.position.x,.05,c.mesh.position.z);const roof=parts.slice().sort((a,b)=>b.box.max.y-a.box.max.y||((b.box.max.x-b.box.min.x)*(b.box.max.z-b.box.min.z)-(a.box.max.x-a.box.min.x)*(a.box.max.z-a.box.min.z)))[0];return new THREE.Vector3((roof.box.min.x+roof.box.max.x)/2,roof.box.max.y+.05,(roof.box.min.z+roof.box.max.z)/2)}
function impactTexture(hole=false){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');if(!hole){const g=ctx.createRadialGradient(256,256,15,256,256,170);g.addColorStop(0,'rgba(3,7,10,.96)');g.addColorStop(.42,'rgba(10,15,18,.85)');g.addColorStop(.78,'rgba(32,34,34,.55)');g.addColorStop(1,'rgba(15,19,21,0)');ctx.fillStyle=g;ctx.fillRect(0,0,512,512)}
 for(let i=0;i<17;i++){let angle=i*2.399+Math.random()*.15,x=256+Math.cos(angle)*80,y=256+Math.sin(angle)*80;ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<5;j++){x+=Math.cos(angle)*(20+Math.random()*15)+(Math.random()-.5)*18;y+=Math.sin(angle)*(20+Math.random()*15)+(Math.random()-.5)*18;ctx.lineTo(x,y)}ctx.strokeStyle='rgba(1,5,8,.92)';ctx.lineWidth=3+Math.random()*5;ctx.stroke();ctx.strokeStyle='rgba(104,109,111,.40)';ctx.lineWidth=1;ctx.stroke()}
 const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;return map}
const groundDamageMap=impactTexture(false),wallDamageMap=impactTexture(true),rubbleGeometry=new THREE.IcosahedronGeometry(1,0),rubbleMaterial=new THREE.MeshStandardMaterial({color:0x53545b,roughness:.95});
function collapseBuilding(c){
 gameAudio.play('collapse');c.destroyed=true;c.parts=[];c.mesh.visible=false;if(c.lodMesh)c.lodMesh.visible=false;if(!c.sharedGeometry)c.mesh.geometry.dispose();c.sharedGeometry=false;c.mesh.geometry=new THREE.BufferGeometry();c.mesh.geometry.setAttribute('position',new THREE.Float32BufferAttribute([],3));
 const bounds=c.box.clone().expandByScalar(1),matrix=new THREE.Matrix4(),position=new THREE.Vector3();scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.userData.streetInfrastructure)return;if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);position.setFromMatrixPosition(matrix);if(bounds.containsPoint(position)){matrix.makeScale(0,0,0);o.setMatrixAt(i,matrix);o.instanceMatrix.needsUpdate=true}}}else if(o.isMesh&&o!==c.mesh&&(o.parent===world||o.parent===districtArt)){o.getWorldPosition(position);if(bounds.containsPoint(position))o.visible=false}});
 for(let i=propColliders.length-1;i>=0;i--){const prop=propColliders[i];if(prop.box.min.x>=c.box.min.x&&prop.box.max.x<=c.box.max.x&&prop.box.min.z>=c.box.min.z&&prop.box.max.z<=c.box.max.z&&prop.box.min.y>=c.box.max.y-1){prop.mesh.visible=false;rayTargets.splice(rayTargets.indexOf(prop.mesh),rayTargets.includes(prop.mesh)?1:0);propColliders.splice(i,1)}}
 if(vip&&!carrying&&Math.abs(vip.group.position.x-c.mesh.position.x)<(c.box.max.x-c.box.min.x)/2&&Math.abs(vip.group.position.z-c.mesh.position.z)<(c.box.max.z-c.box.min.z)/2)vip.group.position.copy(roofSpawnPoint(c));
 window.impactFX?.clearInside(bounds);for(let i=destruction.decals.length-1;i>=0;i--)if(bounds.containsPoint(destruction.decals[i].position)){const decal=destruction.decals.splice(i,1)[0];scene.remove(decal);decal.geometry.dispose();decal.material.dispose()}
 relocateCourierRescues(c);destruction.damaged.add(c);showBanner('BUILDING COLLAPSE','STRUCTURE DESTROYED');
}
