// Profile of Kinsmoke's real arm mesh while running: for each arm segment and 10 bins along it, the max distance of the
// body's skinned vertices (those nearest that segment) from the bone axis. Real W input.
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2];
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await (await b.newContext({viewport:{width:900,height:700}})).newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');}catch(e){}});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','kinsmoke');await p.waitForFunction(()=>characterState().hero==='kinsmoke'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});
await p.evaluate(()=>{window.requestAnimationFrame=()=>0;for(let i=0;i<60;i++){tickFrame(1/60,false);renderNight(1/60);}});
await p.keyboard.down('w');
const r=await p.evaluate(()=>{
 const m=kinsmokeHero.capeBones();let body=null;m.traverse(o=>{if(o.name==='KinsmokeBody'&&o.isSkinnedMesh&&!o.userData.toonOutline)body=o;});
 const segs=[['LeftArm','LeftForeArm'],['LeftForeArm','LeftHand'],['LeftHand','LeftHandMiddle3'],['RightArm','RightForeArm'],['RightForeArm','RightHand'],['RightHand','RightHandMiddle3']];
 const pos=body.geometry.attributes.position,si=body.geometry.attributes.skinIndex,sw=body.geometry.attributes.skinWeight,bones=body.skeleton.bones;
 // vertices whose strongest bones are arm/hand bones
 const armIdx=[];for(let i=0;i<pos.count;i++){let best=0,bi=0;for(let k=0;k<4;k++){if(sw.array[i*4+k]>best){best=sw.array[i*4+k];bi=si.array[i*4+k];}}if(/Arm|Hand/.test(bones[bi].name)&&!/Shoulder/.test(bones[bi].name))armIdx.push(i);}
 const prof=segs.map(()=>new Array(10).fill(0));const v=new THREE.Vector3();
 for(let f=0;f<60;f++){tickFrame(1/60,false);renderNight(1/60);if(f<20||f%4)continue;body.updateMatrixWorld(true);
  const S=segs.map(([a,c])=>[m.getObjectByName('mixamorig'+a).getWorldPosition(new THREE.Vector3()),m.getObjectByName('mixamorig'+c).getWorldPosition(new THREE.Vector3())]);
  for(const i of armIdx){v.fromBufferAttribute(pos,i);body.boneTransform(i,v);v.applyMatrix4(body.matrixWorld);
   let best=1e9,bs=-1,bt=0;S.forEach(([A,B],j)=>{const ab=B.clone().sub(A);const t=Math.max(0,Math.min(1,v.clone().sub(A).dot(ab)/ab.lengthSq()));const d=A.clone().addScaledVector(ab,t).distanceTo(v);if(d<best){best=d;bs=j;bt=t;}});
   const k=Math.min(9,Math.floor(bt*10));prof[bs][k]=Math.max(prof[bs][k],best);}}
 const len=segs.map(([a,c])=>+m.getObjectByName('mixamorig'+a).getWorldPosition(new THREE.Vector3()).distanceTo(m.getObjectByName('mixamorig'+c).getWorldPosition(new THREE.Vector3())).toFixed(3));
 return {armVerts:armIdx.length,len,profile:segs.map((s,j)=>s.join('>')+': '+prof[j].map(x=>x.toFixed(3)).join(' '))};});
console.log(JSON.stringify(r,null,1));await b.close();})();
