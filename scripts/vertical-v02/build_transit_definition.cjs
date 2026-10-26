/* Promote the stored proposal to an executable route; acceptance is separate. */
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const THREE=require('../vendor/three-r128.js'),create=require('../vertical_transit_core_v02.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),out=path.join(R,'assets/city/vertical-v02/transit');fs.mkdirSync(out,{recursive:true});
const file=path.join(D,'V02_Transit_Route_Proposal.json'),proposal=JSON.parse(fs.readFileSync(file));
const definition={schema:'sm-v02-transit-1',status:'IMPLEMENTED CANDIDATE; full native clearance and infrastructure acceptance pending',
 route:{id:proposal.route.id,points:proposal.route.points,closed:true,curveType:proposal.route.curveType,spacing:15,arcLengthDivisions:32768},
 station:{id:'upper-interchange',frontPosition:[80,100,402],side:'left',publicBoarding:false},
 initialApproachMetres:80,motion:{maxSpeed:16,acceleration:1.2,braking:1.7,lateralAcceleration:2.5,opening:.8,dwell:8,closing:.8},
 provenance:{proposalSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),frontAsset:'assets/city/vertical/train/train_front_lod0.glb',
  frontSHA256:'8e96df9363e64d3da2510ff62f1bfcc02e50cd9d28cdf7363df4f76823714933'},
 limitations:['Hi3D front has fused doors and bogies; those remain closed and rigid.','Passenger boarding and station gap/gates are not yet accepted.','Track supports, aerial traffic and sustained performance require later acceptance.']};
const core=create(THREE,definition),n=Math.ceil(core.length/1);
const engineering={schema:'sm-v02-transit-engineering-1',routeLength:core.length,stationDistance:core.state().stationDistance,
 source:'Exact THREE r128 getPointAt/getTangentAt; Blender uses these samples without a second spline approximation.',
 railHeadY:98.3964,gauge:1.435,samples:Array.from({length:n},(_,i)=>{const d=i*core.length/n,p=core.pose(d);return{distance:d,p:p.position.toArray(),t:p.tangent.toArray()};})};
fs.writeFileSync(path.join(out,'definition.json'),JSON.stringify(definition,null,2)+'\n');
fs.writeFileSync(path.join(D,'V02_Transit_Engineering.json'),JSON.stringify(engineering,null,2)+'\n');
console.log(JSON.stringify({length:core.length,samples:n,stationDistance:core.state().stationDistance}));
