"""Forspoken-only traversal role admission. Role mappings are authored, not recovered state names."""
import json,gzip,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
selections={'idle':('28118863',0),'jump':('28113cdc',.1),'fall':('28113cde',.3),'land':('28113d03',0),'dash':('28113d00',.15),'airDash':('28113ce2',.3),'roll':('281116cb',0),'treeFlip':('28119ec7',0),'scale':('28119e99',0),'wallClimb':('28119eec',0),'wallRun':('281103f8',0),'ledge':('28119eee',0),'mantle':('2811b68d',.1),'wallBoost':('28113cde',0),'tether':('2811b4c0',.1),'tetherAim':('2811db90',.1),'zipLaunch':('281116bd',.15),'skip':('2811b4c2',0),'teleport':('2811b4c3',0),'slide':('28119310',0),'backstep':('2811ec56',.1),'charge':('2811db90',.1),'chargeMove':('28113d00',.15),'chargeAir':('2811e752',.1)}
roles=[]
for role,(id,start) in selections.items():
 p=root/'assets/backspool/source-movement'/(id+'.json.gz');clip=json.loads(gzip.decompress(p.read_bytes()));roles.append(dict(role=role,id='forspoken-flow-'+role,sourceAnimationId='0x'+id,url=p.relative_to(root).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration=clip['duration'],start=start,sourceSha256=clip['userData']['sourceSha256'],verifiedOriginalRole=False))
(root/'assets/backspool/traversal-flow-roles.json').write_text(json.dumps(dict(schema='backspool-source-flow-v1',sourceOnly=True,roles=roles,origin='Recovered Forspoken body curves; authored role/segment mapping; no native traversal fallback'),indent=2)+'\n')

# Keep the earlier manifest untouched so the saved native-era rollback still loads.
legacy=json.loads((root/'assets/backspool/traversal-advanced-roles.json').read_text())
(root/'assets/backspool/traversal-advanced-source-roles.json').write_text(json.dumps(dict(schema='backspool-advanced-source-v2',sourceOnly=True,origin='Recovered Forspoken float/swim roles; no native traversal pack',roles=legacy['roles']),indent=2)+'\n')
