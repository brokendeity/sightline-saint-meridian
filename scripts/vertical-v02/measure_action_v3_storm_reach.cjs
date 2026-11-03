/* Samples hand and foot positions of the NSUNSC Motion Library's Backspool-rig attack retargets, for the v3 RT chain extensions.
   Same rule as measure_action_v3_reach.cjs: native rig, 1/60 s, hips centred horizontally on the origin. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),zlib=require('zlib');
const FAMILIES=['2kks','2itc','2ssk','2tnd','2skr','2roc','1roc','2hnt','2nej'];
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:8766/'+(process.env.V02_ENTRY||'SIGHTLINE_SAINT_MERIDIAN_V02_MIXAMO_COMBAT.html')+'?capture=backspool');
 await page.waitForFunction(()=>typeof THREE!=='undefined'&&THREE.FBXLoader&&typeof fflate!=='undefined',null,{timeout:120000});
 const out=await page.evaluate(async families=>{
  const skin=new THREE.FBXLoader().parse(await (await fetch('assets/backspool/backspool.fbx')).arrayBuffer(),'assets/backspool/');skin.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(skin).getSize(new THREE.Vector3());skin.scale.setScalar(1.82/size.y);skin.updateMatrixWorld(true);
  const bone=n=>{let f=null;skin.traverse(o=>{if(o.isBone&&o.name==='mixamorig'+n)f=o});return f};
  const B={hips:bone('Hips'),rightHand:bone('RightHand'),leftHand:bone('LeftHand'),rightFoot:bone('RightFoot'),leftFoot:bone('LeftFoot')};
  const mixer=new THREE.AnimationMixer(skin),res={},v=new THREE.Vector3();
  for(const family of families){
   const pack=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await (await fetch('assets/motion-library/'+family+'.json.gz')).arrayBuffer()))));
   for(const e of pack){if(!/cm[ab]\d+$/.test(e.sourceAnimation||''))continue;
    const clip=THREE.AnimationClip.parse({...e.clip,name:e.id});clip.uuid=THREE.MathUtils.generateUUID();
    for(const t of clip.tracks)if(t.name==='mixamorigHips.position')for(let i=0;i<t.values.length;i+=3){t.values[i]=0;t.values[i+2]=0;}
    mixer.stopAllAction();mixer.clipAction(clip).reset().play();const rows=[];
    for(let t=0;t<=clip.duration+1e-6;t+=1/60){mixer.setTime(t);skin.updateMatrixWorld(true);const r={t:+t.toFixed(4)};for(const [k,b] of Object.entries(B)){b.getWorldPosition(v);r[k]=[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)];}rows.push(r);}
    res[e.id]={family,sourceAnimation:e.sourceAnimation,characterLabel:e.characterLabel,duration:clip.duration,rows};}}
  return res;},FAMILIES);
 fs.writeFileSync('assets/backspool/action-v3-storm-reach.json.gz',zlib.gzipSync(JSON.stringify({schema:'backspool-action-v3-storm-reach',source:'assets/motion-library/<family>.json.gz',rule:'world positions on the native rig at 1/60s, hips centred horizontally on the origin; +z is the rig forward',clips:out})));
 console.log('Measured',Object.keys(out).length,'library attack clips');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
