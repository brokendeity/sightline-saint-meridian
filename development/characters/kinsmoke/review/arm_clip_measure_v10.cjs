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
 const pos=cape.geometry.attributes.position,idx=cape.geometry.index||{count:cape.geometry.attributes.position.count,getX:i=>i},v=new THREE.Vector3();let frames=0,before=0,after=0,worstB=0,worstA=0,triBad=0,triWorst=0;
 const P=new Float32Array(pos.count*3),P0=new Float32Array(pos.count*3);const dbg=[],bySeg={};const sc=new THREE.Vector3().setFromMatrixScale(cape.matrixWorld).x;
 for(let f=0;f<90;f++){tickFrame(1/60,false);renderNight(1/60);if(f<30||f%3)continue;frames++;let nb=0,na=0;
  for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);cape.boneTransform(i,v);P0[i*3]=v.x;P0[i*3+1]=v.y;P0[i*3+2]=v.z;if(i%2===0&&ap.blocked(v,0.35)>=0)nb++;ap.pushLocal(v);if(i%2===0&&ap.blocked(v,0.35)>=0)na++;P[i*3]=v.x;P[i*3+1]=v.y;P[i*3+2]=v.z;}
  // triangles after the push: centroid and edge midpoints (what the rasteriser fills between pushed vertices)
  let tb=0;const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),q=new THREE.Vector3();
  for(let t=0;t<idx.count;t+=3){const i0=idx.getX(t),i1=idx.getX(t+1),i2=idx.getX(t+2);a.fromArray(P,i0*3);b.fromArray(P,i1*3);c.fromArray(P,i2*3);
   let seg=-1;for(const pt of [q.copy(a).add(b).add(c).multiplyScalar(1/3).clone(),a.clone().add(b).multiplyScalar(.5),b.clone().add(c).multiplyScalar(.5),a.clone().add(c).multiplyScalar(.5)]){seg=ap.blocked(pt,0.35);if(seg>=0)break;}
   if(seg>=0){tb++;bySeg[ap.segments()[seg].from]=(bySeg[ap.segments()[seg].from]||0)+1;if(dbg.length<12){const L=[a.distanceTo(b),b.distanceTo(c),a.distanceTo(c)].map(x=>+(x*sc).toFixed(3));
     const W=x=>x.clone().applyMatrix4(cape.matrixWorld);const sg=ap.segments()[seg];const A=m.getObjectByName(sg.from).getWorldPosition(new THREE.Vector3()),B=m.getObjectByName(sg.to).getWorldPosition(new THREE.Vector3());
     const dist=x=>{const ab=B.clone().sub(A);const t=Math.max(0,Math.min(1,W(x).sub(A).dot(ab)/ab.lengthSq()));return +A.clone().addScaledVector(ab,t).distanceTo(W(x)).toFixed(3);};
     const a0=new THREE.Vector3().fromArray(P0,i0*3),b0=new THREE.Vector3().fromArray(P0,i1*3),c0=new THREE.Vector3().fromArray(P0,i2*3);dbg.push({prePushEdgeLenM:[a0.distanceTo(b0),b0.distanceTo(c0),a0.distanceTo(c0)].map(x=>+(x*sc).toFixed(3)),seg:sg.from.replace('mixamorig',''),edgeLenM:L,vertDistToAxisM:[dist(a),dist(b),dist(c)],R:sg.r});}}}
  before+=nb;after+=na;worstB=Math.max(worstB,nb);worstA=Math.max(worstA,na);triBad+=tb;triWorst=Math.max(triWorst,tb);}
 return {frames,sampled:Math.ceil(pos.count/2),meanBlockedBeforePush:+(before/frames).toFixed(1),worstBefore:worstB,meanAfterPush:+(after/frames).toFixed(1),worstAfter:worstA,debug:dbg,bySeg,trianglesThroughArmMean:+(triBad/frames).toFixed(1),trianglesWorst:triWorst,triangles:idx.count/3,segments:ap.segments()};});
console.log(JSON.stringify(r));await b.close();})();
