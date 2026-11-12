// ---------- player state ----------
const P={GROUND:'GROUND',AIM:'AIM',TAKEOFF:'TAKEOFF',TRANSIT:'TRANSIT',AIR:'AIR',UNCONTROLLED:'UNCONTROLLED',LANDING:'LANDING',IMPACT:'IMPACT'};
const s={hasFiredAir:false,mode:P.GROUND,pos:new THREE.Vector3(0,.42,0),vel:new THREE.Vector3(),yaw:0,pitch:-.08,onGround:true,groundY:.42,moveHeld:0,target:null,targetNormal:new THREE.Vector3(0,1,0),targetObj:null,transitTarget:null,transitNormal:new THREE.Vector3(),transitObj:null,queued:null,queuedNormal:null,queuedObj:null,takeoffTimer:0,stateTimer:0,brace:false,pressure:0,combo:0,score:0,aiming:false,railSpeed:190,uncontrolledTimer:0,lastGroundVy:0,railEntryDistance:100,activeRailSpeed:190,braceUsed:false,overloadTimer:0,overloadRecovery:0,pressureStage:0,railMeters:0,slingshotCount:0,lastVectorSpeed:0,redRailTimer:0};
const cam={yaw:0,pitch:-.08,targetYaw:0,targetPitch:-.08,shoulder:1,focus:new THREE.Vector3(0,1.6,0),shake:new THREE.Vector3(),shakeTarget:new THREE.Vector3()};
const cameraRaycaster=new THREE.Raycaster();cameraRaycaster.far=30;
const keys={w:false,a:false,s:false,d:false,shift:false,space:false,q:false,e:false,v:false,c:false};const mouse={r:false,l:false};

