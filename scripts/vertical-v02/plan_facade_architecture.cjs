/* Architectural groupings on actual source faces, between existing light bays.
 * No new opening/interior, collision surface or balcony is implied. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),THREE=require('../vendor/three-r128.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),read=f=>JSON.parse(fs.readFileSync(path.join(R,f))),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const files=['development/vertical-city-v02/V02_LiveWorld_Authoritative.json','development/vertical-city-v02/V02_BuildingGeometry.json','development/vertical-city-v02/V02_Reference_Appearance.json','assets/city/vertical-v02/coffered/runtime/manifest.json','assets/city/vertical-v02/visual/facades.json'],world=read(files[0]),geos=read(files[1]).geometries,appearance=read(files[2]),district=read(files[3]),prior=read(files[4]),features=[],rejected={};
const box=b=>new THREE.Box3(new THREE.Vector3(...b.min),new THREE.Vector3(...b.max));
for(const chunk of prior.chunks){
 const b=world.buildings.find(b=>b.id===chunk.owner),g=geos.find(g=>g.id===b.geometry),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(g.positions,3));if(g.indices)geo.setIndex(g.indices);geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.matrixAutoUpdate=false;mesh.matrix.fromArray(b.transform.matrixWorld);mesh.updateMatrixWorld(true);const bb=b.visualWorldBounds,family=appearance.families.find(f=>f.family===b.family),inward=b.transform.position[0]<80?1:-1;let serial=0;
 for(const [axis,sign,face]of [[0,inward,'corridor'],[2,-1,'front'],[2,1,'rear'],[0,-inward,'outer']]){
  const uAxis=axis===0?2:0,normal=new THREE.Vector3().setComponent(axis,sign),low=bb.min[uAxis]+3,high=bb.max[uAxis]-3,top=Math.min(152,bb.max[1]-4),spines=[];
  function hit(y,u){const origin=new THREE.Vector3().setComponent(1,y).setComponent(uAxis,u).setComponent(axis,sign>0?bb.max[axis]+5:bb.min[axis]-5);return new THREE.Raycaster(origin,normal.clone().negate(),0,180).intersectObject(mesh,false)[0]}
  function admit(kind,y,u,height,width){
   const h=hit(y,u);let reason=!h?'no solid source face':Math.abs(h.face.normal.getComponent(axis))<.98?'nonfacade source':null;const points=[];
   if(!reason){const ny=Math.ceil(height/1.8),nu=Math.ceil(width/1.8);for(let j=0;j<=ny&&!reason;j++)for(let k=0;k<=nu;k++){
    const p=hit(y-height/2+j*height/ny,u-width/2+k*width/nu);if(!p||Math.abs(p.point.getComponent(axis)-h.point.getComponent(axis))>.015||Math.abs(p.face.normal.getComponent(axis))<.98){reason='edge opening or stepped facade';break}
    const palette=family.palette[family.faceMaterials[p.faceIndex]];if(Math.max(...palette.emission)>.005||Math.max(...palette.color)>.3){reason='existing original light or bright detail';break}
    if(!b.parts.some(part=>box(part.box).expandByScalar(.025).containsPoint(p.point))){reason='source collision lacks support';break}points.push({face:p.faceIndex,point:p.point.toArray()});
   }}
   let bounds,centre;if(!reason){centre=h.point.clone().addScaledVector(normal,.045);const half=new THREE.Vector3().setComponent(axis,.04).setComponent(1,height/2).setComponent(uAxis,width/2);bounds=new THREE.Box3(centre.clone().sub(half),centre.clone().add(half));if(district.records.some(r=>box(r.box).intersectsBox(bounds.clone().expandByScalar(.08))))reason='V02 attachment clearance';else if(chunk.bays.some(b=>box(b.box).intersectsBox(bounds.clone().expandByScalar(.005))))reason='existing light-bay overlap';}
   if(reason){rejected[reason]=(rejected[reason]||0)+1;return false}
   features.push({id:b.id+'-architecture-'+kind+'-'+face+'-'+serial++,owner:b.id,sourceIndex:b.sourceIndex,cityBuildingId:b.cityBuildingId,kind,face,axis,uAxis,centre:centre.toArray(),normal:normal.toArray(),height,width,box:{min:bounds.min.toArray(),max:bounds.max.toArray()},sourceFace:h.faceIndex,sourcePoint:h.point.toArray(),sourceProbes:points,role:'Shallow original-owner architectural trim. Not an interior, balcony, new contact or traversable route.'});return true;
  }
  // Vertical seams occupy the gaps between the existing window columns.
  for(let u=low+1.8;u<high-.2;u+=10.8){spines.push(u);for(let y=14;y+8.2<top;y+=16.8)admit('spine',y,u,16.4,.32)}
  // Longer dark floor fascias group six source rows. Break at each vertical seam
  // so intersecting front faces never occupy the same plane.
  for(let y=10.1;y<top;y+=25.2){const cuts=[low-.84,...spines,high];for(let i=1;i<cuts.length;i++){const a=cuts[i-1]+(i>1?.18:0),z=cuts[i]-(i<cuts.length-1?.18:0);if(z-a>1)admit('fascia',y,(a+z)/2,.32,z-a)}}
 }
}
assert(features.length>0);const report={status:'SOURCE-ADMITTED architecture trim; saved Blender/native acceptance pending',sources:Object.fromEntries(files.map(f=>[f,sha(f)])),owners:prior.chunks.map(c=>c.owner),existingLightBays:prior.chunks.reduce((n,c)=>n+c.bays.length,0),features,rejected,maximumProjectionMetres:.085,scope:'Dense1.8m source-face/palette/compound-support samples, source-bay gaps and accepted V02 clearance. Decorative source-backed trim, no new physical surface or room.'};fs.writeFileSync(path.join(D,'V02_Facade_Architecture_Plan.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({features:features.length,byKind:features.reduce((a,f)=>(a[f.kind]=(a[f.kind]||0)+1,a),{}),rejected}));
