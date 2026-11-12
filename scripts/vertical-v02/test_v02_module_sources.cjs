/* Drift guard for the V02 canonical source. Plain node; reads only, writes nothing.
 *
 * Background: development/vertical-city-v02/V02_MODULE_DRIFT.md. Old patchers inlined scripts/ modules into the game and
 * then patched the inlined copy, so a scripts/ file could silently stop being the code the game runs. The reconciliation
 * moves each live copy, byte for byte, into scripts/<module>_v02.js and leaves scripts/<module>.js as a frozen ancestor.
 *
 * Checks:
 *  1. Every scripts/ file that src/v02/engine.json includes is included exactly once.
 *  2. Each reconciled module's _v02 file is included, and its frozen ancestor is not. An ABSORBED module has no _v02 file
 *     of its own: its live code is part of its host module's _v02 file.
 *  3. The 27 frozen ancestors (the 26 drifted modules plus game_halo_trucks) still have their recorded SHA256 (hash-pinned by older evidence; never edit them).
 *  4. No scripts/*.js file that engine.json does not include has its code sitting inside a src/v02/engine/ part
 *     (160-character windows), except the modules listed in PENDING (empty since batch 5). Each PENDING entry must still be
 *     drifted, so a stale entry fails: remove it when its batch lands.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFileSync(path.join(R,p),'utf8');

// Frozen pre-V02 ancestors (scripts/<module>.js). Hashes as of 2026-11-05; see V02_MODULE_DRIFT.md "Per-module findings".
const ANCESTORS={
 'browser_building_import':'e6a191c5d8b973a67ecdb9264f9eb57db1534e6753606ea4a1a76b32eefca514',
 'game_action_character_loader':'90ab1abf1786291111643bbbf9a6d3dff619a7b491dcc0a078b743169bd7999b',
 'game_action_foundation':'b470e2d2a2eab5afb1bb8b3c5c50103fee354c810127af4c70411ff5b205498d',
 'game_action_world':'c2fffa94894444fe8add1f3ebefcc587c2fe31a7cb8fa71fbfa3b262fc68cb8b',
 'game_afterstep_drive':'6988ed3d5f2216ec6099a937dbdeec99c2036684272a2b5fc1a82841003a2413',
 'game_backspool_advanced':'d9020be5c5a1212dd4ed490ae5845dbf23e57dbeebd1a33acd137a861ad4044d',
 'game_backspool_advanced_runtime':'7066c5e7a71655a72b4b580041eb893322ffe882f3776249076aded1dfa88be2',
 'game_backspool_combat':'e57deebbab673a5cd36c2d3ff96417fd8875571f6e0b70d701ebfd0b16405835',
 'game_backspool_encounters':'d3ddee96a3edc02e8a246ea21b3938937ba59de67fb037a7d17cf529e32907a9',
 'game_backspool_flow':'20d45471ce068f84d950641a966cf84ef5e0c67a9888a259ca0330ec3159632d',
 'game_backspool_flow_runtime':'b9a0dd3790ddc73bb1576dce47c48ec8b68da15bf4ccf664a7a80aef33cf9fc1',
 'game_backspool_powers':'36052295e98fc85c687e866e3d371a9de30c2267866708f5685eb8fd36a6ac05',
 'game_backspool_vault_course':'a3ead006864c1d4f4b2dfa4c6c9259a397cf4adbb6f0e7ca3c726d8cd4992c29',
 'game_halo_transport':'9102235b41d547f5cf021daf14e49f5a5b79f96b40fc667cc785e8777879ce4a',
 'game_road_infrastructure':'1d724d8fff6b558bfaa35fc12e705bee64736abbb6d4bd53d4349d6a176ed2b0',
 'game_runtime_polish':'c7c5d43108cea45bdba8e398dbeab779e34d07162a9de9def69eb2dfa4005b28',
 'game_threadrail':'606647a3b078f47c750541f6ebab2c6fe03ff7fff2c25c1e5267fa5fdcec2eb6',
 'game_vertical_city':'ca046d01e47407f4da8c304fa2ef44d2d0927d605526fd43978b1a3dff65d68b',
 'game_visual_upgrade':'6d93956a831afd5cd86ecd28cd86c16f394b641e2b182509a3de1568cae6eafd',
 'gameplay_upgrade':'9d874a26a2da3957d0b00a61dcaa19a7c18eff788b62e8101944079e9861506b',
 // Older predecessor of game_halo_transport (2026-10-21); its live descendant is game_halo_transport_v02.js.
 'game_halo_trucks':'30eff83aea0f3f5a405c91a321e69538d3ac64f813e9a0f03cb42e24056c147d',
 // Batch 5: the six modules the extractor missed.
 'game_backspool_traversal_runtime':'091254495aea13f5f16ef177b479bc634901b90ae6e3addb863b3c472c9b46fb',
 'game_backspool_posture_runtime':'2a8559fbb4e533c72137bf5c6d69fc00bc913242a132342af60c3a1b6bfaa8f3',
 'game_backspool_threadrail_runtime':'145da33582cfedd4ddab7cb58667d7a34b0d0eb51cf1e2ea8767b493ef6f9bdb',
 'game_vertical_district_v02':'939bc35598b524bd1a29bc58e575eb3d490131fbc38046be3b690b43803c69f9',
 'game_presentation_upgrade':'1918a25ed8ad3327ccfe28abc2e6e0223c05055c7294d711816a60f41853864c',
 'game_backspool_switch':'2494b4884a94258c02a355ce052316c03c7ea0be1640b4c74e362b293ffec118'
};
// Reconciled: the live copy is scripts/<module>_v02.js (batches 1-5, 2026-11-06).
const RECONCILED=['game_afterstep_drive','game_backspool_advanced','game_backspool_flow','game_threadrail',
 'browser_building_import','gameplay_upgrade','game_backspool_advanced_runtime','game_backspool_flow_runtime','game_road_infrastructure',
 'game_backspool_combat','game_backspool_powers','game_backspool_encounters','game_backspool_vault_course',
 'game_vertical_city','game_runtime_polish','game_action_world','game_halo_transport','game_action_foundation',
 'game_visual_upgrade',
 'game_backspool_traversal_runtime','game_backspool_posture_runtime','game_backspool_threadrail_runtime','game_vertical_district_v02',
 'game_presentation_upgrade','game_backspool_switch'];
// Absorbed: the live code is part of another module's _v02 file. The character loader is a function body inside the
// characterSwitcher IIFE, so batch 5 merged it into game_backspool_switch_v02.js.
const ABSORBED={'game_action_character_loader':'game_backspool_switch'};
// Still drifted: live code inside a src/v02/engine/ part. Empty since batch 5; anything new here is a regression.
const PENDING=[];

let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS',name);};
const order=JSON.parse(read('src/v02/engine.json'));
const included=order.filter(e=>e.file&&e.file.startsWith('scripts/')).map(e=>e.file);

check('every included scripts/ module is included exactly once',()=>{
 const seen=new Map();for(const f of included)seen.set(f,(seen.get(f)||0)+1);
 const twice=[...seen].filter(([,n])=>n>1).map(([f])=>f);assert.deepEqual(twice,[],'included more than once: '+twice.join(', '));
 for(const f of included)assert(fs.existsSync(path.join(R,f)),'missing included file '+f);
});
check('reconciled modules include their _v02 file, never the frozen ancestor',()=>{
 for(const m of RECONCILED){
  assert(included.includes('scripts/'+m+'_v02.js'),m+'_v02.js is not in engine.json');
  assert(!included.includes('scripts/'+m+'.js'),'frozen ancestor '+m+'.js is included');
  assert(!fs.readdirSync(path.join(R,'src/v02/engine')).some(f=>f.endsWith('-'+m+'.live.js')),'a src/v02 live copy of '+m+' still exists');
 }
 for(const [m,host] of Object.entries(ABSORBED)){
  assert(RECONCILED.includes(host),m+' is absorbed into '+host+', which is not reconciled');
  assert(!fs.existsSync(path.join(R,'scripts',m+'_v02.js')),m+'_v02.js exists although '+m+' is absorbed into '+host+'_v02.js');
  assert(!included.includes('scripts/'+m+'.js'),'frozen ancestor '+m+'.js is included');
 }
 const unaccounted=Object.keys(ANCESTORS).filter(m=>m!=='game_halo_trucks'&&!RECONCILED.includes(m)&&!ABSORBED[m]);
 assert.deepEqual(unaccounted,[],'frozen ancestors with no live module recorded: '+unaccounted.join(', '));
});
check('the 27 frozen ancestors are unchanged',()=>{
 const changed=Object.entries(ANCESTORS).filter(([m,h])=>sha(fs.readFileSync(path.join(R,'scripts',m+'.js')))!==h).map(([m])=>m);
 assert.deepEqual(changed,[],'frozen ancestor edited (hash-pinned by older evidence): '+changed.join(', '));
});
check('no unlisted scripts/ module has drifted into an engine part',()=>{
 const engineOwn=order.filter(e=>e.file&&e.file.startsWith('src/v02/engine/')).map(e=>read(e.file)).join('\n');
 const drifted=[];
 for(const name of fs.readdirSync(path.join(R,'scripts')).filter(f=>f.endsWith('.js')).sort()){
  if(included.includes('scripts/'+name))continue;
  const text=read('scripts/'+name);if(text.length<600)continue;
  const step=Math.max(160,Math.floor(text.length/25));let hits=0;
  for(let i=0;i+160<=text.length;i+=step){const w=text.slice(i,i+160);if(w.trim()&&engineOwn.includes(w))hits++;}
  if(hits>=2)drifted.push(name.replace(/\.js$/,''));
 }
 const unexpected=drifted.filter(m=>!PENDING.includes(m)),stale=PENDING.filter(m=>!drifted.includes(m));
 assert.deepEqual(unexpected,[],'scripts/ modules whose code now lives inside src/v02/engine/ (reconcile them or list them): '+unexpected.join(', '));
 assert.deepEqual(stale,[],'PENDING entries that are no longer drifted (remove them): '+stale.join(', '));
});
console.log(passed+' V02 module source checks passed');
