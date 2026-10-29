/* Controlled optical inspection only. No candidate/runtime/source files change.
 * Display RGB changes identify contributors; they are not linear radiometry or
 * performance measurements. The mask is conservatively opaque/depth-tested. */
const {chromium}=require('/opt/homebrew/lib/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const E=path.join(D,'evidence/facade-light-contributions');fs.mkdirSync(E,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const build=JSON.parse(fs.readFileSync(path.join(D,'V02_East_Public_Room_Life_Build.json')));
const report={status:'FAIL',entry:build.entry,entrySHA256:sha(build.entry),manifestSHA256:sha(build.manifest),
 scriptSHA256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),cases:[],errors:[],
 scope:'Same frozen native B camera and scene. Temporary light/reflection ablations isolate glare on visible original building141 cladding. No visual acceptance, physical radiometry or performance claim.'};
let browser,page;
(async()=>{try{
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 page=await browser.newPage({viewport:{width:1664,height:936}});
 page.on('pageerror',e=>report.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto('http://127.0.0.1:8766/'+build.entry+'?capture=backspool');
 await page.waitForFunction(()=>gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&
  v02EastPublicLightingState().ready&&v02FacadeCassettesState().ready&&window.v02SurfaceNormalsState&&!characterState().busy,
  null,{timeout:120000});
 await page.evaluate(()=>{window.requestAnimationFrame=()=>0;gameActive=false;});await page.waitForTimeout(100);
 report.fixture=await page.evaluate(()=>{
  adaptiveQuality.enabled=false;adaptiveQuality.scale=1;renderer.setPixelRatio(1);renderer.setSize(1664,936,false);
  camera.position.set(80,2,295);camera.lookAt(80,70,450);camera.fov=50;camera.aspect=1664/936;
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderNight(0);
  const owner=buildingColliders[141],material=owner.mesh.material;
  window.__facadeLightStudy={material,intensity:material.envMapIntensity,lights:[]};
  scene.traverse(o=>{if(o.isLight)__facadeLightStudy.lights.push({light:o,intensity:o.intensity});});
  return{owner:owner.mesh.userData.cityBuildingId,position:camera.position.toArray(),cameraWorld:camera.matrixWorld.toArray(),
   projection:camera.projectionMatrix.toArray(),environmentIntensity:material.envMapIntensity,
   sourceMaterial:material.name,lights:__facadeLightStudy.lights.map(({light,intensity})=>({id:light.uuid,type:light.type,intensity,color:light.color.toArray()}))};
 });
 report.mask=await page.evaluate(()=>{
  const owner=buildingColliders[141],selected=new Set([owner.mesh,owner.lodMesh]);
  const mask=new THREE.ShaderMaterial({uniforms:{selected:{value:0}},side:THREE.DoubleSide,
   skinning:false,morphTargets:false,toneMapped:false,
   vertexShader:`attribute vec3 cityEmission;attribute vec2 cityReflectance;varying float cladding;
    #include <common>
    #include <morphtarget_pars_vertex>
    #include <skinning_pars_vertex>
    void main(){cladding=(1.-step(.0001,max(cityEmission.r,max(cityEmission.g,cityEmission.b))))*
      step(.60,cityReflectance.x)*(1.-step(.65,cityReflectance.x));
     #include <skinbase_vertex>
     #include <begin_vertex>
     #include <morphtarget_vertex>
     #include <skinning_vertex>
     #include <project_vertex>
    }`,fragmentShader:'uniform float selected;varying float cladding;void main(){gl_FragColor=vec4(vec3(selected*cladding),1.);}'});
  mask.defaultAttributeValues={...mask.defaultAttributeValues,cityEmission:[0,0,0],cityReflectance:[0,0]};
  const hooks=[];scene.traverse(o=>{if(!o.isMesh)return;const original=o.onBeforeRender;hooks.push([o,original]);o.onBeforeRender=function(...args){
   original?.apply(this,args);mask.uniforms.selected.value=selected.has(this)?1:0;mask.uniformsNeedUpdate=true;};});
  const rt=new THREE.WebGLRenderTarget(1664,936,{format:THREE.RGBAFormat,type:THREE.UnsignedByteType,depthBuffer:true});
  const oldOverride=scene.overrideMaterial,oldTarget=renderer.getRenderTarget(),oldColor=renderer.getClearColor(new THREE.Color()),oldAlpha=renderer.getClearAlpha();
  const raw=new Uint8Array(1664*936*4);
  try{scene.overrideMaterial=mask;renderer.setClearColor(0x000000,1);renderer.setRenderTarget(rt);renderer.clear();
   renderer.render(scene,camera);renderer.readRenderTargetPixels(rt,0,0,1664,936,raw);
  }finally{scene.overrideMaterial=oldOverride;renderer.setRenderTarget(oldTarget);renderer.setClearColor(oldColor,oldAlpha);
   for(const [o,hook]of hooks)o.onBeforeRender=hook;rt.dispose();mask.dispose();}
  const indices=[];for(let y=0;y<936;y++)for(let x=0;x<1664;x++)if(raw[(y*1664+x)*4]>127)indices.push(((935-y)*1664+x)*4);
  __facadeLightStudy.mask=indices;
  const canvas=document.createElement('canvas');canvas.width=1664;canvas.height=936;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(1664,936);
  for(const i of indices){pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);
  return{pixels:indices.length,png:canvas.toDataURL('image/png'),policy:'Visible141non-emissive cladding metalness.62 only; transparent occluders treated opaque for a conservative mask'};
 });
 const maskFile=path.join(E,'cladding-mask.png');fs.writeFileSync(maskFile,Buffer.from(report.mask.png.split(',')[1],'base64'));delete report.mask.png;
 report.mask.file=path.relative(R,maskFile);report.mask.sha256=sha(report.mask.file);assert(report.mask.pixels>1000,'Insufficient visible cladding samples');
 for(const config of [{id:'baseline'},{id:'no-environment',environment:0},{id:'no-rim',rim:0},{id:'no-sun',sun:0},
  {id:'no-moon',moon:0},{id:'no-hemisphere',hemi:0},{id:'no-direct',sun:0,rim:0,moon:0},
  {id:'no-environment-no-direct',environment:0,sun:0,rim:0,moon:0},
  {id:'no-environment-no-rim',environment:0,rim:0},{id:'emission-art-fill-only',environment:0,allLights:0}]){
  const data=await page.evaluate(config=>{
   const study=__facadeLightStudy;study.material.envMapIntensity=study.intensity;
   for(const row of study.lights)row.light.intensity=row.intensity;
   if(config.environment===0)study.material.envMapIntensity=0;
   for(const key of ['sun','moon','rim'])if(config[key]===0)({sun,moon,rim})[key].intensity=0;
   if(config.hemi===0)for(const row of study.lights)if(row.light.isHemisphereLight)row.light.intensity=0;
   if(config.allLights===0)for(const row of study.lights)row.light.intensity=0;
   renderNight(0);const canvas=document.createElement('canvas');canvas.width=1664;canvas.height=936;
   const ctx=canvas.getContext('2d');ctx.drawImage(renderer.domElement,0,0);const raw=ctx.getImageData(0,0,1664,936).data;
   const channels=[[],[],[],[]];for(const i of study.mask){const r=raw[i]/255,g=raw[i+1]/255,b=raw[i+2]/255;
    channels[0].push(r);channels[1].push(g);channels[2].push(b);channels[3].push(.2126*r+.7152*g+.0722*b);}
   const statistics=channels.map(values=>{values.sort((a,b)=>a-b);return{p50:values[Math.floor(values.length*.5)],p95:values[Math.floor(values.length*.95)],mean:values.reduce((a,b)=>a+b,0)/values.length};});
   return{statistics,png:renderer.domElement.toDataURL('image/png'),cameraWorld:camera.matrixWorld.toArray()};
  },config);
  assert.deepEqual(data.cameraWorld,report.fixture.cameraWorld);const file=path.join(E,config.id+'.png');
  fs.writeFileSync(file,Buffer.from(data.png.split(',')[1],'base64'));delete data.png;
  report.cases.push({config,...data,file:path.relative(R,file),sha256:sha(path.relative(R,file))});
 }
 await page.evaluate(()=>{__facadeLightStudy.material.envMapIntensity=__facadeLightStudy.intensity;for(const row of __facadeLightStudy.lights)row.light.intensity=row.intensity;});
 assert.deepEqual(report.errors,[]);report.status='MEASURED controlled native visible-cladding optical ablations; manual interpretation and a source-authored repair still required';
}catch(error){report.failure=error.stack||String(error);console.error(error);process.exitCode=1;}
finally{fs.writeFileSync(path.join(D,'V02_Facade_Light_Contributions.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();console.log(report.status,report.failure||'');}})();
