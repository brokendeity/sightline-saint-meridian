/* Native controller approaches; actual six-bone rays against visible friendly
 * rigid meshes. Labelled starting fixture only, no camera writes after setup. */
const{openMarket,D}=require('./market_test_helpers.cjs'),{saveEvidence}=require('./evidence_io.cjs'),assert=require('assert/strict');
const report={status:'FAIL',cases:[],scope:'Native approach/settle and manual controller orbit at three aspect ratios; six exact rigid-mesh rays to animated body bones. Not a whole-game camera certification.'};
(async()=>{try{
 for(const viewport of (process.env.V02_CAMERA_BASELINE==='1'?[{width:430,height:932}]:[{width:430,height:932},{width:932,height:430},{width:1280,height:800}])){
  const sub={};const h=await openMarket(sub,{viewport});try{const{p,step,walking,capture}=h;
   const anchor=await p.evaluate(()=>verticalMarketState().civilians[0].position);
   await p.evaluate(point=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(point[0],point[1]+.42,point[2]-3.5);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);marketPad.axes=[0,0,0,0];s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.12;cam.focus.copy(s.pos).add(new THREE.Vector3(0,1.2,0));camera.position.copy(s.pos).add(new THREE.Vector3(1.35,2.4,4.24));camera.lookAt(cam.focus);camera.updateMatrixWorld(true);},anchor);await walking(true);
   const rows=[];
   async function sample(){return p.evaluate(()=>{
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const points=['Hips','Head','LeftHand','RightHand','LeftFoot','RightFoot'].map(name=>({name,point:model.getObjectByName('mixamorig'+name).getWorldPosition(new THREE.Vector3())}));
    const objects=[];for(const name of ['V02 suspended market / local civilian ownership','V02 public world life']){const root=scene.getObjectByName(name);if(root)for(const o of root.children){if(o.name.startsWith('Market resident /')||o.name==='Existing pedestrian visual')if(o.visible&&o.position.distanceTo(s.pos)<8)objects.push(o);}}
    const rays=points.map(({name,point})=>{const delta=point.clone().sub(camera.position),length=delta.length(),ray=new THREE.Raycaster(camera.position,delta.normalize(),0,length-.02);return{name,blocks:ray.intersectObjects(objects,true).filter(hit=>hit.object.visible).map(hit=>({name:hit.object.parent.name,distance:hit.distance}))};});
    const hud=document.querySelector('#flightVitals').getBoundingClientRect();
    const visible=points.map(({name,point})=>{const q=point.clone().project(camera),x=(q.x+1)*innerWidth/2,y=(1-q.y)*innerHeight/2;return{name,x,y,underVitals:x>=hud.left&&x<=hud.right&&y>=hud.top&&y<=hud.bottom};});
    return{visible,hero:s.pos.toArray(),camera:camera.position.toArray(),gap:Math.hypot(s.pos.x-verticalMarketState().civilians[0].position[0],s.pos.z-verticalMarketState().civilians[0].position[2]),health:100-courier.trauma,rays,framing:v02BodyFramingState(),planner:window.v02FriendlyCameraState?.(),yaw:cam.yaw,targetYaw:cam.targetYaw};
   });}
   for(let i=0;i<240;i++){await p.evaluate(t=>{const dx=t[0]-s.pos.x,dz=t[2]+2-s.pos.z,len=Math.hypot(dx,dz);marketPad.axes[0]=(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/len;marketPad.axes[1]=-(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/len;},anchor);await step();if(i%15===0)rows.push(await sample());}
   await p.evaluate(()=>marketPad.axes=[0,0,0,0]);await step(120);const settled=await sample();await capture('friendly-camera-'+viewport.width);
   const c={viewport,source:sub.civilianReadiness,settled,trace:rows};report.cases.push(c);
   assert(settled.gap>=.93&&settled.health===100);assert.equal(settled.framing.positionDelta,0,'Body framing became a second camera-position writer');
   if(process.env.V02_CAMERA_BASELINE!=='1'){
    assert(settled.visible.filter(p=>['Hips','Head'].includes(p.name)).every(p=>!p.underVitals),'Friendly shoulder composition hides body beneath vitals');
    assert(settled.rays.every(ray=>!ray.blocks.length),'Friendly mesh obstructs settled body '+JSON.stringify(settled.rays));
    const yawBefore=settled.yaw;await p.evaluate(()=>marketPad.axes[2]=.65);await step(45);await p.evaluate(()=>marketPad.axes[2]=0);await step(20);c.manualOrbit=await sample();assert(Math.abs(c.manualOrbit.yaw-yawBefore)>.2,'Planner prevented manual controller orbit');await capture('friendly-camera-orbit-'+viewport.width);
   }
   assert.deepEqual(sub.errors,[]);
  }finally{await h.browser.close();}
 }
 report.status=process.env.V02_CAMERA_BASELINE==='1'?'REPRODUCED original friendly mesh camera obstruction':'PASS native friendly camera visibility, unchanged body-position owner and manual orbit';
}catch(e){report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{saveEvidence(D,'V02_Friendly_Camera.json',report);console.log(report.status);}})();
