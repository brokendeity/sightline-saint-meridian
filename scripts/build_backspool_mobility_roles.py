"""Admit source-only acrobatic curves; action selection and travel are authored."""
import gzip, hashlib, json
from pathlib import Path
from build_forspoken_backspool_pilot import retarget
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/rea-forspoken'
# Directional names are Backspool design assignments, not recovered original state names.
CHOICES={'frontFlip':('2811ec86',0,1.5),'backFlip':('2811dbc2',0,1.25),
         'sideFlipLeft':('2811e9e1',0,1.7833333015441895),
         'sideFlipRight':('2811e9e2',0,1.8),
         'twistFlip':('2811ad2b',.65,2.95)}

def main():
    inventory=json.loads((OUT/'movement-kinematic-profiles.json').read_text())['clips']
    roles=[]
    folder=ROOT/'assets/backspool/source-mobility-v11';folder.mkdir(exist_ok=True)
    for role,(identifier,start,end) in CHOICES.items():
        record=next(r for r in inventory if r['animationId']=='0x'+identifier)
        source=json.loads(Path(record['sourceTrackFile']).read_text())
        clip=retarget(source,preserve_pelvis=True)
        clip['name']='forspoken-flow-'+role
        path=folder/(identifier+'.json.gz')
        path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
        roles.append(dict(role=role,id=clip['name'],sourceAnimationId=source['animationId'],sourceSha256=source['sourceSha256'],
                          url=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                          duration=clip['duration'],start=start,end=end,playbackRate=1.35 if role.startswith('side') else 1.4 if role=='twistFlip' else 1.2,pelvisTranslation=True,verifiedOriginalRole=False,
                          roleEvidence='Recovered parkour body curves; authored directional action assignment; physics owns world travel'))
    manifest=dict(schema='backspool-source-mobility-v11',sourceOnly=True,roles=roles)
    (ROOT/'assets/backspool/traversal-mobility-roles-v11.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Admitted',len(roles),'source acrobatic curves')
if __name__=='__main__':main()
