/* Recover the actual original building-face palette for Blender reference.
 * Executes the unchanged runtime preparation function with its shipped loader.
 * No browser, gameplay process, source asset or original baseline is changed. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
global.THREE=require('../vendor/three-r128.js');global.self=global;
require('../vendor/GLTFLoader-r128.js');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const entryFile=path.join(R,'SIGHTLINE_BACKSPOOL_WHIP_THROW.html'),entry=fs.readFileSync(entryFile,'utf8');
const marker='function prepareBuildingTemplate(root){',start=entry.indexOf(marker),end=entry.indexOf('\nfunction buildingFamily(',start);
assert(start>0&&end>start&&entry.indexOf(marker,start+1)<0);
const source=entry.slice(start,end),prepare=new Function('THREE',source+';return prepareBuildingTemplate;')(THREE);
const w=JSON.parse(fs.readFileSync(path.join(D,'V02_LiveWorld_Authoritative.json')));
const geos=JSON.parse(fs.readFileSync(path.join(D,'V02_BuildingGeometry.json'))).geometries;
const report={status:'FAIL',scope:'Actual normalized source-face RGB/emission for reference-only Blender buildings. Blender lighting remains a separate implementation; this does not certify visual equality to the game.',
 sourceEntrySHA256:hash(entryFile),preparationFunctionSHA256:crypto.createHash('sha256').update(source).digest('hex'),
 sourceGeometrySHA256:hash(path.join(D,'V02_BuildingGeometry.json')),families:[]};
(async()=>{
 for(let family=0;family<8;family++){
  const ids=[...new Set(w.buildings.filter(b=>b.family===family).map(b=>b.geometry))];assert.equal(ids.length,1);
  const expected=geos.find(g=>g.id===ids[0]);assert.equal(expected.indices,null,'Palette admission expects actual expanded source triangles');
  const file='buildings/saint_meridian/building_'+String(family+1).padStart(2,'0')+'.glb',bytes=fs.readFileSync(path.join(R,file));
  const gltf=await new Promise((resolve,reject)=>new THREE.GLTFLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',resolve,reject));
  const template=prepare(gltf.scene),a=template.geometry.attributes,positions=a.position.array;
  assert.equal(positions.length,expected.positions.length);let maximum=0;
  for(let i=0;i<positions.length;i++)maximum=Math.max(maximum,Math.abs(positions[i]-expected.positions[i]));
  assert(maximum<1e-7,'Source template no longer matches authoritative reference geometry');
  const palette=[],lookup=new Map(),faceMaterials=[];
  for(let first=0;first<a.position.count;first+=3){
   const values=[...a.color.array.slice(first*3,first*3+3),...a.cityEmission.array.slice(first*3,first*3+3)];
   for(let j=1;j<3;j++)for(let k=0;k<3;k++){
    assert.equal(a.color.array[(first+j)*3+k],values[k]);assert.equal(a.cityEmission.array[(first+j)*3+k],values[k+3]);
   }
   const key=values.join(',');if(!lookup.has(key)){lookup.set(key,palette.length);palette.push({color:values.slice(0,3),emission:values.slice(3)})}
   faceMaterials.push(lookup.get(key));
  }
  report.families.push({family,geometryID:expected.id,sourceGLB:file,sourceGLBSHA256:hash(path.join(R,file)),
    vertices:a.position.count,triangles:faceMaterials.length,maximumNormalizedPositionError:maximum,palette,faceMaterials});
 }
 report.status='PASS recovered original face colors/emission with exact authoritative position correspondence';
 fs.writeFileSync(path.join(D,'V02_Reference_Appearance.json'),JSON.stringify(report,null,2)+'\n');
 console.log(report.status,report.families.map(f=>({family:f.family,faces:f.triangles,palette:f.palette.length,error:f.maximumNormalizedPositionError})));
})().catch(error=>{console.error(error);process.exitCode=1});
