// Cape vs arms while running (real W input): counts cape points that are inside an arm OR between an arm and the torso
// (where the arm would show through the cape) - before and after the v9 push (CPU copy of the shader push).
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');const BUILD=process.argv[2];
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const p=await (await b.newContext({viewport:{width:900,height:700}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error'||/shader|program/i.test(m.text()))console.log('CONSOLE',m.type(),m.text().slice(0,300));});
await p.addInitScript(()=>{try{localStorage.setItem('sightlineCharacter','sightline');}catch(e){}});
await p.goto('http://127.0.0.1:8768/'+BUILD);
await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&window.characterState&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-hero');await p.waitForTimeout(300);await p.selectOption('#characterChoice','kinsmoke');await p.waitForFunction(()=>characterState().hero==='kinsmoke'&&!characterState().busy,null,{timeout:300000});
await p.click('#v02Tab-overview');await p.click('#v02Start');await p.waitForFunction(()=>gameActive,null,{timeout:10000});
await p.evaluate(()=>{window.requestAnimationFrame=()=>0;for(let i=0;i<120;i++){tickFrame(1/60,false);renderNight(1/60);}});
await p.keyboard.down('w');
const r=await p.evaluate(()=>{const ap=kinsmokeHero.armPush();const m=kinsmokeHero.capeBones();let cape=null;m.traverse(o=>{if(o.name==='KinsmokeCape'&&!o.userData.toonOutline)cape=o;});
 const pos=cape.geometry.attributes.position,v=new THREE.Vector3();let frames=0,before=0,after=0,worstB=0,worstA=0;
 for(let f=0;f<120;f++){tickFrame(1/60,false);renderNight(1/60);if(f<30||f%3)continue;frames++;let nb=0,na=0;
  for(let i=0;i<pos.count;i+=2){v.fromBufferAttribute(pos,i);cape.boneTransform(i,v);if(ap.blocked(v)>=0)nb++;ap.pushLocal(v);if(ap.blocked(v)>=0)na++;}
  before+=nb;after+=na;worstB=Math.max(worstB,nb);worstA=Math.max(worstA,na);}
 return {frames,sampled:Math.ceil(pos.count/2),meanBlockedBeforePush:+(before/frames).toFixed(1),worstBefore:worstB,meanAfterPush:+(after/frames).toFixed(1),worstAfter:worstA,segments:ap.segments()};});
console.log(JSON.stringify(r));await b.close();})();
