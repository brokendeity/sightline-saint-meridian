/* V02-only train adapter. The prior detailed/graybox/V1 entries stay immutable. */
window.verticalTransit=(()=>{
 const root=new THREE.Group();root.name='V02 scheduled transit';scene.add(root);
 const state={ready:false,loading:false,error:null,publicBoarding:false,cameraCollision:true,source:'Blender passenger cars and unchanged Hi3D lead car',limitations:[]};
 let controller,definition,assets;const cars=[],links=[],UP=new THREE.Vector3(0,1,0);
 const load=url=>new Promise((resolve,reject)=>new THREE.GLTFLoader().load(url,g=>resolve(g.scene),undefined,reject));
 function place(){
  const motion=controller.state();
  for(let i=0;i<cars.length;i++){
   const car=cars[i],d=motion.distance-i*controller.spacing,p=controller.pose(d);car.group.position.copy(p.position);car.group.lookAt(p.position.clone().add(p.tangent));car.group.updateMatrixWorld(true);
   for(const door of car.doors){const opening=door.userData.side==='left'?motion.door:0;
    // Plug doors move out of their frame before sliding past the sidewall.
    door.position.x=door.userData.homeX+(door.userData.side==='left'?-1:1)*.10*Math.min(1,opening*4);
    door.position.z=door.userData.homeZ+Math.max(0,(opening-.25)/.75)*door.userData.slideMetres;
   }
   for(const bogie of car.bogies){const q=controller.pose(d+bogie.userData.longitudinalOffset);q.position.y-=1.05;
    bogie.position.copy(car.group.worldToLocal(q.position));
    const localTangent=q.tangent.clone().transformDirection(car.group.matrixWorld.clone().invert());bogie.rotation.y=Math.atan2(localTangent.x,localTangent.z);
   }
   for(const axle of car.axles)axle.rotation.x=-(motion.distance-car.initialDistance)/axle.userData.radius;
   car.group.updateMatrixWorld(true);
  }
  for(let i=0;i<links.length;i++){
   const a=cars[i].group.localToWorld(new THREE.Vector3(0,-.62,i===0?-7:-6.85)),b=cars[i+1].group.localToWorld(new THREE.Vector3(0,-.62,6.85)),delta=b.clone().sub(a),link=links[i];
   link.position.copy(a).add(b).multiplyScalar(.5);link.quaternion.setFromUnitVectors(UP,delta.clone().normalize());link.scale.set(1,delta.length(),1);
  }
  root.updateMatrixWorld(true);
 }
 async function build(){
  if(state.ready||state.loading||state.error)return;
  const host=verticalCity.transitHost?.();if(!host?.ready||!host.template||!window.verticalDistrictState?.().ready)return;
  state.loading=true;
  try{
   [definition,assets]=await Promise.all(['definition.json','assets.json'].map(file=>fetch('assets/city/vertical-v02/transit/'+file).then(r=>{if(!r.ok)throw Error(r.status+' '+file);return r.json();})));
   controller=createV02Transit(THREE,definition);
   const passenger=await load(assets.passenger.url);
   const trackModels=await Promise.all(assets.trackChunks.map(c=>load(c.url)));
   for(const track of trackModels){root.add(track);track.traverse(o=>{if(o.isMesh){o.userData.transitStatic=true;cameraObstacles.push(o);}});}
   for(let i=0;i<4;i++){
    const group=new THREE.Group(),model=i?passenger.clone(true):host.template.clone(true);group.name='V02 carriage '+i;
    if(!i)model.position.y=-1.6;
    group.add(model);root.add(group);const car={group,doors:[],bogies:[],axles:[],initialDistance:controller.state().distance-i*15};
    model.traverse(o=>{
     if(o.userData.transitRole==='slidingDoor'){o.userData={...o.userData,homeX:o.position.x,homeZ:o.position.z};car.doors.push(o);}
     if(o.userData.transitRole==='bogie')car.bogies.push(o);
     if(o.userData.transitRole==='wheelAxle')car.axles.push(o);
     if(o.isMesh){o.userData.transitDynamic=true;cameraObstacles.push(o);}
    });cars.push(car);
   }
   const geometry=new THREE.CylinderGeometry(.10,.10,1,8),material=new THREE.MeshStandardMaterial({color:0x172633,metalness:.8,roughness:.4});
   for(let i=0;i<3;i++){const link=new THREE.Mesh(geometry,material);link.name='V02 articulated coupling '+i;root.add(link);links.push(link);cameraObstacles.push(link);}
   state.ready=true;state.loading=false;state.limitations=[...definition.limitations];place();
  }catch(error){state.error=String(error);state.loading=false;console.error('V02 transit build failed',error);}
 }
 function tick(dt){if(!state.ready){build();return;}controller.advance(dt,gameActive);place();}
 function diagnostics(){return{...state,motion:controller?.state(),carriages:cars.map((c,i)=>({id:i,position:c.group.position.toArray(),quaternion:c.group.quaternion.toArray(),doors:c.doors.map(o=>({id:o.name,side:o.userData.side,position:o.position.toArray(),homeZ:o.userData.homeZ})),bogies:c.bogies.map(o=>({id:o.name,position:o.getWorldPosition(new THREE.Vector3()).toArray(),yaw:o.rotation.y})),wheelAngles:c.axles.map(o=>o.rotation.x)})),trackChunks:assets?.trackChunks.length||0};}
 window.verticalTransitState=()=>JSON.parse(JSON.stringify(diagnostics()));
 // Existing information boards consume this public interface. Preserve its
 // fields while reporting the replacement train rather than the retired host.
 const legacyCityState=window.verticalCityState;
 window.verticalCityState=()=>{const old=legacyCityState(),motion=controller?.state();return{...old,legacyTrain:old.train,train:state.ready,trainDistance:motion?.distance||0,
  trainService:motion?{phase:motion.phase,speed:motion.speed,publicBoarding:false}:null};};
 // Asset preparation must work while the start menu is paused. This timer only
 // observes readiness; movement remains exclusively on the simulation clock.
 const startup=setInterval(()=>{if(state.ready||state.error)clearInterval(startup);else build();},100);
 return{build,tick,state:window.verticalTransitState};
})();
