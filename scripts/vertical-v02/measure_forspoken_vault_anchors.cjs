/* Measures the lowest skinned point of the native Backspool mesh for each v18 vault window, in source seconds.
   Same anchor rule as traversal-source-segments.json: hips position held at its first key, every third vertex. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs');
const WINDOWS={'2811b690':2.67,'2811b68f':1.5,'2811b692':2.1,'2811b691':2.1,'2811b68d':1.8};
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});try{
 const entry=process.env.V02_ENTRY||'SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_STRIDES.html';
 const page=await browser.newPage({viewport:{width:640,height:400}});await page.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&!characterState().busy&&characterState().active==='backspool',null,{timeout:150000});
 const samples=await page.evaluate(async windows=>{window.requestAnimationFrame=()=>0;
  const bytes=new Uint8Array(await (await fetch('assets/backspool/traversal-source-vault-candidate.json.gz')).arrayBuffer()),pack=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(bytes))),out={},v=new THREE.Vector3();
  for(const [id,end] of Object.entries(windows)){
   // Parsed pack clips share no uuid, so each needs its own or the mixer reuses the first action.
   const clip=THREE.AnimationClip.parse(pack.find(e=>e.id==='traversal-source-'+id).clip);clip.uuid=THREE.MathUtils.generateUUID();
   for(const t of clip.tracks)if(t.name==='mixamorigHips.position')for(let i=0;i<t.values.length;i+=3)for(let k=0;k<3;k++)t.values[i+k]=t.values[k];
   mixer.stopAllAction();const action=mixer.clipAction(clip);action.play();action.paused=true;visualPivot.position.y=0;out[id]=[];
   for(let time=0;time<=end+1e-6;time+=1/60){action.time=time;mixer.update(0);characterRoot.updateMatrixWorld(true);let low=Infinity;
    model.traverse(o=>{if(!o.isSkinnedMesh||o.userData.toonOutline)return;o.skeleton.update();for(let j=0;j<o.geometry.attributes.position.count;j+=3){v.fromBufferAttribute(o.geometry.attributes.position,j);o.boneTransform(j,v);v.applyMatrix4(o.matrixWorld);low=Math.min(low,v.y);}});
    out[id].push({time:+time.toFixed(5),minimumY:+(low-visualPivot.getWorldPosition(new THREE.Vector3()).y).toFixed(5)});}
  }mixer.stopAllAction();return out;},WINDOWS);
 fs.writeFileSync('assets/backspool/forspoken-v18-vault-anchors.json',JSON.stringify({schema:'backspool-forspoken-v18-anchors',entry,timeUnit:'source seconds',rule:'lowest skinned vertex (every third) with hips position held at first key',samples},null,1)+'\n');
 // The committed h080 anchors were measured the same way; report the drift as a check on the method.
 const stored=JSON.parse(fs.readFileSync('assets/backspool/traversal-source-segments.json')).roles[0].visualAnchor;let worst=0;for(const s of samples['2811b68d']){const r=stored.reduce((a,b)=>Math.abs(b.time-s.time)<Math.abs(a.time-s.time)?b:a);worst=Math.max(worst,Math.abs(r.minimumY-s.minimumY));}
 console.log('Measured',Object.keys(samples).length,'windows; h080 drift from committed anchors',worst.toFixed(4),'m');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
