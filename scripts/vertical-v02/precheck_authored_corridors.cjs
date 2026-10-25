/* Fast source-geometry defect finder. Actual exported solid cuboids versus
 * authored horizontal route centre-lines at hero torso height. A hit proves
 * that the published line is obstructed; no hit does not certify body width,
 * steps, support, cameras, ability arcs or normal-input gameplay. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),THREE=require('../vendor/three-r128.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),G=path.join(D,'V02_Movement_Graph.json'),M=path.join(R,'assets/city/vertical-v02/graybox/manifest.json');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),g=JSON.parse(fs.readFileSync(G)),m=JSON.parse(fs.readFileSync(M));
assert.equal(m.graphSHA256,hash(G),'Graph/export revision mismatch');
const parts=m.records.filter(r=>r.solid).map(r=>({id:r.id,box:new THREE.Box3(new THREE.Vector3(...r.box.min),new THREE.Vector3(...r.box.max))})),conflicts=[],examined=[];
function segment(edge,a,b,label){
 if(Math.abs(a[1]-b[1])>1e-6)return;
 const from=new THREE.Vector3(a[0],a[1]+1.32,a[2]),to=new THREE.Vector3(b[0],b[1]+1.32,b[2]),delta=to.clone().sub(from),length=delta.length();if(length<.01)return;
 const ray=new THREE.Ray(from,delta.divideScalar(length)),area=new THREE.Box3().setFromPoints([from,to]).expandByScalar(.0001),hits=[];
 for(const p of parts){if(!p.box.intersectsBox(area))continue;const hit=ray.intersectBox(p.box,new THREE.Vector3());if(hit&&hit.distanceTo(from)<length-.02)hits.push({owner:p.id,point:hit.toArray(),distance:hit.distanceTo(from)});}
 hits.sort((a,b)=>a.distance-b.distance);examined.push({edge:edge.id,segment:label,from:from.toArray(),to:to.toArray()});
 if(hits.length)conflicts.push({edge:edge.id,ability:edge.ability,source:edge.source,destination:edge.destination,segment:label,from:from.toArray(),to:to.toArray(),hits});
}
for(const e of g.edges){
 if(e.traversalAgent!=='player')continue;
 // Even ability edges contain authored supported walk-out sections. Check
 // horizontal subsegments of their paths; airborne arcs retain separate tests.
 for(let i=1;i<e.path.length;i++)segment(e,e.path[i-1],e.path[i],i-1);
}
const report={status:conflicts.length?'FAIL authored horizontal centre-line obstruction':'PASS sampled authored centre-line precheck only',scope:'Exact exported solid cuboid bounds versus each authored player horizontal segment at floor+1.32m. This is a geometric defect finder, not body-radius, support, stair/air arc or normal-input certification. Some ability-path lines are intent rather than integrated trajectories; their conflicts require classification.',entrySHA256:hash(path.join(R,'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html')),manifestSHA256:hash(M),graphSHA256:hash(G),segments:examined.length,conflicts};
fs.writeFileSync(path.join(D,'V02_Authored_Corridor_Precheck.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,segments:examined.length,conflicts:conflicts.length,owners:[...new Set(conflicts.flatMap(c=>c.hits.map(h=>h.owner)))]}));
