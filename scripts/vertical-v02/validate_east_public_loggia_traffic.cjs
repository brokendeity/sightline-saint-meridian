/* Continuous, rotation-independent full-vehicle clearance of the proposed rooms.
 * De Casteljau sub-hulls refine false broad-phase intersections; samples alone
 * never establish admission. The inherited radius has actual mesh provenance.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const THREE = require('../vendor/three-r128.js');
const ROOT = path.resolve(__dirname, '../..');
const DEV = path.join(ROOT, 'development/vertical-city-v02');
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, f)));
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const planFile = 'development/vertical-city-v02/V02_East_Public_Loggias_Plan.json';
const proofFile = 'development/vertical-city-v02/V02_Upper_Anchor_Clearance.json';
const plan = read(planFile), proof = read(proofFile);
assert(plan.status.startsWith('PASS'));
assert(proof.status.startsWith('PASS'));
for (const [f, hash] of Object.entries(proof.hashes)) assert.equal(sha(f), hash, f);
// Actual loaded geometry was collected by the prior native inspection. Verify
// its bytes and all asset/animation implementations before reusing its bounds.
assert.equal(sha('development/vertical-city-v02/V02_Upper_Anchor_Native.json'), proof.nativeReportSHA256);
const trainFile = 'assets/city/vertical-v02/transit/definition.json';
const airFile = 'assets/city/vertical-v02/world-life/air_routes.json';
const train = read(trainFile), air = read(airFile);
const lerp = (a, b) => a.clone().add(b).multiplyScalar(.5);
function split(c) {
  const a=lerp(c[0],c[1]), b=lerp(c[1],c[2]), d=lerp(c[2],c[3]);
  const e=lerp(a,b), f=lerp(b,d), g=lerp(e,f);
  return [[c[0],a,e,g], [g,f,d,c[3]]];
}
function cubics(def) {
  const curve = new THREE.CatmullRomCurve3(def.points.map(p => new THREE.Vector3(...p)), def.closed !== false, def.curveType || 'centripetal');
  const n = def.closed === false ? def.points.length-1 : def.points.length;
  const result = [];
  for (let i=0; i<n; ++i) {
    const p0=curve.getPoint(i/n), p3=curve.getPoint((i+1)/n);
    const a=curve.getPoint((i+1/3)/n).multiplyScalar(27).addScaledVector(p0,-8).sub(p3);
    const b=curve.getPoint((i+2/3)/n).multiplyScalar(27).sub(p0).addScaledVector(p3,-8);
    const p1=a.clone().multiplyScalar(2).sub(b).multiplyScalar(1/18);
    const p2=b.clone().multiplyScalar(2).sub(a).multiplyScalar(1/18);
    for (const t of [.11,.29,.57,.83]) {
      const u=1-t;
      const p=p0.clone().multiplyScalar(u**3).addScaledVector(p1,3*u*u*t).addScaledVector(p2,3*u*t*t).addScaledVector(p3,t**3);
      assert(p.distanceTo(curve.getPoint((i+t)/n)) < 1e-7);
    }
    result.push([p0,p1,p2,p3]);
  }
  return result;
}
function gap(c, radius, box) {
  return Math.max(...[0,1,2].map(i => Math.max(
    box.min[i] - Math.max(...c.map(p=>p.getComponent(i))) - radius,
    Math.min(...c.map(p=>p.getComponent(i))) - radius - box.max[i]
  )));
}
const failures = [], routes = [];
for (const def of [{id:'all-four-train-carriages',route:train.route,radius:proof.trainRadius},
                  ...air.lanes.map(route=>({id:route.id,route,radius:proof.airRadius}))]) {
  const cs = cubics(def.route);
  let acceptedHulls=0, maximumDepth=0, minimumCertifiedGap=Infinity;
  function visit(c, r, depth) {
    const separation = gap(c, def.radius+1e-6, r.box);
    maximumDepth=Math.max(maximumDepth,depth);
    if (separation > .05) {
      acceptedHulls++;
      minimumCertifiedGap=Math.min(minimumCertifiedGap,separation);
      return;
    }
    if (depth >= 20) {
      failures.push({route:def.id,record:r.id,depth,separation});
      return;
    }
    for (const half of split(c)) visit(half,r,depth+1);
  }
  for (const c of cs) for (const r of plan.additions) visit(c,r,0);
  routes.push({id:def.id,radius:def.radius,acceptedHulls,maximumDepth,minimumCertifiedGap});
}
const report={
  status:(failures.length?'FAIL':'PASS')+' continuous complete-vehicle separation preflight',
  hashes:{[planFile]:sha(planFile),[proofFile]:sha(proofFile),[trainFile]:sha(trainFile),[airFile]:sha(airFile),
    'scripts/vertical-v02/validate_east_public_loggia_traffic.cjs':sha('scripts/vertical-v02/validate_east_public_loggia_traffic.cjs')},
  inheritedImmutableGeometryDependencies:proof.hashes,
  nativeGeometryReportSHA256:proof.nativeReportSHA256,
  radiusEvidence:'All loaded rigid train meshes, doors, articulation pivots, couplers and native arc interpolation bound; every air mesh vertex, including yaw/bank rotation.',
  method:'All Catmull-Rom cubic Bezier convex hulls, recursively subdivided analytically. A strictly positive separating axis proves the entire expanded subcurve clears each proposed component.',
  routes,failures,
  scope:'Source pre-authoring gate; no room gameplay, pedestrian routes or final visual acceptance certified.'
};
fs.writeFileSync(path.join(DEV,'V02_East_Public_Loggias_Traffic_Clearance.json'),JSON.stringify(report,null,2)+'\n');
console.log(report.status,JSON.stringify(routes));
assert.deepEqual(failures,[]);
