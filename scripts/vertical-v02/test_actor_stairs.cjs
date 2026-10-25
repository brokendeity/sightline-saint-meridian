/* Controlled NPC navigation probe: does not certify player input or a pursuit. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 const report={status:'FAIL',scope:'Actual loaded stair collision and support, controlled NPC-only navigation probe; not player route acceptance',entrySHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html'))).digest('hex'),cases:[],errors:[]};
 try{const p=await browser.newPage();p.on('pageerror',e=>report.errors.push(String(e)));
 await p.goto('http://127.0.0.1:8766/SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html?capture=backspool');
 await p.waitForFunction(()=>gameReady&&verticalDistrictState().ready&&roadNetworkState().ready,null,{timeout:120000});
 await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 for(const id of ['V2-VT-C','V2-VT-D'])for(const reverse of [false,true]){
  const result=await p.evaluate(({id,reverse})=>{
   const parts=verticalDistrictState().paths[id].segments,points=parts.flatMap(seg=>seg.points);if(reverse)points.reverse();
   const position=new THREE.Vector3(...points[0]);let frames=0,distance=0,maxRise=0;
   for(const targetArray of points.slice(1)){const target=new THREE.Vector3(...targetArray);for(let n=0;n<10000;n++){
    const delta=target.clone().sub(position);delta.y=0;if(delta.length()<.012)break;
    const next=position.clone().addScaledVector(delta.normalize(),Math.min(.045,Math.hypot(target.x-position.x,target.z-position.z)));
    if(!backspoolCombat.safeGroundMove(position,next,.38))return{id,reverse,passed:false,frames,position:position.toArray(),requested:next.toArray(),target:targetArray,distance,maxRise};
    maxRise=Math.max(maxRise,Math.abs(next.y-position.y));distance+=next.distanceTo(position);position.copy(next);frames++;
   }}
   return{id,reverse,passed:position.distanceTo(new THREE.Vector3(...points.at(-1)))<.03,frames,position:position.toArray(),distance,maxRise};
  },{id,reverse});report.cases.push(result);console.log(JSON.stringify(result));
 }
 report.negativeCases=await p.evaluate(()=>[
  {name:'solid wall cannot become a stair',from:[64,84,301.2],to:[64,84,299]},
  {name:'counter above step limit remains solid',from:[68,24,365],to:[71,24,365]},
  {name:'unsupported upper edge cannot become a teleport',from:[55,128,395],to:[49,128,395]}
 ].map(test=>({...test,rejected:!backspoolCombat.safeGroundMove(new THREE.Vector3(...test.from),new THREE.Vector3(...test.to),.38)})));
 assert(report.cases.every(c=>c.passed),'Native NPC stairs are blocked');assert(report.negativeCases.every(c=>c.rejected),'Unsafe actor route admitted');assert.deepEqual(report.errors,[]);report.status='PASS controlled actor stair ascent/descent and solid-wall/step/ledge rejection';
 }catch(e){report.failure=String(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(D,process.env.REPORT_NAME||'V02_Actor_Stairs.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
})();
