"""Source-only v18 height-graded vault and climb segments; selection is authored.

The clips are already retargeted in traversal-source-vault-candidate.json.gz,
where only the 0.8 m vault was in use. Each window is played inside the
existing physics duration, so travel timing is unchanged. Visual anchors come
from measure_forspoken_vault_anchors.cjs and are converted to role time.
"""
import gzip, hashlib, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'assets/backspool'
VAULT,CLIMB=1.8,1.599  # committed vault segment duration; controller climb duration
# role: (source id, source end, physics duration). Windows end once the clip stands.
CHOICES={
 'vaultHigh':('2811b690',2.66,VAULT),  # vlt_ntl_over_base_h120a, whole vault and run-out (2.667s clip)
 'climbLow':('2811b68f',1.5,CLIMB),    # vlt_ntl_up_base_h080a, standing by 1.5s
 'climbMid':('2811b692',2.1,CLIMB),    # vlt_ntl_up_base_h120a, standing by 2.1s
 'climbHigh':('2811b691',2.1,CLIMB),   # vlt_ntl_up_base_h160a, standing by 2.1s
}
def main():
 names=json.loads(gzip.decompress((ASSETS/'original-motion-names-v12.json.gz').read_bytes()))
 named={e['animationId']:e for e in names['motions']}
 pack=json.loads(gzip.decompress((ASSETS/'traversal-source-vault-candidate.json.gz').read_bytes()))
 anchors=json.loads((ASSETS/'forspoken-v18-vault-anchors.json').read_text())
 roles=[]
 for role,(ident,end,duration) in CHOICES.items():
  entry=next(e for e in pack if e['id']=='traversal-source-'+ident);native=named['0x'+ident]
  assert entry['sourceSha256']==native['sourceSha256'] and end<=entry['clip']['duration']+1e-6
  rate=end/duration
  visual=[dict(time=round(s['time']/rate,5),minimumY=s['minimumY']) for s in anchors['samples'][ident] if s['time']<=end+1e-6]
  if visual[-1]['time']<duration:visual.append(dict(time=duration,minimumY=visual[-1]['minimumY']))
  roles.append(dict(role=role,id='forspoken-v18-'+role,sourceId=entry['id'],sourceAnimationId='0x'+ident,originalMotionName=native['originalName'],sourceStart=0,sourceEnd=end,playbackRate=round(rate,6),duration=duration,sourceSha256=entry['sourceSha256'],rootTranslation='physics-owned; native bone lengths and local translations retained',visualAnchor=visual,gameplayBehavior='authored swept path; height selection authored',verifiedOriginalRole=False,replaceable=True))
 anchor_sha=hashlib.sha256((ASSETS/'forspoken-v18-vault-anchors.json').read_bytes()).hexdigest()
 (ASSETS/'traversal-forspoken-v18-segments.json').write_text(json.dumps(dict(schema='backspool-forspoken-v18',sourceOnly=True,anchorsSha256=anchor_sha,roles=roles),indent=2)+'\n')
 print('Admitted',len(roles),'v18 vault and climb segments')
if __name__=='__main__':main()
