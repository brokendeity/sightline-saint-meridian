// Halo surveillance fleet: independent deterministic navigation, no combat actors.
const haloTrucks=(()=>{
 const fleet=[],root=new THREE.Group();root.name='Halo surveillance patrol';scene.add(root);
 const report={ready:false,error:null,count:0,stops:0,dimensions:{width:2.8,length:9,height:4},clearanceRejected:0};let seed=7319;const routes=new Map();
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const path=(points)=>{const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]));return{points,lengths,length:lengths[lengths.length-1]}};
 function point(p,d){let i=1;while(i<p.lengths.length-1&&p.lengths[i]<d)i++;const a=p.points[i-1],b=p.points[i],span=p.lengths[i]-p.lengths[i-1];return{position:a.clone().lerp(b,span?THREE.MathUtils.clamp((d-p.lengths[i-1])/span,0,1):0),direction:b.clone().sub(a).normalize()}}
 const laneById=id=>roadNetwork.lanes.find(l=>l.id===id),turnById=id=>roadNetwork.turns.find(t=>t.id===id);
 function occupied(t,truck){return streetAtmosphere.walkers.some(w=>{const e=roadNetwork.pedestrian.edges.find(e=>e.id===w.routeEdge);return e&&e.kind==='crosswalk'&&t.yieldToCrossings.includes(e.crossing)&&w.routeDistance>0.05&&w.routeDistance<e.length-.05})||fleet.some(other=>other!==truck&&other.turn&&other.turn.node===t.node)}
 function pose(t){const p=point(t.path,t.distance);t.group.position.copy(p.position);t.group.position.y=.014;t.group.rotation.y=Math.atan2(p.direction.x,p.direction.z);t.group.updateMatrixWorld(true);t.collider.box.copy(t.localBounds).applyMatrix4(t.group.matrixWorld);t.group.userData.collisionBounds=t.collider.box;}
 function truckClear(points){
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],direction=b.clone().sub(a).normalize(),right=new THREE.Vector3(-direction.z,0,direction.x),steps=Math.max(1,Math.ceil(a.distanceTo(b)));
   for(let n=0;n<=steps;n++){const p=a.clone().lerp(b,n/steps);for(const along of [-4.5,0,4.5])for(const across of [-1.4,0,1.4]){const corner=p.clone().addScaledVector(direction,along).addScaledVector(right,across);if(!roadNetwork.roadAt(corner.x,corner.z)||Math.hypot(corner.x,corner.z)<115.3)return false;}}
  }return roadNetwork.pathClear(points,1.4,true);
 }
 async function load(){try{
  await cityImportPromise;
  const gltf=await new Promise((resolve,reject)=>new THREE.GLTFLoader().load('assets/halo-transport/source/model.glb',resolve,undefined,reject));
  const aligned=new THREE.Group();aligned.add(gltf.scene);gltf.scene.rotation.y=.7646874313173176;aligned.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(aligned),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  // Normalize the diagonal source once, keeping the immutable export untouched.
  const template=new THREE.Group();template.add(aligned);aligned.position.set(-center.x,-bounds.min.y,-center.z);template.scale.set(2.8/size.x,4/size.y,9/size.z);template.updateMatrixWorld(true);
  report.normalizedBounds=new THREE.Box3().setFromObject(template).getSize(new THREE.Vector3()).toArray();template.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;o.userData.sharedAsset=true;}});
  const safeLanes=new Set(roadNetwork.lanes.filter(l=>l.active&&truckClear(l.points)).map(l=>l.id));
  for(const lane of roadNetwork.lanes){if(!safeLanes.has(lane.id))continue;routes.set(lane.id,lane.outgoing.map(turnById).filter(t=>t&&safeLanes.has(t.to)&&truckClear(t.points)));}
  let changed=true;while(changed){changed=false;for(const [id,turns] of routes){const valid=turns.filter(t=>routes.has(t.to));if(!valid.length){routes.delete(id);changed=true;}else routes.set(id,valid);}}
  report.clearanceRejected=roadNetwork.turns.length-[...routes.values()].reduce((sum,turns)=>sum+turns.length,0);
  const lanes=roadNetwork.lanes.filter(l=>routes.has(l.id)&&l.points[0].length()<750).sort((a,b)=>a.points[0].length()-b.points[0].length());
  const chosen=[];for(const lane of lanes){const p=lane.points[0];if(chosen.every(l=>l.points[0].distanceTo(p)>135))chosen.push(lane);if(chosen.length===10)break;}
  chosen.forEach((lane,i)=>{const group=template.clone(true);group.name='Halo surveillance truck '+(i+1);root.add(group);
   const collider={box:new THREE.Box3(),mesh:group};propColliders.push(collider);cameraObstacles.push(group);rayTargets.push(group);
   const t={id:i+1,group,collider,localBounds:new THREE.Box3(new THREE.Vector3(-size.x/2,0,-size.z/2),new THREE.Vector3(size.x/2,size.y,size.z/2)),lane,path:path(lane.points),distance:Math.min(30,lane.points[0].distanceTo(lane.points[1])*.3),speed:0,turn:null,waiting:null};fleet.push(t);pose(t);
  });report.ready=true;report.count=fleet.length;report.safeLanes=routes.size;report.safeTurns=[...routes.values()].reduce((n,t)=>n+t.length,0);
 }catch(e){report.error=String(e);console.warn('Halo truck asset unavailable',e)}}
 function tick(dt){if(!report.ready||!gameActive||dt<=0)return;dt=Math.min(dt,.1);
  for(const t of fleet){let stop=false,reason=null;
   if(!t.turn){const remaining=t.path.length-t.distance;
    const signal=roadNetwork.signalState(t.lane.endNode)[t.lane.signalGroup];
    if(remaining<18&&signal!=='green'){stop=true;reason='traffic signal';}
    const ahead=fleet.find(o=>o!==t&&o.lane===t.lane&&!o.turn&&o.distance>t.distance&&o.distance-t.distance<17);if(ahead){stop=true;reason='traffic spacing';}
    if(remaining<12){const options=routes.get(t.lane.id)||[];if(!t.nextTurn)t.nextTurn=options[Math.floor(random()*options.length)];if(t.nextTurn&&occupied(t.nextTurn,t)){stop=true;reason='crossing or junction';}}
   }
   // Yield to the player rather than driving straight through a grounded character.
   const ahead=point(t.path,Math.min(t.path.length,t.distance+9)).position;
   if(s.onGround&&s.pos.distanceTo(ahead)<5){stop=true;reason='pedestrian';}
   if(reason&&!t.waiting)report.stops++;t.waiting=reason;const cruise=Math.min(t.lane.speedLimit/3.6,8),lineDistance=Math.max(0,t.path.length-5.5-t.distance);const target=stop?(reason==='traffic signal'||reason==='crossing or junction'?Math.min(cruise,Math.sqrt(8*lineDistance)):0):cruise;t.speed=THREE.MathUtils.lerp(t.speed,target,Math.min(1,dt*(stop?8:1.5)));
   let advance=t.speed*dt;if(stop&&!t.turn)advance=Math.min(advance,Math.max(0,t.path.length-5.5-t.distance));t.distance+=advance;
   if(t.distance>=t.path.length){const overshoot=t.distance-t.path.length;if(t.turn){t.lane=laneById(t.turn.to);t.turn=null;t.path=path(t.lane.points);t.distance=overshoot;t.nextTurn=null;}else{const turn=t.nextTurn||turnById(routes.get(t.lane.id)?.[0]?.id);if(turn){t.turn=turn;t.path=path(turn.points);t.distance=overshoot;}else{t.distance=t.path.length-5.5;t.speed=0;}}}
   pose(t);
  }
 }
 function state(){return{...report,vehicles:fleet.map(t=>({id:t.id,lane:t.lane.id,turn:t.turn?.id||null,position:t.group.position.toArray(),speed:+t.speed.toFixed(2),waiting:t.waiting})),policeCombat:false};}
 return{load,tick,state,fleet,root,truckClear,routes};
})();
window.haloTruckState=()=>haloTrucks.state();
haloTrucks.load();
