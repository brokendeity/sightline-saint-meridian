// ---------- THREE-DIMENSIONAL FLIGHT VFX ----------
// Everything below exists as 3D geometry in the world and occludes correctly with buildings.
// No flat character sprite, fullscreen particle canvas or post-process cover-up.
class FlightVFXController {
 constructor(){this.maxParticles=0;this.trails=[];this.ghosts=[];this.sources=[];this.elapsed=0;this.next=0;this.flame=0;}
 bindBones(root){
  this.focusBone=null;root.traverse(o=>{if(o.isBone&&/spine2$/i.test(o.name))this.focusBone=o});
  root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.toonOutline)this.sources.push(o)});
  // A bounded pool of frozen skinned poses: no ribbon geometry, particles or per-frame allocations.
  for(let i=0;i<6;i++){
   const group=new THREE.Group(),parts=[];
   for(const source of this.sources){
    const material=new THREE.MeshBasicMaterial({color:0xff182c,transparent:true,opacity:0,depthWrite:false,side:THREE.FrontSide,skinning:true});
    const mesh=new THREE.SkinnedMesh(source.geometry,material);
    const bones=source.skeleton.bones.map(()=>new THREE.Bone());
    mesh.skeleton=new THREE.Skeleton(bones,source.skeleton.boneInverses.map(m=>m.clone()));
    mesh.bindMatrix.copy(source.bindMatrix);mesh.bindMatrixInverse.copy(source.bindMatrixInverse);
    mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
    group.add(mesh);parts.push({source,mesh,bones,material});
   }
   group.visible=false;scene.add(group);this.ghosts.push({group,parts,life:0});
  }
 }
 ignite(){this.elapsed=.04;}
 reset(){this.elapsed=0;this.next=0;for(const g of this.ghosts){g.life=0;g.group.visible=false}}
 capture(){
  const g=this.ghosts[this.next];if(!g)return;this.next=(this.next+1)%this.ghosts.length;
  for(const p of g.parts){
   p.mesh.matrix.copy(p.source.matrixWorld);p.mesh.bindMatrix.copy(p.source.bindMatrix);
   for(let i=0;i<p.bones.length;i++)p.bones[i].matrixWorld.copy(p.source.skeleton.bones[i].matrixWorld);
   p.mesh.updateMatrixWorld(true);p.mesh.skeleton.update();p.material.opacity=.32;
  }
  g.life=.24;g.group.visible=true;
 }
 update(dt){
  if(!gameActive)return;
  for(const g of this.ghosts){g.life=Math.max(0,g.life-dt);g.group.visible=g.life>0;for(const p of g.parts)p.material.opacity=.32*Math.pow(g.life/.24,1.1)}
  if(characterState().active==='backspool'){this.reset();return;}const flying=!s.onGround&&s.mode!==P.UNCONTROLLED&&s.mode!==P.IMPACT;
  if(flying&&s.vel.length()>18&&!reducedMotion.matches){this.elapsed+=dt;if(this.elapsed>=.04){this.elapsed%=.04;this.capture()}}else this.elapsed=0;
 }
}

const flightFX=new FlightVFXController();
