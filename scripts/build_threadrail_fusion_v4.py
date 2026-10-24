from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];base=root/'SIGHTLINE_BACKSPOOL_HALO_PATROLS.html';s=base.read_text();a=s.index("/* Backspool's equipment adapter.");b=s.index('const threadrailGame=(()=>{',a);s=s[:a]+(root/'scripts/game_cartridge_deployment.js').read_text()+'\n'+s[a:];b=s.index('const threadrailGame=(()=>{',a)
start=s.index(' function quickRail(){',b);end=s.index(' function precisionStart(){',start)
s=s[:start]+''' function quickRail(){if(!movementReady()){say('MOVEMENT COMMITTED');return false;}const near=bestNearbyRail();if(near)return attach(near.id);if(rail.state().current)return false;
  const local=makeAnchor(anchorAtSurface()),remote=makeAnchor(targetSurface());if(!local||!remote){say('AIM AT A SOLID SURFACE');return false;}return deploy.start([local,remote],true);
 }
'''+s[end:]
start=s.index(' function precisionEnd(){',b);end=s.index(' function detach(',start)
s=s[:start]+''' function precisionEnd(){if(precisionAt===null)return false;const age=clockT-precisionAt;precisionAt=null;aimMarker.visible=false;if(age<.22)return quickRail();const target=makeAnchor(targetSurface());if(!target){say('AIM AT A CLEAR SURFACE');return false;}return deploy.start([target],false);}
'''+s[end:]
marker=' function lifecycle(why){';s=s.replace(marker,' function lifecycle(why){deploy.cancel(why);pendingAnchor=null;'+s.split(marker,1)[1][:0],1) if False else s.replace(marker,' function lifecycle(why){deploy.cancel(why);',1)
marker='  const f=frame();drive.update(dt,f);';assert marker in s;s=s.replace(marker,"  if(backspoolCombat.staggered()||backspoolCombat.activeAction())deploy.cancel('COMBAT INTERRUPT');deploy.update(dt);drawProjectiles();\n"+marker,1)
# Upper-body source sampling runs after ordinary locomotion, preserving hips and planted legs.
marker='function afterPose(dt){if(!enabled()||!gameActive)return;'
assert marker in s
s=s.replace(marker,marker+'applyCartridgePose();',1)
s=s.replace('motion:{position:plain(s.pos)', 'deployment:deploy.state(),motion:{position:plain(s.pos)',1)
# Keep existing validated endpoint creation and attach code; invoke only after real collisions.
marker=' function quickRail(){';hook=''' const cartridgeMeshes=Array.from({length:2},()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.19,8),new THREE.MeshStandardMaterial({color:0x62818a,emissive:0x1e8696,emissiveIntensity:.7,roughness:.55}));m.visible=false;m.name='Threadrail / thrown cartridge';scene.add(m);return m;});
 const deploy=createCartridgeDeployment({valid:validAnchor,hand:index=>{const bone=model?.getObjectByName(index?'mixamorigLeftHand':'mixamorigRightHand');return bone?plain(bone.getWorldPosition(new THREE.Vector3())):null;},sweep:(a,b,target)=>{
  const from=V(a),to=V(b),delta=to.clone().sub(from),length=delta.length();if(length<1e-8)return{};const ray=new THREE.Ray(from,delta.normalize());let nearest=null;
  for(const c of allColliders(from,to)){if(c.owner?.destroyed)continue;const p=ray.intersectBox(c.box,new THREE.Vector3());if(p&&p.distanceTo(from)<=length+.015&&(!nearest||p.distanceTo(from)<nearest.distance))nearest={point:p,distance:p.distanceTo(from),owner:c.owner||c};}
  if(from.y>=0&&to.y<=0&&delta.y<0){const t=(-from.y)/delta.y,p=from.clone().addScaledVector(delta,t);if(!nearest||p.distanceTo(from)<nearest.distance)nearest={point:p,distance:p.distanceTo(from),owner:ground};}
  if(!nearest)return{};return nearest.point.distanceTo(V(target.contact))<.24?{target:true}:{blocked:true};
 },impact:(target,index)=>{say('CARTRIDGE '+(index?'B':'A')+' ATTACHED');},complete:(targets,auto)=>{
  if(targets.length===1){if(!pendingAnchor){pendingAnchor=targets[0];say('POINT A ATTACHED · AIM B');return;}targets=[pendingAnchor,targets[0]];}
  const made=createConnection(targets[0],targets[1]);pendingAnchor=null;if(made&&auto&&bestNearbyRail()?.id===made.id)attach(made.id);
 }});
 function applyCartridgePose(){
  const state=deploy.state(),shot=state.shots.find(x=>state.clock>=x.releaseAt-.16&&state.clock<x.releaseAt+.18);if(!shot||!model)return;
  const spec=window.backspoolFlowRoles?.roles.find(r=>r.role==='tether'),clip=spec&&clips[spec.id];if(!clip)return;
  const age=state.clock-(shot.releaseAt-.16),weight=Math.min(1,age/.06,(.34-age)/.08),time=(spec.start||0)+age;
  for(const track of clip.tracks){if(!/mixamorig(Right|Left)(Shoulder|Arm|ForeArm|Hand)\\.quaternion$/.test(track.name))continue;
   const bone=model.getObjectByName(track.name.split('.')[0]);if(!bone)continue;const sample=track.createInterpolant().evaluate(time),target=new THREE.Quaternion().fromArray(sample);bone.quaternion.slerp(target,Math.max(0,weight));
  }model.updateMatrixWorld(true);
 }
 function drawProjectiles(){const shots=deploy.state().shots;for(let i=0;i<2;i++){const shot=shots[i],m=cartridgeMeshes[i];m.visible=enabled()&&!!shot?.position;if(m.visible)m.position.copy(V(shot.position));}}
'''
s=s.replace(marker,hook+marker,1)
# Draw lifecycle must remove meshes immediately; a paused frame never updates deployment.
s=s.replace('deploy.cancel(why);setSprint','deploy.cancel(why);cartridgeMeshes.forEach(m=>m.visible=false);setSprint',1)
# A visible stitch advances only after both physical impacts; no rideable cable yet.
s=s.replace(" function drawProjectiles(){const shots=deploy.state().shots;", """ const formingGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);const formingLine=new THREE.Line(formingGeometry,new THREE.LineBasicMaterial({color:0x8ce9f2,transparent:true,opacity:.8}));formingLine.frustumCulled=false;formingLine.visible=false;scene.add(formingLine);
 function drawProjectiles(){const deployment=deploy.state(),shots=deployment.shots;formingLine.visible=enabled()&&deployment.status==='deploying'&&deployment.tensionAt!==null&&shots.length===2;if(formingLine.visible){const a=V(shots[0].target.contact),b=V(shots[1].target.contact);formingGeometry.setFromPoints([a,a.clone().lerp(b,deployment.tensionProgress)]);} """,1)
