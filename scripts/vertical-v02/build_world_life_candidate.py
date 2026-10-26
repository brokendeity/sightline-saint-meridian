"""Preserve the station checkpoint and replace only its scenic traffic owner."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_STATION.html';gate=json.loads((D/'V02_Transit_Station_Evidence.json').read_text());assert sha(source)==gate['entrySHA256']
air=json.loads((R/'assets/city/vertical-v02/world-life/air_assets.json').read_text());assert air['authoringSHA256']==sha(R/'scripts/vertical-v02/blender_air_vehicles.py')and all(sha(R/m['url'])==m['sha256']for m in air['models'])
assert json.loads((R/'assets/city/vertical-v02/world-life/ambient_routes.json').read_text())['actorCount']==8
s=source.read_text();start=s.index('const verticalCity=(()=>{');end=s.index('\n/* Blender-authored V02 contact candidate.',start);host=s[start:end];a=host.index('for(const [j,y]of L.trafficBands.entries())');b=host.index('state.vehicles=traffic.length;',a);host=host[:a]+'state.legacyTrafficRetired=true;'+host[b:];s=s[:start]+host+s[end:]
old='window.verticalTransit?.tick(worldDt);updateCourier(dt);';assert s.count(old)==1;s=s.replace(old,'window.verticalTransit?.tick(worldDt);window.verticalWorldLife?.tick(worldDt);updateCourier(dt);',1)
old='window.verticalDiscovery?.present();adaptiveQuality.update(dt);';assert s.count(old)==1;s=s.replace(old,'window.verticalDiscovery?.present();window.verticalWorldLife?.present();adaptiveQuality.update(dt);',1)
s=s.replace('</body>','<script src="scripts/game_aerial_traffic_core_v02.js"></script><script src="scripts/game_vertical_world_life_v02.js"></script></body>',1)
target=R/'SIGHTLINE_SAINT_MERIDIAN_V02_WORLD_LIFE.html';target.write_text(s)
report={'status':'WORLD LIFE CANDIDATE; native validation pending','entry':target.name,'entrySHA256':sha(target),'sourceStationEntrySHA256':sha(source),'worldManifestSHA256':gate['manifestSHA256'],'sources':{str(p.relative_to(R)):sha(p)for p in[Path(__file__),R/'scripts/game_aerial_traffic_core_v02.js',R/'scripts/game_vertical_world_life_v02.js']},'assets':{str(p.relative_to(R)):sha(p)for p in[R/'assets/city/vertical-v02/world-life/air_routes.json',R/'assets/city/vertical-v02/world-life/air_assets.json',R/'assets/city/vertical-v02/world-life/ambient_routes.json']},'legacyScenicTrafficRetired':True,'protectedStationUnchanged':True}
(D/'V02_World_Life_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
