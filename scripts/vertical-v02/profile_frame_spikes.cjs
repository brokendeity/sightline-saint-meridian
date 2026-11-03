/* Frame-spike attribution. Native RAF loop at a fixed 1280x800 render size; one labelled setup places Backspool on the lower
   public loop, then a standard simulated controller follows the loop (same steering as the V02 benchmarks). A CDP sampling
   CPU profile runs throughout; every frame interval above the spike threshold is attributed to the self time of the functions
   sampled inside it, and the totals are reported per function and per script. Optional ?combat stress: periodic impact bursts.
   Usage: node profile_frame_spikes.cjs <entry.html> <out.json> [seconds] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const entry=process.argv[2],outFile=path.resolve(process.argv[3]),seconds=+(process.argv[4]||60),stress=process.env.SPIKE_STRESS==='1';
const graph=JSON.parse(fs.readFileSync(path.join(D,'V02_Movement_Graph.json'))),nodeMap=new Map(graph.nodes.map(n=>[n.id,n.position])),route=graph.loops.find(x=>x.id==='lower').nodes.map(id=>nodeMap.get(id));
const pct=a=>{const b=a.slice().sort((x,y)=>x-y);return{samples:b.length,p50:b[Math.floor(b.length*.5)],p95:b[Math.floor(b.length*.95)],p99:b[Math.floor(b.length*.99)],max:b.at(-1)}};
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal','--mute-audio']});try{
 const context=await browser.newContext({viewport:{width:1280,height:800}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto('http://127.0.0.1:8766/'+entry+'?capture=backspool');
 await p.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&roadNetworkState().ready&&verticalWorldLifeState().ready&&characterState().active==='backspool'&&!characterState().busy,null,{timeout:180000});
 await p.evaluate(()=>{adaptiveQuality.enabled=false;adaptiveQuality.scale=1;renderer.setPixelRatio(1);renderer.setSize(1280,800,false);renderNight(0);});
 await p.click('#v02Start');
 // Labelled setup: start on the lower public loop; from here only the simulated controller moves Backspool.
 await p.evaluate(()=>{resetPlayer();clearInput();clearPad();startGame(false);s.pos.set(55,24.42,210);s.vel.set(0,0,0);s.onGround=true;setMode(P.GROUND);s.yaw=cam.yaw=cam.targetYaw=0;window.spikePad={index:0,id:'spike profile controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};navigator.getGamepads=()=>[spikePad];});
 if(!await p.evaluate(()=>threadrailGame.sprinting()))await p.keyboard.press('Shift');
 await p.waitForTimeout(3000);
 const cdp=await context.newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:250});
 const origin=await p.evaluate(()=>performance.timeOrigin);
 await cdp.send('Profiler.start');
 const markNow=await p.evaluate(()=>{const t0=performance.now();(function __spikeClockMarker(){const e=t0+40;while(performance.now()<e);})();return t0;});
 await p.evaluate(([route,seconds,stress])=>{const d=window.__spike={frames:[],route,ri:1,done:false,steps:0,sim:[],render:[],calls:[],geoms:[],textures:[],programs:[]};
  const sample=actionMetrics.sample;actionMetrics.sample=function(kind,time){if(!d.done)d[kind==='simulation'?'sim':'render'].push([performance.now(),time]);return sample.call(this,kind,time)};
  const original=tickFrame;tickFrame=function(dt,draw){if(!d.done){let t=route[d.ri],dx=t[0]-s.pos.x,dz=t[2]-s.pos.z,q=Math.hypot(dx,dz);if(q<.3){d.ri=d.ri+1<route.length?d.ri+1:1;t=route[d.ri];dx=t[0]-s.pos.x;dz=t[2]-s.pos.z;q=Math.hypot(dx,dz);}
    const m=Math.min(1,Math.max(.12,q/6.16)),x=(dx*Math.cos(cam.yaw)-dz*Math.sin(cam.yaw))/Math.max(q,1e-9),y=(-dx*Math.sin(cam.yaw)-dz*Math.cos(cam.yaw))/Math.max(q,1e-9);spikePad.axes[0]=x*(.1+.9*m);spikePad.axes[1]=-y*(.1+.9*m);
    d.steps++;if(stress&&d.steps%45===0&&window.impactFX){const a=new THREE.Vector3(s.pos.x+Math.sin(d.steps)*6,s.pos.y,s.pos.z+Math.cos(d.steps)*6);impactFX.burst(a,new THREE.Vector3(0,1,0),{surface:['concrete','metal','asphalt','glass'][d.steps/45%4|0],strength:1.2,source:'profile'});}
    if(d.steps>=seconds*60){d.done=true;spikePad.axes=[0,0,0,0];}}
   return original(dt,draw);};
  const frame=now=>{if(d.done)return;d.frames.push(now);const i=renderer.info;d.calls.push(i.render.calls);d.geoms.push(i.memory.geometries);d.textures.push(i.memory.textures);d.programs.push(i.programs?.length||0);requestAnimationFrame(frame)};requestAnimationFrame(frame);},[route,seconds,stress]);
 while(!await p.evaluate(()=>__spike.done))await p.waitForTimeout(2000);
 const {profile}=await cdp.send('Profiler.stop');const data=await p.evaluate(()=>{const d=__spike;return{frames:d.frames,sim:d.sim,render:d.render,calls:d.calls,geoms:d.geoms,textures:d.textures,programs:d.programs,pos:s.pos.toArray()}});
 // Profile timestamps are in microseconds on the monotonic clock; convert sample times to page performance.now() ms.
 const nodes=new Map(profile.nodes.map(n=>[n.id,n]));let t=profile.startTime;const samples=profile.samples.map((id,i)=>{t+=profile.timeDeltas[i];return[t/1000,id]});
 // Align clocks: the first sample inside __spikeClockMarker corresponds to performance.now() = markNow.
 const markerSample=samples.find(([,id])=>nodes.get(id).callFrame.functionName==='__spikeClockMarker');if(!markerSample)throw Error('clock marker not sampled');const offset=markerSample[0]-markNow;
 const iv=[];for(let i=1;i<data.frames.length;i++)iv.push(data.frames[i]-data.frames[i-1]);const stat=pct(iv),threshold=Math.max(25,stat.p50*2);
 const label=n=>{const c=n.callFrame;return(c.functionName||'(anon)')+' '+(c.url?c.url.split('/').pop().split('?')[0]:'')+':'+(c.lineNumber+1)};
 const fileOf=n=>{const c=n.callFrame;return c.url?c.url.split('/').pop().split('?')[0]:(c.functionName.startsWith('(')?c.functionName:'(native)')};
 const spikes=[],byFn=new Map(),byFile=new Map(),all=new Map();let si=0;const st=samples.map(([ts,id])=>[ts-offset,id]);
 const allFn=new Map();for(const [ts,id] of st){const n=nodes.get(id);all.set(fileOf(n),(all.get(fileOf(n))||0)+1);allFn.set(label(n),(allFn.get(label(n))||0)+1);}
 for(let i=1;i<data.frames.length;i++){const a=data.frames[i-1],b=data.frames[i];if(b-a<threshold)continue;const local=new Map();while(si<st.length&&st[si][0]<a)si++;let j=si;while(j<st.length&&st[j][0]<b){const n=nodes.get(st[j][1]),k=label(n);local.set(k,(local.get(k)||0)+1);byFn.set(k,(byFn.get(k)||0)+1);byFile.set(fileOf(n),(byFile.get(fileOf(n))||0)+1);j++;}
  spikes.push({atMs:Math.round(a-data.frames[0]),ms:+(b-a).toFixed(1),drawCalls:data.calls[i],geometries:data.geoms[i],textures:data.textures[i],programs:data.programs[i],programsBefore:data.programs[i-1],top:[...local].sort((x,y)=>y[1]-x[1]).slice(0,6).map(([k,v])=>[k,+(v*.25).toFixed(1)])});}
 const top=m=>[...m].sort((x,y)=>y[1]-x[1]).slice(0,30).map(([k,v])=>[k,+(v*.25).toFixed(1)]);
 const report={entry,seconds,stress,viewport:[1280,800],frameIntervalsMs:stat,longFrames:Object.fromEntries([17.5,20,25,33.4,50].map(ms=>['over'+ms+'ms',iv.filter(x=>x>ms).length])),threshold,spikeCount:spikes.length,simulationCpuMs:pct(data.sim.map(x=>x[1])),renderCpuMs:pct(data.render.map(x=>x[1])),drawCalls:pct(data.calls),programs:{start:data.programs[0],end:data.programs.at(-1)},textures:{start:data.textures[0],end:data.textures.at(-1)},geometries:{start:data.geoms[0],end:data.geoms.at(-1)},
  spikeSelfMsByFunction:top(byFn),spikeSelfMsByScript:top(byFile),wholeRunSelfMsByScript:top(all),wholeRunSelfMsByFunction:top(allFn),spikes,endPosition:data.pos,errors,note:'Headless Chromium on ANGLE/Metal; CPU sampling at 250 us; clocks aligned with a 40 ms marker function (alignment error under one sample).'};
 fs.writeFileSync(outFile,JSON.stringify(report,null,1));console.log(JSON.stringify({frames:stat,longFrames:report.longFrames,threshold,spikes:spikes.length,sim:report.simulationCpuMs,render:report.renderCpuMs,programs:report.programs,textures:report.textures,topFn:report.spikeSelfMsByFunction.slice(0,15),topFile:report.spikeSelfMsByScript.slice(0,10),wholeFn:report.wholeRunSelfMsByFunction.slice(0,20)},null,1));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
