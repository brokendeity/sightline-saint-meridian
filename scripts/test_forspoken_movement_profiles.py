#!/usr/bin/env python3
import json,math
from pathlib import Path
ROOT=Path('output/rea-forspoken')
doc=json.loads((ROOT/'movement-kinematic-profiles.json').read_text());manifest=json.loads((ROOT/'movement-source-tracks/manifest.json').read_text())
assert doc['count']==len(manifest['clips'])==532
assert len({c['sourceTrackFile'] for c in doc['clips']})==532
for c in doc['clips']:
 assert c['durationSeconds']>0 and c['samples']>=2
 assert c['root']['pathLengthSourceUnits']>=0
 assert math.isfinite(c['normalizedLoopClosureError'])
 p=json.loads(Path(c['profileFile']).read_text());t=p['sampledBodyMarkers']['timesSeconds']
 assert all(t[i]<=t[i+1] for i in range(len(t)-1))
 assert abs(t[-1]-c['durationSeconds'])<1e-8
 for name,positions in p['sampledBodyMarkers']['positionsSourceUnits'].items():
  assert len(positions)==len(t)
  assert all(len(v)==3 and all(math.isfinite(x) for x in v) for v in positions)
 for foot,contact in c['footContactCandidates'].items():
  assert 0<=contact['lowSlowVerticalFraction']<=1
  assert all(0<=a<=b<=c['durationSeconds'] for a,b in contact['candidateIntervalsSeconds'])
 assert c['classification']['verifiedMoveName'] is None
short={c['animationId']:c for c in doc['clips']}
for clip,speed in [('0x2811294e',1.5),('0x2811294f',3),('0x2811296d',4.8),('0x28112951',6.6)]:
 c=short[clip];assert abs(c['root']['averagePathSpeedSourceUnitsPerSecond']-speed)<.01
 assert c['normalizedLoopClosureError']<.01
print('532 kinematic profiles: completeness, finite markers, time/contact bounds and 4 loop shortlist metrics pass')
