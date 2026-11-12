/* Converts the Runner Action Animation Pack clips that assets/loadout/runner/loadout_runner_roles.json names into
   clips on Loadout's own skeleton (scripts/game_humanoid_retarget.js), in headless Chromium with the game's r128
   FBX loader. The licensed pack stays where it is (default: the Unity sandbox project); only the converted clips are
   written, to assets/loadout/runner/loadout_runner_clips.json.gz, plus a report of speeds and strike frames.
   Needs the game server on 127.0.0.1:8766 (python3 -m http.server 8766 --bind 127.0.0.1).
   Usage: node scripts/characters/loadout/convert_runner_clips.cjs [packDir] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const PACK=process.argv[2]||'/Users/richardmpayi/Documents/sandbox/Assets/CLazyRunnerActionAnimPack';
// RUNNER_ROLES, RUNNER_OUT and RUNNER_REPORT redirect a trial conversion (for example to review candidate clips).
const ROLES=process.env.RUNNER_ROLES||'assets/loadout/runner/loadout_runner_roles.json',OUT=process.env.RUNNER_OUT||'assets/loadout/runner/loadout_runner_clips.json.gz',REPORT=process.env.RUNNER_REPORT||'development/characters/loadout/runner/conversion.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const index=new Map();(function scan(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())scan(f);else{const m=e.name.match(/^CLazy@(.+)\.FBX$/i);if(m)index.set(m[1],path.relative(PACK,f));}}})(path.join(PACK,'Animations'));
const roles=JSON.parse(fs.readFileSync(ROLES,'utf8'));
// A name ending in _Mirror is the named clip mirrored left to right.
const base=n=>n.replace(/_Mirror$/,'');
const wanted=[...new Set([...Object.values(roles.flow),...Object.values(roles.locomotion).map(l=>l.clip),...Object.values(roles.combat).flat(),
 ...Object.values(roles.directional||{}).flatMap(d=>Object.values(d)),...Object.values(roles.variants||{}).flat(),...Object.values(roles.defense||{}).map(d=>d.clip)])].sort();
const faceEnd=new Set(roles.faceEnd||[]);
const missing=wanted.filter(n=>!index.has(base(n)));if(missing.length)throw Error('Runner clips not found in pack: '+missing.join(', '));
const attacks=new Set(Object.values(roles.combat).flat()),loops=new Set(Object.values(roles.locomotion).map(l=>l.clip));
(async()=>{const browser=await chromium.launch({headless:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route('http://127.0.0.1:8766/__runner/**',r=>{const u=decodeURIComponent(new URL(r.request().url()).pathname.slice('/__runner/'.length));
  if(u==='convert.html')return r.fulfill({contentType:'text/html',body:['three-r128','fflate-r128','FBXLoader-r128'].map(s=>`<script src="/scripts/vendor/${s}.js"></script>`).join('')+'<script src="/scripts/game_humanoid_retarget.js"></script>'});
  const f=path.resolve(PACK,u);if(!f.startsWith(path.resolve(PACK)+path.sep))return r.fulfill({status:403});r.fulfill({body:fs.readFileSync(f)});});
 await p.goto('http://127.0.0.1:8766/__runner/convert.html');
 const jobs=wanted.map(name=>({name,file:index.get(base(name)),root:index.get(base(name)+'_Root')||null,mirror:name!==base(name),faceEnd:faceEnd.has(name),attack:attacks.has(name),loop:loops.has(name)}));
 const result=await p.evaluate(async jobs=>{
  const fbx=async url=>{const r=await fetch(url);if(!r.ok)throw Error('missing '+url);return new THREE.FBXLoader().parse(await r.arrayBuffer(),'');};
  // Loadout exactly as the game normalises him: 1.82 m tall, feet on the floor, centred.
  const target=await fbx('/assets/loadout/loadout_caped.fbx');target.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(target);target.scale.setScalar(1.82/box.getSize(new THREE.Vector3()).y);target.updateMatrixWorld(true);
  box.setFromObject(target);const c=box.getCenter(new THREE.Vector3());target.position.set(-c.x,-box.min.y,-c.z);target.updateMatrixWorld(true);
  const rest=[];target.traverse(o=>{if(o.isBone)rest.push([o,o.position.clone(),o.quaternion.clone()]);});
  const restore=()=>{for(const [o,p,q] of rest){o.position.copy(p);o.quaternion.copy(q);}target.updateMatrixWorld(true);};
  const source=await fbx('/__runner/Models/ClazyRunner.FBX');source.updateMatrixWorld(true);
  const B=n=>target.getObjectByName('mixamorig'+n);
  const l=B('LeftArm').getWorldPosition(new THREE.Vector3()),r=B('RightArm').getWorldPosition(new THREE.Vector3()),fwd=l.sub(r).cross(new THREE.Vector3(0,1,0)).setY(0).normalize();
  const sockets={leftHand:'LeftHand',rightHand:'RightHand',leftFoot:'LeftFoot',rightFoot:'RightFoot'};
  const out={};
  for(const job of jobs){
   const anim=(await fbx('/__runner/'+job.file)).animations[0];
   const clip=HumanoidRetarget.retargetClip(anim,source,target,{inPlace:true,sourceRootNode:'root',maxHipsRise:.04,mirror:job.mirror,faceEnd:job.faceEnd,name:'runner-'+job.name});
   const entry={source:job.file,mirror:job.mirror,faceEnd:job.faceEnd,duration:clip.duration,bones:clip.userData.retarget.bones,clip:clip.toJSON()};
   if(job.root){const rootAnim=(await fbx('/__runner/'+job.root)).animations[0];entry.rootSource=job.root;entry.speed=HumanoidRetarget.retargetClip(rootAnim,source,target,{name:'measure'}).userData.retarget.speed;}
   if(job.attack){
    // Strike frame per limb: when the hand or foot reaches furthest forward of the hips.
    const mixer=new THREE.AnimationMixer(target),action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();const peaks={};
    for(let t=0;t<=clip.duration+1e-6;t+=1/60){mixer.setTime(Math.min(t,clip.duration));target.updateMatrixWorld(true);const hips=B('Hips').getWorldPosition(new THREE.Vector3());
     for(const [k,n] of Object.entries(sockets)){const reach=B(n).getWorldPosition(new THREE.Vector3()).sub(hips).dot(fwd);if(!peaks[k]||reach>peaks[k].reach)peaks[k]={time:+t.toFixed(4),reach:+reach.toFixed(4)};}}
    action.stop();mixer.uncacheRoot(target);restore();
    entry.peaks=peaks;const best=Object.entries(peaks).sort((a,b)=>b[1].reach-a[1].reach)[0];entry.strike={socket:best[0],...best[1]};
   }
   out[job.name]=entry;
  }
  return out;
 },jobs);
 if(errors.length)throw Error('Page errors: '+errors.join(' | '));
 const clips={};for(const j of jobs){const e=result[j.name];e.sourceSha256=sha(fs.readFileSync(path.join(PACK,j.file)));if(j.root)e.rootSourceSha256=sha(fs.readFileSync(path.join(PACK,j.root)));clips[j.name]=e;}
 const data={schema:'loadout-runner-clips-v1',pack:roles.pack,target:{file:'assets/loadout/loadout_caped.fbx',sha256:sha(fs.readFileSync('assets/loadout/loadout_caped.fbx'))},
  retarget:{module:'scripts/game_humanoid_retarget.js',sha256:sha(fs.readFileSync('scripts/game_humanoid_retarget.js')),inPlace:true,sourceRootNode:'root',maxHipsRise:.04,fps:30},roles:{file:ROLES,sha256:sha(fs.readFileSync(ROLES))},clips};
 const gz=zlib.gzipSync(JSON.stringify(data),{level:9});fs.writeFileSync(OUT,gz);
 fs.mkdirSync(path.dirname(REPORT),{recursive:true});
 fs.writeFileSync(REPORT,JSON.stringify({output:OUT,outputSha256:sha(gz),bytes:gz.length,converter:path.relative(process.cwd(),__filename),clips:Object.fromEntries(Object.entries(clips).map(([k,e])=>[k,{source:e.source,duration:+e.duration.toFixed(3),bones:e.bones,speed:e.speed!=null?+e.speed.toFixed(3):null,strike:e.strike||null,peaks:e.peaks||null}]))},null,1));
 console.log(Object.keys(clips).length,'clips',(gz.length/1e6).toFixed(2),'MB ->',OUT);
 for(const [k,e] of Object.entries(clips))console.log(k.padEnd(26),e.duration.toFixed(2)+'s',e.bones+' bones',e.speed!=null?'speed '+e.speed.toFixed(2):'',e.strike?'strike '+e.strike.socket+'@'+e.strike.time:'');
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
