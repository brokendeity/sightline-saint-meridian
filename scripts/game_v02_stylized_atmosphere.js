/* Saint Meridian V02 stylized atmosphere: (A) height fog, (B) wet sky-facing surfaces, (C) rain rings and glints,
 * (D) cinematic grade. Must load after three.js and BEFORE the game core, because (A) rewrites the shared r128 fog chunks
 * before any program compiles. (B) and (C) are separate overlay meshes on the largest sky-facing static surfaces (district
 * first), never code inside the lit materials (that measured ~10x slower on this GPU). (D) is appended to the game's
 * existing phasePost pass. Every part is uniform-gated, so it can be switched off at runtime without a recompile:
 *   ?stylized=0                 everything off (the chunks still compile; output then matches the source build's math)
 *   ?stylizedOverlays=180       wet overlay cap (draw calls);  ?stylizedSkip=chunks,cover,grade,overlays  diagnostics only
 *   ?stylizedOff=fog,wet,rings,grade   switch individual parts off
 *   stylizedAtmosphere.set({fog:false})   same at runtime;   stylizedAtmosphere.state()   evidence snapshot
 * Rain only lands where the sky is open: a one-time depth-peeled height map of the static city (taken shortly after the
 * world is ready, excluding anything that moved) records up to four static surface layers per texel; a layer is wet when
 * it is topmost or its next cover is high overhead, so room and arcade floors, characters and trains stay dry. Palette follows the locked direction: midnight-blue haze, warm amber highlights, no bloom added.
 *
 * Techniques adapted (reimplemented for three r128 chunks) from "Stylized Premium Scenes" by Christian Ortiz (Cortiz),
 * https://github.com/cortiz2894/stylized-premium-patreon -- heightFog (closed-form altitude fog, sky-matched colour,
 * fade-to-nothing), rain/wetSurface (world-normal wet mask, analytic ripple gradient, emissive glints, sine-free hashes)
 * and cinematicGrade (contrast, split toning, saturation, vignette).
 * MIT License, Copyright (c) 2026 Christian Ortiz (Cortiz). Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions: The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
(()=>{
 'use strict';
 if(!window.THREE)return;
 const T=THREE,C=T.ShaderChunk,query=new URLSearchParams(location.search);
 const parts=['fog','wet','rings','grade'],off=new Set((query.get('stylizedOff')||'').split(',').map(x=>x.trim()).filter(Boolean));
 if(query.get('stylized')==='0')parts.forEach(p=>off.add(p));
 const skip=new Set((query.get('stylizedSkip')||'').split(','));  // diagnostics: chunks, cover, grade, overlays
 const v4=(...a)=>new T.Vector4(...a),view=v4(0,0,0,0);
 // One plain object shared by reference: UniformsUtils.clone copies non-math values by reference, so every material's
 // smAtmos uniform points here and edits reach all programs with no per-material bookkeeping.
 const SM={
  enable:v4(off.has('fog')?0:1,off.has('wet')?0:1,off.has('rings')?0:1,0),
  layer:v4(0,0,.03,.006),          // -, layer anchor Y, altitude falloff, ground density per metre
  haze:v4(10,700,1500,1),            // clear distance, fade start, fade end, aerial (legacy exp2) scale
  mist:new T.Color(0x16334a),  // display-space colour of the street mist
  sky:v4(.62,0,0,0),                 // how far the aerial haze converges on the painted sky instead of fogColor
  wet:v4(.55,.86,.95,.72),          // up-facing ramp min, max, strength, brightness multiplier when soaked
  wet2:v4(0,1.6,.5,.42),             // scene fog density (mirrored), reflection gain, reflected window-streak gain, puddle variation
  rings:v4(1.6,.95,.06,14),        // cells per metre, seconds per impact, normal strength, fade distance
  rings2:v4(.3,.34,6,.025),         // chance per cell, ring speed (cells per life), waves per cell, ring highlight
  glint:v4(.35,1.6,.75,.1),         // strength, cells per metre, impacts per second, dot radius (cell fraction)
  cover:v4(0,0,.38,14),              // coarse ready, fine ready, surface tolerance (m), cover height that keeps a surface dry (m)
  coverFineMat:new T.Matrix4(),coverCoarseMat:new T.Matrix4(),coverFine:null,coverCoarse:null,
  get view(){if(typeof nightUniforms!=='undefined')view.x=nightUniforms.time.value;return view;}
 };
 const grade={a:v4(off.has('grade')?0:1,1.06,.2,.9),b:v4(.32,.45,.26,.55),shadow:new T.Color(.8,.92,1.15),highlight:new T.Color(1.15,1,.78)};

 // ---------- shader chunks ----------
 const worldDeclV=`
#ifndef SM_WORLD_DECL
#define SM_WORLD_DECL
varying vec3 smWorldPos;
#endif`;
 // viewMatrix is rigid, so world = R^T (view - t); written out because GLSL ES 1.0 has no inverse()/transpose().
 const worldAssign=`
#ifdef SM_WORLD_DECL
{ vec3 smRel = mvPosition.xyz - viewMatrix[ 3 ].xyz; smWorldPos = vec3( dot( viewMatrix[ 0 ].xyz, smRel ), dot( viewMatrix[ 1 ].xyz, smRel ), dot( viewMatrix[ 2 ].xyz, smRel ) ); }
#endif`;
 const worldDeclF=`
#ifndef SM_WORLD_DECL_F
#define SM_WORLD_DECL_F
varying vec3 smWorldPos;
#endif`;
 const atmosDecl=`
#ifndef SM_ATMOS_DECL
#define SM_ATMOS_DECL
struct SmAtmosphere { vec4 enable; vec4 layer; vec4 haze; vec3 mist; vec4 sky; vec4 wet; vec4 wet2; vec4 rings; vec4 rings2; vec4 glint; vec4 cover; mat4 coverFineMat; mat4 coverCoarseMat; sampler2D coverFine; sampler2D coverCoarse; vec4 view; };
uniform SmAtmosphere smAtmos;
// Sine-free hashes (Hoskins): stable as the clock and world coordinates grow.
float smHash12( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * .1031 ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.x + p3.y ) * p3.z ); }
vec2 smHash22( vec2 p ) { vec3 p3 = fract( vec3( p.xyx ) * vec3( .1031, .1030, .0973 ) ); p3 += dot( p3, p3.yzx + 33.33 ); return fract( ( p3.xx + p3.yz ) * p3.zy ); }
float smNoise( vec2 p ) { vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3. - 2. * f ); return mix( mix( smHash12( i ), smHash12( i + vec2( 1., 0. ) ), f.x ), mix( smHash12( i + vec2( 0., 1. ) ), smHash12( i + vec2( 1., 1. ) ), f.x ), f.y ); }
// The night sky's own gradient and horizon glow (no clouds), so fully fogged geometry converges on the sky behind it.
vec3 smSky( vec3 d, float camY ) { float h = max( d.y, 0. ); float high = smoothstep( 60., 600., camY );
 vec3 col = mix( vec3( .028, .12, .15 ), vec3( .012, .025, .059 ), smoothstep( 0., .85, h ) );
 return col + vec3( .31, .115, .059 ) * exp( - abs( d.y ) * 7.5 ) * ( 1. - high * .65 ); }
// What a wet surface mirrors: the sky gradient, the mist, and (stylized) a band of amber/cyan streaks low on the horizon,
// read as reflected windows and light strips. Sampled on the horizon circle so there is no azimuth seam.
vec3 smEnv( vec3 r, float camY ) { vec3 e = mix( smSky( r, camY ), smAtmos.mist, .35 );
 vec2 az = r.xz / max( length( r.xz ), 1e-4 ) * 11.; float streak = smoothstep( .6, .95, smNoise( az ) ) * exp( - abs( r.y ) * 11. );
 return e + mix( vec3( .95, .56, .22 ), vec3( .22, .82, .92 ), step( .7, smNoise( az * .6 + 17. ) ) ) * streak * smAtmos.wet2.z; }
bool smInside( vec2 uv ) { return uv.x > .001 && uv.y > .001 && uv.x < .999 && uv.y < .999; }
float smOn( float y, float layer ) { return 1. - smoothstep( smAtmos.cover.z, smAtmos.cover.z * 2.5, abs( y - layer ) ); }
// The cover map holds, per texel, the heights of up to four static surfaces from the top down (depth-peeled, at least 1 m
// apart; -1e4 where there is none). Rain reaches a surface that is one of those layers and is either the topmost or has
// its next cover more than cover.w overhead: a deck 30 m under the next deck is wet, a room or arcade floor is dry, and
// anything that is not a static layer at all (characters, trains) stays dry.
float smRainAllow( vec3 wp ) {
 if ( smAtmos.cover.x < .5 ) return 0.;
 vec4 w = vec4( wp, 1. ); vec2 uv = ( smAtmos.coverFineMat * w ).xy * .5 + .5; vec4 L;
 if ( smAtmos.cover.y > .5 && smInside( uv ) ) L = texture2D( smAtmos.coverFine, uv );
 else { uv = ( smAtmos.coverCoarseMat * w ).xy * .5 + .5; if ( ! smInside( uv ) ) return 0.; L = texture2D( smAtmos.coverCoarse, uv ); }
 float lo = smAtmos.cover.w * .7, hi = smAtmos.cover.w;
 return max( max( smOn( wp.y, L.x ), smOn( wp.y, L.y ) * smoothstep( lo, hi, L.x - L.y ) ), max( smOn( wp.y, L.z ) * smoothstep( lo, hi, L.y - L.z ), smOn( wp.y, L.w ) * smoothstep( lo, hi, L.z - L.w ) ) ); }
// Analytic ripple field: one drop per cell per cycle, gradient of sin(2 pi u) exp(-u^2/2) evaluated directly. Each drop is
// kept inside its own cell, so one cell is evaluated per grid instead of a 3x3 neighbourhood; a second grid offset by half a
// cell hides the lattice. Two evaluations per wet pixel in all.
vec3 smDrop( vec2 p, float t, vec2 shift ) { vec2 q = p + shift, c = floor( q ); float ph = t / smAtmos.rings.y + smHash12( c * 1.37 + shift * 3.1 + .5 );
 float cyc = floor( ph ), life = fract( ph ); vec2 seed = c + vec2( cyc * 17.13, cyc * 9.71 ) + shift * 7.;
 if ( smHash12( seed + 11.3 ) > smAtmos.rings2.x ) return vec3( 0. );
 vec2 d = q - ( c + .38 + .24 * smHash22( seed ) ); float r = length( d ), u = ( r - life * smAtmos.rings2.y ) * smAtmos.rings2.z;
 float env = ( 1. - life ) * ( 1. - life ) * smoothstep( .36, .22, r ), w = exp( - u * u * .5 ), w2 = w * w;
 return vec3( ( cos( u * 6.2831853 ) * 6.2831853 - u * sin( u * 6.2831853 ) ) * w * smAtmos.rings2.z * env * d / max( r, 1e-4 ), w2 * w2 * w2 * env ); }
vec3 smRipples( vec2 p, float t ) { return smDrop( p, t, vec2( 0. ) ) + smDrop( p, t, vec2( .5 ) ); }
#endif`;
 const fogFragment=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, fogDepth );
	#endif
	vec3 smFogColor = fogColor;
	#if defined( FOG_EXP2 ) && defined( SM_ATMOS_DECL ) && defined( SM_WORLD_DECL_F )
	if ( smAtmos.enable.x > .5 ) {
		vec3 smRd = smWorldPos - cameraPosition; float smT = length( smRd ); vec3 smDir = smRd / max( smT, 1e-4 );
		float smClear = min( smAtmos.haze.x, smT ), smSpan = smT - smClear, smY0 = cameraPosition.y + smDir.y * smClear - smAtmos.layer.y;
		float smK = clamp( smAtmos.layer.z * smDir.y * smSpan, -30., 30. );
		float smShape = abs( smK ) > 1e-4 ? ( 1. - exp( - smK ) ) / smK : 1.;
		float smMist = smAtmos.layer.w * smSpan * exp( clamp( - smAtmos.layer.z * smY0, -30., 30. ) ) * smShape;
		float smAerial = fogDensity * fogDensity * fogDepth * fogDepth * smAtmos.haze.w;
		float smFar = smAtmos.haze.z > smAtmos.haze.y ? smoothstep( smAtmos.haze.y, smAtmos.haze.z, smT ) : 0.;
		fogFactor = max( 1. - exp( - ( smMist + smAerial ) ), smFar );
		smFogColor = mix( mix( fogColor, smSky( smDir, cameraPosition.y ), smAtmos.sky.x ), smAtmos.mist, smMist / max( smMist + smAerial, 1e-5 ) * ( 1. - smFar ) );
	}
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, smFogColor, fogFactor );
#endif`;
 // Only the fog chunks are rewritten. Wetness is NOT injected into the lit materials: on this GPU any extra code in the
 // large physical/toon shaders slows every lit pixel even when it is branched off (measured ~+16 ms for ~40 ALU ops,
 // ~+90 ms for the full block), so B and C live in separate overlay meshes below.
 const source={};for(const k of['fog_pars_vertex','fog_vertex','project_vertex','clipping_planes_pars_vertex','fog_pars_fragment','fog_fragment'])source[k]=C[k];
 if(!skip.has('chunks')){C.fog_pars_vertex=worldDeclV+'\n'+source.fog_pars_vertex;
 C.clipping_planes_pars_vertex=source.clipping_planes_pars_vertex+'\n'+worldDeclV;
 C.project_vertex=source.project_vertex+'\n'+worldAssign;
 C.fog_vertex=source.fog_vertex+'\n#ifdef USE_FOG\n'+worldAssign+'\n#endif';
 C.fog_pars_fragment=source.fog_pars_fragment+'\n'+worldDeclF+'\n'+atmosDecl;
 C.fog_fragment=fogFragment;
 for(const lib of Object.values(T.ShaderLib))if(lib.uniforms&&lib.uniforms.fogDensity)lib.uniforms.smAtmos={value:SM};
 T.UniformsLib.fog.smAtmos={value:SM};}

 // ---------- (D) grade inside the game's existing full-screen pass ----------
 let gradeInstalled=false,gradeError=null;
 function installGrade(){
  if(gradeInstalled||typeof phasePost==='undefined')return gradeInstalled;
  const f=phasePost.fragmentShader,tail='gl_FragColor=vec4(c,1.);}';
  if(f.split(tail).length!==2||f.split('void main(){').length!==2){gradeError='phasePost hooks not unique';return false;}
  const fn=`uniform vec4 smGradeA;uniform vec4 smGradeB;uniform vec3 smShadowTint;uniform vec3 smHighlightTint;
vec3 smGradePost(vec3 c,vec2 uv){if(smGradeA.x<.5)return c;const vec3 L=vec3(.2126,.7152,.0722);
float l=max(dot(c,L),1e-5);float g=max(smGradeA.z+(l-smGradeA.z)*smGradeA.y,0.);c*=g/l;l=g;
vec3 sh=smShadowTint/max(dot(smShadowTint,L),1e-4),hi=smHighlightTint/max(dot(smHighlightTint,L),1e-4);
c=mix(c,c*mix(sh,hi,smoothstep(0.,smGradeB.y,l)),smGradeB.x);
c=mix(vec3(dot(c,L)),c,mix(smGradeA.w,1.,smoothstep(.55,.95,l)));
c*=1.-smoothstep(smGradeB.w,1.15,length(uv-.5)*1.4142)*smGradeB.z;return max(c,0.);}
`;
  Object.assign(phasePost.uniforms,{smGradeA:{value:grade.a},smGradeB:{value:grade.b},smShadowTint:{value:grade.shadow},smHighlightTint:{value:grade.highlight}});
  phasePost.fragmentShader=f.replace('void main(){',fn+'void main(){').replace(tail,'c=smGradePost(c,vUv);'+tail);phasePost.needsUpdate=true;
  gradeInstalled=true;return true;
 }

 // ---------- rain cover: one-time depth-peeled height layers of the static city ----------
 const top={state:'waiting',snapshot:null,builtAt:null,ms:null,fine:null,coarse:null,included:0,excludedMoved:0,excludedOther:0,error:null};
 const worldReady=()=>typeof gameReady!=='undefined'&&gameReady&&typeof roadNetworkState==='function'&&roadNetworkState().ready&&typeof verticalDistrictState==='function'&&verticalDistrictState().ready&&typeof verticalWorldLifeState==='function'&&verticalWorldLifeState().ready;
 // Moved = any matrix element changed by more than 1e-3 (float jitter from a reset re-applying the same pose is not motion).
 const same=(a,b)=>{for(let i=0;i<16;i++)if(Math.abs(a.elements[i]-b.elements[i])>1e-3)return false;return true;};
 function snapshot(){const m=new Map();scene.traverse(o=>{if(o.isMesh)m.set(o,{matrix:o.matrixWorld.clone(),instances:o.isInstancedMesh?o.instanceMatrix.version:-1})});return m;}
 // Glows, light cones and pools (additive or not depth-writing) are not roofs.
 const glowOnly=o=>[].concat(o.material).every(m=>m.blending===T.AdditiveBlending||m.depthWrite===false);
 const peelMaterial=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{prevLayer:{value:null},hasPrev:{value:0},size:{value:new T.Vector2()},range:{value:new T.Vector3()}},
  vertexShader:`varying float vWorldY;
void main(){
#include <begin_vertex>
 vec4 wp = vec4( transformed, 1. );
#ifdef USE_INSTANCING
 wp = instanceMatrix * wp;
#endif
 wp = modelMatrix * wp; vWorldY = wp.y; gl_Position = projectionMatrix * viewMatrix * wp; }`,
  fragmentShader:`#include <packing>
uniform sampler2D prevLayer; uniform float hasPrev; uniform vec2 size; uniform vec3 range; varying float vWorldY;
void main(){
 if ( hasPrev > .5 ) { float prev = range.x - ( range.y + unpackRGBAToDepth( texture2D( prevLayer, gl_FragCoord.xy / size ) ) * ( range.z - range.y ) ); if ( vWorldY > prev - 1. ) discard; }
 gl_FragColor = packDepthToRGBA( gl_FragCoord.z ); }`});
 const mergeMaterial=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{l0:{value:null},l1:{value:null},l2:{value:null},l3:{value:null},count:{value:4},range:{value:new T.Vector3()}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragmentShader:`#include <packing>
uniform sampler2D l0; uniform sampler2D l1; uniform sampler2D l2; uniform sampler2D l3; uniform float count; uniform vec3 range; varying vec2 vUv;
float h( sampler2D t, float i ) { if ( i >= count ) return -1e4; float z = unpackRGBAToDepth( texture2D( t, vUv ) ); return z > .995 ? -1e4 : range.x - ( range.y + z * ( range.z - range.y ) ); }
void main(){ gl_FragColor = vec4( h( l0, 0. ), h( l1, 1. ), h( l2, 2. ), h( l3, 3. ) ); }`});
 const mergeScene=new T.Scene(),mergeCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);mergeScene.add(new T.Mesh(new T.PlaneGeometry(2,2),mergeMaterial));
 function withState(fn){
  const prevTarget=renderer.getRenderTarget(),prevClear=renderer.getClearColor(new T.Color()),prevAlpha=renderer.getClearAlpha(),prevAuto=renderer.autoClear,prevShadow=renderer.shadowMap.autoUpdate,prevBg=scene.background,prevOverride=scene.overrideMaterial;
  try{renderer.shadowMap.autoUpdate=false;scene.background=null;renderer.autoClear=true;fn();}
  finally{renderer.setRenderTarget(prevTarget);renderer.setClearColor(prevClear,prevAlpha);renderer.autoClear=prevAuto;renderer.shadowMap.autoUpdate=prevShadow;scene.background=prevBg;scene.overrideMaterial=prevOverride;}
 }
 function peel(cx,cz,half,size,layers,camY,far){
  const cam=new T.OrthographicCamera(-half,half,half,-half,1,far);cam.position.set(cx,camY,cz);cam.up.set(0,0,-1);cam.lookAt(cx,camY-1,cz);cam.updateMatrixWorld(true);cam.updateProjectionMatrix();
  const temp=()=>new T.WebGLRenderTarget(size,size,{minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:true,stencilBuffer:false,generateMipmaps:false});
  const out=new T.WebGLRenderTarget(size,size,{type:T.FloatType,format:T.RGBAFormat,minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false});
  const range=new T.Vector3(camY,1,far),temps=[];
  withState(()=>{
   peelMaterial.uniforms.size.value.set(size,size);peelMaterial.uniforms.range.value.copy(range);scene.overrideMaterial=peelMaterial;renderer.setClearColor(0x000000,1);
   for(let i=0;i<layers;i++){const rt=temp();peelMaterial.uniforms.hasPrev.value=i?1:0;peelMaterial.uniforms.prevLayer.value=i?temps[i-1].texture:null;renderer.setRenderTarget(rt);renderer.clear(true,true,true);renderer.render(scene,cam);temps.push(rt);}
   scene.overrideMaterial=null;Object.assign(mergeMaterial.uniforms,{});['l0','l1','l2','l3'].forEach((k,i)=>mergeMaterial.uniforms[k].value=temps[Math.min(i,temps.length-1)].texture);
   mergeMaterial.uniforms.count.value=layers;mergeMaterial.uniforms.range.value.copy(range);renderer.setRenderTarget(out);renderer.render(mergeScene,mergeCamera);
  });
  temps.forEach(rt=>rt.dispose());
  return{rt:out,matrix:new T.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse),center:[cx,cz],half,size,layers};
 }
 function buildTop(){
  const t0=performance.now(),before=top.snapshot,hidden=[],box=new T.Box3(),districtBox=new T.Box3(),sphere=new T.Sphere(),player=typeof s!=='undefined'&&s.pos?s.pos.clone():null;
  top.included=top.excludedMoved=top.excludedOther=0;
  const district=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture');
  scene.traverse(o=>{
   if(!o.isMesh||!o.visible||o.userData.smOverlay)return;
   let reason=null;const was=before&&before.get(o);
   if(o.isSkinnedMesh||(typeof nightSky!=='undefined'&&o===nightSky))reason='other';
   else if(!was||!same(was.matrix,o.matrixWorld)||(o.isInstancedMesh&&was.instances!==o.instanceMatrix.version))reason='moved';
   else if(glowOnly(o))reason='other';
   else if(player){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);if(sphere.radius<3&&sphere.center.distanceTo(player)<3)reason='other';}
   if(reason){hidden.push(o);o.visible=false;reason==='moved'?top.excludedMoved++:top.excludedOther++;return;}
   top.included++;box.expandByObject(o);
  });
  try{
   if(box.isEmpty())throw Error('no static geometry');
   if(!renderer.capabilities.isWebGL2||!renderer.extensions.get('EXT_color_buffer_float'))throw Error('float render targets unavailable');
   const camY=Math.min(box.max.y+10,1000),far=camY-Math.max(box.min.y-10,-50);
   const c=box.getCenter(new T.Vector3()),half=Math.max(box.max.x-box.min.x,box.max.z-box.min.z)/2+8;
   const coarse=peel(c.x,c.z,half,1024,2,camY,far);if(top.coarse)top.coarse.rt.dispose();top.coarse=coarse;SM.coverCoarse=coarse.rt.texture;SM.coverCoarseMat.copy(coarse.matrix);SM.cover.x=1;
   if(district){districtBox.setFromObject(district);const d=districtBox.getCenter(new T.Vector3()),dh=Math.max(districtBox.max.x-districtBox.min.x,districtBox.max.z-districtBox.min.z)/2+24;
    const fine=peel(d.x,d.z,dh,1024,4,camY,far);if(top.fine)top.fine.rt.dispose();top.fine=fine;SM.coverFine=fine.rt.texture;SM.coverFineMat.copy(fine.matrix);SM.cover.y=1;}
   top.state='built';top.builtAt=performance.now();if(!skip.has('overlays')&&overlay.state==='waiting')buildOverlays();
  }catch(e){top.state='failed';top.error=String(e);console.error('stylized atmosphere: rain cover map',e);}
  finally{for(const o of hidden)o.visible=true;top.ms=+(performance.now()-t0).toFixed(1);}
 }
 // ---------- (B, C) wet overlays: lean separate meshes on the large sky-facing static surfaces ----------
 // Each overlay shares its surface's geometry (and instance matrices), never catches raycasts or casts shadows, and is
 // drawn after the opaque pass with premultiplied blending: alpha darkens the surface (soaked), colour adds the sheen,
 // rain rings and glints. Output is display-space (the scene target stores display values; the grade runs after).
 const overlayCap=+(query.get('stylizedOverlays')||180);
 const overlay={inPlay:0,state:'waiting',count:0,candidates:0,upArea:0,list:[],group:null,error:null};
 const overlayMaterial=new T.ShaderMaterial({uniforms:{smAtmos:{value:SM}},transparent:true,depthWrite:false,depthTest:true,side:T.DoubleSide,fog:false,toneMapped:false,
  polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,blending:T.CustomBlending,blendSrc:T.OneFactor,blendDst:T.OneMinusSrcAlphaFactor,blendEquation:T.AddEquation,
  vertexShader:`varying vec3 vWp; varying vec3 vWn; varying float vDepth;
void main(){
 vec4 p = vec4( position, 1. ); vec3 n = normal;
#ifdef USE_INSTANCING
 p = instanceMatrix * p; n = mat3( instanceMatrix ) * n;
#endif
 vec4 wp = modelMatrix * p; vWp = wp.xyz; vWn = mat3( modelMatrix ) * n;
 vec4 mv = viewMatrix * wp; vDepth = - mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader:atmosDecl+`
varying vec3 vWp; varying vec3 vWn; varying float vDepth;
void main(){
 if ( smAtmos.enable.y < .5 ) discard;
 vec3 n = normalize( vWn ), toCam = cameraPosition - vWp;
 if ( dot( toCam, n ) <= 0. ) discard;  // only the side the surface faces (no wet ceilings under double-sided decks)
 float up = smoothstep( smAtmos.wet.x, smAtmos.wet.y, n.y ); if ( up <= 0. ) discard;
 float allow = smRainAllow( vWp ); if ( allow <= 0. ) discard;
 float dist = length( toCam ), wet = up * allow * smAtmos.wet.z * mix( 1. - smAtmos.wet2.w, 1., smNoise( vWp.xz * .07 ) );
 vec3 V = toCam / max( dist, 1e-4 ), add = vec3( 0. );
 if ( smAtmos.enable.z > .5 && dist < smAtmos.rings.w ) {
  float fade = 1. - smoothstep( smAtmos.rings.w * .55, smAtmos.rings.w, dist );
  vec3 rip = smRipples( vWp.xz * smAtmos.rings.x, smAtmos.view.x );
  n = normalize( n + vec3( - rip.x, 0., - rip.y ) * smAtmos.rings.z * fade );
  vec2 gp = vWp.xz * smAtmos.glint.y, gc = floor( gp ); float gph = smAtmos.view.x * smAtmos.glint.z + smHash12( gc * .71 ), gcyc = floor( gph ), gl = 1. - fract( gph );
  float glint = ( 1. - smoothstep( 0., smAtmos.glint.w, length( gp - ( gc + .2 + .6 * smHash22( gc + gcyc * 3.17 ) ) ) ) ) * gl * gl * gl * step( smHash12( gc + gcyc * 1.91 ), .35 );
  add = vec3( .55, .78, .95 ) * ( rip.z * smAtmos.rings2.w + glint * smAtmos.glint.x ) * fade;
 }
 float F = .02 + .98 * pow( 1. - max( dot( n, V ), 0. ), 5. );
 vec3 col = min( smEnv( reflect( - V, n ), cameraPosition.y ) * F * smAtmos.wet2.y, vec3( .4 ) ) + add;
 // Fade with the same height fog the surface underneath received.
 vec3 dir = - V; float clear = min( smAtmos.haze.x, dist ), span = dist - clear, y0 = cameraPosition.y + dir.y * clear - smAtmos.layer.y;
 float k = clamp( smAtmos.layer.z * dir.y * span, -30., 30. ), shape = abs( k ) > 1e-4 ? ( 1. - exp( - k ) ) / k : 1.;
 float mist = smAtmos.enable.x > .5 ? smAtmos.layer.w * span * exp( clamp( - smAtmos.layer.z * y0, -30., 30. ) ) * shape : 0.;
 float keep = exp( - ( mist + smAtmos.wet2.x * smAtmos.wet2.x * vDepth * vDepth ) );
 gl_FragColor = vec4( col * wet * keep, wet * ( 1. - smAtmos.wet.w ) * keep ); }`});
 const upTmp={a:new T.Vector3(),b:new T.Vector3(),c:new T.Vector3(),n:new T.Vector3()};
 // World area of the geometry's sky-facing triangles (sampled for big meshes, scaled back up), times instance count.
 function upFacingArea(o){
  const g=o.geometry,pos=g.attributes.position;if(!pos||!g.attributes.normal)return 0;
  const idx=g.index,tris=idx?idx.count/3:pos.count/3,step=Math.max(1,Math.floor(tris/3000)),m=o.isInstancedMesh?new T.Matrix4().multiplyMatrices(o.matrixWorld,new T.Matrix4().fromArray(o.instanceMatrix.array,0)):o.matrixWorld;
  let area=0;const {a,b,c,n}=upTmp,v=i=>idx?idx.getX(i):i;
  for(let t=0;t<tris;t+=step){a.fromBufferAttribute(pos,v(t*3)).applyMatrix4(m);b.fromBufferAttribute(pos,v(t*3+1)).applyMatrix4(m);c.fromBufferAttribute(pos,v(t*3+2)).applyMatrix4(m);
   n.subVectors(b,a).cross(c.sub(a));const twice=n.length();if(twice>0&&Math.abs(n.y)/twice>.55)area+=twice/2;}
  return area*step*(o.isInstancedMesh?o.count:1);
 }
 function buildOverlays(){
  try{
   const before=top.snapshot,cands=[],district=scene.getObjectByName('Saint Meridian V02 detailed Blender architecture'),playBox=new T.Box3();
   if(district)playBox.setFromObject(district).expandByVector(new T.Vector3(60,40,60));
   scene.traverse(o=>{
    if(!(o.isMesh)||o.isSkinnedMesh||!o.visible||o.userData.smOverlay)return;const was=before&&before.get(o);
    if(!was||!same(was.matrix,o.matrixWorld)||(o.isInstancedMesh&&was.instances!==o.instanceMatrix.version)||glowOnly(o))return;
    if(![].concat(o.material).some(m=>m.isMeshStandardMaterial||m.isMeshToonMaterial))return;
    const area=upFacingArea(o);if(area>=25){o.geometry.boundingSphere||o.geometry.computeBoundingSphere();const c=o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld);
     cands.push({o,area,inPlay:playBox.containsPoint(c)});}
   });
   // The district (where play happens) first, then the rest of the city by sky-facing area.
   cands.sort((x,y)=>(y.inPlay-x.inPlay)||(y.area-x.area));overlay.inPlay=cands.filter(c=>c.inPlay).length;overlay.candidates=cands.length;
   const group=new T.Group();group.name='Stylized atmosphere / wet overlays';group.matrixAutoUpdate=false;group.userData.smOverlay=true;
   for(const {o,area} of cands.slice(0,overlayCap)){
    const m=o.isInstancedMesh?new T.InstancedMesh(o.geometry,overlayMaterial,o.count):new T.Mesh(o.geometry,overlayMaterial);
    if(o.isInstancedMesh)m.instanceMatrix=o.instanceMatrix;
    m.name='wet overlay / '+(o.name||o.parent?.name||'surface');m.matrixAutoUpdate=false;m.matrix.copy(o.matrixWorld);m.matrixWorld.copy(o.matrixWorld);
    m.raycast=()=>{};m.castShadow=m.receiveShadow=false;m.renderOrder=1;m.userData.smOverlay=true;m.userData.base=o;group.add(m);overlay.upArea+=area;overlay.list.push(m);
   }
   group.raycast=()=>{};scene.add(group);overlay.group=group;overlay.count=overlay.list.length;overlay.state='built';syncOverlays();
  }catch(e){overlay.state='failed';overlay.error=String(e);console.error('stylized atmosphere: wet overlays',e);}
 }
 const shown=o=>{for(let x=o;x;x=x.parent)if(!x.visible)return false;return true;};
 function syncOverlays(){if(typeof scene!=='undefined'&&scene.fog)SM.wet2.x=scene.fog.density||0;for(const m of overlay.list){const v=shown(m.userData.base);if(m.visible!==v)m.visible=v;}}
 setInterval(()=>{if(overlay.state==='built')syncOverlays();},300);

 // Reads the rain cover layers back at a world point (evidence and tests; not used per frame). Mirrors smRainAllow.
 function coverAt(x,y,z){
  const read=e=>{if(!e)return null;const p=new T.Vector4(x,y,z,1).applyMatrix4(e.matrix),u=p.x*.5+.5,v=p.y*.5+.5;if(u<.001||v<.001||u>.999||v>.999)return null;
   const px=new Float32Array(4);renderer.readRenderTargetPixels(e.rt,Math.min(e.size-1,Math.floor(u*e.size)),Math.min(e.size-1,Math.floor(v*e.size)),1,1,px);return[...px];};
  let region='fine',L=read(top.fine);if(!L){region='coarse';L=read(top.coarse);}if(!L)return null;
  const eps=SM.cover.z,gap=SM.cover.w,on=h=>Math.abs(y-h)<eps;let open=on(L[0]);for(let i=1;i<4;i++)if(on(L[i])&&L[i-1]-L[i]>=gap)open=true;
  return{region,layers:L.map(h=>h<-9e3?null:+h.toFixed(2)),open};
 }
 const poll=setInterval(()=>{
  if(!skip.has('grade'))installGrade();else gradeInstalled=true;
  if(top.state==='waiting'&&!skip.has('cover')&&worldReady()){top.state='sampling';top.snapshot=snapshot();setTimeout(buildTop,1500);}
  if(gradeInstalled&&top.state!=='waiting'&&top.state!=='sampling')clearInterval(poll);
 },100);

 window.stylizedAtmosphere={
  uniforms:SM,grade,
  set(o){const map={fog:[SM.enable,'x'],wet:[SM.enable,'y'],rings:[SM.enable,'z'],grade:[grade.a,'x']};for(const [k,v]of Object.entries(o))if(map[k])map[k][0][map[k][1]]=v?1:0;return this.state();},
  rebuildRainCover(){top.snapshot=snapshot();buildTop();return this.state().rainCover;},
  coverAt,
  state(){return{schema:'sm-v02-stylized-atmosphere-1',parts:{fog:SM.enable.x>.5,wet:SM.enable.y>.5,rings:SM.enable.z>.5,grade:grade.a.x>.5},gradeInstalled,gradeError,
   rainCover:{state:top.state,layers:{fine:top.fine?.layers,coarse:top.coarse?.layers},ms:top.ms,included:top.included,excludedMoved:top.excludedMoved,excludedOther:top.excludedOther,fine:top.fine&&{center:top.fine.center,half:top.fine.half,size:top.fine.size},coarse:top.coarse&&{center:top.coarse.center,half:top.coarse.half,size:top.coarse.size},error:top.error},
   overlays:{state:overlay.state,count:overlay.count,candidates:overlay.candidates,inPlay:overlay.inPlay,upAreaM2:Math.round(overlay.upArea),error:overlay.error},
   time:SM.view.x}}
 };
})();
