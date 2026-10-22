"""Add an observable vault lane to accepted V3 without mutating any older build."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[1]
def main():
 base=ROOT/'SIGHTLINE_BACKSPOOL_THREADRAIL_V3.html'
 expected='66bbea3c3c0be5a09054676df6f1e8ddcabcf2ba197d7941846be148379ac124'
 if hashlib.sha256(base.read_bytes()).hexdigest()!=expected:raise SystemExit('Accepted V3 changed; preserve it before building the vault playground.')
 s=base.read_text();marker='loadCharacter().catch(err=>'
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
