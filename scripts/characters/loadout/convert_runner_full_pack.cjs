/* Converts EVERY clip of the Runner Action Animation Pack v1.7.2 (872 FBX clips: 484 in-place, 388 "_Root") onto
   Loadout's skeleton, in headless Chromium with the game's r128 FBX loader and scripts/game_humanoid_retarget.js.
   This is a new converter; convert_runner_clips.cjs and its 56-clip file stay as they are (the existing Loadout roles).

   Source: the FBX files extracted from the .unitypackage (a tar.gz of GUID folders; extract it yourself into an
   empty folder outside the repo and pass the folder that holds Animations/ and Models/). The pack is never copied
   into the repo; only the converted, quantised clip data is written.

   Per clip:
   - pose: every mapped bone's rotation (int16 quaternions) and the hips position, sampled at the clip's own 30 fps.
     The root node's tracks are held at their first frame first (the node rests at -90 degrees about X, so they cannot
     simply be removed), so a "_Root" clip's pose is relative to its root, like its in-place
     twin. Hips rise is capped at 4 cm in the pose; the rest of the rise is stored as "lift" for the movement owner.
   - root motion (clips with a moving root node, i.e. the _Root clips): per-frame travel in Loadout metres in the
     character's start frame (right, up, forward) and yaw in radians. Nothing in the clip moves the actor; the
     game's movement owner reads this track and sweeps it against the world.
   - lift: the pelvis rise above standing height (metres, Loadout scale) per frame; jumps keep their height there.
   - attacks: strike frame per limb (furthest reach ahead of the hips), as convert_runner_clips.cjs does.
   - a _Root clip whose pose equals its in-place twin's (quantised, every value within 2/32767) stores only its root
     track and points at the twin's pose ("poseOf").

   Output (default assets/loadout/runner/full/):
   - runner_full_index.json: every clip, its source path, GUID-free relative path, SHA256, duration, frames, speed,
     root-motion summary and where its pose lives.
   - runner_full_<part>.bin.gz: the poses of one pack part (P1..P6), little-endian. Each pose: int16 quaternions,
     frame-major (frames x bones x 4), then float32 hips position (frames x 3).
   Needs the game server on 127.0.0.1:8766 (python3 -m http.server 8766 --bind 127.0.0.1).
   Usage: node scripts/characters/loadout/convert_runner_full_pack.cjs <extractedPackDir> [unitypackagePath] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const PACK=process.argv[2];if(!PACK||!fs.existsSync(path.join(PACK,'Animations')))throw Error('Pass the extracted pack folder (holding Animations/ and Models/)');
const UNITYPACKAGE=process.argv[3]||'/Users/richardmpayi/Downloads/down assets/uni/Runner Action Animation Pack v1.7.2.unitypackage';
const OUTDIR=process.env.RUNNER_FULL_OUT||'assets/loadout/runner/full',REPORT=process.env.RUNNER_FULL_REPORT||'development/characters/loadout/runner/full_conversion.json';
const ONLY=process.env.RUNNER_FULL_ONLY?new RegExp(process.env.RUNNER_FULL_ONLY):null;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=[];(function scan(d){for(const e of fs.readdirSync(d,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){const f=path.join(d,e.name);if(e.isDirectory())scan(f);else{const m=e.name.match(/^CLazy@(.+)\.FBX$/i);if(m)files.push({name:m[1],file:path.relative(PACK,f)});}}})(path.join(PACK,'Animations'));
const names=new Set(files.map(f=>f.name));if(names.size!==files.length)throw Error('Duplicate clip names in pack');
const part=f=>f.file.split(path.sep)[1].match(/^(P\d)/)[1],family=f=>f.file.split(path.sep)[2];
const isAttack=n=>/^(J?Attack|Wp_|.*_Attack)/.test(n)||/Attack/.test(n);
const jobs=files.filter(f=>!ONLY||ONLY.test(f.name)).map(f=>({name:f.name,file:f.file.split(path.sep).join('/'),part:part(f),family:family(f),root:/_Root$/.test(f.name),twin:/_Root$/.test(f.name)&&names.has(f.name.replace(/_Root$/,''))?f.name.replace(/_Root$/,''):null,attack:isAttack(f.name)}));
console.log(files.length,'clips in pack;',jobs.length,'to convert');

(async()=>{const browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route('http://127.0.0.1:8766/__runner/**',r=>{const u=decodeURIComponent(new URL(r.request().url()).pathname.slice('/__runner/'.length));
  if(u==='convert.html')return r.fulfill({contentType:'text/html',body:['three-r128','fflate-r128','FBXLoader-r128'].map(s=>`<script src="/scripts/vendor/${s}.js"></script>`).join('')+'<script src="/scripts/game_humanoid_retarget.js"></script>'});
  const f=path.resolve(PACK,u);if(!f.startsWith(path.resolve(PACK)+path.sep))return r.fulfill({status:403});r.fulfill({body:fs.readFileSync(f)});});
 await p.goto('http://127.0.0.1:8766/__runner/convert.html');
 await p.evaluate(async()=>{
  const fbx=async url=>{const r=await fetch(url);if(!r.ok)throw Error('missing '+url);return new THREE.FBXLoader().parse(await r.arrayBuffer(),'');};
  window.__fbx=fbx;
  // Loadout exactly as the game normalises him: 1.82 m tall, feet on the floor, centred.
  const target=await fbx('/assets/loadout/loadout_caped.fbx');target.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(target);target.scale.setScalar(1.82/box.getSize(new THREE.Vector3()).y);target.updateMatrixWorld(true);
  box.setFromObject(target);const c=box.getCenter(new THREE.Vector3());target.position.set(-c.x,-box.min.y,-c.z);target.updateMatrixWorld(true);
  const rest=[];target.traverse(o=>{if(o.isBone)rest.push([o,o.position.clone(),o.quaternion.clone()]);});
  window.__target=target;window.__restore=()=>{for(const [o,p,q] of rest){o.position.copy(p);o.quaternion.copy(q);}target.updateMatrixWorld(true);};
  window.__source=await fbx('/__runner/Models/ClazyRunner.FBX');window.__source.updateMatrixWorld(true);
 });
 const index={},blobs={},stats={converted:0,poseShared:0,rootMotion:0};
 const BATCH=12;
 for(let i=0;i<jobs.length;i+=BATCH){
  const batch=jobs.slice(i,i+BATCH);
  const result=await p.evaluate(async batch=>{
   const V=THREE.Vector3,Q=THREE.Quaternion,target=window.__target,source=window.__source,B=n=>target.getObjectByName('mixamorig'+n);
   const l=B('LeftArm').getWorldPosition(new V()),r=B('RightArm').getWorldPosition(new V()),fwd=l.sub(r).cross(new V(0,1,0)).setY(0).normalize(),ft=Math.atan2(fwd.x,fwd.z);
   const right=new V().crossVectors(fwd,new V(0,1,0)).normalize();
   const sockets={leftHand:'LeftHand',rightHand:'RightHand',leftFoot:'LeftFoot',rightFoot:'RightFoot'};
   const sl=source.getObjectByName('upperarm_l'),sr=source.getObjectByName('upperarm_r');
   const b64=buf=>{let s='';const u=new Uint8Array(buf);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);};
   const out={};
   for(const job of batch){
    const anim=(await window.__fbx('/__runner/'+job.file)).animations[0];
    // The root node rests at -90 degrees about X and every clip's root track sets it upright, so its tracks are not
    // removed but held at their first frame: the pose is then relative to the root (no travel, no turn).
    const hold=t=>{const n=t.getValueSize(),v=Array.from(t.values.slice(0,n));return new t.constructor(t.name,[0,anim.duration],[...v,...v]);};
    const stripped=new THREE.AnimationClip(anim.name,anim.duration,anim.tracks.map(t=>/^root\.(position|quaternion)$/.test(t.name)?hold(t):t));
    const clip=HumanoidRetarget.retargetClip(stripped,source,target,{inPlace:true,sourceRootNode:'root',maxHipsRise:.04,name:'runner-'+job.name});
    const ratio=clip.userData.retarget.ratio,tracks=clip.tracks,quats=tracks.filter(t=>t instanceof THREE.QuaternionKeyframeTrack),hips=tracks.find(t=>t.name.endsWith('.position'));
    const frames=quats[0].times.length,times=Array.from(quats[0].times);
    const q16=new Int16Array(frames*quats.length*4);
    for(let f=0;f<frames;f++)quats.forEach((t,b)=>{for(let k=0;k<4;k++)q16[(f*quats.length+b)*4+k]=Math.round(Math.max(-1,Math.min(1,t.values[f*4+k]))*32767);});
    const hp=new Float32Array(hips.values);
    // Root travel, yaw and pelvis lift, sampled on the source with the original (unstripped) clip, in the facing
    // the retarget uses (source turned to face the target).
    const yaw0=source.rotation.y;source.updateMatrixWorld(true);
    const facing=(a,b)=>{const x=a.getWorldPosition(new V()),y=b.getWorldPosition(new V());const f=x.sub(y).cross(new V(0,1,0));return Math.atan2(f.x,f.z);};
    source.rotation.y=yaw0+(ft-facing(sl,sr));source.updateMatrixWorld(true);
    const rootNode=source.getObjectByName('root'),pelvis=source.getObjectByName('pelvis');
    const saved=[];source.traverse(o=>saved.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));
    const restPelvisY=pelvis.getWorldPosition(new V()).y-rootNode.getWorldPosition(new V()).y;
    const mixer=new THREE.AnimationMixer(source),action=mixer.clipAction(new THREE.AnimationClip(anim.name,anim.duration,anim.tracks.filter(t=>{const [n,prop]=t.name.split('.');return prop!=='scale'&&source.getObjectByName(n);})));
    action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
    const root=[],lift=[];let p0=null,q0=null,moved=0;
    for(const time of times){action.paused=false;action.enabled=true;mixer.setTime(time);source.updateMatrixWorld(true);
     const rp=rootNode.getWorldPosition(new V()),rq=rootNode.getWorldQuaternion(new Q());if(!p0){p0=rp.clone();q0=rq.clone();}
     const d=rp.clone().sub(p0).multiplyScalar(ratio),dq=q0.clone().invert().multiply(rq),fq=new V(0,0,1).applyQuaternion(rq),f0=new V(0,0,1).applyQuaternion(q0);
     const yaw=Math.atan2(f0.x*fq.z-f0.z*fq.x,f0.x*fq.x+f0.z*fq.z);
     root.push(+d.dot(right).toFixed(4),+d.y.toFixed(4),+d.dot(fwd).toFixed(4),+(-yaw).toFixed(5));moved=Math.max(moved,d.length(),Math.abs(yaw));
     lift.push(+Math.max(0,(pelvis.getWorldPosition(new V()).y-rp.y-restPelvisY)*ratio).toFixed(4));}
    action.stop();mixer.uncacheRoot(source);for(const [o,p,q,s] of saved){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}source.rotation.y=yaw0;source.updateMatrixWorld(true);
    const e={duration:anim.duration,frames,fps:frames>1?(frames-1)/anim.duration:30,ratio,bones:quats.map(t=>t.name.replace('.quaternion','')),hipsTrack:hips.name,
     q16:b64(q16.buffer),hips:b64(hp.buffer),lift,maxLift:+Math.max(...lift).toFixed(3)};
    if(moved>1e-3){const last=root.slice(-4),dist=Math.hypot(last[0],last[2]);e.root={travel:root,distance:+dist.toFixed(3),rise:+Math.max(...root.filter((_,i)=>i%4===1)).toFixed(3),yaw:last[3],speed:+(dist/Math.max(1e-6,anim.duration)).toFixed(3)};}
    if(job.attack){
     const clipR=clip,mixer2=new THREE.AnimationMixer(target),a2=mixer2.clipAction(clipR);a2.setLoop(THREE.LoopOnce,1);a2.clampWhenFinished=true;a2.play();const peaks={};
     for(let t=0;t<=clipR.duration+1e-6;t+=1/60){a2.paused=false;a2.enabled=true;mixer2.setTime(Math.min(t,clipR.duration));target.updateMatrixWorld(true);const h=B('Hips').getWorldPosition(new V());
      for(const [k,n] of Object.entries(sockets)){const reach=B(n).getWorldPosition(new V()).sub(h).dot(fwd);if(!peaks[k]||reach>peaks[k].reach)peaks[k]={time:+t.toFixed(4),reach:+reach.toFixed(4)};}}
     a2.stop();mixer2.uncacheRoot(target);window.__restore();const best=Object.entries(peaks).sort((a,b)=>b[1].reach-a[1].reach)[0];e.peaks=peaks;e.strike={socket:best[0],...best[1]};
    }
    out[job.name]=e;
   }
   return out;
  },batch);
  if(errors.length)throw Error('Page errors: '+errors.join(' | '));
  for(const job of batch){const e=result[job.name],abs=path.join(PACK,job.file);
   index[job.name]={part:job.part,family:job.family,source:job.file,sourceSha256:sha(fs.readFileSync(abs)),kind:job.root?'root':'inplace',twin:job.twin,attack:job.attack||undefined,
    duration:+e.duration.toFixed(4),frames:e.frames,fps:+e.fps.toFixed(3),maxLift:e.maxLift,lift:e.lift,root:e.root||null,strike:e.strike||undefined,peaks:e.peaks||undefined,_q16:e.q16,_hips:e.hips,_bones:e.bones,_hipsTrack:e.hipsTrack};
   stats.converted++;if(e.root)stats.rootMotion++;}
  process.stdout.write(`\r${Math.min(i+BATCH,jobs.length)}/${jobs.length}`);
 }
 console.log();
 // One bone order for the whole pack.
 const bones=index[jobs[0].name]._bones,hipsTrack=index[jobs[0].name]._hipsTrack;
 for(const [n,e] of Object.entries(index))if(e._bones.join()!==bones.join()||e._hipsTrack!==hipsTrack)throw Error('Bone order differs for '+n);
 // Share a _Root clip's pose with its in-place twin when they are equal after quantisation.
 for(const [n,e] of Object.entries(index)){if(!e.twin||!index[e.twin])continue;const a=Buffer.from(e._q16,'base64'),b=Buffer.from(index[e.twin]._q16,'base64');
  if(a.length!==b.length)continue;const A=new Int16Array(a.buffer,a.byteOffset,a.length/2),Bq=new Int16Array(b.buffer,b.byteOffset,b.length/2);let max=0;for(let i=0;i<A.length;i++)max=Math.max(max,Math.abs(A[i]-Bq[i]));
  const ha=Buffer.from(e._hips,'base64'),hb=Buffer.from(index[e.twin]._hips,'base64'),HA=new Float32Array(ha.buffer,ha.byteOffset,ha.length/4),HB=new Float32Array(hb.buffer,hb.byteOffset,hb.length/4);let hmax=0;for(let i=0;i<HA.length;i++)hmax=Math.max(hmax,Math.abs(HA[i]-HB[i]));
  e.poseDiff={q16:max,hips:+hmax.toFixed(4)};if(max<=2&&hmax<1e-3){e.poseOf=e.twin;stats.poseShared++;}}
 fs.mkdirSync(OUTDIR,{recursive:true});
 const parts={};
 for(const [n,e] of Object.entries(index)){if(e.poseOf)continue;const pt=parts[e.part]||(parts[e.part]={chunks:[],offset:0});const q=Buffer.from(e._q16,'base64'),h=Buffer.from(e._hips,'base64');
  e.pose={file:'runner_full_'+e.part+'.bin.gz',offset:pt.offset,q16Bytes:q.length,hipsBytes:h.length};pt.chunks.push(q,h);pt.offset+=q.length+h.length;}
 const files_={};
 for(const [k,pt] of Object.entries(parts)){const raw=Buffer.concat(pt.chunks),gz=zlib.gzipSync(raw,{level:9}),f='runner_full_'+k+'.bin.gz';fs.writeFileSync(path.join(OUTDIR,f),gz);files_[f]={rawBytes:raw.length,bytes:gz.length,sha256:sha(gz)};}
 for(const e of Object.values(index)){delete e._q16;delete e._hips;delete e._bones;delete e._hipsTrack;}
 const pkgSha=fs.existsSync(UNITYPACKAGE)?sha(fs.readFileSync(UNITYPACKAGE)):null;
 const data={schema:'loadout-runner-full-v1',pack:{name:'Runner Action Animation Pack v1.7.2',unitypackage:path.basename(UNITYPACKAGE),sha256:pkgSha,note:'Licensed Unity Asset Store pack; converted clip data for the game only. Do not publish this data on its own.'},
  target:{file:'assets/loadout/loadout_caped.fbx',sha256:sha(fs.readFileSync('assets/loadout/loadout_caped.fbx'))},retarget:{module:'scripts/game_humanoid_retarget.js',sha256:sha(fs.readFileSync('scripts/game_humanoid_retarget.js')),inPlace:true,sourceRootNode:'root',rootTracksStripped:true,maxHipsRise:.04},
  converter:'scripts/characters/loadout/convert_runner_full_pack.cjs',bones,hipsTrack,rootAxes:'travel per frame: [right, up, forward, yaw] in metres/radians, start frame of the character',files:files_,
  counts:{clips:Object.keys(index).length,inPlace:Object.values(index).filter(e=>e.kind==='inplace').length,root:Object.values(index).filter(e=>e.kind==='root').length,poseShared:stats.poseShared,withRootMotion:stats.rootMotion},clips:index};
 fs.writeFileSync(path.join(OUTDIR,'runner_full_index.json'),JSON.stringify(data));
 fs.mkdirSync(path.dirname(REPORT),{recursive:true});
 fs.writeFileSync(REPORT,JSON.stringify({counts:data.counts,files:files_,pack:data.pack,clips:Object.fromEntries(Object.entries(index).map(([n,e])=>[n,{source:e.source,kind:e.kind,twin:e.twin,duration:e.duration,frames:e.frames,speed:e.root?.speed??null,distance:e.root?.distance??null,yaw:e.root?.yaw??null,maxLift:e.maxLift,poseOf:e.poseOf||null,poseDiff:e.poseDiff||null,strike:e.strike||null}]))},null,1));
 console.log(JSON.stringify(data.counts),JSON.stringify(files_));
}finally{await browser.close();}})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
