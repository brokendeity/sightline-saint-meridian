/* Pure-logic check of scripts/game_loadout_cape_cloth.js on a synthetic single-chain rig (no browser):
   - at rest the chain stays where the rigid cape would be;
   - pulled along at running speed it trails back by roughly what linear air drag predicts;
   - every frame keeps the chain at its true length and produces finite numbers;
   - a body collider in the way keeps the chain outside it. */
global.window=global;global.THREE=require(require('path').resolve(__dirname,'../../vendor/three-r128.js'));
require(require('path').resolve(__dirname,'../../game_loadout_cape_cloth.js'));
const assert=require('assert/strict');
function rig(withCollider){
 const root=new THREE.Group(),spine=new THREE.Bone();spine.name='Spine2';root.add(spine);spine.position.set(0,1.4,0);
 const hips=new THREE.Bone();hips.name='Hips';root.add(hips);hips.position.set(0,0.9,0);
 let prev=spine;const names=[];
 for(let r=0;r<5;r++){const b=new THREE.Bone();b.name='C0_'+r;b.position.set(0,r?-0.2:0,r?0:(withCollider?-0.05:-0.1));prev.add(b);prev=b;names.push(b.name);}
 const colliders=withCollider?[{from:'Hips',to:'Spine2',radiusOfHeight:0.08/1.82}]:[];
 return{root,cloth:LoadoutCapeCloth.create(root,{rows:5,chains:[names],colliders,rootParent:'Spine2'},{height:1.82,backstopAxis:['Hips','Spine2']})};
}
const hem=c=>{const h=c.hem()[0];return{back:h.t[2]-h.p[2],down:h.t[1]-h.p[1]};};
{
 const{root,cloth}=rig(false);
 for(let i=0;i<120;i++)cloth.update(1/60);
 const still=hem(cloth);assert(Math.abs(still.back)<0.01&&Math.abs(still.down)<0.01,'At rest the chain hangs where the rigid cape is: '+JSON.stringify(still));
 for(let i=0;i<180;i++){root.position.z+=4.2/60;root.updateMatrixWorld(true);cloth.update(1/60);}
 const run=hem(cloth),s=cloth.state();
 // Linear drag k=2.4/s at 4.2 m/s on a 0.8 m chain: tan(theta)=k*v/g -> theta ~46 deg -> hem ~0.58 m back.
 assert(run.back>0.35&&run.back<0.8,'Running at 4.2 m/s the hem trails back about as drag predicts: '+run.back.toFixed(3));
 assert(!s.nan&&s.maxStretch<1.02,'Finite and at true length: '+JSON.stringify({nan:s.nan,stretch:s.maxStretch}));
 for(let i=0;i<240;i++)cloth.update(1/60);
 const settled=hem(cloth);assert(Math.abs(settled.back)<0.03,'After stopping it settles back: '+settled.back.toFixed(3));
}
{
 // A collider straight below the collar, 5 cm out from its axis with an 8 cm radius: hanging straight down would be inside it.
 const{root,cloth}=rig(true);
 for(let i=0;i<240;i++)cloth.update(1/60);
 const s=cloth.state(),h=cloth.hem()[0];assert(s.penetration<0.002,'The chain stays outside the body collider: '+s.penetration);
 assert(Math.hypot(h.p[0],h.p[2])>0.079,'The hem was pushed out to the collider surface: '+Math.hypot(h.p[0],h.p[2]).toFixed(3));
}
console.log('PASS cape chain unit: rest, drag trail, true length, settle, collider');
