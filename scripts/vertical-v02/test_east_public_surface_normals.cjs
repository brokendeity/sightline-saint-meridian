/* Read-only source hit comparison across deferred normal-adapter admission.
 * This is a geometric fixture test, separate from actual input route acceptance. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const b=JSON.parse(fs.readFileSync(path.join(D,'V02_East_Public_Room_Life_Build.json')));
const report={status:'FAIL',entrySHA256:sha(b.entry),manifestSHA256:sha(b.manifest),
 testSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),errors:[],
 scope:'Identical loaded source rays before/after normal orientation. Actual rail throws, catches and route completion are checked separately.'};
let browser,p,release;
async function queries(){return p.evaluate(()=>{
 const specs=[];
 for(let iy=0;iy<8;iy++)for(let iz=0;iz<8;iz++)specs.push({owner:'v02:momentum-landing',
  origin:[51.9,86.05,290.8],target:[70,91.55+iy*.05,314.6+iz*.12]});
 for(const id of ['momentum-landing','gallery-W-84-276','upper-anchor-ground-mount']){
  const c=verticalDistrict.colliders().find(c=>c.id===id);if(!c)continue;
  const centre=c.box.getCenter(new THREE.Vector3());
  for(const axis of ['x','y','z'])for(const sign of [-1,1]){
   const target=centre.clone(),origin=centre.clone();origin[axis]=(sign<0?c.box.min[axis]:c.box.max[axis])+sign*3;
   specs.push({owner:c.owner.id,origin:origin.toArray(),target:target.toArray()});
  }
 }
 return specs.map(spec=>{const origin=new THREE.Vector3(...spec.origin),direction=new THREE.Vector3(...spec.target).sub(origin).normalize();
  const hit=verticalDistrict.cartridgeSurface(new THREE.Ray(origin,direction),spec.owner,120);
  return{spec,hit:hit?{contact:hit.contact.toArray(),normal:hit.normal.toArray(),dot:hit.normal.dot(direction),
   owner:hit.owner.id,part:hit.part.id}:null};});
});}
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});p=await browser.newPage();
 p.on('pageerror',e=>report.errors.push(String(e)));
 const permit=new Promise(resolve=>release=resolve);
 await p.route('**/game_v02_surface_normals.js*',async route=>{await permit;await route.continue();});
 await p.goto('http://127.0.0.1:8766/'+b.entry+'?capture=backspool',{waitUntil:'commit'});
 await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&
  v02FacadeCassettesState().ready&&v02EastPublicLightingState().ready&&!characterState().busy,null,{timeout:120000});
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;gameActive=false;});await p.waitForTimeout(100);
 report.before=await queries();release();
 await p.waitForFunction(()=>window.v02SurfaceNormalsState,null,{timeout:30000});
 report.after=await queries();assert.equal(report.before.length,report.after.length);
 report.inwardBefore=report.before.filter(row=>row.hit&&row.hit.dot>0).length;
 for(let i=0;i<report.before.length;i++){
  const a=report.before[i],z=report.after[i];assert.deepEqual(a.spec,z.spec);assert.equal(!!a.hit,!!z.hit);
  if(!a.hit)continue;
  assert.deepEqual(a.hit.contact,z.hit.contact);assert.equal(a.hit.owner,z.hit.owner);assert.equal(a.hit.part,z.hit.part);
  assert(z.hit.dot<=1e-12);assert(Math.abs(Math.hypot(...z.hit.normal)-1)<1e-8);
  const expected=a.hit.dot>0?a.hit.normal.map(v=>-v):a.hit.normal;assert.deepEqual(z.hit.normal,expected);
 }
 report.state=await p.evaluate(()=>v02SurfaceNormalsState());assert(report.state.requests>=64);
 assert.deepEqual(report.errors,[]);
 report.status='PASS source contact/owner/miss conservation and incoming-ray-facing unit normals; actual input routes remain separate';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;}
finally{release?.();fs.writeFileSync(path.join(D,'V02_East_Public_Surface_Normals.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status,report.inwardBefore);}})();
