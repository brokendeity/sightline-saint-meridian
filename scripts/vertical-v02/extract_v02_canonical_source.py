"""One-time extraction of the canonical V02 source (src/v02/) from the latest patch-chain build.

Reads SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_FRAMING.html (read-only) and writes:
  src/v02/page.html            the page markup, with every inline <script>/<style> body replaced by an include marker
  src/v02/boot/, styles/       the small inline scripts and the stylesheets
  src/v02/engine/NNN-*.js      the engine block, split at its own section boundaries
  src/v02/engine.json          the engine's include order: engine files, scripts/ modules, whitespace text
  src/v02/ENGINE_MAP.md        where each part of the engine lives, and which scripts/ modules have drifted
Modules the build inlined unchanged are NOT copied: engine.json includes them from scripts/ directly. Three.js and the
GLTF loader come from scripts/vendor/ unchanged; fflate and the FBX loader come from scripts/vendor/ minus the one-line
"Extracted verbatim" header those copies carry. Then scripts/build_v02.py --check must rebuild the reference exactly.
Refuses to run if src/v02 already exists.
"""
from pathlib import Path
import bisect,hashlib,json,re,subprocess,sys
R=Path(__file__).resolve().parents[2];REF='SIGHTLINE_SAINT_MERIDIAN_V02_SIGHTLINE_FRAMING.html';SRC=R/'src/v02'
assert not SRC.exists(),'src/v02 already exists'
html=(R/REF).read_bytes().decode('utf-8')
# ---- inline blocks, scanned in document order
blocks=[];pos=0;OPEN=re.compile(r'<(script|style)([^>]*)>')
while True:
 m=OPEN.search(html,pos)
 if not m:break
 end=html.index('</'+m.group(1)+'>',m.end())
 if 'src=' not in m.group(2):blocks.append((m.end(),end))
 pos=end
assert len(blocks)==11,len(blocks)
body=[html[a:b] for a,b in blocks]
vendor=lambda name,note=False:('file:scripts/vendor/'+name+('|drop-extract-note' if note else ''))
spec=[('boot/capture.js',None),('styles/game.css',None),(None,vendor('three-r128.js')),(None,vendor('fflate-r128.js',True)),(None,vendor('FBXLoader-r128.js',True)),
 ('styles/touch.css',None),(None,vendor('GLTFLoader-r128.js')),('boot/three-load-error.js',None),('ENGINE',None),('boot/tripo-ground-materials.js',None),('boot/vertical-ready.js',None)]
files={};markers=[]
for (name,inc),text in zip(spec,body):
 if name=='ENGINE':markers.append('list:src/v02/engine.json')
 elif name:files['src/v02/'+name]=text;markers.append('file:src/v02/'+name)
 else:markers.append(inc)
template=[];pos=0
for (a,b),mk in zip(blocks,markers):template.append(html[pos:a]+'@@include '+mk+'@@');pos=b
template.append(html[pos:]);files['src/v02/page.html']=''.join(template)
# ---- engine segmentation
core=body[8];L=core.split('\n');starts=[0];p=0
for l in L:p+=len(l)+1;starts.append(p)
line_of=lambda i:bisect.bisect_right(starts,i)-1
segs=[]
for f in sorted((R/'scripts').glob('*.js')):
 c=f.read_bytes().decode('utf-8')
 if len(c)>200 and core.count(c)==1:a=core.index(c);segs.append((a,a+len(c),'verbatim','scripts/'+f.name))
drift=[]
for f in sorted((R/'scripts').glob('*.js')):
 c=f.read_bytes().decode('utf-8').rstrip('\n')
 if len(c)>400 and c not in core and core.count(c[:300])==1:
  a=core.index(c[:300]);b=core.find(c[-200:],a)
  # Only copies that start a line at column 0 are split out; an indented copy sits inside another function.
  exact=b>=0 and core.count(c[-200:])==1 and (a==0 or core[a-1]=='\n') and c[:1] not in ' \t'
  drift.append({'module':'scripts/'+f.name,'startLine':line_of(a),'extracted':exact})
  if exact:segs.append((a,b+200,'live','scripts/'+f.name))
