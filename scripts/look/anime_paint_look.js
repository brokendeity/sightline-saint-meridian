/* Anime-paint look (2026-11-09): a location-independent rendering style for Three.js r128.
   User direction: the reference video's VISUAL look should transfer to any location. That video is realistic game
   rendering repainted by an AI, so the look is built the same way round: physically based light underneath, then a
   painterly post-process on top. Not toon bands.
     1. Materials: any MeshToon / Lambert / Phong / Basic-lit material is converted to MeshStandardMaterial (or
        Physical for glass and car paint), keeping colour, map and emissive. Roughness and metalness come from a role
        hint. Lit by the sun, a sky hemisphere and an environment map made from the scene's own sky.
     2. Post, at full resolution:
        - screen-space ambient occlusion from depth (corners and contacts darken);
        - painterly simplification: a 4-sector Kuwahara filter groups detail into flat brush patches, keeps edges;
        - sparing ink: thin dark lines mainly on depth silhouettes, weak on normal creases;
        - halation: wide warm glow around bright areas;
        - film grade: ACES tone curve, saturation, teal shadows, warm highlights, local contrast, vignette.
   API: AnimePaintLook.create(renderer, scene, camera, opts) -> {convertMaterials(root, roleOf), buildEnvironment(skyObjects),
   render(), setSize(w, h), settings}. Lights stay the caller's (it only scales them for physically based materials). */
