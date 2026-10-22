(async()=>{
 while(!gameReady||characterState().busy)await new Promise(r=>setTimeout(r,80));
 gameActive=false;window.loop=()=>{};await new Promise(r=>setTimeout(r,100));await characterSwitcher.change('backspool');
 navigator.getGamepads=()=>[];clearPad();clearInput();gameActive=true;
 const c=backspoolCombat,m=window.backspoolActionManifest||window.backspoolMoveManifest,checks=[];
 const check=(name,pass,detail)=>checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});
 const ground=()=>{clearInput();clearPad();c.reset('TEST');courier.trauma=0;s.pos.set(0,.42,0);s.vel.set(0,0,0);s.mode=P.GROUND;s.onGround=true;s.yaw=0;c.tick(1/60,1/60);};
 const step=(n,pose=true)=>{for(let i=0;i<n;i++){c.tick(1/60,1/60);if(pose)updateCharacter(1/60,1/60,1/60);}};
 ground();check('Action manifest has exactly36attacks',m.moves.length===36,m.moves.length);
 check('Three states each own12authored attacks',['flow','impact','counter'].every(st=>(m.states[st].moves||[]).length===12));
 check('All moves have loaded cropped clips',m.moves.every(d=>clips[d.clipId]?.duration>0));
 check('All authored clips have normalized runtime duration',m.moves.every(d=>Math.abs(clips[d.clipId].duration-d.duration)<.002));
 check('Each state retains four verified source families',['flow','impact','counter'].every(st=>new Set(m.moves.filter(x=>x.state===st||x.id.startsWith(st+'-')).map(x=>x.sourceFamily)).size>=4));
 check('Each move owns explicit contact and transition markers',m.moves.every(d=>d.contact?.length&&d.contact.every(x=>x.time>=0&&x.time<=d.duration)&&d.chainAt>=d.contact.at(-1).time&&d.cancelAt>=d.contact.at(-1).time));
 for(const st of ['flow','impact','counter']){
  ground();c.applyStyle(st);mouse.l=true;c.tick(1/60,1/60);check(st+' starts immediately on RT/LMB press',c.state().action?.moveId===st+'-light-1');check(st+' reaction latency is at most one fixedstep',c.state().responseLatency<=1/60+1e-6);const id=c.state().action.id;
  step(90);check(st+' holding RT/LMB does not autochain',c.state().sequence===id&&!c.state().action);mouse.l=false;step(1);
  c.requestAttack();let a=c.state().action;while(c.state().action&&c.state().action.time<(m.moves.find(d=>d.id===a.moveId).comboOpen+.012))step(1);c.requestAttack();check(st+' follow-up enters one action-scoped continuation',!!c.state().action?.continuation);step(40);check(st+' continuation advances one graph edge',c.state().ledger!==null&&c.state().sequence===id+2); // initial, second seed, then chained strike
  ground();c.applyStyle(st);c.requestHeavy();check(st+' heavy is a distinct authored move',c.state().action?.moveId===st+'-heavy');
  ground();c.applyStyle(st);keys.w=true;c.requestHeavy();check(st+' forward heavy selects launcher',c.state().action?.moveId===st+'-launcher');keys.w=false;
 }
 ground();c.applyStyle('flow');c.requestAttack();check('Jump denied during committed startup',!c.canJump());const moveDef=m.moves.find(x=>x.id==='flow-light-1');step(Math.floor(moveDef.cancelAt*60)+2);mouse.r=true;step(1);check('Guard cancels only after final contact',!c.state().action&&c.state().phase==='guard');mouse.r=false;
 ground();c.requestAttack();c.receiveProjectile({});check('Unguarded hit interrupts action',!c.state().action&&c.staggered());check('Stagger blocks attacks,jumps,releases',!c.requestAttack()&&!c.canJump()&&!c.canAct('release'));
 ground();c.evade();step(3);check('Dodge invulnerability opens after40ms',c.invulnerable());step(12);check('Dodge invulnerability closes after220ms',!c.invulnerable());step(19);check('Dodge releases movement by550ms',!c.movementLocked());
 ground();c.requestAttack();c.applyStyle('impact');check('State switch queues during committed attack',c.state().style==='flow'&&c.state().statePending==='impact');step(60);check('State switch preserves action recovery before applying',c.state().style==='impact');
 ground();s.onGround=false;s.mode=P.AIR;c.requestAttack();check('Air attack owns airborne definition',c.state().action?.moveId==='impact-air-light');s.onGround=true;s.mode=P.GROUND;step(1);check('Ordinary landing closes airborne damage action',!c.state().action);
 ground();c.requestAttack();step(3);c.animate();check('Mixer combat action is evaluated manually once',currentAction.getEffectiveTimeScale()===0&&Math.abs(currentAction.time-c.state().action.time)<.002);check('Hitstop leaves global simulation at normal speed',c.timeScale()===1);
 c.reset('RESPAWN');check('Reset always clears free-roam attack and pending input',!c.state().action&&!c.state().pending&&!c.movementLocked());
 ground();c.spawnPractice();const t=c.practice[0];check('Practice placement commits allthreeactors',c.practice.length===3);const center=t.core.getWorldPosition(new THREE.Vector3());const event={pos:s.pos.toArray(),socketPositions:{rightHand:center.toArray()},previousSocketPositions:{rightHand:center.clone().add(new THREE.Vector3(.25,0,0)).toArray()},activeContacts:[{id:'test-contact',socket:'rightHand',radius:.3,time:.1,damage:12,push:0}]},attack={id:'contract-test',moveId:'flow-light-1',damage:12,hit:new Set()};const before=t.hp,first=c.resolveRecordedContacts(event,attack),second=c.resolveRecordedContacts(event,attack);check('Shared limb-contact path damages and deduplicates',first.length>=1&&second.length===0&&t.hp<before);check('Echo contact result includes target and outcome',first.some(x=>x.id===t.id&&x.result==='HIT'));
 c.clearPractice();ground();gameActive=false;
 return{checks,passed:checks.filter(x=>x.pass).length,total:checks.length,diagnostics:c.state()};
})()
