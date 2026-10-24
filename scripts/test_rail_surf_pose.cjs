const assert=require('node:assert/strict'),create=require('./game_rail_surf_pose.js'),m=create();
let s=m.update(1/60,{active:true,railId:'a',speed:5,yaw:0,lateral:0});assert.equal(s.phase,'catch');assert(s.compression>0);
for(let i=0;i<120;i++)s=m.update(1/60,{active:true,railId:'a',speed:25,yaw:0,lateral:1});assert.equal(s.phase,'crouch');assert(s.lean>0&&s.lean<=.16);assert(s.crouch>.8);
s=m.update(1/60,{active:true,railId:'a',speed:20,yaw:0,lateral:0,braking:true});assert.equal(s.phase,'brake');assert(s.offsets.spinePitch<0);
s=m.update(1/60,{active:true,railId:'b',speed:15,yaw:0,lateral:0});assert.equal(s.phase,'catch');s=m.update(1/60,{active:false});assert.equal(s.phase,'off');assert.equal(s.lean,0);
for(let i=0;i<10000;i++){s=m.update(1/60,{active:true,railId:'x',speed:28,yaw:i,lateral:100});assert(Math.abs(s.lean)<=.16);assert(Object.values(s.offsets).every(Number.isFinite));}
m.reset();assert.equal(m.state().active,false);console.log('PASS surf capture, crouch, balance, brake, transfer, exit and bounded long-run pose');
