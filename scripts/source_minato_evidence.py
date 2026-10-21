"""Build bounded original Minato evidence from immutable saved exports. No game execution."""
import gzip, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BUNDLE='c426d45069048ff1a4d4'
FUNCTIONS=['14097fa10','140981fc0','1409814e0','140980170','140982de0','1407816d0','140ac9870','140781830','1407819d0']
def build():
 base=ROOT/'assets/nsunsc-library'/BUNDLE
 scene=json.loads(gzip.decompress((base/'scene.json.gz').read_bytes()))
 index=json.loads((base/'index.json').read_text())
 evidence=[]
 for address in FUNCTIONS:
  path=ROOT/'output/rea-naruto/ghidra/full-export/main/functions'/address[:6]/(address+'.c')
  raw=path.read_bytes()
  evidence.append(dict(id='ghidra:'+address,address='0x'+address,path=str(path.relative_to(ROOT)),sha256=hashlib.sha256(raw).hexdigest(),kind='saved-static-pseudocode'))
 timelines=[]
 for a in scene['animations']:
  empty=[dict(name=e['name'],format=e['format']) for e in a['entries'] if not e['curves']]
  timelines.append(dict(name=a['name'],durationTicks=a['frameCount'],clockHz=3000,durationSeconds=a['duration'],loop=a['loop'],formats=sorted({e['format'] for e in a['entries']}),emptyEntries=empty,cameraEntries=[e['name'] for e in a['entries'] if e['format']==2]))
 states=[
 dict(state=0,guard='FUN_1407816d0(DAT_1421d74d0) != 0',operations=['Suspend/reset battle-side objects (2 sides x 3 actors)','Set fade via FUN_140781830','Save/disable external state at +0x84'],next=1),
 dict(state=1,guard='FUN_1407816d0(DAT_1421d74d0) != 0',operations=['FUN_140981fc0 selects and dispatches resource'],next=2),
 dict(state=2,guard='FUN_140ac9870() != 0',operations=[],next=3),
 dict(state=3,guard='unconditional',operations=['FUN_140982de0 initiates opposite fade with DAT_141b948e8 >> 2','Dispatch event 0x101c'],next=4),
 dict(state=4,guard='FUN_1407816d0(DAT_1421d74d0) != 0',operations=['Restore battle-side objects','Restore saved +0x84 state conditionally','Set fade via FUN_140781830','Release temporary state','Dispatch callback or battle flow branch'],next=5),
 dict(state=5,guard='FUN_1407816d0(DAT_1421d74d0) != 0',operations=['FUN_1405dd110 clears filter object','FUN_140902690'],next=6),
 dict(state=6,guard='local +0xe2c == 0',operations=['Check opponent virtual +0xc50 for ending flag','Set local +0xe2c = 1 when check succeeds'],next=None)]
 return dict(schemaVersion=1,id='original:3mntspl1',family='3mnt',bundle=BUNDLE,source=dict(path=index['path'],archive=index['archive'],sha256=index['sha256']),status='recovered',verified=False,executableOriginal=False,
 evidence=evidence,timelines=timelines,cameraProjection=dict(url='assets/nsunsc-library/minato-camera-evidence.json',lensConvention='horizontal field of view in degrees',verticalConversion='2*atan(tan(horizontalFov*pi/360)/viewportAspect)*180/pi',originalCompositionVerified=False),finisherWrapper=dict(url='assets/nsunsc-library/minato-finisher-wrapper.json',sourceAnimation='pre_spl_fin',storedDurationTicks=10000,clockHz=3000,loopFlag=1,originalDisplayDuration=None),
 sourceFacts=[
 dict(claim='This bundle contains no animation entry format 9. Format-9 warnings from broader extraction are not a Minato blocker.',kind='source-data',value=sum(e['format']==9 for a in scene['animations'] for e in a['entries'])),
 dict(claim='Attacker and damage timelines have equal stored duration; this does not alone prove runtime synchronization.',kind='source-data',attacker='3mntspl1_atk',reaction='3mntspl1_dmg',durationTicks=46000),
 dict(claim='The final image is bound to UI animation pre_spl_fin and coordinate dmy_fin; a static 2.5-second hold is authored.',kind='static-pseudocode',evidence=['ghidra:1409814e0']),
 dict(claim='Cut-in manager advances its UI animation only in states 1 through 4 using configured timing division.',kind='static-pseudocode',evidence=['ghidra:140980170'])],
 recoveredSubmachine=dict(name='ccPlayerCutInAnmManager',scope='Generic cut-in presentation; NOT the full Minato combat attack state machine',stateOffset='0xcf4',states=states,evidence=['ghidra:14097fa10'],predicates=dict(fadeComplete='FUN_1407816d0: *(int*)(*(longlong*)(fadeManager+0x50)+0x10) == 0',resourceComplete='FUN_140ac9870 returns resource +0x68 if present; otherwise short at +0x54 == -1; absent manager returns 1')),
 resourceSelection=dict(evidence=['ghidra:140981fc0'],defaultResourcePatterns=['%s_fin%.2d','%s_cut_%s','ADV_%s_cut_%s'],branchField='local selected entry at +0x820',branchValues={'0':'finisher index at +0x868','1':'opponent code suffix','2':'ADV actor/opponent code suffix'},overrides=['Explicit resource-name field at +0x430 when nonempty','Special context fields +0x908, +0xb00 or +0xc58'],unresolved=['Meanings and producers of selection/context fields','Which records/branches are reachable for 3mnt in this build']),
 blockers=[dict(component=c,status='unresolved',reason=r) for c,r in [
 ('sequence','Combat entry, successful-hit, miss, lethal and nonlethal triggers and phase transitions are not recovered. Generic cut-in submachine is insufficient.'),
 ('camera','Camera channels, exact coordinate-parent bindings and horizontal-FOV convention are recovered; final matrix composition, viewport cropping and interpolation remain unverified.'),
 ('finisher','Original pre_spl_fin wrapper is extracted, including camera, dmy_fin and companion UV/alpha tracks; runtime placement, exit triggers and selection-field producers remain unresolved. Fixed holds cannot be original.'),
 ('particles','Full source particle simulation and render state remain unreconstructed.'),
 ('materials','Original shader behavior and complete render state are not verified.'),
 ('audio','Original US/English waveform-bank mapping is recovered; gain, pitch, runtime clock adaptation and full mix remain unverified.'),
 ('reference','User-supplied compilation has sampled camera timing correspondence; exact build/audio identity and full-sequence fidelity remain unverified.')]],
 prohibitedFallbacks=['Suffix-based _s -> _atk -> _cut phase ordering','Authored 2.5-second final-image hold','Follow-camera substitution','Authored particle cadence or replacement foley in original mode'])
if __name__=='__main__':
 out=ROOT/'assets/nsunsc-library/minato-original-evidence.json'
 result=build();out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(dict(output=str(out),timelines=len(result['timelines']),sourceEvidence=len(result['evidence']),executableOriginal=False)))