(function(root){
 'use strict';
 const T=THREE;
 const ROLE={glass:{roughness:.08,metalness:0,physical:true,clearcoat:0,envMapIntensity:1.4},car:{roughness:.32,metalness:.25,physical:true,clearcoat:1,envMapIntensity:1.1},
  metal:{roughness:.45,metalness:.7},paint:{roughness:.55,metalness:0},stone:{roughness:.85,metalness:0},foliage:{roughness:.75,metalness:0},default:{roughness:.8,metalness:0}};
 function roleFor(name){name=name||'';if(/glass/.test(name))return'glass';if(/^car_(?!glass|light|tail)/.test(name))return'car';
  if(/pole_metal|railing|fire_escape|lamp|hydrant|news_box|trash|dumpster|transformer|water_tank_leg|bike_frame|chair/.test(name))return'metal';
  if(/foliage|shrub/.test(name))return'foliage';if(/brick|stone|sidewalk|curb|asphalt|stoop|planter|roof|cornice|trim/.test(name))return'stone';if(/awning|sign|door|frame|ac_unit|pot/.test(name))return'paint';return'default';}
 function create(renderer,scene,camera,opts={}){
  const settings={ao:.9,aoRadius:1.6,kuwahara:3,ink:.85,halation:.35,saturation:1.25,exposure:.95,teal:.12,warm:.08,clarity:.25,vignette:.22,...opts};
  let envMap=null;
  function convertMaterials(rootObj,roleOf=o=>o.userData.role||o.material?.name){
   let n=0;rootObj.traverse(o=>{if(!o.isMesh||!o.material||o.material.isShaderMaterial||o.material.isSpriteMaterial)return;const m=o.material;
    // Unlit painted signs, interiors and the distant skyline stay unlit; their colours are decoded to linear.
    if(m.isMeshBasicMaterial&&!/glass_bus|car_glass/.test(roleOf(o)||'')&&(m.map||!m.lights)){if(m.map){m.map.encoding=T.sRGBEncoding;m.map.needsUpdate=true;}if(!m.userData.linearised){m.color.convertSRGBToLinear();m.userData.linearised=true;}m.needsUpdate=true;return;}
    const role=roleFor(roleOf(o)),p=ROLE[role]||ROLE.default;
    const Cls=p.physical?T.MeshPhysicalMaterial:T.MeshStandardMaterial;
    const s=new Cls({color:m.color?m.color.clone():new T.Color(1,1,1),map:m.map||null,emissive:m.emissive?m.emissive.clone():new T.Color(0,0,0),emissiveIntensity:m.emissiveIntensity??1,
     roughness:p.roughness,metalness:p.metalness,transparent:m.transparent,opacity:m.opacity,envMapIntensity:p.envMapIntensity??.9});
    if(p.physical&&'clearcoat'in s){s.clearcoat=p.clearcoat;s.clearcoatRoughness=.08;}
    if(role==='glass'&&m.map){s.map=m.map;}
    // Display-referred palette and canvas maps -> linear for physically based shading
    s.color.convertSRGBToLinear();s.emissive.convertSRGBToLinear();if(s.map)s.map.encoding=T.sRGBEncoding;
    if(envMap)s.envMap=envMap;o.material=s;n++;});
   return n;}
  // Environment from the scene's own sky (dome and cloud sprites): soft sky light and reflections.
  function linearSky(objs){for(const root of objs)root.traverse(o=>{const m=o.material;if(!m)return;if(m.uniforms?.toLinear)m.uniforms.toLinear.value=1;if(m.isSpriteMaterial&&m.map){m.map.encoding=T.sRGBEncoding;m.needsUpdate=true;}});}
  function buildEnvironment(skyObjects){linearSky(skyObjects);const envScene=new T.Scene();for(const o of skyObjects)envScene.add(o.clone());
   const pm=new T.PMREMGenerator(renderer);envMap=pm.fromScene(envScene,.02).texture;pm.dispose();
   scene.traverse(o=>{if(o.isMesh&&o.material&&(o.material.isMeshStandardMaterial)){o.material.envMap=envMap;o.material.needsUpdate=true;}});return envMap;}
  // ---- render targets
  const rt=(depth)=>{const t=new T.WebGLRenderTarget(2,2,{type:T.HalfFloatType,depthBuffer:!!depth});if(depth){t.depthTexture=new T.DepthTexture(2,2);t.depthTexture.type=T.UnsignedIntType;}return t;};
  const rtScene=rt(true),rtNormal=new T.WebGLRenderTarget(2,2),rtPaint=rt(),rtA=rt(),rtB=rt(),rtC=rt();
  const normalMat=new T.MeshNormalMaterial();
  const quad=new T.Mesh(new T.PlaneGeometry(2,2)),post=new T.Scene(),cam=new T.OrthographicCamera(-1,1,1,-1,0,1);post.add(quad);
  const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const LIN=`uniform float near,far;float lin(sampler2D d,vec2 uv){float z=texture2D(d,uv).x*2.-1.;return 2.*near*far/(far+near-z*(far-near));}`;
  // 1. AO + Kuwahara painterly pass (works on the HDR scene colour)
  const paint=new T.ShaderMaterial({uniforms:{color:{value:null},depth:{value:null},texel:{value:new T.Vector2()},near:{value:.1},far:{value:3000},ao:{value:1},aoRadius:{value:1.6},radius:{value:3}},vertexShader:VS,
   fragmentShader:`uniform sampler2D color,depth;uniform vec2 texel;uniform float ao,aoRadius;uniform int radius;varying vec2 vUv;${LIN}
    void main(){
     // --- Kuwahara: pick the flattest of four quadrants (painterly grouping, edges kept)
     vec3 m[4];vec3 s[4];for(int k=0;k<4;k++){m[k]=vec3(0.);s[k]=vec3(0.);}
     float n=0.;
     for(int j=0;j<=4;j++)for(int i=0;i<=4;i++){if(i>radius||j>radius)continue;n+=1.;
      vec3 c0=texture2D(color,vUv+vec2(-float(i),-float(j))*texel).rgb;vec3 c1=texture2D(color,vUv+vec2(float(i),-float(j))*texel).rgb;
      vec3 c2=texture2D(color,vUv+vec2(float(i),float(j))*texel).rgb;vec3 c3=texture2D(color,vUv+vec2(-float(i),float(j))*texel).rgb;
      m[0]+=c0;s[0]+=c0*c0;m[1]+=c1;s[1]+=c1*c1;m[2]+=c2;s[2]+=c2*c2;m[3]+=c3;s[3]+=c3*c3;}
     float best=1e9;vec3 outc=texture2D(color,vUv).rgb;
     for(int k=0;k<4;k++){vec3 mu=m[k]/n;vec3 var=abs(s[k]/n-mu*mu);float v=var.r+var.g+var.b;if(v<best){best=v;outc=mu;}}
     // --- depth AO: neighbours closer than this pixel occlude it (scale-aware)
     float d0=lin(depth,vUv),occ=0.;float r=aoRadius*min(28.,120./max(d0,1.));
     for(int k=0;k<8;k++){float a=float(k)*0.785398+.39;for(int q=1;q<=2;q++){vec2 o=vec2(cos(a),sin(a))*texel*r*float(q)*2.5;float d=lin(depth,vUv+o);float diff=d0-d;occ+=smoothstep(.02*d0,.12*d0,diff)*(1.-smoothstep(.12*d0,.5*d0,diff));}}
     occ=clamp(occ/16.,0.,1.);if(d0>1500.)occ=0.;
     outc*=1.-ao*occ*.75;
     gl_FragColor=vec4(outc,1.);}`});
  const bright=new T.ShaderMaterial({uniforms:{tex:{value:null}},vertexShader:VS,fragmentShader:'uniform sampler2D tex;varying vec2 vUv;void main(){vec3 c=texture2D(tex,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));gl_FragColor=vec4(c*smoothstep(.7,1.6,l),1.);}'});
  const blur=new T.ShaderMaterial({uniforms:{tex:{value:null},dir:{value:new T.Vector2()}},vertexShader:VS,fragmentShader:'uniform sampler2D tex;uniform vec2 dir;varying vec2 vUv;void main(){vec3 s=texture2D(tex,vUv).rgb*.2;for(int i=1;i<7;i++){float w=.2*exp(-float(i*i)/14.);s+=(texture2D(tex,vUv+dir*float(i)).rgb+texture2D(tex,vUv-dir*float(i)).rgb)*w;}gl_FragColor=vec4(s*1.05,1.);}'});
  // 2. Composite: ink, halation, clarity, grade, tone curve
  const comp=new T.ShaderMaterial({uniforms:{paint:{value:null},normal:{value:null},depth:{value:null},glow:{value:null},soft:{value:null},texel:{value:new T.Vector2()},near:{value:.1},far:{value:3000},
   ink:{value:.85},halation:{value:.4},saturation:{value:1.2},exposure:{value:1},teal:{value:.1},warm:{value:.07},clarity:{value:.3},vignette:{value:.2}},vertexShader:VS,
   fragmentShader:`uniform sampler2D paint,normal,depth,glow,soft;uniform vec2 texel;uniform float ink,halation,saturation,exposure,teal,warm,clarity,vignette;varying vec2 vUv;${LIN}
    vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
    void main(){vec3 c=texture2D(paint,vUv).rgb*exposure;float d0=lin(depth,vUv);
     // local contrast (clarity) against a soft copy
     // luminance-only local contrast, so edges get no colour fringes
     float lc=dot(c,vec3(.2126,.7152,.0722)),ls=dot(texture2D(soft,vUv).rgb*exposure,vec3(.2126,.7152,.0722));c*=clamp(1.+clarity*(lc-ls)/max(lc,.06),.6,1.6);
     // ink: silhouettes from depth, faint creases from normals, fading with distance
     float dd=0.,nd=0.;vec3 n0=texture2D(normal,vUv).xyz;
     for(int i=0;i<4;i++){vec2 o=i==0?vec2(texel.x,0.):i==1?vec2(-texel.x,0.):i==2?vec2(0.,texel.y):vec2(0.,-texel.y);dd=max(dd,abs(lin(depth,vUv+o)-d0)/max(d0,1.));nd=max(nd,length(texture2D(normal,vUv+o).xyz-n0));}
     float line=max(smoothstep(.04,.1,dd),smoothstep(.55,.9,nd)*.45)*(1.-smoothstep(60.,260.,d0))*ink;
     c=mix(c,c*.18+vec3(.01,.012,.03),line);
     // halation: warm glow around bright areas
     c+=texture2D(glow,vUv).rgb*vec3(1.,.86,.7)*halation;
     c=aces(c);
     float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,saturation);
     c*=mix(vec3(1.-teal*.9,1.,1.+teal*.6),vec3(1.),smoothstep(.0,.5,l));c*=mix(vec3(1.),vec3(1.+warm,1.+warm*.4,1.-warm*.6),smoothstep(.45,1.,l));
     c=pow(clamp(c,0.,1.),vec3(1./2.2));
     vec2 q=vUv-.5;c*=1.-vignette*dot(q,q)*1.6;gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});
  function setSize(w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const pr=renderer.getPixelRatio(),W=Math.round(w*pr),H=Math.round(h*pr);
   for(const t of [rtScene,rtNormal,rtPaint])t.setSize(W,H);for(const t of [rtA,rtB,rtC])t.setSize(Math.round(W/4),Math.round(H/4));
   paint.uniforms.texel.value.set(1/W,1/H);comp.uniforms.texel.value.set(1/W,1/H);}
  function pass(mat,target){quad.material=mat;renderer.setRenderTarget(target);renderer.render(post,cam);}
  function render(){
   const prevTM=renderer.toneMapping;renderer.toneMapping=T.NoToneMapping;
   renderer.setRenderTarget(rtScene);renderer.render(scene,camera);
   const fog=scene.fog;scene.overrideMaterial=normalMat;scene.fog=null;renderer.setRenderTarget(rtNormal);renderer.setClearColor(0,1);renderer.clear();renderer.render(scene,camera);scene.overrideMaterial=null;scene.fog=fog;
   Object.assign(paint.uniforms,{});paint.uniforms.color.value=rtScene.texture;paint.uniforms.depth.value=rtScene.depthTexture;paint.uniforms.near.value=camera.near;paint.uniforms.far.value=camera.far;
   paint.uniforms.ao.value=settings.ao;paint.uniforms.aoRadius.value=settings.aoRadius;paint.uniforms.radius.value=settings.kuwahara;pass(paint,rtPaint);
   bright.uniforms.tex.value=rtPaint.texture;pass(bright,rtA);
   for(let i=0;i<3;i++){blur.uniforms.tex.value=rtA.texture;blur.uniforms.dir.value.set(1.6/rtA.width,0);pass(blur,rtB);blur.uniforms.tex.value=rtB.texture;blur.uniforms.dir.value.set(0,1.6/rtA.height);pass(blur,rtA);}
   blur.uniforms.tex.value=rtPaint.texture;blur.uniforms.dir.value.set(2/rtPaint.width,0);pass(blur,rtB);blur.uniforms.tex.value=rtB.texture;blur.uniforms.dir.value.set(0,2/rtPaint.height);pass(blur,rtC);
   const u=comp.uniforms;u.paint.value=rtPaint.texture;u.normal.value=rtNormal.texture;u.depth.value=rtScene.depthTexture;u.glow.value=rtA.texture;u.soft.value=rtC.texture;u.near.value=camera.near;u.far.value=camera.far;
   for(const k of['ink','halation','saturation','exposure','teal','warm','clarity','vignette'])u[k].value=settings[k];
   pass(comp,null);renderer.toneMapping=prevTM;}
  return{convertMaterials,buildEnvironment,render,setSize,settings};
 }
 root.AnimePaintLook={create,roleFor};
})(typeof window!=='undefined'?window:globalThis);
