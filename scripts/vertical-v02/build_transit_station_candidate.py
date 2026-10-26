"""Apply only the accepted source-authored station/infrastructure asset swap."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT.html';gate=json.loads((D/'V02_Transit_Implementation_Evidence.json').read_text());assert gate['entrySHA256']==sha(source)
preflight=json.loads((D/'V02_Transit_Environment_Preflight.json').read_text());mp=R/'assets/city/vertical-v02/transit-world/manifest.json';assert preflight['status']=='PASS transit environment preservation/compatibility preflight only'and preflight['manifestSHA256']==sha(mp)
auth=json.loads((D/'V02_Transit_Environment_Authoring.json').read_text());assert auth['manifestSHA256']==sha(mp)and auth['masterSHA256']==sha(R/auth['master'])and auth['authoringSHA256']==sha(R/'scripts/vertical-v02/blender_transit_environment.py')
assert auth['graphBuilderSHA256']==sha(R/'scripts/vertical-v02/build_transit_station_graph.py')and auth['graphSHA256']==sha(D/'V02_Transit_Movement_Graph.json')
s=source.read_text();old="const folder='assets/city/vertical-v02/'+(state.pilot?'pilot':'detailed');";assert s.count(old)==1;s=s.replace(old,"const folder='assets/city/vertical-v02/'+(state.pilot?'pilot':'transit-world');",1)
target=R/'SIGHTLINE_SAINT_MERIDIAN_V02_TRANSIT_STATION.html';target.write_text(s)
result={'status':'PHASE6 CANDIDATE; actual station gameplay/clearance pending','entry':target.name,'entrySHA256':sha(target),'sourceEntrySHA256':sha(source),'manifestSHA256':sha(mp),'masterSHA256':auth['masterSHA256'],'builderSHA256':sha(Path(__file__)),'retiredRecords':preflight['controlledRetirements'],'originalCityModified':False}
(D/'V02_Transit_Station_Build.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
