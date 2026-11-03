/* v18 vaults and climbs: jump into probe obstacles of known height with normal input; the graded segment plays and the move completes.
   Test setup only places a labelled probe box on the open plaza and the actor in front of it. */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),assert=require('assert/strict'),fs=require('fs');
const build=JSON.parse(fs.readFileSync('development/vertical-city-v02/'+(process.env.V02_ACTION_BUILD||'V02_Forspoken_Vaults_Build.json'))),BUILD=build.entry,OUT=process.env.V02_VAULTS_OUT||'development/vertical-city-v02/evidence/forspoken-vaults';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});const p=await b.newPage({viewport:{width:960,height:600}});
const errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.addInitScript(()=>navigator.getGamepads=()=>[]);
await p.goto('http://127.0.0.1:8766/'+BUILD+'?capture=backspool');
await p.waitForFunction(()=>gameReady&&!characterState().busy&&roadNetworkState().ready&&characterState().active==='backspool'&&window.backspoolTraversalSegments,null,{timeout:150000});
const X=30,Z=50;
const free=await p.evaluate(([X,Z])=>{window.requestAnimationFrame=()=>0;resetPlayer();clearInput();startGame(false);const g=supportHeight(X,Z,5);const lo=new THREE.Vector3(X-3,g+.05,Z-14),hi=new THREE.Vector3(X+3,g+3,Z+1);return{g,hits:allColliders(lo,hi).filter(c=>c.box.intersectsBox(new THREE.Box3(lo,hi))).map(c=>c.id||c.type||'?').slice(0,5),flat:[Z-12,Z-8,Z-4,Z].map(z=>+(supportHeight(X,z,g+2)-g).toFixed(3))}},[X,Z]);
assert.deepEqual(free.hits,[],'Probe area must be clear');
const cases=[['vault0.8',.8,.6,'vault','vault'],['vault1.15',1.15,.6,'vault','vaultHigh'],['climb0.8',.8,5,'climb','climbLow'],['climb1.2',1.2,5,'climb','climbMid'],['climb1.8',1.8,5,'climb','climbHigh']];
const results=[];
for(const [label,h,d,kind,segment] of cases){
 await p.evaluate(([X,Z,h,d,g])=>{clearInput();backspoolTraversal.reset('VAULT PROBE');backspoolFlow.reset('VAULT PROBE');for(const o of propColliders.filter(o=>o.type==='vault-probe'))propColliders.splice(propColliders.indexOf(o),1),scene.remove(o.mesh);
  const zf=Z-4,base=g-.42;const mesh=new THREE.Mesh(new THREE.BoxGeometry(5,h,d),new THREE.MeshStandardMaterial({color:0x335566}));mesh.position.set(X,base+h/2,zf-d/2);scene.add(mesh);
  propColliders.push({id:'vault-probe',type:'vault-probe',mesh,box:new THREE.Box3(new THREE.Vector3(X-2.5,base,zf-d),new THREE.Vector3(X+2.5,base+h,zf)),damageCount:0});
  s.pos.set(X,g+.42,Z);s.vel.set(0,0,0);s.yaw=cam.yaw=cam.targetYaw=0;s.onGround=true;setMode(P.GROUND);for(let i=0;i<70;i++)tickFrame(1/60,true);},[X,Z,h,d,free.g]);
 await p.keyboard.down('w');
 // Walk to about 1.3 m from the face, then press jump.
 for(let i=0;i<120;i++){const near=await p.evaluate(Z=>{tickFrame(1/60,true);return s.pos.z<Z-4+1.6+.0},Z);if(near)break;}
 await p.keyboard.press('Space');
 const rows=[];for(let f=0;f<130;f++){rows.push(await p.evaluate(()=>{tickFrame(1/60,true);const st=backspoolTraversalState();return{action:st.action,seg:st.pose?.segment||null,kind:st.pose?.kind||null,rise:st.pose?.rise,anim:currentAnim,y:s.pos.y,z:s.pos.z,ground:s.onGround,pivot:visualPivot.position.y}}));if(OUT&&[10,30,50,75].includes(f))await p.screenshot({path:`${OUT}/${label}-${f}.png`});}
 await p.keyboard.up('w');
 const used=rows.find(r=>r.kind);results.push({label,kind:used?.kind||null,segment:used?.seg||null,rise:used?.rise!=null?+used.rise.toFixed(2):null,anims:[...new Set(rows.map(r=>r.anim))].slice(0,6),endZ:+rows.at(-1).z.toFixed(2),endY:+(rows.at(-1).y-free.g-.42).toFixed(2),poseFrames:rows.filter(r=>r.kind).length});const r=results.at(-1);
 assert.equal(r.kind,kind,label+' admitted as '+kind);assert.equal(r.segment,segment,label+' plays '+segment);assert(Math.abs(r.rise-h)<.02,label+' rise measured');assert.equal(r.endY,kind==='climb'?+(h-.42).toFixed(2):-.42,label+' ends on the expected surface');console.log('PASS',label,segment);
}
assert.deepEqual(errors,[]);fs.writeFileSync(OUT+'/browser-results.json',JSON.stringify({entry:build.entry,entrySHA256:build.entrySHA256,testSHA256:require('crypto').createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Open plaza, keyboard walk and Jump into one labelled probe box per case. Segment selection and completion only; no visual certification.',results,errors},null,1));console.log('PASS graded vaults and climbs; no page errors');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
