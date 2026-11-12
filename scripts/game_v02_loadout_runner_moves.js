/* Loadout's moves from the Runner Action Animation Pack (assets/loadout/runner/, converted onto his skeleton by
 * scripts/characters/loadout/convert_runner_clips.cjs). Which Runner clip plays which role is data
 * (loadout_runner_roles.json); roles it does not name keep Backspool's retargeted clips.
 * Gameplay never changes, only the motion that presents it:
 * - Flow roles (jump, fall, landings, rolls, flips, slide, wall run, stride starts and stops) get a Loadout copy of
 *   the role whose playback rate fits the Runner clip into the original role's gameplay duration (loops keep their
 *   natural rate). While Loadout is the hero, window.backspoolFlowRoles and window.backspoolLocomotionRoles answer
 *   with his copies; for Backspool they answer exactly as before.
 * - Locomotion loops are time-scaled so that, at the game's rate of speed/referenceSpeed, the feet cover the ground
 *   they would at the clip's own measured speed.
 * - Some roles have several clips: idle variants play back to back, the Flow ground roll picks a clip by the stick
 *   direction relative to his facing, and wall runs by which side the wall is on, once each time the role starts.
 * - Fight stance and hit reaction poses come from Runner clips too.
 * - Each combat move's clip in Loadout's own bank is replaced by a window of a Runner attack that strikes with the
 *   same hand or foot, trimmed so the strike frame lands on the move's contact time.
 * Nothing here moves the actor, and Backspool's and Sightline's banks are never touched. */
