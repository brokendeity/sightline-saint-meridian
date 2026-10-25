"""Balance a proposed curve's control spacing; never changes the live route."""
from pathlib import Path
import json,math
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'output/local-scratch/v02-transit-study';O.mkdir(parents=True,exist_ok=True)
source=json.loads((D/'V02_Transit_Block_Family_Dense_Study.json').read_text())
parent=source['evaluatedProposal'];old=parent['points'];points=[]
for a,b in zip(old,old[1:]+old[:1]):
    count=max(1,round(math.dist(a,b)/4.7))
    points.extend([[a[k]+(b[k]-a[k])*i/count for k in range(3)] for i in range(count)])
proposal={k:v for k,v in parent.items()if k not in ['file','sha256']}
proposal.update(id=parent['id']+'-balanced-controls',points=points,arcLengthDivisions=32768,
                scope='Unimplemented block-loop proposal; balanced control spacing improves native inverse-arc lookup, same four full front-car envelopes and unchanged city geometry.',
                controlStudy={'source':'V02_Transit_Block_Family_Dense_Study.json','oldCount':len(old),'balancedCount':len(points),'targetControlSpacingMetres':4.7})
(O/'block-family-balanced.json').write_text(json.dumps(proposal,indent=2)+'\n')
print('Balanced proposed control points',len(old),'to',len(points))
