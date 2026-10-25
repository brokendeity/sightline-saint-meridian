/* Offline full-convoy envelope precheck using the candidate's actual curve,
 * native THREE interpolation/orientation and actual front GLB bounds.
 * This is sampled OBB evidence, not continuous collision or gameplay proof. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const THREE=require('../vendor/three-r128.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const entryFile=path.join(R,'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html'),entry=fs.readFileSync(entryFile,'utf8');
assert(entry.includes(fs.readFileSync(path.join(R,'scripts/vendor/three-r128.js'),'utf8').trim()),'Math library differs from candidate');
const marker='const points=[[80,100,180]',start=entry.indexOf(marker),end=entry.indexOf('trainLength=trainCurve.getLength();',start);
assert(start>=0&&end>start&&entry.indexOf(marker,start+1)<0,'Ambiguous candidate train route');
const routeCode=entry.slice(start,end+'trainLength=trainCurve.getLength();'.length);
let {trainCurve:curve,trainLength:length}=new Function('THREE','V','let trainCurve,trainLength;'+routeCode+'return {trainCurve,trainLength};')(THREE,(...a)=>new THREE.Vector3(...a));
const studyFile=process.argv[2];let study=null,spacing=14;
if(studyFile){study=JSON.parse(fs.readFileSync(studyFile));assert(study.points.length>=8&&study.points.every(p=>p.length===3&&p.every(Number.isFinite)));assert(study.closed===true);spacing=study.spacing;assert(spacing>=14&&spacing<=20);curve=new THREE.CatmullRomCurve3(study.points.map(p=>new THREE.Vector3(...p)),true,study.curveType||'centripetal',study.tension??.5);curve.arcLengthDivisions=study.arcLengthDivisions||200;curve.updateArcLengths();length=curve.getLength();}
// Read static glTF node transforms and declared POSITION bounds. Textures are
// irrelevant to the spatial envelope; skins/morphs require another evaluator.
const frontFile=path.join(R,'assets/city/vertical/train/train_front_lod0.glb'),bin=fs.readFileSync(frontFile),gltf=JSON.parse(bin.subarray(20,20+bin.readUInt32LE(12)).toString());
assert(!gltf.skins?.length,'Skinned carriage needs pose-aware bounds');
const front=new THREE.Box3();let meshes=0;
function visit(id,parent){const node=gltf.nodes[id],matrix=new THREE.Matrix4();
 if(node.matrix)matrix.fromArray(node.matrix);else matrix.compose(new THREE.Vector3(...(node.translation||[0,0,0])),new THREE.Quaternion(...(node.rotation||[0,0,0,1])),new THREE.Vector3(...(node.scale||[1,1,1])));
 matrix.premultiply(parent);
 if(node.mesh!==undefined)for(const primitive of gltf.meshes[node.mesh].primitives){assert(!primitive.targets?.length,'Morph carriage needs pose-aware bounds');const a=gltf.accessors[primitive.attributes.POSITION];assert(a.min&&a.max);front.union(new THREE.Box3(new THREE.Vector3(...a.min),new THREE.Vector3(...a.max)).applyMatrix4(matrix));meshes++;}
 for(const child of node.children||[])visit(child,matrix);
}
for(const id of gltf.scenes[gltf.scene||0].nodes)visit(id,new THREE.Matrix4());
// The shipped trainModel places the normalized front asset -1.6m vertically.
assert(entry.includes('asset.position.y=-1.6;g.add(asset);return g;'));
front.translate(new THREE.Vector3(0,-1.6,0));
const modelStart=entry.indexOf('function trainModel(front=false){'),modelEnd=entry.indexOf('\n function routeClear(',modelStart);assert(modelStart>0&&modelEnd>modelStart);
const materials={};for(const k of ['steel','warm','glass','cyan','deck'])materials[k]=new THREE.MeshBasicMaterial();
const rearModel=new Function('THREE','unit','materials','trainFrontTemplate',entry.slice(modelStart,modelEnd)+'return trainModel(false);')(THREE,new THREE.BoxGeometry(1,1,1),materials,null);
rearModel.updateMatrixWorld(true);const rear=new THREE.Box3().setFromObject(rearModel);
if(study?.sameBodyEnvelopeForAllCars)rear.copy(front);
const manifestFile=path.join(R,'assets/city/vertical-v02/graybox/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile)),world=JSON.parse(fs.readFileSync(path.join(D,'V02_LiveWorld_Authoritative.json')));
const obstacles=world.buildings.flatMap(b=>b.parts.map(p=>({id:p.id,box:p.box,kind:'original-building'}))).concat(world.props.filter(p=>p.type!=='vertical-structure').map(p=>({id:p.id,box:p.box,kind:'preserved-prop'})),manifest.records.filter(r=>r.solid).map(r=>({id:r.id,box:r.box,kind:'v02-structure'})));
const grid=new Map(),CELL=16;
function cells(lo,hi,fn){for(let x=Math.floor(lo[0]/CELL);x<=Math.floor(hi[0]/CELL);x++)for(let z=Math.floor(lo[2]/CELL);z<=Math.floor(hi[2]/CELL);z++)fn(x+','+z);}
for(const o of obstacles)cells(o.box.min,o.box.max,key=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(o)});
function obb(box,p,t){const local=box.getCenter(new THREE.Vector3()),half=box.getSize(new THREE.Vector3()).multiplyScalar(.5),z=new THREE.Vector3(t.x,0,t.z).normalize(),x=new THREE.Vector3(z.z,0,-z.x),center=p.clone().addScaledVector(x,local.x).addScaledVector(z,local.z).add(new THREE.Vector3(0,local.y,0));return{c:center,h:half,x,z};}
function hit(a,b){if(Math.abs(a.c.y-b.c.y)>=a.h.y+b.h.y-1e-5)return false;const d=b.c.clone().sub(a.c);for(const axis of [a.x,a.z,b.x,b.z]){const ra=Math.abs(a.x.dot(axis))*a.h.x+Math.abs(a.z.dot(axis))*a.h.z,rb=Math.abs(b.x.dot(axis))*b.h.x+Math.abs(b.z.dot(axis))*b.h.z;if(Math.abs(d.dot(axis))>=ra+rb-1e-5)return false;}return true;}
const fromAABB=box=>({c:new THREE.Vector3(...box.min).add(new THREE.Vector3(...box.max)).multiplyScalar(.5),h:new THREE.Vector3(...box.max).sub(new THREE.Vector3(...box.min)).multiplyScalar(.5),x:new THREE.Vector3(1,0,0),z:new THREE.Vector3(0,0,1)});
for(const o of obstacles)o.obb=fromAABB(o.box);
const collisions=new Map(),selfCollisions=new Map(),interval=study?.sampleIntervalMetres??.25,steps=Math.ceil(length/interval);assert(interval>=.025&&interval<=.25);
let minimumAdjacentRootDistance=Infinity,maximumAdjacentYawDegrees=0,minimumAdjacentSeparatingAxisGap=Infinity,minimumRootStepRatio=Infinity,maximumRootStepRatio=0,previousFront=null;
function separatingGap(a,b){const d=b.c.clone().sub(a.c);let gap=-Infinity;for(const axis of[a.x,a.z,b.x,b.z])gap=Math.max(gap,Math.abs(d.dot(axis))-Math.abs(a.x.dot(axis))*a.h.x-Math.abs(a.z.dot(axis))*a.h.z-Math.abs(b.x.dot(axis))*b.h.x-Math.abs(b.z.dot(axis))*b.h.z);return gap;}
for(let step=0;step<steps;step++){
 const distance=step*length/steps,cars=[],roots=[];
 for(let car=0;car<4;car++){
  const u=((distance-car*spacing)%length+length)%length/length,p=curve.getPointAt(u),t=curve.getTangentAt(u),b=obb(car?rear:front,p,t);cars.push(b);roots.push(p);
  const hx=Math.abs(b.x.x)*b.h.x+Math.abs(b.z.x)*b.h.z,hz=Math.abs(b.x.z)*b.h.x+Math.abs(b.z.z)*b.h.z,found=new Set();
  cells([b.c.x-hx,b.c.y-b.h.y,b.c.z-hz],[b.c.x+hx,b.c.y+b.h.y,b.c.z+hz],key=>{for(const o of grid.get(key)||[])found.add(o)});
  for(const o of found)if(hit(b,o.obb)){const key=car+':'+o.kind+':'+o.id;if(!collisions.has(key))collisions.set(key,{car,owner:o.id,kind:o.kind,firstDistance:distance,firstPosition:p.toArray(),sampleCount:0});collisions.get(key).sampleCount++;}
 }
 for(let a=0;a<3;a++){minimumAdjacentRootDistance=Math.min(minimumAdjacentRootDistance,roots[a].distanceTo(roots[a+1]));maximumAdjacentYawDegrees=Math.max(maximumAdjacentYawDegrees,Math.acos(Math.max(-1,Math.min(1,cars[a].z.dot(cars[a+1].z))))*180/Math.PI);minimumAdjacentSeparatingAxisGap=Math.min(minimumAdjacentSeparatingAxisGap,separatingGap(cars[a],cars[a+1]));}
 if(previousFront){const ratio=roots[0].distanceTo(previousFront)/(length/steps);minimumRootStepRatio=Math.min(minimumRootStepRatio,ratio);maximumRootStepRatio=Math.max(maximumRootStepRatio,ratio);}previousFront=roots[0];
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)if(hit(cars[a],cars[b])){const key=a+':'+b;if(!selfCollisions.has(key))selfCollisions.set(key,{cars:[a,b],firstDistance:distance,firstPositions:[cars[a].c.toArray(),cars[b].c.toArray()],sampleCount:0});selfCollisions.get(key).sampleCount++;}
}
const report={status:collisions.size||selfCollisions.size?'FAIL sampled convoy envelope conflicts':'PASS sampled convoy envelope precheck only',scope:'Offline oriented bounds sampled at <=.25m through the actual candidate closed curve, all four simultaneous carriages, original compound building boxes, preserved non-V1 props and current solid V02 boxes. Conservative complete body envelopes, not exact triangle contact or continuous swept certification. Existing own-track wheel contact is excluded; aerial traffic, native playback, coupling and station operation remain separate.',entrySHA256:sha(entryFile),manifestSHA256:sha(manifestFile),trainAssetSHA256:sha(frontFile),routeCodeSHA256:crypto.createHash('sha256').update(routeCode).digest('hex'),frontPrimitiveCount:meshes,frontLocalBounds:{min:front.min.toArray(),max:front.max.toArray()},rearLocalBounds:{min:rear.min.toArray(),max:rear.max.toArray()},routeLength:length,spacing:14,carriages:4,samples:steps,sampleIntervalMetres:length/steps,worldConflicts:[...collisions.values()],convoyConflicts:[...selfCollisions.values()]};
report.spacing=spacing;
report.arcLengthDivisions=curve.arcLengthDivisions;
report.consistEnvelopePolicy=study?.sameBodyEnvelopeForAllCars?'UNIMPLEMENTED consistent-family target: all four cars use the unchanged full Hi3D front-car envelope. Later authored meshes must fit/revalidate this envelope.':'Actual shipped Hi3D front and three procedural rear-car envelopes.';
report.motionEnvelopeMetrics={minimumAdjacentRootDistance,maximumAdjacentYawDegrees,minimumAdjacentSeparatingAxisGap,minimumRootStepRatio,maximumRootStepRatio,scope:'Sampled horizontal OBB separating-axis gap and native root/tangent motion, not a mechanical coupler/bogie model. Large articulation angles require explicit design validation.'};
report.predictedNativeFrameSpeedRatios=[8,16].map(speed=>{const step=speed/60;let minimum=Infinity,maximum=0;for(let d=0;d<length;d+=step){const a=curve.getPointAt(d/length),b=curve.getPointAt(((d+step)%length)/length),ratio=a.distanceTo(b)/step;minimum=Math.min(minimum,ratio);maximum=Math.max(maximum,ratio);}return{requestedSpeed:speed,simulationHz:60,minimum,maximum,scope:'Offline prediction using the same native getPointAt call at fixed60Hz; browser motion/variable frame times remain untested.'};});
if(study){report.scope='UNIMPLEMENTED DESIGN STUDY. '+report.scope;report.evaluatedProposal={file:path.relative(R,studyFile),sha256:sha(studyFile),...study};report.evaluationIsCurrentRuntime=false;}else report.evaluationIsCurrentRuntime=true;
fs.writeFileSync(path.join(D,study?'V02_Transit_Route_Study.json':'V02_Transit_Envelope_Precheck.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,samples:steps,worldConflicts:collisions.size,convoyConflicts:selfCollisions.size}));
// Keep a diagnostic FAIL as data; this preliminary probe does not alter or
// replace the independently running player-route acceptance process.
