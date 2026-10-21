#!/usr/bin/env python3
"""Archive bounded scalar transition findings from immutable cached Ghidra output."""
import hashlib,json,pathlib,struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
def build():
 addresses=['140a23250','140a26c50','140a240a0','140a26850','1409a2ca0','1405fbea0','1405fbeb0','1405fbec0','1405fbcf0','1405fdd10','140a54220','1412a3c20','1409e1570','140069b20','1409e1e00','1409e1590','1409a28d0']
 evidence=[]
 for a in addresses:
  p=ROOT/'output/rea-naruto/ghidra/full-export/main/functions'/a[:6]/(a+'.c')
  b=p.read_bytes(); evidence.append({'address':a,'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(b).hexdigest()})
 exe=pathlib.Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS/NSUNSC.exe').read_bytes()
 nt=struct.unpack_from('<I',exe,60)[0];opt=nt+24;section=opt+struct.unpack_from('<H',exe,nt+20)[0];base=struct.unpack_from('<Q',exe,opt+24)[0]
 def read(a,n):
  for i in range(struct.unpack_from('<H',exe,nt+6)[0]):
   vs,va,rs,rp=struct.unpack_from('<IIII',exe,section+i*40+8)
   if va<=a-base and a-base+n<=va+rs:return exe[rp+a-base-va:rp+a-base-va+n]
  raise ValueError('Unmapped source bytes')
 states=[]
 for st,thunk in [(0x87,0x1409e0a64),(0x88,0x1409e0a70),(0x89,0x1409e0a7c),(0x8a,0x1409e0a88),(0x8b,0x1409e0a94)]:
  raw=read(thunk,9)
  if raw[:5]!=bytes.fromhex('488b01ffa0'):raise ValueError('Unexpected dispatch thunk')
  slot=struct.unpack_from('<I',raw,5)[0]
  nameptr=struct.unpack('<Q',read(0x14204dc80+st*32+16,8))[0]
  name=read(nameptr,64).split(b'\0')[0].decode('ascii')
  # First generic vtable candidate, source bytes retained independently of class attribution.
  target=struct.unpack('<Q',read(0x141761f70+slot,8))[0]
  states.append(dict(state=st,name=name,tableRecord=hex(0x14204dc80+st*32),thunk=hex(thunk),thunkHex=raw.hex(),vtableOffset=slot,genericVtable=hex(0x141761f70),genericTarget=hex(target)))
 d=json.loads((ROOT/'assets/nsunsc-library/minato-action-dispatch.json').read_text())
 return {'schemaVersion':1,'id':'source:3mnt-conditional-transitions','verified':False,'completeGraph':False,'evidence':evidence,'runtime':'scripts/minato_transition_runtime.js','stateDispatch':states,'stateLifecycle':{'source':'1409e1e00','phases':{'0':'new state entry','1':'state update','2':'old state cleanup'},'clockInitialization':'State elapsed ticks initialize to -trunc(tickBase/configuredFps). State update runs before adding elapsed tick delta.'},'recoveredSlice':{'entryState':137,'entryAction':710,'attackEndState':138,'attackEndAction':740,'returnState':1,'characterId':109,'teamMode':False,'specialIndex':0,'scope':'Attack already hit-confirmed and placed; startup and cut-in deliberately excluded'},'sourceConstants':[{'address':'0x141b948e8','fileOffset':28915944,'bytes':'b80b0000','u32':3000,'scope':'Initial PE value; runtime writes not exhaustively audited'},{'address':'0x14176396c','fileOffset':24521068,'bytes':'0000f041','f32':30.0}],'nominalClock':{'tickBase':3000,'configuredFps':'runtime config byte +0x952; do not silently assume 30'},
 'predicates':[
 {'id':'animation-loop-bit','source':'1412a3c20 via 1405fdd10','expression':'(u16(animationObject + 0x70) & 1) != 0 prevents animationEnded'},
 {'id':'startup-return','source':'1409e1570','expression':'actor+0x10dbc == 0 requests state 7; otherwise invokes alternate state callback vtable+0xde8'},
 {'id':'animation-ended','source':'1409a2ca0','expression':'animation exists AND loop/block predicate == 0 AND actor+0x1274 == 0 AND endTick <= currentTick + trunc(trunc(tickBase/fps)*playbackRate)','clock':'Raw runtime ticks; no guessed seconds'},
 {'id':'start-next','source':'140a26c50','expression':'0x2c3 ended -> 0x2c4 if available; otherwise 0x2c5 if available; otherwise call 1409e1570. 0x2c5 ended -> call 1409e1570'},
 {'id':'attack-next','source':'140a240a0','expression':'elapsedConfiguredFrame >= durationConfiguredFrame minus one for lastPresentAttack; increment action ID; missing next action requests state 0x8a for non-team mode'},
 {'id':'attack-last','source':'140a240a0','expression':'Scan contiguous available actions [0x2c6,0x2e4); stop at first missing action'},
 {'id':'ending-return','source':'140a26850','expression':'0x2e4 absent -> action 0x4a and state request 1; present -> play 0x2e4; animation-ended -> state request 1'},
 {'id':'damage-command','source':'140a54220','expression':'Opcode 0x83 is consumed by damage dispatch, including target-dependent final-hit conditions. SPSKILL_END text alone is not an unconditional graph edge.'}],
 'pilotBindings':[{'action':r['action'],'timeline':r['timeline']} for r in d['rows']],
 'blockers':['Character109 factory branches recovered in minato-factory-attribution.json; source mode26 meaning and later per-instance mutations remain unaudited','Actor state-vtable mapping from cut-in to startup and hit-confirmed demo is not fully resolved','Minato target-dependent damage/lethal branch predicates and equipment state are incomplete','Source tick-base and configured FPS must be supplied from source runtime; do not invent fixed holds','Animation/command scheduling and complete cross-actor state orchestration are not recovered by scalar evaluator','Supplied original compilation sampled; exact build/audio identity and full comparison pending'],
 'scope':'Non-team generic special-1 scalar transitions; evaluator refuses team and actor 0xdb remapping. No complete cinematic playback certification.'}
if __name__=='__main__':
 p=ROOT/'assets/nsunsc-library/minato-transition-evidence.json';p.write_text(json.dumps(build(),indent=2)+'\n');print(p)
