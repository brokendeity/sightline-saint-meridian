// Measures cape mesh vertices inside the arm capsules (upper arm, forearm, hand) while Kinsmoke runs (real W input).
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2];const OPTS=process.argv[3]||'{}';
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await (await b.newContext({viewport:{width:900,height:700}})).newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');}catch(e){}});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','kinsmoke');await p.waitForFunction(()=>characterState().hero==='kinsmoke'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});
await p.evaluate(o=>{window.requestAnimationFrame=()=>0;const c=kinsmokeHero.cloth();Object.assign(c.options,JSON.parse(o));},OPTS);
await p.evaluate(()=>{window.__push=!!kinsmokeHero.armPush;for(let i=0;i<120;i++){tickFrame(1/60,false);renderNight(1/60);}});
await p.keyboard.down('w');
const r=await p.evaluate(()=>{
 const m=kinsmokeHero.capeBones();let cape=null;m.traverse(o=>{if(o.name==='KinsmokeCape'&&!o.userData.toonOutline)cape=o;});
 const g=cape.geometry,pos=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=cape.skeleton.bones;
 const segs=[['LeftArm','LeftForeArm',1.0],['LeftForeArm','LeftHand',1.0],['LeftHand','LeftHandMiddle3',1.3],['RightArm','RightForeArm',1.0],['RightForeArm','RightHand',1.0],['RightHand','RightHandMiddle3',1.3]];
 const H=1.82,rad={LeftArm:.0394,RightArm:.0412,LeftForeArm:.0296,RightForeArm:.0302,LeftHand:.03,RightHand:.03};
 const v=new THREE.Vector3(),a=new THREE.Vector3(),bb=new THREE.Vector3(),ab=new THREE.Vector3(),q=new THREE.Vector3();
 let frames=0,worstCount=0,sumCount=0,byBone={},maxDepth=0;
 for(let f=0;f<90;f++){tickFrame(1/60,false);renderNight(1/60);if(f<30||f%3)continue;frames++;
  cape.updateMatrixWorld(true);const S=segs.map(([x,y,k])=>{const A=m.getObjectByName('mixamorig'+x),B=m.getObjectByName('mixamorig'+y);return A&&B?[A.getWorldPosition(new THREE.Vector3()),B.getWorldPosition(new THREE.Vector3()),rad[x]*H*k,x]:null;}).filter(Boolean);
  let cnt=0;
  for(let i=0;i<pos.count;i+=2){v.fromBufferAttribute(pos,i);cape.boneTransform(i,v);if(window.__push)kinsmokeHero.armPush().pushLocal(v);v.applyMatrix4(cape.matrixWorld);
   for(const [A,B,R,segName] of S){ab.subVectors(B,A);const t=Math.max(0,Math.min(1,v.clone().sub(A).dot(ab)/ab.lengthSq()));q.copy(A).addScaledVector(ab,t);const d=q.distanceTo(v);
    if(d<R){cnt++;maxDepth=Math.max(maxDepth,R-d);let best=0,bi=0;for(let k=0;k<4;k++){if(sw.array[i*4+k]>best){best=sw.array[i*4+k];bi=si.array[i*4+k];}}const n=bones[bi].name;byBone[n+'@'+segName]=(byBone[n+'@'+segName]||0)+1;break;}}}
  worstCount=Math.max(worstCount,cnt);sumCount+=cnt;}
 return {frames,sampledVerts:Math.ceil(pos.count/2),meanInside:+(sumCount/frames).toFixed(1),worstInside:worstCount,maxDepthM:+maxDepth.toFixed(3),byChain:byBone,speed:+Math.hypot(s.vel.x,s.vel.z).toFixed(1)};});
console.log(JSON.stringify(r));await b.close();})();