s=s.replace("deploy.cancel(why);cartridgeMeshes.forEach", "deploy.cancel(why);formingLine.visible=false;cartridgeMeshes.forEach",1)
# Mastery remains subordinate to the validated rail solver.
s=s.replace("const threadrailGame=(()=>{",(root/'scripts/game_rail_mastery.js').read_text()+"\nconst threadrailGame=(()=>{",1)
s=s.replace(" const rail=createThreadrail("," const mastery=createRailMastery();\n const rail=createThreadrail(",1)
s=s.replace("say('THREADRAIL READY');drawRails();return result.rail;","const authored=mastery.register(result.rail,a,b);say(authored.construction+' '+authored.family.toUpperCase());drawRails();return result.rail;",1)
s=s.replace("function attach(id){if(!movementReady())", "function attach(id){const incoming=s.vel.clone(),near=bestNearbyRail();if(!movementReady())",1)
s=s.replace("handoff('THREADRAIL HANDOFF');", "const seg=rail.state().rails.find(r=>r.id===id);const caught=mastery.catchRail(id,plain(incoming),seg.tangent,near?.distance||0);say(caught.grade+' CATCH');handoff('THREADRAIL HANDOFF');",1)
s=s.replace("const result=jump?rail.jump(frame(),{slingshot:true}):rail.detach('PLAYER DETACH');", "const current=rail.state().current,segment=rail.state().rails.find(r=>r.id===current.railId),pop=jump?mastery.pop(current,segment):null;const result=jump?rail.jump(frame(),{slingshot:true}):rail.detach('PLAYER DETACH');if(pop){result.velocity=plain(V(result.velocity).multiplyScalar(pop.retention));say(pop.grade+' RAIL POP');}",1)
s=s.replace("(!best||distance<best.distance)","(!best||score>best.score)",1)
s=s.replace("if(distance<=reach&&clear(s.pos,point)","const score=mastery.scoreCandidate({distance,intent:frame().direction,velocity:plain(s.vel),tangent:r.tangent,height:point.y-s.pos.y});if(distance<=reach&&clear(s.pos,point)",1)
s=s.replace("best={id:r.id,distance};","best={id:r.id,distance,score};",1)
s=s.replace("deployment:deploy.state(),motion:","mastery:mastery.state(),deployment:deploy.state(),motion:",1)
s=s.replace('<title>','<title>Threadrail fusion pilot — ',1);target=root/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V4.html';target.write_text(s);out=root/'output/legacy-threadrail';out.mkdir(exist_ok=True);(out/'build.json').write_text(json.dumps({'base':base.name,'baseSha256':hashlib.sha256(base.read_bytes()).hexdigest(),'candidate':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2)+'\n');print(target)
