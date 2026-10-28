/* Exercise the shipped Gamepad API polling path. A labelled supported setup is
 * followed only by ordinary standard-gamepad axes and native simulation ticks.
 * This checks the route driver's radial inverse, not physical controller feel. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),E=path.join(D,'evidence/upper-anchor-controller-vector');fs.mkdirSync(E,{recursive:true});
const b=JSON.parse(fs.readFileSync(path.join(D,'V02_Upper_Anchor_Build.json'))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const report={status:'FAIL',entry:b.entry,entrySHA256:sha(path.join(R,b.entry)),testSHA256:sha(__filename),scope:'Native standard-gamepad polling, including diagonal radial deadzone. No physical controller certification.',cases:[],errors:[]};
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});let p;try{
 p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto('http://127.0.0.1:8766/'+b.entry+'?capture=backspool');
 await p.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&verticalDiffuseLightingState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:120000});
 await p.evaluate(()=>window.requestAnimationFrame=()=>0);await p.waitForTimeout(100);
 await p.evaluate(()=>{startGame(false);resetPlayer();clearInput();clearPad();s.pos.set(55,24.42,300);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;cam.pitch=cam.targetPitch=-.08;window.routePad={index:0,id:'V02 native radial-input check',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[routePad];for(let i=0;i<30;i++)tickFrame(1/60,false);});
 const cases=[[0,0],[.001,-.001],[-.001,.001],[.005,.003],[-.006,-.004],[.02,0],[0,-.02],[.1,.1],[.2,.2]];
 for(const [dy,dp]of cases){
  const magnitude=Math.hypot(dy,dp),factor=magnitude>.0004?(.10+.90*Math.min(1,magnitude*5))/magnitude:0;
  const axes=[-dy*factor,-dp*factor],gain=magnitude>.0004?Math.min(1,magnitude*5)/magnitude:0,expected=[-dy*gain,dp*gain];
  const actual=await p.evaluate(axes=>{routePad.axes[2]=axes[0];routePad.axes[3]=axes[1];tickFrame(1/60,false);return{x:input.actions.lookX,y:input.actions.lookY,mag:input.actions.lookMag};},axes);
  report.cases.push({dy,dp,axes,expected,actual});assert(Math.abs(actual.x-expected[0])<1e-6&&Math.abs(actual.y-expected[1])<1e-6,'Native radial input mismatch');assert(Math.abs(actual.mag-Math.hypot(...expected))<1e-6);
 }
 const oldAxes=[-.1-.9*.005,.1+.9*.005];
 report.reproducedOldDriver=await p.evaluate(axes=>{routePad.axes[2]=axes[0];routePad.axes[3]=axes[1];tickFrame(1/60,false);return{x:input.actions.lookX,y:input.actions.lookY};},oldAxes);
 assert(Math.abs(report.reproducedOldDriver.x+.005)>.02,'Prior diagonal overshoot must be demonstrated through native polling');
 await p.evaluate(()=>{routePad.axes=[0,0,0,0];for(let i=0;i<30;i++)tickFrame(1/60,false);renderNight(0);});await p.screenshot({path:path.join(E,'native-input.png')});assert.deepEqual(report.errors,[]);report.status='PASS native axis/diagonal/saturation input and reproduced prior driver overshoot';
}catch(e){report.failure=e.stack||String(e);console.error(e);process.exitCode=1;}finally{fs.writeFileSync(path.join(D,'V02_Upper_Anchor_Controller_Vector.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}})();
