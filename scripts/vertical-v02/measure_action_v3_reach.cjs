/* Samples hand and foot positions of Backspool's own Mixamo combat clips on the native rig, for the v3 RT move builder.
   Hips are centred horizontally on the origin, as the builder does, so reach is measured from the actor. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs');
const NAMES=['left punch','hook with lead hand','body hook','heavy uppercut','jumping knee followed by punch','Mma Kick','Roundhouse Kick','Side Kick with back foot','back side kick','Flip Kick','butterfly kick','Flying Kick','Leg Sweep attack','Armada To Esquiva attack','Martelo 2 high kick','Martelo Do Chau Sem Mao attack','Chapa-Giratoria high kick','Inverted Double Kick To Kip Up attack','standing idle to fight stance','Action Idle To Fight Idle','guard up defence Pivot from front foot','defence guard up side step to the left','Standing Dodge Backward'];
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:8766/'+(process.env.V02_ENTRY||'SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_CROUCH.html')+'?capture=backspool');
 await page.waitForFunction(()=>typeof THREE!=='undefined'&&THREE.FBXLoader&&typeof fflate!=='undefined',null,{timeout:120000});
 const out=await page.evaluate(async names=>{
  const skin=new THREE.FBXLoader().parse(await (await fetch('assets/backspool/backspool.fbx')).arrayBuffer(),'assets/backspool/');skin.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(skin).getSize(new THREE.Vector3());skin.scale.setScalar(1.82/size.y);skin.updateMatrixWorld(true);
  const raw=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(await (await fetch('assets/backspool/animations-web.json.gz')).arrayBuffer()))));
  const bone=n=>{let f=null;skin.traverse(o=>{if(o.isBone&&o.name==='mixamorig'+n)f=o});return f};
  const B={hips:bone('Hips'),rightHand:bone('RightHand'),leftHand:bone('LeftHand'),rightFoot:bone('RightFoot'),leftFoot:bone('LeftFoot')};
  const mixer=new THREE.AnimationMixer(skin),res={},v=new THREE.Vector3();
  for(const name of names){const e=raw.find(x=>x.name===name);if(!e)throw Error('Missing native clip '+name);
   const clip=THREE.AnimationClip.parse(e.clip);clip.uuid=THREE.MathUtils.generateUUID();
   for(const t of clip.tracks)if(t.name==='mixamorigHips.position')for(let i=0;i<t.values.length;i+=3){t.values[i]=0;t.values[i+2]=0;}
   mixer.stopAllAction();mixer.clipAction(clip).reset().play();const rows=[];
   for(let t=0;t<=clip.duration+1e-6;t+=1/60){mixer.setTime(t);skin.updateMatrixWorld(true);const r={t:+t.toFixed(4)};for(const [k,b] of Object.entries(B)){b.getWorldPosition(v);r[k]=[+v.x.toFixed(3),+v.y.toFixed(3),+v.z.toFixed(3)];}rows.push(r);}
   res[name]={id:e.id,duration:clip.duration,rows};}
  return res;},NAMES);
 fs.writeFileSync('assets/backspool/action-v3-reach.json',JSON.stringify({schema:'backspool-action-v3-reach',rule:'world positions on the native rig at 1/60s, hips centred horizontally on the origin; +z is the rig forward',clips:out})+'\n');
 console.log('Measured',Object.keys(out).length,'native combat clips');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
