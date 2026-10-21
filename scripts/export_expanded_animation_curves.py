"""Read-only source extraction of expanded roster's ordinary combat/movement families.
No meshes, effects, textures or special/awakening actions are exported into curves.
Curve validity is structural; integration must additionally inspect retargeted poses.
"""
import json,sys,math,hashlib
from pathlib import Path
from extract_naruto_animation_probe import decode,ROOT,OUT
sys.path.insert(0,str(OUT/'Blender-XFBIN-Importer/xfbin_lib'))
from xfbin import read_xfbin
members=json.loads((OUT.parent/'cpk-members.json').read_text())
provenance=[]; inventory=[]
labels={'3mnt':'Minato','2sik':'Shikamaru','2nej':'Neji','4ssi':'Shisui','2guy':'Might Guy'}
for code in labels:
 for suffix in ['', 'c', 'l']:
  path=f'data/spc/{code}bod1{suffix}.xfbin'; m=next(x for x in members if x['path']==path)
  target=OUT/Path(path).name
  if not target.exists():
   with (ROOT/m['archive']).open('rb') as f:f.seek(m['offset']);b=decode(f.read(m['stored_bytes']))
   assert len(b)==m['unpacked_bytes'] and b[:4]==b'NUCC';target.write_bytes(b)
  provenance.append(dict(m,decoded_sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
 rest=read_xfbin(str(OUT/f'{code}bod1.xfbin'))
 bones=[]
 for p in rest.pages:
  for c in p.chunks:
   if type(c).__name__=='NuccChunkCoord':
    n=c.node;bones.append(dict(name=n.name,parent=n.parent.name if n.parent else None,position_cm=n.position,rotation_degrees_zyx=n.rotation,scale=n.scale))
 clips=[]; rows=[]
 for suffix in ['c','l']:
  f=f'{code}bod1{suffix}.xfbin';x=read_xfbin(str(OUT/f))
  wanted=[code+s for s in (['grd0','dsf0','dsb0'] if suffix=='c' else ['cma00','cmb00','cmb01','cmb02','dsb0','dsf0'])]
  for p in x.pages:
   for c in p.chunks:
    if type(c).__name__!='NuccChunkAnm':continue
    rows.append(dict(name=c.name,duration_seconds=c.frame_count/3000,selected=c.name in wanted))
    if c.name not in wanted:continue
    tracks=[]
    for e in c.entries:
     if e.entry_format!=1:continue
     for curve in e.curves:
      if curve.data_path not in ['rotation_quaternion','rotation_euler','location','scale']:continue
      keys=[k for k in curve.keyframes if k.frame>=0]
      vals=[list(k.value) for k in keys];ts=[k.frame/3000 for k in keys]
      if not keys:continue
      assert all(math.isfinite(v) for val in vals for v in val)
      assert all(math.isfinite(t) for t in ts)
      assert all(a<=b for a,b in zip(ts,ts[1:])), (c.name,e.name)
      tracks.append(dict(bone=e.name,path=curve.data_path,times_seconds=ts,values=vals))
    assert tracks and c.frame_count>0
    role='air' if c.name.startswith(code+'cma') else 'ground' if c.name.startswith(code+'cmb') else 'guard' if c.name.endswith('grd0') else 'jump' if 'jmp' in c.name else 'landing' if c.name.endswith('lan0') else 'reaction' if 'dmg' in c.name else 'dodge'
    clips.append(dict(name=c.name,combatRole=role,source=f,raw_frame_count=c.frame_count,frame_size=c.frame_size,duration_seconds=c.frame_count/3000,loop=c.loop_flag,tracks=tracks))
 data=dict(schema='nucc-animation-probe-v1',character=code,character_code=code,character_label=labels[code],provenance='Local user-selected Storm Connections archives; not published',semantics={'fps':'30, per upstream importer policy; static source only','raw_frame_to_seconds':'raw / 100 / 30','position':'centimeters, local bone values','rest_rotation':'Euler degrees, intrinsic ZYX per upstream rot_to_blender','quaternion':'raw x,y,z,w; upstream importer conjugates before applying rest inverse','retarget_status':'not retargeted; own source skeleton/axes differ from Backspool Mixamo','selection':'ordinary combo/movement families; exact move identity requires visual review'},bones=bones,clips=clips)
 (OUT/f'selected-curves-{code}.json').write_text(json.dumps(data,separators=(',',':')))
 inventory.append(dict(code=code,bones=len(bones),clips=[dict(name=c['name'],duration=c['duration_seconds'],tracks=len(c['tracks'])) for c in clips],inventory=rows))
(OUT/'expanded-extraction-provenance.json').write_text(json.dumps(provenance,indent=2))
(OUT/'expanded-animation-inventory.json').write_text(json.dumps(inventory,indent=2))
print(json.dumps([dict(code=i['code'],bones=i['bones'],clips=len(i['clips'])) for i in inventory],indent=2))
