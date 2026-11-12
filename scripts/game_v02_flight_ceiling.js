/* V02 flight ceiling (user decision, 2026-11-05: "soft ceiling", about 60 m above the tallest roof).
   Problem: an open-sky rail ends with MOMENTUM PRESERVED, so chained sky rails carried Sightline up about 210 m each,
   at up to about 190 m/s, with no limit (827 m, 2 km and 7 km were seen). Above the towers there is nothing to land on.
   Rule, measured from the tallest static roof in the live map (computed once; no hand-typed height):
   1. Open-sky rails stop climbing at the tallest roof. A sky rail whose crosshair point is higher ends where the
      crosshair ray crosses that height, so it stays straight, along the crosshair, to a fixed endpoint. When that
      crossing is closer than 20 m (for example the player is already at or above the roof), the endpoint is the usual
      180 m crosshair point lowered to the cap height, so the rail runs level instead of climbing. The laser preview
      shows the clipped endpoint because the clip runs before the game draws it.
   2. Above the tallest roof, upward speed is bled off at the even rate that just stops the climb at the ceiling
      (roof + 60 m), on top of normal gravity. A climb that gravity already stops below the ceiling is not touched.
      Only vertical speed changes: horizontal speed and all speed below the roof line are unchanged.
   Surface, anchor and enemy rails are not changed; nothing they can hit is above the ceiling.
   Hooks (build_flight_ceiling_candidate.py): clipSkyTarget(ray) in aimRay's open-sky branch, beforePlayer(dt) at the
   top of updatePlayer. */
(function(){
 'use strict';
 const ABOVE_ROOF=60,MIN_CLIP=20,GRAVITY=23;
 let L=null;
 // clipFrames / levelFrames count aim-preview frames (aimRay runs every frame while aiming), not launched rails.
 const st={clipFrames:0,levelFrames:0,brakeFrames:0,clampFrames:0,banners:0,peak:-Infinity,maxExtra:0,last:null,episode:false};
 function limits(){
  if(L)return L;
  let roof=-Infinity;
  try{for(const c of buildingColliders)if(c&&c.box&&Number.isFinite(c.box.max.y))roof=Math.max(roof,c.box.max.y);}catch(e){}
  if(!Number.isFinite(roof)||roof<=0)return null;
  L={roof,ceiling:roof+ABOVE_ROOF};return L;
 }
 function clipSkyTarget(ray){
  const lim=limits();if(!lim||!s.target||!ray)return;
  const cap=Math.max(lim.roof,s.pos.y);if(s.target.y<=cap)return;
  const before=[s.target.x,s.target.y,s.target.z],o=ray.origin,d=ray.direction;
  const t=d.y>1e-4?(cap-o.y)/d.y:-1;
  if(t>=MIN_CLIP){s.target.copy(o).addScaledVector(d,t);st.clipFrames++;}
  else{s.target.y=cap;st.levelFrames++;}
  const dir=s.target.clone().sub(s.pos);if(dir.lengthSq()>1e-4)s.targetNormal.copy(dir.normalize().negate());
  st.last={kind:t>=MIN_CLIP?'clipped':'levelled',cap:+cap.toFixed(2),from:before.map(v=>+v.toFixed(2)),to:[s.target.x,s.target.y,s.target.z].map(v=>+v.toFixed(2))};
 }
 function beforePlayer(dt){
  const lim=limits();if(!lim||typeof gameActive==='undefined'||!gameActive||!Number.isFinite(dt)||dt<=0)return;
  if(s.pos.y>st.peak)st.peak=s.pos.y;
  if(s.onGround||s.pos.y<lim.roof-20)st.episode=false;
  if(s.onGround||s.mode===P.TRANSIT||window.threadrailGame?.onRail?.())return;
  const vy=s.vel.y,y=s.pos.y;if(!(vy>0)||y<lim.roof)return;
  const room=lim.ceiling-y;
  if(room<=0){s.vel.y=0;st.clampFrames++;return;}
  // Deceleration that stops the climb exactly at the ceiling; gravity supplies the first GRAVITY of it.
  const extra=Math.max(0,vy*vy/(2*Math.max(room,.25))-GRAVITY);
  if(extra>0){
   s.vel.y=Math.max(0,vy-extra*dt);st.brakeFrames++;st.maxExtra=Math.max(st.maxExtra,extra);
   // Once per climb, and only for real braking; it replaces "MOMENTUM PRESERVED", which no longer holds vertically.
   if(!st.episode&&extra>GRAVITY&&typeof showBanner==='function'){st.episode=true;st.banners++;showBanner('FLIGHT CEILING','CLIMB LEVELS OFF AT '+Math.round(lim.ceiling)+' m');}
  }
  // Never step through the ceiling in this frame, whatever gravity scale the active hero uses.
  if(y+s.vel.y*dt>lim.ceiling){s.vel.y=Math.max(0,(lim.ceiling-y)/dt);st.clampFrames++;}
 }
 window.v02FlightCeiling={clipSkyTarget,beforePlayer,limits:()=>limits()&&{...limits()},state:()=>({...st,limits:limits()&&{...limits()}})};
})();
