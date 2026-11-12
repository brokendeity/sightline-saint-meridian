/* V02 Threadrail grind lines (user request, 2026-11-06): "When Backspool throws the cartridges and creates the line that
   connects the two cartridges with a thick glowing line, he should be able to grind on it. Use the Forspoken surfing
   animation as the grind animation when he's on those lines."
   1. Every Threadrail cable is drawn as a thick glowing line: a bright cyan core (7 cm) inside a soft additive glow
      (24 cm), brighter while he rides it. It replaces the thin one-pixel line; cable height and positions are unchanged.
   2. Coming down onto a cable from above catches it and he grinds, through the same validated attach as R / X
      (threadrailGame.attachRail -> rail.attach): reach, sweep and anchor checks, and momentum is only the projection of
      his velocity on the cable. No free speed is added; run (Flow) and jump onto a line to grind fast, or ride a slope.
      A catch needs his body within 1 m of the cable sideways (inside the 2 m attach reach). Rising through a cable from below does not catch, ends of the span do not catch, and a cable he just left is
      ignored for 0.4 s so jumping off is not undone. On a cable flatter than 10 degrees he needs 1.5 m/s along it to catch
      (otherwise he would sit stalled on it); on steeper cables gravity starts the grind, so any speed is enough.
   3. The grind animation is the existing railGrind role: Forspoken's magic-parkour surf loop
      (pkr000_mgc_move_slide_f000a_lp, 0x2811926e), with the authored surf posture on top. Nothing new is extracted.
   Hooks (src/v02/engine/280-threadrail-game.js): draw(railState, enabled) in drawRails, afterPhysics(dt, railState) at
   the end of afterPhysics, and threadrailGame.attachRail(id). */
(function(){
 'use strict';
 const CABLE_DROP=.42,MAX_RAILS=4;
 const CATCH={horizontal:1,above:.35,below:.25,maxRise:1,endMargin:.04,cooldown:.4,minAlong:1.5,levelSlope:10};
 const st={catches:0,attempts:0,refused:0,tooSlow:0,lastCatch:null,lastRefusal:null,visible:0};
 let clock=0,last=null,wasOn=null,left={id:null,at:-1e9};
 // ---- visuals: pooled core + glow per rail (at most MAX_RAILS * 2 draw calls)
 const coreGeometry=new THREE.CylinderGeometry(1,1,1,12,1,true),glowGeometry=new THREE.CylinderGeometry(1,1,1,16,1,true);
 const coreMaterial=new THREE.MeshBasicMaterial({color:0x9ff9ff,toneMapped:false});
 const glowMaterial=new THREE.MeshBasicMaterial({color:0x1fd8ff,transparent:true,opacity:.24,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const rideMaterial=glowMaterial.clone();rideMaterial.opacity=.42;
 const pool=Array.from({length:MAX_RAILS},(_,i)=>{const core=new THREE.Mesh(coreGeometry,coreMaterial),glow=new THREE.Mesh(glowGeometry,glowMaterial);
  core.name='Threadrail / grind line core '+i;glow.name='Threadrail / grind line glow '+i;for(const m of [core,glow]){m.visible=false;m.frustumCulled=false;m.renderOrder=2;scene.add(m);}return{core,glow};});
 const up=new THREE.Vector3(0,1,0),A=new THREE.Vector3(),B=new THREE.Vector3(),D=new THREE.Vector3();
 function place(mesh,radius){mesh.position.copy(A).add(B).multiplyScalar(.5);D.copy(B).sub(A);const len=D.length();mesh.quaternion.setFromUnitVectors(up,D.normalize());mesh.scale.set(radius,Math.max(len,1e-3),radius);}
 function draw(rs,enabled){
  let i=0;const current=rs.current?.railId;
  for(const r of rs.rails){if(i>=MAX_RAILS)break;const a=rs.anchors.find(x=>x.id===r.a),b=rs.anchors.find(x=>x.id===r.b);if(!a||!b)continue;
   A.set(a.position.x,a.position.y-CABLE_DROP,a.position.z);B.set(b.position.x,b.position.y-CABLE_DROP,b.position.z);
   const e=pool[i++];place(e.core,.035);place(e.glow,.12);e.glow.material=r.id===current?rideMaterial:glowMaterial;e.core.visible=e.glow.visible=!!enabled;}
  for(;i<MAX_RAILS;i++)pool[i].core.visible=pool[i].glow.visible=false;
  st.visible=pool.filter(e=>e.core.visible).length;
 }
 // ---- catching a cable from above
 function candidate(rs,from,to){
  let best=null;
  for(const r of rs.rails){
   if(r.id===left.id&&clock-left.at<CATCH.cooldown)continue;
   const a=rs.anchors.find(x=>x.id===r.a),b=rs.anchors.find(x=>x.id===r.b);if(!a||!b)continue;
   const ax=a.position.x,ay=a.position.y,az=a.position.z,dx=b.position.x-ax,dy=b.position.y-ay,dz=b.position.z-az,h2=dx*dx+dz*dz;if(h2<1e-6)continue;
   // Horizontal parameter along the span, then the cable's actor-reference height there (the rail rides at anchor height).
   const t=((to.x-ax)*dx+(to.z-az)*dz)/h2;if(t<CATCH.endMargin||t>1-CATCH.endMargin)continue;
   const px=ax+dx*t,pz=az+dz*t,horizontal=Math.hypot(to.x-px,to.z-pz);if(horizontal>CATCH.horizontal)continue;
   const lineNow=ay+dy*t,tp=((from.x-ax)*dx+(from.z-az)*dz)/h2,linePrev=ay+dy*Math.min(1,Math.max(0,tp));
   const offNow=to.y-lineNow,offPrev=from.y-linePrev;
   const settling=offPrev>=-.05&&offNow<=CATCH.above&&offNow>=-CATCH.below,crossed=offPrev>0&&offNow<=0;
   if(!(settling||crossed))continue;
   // A near-level cable needs some speed along it, or he would sit stalled on it; on a slope gravity starts the grind.
   const len=Math.hypot(dx,dy,dz),along=Math.abs((s.vel.x*dx+s.vel.y*dy+s.vel.z*dz)/len),slope=Math.asin(Math.min(1,Math.abs(dy)/len))*180/Math.PI;
   if(slope<CATCH.levelSlope&&along<CATCH.minAlong){st.tooSlow++;continue;}
   if(!best||horizontal<best.horizontal)best={id:r.id,horizontal,t,offNow,offPrev};
  }
  return best;
 }
 function afterPhysics(dt,rs){
  if(!Number.isFinite(dt)||dt<=0||!rs)return;clock+=dt;
  const on=rs.current?.railId||null;if(wasOn&&!on)left={id:wasOn,at:clock};wasOn=on;
  const now=s.pos.clone();
  if(on||s.onGround||!last||window.loadoutHero?.blocksPowers?.()||s.vel.y>CATCH.maxRise){last=now;return;}
  const c=candidate(rs,last,now);last=now;if(!c)return;
  st.attempts++;
  const ok=window.threadrailGame?.attachRail?.(c.id);
  if(ok){st.catches++;st.lastCatch={rail:c.id,t:+c.t.toFixed(3),horizontal:+c.horizontal.toFixed(3),offset:+c.offNow.toFixed(3),clock:+clock.toFixed(2)};wasOn=c.id;}
  else{st.refused++;st.lastRefusal={rail:c.id,clock:+clock.toFixed(2)};}
 }
 window.v02ThreadrailGrind={draw,afterPhysics,limits:()=>({...CATCH}),state:()=>JSON.parse(JSON.stringify(st))};
})();
