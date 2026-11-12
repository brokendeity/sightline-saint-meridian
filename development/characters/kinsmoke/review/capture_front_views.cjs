// Steps like the game's own loop: tickFrame(1/60,false) then renderNight(1/60) every frame, so the cape cloth runs
// (it steps inside renderNight). Before 2026-11-10 this script called only tickFrame(..,false) and rendered with
// renderNight(0), so the cloth never stepped and every capture showed the RIGID cape swinging with his body.
// RIGID=1 reproduces that old behaviour. (Fixed again later on 2026-11-10: the first fix put renderNight after a
// brace-less for, so it ran once per batch of ticks and the cloth stepped only 1/60 s per batch.)
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const OUT=process.argv[2];
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const ctx=await b.newContext({viewport:{width:1400,height:1400}}),p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.addInitScript(rigid=>{window.__rigidCapture=rigid;try{localStorage.setItem('sightlineCharacter','sightline');localStorage.removeItem('backspoolCostume');}catch(e){}},process.env.RIGID==='1');
await p.goto('http://127.0.0.1:8768/'+(process.argv[3]||'SIGHTLINE_SAINT_MERIDIAN_V02_KINSMOKE.html'));
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','kinsmoke');await p.waitForFunction(()=>characterState().hero==='kinsmoke'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});
await p.evaluate(()=>{window.requestAnimationFrame=()=>0;const st=document.createElement('style');st.textContent='body>*:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}';document.head.appendChild(st);});
const snap=async(name,angle=0,dist=5.2)=>{await p.evaluate(([angle,dist])=>{model.updateMatrixWorld(true);const d=new THREE.Vector3();model.getWorldDirection(d);d.y=0;d.normalize();d.applyAxisAngle(new THREE.Vector3(0,1,0),angle);
 const c=s.pos.clone().add(new THREE.Vector3(0,.55,0));camera.position.copy(c).addScaledVector(d,dist).add(new THREE.Vector3(0,.25,0));camera.fov=40;camera.aspect=1;camera.updateProjectionMatrix();camera.lookAt(c);renderNight(0);},[angle,dist]);await p.screenshot({path:OUT+'/'+name+'.png'});};
await p.evaluate(()=>{for(let i=0;i<150;i++){tickFrame(1/60,false);if(!window.__rigidCapture)renderNight(1/60);}});
await snap('front-idle',0);await snap('front-idle-alt',Math.PI);await snap('threequarter-idle',.7);await snap('back-idle',Math.PI*0.999+0);
await p.keyboard.down('w');await p.evaluate(()=>{for(let i=0;i<70;i++){tickFrame(1/60,false);if(!window.__rigidCapture)renderNight(1/60);}});
// pick whichever side shows his face: model forward is his facing
await snap('front-running',0);await snap('front-running-alt',Math.PI);
await p.evaluate(()=>{for(let i=0;i<9;i++){tickFrame(1/60,false);if(!window.__rigidCapture)renderNight(1/60);}});await snap('front-running-2',0);await snap('threequarter-running',.8);await snap('side-running',Math.PI/2);
await p.keyboard.up('w');console.log('ok',await p.evaluate(()=>({speed:Math.hypot(s.vel.x,s.vel.z).toFixed(1),cloth:kinsmokeHero.state().cloth?.maxDisplacementM})));await b.close();})();
