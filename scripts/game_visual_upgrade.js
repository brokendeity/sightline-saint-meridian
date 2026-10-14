// Saint Meridian visual polish. View state only: no targets, support volumes or input changes.
const cityVisualPolish=(()=>{
 const pools=Array.from({length:4},()=>new THREE.Vector4(0,-10000,0,1));
 const poolColors=Array.from({length:4},()=>new THREE.Color(0x000000));
 const anchors=[],signs=[],glows=[],lamps=[],matrix=new THREE.Matrix4(),zeroMatrix=new THREE.Matrix4().makeScale(0,0,0),dummy=new THREE.Object3D();
 const root=new THREE.Group();root.name='Saint Meridian / street light and business art';scene.add(root);
 const stats={ready:false,businesses:0,signInstances:0,visibleSigns:0,streetLamps:0,visibleLamps:0,lightPools:0,visiblePools:0,sharedTextures:0,extraDrawCalls:0,materialUpgrades:0,clock:0};
 let atlas=null,signMesh=null,poolMesh=null,lampMesh=null,headMesh=null,updateClock=1;
 const palette=[0xffb369,0xd879b8,0x67bec9,0xe7c487];
 const businesses=[
  ['NOVA DINER','OPEN ALL NIGHT'],['HAVEN MARKET','SUNDAY ROW'],['MERIDIAN BAKERY','EST. 1987'],['12TH STREET','COFFEE / RECORDS'],
  ['RIVIERA HOTEL','MERCER SQUARE'],['MERCER SQUARE','LIVE MUSIC / NIGHTCLUB'],['ELECTRIC ORACLE','NIGHT SESSIONS'],['MERIDIAN RECORDS','LISTEN / DISCOVER'],
  ['MERIDIAN SYSTEMS','GLASS WHARF'],['GLASS WHARF','TRANSIT / NIGHT SERVICE'],['MERIDIAN SUPPLY','WORKSHOP / REPAIRS'],['HALO WATCH','CITY PATROL'],
  ['WITNESS ARCHIVE','SAINT MERIDIAN'],['MERIDIAN LIBRARY','NIGHT READING ROOM'],['CIVIC MUSEUM','ART / MEMORY'],['CIVIC TRANSIT','LAST SERVICE 02:00']
 ];
 // Four selected motivated sources light nearby real surfaces. Uniform arrays are shared by
 // all imported buildings and asphalt materials, and existing two PointLights remain the budget.
 const uniforms={cvPools:{value:pools},cvPoolColors:{value:poolColors}};
 const declarations=`varying vec3 vCityWorld;
 uniform vec4 cvPools[4];uniform vec3 cvPoolColors[4];
 float cvHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float cvNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(cvHash(i),cvHash(i+vec2(1.,0.)),f.x),mix(cvHash(i+vec2(0.,1.)),cvHash(i+vec2(1.)),f.x),f.y);}
 vec3 cvIllumination(vec3 n){vec3 light=vec3(0.);for(int i=0;i<4;i++){vec3 d=cvPools[i].xyz-vCityWorld;float attenuation=pow(max(0.,1.-length(d)*cvPools[i].w),2.);float facing=.18+.82*max(0.,dot(n,normalize(d+vec3(.001))));light+=cvPoolColors[i]*attenuation*facing;}return light;}`;
 function shaderCoordinates(shader){
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCityWorld;').replace('#include <project_vertex>',`#include <project_vertex>
  vec4 cvWorldPosition=vec4(transformed,1.);
  #ifdef USE_INSTANCING
   cvWorldPosition=instanceMatrix*cvWorldPosition;
  #endif
  vCityWorld=(modelMatrix*cvWorldPosition).xyz;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+declarations);
  Object.assign(shader.uniforms,uniforms);
 }
 function material(mat){
  if(mat.userData.cityVisualPolish)return mat;mat.userData.cityVisualPolish=true;
  const prior=mat.onBeforeCompile;mat.onBeforeCompile=shader=>{
   prior(shader);shaderCoordinates(shader);
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 cvN=inverseTransformDirection(normal,viewMatrix);
   vec2 cvFace=abs(cvN.y)>.7?vCityWorld.xz:(abs(cvN.x)>.7?vCityWorld.zy:vCityWorld.xy);
   // Broad, quiet panel tint and rain staining; no wireframes or triangle-edge overlay.
   float cvPanel=cvHash(floor(cvFace/vec2(5.2,5.8)));
   float cvPaint=.86+cvPanel*.28+cvNoise(cvFace*vec2(.11,.013))*.14;
   float cvEmission=max(vCityEmission.r,max(vCityEmission.g,vCityEmission.b));
   float cvMetal=1.-smoothstep(.08,.23,cvEmission);
   float cvGlass=step(.14,diffuseColor.g)*step(.20,diffuseColor.b)*(1.-step(.07,diffuseColor.r))*(1.-step(.13,cvEmission));
   float cvRoom=step(.73,cvHash(floor(cvFace/vec2(4.8,8.5))+vec2(5.,2.)));
   diffuseColor.rgb*=mix(1.,cvPaint,cvMetal);
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.78,.88,.97),cvGlass);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.155,.087,.041),cvGlass*cvRoom*.42);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>`);
   // This hook precedes the existing toon finish. Keep authored edge light saturated and
   // soffits warm, while a little diffuse fill reveals the shape of midnight cladding.
   shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`vec3 cvPool=cvIllumination(inverseTransformDirection(normal,viewMatrix));
   outgoingLight+=cvPool*(diffuseColor.rgb*.70+vec3(.010))*cvMetal;
   outgoingLight+=diffuseColor.rgb*vec3(.115,.145,.18)*cvMetal;
   outgoingLight+=vec3(.033,.014,.004)*cvGlass*cvRoom;
   #include <output_fragment>`);
  };
  mat.customProgramCacheKey=()=> 'SaintMeridianBuildingPolish3';mat.needsUpdate=true;stats.materialUpgrades++;return mat;
 }
 function asphaltMaterial(mat){
  if(mat.userData.cityAsphaltPolish)return;mat.userData.cityAsphaltPolish=true;
  const prior=mat.onBeforeCompile;mat.onBeforeCompile=shader=>{
   if(prior)prior(shader);shaderCoordinates(shader);
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float cvGrain=cvNoise(vCityWorld.xz*4.3),cvTar=cvNoise(vCityWorld.xz*.024);
   diffuseColor.rgb*=.82+cvGrain*.18+cvTar*.20;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor*(.79+cvTar*.32),.24,.90);`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`outgoingLight+=cvIllumination(inverseTransformDirection(normal,viewMatrix))*(diffuseColor.rgb*.92+vec3(.012));
   #include <output_fragment>`);
  };
  mat.customProgramCacheKey=()=> 'SaintMeridianAsphaltPolish2';mat.needsUpdate=true;stats.materialUpgrades++;
 }
 function makeAtlas(){
  const c=document.createElement('canvas');c.width=2048;c.height=512;const ctx=c.getContext('2d');
  for(let i=0;i<16;i++){const x=i%4*512,y=Math.floor(i/4)*128,color='#'+palette[Math.floor(i/4)].toString(16).padStart(6,'0');ctx.fillStyle='#08121c';ctx.fillRect(x,y,512,128);ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(x+8,y+8,496,112);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.font='700 36px sans-serif';let f=36;while(ctx.measureText(businesses[i][0]).width>465&&f>22){ctx.font='700 '+(--f)+'px sans-serif'}ctx.fillText(businesses[i][0],x+256,y+52);ctx.font='16px monospace';ctx.fillStyle='#bec8cf';ctx.fillText(businesses[i][1],x+256,y+94);}
  const texture=new THREE.CanvasTexture(c);texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());texture.encoding=THREE.sRGBEncoding;stats.sharedTextures=1;return texture;
 }
 function mountedSign(c,id,rear){
  const b=c.box,size=b.getSize(new THREE.Vector3()),out=new THREE.Vector3(0,0,rear?-1:1),ray=new THREE.Raycaster(),baseY=Math.min(size.y*.10,6.2),height=Math.min(3.8,Math.max(1.25,size.y*.06));
  const from=new THREE.Vector3(c.mesh.position.x,b.min.y+Math.max(height*.7+1,baseY),rear?b.min.z-2:b.max.z+2);
  ray.set(from,out.clone().negate());ray.far=size.z+4;const hit=ray.intersectObject(c.mesh,false).find(h=>h.face&&Math.abs(h.face.normal.z)>.85);if(!hit)return null;
  let width=Math.min(17,size.x*.42),safe=false;const p=hit.point.clone();
  // Check both sign edges are on this same facade, rather than bridging a recessed entrance.
  for(let attempt=0;attempt<4;attempt++){safe=true;for(const dx of [-width*.46,width*.46]){const origin=from.clone();origin.x+=dx;ray.set(origin,out.clone().negate());const edge=ray.intersectObject(c.mesh,false)[0];if(!edge||Math.abs(edge.point.z-p.z)>.55){safe=false;break}}if(safe)break;width*=.72}
  if(!safe||width<2.4)return null;p.addScaledVector(out,.075);
  const district=districtIndex(p.x,p.z),tile=district*4+(id%4),color=new THREE.Color(palette[district]);
  return{owner:c,position:p,width,height:Math.min(height,width*.25),rear,tile,color,out,district};
 }
 function makeSignGeometry(entries){
  const geo=new THREE.PlaneGeometry(1,1),offsets=new Float32Array(entries.length*2);
  entries.forEach((e,i)=>offsets.set([(e.tile%4)/4,(3-Math.floor(e.tile/4))/4],i*2));geo.setAttribute('cityAtlas',new THREE.InstancedBufferAttribute(offsets,2));return geo;
 }
 function addLamp(x,z,id){
  const p=new THREE.Vector3(x,.08,z);if(Math.hypot(x,z)<115||buildingColliders.some(c=>c.box.min.x-1<x&&c.box.max.x+1>x&&c.box.min.z-1<z&&c.box.max.z+1>z))return;
  const color=new THREE.Color(id%4===0?0x75bdcb:0xffbb77),position=p.clone().add(new THREE.Vector3(0,6.9,0));lamps.push({position:p,color});anchors.push({position:position.clone(),color:color.clone().multiplyScalar(.30),radius:32,owner:null,kind:'lamp'});nightEmitters.push({position,color:color.clone()});glows.push({position:p.clone(),width:14,height:20,color:color.clone(),owner:null,lamp:true});
 }
 function build(){
  if(stats.ready||importedCity.status!=='ready')return;
  // Light composition keeps deep shadows and readable fronts; neon supplies local contrast.
  const hemi=scene.children.find(o=>o.isHemisphereLight);if(hemi){hemi.color.setHex(0x80b4c1);hemi.groundColor.setHex(0x242030);hemi.intensity=.46}
  sun.color.setHex(0xb2d8dc);sun.intensity=.78;moon.color.setHex(0x8490b2);moon.intensity=.26;rim.color.setHex(0xffad76);rim.intensity=.25;
  sun.shadow.camera.left=-180;sun.shadow.camera.right=180;sun.shadow.camera.top=180;sun.shadow.camera.bottom=-180;sun.shadow.camera.near=.5;sun.shadow.camera.far=1100;sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00015;sun.shadow.normalBias=.25;
  renderer.toneMappingExposure=.98;scene.fog.color.setHex(0x0c2c38);scene.fog.density=.00108;
  neonLights.forEach(l=>{l.intensity=1.75;l.distance=52;});
  for(const e of nightEmitters)anchors.push({position:e.position.clone(),color:e.color.clone().multiplyScalar(.20),radius:30,owner:null,kind:'plaza'});
  ground.material.color.setHex(0x172331);asphaltMaterial(ground.material);asphaltMaterial(plaza.material);grid.material.opacity=.13;
  world.children.forEach(o=>{if(o.isMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.height===.05){o.material.color.setHex(0x151e29);o.material.roughness=.54;o.material.metalness=.14;asphaltMaterial(o.material)}});
  for(const c of buildingColliders){const id=c.mesh.userData.cityBuildingId;for(const rear of [false,true]){const e=mountedSign(c,id,rear);if(!e)continue;signs.push(e);anchors.push({position:e.position.clone().addScaledVector(e.out,2),anchorPosition:e.position,color:e.color.clone().multiplyScalar(.33),radius:Math.max(28,e.width*2),owner:c,kind:'business'});nightEmitters.push({position:e.position.clone().addScaledVector(e.out,2),anchorPosition:e.position,color:e.color.clone(),owner:c});glows.push({position:new THREE.Vector3(e.position.x,.078,e.position.z).addScaledVector(e.out,4.8),width:e.width*1.1,height:13,color:e.color.clone(),owner:c,source:e});}}
  // Street furniture is a visual accent on existing open road verges. It never enters a
  // ray-target, collision, landing, mission or navigation registry.
  for(let road=-4;road<=4;road++)for(let cross=-4;cross<=4;cross++){if((road+cross)%2)continue;addLamp(road*160+9,cross*160+42,road-cross);addLamp(cross*160+42,road*160-9,road+cross)}
  atlas=makeAtlas();const signMat=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{map:{value:atlas}}]),fog:true,toneMapped:true,vertexShader:`attribute vec2 cityAtlas;varying vec2 cvUv;
  #include <common>
  #include <fog_pars_vertex>
  void main(){cvUv=uv*.25+cityAtlas;vec4 mvPosition=modelViewMatrix*instanceMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
  }`,fragmentShader:`uniform sampler2D map;varying vec2 cvUv;
  #include <common>
  #include <fog_pars_fragment>
  void main(){vec3 color=pow(texture2D(map,cvUv).rgb,vec3(2.2));gl_FragColor=vec4(color*.90,1.);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>
  }`});
  signMesh=new THREE.InstancedMesh(makeSignGeometry(signs),signMat,signs.length);signMesh.frustumCulled=false;signMesh.renderOrder=1;signMesh.name='Shared business atlas / mounted facade signs';root.add(signMesh);
  const poolMat=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,vertexShader:`varying vec2 cvUv;varying vec3 cvColor;void main(){cvUv=uv;cvColor=instanceColor;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;varying vec2 cvUv;varying vec3 cvColor;void main(){vec2 p=(cvUv-.5)*2.;float alpha=pow(max(0.,1.-dot(p,p)),2.)*.13;float shimmer=.94+.06*sin(p.y*90.+time*.18);gl_FragColor=vec4(cvColor,alpha*shimmer);}`});
  poolMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),poolMat,glows.length);poolMesh.frustumCulled=false;poolMesh.name='Wet pavement / motivated light pools';root.add(poolMesh);
  const poleMat=new THREE.MeshStandardMaterial({color:0x223138,roughness:.56,metalness:.62}),heads=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true});
  lampMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),poleMat,lamps.length*2);lampMesh.frustumCulled=false;lampMesh.name='Streetlight poles and arms';lampMesh.receiveShadow=true;root.add(lampMesh);
  headMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),heads,lamps.length);headMesh.frustumCulled=false;headMesh.name='Warm streetlight luminaires';root.add(headMesh);
  signs.forEach((e,i)=>signMesh.setMatrixAt(i,zeroMatrix));glows.forEach((e,i)=>{poolMesh.setMatrixAt(i,zeroMatrix);poolMesh.setColorAt(i,e.color)});lamps.forEach((e,i)=>{lampMesh.setMatrixAt(i*2,zeroMatrix);lampMesh.setMatrixAt(i*2+1,zeroMatrix);headMesh.setMatrixAt(i,zeroMatrix);headMesh.setColorAt(i,e.color)});
  stats.ready=true;stats.businesses=businesses.length;stats.signInstances=signs.length;stats.streetLamps=lamps.length;stats.lightPools=glows.length;stats.extraDrawCalls=4;update(0);
 }
 function damaged(entry){
  const owner=entry.owner;if(!owner)return false;if(owner.destroyed)return true;
  const point=entry.source?.position||entry.anchorPosition||entry.position;
  if(owner.damageCount&&!owner.parts.some(p=>p.box.clone().expandByScalar(.28).containsPoint(point)))return true;
  return false;
 }
 function update(dt=0){
  if(!stats.ready)return;stats.clock+=reducedMotion.matches?0:Math.max(0,dt);poolMesh.material.uniforms.time.value=stats.clock;
  // Shadows stay around the camera as the character traverses the city, without rotating
  // moonlight or making the scenic sun point at the character.
  sun.target.position.set(camera.position.x,0,camera.position.z);sun.position.copy(sun.target.position).add(new THREE.Vector3(-180,320,90));sun.target.updateMatrixWorld();
  updateClock+=Math.max(0,dt);if(updateClock<.18&&dt!==0)return;updateClock=0;
  const range=performanceBudget.quality==='mobile'?230:360,near=anchors.filter(a=>!damaged(a)).map(a=>({a,d:a.position.distanceToSquared(camera.position)})).sort((a,b)=>a.d-b.d);
  for(let i=0;i<4;i++){const entry=near[i]?.a;if(entry){pools[i].set(entry.position.x,entry.position.y,entry.position.z,1/entry.radius);poolColors[i].copy(entry.color)}else{pools[i].set(0,-10000,0,1);poolColors[i].setHex(0)}}
  let visible=0;signs.forEach((e,i)=>{const show=!damaged(e)&&e.position.distanceToSquared(camera.position)<range*range;if(show){dummy.position.copy(e.position);dummy.rotation.set(0,e.rear?Math.PI:0,0);dummy.scale.set(e.width,e.height,1);dummy.updateMatrix();signMesh.setMatrixAt(i,dummy.matrix);visible++}else signMesh.setMatrixAt(i,zeroMatrix)});stats.visibleSigns=visible;signMesh.instanceMatrix.needsUpdate=true;
  visible=0;glows.forEach((e,i)=>{const show=!damaged(e)&&e.position.distanceToSquared(camera.position)<(range*.8)**2;if(show){dummy.position.copy(e.position);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(e.width,e.height,1);dummy.updateMatrix();poolMesh.setMatrixAt(i,dummy.matrix);visible++}else poolMesh.setMatrixAt(i,zeroMatrix)});stats.visiblePools=visible;poolMesh.instanceMatrix.needsUpdate=true;
  visible=0;lamps.forEach((e,i)=>{const show=e.position.distanceToSquared(camera.position)<range*range;if(show){dummy.position.copy(e.position).add(new THREE.Vector3(0,3.4,0));dummy.rotation.set(0,0,0);dummy.scale.set(.19,6.8,.19);dummy.updateMatrix();lampMesh.setMatrixAt(i*2,dummy.matrix);dummy.position.copy(e.position).add(new THREE.Vector3(.62,6.85,0));dummy.scale.set(1.4,.15,.19);dummy.updateMatrix();lampMesh.setMatrixAt(i*2+1,dummy.matrix);dummy.position.copy(e.position).add(new THREE.Vector3(1.18,6.73,0));dummy.scale.set(.62,.15,.36);dummy.updateMatrix();headMesh.setMatrixAt(i,dummy.matrix);visible++}else{lampMesh.setMatrixAt(i*2,zeroMatrix);lampMesh.setMatrixAt(i*2+1,zeroMatrix);headMesh.setMatrixAt(i,zeroMatrix)}});stats.visibleLamps=visible;lampMesh.instanceMatrix.needsUpdate=headMesh.instanceMatrix.needsUpdate=true;
 }
 function state(){return {...stats,exposure:renderer.toneMappingExposure,fogDensity:scene.fog.density,projectedSources:pools.map((p,i)=>({position:[p.x,p.y,p.z],radius:1/p.w,color:poolColors[i].getHex()})),pointLights:neonLights.length,shadowExtent:sun.shadow.camera.right-sun.shadow.camera.left,packedDepthStencil:phaseTarget.stencilBuffer};}
 return {build,material,update,state,root,isSourceValid:entry=>!damaged(entry)};
})();
window.visualPolishState=()=>cityVisualPolish.state();
