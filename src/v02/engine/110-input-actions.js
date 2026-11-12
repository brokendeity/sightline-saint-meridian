

const input={actions:{moveX:0,moveY:0,moveMag:0,lookX:0,lookY:0,lookMag:0,aim:false,brake:false,sprint:false}};
let pointer=false,gameActive=false,gameReady=false,lastInputMode='KEYBOARD / MOUSE',railRead=false,cameraShake=0,bannerTimer=0,dodgeCD=0;
const raycaster=new THREE.Raycaster(),center=new THREE.Vector2(0,0);raycaster.far=900;
const laserGeom=new THREE.BufferGeometry();laserGeom.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const laserMat=new THREE.LineBasicMaterial({color:0xff4a1a,transparent:true,opacity:0});const laser=new THREE.Line(laserGeom,laserMat);scene.add(laser);
const targetMarker=new THREE.Mesh(new THREE.RingGeometry(.6,.95,28),new THREE.MeshBasicMaterial({color:0xff4a1a,side:THREE.DoubleSide,transparent:true,opacity:0}));scene.add(targetMarker);
const trailGeom=new THREE.BufferGeometry();trailGeom.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3));const trailMat=new THREE.LineBasicMaterial({color:0x8a58ff,transparent:true,opacity:0});const trail=new THREE.Line(trailGeom,trailMat);scene.add(trail);
