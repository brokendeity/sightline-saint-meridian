const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),THREE=require('../vendor/three-r128.js'),create=require('../game_aerial_traffic_core_v02.js'),{orientedBox,separation}=require('./air_clearance.cjs');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),file=path.join(R,'assets/city/vertical-v02/world-life/air_routes.json'),definition=JSON.parse(fs.readFileSync(file)),c=create(THREE,definition),cases=[];
let minimumGap=Infinity,maximumBank=0,maxAcceleration=0,minimumPairSeparation=Infinity;const last=new Map();
// Ten simulated minutes allow varied preferred speeds to catch up and exercise
// following through all corners repeatedly, rather than only an initial layout.
for(let i=0;i<12000;i++){
 c.advance(.05);const s=c.state();
 for(const lane of s.lanes){for(const a of lane.agents){minimumGap=Math.min(minimumGap,a.gapAhead);maximumBank=Math.max(maximumBank,Math.abs(a.bank));assert(a.gapAhead>=10-1e-6);assert(a.speed>=0&&Number.isFinite(a.distance));const old=last.get(a.id);if(old){const accel=Math.abs(a.speed-old)/.05;maxAcceleration=Math.max(maxAcceleration,accel);assert(accel<=1.61);}last.set(a.id,a.speed);}
  if(i%20===0){const boxes=lane.agents.map(a=>orientedBox([-1.4,-.9,-2.8],[1.4,.9,2.8],new THREE.Vector3(...a.position),new THREE.Quaternion(...a.quaternion)));for(let j=0;j<boxes.length;j++)for(let k=j+1;k<boxes.length;k++){const gap=separation(boxes[j],boxes[k]);minimumPairSeparation=Math.min(minimumPairSeparation,gap);assert(gap>0,'Aircraft overlap');}}
 }
}
assert.equal(c.state().emergencyBrakes,0);cases.push({name:'600s varied-speed flow: full loops, bounded braking and no overlapping aircraft',pass:true,minimumGap,maximumBankRadians:maximumBank,maxAcceleration,minimumPairSeparation});
const before=c.state();c.advance(50,false);assert.deepEqual(c.state(),before);cases.push({name:'pause freezes every vehicle, bank and clock',pass:true});
const a=create(THREE,definition),b=create(THREE,definition);for(let i=0;i<600;i++)a.advance(1/60);for(let i=0;i<100;i++)b.advance(.1);const aa=a.state().lanes.flatMap(l=>l.agents),bb=b.state().lanes.flatMap(l=>l.agents);assert(aa.every((v,i)=>Math.abs(v.distance-bb[i].distance)<1e-7));cases.push({name:'equivalent frame partitions retain the same traffic positions',pass:true});
const report={status:'PASS scenic flow controller only',definitionSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),coreSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'scripts/game_aerial_traffic_core_v02.js'))).digest('hex'),cases,scope:'Pure motion/spacing tests, not native rendering or complete city performance acceptance.'};fs.writeFileSync(path.join(D,'V02_Air_Flow_Tests.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
