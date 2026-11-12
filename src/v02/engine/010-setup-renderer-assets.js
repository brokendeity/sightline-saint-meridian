
if(!window.THREE)throw new Error('Three.js unavailable');
const EMBEDDED_FBX={};
const CORE_ASSET_URLS={"Idle.fbx":"assets/sightline/core/2d78a971456a5f37bd2a.fbx.gz","Walking.fbx":"assets/sightline/core/f8a580996ff48dd772e7.fbx.gz","normal Running.fbx":"assets/sightline/core/b76c2a2618dbbabd6890.fbx.gz","sprinting - running fast.fbx":"assets/sightline/core/a7824d61b174d3c789ad.fbx.gz","Standing Aim Idle 01.fbx":"assets/sightline/core/459c5e559bf482925f73.fbx.gz","aim shoot fly .fbx":"assets/sightline/core/3ee07d9f05f06203aa26.fbx.gz","take off flight.fbx":"assets/sightline/core/1c4c9835f88664c3a323.fbx.gz","Flying.fbx":"assets/sightline/core/ff2bb86e5714fc075e92.fbx.gz","Falling Idle ffrom sky.fbx":"assets/sightline/core/6c6bee59525c5f7c5349.fbx.gz","Falling face first from sky .fbx":"assets/sightline/core/eeee80a5de2e72ee4967.fbx.gz","Hard Landing from sky fall.fbx":"assets/sightline/core/6422f3a9fa1ae1f1dc36.fbx.gz","Falling Flat Impact.fbx":"assets/sightline/core/e48e09e5501b5502f5be.fbx.gz"};
async function loadCoreAssets(){await Promise.all(Object.entries(CORE_ASSET_URLS).map(async([name,url])=>{const response=await fetch(url);if(!response.ok)throw Error("Core asset unavailable: "+name);EMBEDDED_FBX[name]=fflate.gunzipSync(new Uint8Array(await response.arrayBuffer())).buffer;}));}

const ASSET_KEYS = {
  idle:'Idle.fbx', walk:'Walking.fbx', run:'normal Running.fbx', sprint:'sprinting - running fast.fbx',
  groundAim:'Standing Aim Idle 01.fbx', airAim:'aim shoot fly .fbx', takeoff:'take off flight.fbx', fly:'Flying.fbx',
  fallControlled:'Falling Idle ffrom sky.fbx', fallUncontrolled:'Falling face first from sky .fbx',
  hardLand:'Hard Landing from sky fall.fbx', flatImpact:'Falling Flat Impact.fbx'
};
const $=id=>document.getElementById(id);
const loading=$('loading'),menu=$('menu'),hud=$('hud'),loadfill=$('loadfill'),loadtext=$('loadtext');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const clock=new THREE.Clock();
const scene=new THREE.Scene();scene.background=new THREE.Color(0x050914);scene.fog=new THREE.FogExp2(0x103c48,.00135);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,1800);
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:new URLSearchParams(location.search).has('capture')})}catch(err){loadtext.textContent='WebGL is unavailable. Enable graphics acceleration and reload.';throw err}renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer: coarse)').matches?1.25:1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x67a4af,0x17101e,.36));const sun=new THREE.DirectionalLight(0xa4d7dc,.65);sun.position.set(-180,320,90);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0002;sun.shadow.normalBias=.35;sun.shadow.camera.left=-450;sun.shadow.camera.right=450;sun.shadow.camera.top=450;sun.shadow.camera.bottom=-450;scene.add(sun);
const moon=new THREE.DirectionalLight(0x74668e,.24);moon.position.set(300,180,-300);scene.add(moon);
// Subtle world-space rim for the true 3D costume: lighting, NOT a flat outline/sprite.
const rim=new THREE.DirectionalLight(0xff9b63,.30);rim.position.set(90,95,140);scene.add(rim);

// Phase A: camera-centered atmospheric sky; purely scenic, outside all gameplay registries.
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;
const nightUniforms={time:{value:0},altitude:{value:0}};
const nightSky=new THREE.Mesh(new THREE.SphereGeometry(1500,40,24),new THREE.ShaderMaterial({
 uniforms:nightUniforms,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false,
 vertexShader:`varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
 fragmentShader:`precision highp float;varying vec3 direction;uniform float time;uniform float altitude;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 float fbm(vec2 p){return noise(p)*.57+noise(p*2.03+8.3)*.28+noise(p*4.1+17.1)*.15;}
  float hash31(vec3 p) {
    p  = fract(p * vec3(127.1, 311.7, 74.7));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float valueNoise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i),               hash31(i + vec3(1,0,0)), u.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), u.x), u.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), u.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), u.x), u.y),
      u.z
    );
  }

