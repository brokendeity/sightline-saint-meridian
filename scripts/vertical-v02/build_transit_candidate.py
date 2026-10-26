"""Separate transit candidate; accepted detailed and older entries are read-only."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html';s=source.read_text()
assert sha(source)=='ec12fa9b3ccadb8acd9c1dcf5136391ef2b675f9ca95702453bd740797ee82a7'
assets=R/'assets/city/vertical-v02/transit/assets.json';meta=json.loads(assets.read_text())
assert meta['authoringSHA256']==sha(R/'scripts/vertical-v02/blender_transit_assets.py')
assert all(sha(R/c['url'])==c['sha256'] for c in [meta['passenger'],*meta['trackChunks']])
assert sha(R/meta['master'])==meta['masterSHA256']
start=s.index('const verticalCity=(()=>{');end=s.index('\n/* Blender-authored V02 contact candidate.',start)
host=s[start:end]
old=host.index('const points=[[80,100,180]');stop=host.index('\n for(const [j,y]of L.trafficBands',old)
host=host[:old]+"state.train=false;state.trainAsset='Unchanged Hi3D front; V02 Blender passenger carriages';state.phase='v02-transit-host';"+host[stop:]
old='return{build,tick,bookmark,setQuality:q=>'
assert host.count(old)==1
host=host.replace(old,"return{transitHost:()=>({ready:state.ready,template:trainFrontTemplate}),build,tick,bookmark,setQuality:q=>",1)
s=s[:start]+host+s[end:]
assert s.count('verticalCity.tick(worldDt);updateCourier(dt);')==1
s=s.replace('verticalCity.tick(worldDt);updateCourier(dt);','verticalCity.tick(worldDt);window.verticalTransit?.tick(worldDt);updateCourier(dt);',1)
assert s.count('</body>')==1
s=s.replace('</body>','<script src="scripts/vertical_transit_core_v02.js"></script><script src="scripts/game_vertical_transit_v02.js"></script></body>',1)
target=R/'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT.html';target.write_text(s)
report={'status':'TRANSIT CANDIDATE; native clearance/station acceptance pending','entry':target.name,'entrySHA256':sha(target),'sourceEntrySHA256':sha(source),
 'definitionSHA256':sha(R/'assets/city/vertical-v02/transit/definition.json'),'assetManifestSHA256':sha(assets),'sources':{str(p.relative_to(R)):sha(p)for p in [Path(__file__),R/'scripts/vertical_transit_core_v02.js',R/'scripts/game_vertical_transit_v02.js']},
 'protectedEntries':{name:sha(R/name)for name in ['SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html','SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html','SIGHTLINE_BACKSPOOL_WHIP_THROW.html','SIGHTLINE_VERTICAL_MEGACITY_V1.html']},
 'retiredInThisCandidate':['200 old route track blocks and cyan strips','four old dynamic carriages'],
 'remaining':['Native full-convoy clearance and camera tests','Station gap/platform/boarding and mechanical support continuity','Traffic envelope routing and world life','Full retained regressions, visual/reference and sustained performance gates']}
(D/'V02_Transit_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
