"""Add an observable vault lane to accepted V3 without mutating any older build."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
def main():
 base=ROOT/'SIGHTLINE_BACKSPOOL_THREADRAIL_V3.html'
 expected='66bbea3c3c0be5a09054676df6f1e8ddcabcf2ba197d7941846be148379ac124'
 if hashlib.sha256(base.read_bytes()).hexdigest()!=expected:raise SystemExit('Accepted V3 changed; preserve it before building the vault playground.')
 s=base.read_text()
 # Apply maintained wall sources to this candidate only; accepted V3 stays immutable.
 start=s.index('/* Authored Backspool traversal.')
 end=s.index("})(typeof window!=='undefined'?window:globalThis);",start)+len("})(typeof window!=='undefined'?window:globalThis);")
 core=(ROOT/'scripts/game_backspool_advanced.js').read_text().replace('if(!plan&&!f.grounded&&f.jumpHeld&&!f.reserveJump','if(!window.threadrailGame&&!plan&&!f.grounded&&f.jumpHeld&&!f.reserveJump')
 s=s[:start]+core.rstrip()+s[end:]
 start=s.index('const backspoolAdvancedRuntime=(()=>{');end=s.index('/* Candidate adapter:',start)
 runtime=(ROOT/'scripts/game_backspool_advanced_runtime.js').read_text().replace('function tether(){','function tether(){if(window.threadrailGame)return false;').replace('s.vel.set(0,0,0);s.onGround=false;setMode(P.AIR);consumeJump();window.backspoolHop','s.onGround=false;setMode(P.AIR);consumeJump();window.backspoolHop')
 s=s[:start]+runtime+'\n'+s[end:]
 # Wall poses are relative to wall contact, never the ordinary floor sole correction.
 marker="if(!enabled()||(!poseRole&&!window.backspoolAdvanced?.floating()&&localClock>=bodyContactUntil)||window.backspoolAdvancedState?.().kind==='ledge')return;"
 assert s.count(marker)==1
 s=s.replace(marker,marker+"if(['wall','wallApproach','wallBoost'].includes(window.backspoolAdvancedState?.().kind))return;")
 marker='loadCharacter().catch(err=>'
 assert s.count(marker)==1
 s=s.replace(marker,(ROOT/'scripts/game_backspool_vault_course.js').read_text()+'\n'+marker)
 marker='backspoolPowers.ui();backspoolEncounters.present();threadrailGame.present();'
 assert s.count(marker)==1
 s=s.replace(marker,marker+'backspoolVaultCourse.tick();')
 marker="for(const type of ['keydown','keyup'])window.addEventListener"
 assert s.count(marker)==1
 s=s.replace(marker,"window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat)window.backspoolVaultCourse?.noteJump();},true);\n"+marker)
 s=s.replace('<title>','<title>Automatic vault playground — ',1)
 target=ROOT/'SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html';target.write_text(s)
 out=ROOT/'output/vault-course';out.mkdir(parents=True,exist_ok=True)
 (out/'build.json').write_text(json.dumps({'file':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'base':base.name,'baseSha256':expected,'olderBuildsChanged':False},indent=2)+'\n')
 print(target)
if __name__=='__main__':main()
