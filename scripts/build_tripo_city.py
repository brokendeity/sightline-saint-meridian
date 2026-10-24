from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];base=root/'SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html';s=base.read_text();course=(root/'scripts/game_backspool_vault_course.js').read_text();start=s.index('/* Optional in-world vault lane.');end=s.index('window.backspoolVaultCourse=backspoolVaultCourse;',start)+len('window.backspoolVaultCourse=backspoolVaultCourse;');assert s[start:end].strip()==course.strip()
course=course.replace(' let ready=false',' const imported={barrier:{status:"loading"},planter:{status:"loading"}};\n let ready=false',1)
marker=' function start(){'
loader=''' function installTripo(o,proxy){
  const record=imported[o.id];new THREE.GLTFLoader().load('assets/city/tripo/'+o.id+'.glb',gltf=>{
   const model=gltf.scene;model.rotation.y=Math.PI/2;model.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   const tileWidth=o.width/3;const group=new THREE.Group();group.name='Tripo / '+o.id;
   model.scale.set((tileWidth-.025)/size.x,(o.top-.4)/size.y,(o.depth-.012)/size.z);
   // Scale in world axes outside the rotated source so width/depth remain predictable.
   model.scale.set(1,1,1);
   for(let i=0;i<3;i++){
    const tile=new THREE.Group(),instance=model.clone(true);instance.position.sub(center);instance.position.y+=size.y/2;
    tile.add(instance);tile.scale.set((tileWidth-.025)/size.x,(o.top-.4)/size.y,(o.depth-.012)/size.z);tile.position.set(-o.width/2+tileWidth*(i+.5),.4,o.z);group.add(tile);
   }
   group.traverse(m=>{if(m.isMesh){m.castShadow=false;m.receiveShadow=true;m.material=m.material.clone();m.material.roughness=Math.max(.55,m.material.roughness||0);}});
   root.add(group);group.updateMatrixWorld(true);
   // Keep the proven solid proxy for support, camera rays, destruction and automatic vault queries.
   proxy.material=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false});
   record.status='ready';record.instances=3;record.bounds=new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3()).toArray();
  },undefined,error=>{record.status='failed';record.error=String(error);console.error('Tripo '+o.id+' load failed',error);});
 }
'''
course=course.replace(marker,loader+marker,1)
needle='   const front=o.z+o.depth/2;';course=course.replace(needle,"   if(imported[o.id]){installTripo(o,mesh);sign(o.id==='barrier'?'01  SERVICE BARRIER':'02  RAIN GARDEN',4.65,1.12,o.z+.2,2.4);continue;}\n"+needle,1)
course=course.replace('return{ready,error,location:', 'return{imported:JSON.parse(JSON.stringify(imported)),ready,error,location:',1)
s=s[:start]+course+s[end:];s=s.replace('<title>','<title>Tripo city props — ',1);target=root/'SIGHTLINE_BACKSPOOL_TRIPO_CITY.html';target.write_text(s);(root/'output/tripo-city/build.json').write_text(json.dumps({'base':base.name,'baseHash':hashlib.sha256(base.read_bytes()).hexdigest(),'candidate':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()},indent=2)+'\n');print(target)