(()=>{
 'use strict';
 const ROLES='assets/loadout/runner/loadout_runner_roles.json',CLIPS='assets/loadout/runner/loadout_runner_clips.json.gz';
 const hero=window.loadoutHero;if(!hero)throw Error('Loadout runner moves need game_v02_loadout_hero.js');
 const isLoadout=()=>window.characterState?.().hero==='loadout';
 let tables=null;const stats={loaded:false,clips:0,flowRoles:[],locomotion:{},combat:{},buildMs:0};
 async function fetchOk(url){const r=await fetch(url);if(!r.ok)throw Error('Loadout runner asset unavailable: '+url);return r;}

 // A copy of the clip sampled from a to b, starting at 0.
 function trim(clip,a,b,name,fps=60){
  const n=Math.max(2,Math.round((b-a)*fps)+1),times=new Float32Array(n);for(let i=0;i<n;i++)times[i]=(b-a)*i/(n-1);
  const tracks=clip.tracks.map(t=>{const it=t.createInterpolant(),size=t.getValueSize(),values=new Float32Array(n*size);
   for(let i=0;i<n;i++)values.set(it.evaluate(a+times[i]),i*size);return new t.constructor(t.name,times,values);});
  return new THREE.AnimationClip(name,b-a,tracks);
 }
 function retime(clip,factor,name){
  const c=clip.clone();c.name=name;c.duration=clip.duration*factor;
  for(const t of c.tracks){t.times=t.times.slice();for(let i=0;i<t.times.length;i++)t.times[i]*=factor;}
  return c;
 }
 const gameplayDuration=spec=>((spec.end??spec.duration)-(spec.start||0))/(spec.playbackRate||1);

 async function prepare(bank){
  const t0=performance.now();
  const [roles,packed]=await Promise.all([fetchOk(ROLES).then(r=>r.json()),fetchOk(CLIPS).then(r=>r.arrayBuffer())]);
  const data=JSON.parse(new TextDecoder().decode(fflate.gunzipSync(new Uint8Array(packed))));
  const runner={};for(const [name,e] of Object.entries(data.clips))runner[name]={...e,clip:THREE.AnimationClip.parse(e.clip)};
  const add=(id,clip)=>{clip.name=id;bank.clips[id]=clip;return id;};
  const loops=new Set(roles.loops||[]),variants=roles.variants||{},directional=roles.directional||{};
  // Variants play back to back as one loop (the three Runner idles), so a long idle does not repeat one clip. The
  // idles stand at different angles, so each seam (and the wrap back to the first) blends over BLEND seconds.
  const BLEND=.3,STEPS=9;
  const sequence=(names,id)=>{const parts=names.map(n=>runner[n].clip),map=new Map();let offset=0;
   const sample=(t,i)=>Array.from(t.values.slice(i*t.getValueSize(),(i+1)*t.getValueSize()));
   parts.forEach((c,k)=>{const next=parts[(k+1)%parts.length];
    for(const t of c.tracks){let e=map.get(t.name);if(!e)map.set(t.name,e={ctor:t.constructor,times:[],values:[]});for(const x of t.times)e.times.push(offset+x);for(const v of t.values)e.values.push(v);
     const to=next.tracks.find(u=>u.name===t.name);if(!to)continue;const a=sample(t,t.times.length-1),b=sample(to,0),q=t instanceof THREE.QuaternionKeyframeTrack;
     for(let i=1;i<=STEPS;i++){const f=i/(STEPS+1),out=new Array(a.length);if(q)THREE.Quaternion.slerpFlat(out,0,a,0,b,0,f);else for(let j=0;j<a.length;j++)out[j]=a[j]+(b[j]-a[j])*f;
      e.times.push(offset+c.duration+BLEND*f);e.values.push(...out);}}
    offset+=c.duration+BLEND;});
   return add(id,new THREE.AnimationClip(id,offset,[...map].map(([n,e])=>new e.ctor(n,e.times,e.values))));};
  // A role's timing for one clip: fitted into the original gameplay duration, or the natural rate for loops.
  const fit=(spec,id)=>{const d=bank.clips[id].duration;return{id,start:0,end:d,duration:d,playbackRate:loops.has(spec.role)?1:d/Math.max(.05,gameplayDuration(spec))};};
  // Direction-aware roles pick their clip when they start playing (after 0.2 s of game time unused), so the clip never
  // swaps mid-move.
  const latch={};stats.latch=latch;
  const clock=()=>typeof mechanicPolish!=='undefined'&&Number.isFinite(mechanicPolish.clock)?mechanicPolish.clock:performance.now()/1000;
  const choose=(role,pick)=>{const now=clock(),l=latch[role];if(!l||now-l.seen>.2||now<l.seen)latch[role]={dir:pick(),since:now,seen:now};else l.seen=now;return latch[role].dir;};
  // The stick direction relative to the way he faces.
  const relative=()=>{const raw=typeof getRawMoveInput==='function'?getRawMoveInput():null;if(!raw||raw.mag<.15||typeof getCameraRelativeMoveVector!=='function')return'front';
   const d=getCameraRelativeMoveVector(raw),fx=-Math.sin(s.yaw),fz=-Math.cos(s.yaw),ahead=d.x*fx+d.z*fz,side=fz*d.x-fx*d.z;
   return Math.abs(ahead)>=Math.abs(side)?(ahead>=0?'front':'back'):(side<0?'right':'left');};
  const choosers={
   groundRoll:()=>choose('groundRoll',relative),
   wallRun:()=>choose('wallRun',()=>{const n=window.backspoolAdvancedState?.().wallNormal||window.backspoolFlowState?.().wallNormal;if(!n)return'right';
    const fx=-Math.sin(s.yaw),fz=-Math.cos(s.yaw);return fz*-n.x-fx*-n.z<0?'right':'left';})};
  // Flow roles.
  const flowBase=window.backspoolFlowRoles;if(!flowBase?.roles)throw Error('Backspool flow roles must load before Loadout');
  const flow=flowBase.roles.map(spec=>{
   const base={...spec,pelvisTranslation:false,originalId:spec.id,sourcePack:'runner'};
   const dirs=directional[spec.role]&&choosers[spec.role]&&Object.entries(directional[spec.role]).filter(([,n])=>runner[n]);
   if(dirs?.length){
    const fits=Object.fromEntries(dirs.map(([dir,n])=>[dir,fit(spec,add('runner-'+n,runner[n].clip))])),fallback=fits[dirs[0][0]];
    const now=()=>fits[choosers[spec.role]()]||fallback;
    for(const k of ['id','start','end','duration','playbackRate'])Object.defineProperty(base,k,{enumerable:true,get:()=>now()[k]});
    base.runnerClips=Object.fromEntries(dirs);stats.flowRoles.push(spec.role);return base;
   }
   if(variants[spec.role]?.every(n=>runner[n])){stats.flowRoles.push(spec.role);return Object.assign(base,fit(spec,sequence(variants[spec.role],'runner-'+spec.role+'-variants')),{runnerClips:variants[spec.role]});}
   const name=roles.flow[spec.role];if(!runner[name])return spec;
   stats.flowRoles.push(spec.role);return Object.assign(base,fit(spec,add('runner-'+name,runner[name].clip)),{runnerClip:name});
  });
  // Defence poses (fight stance, hit reaction) for every style, optionally trimmed to a window of the Runner clip.
  for(const [role,d] of Object.entries(roles.defense||{})){const src=runner[d.clip];if(!src)continue;
   for(const [style,set] of Object.entries(window.backspoolActionManifest?.defense||{})){const id=typeof set[role]==='string'?set[role]:set[role]?.clipId;if(!id||!bank.clips[id])continue;
    const [a,b]=d.window||[0,src.clip.duration];bank.clips[id]=trim(src.clip,a,Math.min(b,src.clip.duration),id);(stats.defense||(stats.defense={}))[style+'-'+role]={clipId:id,runnerClip:d.clip,window:[a,b]};}}
  // Locomotion loops, time-scaled to the game's reference speeds.
  const locoBase=window.backspoolLocomotionRoles;if(!locoBase?.roles)throw Error('Backspool locomotion roles must load before Loadout');
  const loco=locoBase.roles.map(spec=>{
   const pick=roles.locomotion[spec.role],src=pick&&runner[pick.clip];if(!src)return spec;
   const factor=src.speed>.1?src.speed/pick.referenceSpeed:1,id=add('runner-'+pick.clip+'@'+pick.referenceSpeed,retime(src.clip,factor,''));
   stats.locomotion[spec.role]={clip:pick.clip,speed:+(src.speed||0).toFixed(2),referenceSpeed:pick.referenceSpeed,timeScale:+factor.toFixed(3)};
   return{...spec,id,duration:bank.clips[id].duration,nominalSpeed:pick.referenceSpeed,pelvisTranslation:false,runnerClip:pick.clip,originalId:spec.id,sourcePack:'runner'};
  });
  // Combat: same striking limb, strike frame on the move's contact time.
  const used=new Map();
  for(const move of window.backspoolActionManifest?.moves||[]){
   const clipId=move.clipId;if(!clipId||!bank.clips[clipId]||!move.contact?.length)continue;
   const kind=/air/.test(move.id)||move.kind==='air'?'air':['heavy','launcher'].includes(move.kind)||/heavy|launcher/.test(move.id)?'heavy':'ground';
   const socket=move.contact[0].socket||'rightHand',f=THREE.MathUtils.clamp(move.contact[0].time/Math.max(.05,move.duration),.05,.95);
   const pool=(roles.combat[kind]||[]).filter(n=>runner[n]?.peaks);if(!pool.length)continue;
   const matching=pool.filter(n=>runner[n].strike.socket===socket),list=matching.length?matching:pool.slice().sort((a,b)=>runner[b].peaks[socket].reach-runner[a].peaks[socket].reach);
   const key=kind+':'+socket,turn=used.get(key)||0;used.set(key,turn+1);const name=list[turn%list.length],src=runner[name];
   const ts=(matching.length?src.strike:src.peaks[socket]).time,dur=src.clip.duration;
   // Up to 1.25x the move's length with the strike on its contact time; never shorter than 0.8x (the strike then
   // lands as close to contact as the clip allows).
   const w=Math.min(dur,Math.max(move.duration*.8,Math.min(move.duration*1.25,ts/f,(dur-ts)/(1-f)))),a=THREE.MathUtils.clamp(ts-f*w,0,dur-w),b=a+w;
   bank.clips[clipId]=trim(src.clip,a,b,clipId);
   stats.combat[move.id]={clipId,runnerClip:name,socket,strikeSocket:matching.length?socket:src.strike.socket,window:[+a.toFixed(3),+b.toFixed(3)],contactFraction:+f.toFixed(3),strikeFraction:+((ts-a)/(b-a)).toFixed(3)};
  }
  tables={flow,loco};
  const wrap=key=>{const base=window[key];if(base.__loadoutRunner)return;const wrapped={...base,__loadoutRunner:true};
   Object.defineProperty(wrapped,'roles',{enumerable:true,get:()=>isLoadout()?(key==='backspoolFlowRoles'?tables.flow:tables.loco):base.roles});window[key]=wrapped;};
  wrap('backspoolFlowRoles');wrap('backspoolLocomotionRoles');
  stats.loaded=true;stats.clips=Object.keys(runner).length;stats.buildMs=Math.round(performance.now()-t0);
  return bank;
 }
 const buildBank=hero.buildBank;
 hero.buildBank=async ctx=>prepare(await buildBank(ctx));
 window.loadoutRunnerMoves={state:()=>({...stats,active:isLoadout(),playing:typeof currentAnim==='string'?currentAnim:null,runnerPlaying:typeof currentAnim==='string'&&currentAnim.startsWith('runner-')})};
})();
