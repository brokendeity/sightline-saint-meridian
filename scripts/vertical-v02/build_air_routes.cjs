const fs=require('fs'),path=require('path'),crypto=require('crypto'),THREE=require('../vendor/three-r128.js'),{orientedBox,separation,worldIndex}=require('./air_clearance.cjs');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),OUT=path.join(R,'assets/city/vertical-v02/world-life');fs.mkdirSync(OUT,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const world=read('development/vertical-city-v02/V02_LiveWorld_Authoritative.json'),manifest=read('assets/city/vertical-v02/transit-world/manifest.json'),index=worldIndex(world,manifest),train=read('assets/city/vertical-v02/transit/definition.json'),base=new THREE.CatmullRomCurve3(train.route.points.map(p=>new THREE.Vector3(...p)),true,'centripetal');base.arcLengthDivisions=32768;base.updateArcLengths();const L=base.getLength();
function scan(points,min,max,spacing=.25){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),true,'centripetal');curve.arcLengthDivisions=32768;curve.updateArcLengths();const length=curve.getLength(),n=Math.ceil(length/spacing),hits=new Map();
 for(let i=0;i<n;i++){const p=curve.getPointAt(i/n),t=curve.getTangentAt(i/n),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(t.x,t.z)),b=orientedBox(min,max,p,q);for(const o of index.nearby(b.box))if(separation(b,o.obb)<-1e-5&&!hits.has(o.id))hits.set(o.id,{owner:o.id,position:p.toArray(),distance:i*length/n});}
 return{length,samples:n,hits:[...hits.values()]};}
const baseline=[38,65,114].map(y=>{const points=[[76,y,185],[76,y,450],[80,y,470],[84,y,440],[84,y,190],[80,y,165]];return{elevation:y,...scan(points,[-1.3,-.7,-2.65],[1.3,.7,2.65])};});
// This upright envelope encloses the complete2.8x1.8x5.6m authored fleet at
// every roll angle through +/-12degrees, plus20cm structural clearance.
const a=12*Math.PI/180,hx=1.4*Math.cos(a)+.9*Math.sin(a)+.2,hy=.9*Math.cos(a)+1.4*Math.sin(a)+.2;
const min=[-hx,-hy,-3],max=[hx,hy,3],trials=[],lanes=[];
for(const [band,y]of[38,65,114].entries()){
 let chosen;
 for(const offset of[band===1?-3:3,0,-3,3,-1.5,1.5]){
  const count=Math.ceil(L/5),points=Array.from({length:count},(_,i)=>{const p=base.getPointAt(i/count),t=base.getTangentAt(i/count);return[p.x+t.z*offset,y,p.z-t.x*offset]});if(band===1)points.reverse();
  const check=scan(points,min,max);trials.push({band,elevation:y,offset,...check});if(!check.hits.length){chosen={id:'aerial-band-'+band,elevation:y,points,closed:true,speed:12+band*3,count:12,variantOffset:band,offset,curveType:'centripetal',arcLengthDivisions:32768};break;}
 }
 if(!chosen)throw Error('No collision-free traffic band at '+y+'; inspect source trial evidence');lanes.push(chosen);
}
const definition={schema:'sm-v02-air-flow-1',status:'IMPLEMENTED CANDIDATE; native/full-asset validation pending',settings:{acceleration:.9,braking:1.6,lateralAcceleration:2,minimumGap:10,timeGap:1.6,maxBank:a},clearanceEnvelope:{min,max,scope:'Contains all declared fleet geometry and every allowed bank angle with20cm extra margin'},lanes,worldManifestSHA256:sha('assets/city/vertical-v02/transit-world/manifest.json'),limits:['Scenic kinematic traffic; no pursuit/combat or vehicle physics','Native asset, shared-clock and appearance acceptance remain separate']};
fs.writeFileSync(path.join(OUT,'air_routes.json'),JSON.stringify(definition,null,2)+'\n');fs.writeFileSync(path.join(D,'V02_Air_Route_Preflight.json'),JSON.stringify({status:'PASS selected sampled route envelopes only',scope:'Full bank-enclosing fleet boxes against original compound geometry, preserved props and the current supported city; sampling <=.25m, not continuous collision certification.',manifestSHA256:definition.worldManifestSHA256,sourceWorldSHA256:sha('development/vertical-city-v02/V02_LiveWorld_Authoritative.json'),builderSHA256:sha('scripts/vertical-v02/build_air_routes.cjs'),clearanceSHA256:sha('scripts/vertical-v02/air_clearance.cjs'),definitionSHA256:sha('assets/city/vertical-v02/world-life/air_routes.json'),baseline,trials,selected:lanes.map(l=>({id:l.id,elevation:l.elevation,offset:l.offset,count:l.count}))},null,2)+'\n');console.log(JSON.stringify({baseline:baseline.map(b=>({y:b.elevation,conflicts:b.hits.length})),selected:lanes.map(l=>({id:l.id,y:l.elevation,offset:l.offset}))}));
