"""Local, bounded ordinary-animation extraction for the action-v2 candidate.
Does not modify active game data; outputs candidate curves/evidence only.
"""
import json, sys, math, hashlib, re
from pathlib import Path
from extract_naruto_animation_probe import decode, ROOT, OUT
sys.path.insert(0,str(OUT/'Blender-XFBIN-Importer/xfbin_lib'))
from xfbin import read_xfbin
DEST=OUT/'action-v2'; DEST.mkdir(exist_ok=True)
LABELS={'2kks':'Kakashi','2ssk':'Sasuke','2skr':'Sakura','2tnd':'Tsunade','2hnt':'Hinata','2itc':'Itachi'}
members=json.loads((OUT.parent/'cpk-members.json').read_text())
provenance=[]; inventory=[]; identities=[]
for code,label in LABELS.items():
 files={}
 for suffix in ('','c','l'):
  path=f'data/spc/{code}bod1{suffix}.xfbin';m=next(x for x in members if x['path']==path)
  p=DEST/Path(path).name
  if not p.exists():
   with (ROOT/m['archive']).open('rb') as f:f.seek(m['offset']);raw=f.read(m['stored_bytes'])
   data=decode(raw);assert len(data)==m['unpacked_bytes'] and data[:4]==b'NUCC';p.write_bytes(data)
  else:
   with (ROOT/m['archive']).open('rb') as f:f.seek(m['offset']);raw=f.read(m['stored_bytes'])
  files[suffix]=p
  provenance.append(dict(m,stored_sha256=hashlib.sha256(raw).hexdigest(),decoded_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),archive_size=(ROOT/m['archive']).stat().st_size))
 rest=read_xfbin(str(files['']));bones=[]
 for p in rest.pages:
  for c in p.chunks:
   if type(c).__name__=='NuccChunkCoord':
    n=c.node;bones.append(dict(name=n.name,parent=n.parent.name if n.parent else None,position_cm=n.position,rotation_degrees_zyx=n.rotation,scale=n.scale))
 names=[b['name'] for b in bones];paths=sorted({p.decode('utf8','replace') for p in re.findall(rb'[cC][\\/][^\x00\r\n]{5,120}\.(?:max|nut)',files[''].read_bytes())})
 identities.append(dict(code=code,label=label,identityEvidence='archive member + internal source path + matching body skeleton/animation prefix',internal_source_paths=paths,bone_prefix_candidates=[n[:-7] for n in names if n.endswith(' pelvis')],accessory_bones=[n for n in names if any(v in n.lower() for v in ['sword','kunai','weapon','shuriken','katana'])]))
 clips=[];rows=[]
 for suffix in ('c','l'):
  source=read_xfbin(str(files[suffix]))
  for p in source.pages:
   for c in p.chunks:
    if type(c).__name__!='NuccChunkAnm':continue
    ordinary=bool(re.fullmatch(code+r'(cmb\d+|cma\d+|grd\d+|ds[fb lr]\d+|dmg\d+|stn\d+|idl\d+|wlk\d+|run\d+)',c.name))
    rows.append(dict(name=c.name,duration=c.frame_count/3000,ordinary=ordinary))
    if not ordinary:continue
    tracks=[];unsupported=[]
    for e in c.entries:
     if e.entry_format!=1:unsupported.append(dict(name=e.name,format=e.entry_format));continue
     for curve in e.curves:
      if curve.data_path not in ('rotation_quaternion','rotation_euler','location','scale'):continue
      keys=[k for k in curve.keyframes if k.frame>=0]
      if not keys:continue
      vals=[list(k.value) for k in keys];ts=[k.frame/3000 for k in keys]
      assert all(math.isfinite(v) for val in vals for v in val)
      assert all(a<=b for a,b in zip(ts,ts[1:]))
      tracks.append(dict(bone=e.name,path=curve.data_path,times_seconds=ts,values=vals))
    if not tracks:continue
    role='air' if 'cma' in c.name else 'ground' if 'cmb' in c.name else 'guard' if 'grd' in c.name else 'dodge' if 'ds' in c.name else 'reaction' if 'dmg' in c.name else 'stance'
    clips.append(dict(name=c.name,combatRole=role,source=files[suffix].name,raw_frame_count=c.frame_count,frame_size=c.frame_size,duration_seconds=c.frame_count/3000,loop=c.loop_flag,tracks=tracks,unsupported_entries=unsupported))
 data=dict(schema='nucc-animation-probe-v1',character=code,character_code=code,character_label=label,provenance='local user-supplied source; candidate only',bones=bones,clips=clips)
 (DEST/f'curves-{code}.json').write_text(json.dumps(data,separators=(',',':')))
 inventory.append(dict(code=code,label=label,bones=len(bones),clips=[dict(name=c['name'],role=c['combatRole'],duration=c['duration_seconds']) for c in clips],all_animations=rows))
 print(code,len(bones),len(clips),flush=True)
(DEST/'source-provenance.json').write_text(json.dumps(provenance,indent=2))
(DEST/'source-identities.json').write_text(json.dumps(identities,indent=2))
(DEST/'source-inventory.json').write_text(json.dumps(inventory,indent=2))
