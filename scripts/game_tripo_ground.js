/* Tripo generated albedo materials; existing world-space lighting and collision retained. */
const tripoGround=(()=>{
 const state={ready:false,loaded:[],errors:[],materials:0},textures={},loader=new THREE.TextureLoader();
 for(const kind of ['asphalt','sidewalk','plaza'])loader.load('assets/city/ground-tripo/'+kind+'.png',t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures[kind]=t;state.loaded.push(kind)},undefined,e=>state.errors.push(kind+': load failed'));
 function apply(mat,kind){if(mat.userData.tripoGround)return;cityVisualPolish.asphaltMaterial(mat);const prior=mat.onBeforeCompile;mat.onBeforeCompile=shader=>{prior(shader);shader.uniforms.tripoAlbedo={value:textures[kind]};shader.fragmentShader='uniform sampler2D tripoAlbedo;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 vec3 tripoSurface=texture2D(tripoAlbedo,vCityWorld.xz*.5).rgb;
 diffuseColor.rgb*=pow(tripoSurface,vec3(2.2));`);};mat.customProgramCacheKey=()=> 'tripo-ground-'+kind;mat.color.setScalar(kind==='asphalt'?.68:1);mat.roughness=kind==='asphalt'?.68:.87;mat.metalness=kind==='asphalt'?.08:.02;mat.userData.tripoGround=kind;mat.needsUpdate=true;state.materials++;}
 const timer=setInterval(()=>{if(state.errors.length){clearInterval(timer);return;}if(!window.roadNetworkState?.().ready||state.loaded.length!==3)return;apply(ground.material,'asphalt');apply(plaza.material,'plaza');scene.traverse(o=>{if(o.isMesh&&/Road \/|asphalt|sidewalk/i.test(o.name)){for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m&&m.userData.cityAsphaltPolish)apply(m,/sidewalk/i.test(o.name)?'sidewalk':'asphalt');}});state.ready=true;clearInterval(timer);},100);
 window.tripoGroundState=()=>JSON.parse(JSON.stringify(state));return{state:window.tripoGroundState};
})();
