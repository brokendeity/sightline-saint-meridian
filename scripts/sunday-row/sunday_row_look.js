/* Sunday Row look (look-dev slice, 2026-11-09). An anime-painted rendering style for Backspool's home district, built
   from design principles of the user's reference (painted cumulus sky, warm sun and cool shadows, dense street clutter,
   clean hand-painted surfaces, thin ink lines, saturated grade). Canon content comes from the Map Bible (Mercer Strip,
   Sunday Row): brick walk-ups, stoops, fire escapes, Weller's Bakery, Lawson's corner, the Mercer bus stop.
   Three.js r128. Everything is procedural: painted maps are drawn on canvases, the sky is a shader, no image assets.
   API: SundayRowLook.create(renderer, scene, camera, options) -> {applyMaterials(root), addSky(), addSkyline(),
   addSigns(anchors), render(), setSize(w, h), lights, settings}. Colours are display values (the page renders in
   gamma space and grades in post), which keeps the toon ramp predictable. */
(function(root){
 'use strict';
 const T=THREE;
 // ---- palette (display colours) by Blender material role
 const PAL={asphalt:'#525b6b',curb:'#bdb6ad',sidewalk:'#cfc5b6',paint_yellow:'#f4c94a',paint_white:'#f5f2ea',
  brick_red:'#b9543c',brick_brown:'#8e4c36',brick_umber:'#734838',brick_rose:'#c46e5c',brick_tan:'#cb9c6c',
  trim:'#eadfc6',cornice:'#e3d5b8',window_frame:'#2e3440',storefront_frame:'#262a31',door:'#5c3b2b',sign_band:'#253145',
  awning_cream:'#f0e1bd',awning_red:'#cc4238',awning_green:'#2e8059',awning_blue:'#2b5fa0',stoop_stone:'#aca59b',railing:'#20242a',
  ac_unit:'#dde1e3',fire_escape:'#2a2e35',roof_box:'#8d9198',water_tank:'#8c5b3b',water_tank_roof:'#5d3d2a',water_tank_leg:'#3a3f46',
  dumpster:'#2e6c4a',milk_crate:'#2f63cc',planter:'#908c86',shrub:'#52a048',bus_shelter_frame:'#2c3e58',bus_shelter_roof:'#2c3e58',
  bench:'#6d4a34',pole_metal:'#5d6771',sign_bus:'#1f61c4',pole_wood:'#6c5443',insulator:'#3a4652',transformer:'#7f888f',wire:'#1a1e25',
  lamp_head:'#a3abb3',roof_tar:'#5a5f66',tree_pit:'#5d4b3c',tree_trunk:'#5c4535',foliage:'#3a8443',aframe:'#2a2f38',pot:'#b5603c',bike_frame:'#c43b3b',chair:'#3b6fb0',laundry_a:'#f2e9d8',laundry_b:'#e8b4b8',laundry_c:'#8fc1e3',car_light:'#fff4d2',car_tail:'#e4413a',hydrant:'#d63b2c',trash_can:'#3e6d50',news_box:'#2a5bab',
  car_red:'#c9372f',car_white:'#eeeeea',car_teal:'#2f8f93',car_navy:'#253a66',car_yellow:'#f0bd2f',car_glass:'#2b3644',tire:'#1b1d22'};
 const SMOOTH=new Set(['foliage','shrub','water_tank','tire','hydrant','trash_can','transformer','wire']);
 // ---- small canvas helpers
 function canvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
 function rand(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
 function shade(hex,k){const c=new T.Color(hex);return '#'+c.multiplyScalar(k).getHexString();}
 // Painted brick: soft bricks with gentle value variation and light mortar. 1 texture = 2.4 m x 1.2 m of wall.
 function brickMap(base){return canvas(512,256,(g,w,h)=>{const r=rand(base.length*977);g.fillStyle=shade(base,1.18);g.fillRect(0,0,w,h);
  const bw=w/10,bh=h/16;for(let y=0;y<16;y++)for(let x=-1;x<11;x++){const ox=(y%2)*bw/2;const k=.88+r()*.2;g.fillStyle=shade(base,k);g.fillRect(x*bw+ox+2,y*bh+2,bw-4,bh-3);
   if(r()<.08){g.fillStyle='rgba(255,240,220,.18)';g.fillRect(x*bw+ox+3,y*bh+3,bw-8,2);}}
  const grad=g.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(255,255,255,.05)');grad.addColorStop(1,'rgba(0,0,30,.06)');g.fillStyle=grad;g.fillRect(0,0,w,h);});}
 function slabMap(base){return canvas(256,256,(g,w,h)=>{const r=rand(31);g.fillStyle=base;g.fillRect(0,0,w,h);for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.fillStyle=shade(base,.96+r()*.07);g.fillRect(x*w/2+2,y*h/2+2,w/2-4,h/2-4);}
  g.strokeStyle=shade(base,.8);g.lineWidth=2;for(let i=0;i<=2;i++){g.beginPath();g.moveTo(i*w/2,0);g.lineTo(i*w/2,h);g.stroke();g.beginPath();g.moveTo(0,i*h/2);g.lineTo(w,i*h/2);g.stroke();}});}
 function asphaltMap(base){return canvas(256,256,(g,w,h)=>{const r=rand(77);g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`rgba(${r()<.5?255:0},${r()<.5?255:0},${r()<.5?255:40},${.025+r()*.03})`;const s=1+r()*3;g.fillRect(r()*w,r()*h,s,s);}
  for(let i=0;i<5;i++){g.fillStyle='rgba(20,25,40,.07)';g.beginPath();g.ellipse(r()*w,r()*h,20+r()*50,10+r()*30,r()*3,0,7);g.fill();}});}
 // Anime window: cool sky reflection gradient with a diagonal highlight streak.
 const windowMap=canvas(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#a9d4f2');gr.addColorStop(.55,'#5e8fbd');gr.addColorStop(1,'#33507a');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.moveTo(w*.15,0);g.lineTo(w*.38,0);g.lineTo(w*.05,h*.6);g.lineTo(0,h*.6);g.fill();g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.moveTo(w*.48,0);g.lineTo(w*.56,0);g.lineTo(w*.2,h);g.lineTo(w*.12,h);g.fill();});
 // Warm interior storefront glass (art direction: warm amber ceilings and windows), with shelf hints.
 // One texture = one 2.4 m x 2.6 m pane: warm ceiling light falling into a darker interior, lit shelves, a soft reflection.
 const storeMap=canvas(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#ffe7b0');gr.addColorStop(.25,'#e7a75e');gr.addColorStop(1,'#5b3424');g.fillStyle=gr;g.fillRect(0,0,w,h);const r=rand(5);
  g.fillStyle='rgba(255,250,225,.85)';for(let i=0;i<3;i++)g.fillRect(w*(.12+i*.3),h*.05,w*.16,5);
  for(let y=0;y<3;y++){const sy=h*(.42+y*.17);g.fillStyle='rgba(60,28,18,.55)';g.fillRect(w*.05,sy,w*.9,4);for(let i=0;i<26;i++){g.fillStyle=`hsla(${[5,40,200,120,330][i%5]},60%,${45+r()*20}%,.85)`;g.fillRect(w*.06+r()*w*.86,sy-10-r()*6,5+r()*7,10+r()*6);}}
  const ref=g.createLinearGradient(0,0,w,h);ref.addColorStop(0,'rgba(170,210,240,.28)');ref.addColorStop(.5,'rgba(170,210,240,0)');g.fillStyle=ref;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,255,255,.22)';g.beginPath();g.moveTo(w*.62,0);g.lineTo(w*.72,0);g.lineTo(w*.42,h);g.lineTo(w*.32,h);g.fill();});
 // Painted foliage: leaf dabs, lighter toward the top of each 1.6 m tile.
 function leafMap(base){return canvas(256,256,(g,w,h)=>{const r=rand(11);g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<520;i++){const y=r()*h,k=y<h*.5?1.1+r()*.25:.78+r()*.25;g.fillStyle=shade(base,k);g.beginPath();g.ellipse(r()*w,y,4+r()*7,3+r()*5,r()*3,0,7);g.fill();}});}
 function foliageRamp(){const d=new Uint8Array([80,150,215,255]);const t=new T.DataTexture(d,4,1,T.LuminanceFormat);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t;}
 function gradientRamp(){const d=new Uint8Array([105,178,232,255]);const t=new T.DataTexture(d,4,1,T.LuminanceFormat);t.minFilter=t.magFilter=T.NearestFilter;t.needsUpdate=true;return t;}
 function create(renderer,scene,camera,options={}){
  const settings={outline:1.0,saturation:1.16,bloom:.32,vignette:.22,warm:.05,...options};
  const ramp=gradientRamp(),maps={};
  // ---- lights: warm afternoon sun from the south-west, cool sky fill
  const sun=new T.DirectionalLight('#ffe4b8',1.32);sun.position.set(-60,70,55);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
  Object.assign(sun.shadow.camera,{left:-110,right:110,top:60,bottom:-60,near:1,far:300});sun.shadow.bias=-0.0006;sun.shadow.normalBias=.03;sun.target.position.set(0,0,0);scene.add(sun,sun.target);
  const hemi=new T.HemisphereLight('#8db6ff','#b79d7c',.66);scene.add(hemi);
  scene.fog=new T.Fog('#c3daf0',120,520);
  function material(name){
   if(name==='window_glass')return new T.MeshBasicMaterial({map:windowMap,fog:true});
   if(name==='storefront_glass'){const m=new T.MeshBasicMaterial({map:storeMap,fog:true});m.map.repeat.set(1/2.4,1/2.6);return m;}
   if(name==='car_light'||name==='car_tail')return new T.MeshBasicMaterial({color:PAL[name],fog:true});
   if(name==='bus_shelter_glass'||name==='car_glass')return new T.MeshToonMaterial({color:name==='car_glass'?'#30405a':'#bfe3f5',gradientMap:ramp,transparent:name!=='car_glass',opacity:.45});
   if(name==='lamp_head')return new T.MeshToonMaterial({color:PAL.lamp_head,gradientMap:ramp,emissive:'#fff2c8',emissiveIntensity:.25});
   const hex=PAL[name]||'#9a9a9a';const m=new T.MeshToonMaterial({color:'#ffffff',gradientMap:ramp});
   if(name.startsWith('brick_')){maps[name]=maps[name]||brickMap(hex);m.map=maps[name];m.map.repeat.set(1/2.4,1/1.2);}
   else if(name==='sidewalk'){maps.s=maps.s||slabMap(hex);m.map=maps.s;m.map.repeat.set(1/1.5,1/1.5);}
   else if(name==='asphalt'){maps.a=maps.a||asphaltMap(hex);m.map=maps.a;m.map.repeat.set(1/6,1/6);}
   else if(name==='foliage'||name==='shrub'){maps[name]=maps[name]||leafMap(hex);m.map=maps[name];m.map.repeat.set(1/1.6,1/1.6);m.gradientMap=foliageRamp();m.emissive.set('#0b2a2a');}
   else m.color.set(hex);
   return m;
  }
  function applyMaterials(root){let meshes=0;root.traverse(o=>{if(!o.isMesh)return;const name=(o.material?.name||o.name.replace(/^SR_/,'')).replace(/\.\d+$/,'');
   o.material=material(name);o.castShadow=!['window_glass','storefront_glass','paint_white','paint_yellow','asphalt','sidewalk','car_glass','bus_shelter_glass'].includes(name);o.receiveShadow=true;
   if(SMOOTH.has(name))o.geometry.computeVertexNormals();o.userData.role=name;meshes++;});return meshes;}
  // ---- sky dome: gradient plus painted cumulus (two-tone lit/shaded, soft but clear edges)
  function addSky(){
   const sky=new T.Mesh(new T.SphereGeometry(1500,48,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{sun:{value:sun.position.clone().normalize()},time:{value:0},toLinear:{value:0}},
    vertexShader:'varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;}',
    fragmentShader:`varying vec3 vDir;uniform vec3 sun;uniform float time;uniform float toLinear;
     float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
     float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
     float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<6;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
     void main(){vec3 d=normalize(vDir);float y=max(d.y,0.);
      vec3 zen=vec3(.16,.42,.86),mid=vec3(.36,.62,.95),hor=vec3(.80,.89,.97);
      vec3 col=mix(hor,mid,smoothstep(0.,.25,y));col=mix(col,zen,smoothstep(.25,.9,y));
      // clouds on a plane projected above the city; bigger, lower banks toward the horizon
      vec2 uv=d.xz/(y+.18)*0.75+vec2(time*.004,0.);vec2 w=vec2(fbm(uv*.8+1.3),fbm(uv*.8+7.1));uv+=w*.9;
      float big=fbm(uv*.45),puff=fbm(uv*1.6+2.7),fine=fbm(uv*4.5+5.1);
      float dens=big*.62+puff*.32+fine*.12+(1.-smoothstep(.02,.4,y))*.16-.05*smoothstep(.6,1.,y)+.03;
      float cov=smoothstep(.535,.565,dens);
      vec2 su=uv+normalize(sun.xz+1e-4)*.09;float dl=fbm(su*.45)*.62+fbm(su*1.6+2.7)*.32+fbm(su*4.5+5.1)*.12;
      float shadeK=smoothstep(-.01,.05,dl-dens+.015);
      vec3 cl=mix(vec3(1.,.985,.95),vec3(.62,.67,.86),shadeK*.85);
      cl=mix(cl,vec3(.78,.82,.95),smoothstep(.56,.62,dens)*.25);
      col=mix(col,cl,cov*smoothstep(.0,.05,y));
      float s=max(dot(d,normalize(sun)),0.);col+=vec3(1.,.9,.7)*pow(s,40.)*.35;
      gl_FragColor=vec4(toLinear>.5?pow(col,vec3(2.2)):col,1.);}`}));
   sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);return sky;}
  // ---- painted cumulus: art-directed sprites (lit tops, lavender bellies, crisp edges), in a ring behind the skyline
  function cumulusTexture(seed){return canvas(512,320,(g,w,h)=>{const r=rand(seed);const puffs=[];const n=14+Math.floor(r()*10);
   for(let i=0;i<n;i++){const x=w*(.12+r()*.76),base=h*.8,top=h*(.18+r()*.35);const y=base-(base-top)*Math.pow(1-Math.abs(x/w-.5)*1.7,1.2)*r();puffs.push([x,y,h*(.09+r()*.12)]);}
   puffs.push([w*.5,h*.78,h*.2]);
   // one silhouette (union of puffs), then shading painted on top of it only
   g.fillStyle='#fffdf8';for(const [x,y,rr] of puffs){g.beginPath();g.arc(x,y,rr,0,7);g.fill();}
   g.globalCompositeOperation='source-atop';
   const belly=g.createLinearGradient(0,h*.3,0,h*.95);belly.addColorStop(0,'rgba(170,178,220,0)');belly.addColorStop(.55,'rgba(170,178,220,.45)');belly.addColorStop(1,'rgba(140,150,205,.85)');g.fillStyle=belly;g.fillRect(0,0,w,h);
   g.fillStyle='rgba(150,160,210,.22)';for(const [x,y,rr] of puffs){g.beginPath();g.arc(x+rr*.35,y+rr*.4,rr*.8,0,7);g.fill();}
   g.fillStyle='rgba(255,250,240,.55)';for(const [x,y,rr] of puffs){g.beginPath();g.arc(x-rr*.25,y-rr*.3,rr*.55,0,7);g.fill();}});}
  function addClouds(){const g=new T.Group();const r=rand(21);for(let i=0;i<18;i++){const a=(i+r()*.6)/18*Math.PI*2,d=850+r()*300,s=260+r()*300;
   const sp=new T.Sprite(new T.SpriteMaterial({map:cumulusTexture(100+i),fog:false,transparent:true,depthWrite:false}));sp.scale.set(s,s*.62,1);sp.position.set(Math.cos(a)*d,90+r()*170,Math.sin(a)*d);sp.renderOrder=-5;g.add(sp);}
   scene.add(g);return g;}
  // ---- low-detail context: ground and surrounding brick blocks so raised views do not show a void
  function addContext(layout){const g=new T.Group();const ground=new T.Mesh(new T.PlaneGeometry(1600,1600),new T.MeshToonMaterial({color:'#6f7680',gradientMap:ramp}));ground.rotation.x=-Math.PI/2;ground.position.y=-.06;ground.receiveShadow=true;g.add(ground);
   const r=rand(55),cols=['#a65a43','#8c5240','#b47a5a','#7a4a3a','#c18a62'];const mats=cols.map(c=>new T.MeshToonMaterial({color:c,gradientMap:ramp}));const geo=new T.BoxGeometry(1,1,1);
   const x0=layout.x[0]-20,x1=layout.x[1]+20,zN=-(layout.front+18),zS=layout.front+18;
   for(let i=0;i<260;i++){const x=(r()-.5)*700,z=(r()-.5)*700;if(x>x0&&x<x1&&z>zN-6&&z<zS+6)continue;if(Math.hypot(x,z)>360)continue;
    const w=10+r()*16,d=10+r()*16,h=7+r()*(Math.hypot(x,z)>200?26:14);const m=new T.Mesh(geo,mats[i%mats.length]);m.scale.set(w,h,d);m.position.set(x,h/2,z);m.castShadow=m.receiveShadow=true;g.add(m);}
   scene.add(g);return g;}
  // ---- hazy distant skyline (Saint Meridian towers beyond Sunday Row), three depth layers
  function addSkyline(){const g=new T.Group();const r=rand(9);const haze=['#9db7d4','#a9c2dc','#b9cfe4'];
   const winTex=canvas(64,128,(c,w,h)=>{c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.fillStyle='rgba(60,80,110,.35)';for(let y=4;y<h;y+=8)for(let x=4;x<w;x+=8)c.fillRect(x,y,4,5);});
   for(let layer=0;layer<3;layer++){const dist=380+layer*190;const mat=new T.MeshBasicMaterial({color:haze[layer],map:winTex,fog:false});
    for(let i=0;i<70;i++){const a=r()*Math.PI*2;if(Math.abs(Math.sin(a))<.2&&layer===0)continue;let w=18+r()*36,h=40+r()*(layer===2?260:170),y0=-2;
     const steps=1+Math.floor(r()*3);for(let s=0;s<steps;s++){const hh=h*(s===0?.62:.38/(steps-1||1));const m=new T.Mesh(new T.BoxGeometry(w,hh,w),mat);m.position.set(Math.cos(a)*dist,y0+hh/2,Math.sin(a)*dist);g.add(m);y0+=hh;w*=.72;}
     if(r()<.3){const sp=new T.Mesh(new T.CylinderGeometry(.6,1.6,h*.18,6),mat);sp.position.set(Math.cos(a)*dist,y0+h*.09,Math.sin(a)*dist);g.add(sp);}}
    mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying float vH;').replace('#include <begin_vertex>','#include <begin_vertex>\nvH=(modelMatrix*vec4(position,1.)).y;');
     sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vH;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=mix(.72,1.,smoothstep(0.,180.,vH));');};}
   scene.add(g);return g;}
  // ---- signs as painted canvas panels
  function signTexture(s){const W=1024,H=Math.max(128,Math.round(1024*s.height/s.width));return canvas(W,H,(g,w,h)=>{
   const themes={bakery:['#6d1f2a','#f6e6c2'],bodega:['#c7362b','#ffe066'],barber:['#1e2a44','#ffffff'],church_hall:['#2b2f55','#f2d27a'],shop:['#1d5a8a','#ffffff'],bus:['#1f61c4','#ffffff'],aframe:['#22262e','#f7f3e8'],poster:['#f3c13a','#2a1f3d']};
   const [bg,fg]=themes[s.kind]||themes.shop;g.fillStyle=bg;g.fillRect(0,0,w,h);g.strokeStyle=fg;g.lineWidth=Math.max(4,h*.06);g.strokeRect(g.lineWidth,g.lineWidth,w-2*g.lineWidth,h-2*g.lineWidth);
   if(s.kind==='barber'){for(let i=0;i<8;i++){g.fillStyle=i%2?'#d33':'#fff';g.fillRect(w*.04,h*(.15+i*.09),h*.12,h*.09);}}
   g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';let size=h*.62;g.font=`900 ${size}px "Arial Black", Impact, sans-serif`;while(g.measureText(s.name).width>w*.84&&size>10){size-=4;g.font=`900 ${size}px "Arial Black", Impact, sans-serif`;}
   g.fillText(s.name,w/2,h*.54);});}
  function addSigns(signs){for(const s of signs){if(!s.name)continue;const c=s.center,p=new T.Vector3(c[0],c[2],-c[1]);
   const m=new T.Mesh(new T.PlaneGeometry(s.width,s.height),new T.MeshBasicMaterial({map:signTexture(s),fog:true}));m.position.copy(p);
   // Blender facing -1 => facade faces -y (Blender) => +z (three). facing +1 => -z.
   m.rotation.y=s.facing<0?0:Math.PI;scene.add(m);}}
  // ---- post: ink lines (depth + normal edges), soft bloom, grade
  let W=2,H=2;const rtColor=new T.WebGLRenderTarget(W,H,{depthBuffer:true});rtColor.depthTexture=new T.DepthTexture(W,H);rtColor.depthTexture.type=T.UnsignedIntType;
  const rtNormal=new T.WebGLRenderTarget(W,H),rtA=new T.WebGLRenderTarget(W,H),rtB=new T.WebGLRenderTarget(W,H);
  const normalMat=new T.MeshNormalMaterial();
  const quad=new T.Mesh(new T.PlaneGeometry(2,2)),postScene=new T.Scene(),postCam=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(quad);
  const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const bright=new T.ShaderMaterial({uniforms:{tex:{value:null}},vertexShader:VS,fragmentShader:'uniform sampler2D tex;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb;float l=dot(c,vec3(.3,.59,.11));gl_FragColor=vec4(c*smoothstep(.78,1.,l),1.);}'});
  const blur=new T.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new T.Vector2()}},vertexShader:VS,fragmentShader:'uniform sampler2D tex;uniform vec2 dir;varying vec2 vUv;void main(){vec3 s=vec3(0.);float w[5];w[0]=.227;w[1]=.195;w[2]=.122;w[3]=.054;w[4]=.016;s+=texture2D(tex,vUv).rgb*w[0];for(int i=1;i<5;i++){s+=texture2D(tex,vUv+dir*float(i)).rgb*w[i];s+=texture2D(tex,vUv-dir*float(i)).rgb*w[i];}gl_FragColor=vec4(s,1.);}'});
  const comp=new T.ShaderMaterial({uniforms:{color:{value:null},normal:{value:null},depth:{value:null},bloom:{value:null},texel:{value:new T.Vector2()},near:{value:camera.near},far:{value:camera.far},
   outline:{value:settings.outline},saturation:{value:settings.saturation},bloomK:{value:settings.bloom},vignette:{value:settings.vignette},warm:{value:settings.warm}},vertexShader:VS,
   fragmentShader:`uniform sampler2D color,normal,depth,bloom;uniform vec2 texel;uniform float near,far,outline,saturation,bloomK,vignette,warm;varying vec2 vUv;
    float lin(vec2 uv){float z=texture2D(depth,uv).x*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
    void main(){vec3 c=texture2D(color,vUv).rgb;float d0=lin(vUv);
     float dd=0.;vec3 n0=texture2D(normal,vUv).xyz;float nd=0.;
     for(int i=0;i<4;i++){vec2 o=i==0?vec2(texel.x,0.):i==1?vec2(-texel.x,0.):i==2?vec2(0.,texel.y):vec2(0.,-texel.y);
      float d=lin(vUv+o);dd=max(dd,abs(d-d0)/max(d0,1.));nd=max(nd,length(texture2D(normal,vUv+o).xyz-n0));}
     float fade=1.-smoothstep(90.,320.,d0);
     float line=max(smoothstep(.035,.09,dd),smoothstep(.28,.6,nd))*fade*outline;
     vec3 ink=c*.32+vec3(.04,.05,.12);c=mix(c,ink,line*.85);
     c+=texture2D(bloom,vUv).rgb*bloomK;
     float l=dot(c,vec3(.3,.59,.11));c=mix(vec3(l),c,saturation);
     c=mix(c*vec3(.93,.97,1.07),c*vec3(1.05,1.0,.94),smoothstep(.25,.75,l));c+=warm*vec3(.06,.03,-.02);
     vec2 q=vUv-.5;c*=1.-vignette*dot(q,q)*1.6;
     gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
  function setSize(w,h){W=w;H=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const pr=renderer.getPixelRatio();
   rtColor.setSize(w*pr,h*pr);rtNormal.setSize(w*pr,h*pr);rtA.setSize(w*pr/4,h*pr/4);rtB.setSize(w*pr/4,h*pr/4);comp.uniforms.texel.value.set(1/(w*pr),1/(h*pr));}
  function pass(mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(postScene,postCam);}
  function render(){
   renderer.setRenderTarget(rtColor);renderer.render(scene,camera);
   const fog=scene.fog,bg=scene.background;scene.overrideMaterial=normalMat;scene.fog=null;renderer.setRenderTarget(rtNormal);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(scene,camera);scene.overrideMaterial=null;scene.fog=fog;
   bright.uniforms.tex.value=rtColor.texture;pass(bright,rtA);
   for(let i=0;i<2;i++){blur.uniforms.tex.value=rtA.texture;blur.uniforms.dir.value.set(1.5/rtA.width,0);pass(blur,rtB);blur.uniforms.tex.value=rtB.texture;blur.uniforms.dir.value.set(0,1.5/rtA.height);pass(blur,rtA);}
   Object.assign(comp.uniforms,{});comp.uniforms.color.value=rtColor.texture;comp.uniforms.normal.value=rtNormal.texture;comp.uniforms.depth.value=rtColor.depthTexture;comp.uniforms.bloom.value=rtA.texture;
   comp.uniforms.near.value=camera.near;comp.uniforms.far.value=camera.far;for(const k of['outline','saturation','vignette','warm'])comp.uniforms[k].value=settings[k];comp.uniforms.bloomK.value=settings.bloom;
   pass(comp,null);}
  return{applyMaterials,addSky,addClouds,addSkyline,addSigns,addContext,render,setSize,settings,lights:{sun,hemi}};
 }
 root.SundayRowLook={create,palette:PAL};
})(typeof window!=='undefined'?window:globalThis);
