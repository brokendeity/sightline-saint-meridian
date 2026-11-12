// In-game front captures of Kinsmoke's idle: the build's own idle, then candidate idles retargeted live onto him.
// argv: OUT BUILD CANDIDATES_JSON  where a candidate = [label, pack('run'|'nat'), clipId, rest('lo'|'bs'), times[]]
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const OUT=process.argv[2];const BUILD=process.argv[3];
const CANDS=JSON.parse(process.argv[4]||'[]');
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await b.newContext({viewport:{width:900,height:1100}}),p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');}catch(e){}});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','kinsmoke');await p.waitForFunction(()=>characterState().hero==='kinsmoke'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});
await p.evaluate(()=>{window.requestAnimationFrame=()=>0;const st=document.createElement('style');st.textContent='body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(st);});
const snap=async(name,dist,cy,h)=>{const m=await p.evaluate(([dist,cy,h])=>{model.updateMatrixWorld(true);const g=n=>model.getObjectByName('mixamorig'+n).getWorldPosition(new THREE.Vector3());const d=g('LeftArm').sub(g('RightArm')).cross(new THREE.Vector3(0,1,0));d.y=0;d.normalize();
 const c=s.pos.clone().add(new THREE.Vector3(0,cy,0));camera.position.copy(c).addScaledVector(d,dist);camera.fov=h;camera.aspect=900/1100;camera.updateProjectionMatrix();camera.lookAt(c);renderNight(0);
 // measurements: head yaw vs chest yaw, arm abduction, shoulder drop
 const fw=(a,b)=>{const v=g(a).sub(g(b)).cross(new THREE.Vector3(0,1,0));return Math.atan2(v.x,v.z)*57.3;};
 const hq=model.getObjectByName('mixamorigHead').getWorldQuaternion(new THREE.Quaternion()),cq=model.getObjectByName('mixamorigSpine2').getWorldQuaternion(new THREE.Quaternion());
 const rel=cq.clone().invert().multiply(hq);const e=new THREE.Euler().setFromQuaternion(rel,'YXZ');
 const abd=sd=>{const v=g(sd+'ForeArm').sub(g(sd+'Arm')).normalize();return Math.acos(-v.y)*57.3;};
 return {legsYaw:+fw('LeftUpLeg','RightUpLeg').toFixed(1),chestYaw:+fw('LeftArm','RightArm').toFixed(1),headVsChestYXZdeg:[e.y,e.x,e.z].map(v=>+(v*57.3).toFixed(1)),armAbd:[abd('Left'),abd('Right')].map(v=>+v.toFixed(1)),shoulderW:+g('LeftArm').distanceTo(g('RightArm')).toFixed(3),neckToShoulderY:+(g('Neck').y-(g('LeftArm').y+g('RightArm').y)/2).toFixed(3),elbowGap:+g('LeftForeArm').distanceTo(g('RightForeArm')).toFixed(3)};},[dist,cy,h]);
 console.log(name,JSON.stringify(m));await p.screenshot({path:OUT+'/'+name+'.png'});};
const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++){tickFrame(1/60,false);renderNight(1/60);}},n);
await step(120);await snap('current_full',3.6,.85,40);await snap('current_close',1.4,1.45,35);
await p.evaluate(async()=>{const ab=async u=>(await fetch(u)).arrayBuffer(),gz=async u=>JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await ab(u)))));
 const norm=s=>{s.updateMatrixWorld(true);let bx=new THREE.Box3().setFromObject(s);s.scale.setScalar(1.82/bx.getSize(new THREE.Vector3()).y);s.updateMatrixWorld(true);bx.setFromObject(s);const c=bx.getCenter(new THREE.Vector3());s.position.set(-c.x,-bx.min.y,-c.z);s.updateMatrixWorld(true);};
 const L=new THREE.FBXLoader();const [kb,lb,bb,run,nat]=await Promise.all([ab('assets/characters/kinsmoke/kinsmoke_caped_v7.fbx'),ab('assets/loadout/loadout_caped.fbx'),ab('assets/backspool/backspool.fbx'),gz('assets/loadout/runner/loadout_runner_clips.json.gz'),gz('assets/motion-library/native.json.gz')]);
 window.__src={k:L.parse(kb,'assets/characters/kinsmoke/'),lo:L.parse(lb,'assets/loadout/'),bs:L.parse(bb,'assets/backspool/'),run,nat};norm(__src.lo);norm(__src.bs);norm(__src.k);});
for(const [label,pack,id,rest,times] of CANDS){
 await p.evaluate(([pack,id,rest])=>{const facing=s=>{s.updateMatrixWorld(true);const l=s.getObjectByName('mixamorigLeftArm').getWorldPosition(new THREE.Vector3()),r=s.getObjectByName('mixamorigRightArm').getWorldPosition(new THREE.Vector3());const f=l.sub(r).cross(new THREE.Vector3(0,1,0));return Math.atan2(f.x,f.z);};
  mixer.stopAllAction();const K=__src.k;const src=__src[rest];src.rotation.y+=facing(K)-facing(src);src.updateMatrixWorld(true);
  const e=pack==='run'?__src.run.clips[id]:__src.nat.find(c=>c.id===id);const clip=MixamoRetarget.retargetClip(THREE.AnimationClip.parse(e.clip),src,K,{name:'kinsmoke_idle',inPlace:true});
  if(actions.kinsmoke_idle){mixer.uncacheAction(clips.kinsmoke_idle);delete actions.kinsmoke_idle;}clips.kinsmoke_idle=clip;currentAnim=null;currentAction=null;window.__cand=clip;},[pack,id,rest]);
 let prev=0;for(const t of times){await step(Math.max(1,Math.round((t-prev)*60)));prev=t;await snap(label+'_t'+t+'_full',3.6,.85,40);await snap(label+'_t'+t+'_close',1.4,1.45,35);}
}
await b.close();})();
