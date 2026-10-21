"""Export bounded decoded NUCC curves/rest local transforms, using reviewed upstream parser."""
import json,sys,math,subprocess
from pathlib import Path
OUT=Path(__file__).resolve().parents[1]/'output/rea-naruto/animation-pass'
sys.path.insert(0,str(OUT/'Blender-XFBIN-Importer/xfbin_lib'))
from xfbin import read_xfbin
selected={'1nrtbod1c':['1nrtjmp0','1nrtjmp1','1nrtlan0','1nrtgrd0'],'1nrtbod1l':['1nrtcma00','1nrtcmb00','1nrtcmb01','1nrtcmb02']}
rest=read_xfbin(str(OUT/'1nrtbod1.xfbin'))
bones=[]
for p in rest.pages:
 for c in p.chunks:
  if type(c).__name__=='NuccChunkCoord':
   n=c.node;bones.append(dict(name=n.name,parent=n.parent.name if n.parent else None,position_cm=n.position,rotation_degrees_zyx=n.rotation,scale=n.scale))
clips=[]
for f,names in selected.items():
 x=read_xfbin(str(OUT/(f+'.xfbin')))
 for p in x.pages:
  for c in p.chunks:
   if type(c).__name__!='NuccChunkAnm' or c.name not in names:continue
   tracks=[]
   for e in c.entries:
    if e.entry_format!=1:continue
    for curve in e.curves:
     if curve.data_path not in ['rotation_quaternion','rotation_euler','location','scale']:continue
     vals=[list(k.value) for k in curve.keyframes];assert all(math.isfinite(v) for val in vals for v in val)
     tracks.append(dict(bone=e.name,path=curve.data_path,times_seconds=[k.frame/3000 for k in curve.keyframes],values=vals))
   clips.append(dict(name=c.name,source=f+'.xfbin',raw_frame_count=c.frame_count,frame_size=c.frame_size,duration_seconds=c.frame_count/3000,loop=c.loop_flag,tracks=tracks))
data=dict(schema='nucc-animation-probe-v1',provenance='Local user-selected Storm Connections archives; not published',semantics={'fps':'30, per upstream importer policy; static source only','raw_frame_to_seconds':'raw / 100 / 30','position':'centimeters, local bone values','rest_rotation':'Euler degrees, intrinsic ZYX per upstream rot_to_blender','quaternion':'raw x,y,z,w; upstream importer conjugates before applying rest inverse','retarget_status':'not retargeted; source skeleton/axes differ from Backspool Mixamo'},bones=bones,clips=clips)
(OUT/'selected-curves.json').write_text(json.dumps(data,separators=(',',':')))
print(json.dumps({'bones':len(bones),'clips':[(c['name'],c['duration_seconds'],len(c['tracks'])) for c in clips],'output':str(OUT/'selected-curves.json')},indent=2))
