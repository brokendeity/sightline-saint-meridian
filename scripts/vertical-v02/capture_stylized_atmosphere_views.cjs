/* Before/after look evidence for the stylized atmosphere candidate. Same six inspection cameras for every build; the
 * cameras are labelled inspection fixtures (no actor, geometry or gameplay state is moved to stage them). RAF is frozen and
 * the sky clock pinned, so differences come from the build, not from cloud drift; world-life and transit clocks are logged
 * because pedestrians and trains can still sit in different places between runs.
 * Usage: node capture_stylized_atmosphere_views.cjs <entry.html> <outDir> [extra query, e.g. stylized=0] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),entry=process.argv[2],out=path.resolve(process.argv[3]),extra=process.argv[4]||'';fs.mkdirSync(out,{recursive:true});
const views=[
 {id:'street',label:'Street level, lower city',position:[53.6,2.4,216],look:[58,5,150]},
 {id:'street-wide',label:'Street canyon, upward',position:[80,2,295],look:[80,70,450]},
 {id:'deck24',label:'Lower public loop deck (Y24)',position:[55,27.2,219],look:[56,24,170]},
 {id:'mid52',label:'Mid-level overlook (Y52)',position:[70,55,240],look:[92,44,330]},
 {id:'high',label:'High-city overlook',position:[68,120,225],look:[82,87,350]},
 {id:'skyline',label:'Long skyline (fog falloff)',position:[40,60,120],look:[200,40,600]}];
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});const report={entry,entrySHA256:sha(entry),query:extra,viewport:[1280,800],captures:[],errors:[]};try{
 const p=await browser.newPage({viewport:{width:1280,height:800}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool'+(extra?'&'+extra:''));
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&roadNetworkState().ready&&verticalDistrictState().ready&&verticalWorldLifeState?.().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:180000});
 await p.evaluate(()=>{adaptiveQuality.enabled=false;adaptiveQuality.scale=1;renderer.setPixelRatio(1);renderer.setSize(1280,800,false);});
 await p.click('#v02Start');
 // The candidate builds its rain-cover map ~1.5 s after the world is ready; the source build has no such step.
 await p.waitForFunction(()=>!window.stylizedAtmosphere||['built','failed'].includes(stylizedAtmosphere.state().overlays.state),null,{timeout:30000});
 await p.waitForTimeout(1500);
 report.atmosphere=await p.evaluate(()=>window.stylizedAtmosphere?.state()||null);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(300);
 for(const v of views){
  const shot=await p.evaluate(v=>{camera.position.fromArray(v.position);camera.up.set(0,1,0);camera.lookAt(...v.look);camera.fov=50;camera.aspect=1280/800;camera.near=.05;camera.far=1800;camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
   nightUniforms.time.value=20;renderNight(0);const t0=performance.now();renderNight(0);const ms=performance.now()-t0;
   return{id:v.id,label:v.label,cameraAfter:camera.position.toArray().map(x=>+x.toFixed(3)),lifeClock:verticalWorldLifeState().clock,transitClock:verticalTransitState().motion.clock,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,submitMs:+ms.toFixed(2),png:renderer.domElement.toDataURL('image/png')}},v);
  const file=path.join(out,v.id+'.png');fs.writeFileSync(file,Buffer.from(shot.png.split(',')[1],'base64'));delete shot.png;shot.file=path.relative(R,file);shot.position=v.position;shot.look=v.look;report.captures.push(shot);
 }
 report.status=report.errors.length?'FAIL page errors':'CAPTURED';
}catch(e){report.status='FAIL';report.errors.push(String(e&&e.stack||e));}finally{await browser.close();fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(report,null,1));console.log(report.status,report.captures.length,'views',report.errors.slice(0,3).join(' | '));}})();
