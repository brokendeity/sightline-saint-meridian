/* Concrete level routes for ordinary visitors; no new missions or rewards. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),THREE=require('../vendor/three-r128.js'),{orientedBox,separation,worldIndex}=require('./air_clearance.cjs');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),file=path.join(R,'assets/city/vertical-v02/transit-world/manifest.json'),manifest=JSON.parse(fs.readFileSync(file)),world=JSON.parse(fs.readFileSync(path.join(D,'V02_LiveWorld_Authoritative.json'))),index=worldIndex(world,manifest);
const routes=[{id:'station-commuters',purpose:'Walk between transit information and the protected waiting platform',count:3,points:[[73,100,382],[73,100,385.05],[76.12,100,385.05],[76.12,100,402],[76.98,100,402],[76.98,100,385.8],[73.9,100,385.8],[73.9,100,382]],dwellAt:[0,3]},
 {id:'market-visitors',purpose:'Visit the suspended commercial gallery and storefront approach',count:3,points:[[62.5,24,356.1],[65.5,24,356.1],[65.5,24,361.5],[62.5,24,361.5]],dwellAt:[1,3]},
 {id:'observation-visitors',purpose:'Walk through the sheltered observation area and pause at the outlook',count:2,points:[[76,128,417],[80,128,417],[80,128,423],[76,128,423]],dwellAt:[1,2]}];
const failures=[];let samples=0;
function supported(p){return[-.26,.26].every(dx=>[-.26,.26].every(dz=>manifest.records.some(r=>r.walkable&&Math.abs(r.box.max[1]-p.y)<.001&&p.x+dx>=r.box.min[0]-.00001&&p.x+dx<=r.box.max[0]+.00001&&p.z+dz>=r.box.min[2]-.00001&&p.z+dz<=r.box.max[2]+.00001)));}
for(const route of routes){route.closed=true;route.baseSpeed=1.15;route.minimumSpacing=.68;route.dwellSeconds=5;route.length=0;
 for(let j=0;j<route.points.length;j++){const a=new THREE.Vector3(...route.points[j]),b=new THREE.Vector3(...route.points[(j+1)%route.points.length]),length=a.distanceTo(b),n=Math.ceil(length/.15);route.length+=length;
  for(let i=0;i<=n;i++){const p=a.clone().lerp(b,i/n),body=orientedBox([-.32,.025,-.32],[.32,1.8,.32],p,new THREE.Quaternion());samples++;
   if(!supported(p)){failures.push({route:route.id,position:p.toArray(),reason:'unsupported footprint'});continue;}
   for(const o of index.nearby(body.box))if(o.box.max[1]>p.y+.02&&separation(body,o.obb)<-1e-5)failures.push({route:route.id,position:p.toArray(),reason:'body obstruction',owner:o.id});
  }
 }
}
const report={status:failures.length?'FAIL ambient route preflight':'PASS ambient route support/body preflight only',manifestSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),sourceWorldSHA256:crypto.createHash('sha256').update(fs.readFileSync(path.join(D,'V02_LiveWorld_Authoritative.json'))).digest('hex'),builderSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:'Actual current source support surfaces and full1.8m body bounds sampled at<=.15m. Native movement, crowd yield and animation validation remain separate.',samples,failures:failures.slice(0,100),failureCount:failures.length};fs.writeFileSync(path.join(D,'V02_Ambient_Route_Preflight.json'),JSON.stringify(report,null,2)+'\n');
assertNoFailure();function assertNoFailure(){if(failures.length)throw Error(JSON.stringify(failures.slice(0,6)));}
const definition={schema:'sm-v02-ambient-routes-1',worldManifestSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),routes,actorCount:routes.reduce((n,r)=>n+r.count,0),limits:['Scenic visitors, no combat/quest/reward ownership','Existing source pedestrian appearance reused; final visual review remains separate']};
fs.writeFileSync(path.join(R,'assets/city/vertical-v02/world-life/ambient_routes.json'),JSON.stringify(definition,null,2)+'\n');console.log(report.status,definition.actorCount,'visitors',samples,'samples');
