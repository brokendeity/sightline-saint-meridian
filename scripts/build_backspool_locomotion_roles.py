"""Authored role admission for visually reviewed recovered locomotion loops."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def build():
 profiles={e['animationId'].removeprefix('0x'):e for e in json.loads((ROOT/'output/rea-forspoken/movement-kinematic-profiles.json').read_text())['clips']}
 roles=[]
 for role,id,minspeed in [('walk','2811294e',.2),('jog','2811294f',2.15),('run','2811296d',3.9),('fastRun','28112951',5.6),('parkourRun','281103f8',9.1),('parkourSprint','2811df78',14.1)]:
  e=profiles[id];p=ROOT/'assets/backspool/source-movement'/(id+'.json.gz')
  roles.append(dict(role=role,id='traversal-locomotion-'+role,sourceAnimationId=e['animationId'],url=p.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),sourceSha256=e['sourceSha256'],duration=e['durationSeconds'],minSpeed=minspeed,nominalSpeed=e['root']['averagePathSpeedSourceUnitsPerSecond'],roleEvidence='Authored Backspool role; source root/leg-cycle analysis and target mesh review; original move name unverified'))
 data=dict(schema='backspool-locomotion-roles-v1',scope='isolated traversal candidate',unitPolicy='Source numerical root speeds used as authored target metres/second; original controller unit conversion remains unverified',runSpeed=6.6,sprintSpeed=roles[-1]['nominalSpeed'],roles=roles)
 (ROOT/'assets/backspool/traversal-locomotion-roles.json').write_text(json.dumps(data,indent=2)+'\n');print('Six source locomotion loops assigned authored candidate roles')
if __name__=='__main__':build()