float cloudField(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*valueNoise3D(p);p=p*2.1+vec3(1.7,9.2,5.4);a*=.5;}return v/.9375;}
 void main(){vec3 d=normalize(direction);float h=max(d.y,0.);float high=smoothstep(60.,600.,altitude);
 vec3 col=mix(vec3(.028,.12,.15),vec3(.012,.025,.059),smoothstep(0.,.85,h));
 float horizon=exp(-abs(d.y)*7.5);col+=vec3(.31,.115,.059)*horizon*(1.-high*.65);
 // Sample on the sphere so clouds stay continuous at the horizon and overhead.
 vec3 moonDir=normalize(vec3(-.55,.40,-.77));vec3 cp=d*5.2+vec3(time*.003,time*.001,time*.002);
 float n=cloudField(cp),fine=cloudField(cp*1.8+vec3(3.,2.,1.));
 float density=n+fine*.14;float cloud=smoothstep(.42,.65,density)*smoothstep(-.10,.14,d.y);
 float edge=smoothstep(.43,.51,density)*(1.-smoothstep(.53,.64,density));
 float moonFacing=pow(max(0.,dot(d,moonDir)),7.);
 vec3 cloudColor=mix(vec3(.025,.11,.145),vec3(.07,.255,.28),smoothstep(.44,.68,n));
 cloudColor+=vec3(.09,.055,.13)*fine+vec3(.09,.27,.29)*edge*(.25+moonFacing*.75);
 col=mix(col,cloudColor,cloud*.87*(1.-high*.22));
 float md=length(d-moonDir);float halo=exp(-md*md/.006);col+=vec3(.16,.29,.32)*halo*(1.-cloud*.65);
 float disc=1.-smoothstep(.014,.016,md);float moonTexture=.82+.18*fbm(d.xz*650.);col=mix(col,vec3(.71,.86,.82)*moonTexture,disc*(1.-cloud*.9));
 vec2 starUV=vec2(atan(d.z,d.x)*80.,asin(d.y)*80.);vec2 cell=floor(starUV);float star=step(.996,hash(cell))*pow(max(0.,1.-length(fract(starUV)-.5)*2.),7.);col+=vec3(.55,.69,.78)*star*smoothstep(.13,.55,h)*(1.-cloud)*mix(.25,.8,high);
 gl_FragColor=vec4(col,1.);}`
}));nightSky.frustumCulled=false;nightSky.renderOrder=-100;scene.add(nightSky);
// Shader adaptations from cortiz2894/stylized-components.
/*
MIT License

Copyright (c) 2026 Christian Ortiz (Cortiz)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// Two real neon lights, reused for the nearest light pools rather than one light per sign.
const nightEmitters=[];const neonLights=[new THREE.PointLight(0x36d5dd,1.6,48,2),new THREE.PointLight(0xff743a,1.4,44,2)];neonLights.forEach(l=>scene.add(l));
const poolGeo=new THREE.PlaneGeometry(26,26);
for(let i=0;i<10;i++){const angle=i*Math.PI/5,x=Math.cos(angle)*74,z=Math.sin(angle)*74,color=new THREE.Color(i%2?0xff743a:0x36c4ce);
 const mat=new THREE.ShaderMaterial({uniforms:{tint:{value:color}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`varying vec2 uv0;void main(){uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 uv0;uniform vec3 tint;void main(){float r=length((uv0-.5)*2.);gl_FragColor=vec4(tint,pow(max(0.,1.-r),2.)*.23);}`});
 const pool=new THREE.Mesh(poolGeo,mat);pool.rotation.x=-Math.PI/2;pool.position.set(x,.405,z);scene.add(pool);nightEmitters.push({position:new THREE.Vector3(x,4,z),color});
}
// Restrained screen-space bloom and grading: preserve the crisp central sample.
const PhaseTarget=renderer.capabilities.isWebGL2?THREE.WebGLMultisampleRenderTarget:THREE.WebGLRenderTarget;const phaseTarget=new PhaseTarget(1,1,{depthBuffer:true,stencilBuffer:true});if(renderer.capabilities.isWebGL2)phaseTarget.samples=4;phaseTarget.texture.encoding=THREE.sRGBEncoding;
const phaseScreen=new THREE.Scene(),phaseCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const phasePost=new THREE.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,uniforms:{image:{value:phaseTarget.texture},pixel:{value:new THREE.Vector2()},outlineStrength:{value:.18},combatFocus:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`varying vec2 vUv;uniform sampler2D image;uniform vec2 pixel;uniform float outlineStrength;uniform float combatFocus;
vec3 bright(vec2 uv){vec3 c=texture2D(image,uv).rgb;return c*smoothstep(.72,1.,max(c.r,max(c.g,c.b)));}
float lumAt(vec2 uv){return dot(texture2D(image,uv).rgb,vec3(.299,.587,.114));}
void main(){vec3 c=texture2D(image,vUv).rgb;vec2 t=pixel;
float s00=lumAt(vUv+vec2(-t.x,-t.y)),s10=lumAt(vUv+vec2(0.,-t.y)),s20=lumAt(vUv+vec2(t.x,-t.y));
float s01=lumAt(vUv+vec2(-t.x,0.)),s21=lumAt(vUv+vec2(t.x,0.));
float s02=lumAt(vUv+vec2(-t.x,t.y)),s12=lumAt(vUv+vec2(0.,t.y)),s22=lumAt(vUv+vec2(t.x,t.y));
float gx=-s00-2.*s01-s02+s20+2.*s21+s22;float gy=-s00-2.*s10-s20+s02+2.*s12+s22;
float edge=smoothstep(.18,.48,sqrt(gx*gx+gy*gy));float luminous=max(c.r,max(c.g,c.b));
c=mix(c,vec3(.005,.012,.021),edge*outlineStrength*(1.-smoothstep(.38,.75,luminous)));
vec2 r=pixel*5.;vec3 bloom=(bright(vUv+r)+bright(vUv-r)+bright(vUv+vec2(r.x,-r.y))+bright(vUv+vec2(-r.x,r.y)))*.25;
c+=bloom*.16;c=mix(c,c*vec3(.96,1.025,1.025),.45);float focusEdge=smoothstep(.2,.75,length(vUv-.5));c*=1.-focusEdge*combatFocus*.2;c=mix(c,c*vec3(1.06,1.01,.94),combatFocus*.18);gl_FragColor=vec4(c,1.);}
`});phaseScreen.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),phasePost));
const adaptiveQuality={enabled:true,base:renderer.getPixelRatio(),scale:1,samples:[],warmup:0,slow:0,healthy:0,changes:0,fallback:false,target:1/60,
 setScale(scale){if(this.scale===scale)return;this.scale=scale;this.changes++;renderer.setPixelRatio(this.base*scale);renderer.setSize(innerWidth,innerHeight,false);},
 update(dt){if(!this.enabled||!gameActive||document.hidden||this.fallback||dt<=0||dt>.12)return;this.warmup+=dt;if(this.warmup<3)return;this.samples.push(dt);if(this.samples.length<90)return;const sorted=this.samples.slice().sort((a,b)=>a-b),fast=sorted[9],average=this.samples.reduce((a,b)=>a+b,0)/this.samples.length;this.samples.length=0;if(fast<.011)this.target=1/120;const slow=average>this.target*1.35,healthy=average<this.target*1.1;this.slow=slow?this.slow+1:0;this.healthy=healthy?this.healthy+1:0;if(this.slow>=2&&this.scale===1){this.setScale(.75);this.slow=0;}else if(this.healthy>=6&&this.scale<1){this.setScale(1);this.healthy=0;}if(this.changes>=3){if(this.scale!==.75)this.setScale(.75);this.fallback=true;}}
};
function renderNight(dt){const renderMark=performance.now();updatePresentation(dt);window.v02GameplayFixes?.afterPresentation();window.actionWorld?.present();window.verticalEncounters?.present();window.verticalMarket?.present();window.verticalPursuit?.present();window.verticalDiscovery?.present();window.verticalWorldLife?.present();window.verticalAppearance?.present();window.verticalHUD?.present();window.verticalViews?.present();adaptiveQuality.update(dt);if(typeof wetSurfaces!=="undefined")wetSurfaces.update(dt);nightUniforms.time.value+=reducedMotion.matches?0:dt;nightUniforms.altitude.value=camera.position.y;nightSky.position.copy(camera.position);if(typeof streetAtmosphere!=="undefined")streetAtmosphere.update(dt);
 const nearby=nightEmitters.filter(e=>!e.owner||cityVisualPolish.isSourceValid(e)).sort((a,b)=>a.position.distanceToSquared(s.pos)-b.position.distanceToSquared(s.pos));neonLights.forEach((l,i)=>{l.position.copy(nearby[i].position);l.color.copy(nearby[i].color)});
 if(typeof updateVisualBudget==='function')updateVisualBudget(dt);updateDroneSpotlights();if(typeof cityVisualPolish!=='undefined')cityVisualPolish.update(dt);
 const size=renderer.getDrawingBufferSize(new THREE.Vector2());if(phaseTarget.width!==size.x||phaseTarget.height!==size.y){phaseTarget.setSize(size.x,size.y);phasePost.uniforms.pixel.value.set(1/size.x,1/size.y)}
 window.loadoutInterface?.tick(dt);window.loadoutHero?.beforeRender(dt);window.kinsmokeHero?.beforeRender(dt);renderer.setRenderTarget(phaseTarget);renderer.render(scene,camera);window.threadrailGame?.capture(renderer,camera);runtimePolish.sceneCalls=renderer.info.render.calls;runtimePolish.sceneTriangles=renderer.info.render.triangles;renderer.setRenderTarget(null);renderer.render(phaseScreen,phaseCamera);window.actionMetrics?.sample("render",performance.now()-renderMark);
}

