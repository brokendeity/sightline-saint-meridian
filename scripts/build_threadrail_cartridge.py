from pathlib import Path
import re
R=Path(__file__).resolve().parents[1]
s=(R/'SIGHTLINE_BACKSPOOL_THREADRAIL_FUSION_V6.html').read_text()
s=s.replace('const threadrailGame=(()=>{',(R/'scripts/game_threadrail_cartridge_visuals.js').read_text()+'\nconst threadrailGame=(()=>{',1)
needle=' const mastery=createRailMastery();'
code='''
 const cartridgeVisuals=createThreadrailCartridgeVisuals(THREE,scene);let cartridgeClock=0;
 const cartridgeLineGeometry=new THREE.BufferGeometry();const cartridgeLineData=new Float32Array(78);cartridgeLineGeometry.setAttribute('position',new THREE.BufferAttribute(cartridgeLineData,3));const cartridgeFilament=new THREE.LineSegments(cartridgeLineGeometry,new THREE.LineBasicMaterial({color:0xc3f8ff,transparent:true,opacity:.86}));cartridgeFilament.frustumCulled=false;cartridgeFilament.visible=false;cartridgeFilament.name='ThreadExit socket filament';scene.add(cartridgeFilament);
 function cartridgeHandPose(index){const side=index?'Left':'Right',hand=model?.getObjectByName('mixamorig'+side+'Hand'),hips=model?.getObjectByName('mixamorigHips');if(!hand||!hips)return null;const wrist=hand.getWorldPosition(new THREE.Vector3()),outward=wrist.clone().sub(hips.getWorldPosition(new THREE.Vector3()));outward.y=.15;outward.normalize();const middle=model.getObjectByName('mixamorig'+side+'HandMiddle1'),indexFinger=model.getObjectByName('mixamorig'+side+'HandIndex1'),pinky=model.getObjectByName('mixamorig'+side+'HandPinky1');const fingers=middle?middle.getWorldPosition(new THREE.Vector3()).sub(wrist).normalize():new THREE.Vector3(0,1,0).applyQuaternion(hand.getWorldQuaternion(new THREE.Quaternion()));let normal=outward.clone();if(indexFinger&&pinky){const across=indexFinger.getWorldPosition(new THREE.Vector3()).sub(pinky.getWorldPosition(new THREE.Vector3()));normal=fingers.clone().cross(across).normalize();if(normal.dot(outward)<0)normal.negate();}const position=wrist.clone().addScaledVector(fingers,.08).addScaledVector(normal,.035);return{position,normal};}
 function cartridgeContact(a){return a.contact?V(a.contact):V(a.position).addScaledVector(V(a.normal),a.normal.y>.5?-.44:-.72);}
 function drawCartridgeAssets(){
  devices.visible=false;pendingDevice.visible=false;formingLine.visible=false;cartridgeMeshes.forEach(m=>m.visible=false);cable.visible=false;
  const dt=Math.max(0,clockT-cartridgeClock);cartridgeClock=clockT;cartridgeVisuals.begin(dt);let vertices=0;
  const line=(a,b)=>{if(vertices+6>cartridgeLineData.length)return;cartridgeLineData.set([a.x,a.y,a.z,b.x,b.y,b.z],vertices);vertices+=6;};
  if(enabled()&&gameActive&&cartridgeVisuals.isReady()){const st=rail.state(),dep=deploy.state(),pairs=new Map();for(const r of st.rails){if(!pairs.has(r.a))pairs.set(r.a,'A');if(!pairs.has(r.b))pairs.set(r.b,'B');}
   for(const a of st.anchors){if(!validAnchor(a))continue;const normal=V(a.normal).normalize(),position=cartridgeContact(a).addScaledVector(normal,.01);cartridgeVisuals.pose(String(a.id),position,normal,'anchored',pairs.get(a.id)||'A',camera.position);}
   if(pendingAnchor&&validAnchor(pendingAnchor)){const a=pendingAnchor,n=V(a.normal).normalize();cartridgeVisuals.pose(String(a.id),cartridgeContact(a).addScaledVector(n,.01),n,'anchored','A',camera.position);}
   const busy=new Set();for(const shot of dep.shots){if(dep.status!=='deploying')continue;if(pendingAnchor?.id===shot.target.id)continue;if(st.anchors.some(a=>a.id===shot.target.id)||dep.status!=='deploying'&&shot.status!=='attached')continue;const index=pendingAnchor?1:shot.index,pair=index?'B':'A';
    if(shot.status==='gesture'){if(dep.clock<shot.releaseAt-.16)continue;const hand=model?.getObjectByName(index?'mixamorigLeftHand':'mixamorigRightHand');if(hand){cartridgeVisuals.pose(String(shot.target.id),cartridgeHandPose(index).position,cartridgeHandPose(index).normal,'folded',pair,camera.position);busy.add(pair);}}
    else if(shot.position){const n=V(shot.target.normal).normalize(),position=shot.status==='attached'?cartridgeContact(shot.target).addScaledVector(n,.01):V(shot.position);cartridgeVisuals.pose(String(shot.target.id),position,n,shot.status==='attached'?'anchored':'flight',pair,camera.position);busy.add(pair);}
   }
   const hips=model?.getObjectByName('mixamorigHips');if(hips){const hip=hips.getWorldPosition(new THREE.Vector3()),rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s.yaw);for(const [pair,side]of [['A',-1],['B',1]]){const position=hip.clone().add(new THREE.Vector3(side*.18,-.025,.015).applyQuaternion(rotation)),normal=new THREE.Vector3(side,0,0).applyQuaternion(rotation);cartridgeVisuals.pose('belt-'+pair,position,normal,busy.has(pair)?'holder':'folded',pair,camera.position);}}
   for(const r of st.rails){const a=st.anchors.find(a=>a.id===r.a),b=st.anchors.find(a=>a.id===r.b);if(!a||!b)continue;const start=V(a.position).add(new THREE.Vector3(0,-.42,0)),end=V(b.position).add(new THREE.Vector3(0,-.42,0));line(cartridgeVisuals.socket(String(a.id),start),start);line(start,end);line(end,cartridgeVisuals.socket(String(b.id),end));}
   if(dep.status==='deploying'&&dep.tensionAt!==null&&(dep.shots.length===2||pendingAnchor)){const first=pendingAnchor||dep.shots[0].target,last=dep.shots.at(-1).target,a=cartridgeVisuals.socket(String(first.id),cartridgeContact(first)),b=cartridgeVisuals.socket(String(last.id),cartridgeContact(last));line(a,a.clone().lerp(b,dep.tensionProgress));}
  }
  cartridgeVisuals.end();cartridgeLineGeometry.setDrawRange(0,vertices/3);cartridgeLineGeometry.attributes.position.needsUpdate=true;cartridgeFilament.visible=vertices>0;
 }
 window.threadrailCartridgeState=()=>cartridgeVisuals.state();
'''
assert needle in s;s=s.replace(needle,needle+code,1)
s=s.replace("hand:index=>{const bone=model?.getObjectByName(index?", "hand:index=>{if(pendingAnchor)index=1;const bone=model?.getObjectByName(index?",1)
s=s.replace("return bone?plain(bone.getWorldPosition(new THREE.Vector3())):null;", "const heldPose=cartridgeHandPose(index);return heldPose?plain(heldPose.position):null;",1)
s=s.replace('function present(){devOverlay.update(', 'function present(){drawCartridgeAssets();devOverlay.update(',1)
s=s.replace('function lifecycle(why){snapback.cancel(why);','function lifecycle(why){cartridgeVisuals.reset();cartridgeFilament.visible=false;snapback.cancel(why);',1)
s=s.replace('snapback:snapback.state(snapFrame()),surf:', 'cartridgeAsset:cartridgeVisuals.state(),snapback:snapback.state(snapFrame()),surf:',1)
s=s.replace('<title>','<title>Tripo Cartridge — ',1)
(R/'SIGHTLINE_BACKSPOOL_CARTRIDGE.html').write_text(s)
# Reuse the exact locally bundled Three/GLTF loader, including their license headers.
scripts=re.findall(r'<script[^>]*>(.*?)</script>',s,re.S);vendor=R/'scripts/vendor';vendor.mkdir(exist_ok=True)
(vendor/'three-r128.js').write_text(scripts[1]);(vendor/'GLTFLoader-r128.js').write_text(scripts[4])
print(R/'SIGHTLINE_BACKSPOOL_CARTRIDGE.html')