segs.sort()
for x,y in zip(segs,segs[1:]):assert x[1]<=y[0],('overlap',x,y)
NAMES={0:'setup-renderer-assets',129:'deterministic-city',445:'city-visual-polish',641:'building-destruction',767:'enemies-mission',796:'character-animation',
 814:'player-state',821:'input-mapping',867:'input-actions',875:'flight-vfx',918:'velocity-perception-collision',1160:'sightline-flight-actions',1300:'keyboard-mouse-input',
 1340:'rail-read',1455:'game-lifecycle-gamepad',1513:'animation-director',2115:'backspool-traversal-runtime',2187:'backspool-posture-runtime',2632:'threadrail-module',
 3402:'backspool-equipment-adapter-note',3542:'threadrail-game',3719:'vertical-city',3743:'vertical-district',3776:'frame-loop-player-camera-hud',3866:'hud-presentation',
 3900:'runtime-polish-collision',4031:'city-import',4034:'halo-trucks',4089:'halo-trucks-disabled',4092:'character-switcher',4209:'biped-evidence-url',
 4263:'source-evidence-url',4331:'hero-switch-input',4343:'combatants',4362:'action-camera',4550:'action-world',4703:'startup'}
cuts=sorted(starts[n] for n in NAMES if n)
pieces=[];pos=0
for a,b,kind,name in segs+[(len(core),len(core),'end','')]:
 g=pos
 for c in cuts:
  if g<c<a:pieces.append((g,c,'engine',None));g=c
 if g<a:pieces.append((g,a,'engine',None))
 if kind!='end':pieces.append((a,b,kind,name))
 pos=b
assert ''.join(core[a:b] for a,b,_,_ in pieces)==core
order=[];n=0;engine_map=[]
FUNC=re.compile(r'^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\(\(\)\s*=>',re.M)
for a,b,kind,name in pieces:
 text=core[a:b]
 if kind=='verbatim':order.append({'file':name});engine_map.append((line_of(a),name,len(text),'unchanged module, included from scripts/'));continue
 if not text.strip():order.append({'text':text});continue
 n+=10
 if kind=='live':path=f"src/v02/engine/{n:03d}-{Path(name).stem}.live.js";note='live copy; differs from '+name
 else:
  ln=line_of(a);label=NAMES.get(ln)
  if label is None:label=max(((s0,k) for s0,k in NAMES.items() if s0<=ln),default=(0,'part'))[1]+'-cont'
  path=f"src/v02/engine/{n:03d}-{label}.js";note=''
 files[path]=text;order.append({'file':path})
 defs=[x or y for x,y in FUNC.findall(text)][:10]
 engine_map.append((line_of(a),path,len(text),'; '.join(x for x in (note,('defines '+', '.join(defs)) if defs else '') if x)))
files['src/v02/engine.json']=json.dumps(order,indent=1)+'\n'
# ---- map
md=['# V02 engine map','','Generated by `scripts/vertical-v02/extract_v02_canonical_source.py` from `'+REF+'` (SHA256 `'+hashlib.sha256((R/REF).read_bytes()).hexdigest()+'`).',
 'The engine is one inline `<script>`; `src/v02/engine.json` lists its parts in order. "Line" is the first line of the part inside that script.','',
 '| Line | Source | Size | Notes |','|---|---|---|---|']
md+=[f"| {ln} | `{p}` | {sz:,} | {note} |" for ln,p,sz,note in engine_map]
md+=['','## scripts/ modules whose inlined copy has drifted','',
 'The game runs the inlined (live) copy. The file in `scripts/` is different, so editing it alone does not change the game, and plain-node tests that load it',
 'test the file, not the live code. Reconcile each one before relying on the file.','','| Module | Live copy | Starts at engine line |','|---|---|---|']
for d in drift:
 live=next((p for p in files if p.endswith('-'+Path(d['module']).stem+'.live.js')),None)
 home=next((p for ln,p,sz,nt in reversed(engine_map) if ln<=d['startLine'] and p.startswith('src/')),None)
 md.append(f"| `{d['module']}` | {('`'+live+'`') if live else ('inside `'+home+'` (not cleanly separable)')} | {d['startLine']} |")
files['src/v02/ENGINE_MAP.md']='\n'.join(md)+'\n'
for path,text in files.items():
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(text.encode('utf-8'))
print(len(files),'files written;',sum(1 for o in order if 'file' in o),'engine includes;',len(drift),'drifted modules')
r=subprocess.run([sys.executable,str(R/'scripts/build_v02.py'),'--check',REF],cwd=R,capture_output=True,text=True);print(r.stdout.strip(),r.stderr.strip())
sys.exit(r.returncode)
