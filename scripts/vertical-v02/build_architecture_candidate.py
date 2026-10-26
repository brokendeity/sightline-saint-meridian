"""Derive a separate detailed candidate from the accepted current gameplay."""
from pathlib import Path
import json,hashlib
from build_detailed_graph import build as build_graph
R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
gate=json.loads((D/'V02_Phase4_Gate.json').read_text())
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html'
assert gate['status']=='PASS essential circulation, recovery and prototype encounters'
assert sha(source)==gate['entrySHA256']
manifest=R/'assets/city/vertical-v02/detailed/manifest.json'
graphSHA256=build_graph()
metadata=json.loads(manifest.read_text())
authoring=json.loads((D/'V02_Detailed_Authoring.json').read_text())
assert authoring['authoringScriptSHA256']==sha(R/'scripts/vertical-v02/blender_architecture.py'),'Detailed authoring script/report differ; do not publish a failed or stale export'
assert all(sha(R/file)==digest for file,digest in authoring.get('dependencies',{}).items()),'Detailed helper/source appearance changed since export'
assert authoring['masterSHA256']==sha(R/authoring['master'])
assert all(sha(R/c['url'])==c['sha256']for c in metadata['chunks'])
assert metadata['acceptedGrayboxManifestSHA256']==gate['manifestSHA256']
run=json.loads((D/'V02_Regression_Run.json').read_text())
for key,filename in [('encounters','game_vertical_encounters_v02.js'),('market','game_vertical_market_v02.js'),('pursuit','game_vertical_pursuit_v02.js'),('discovery','game_vertical_discovery_v02.js')]:
    assert sha(R/'scripts'/filename)==run['hashes'][key]
s=source.read_text()
old="const folder='assets/city/vertical-v02/'+(state.pilot?'pilot':'graybox');"
assert s.count(old)==1
s=s.replace(old,"const folder='assets/city/vertical-v02/'+(state.pilot?'pilot':'detailed');",1)
s=s.replace("root.name='Saint Meridian V02 Blender graybox'","root.name='Saint Meridian V02 detailed Blender architecture'",1)
s=s.replace("phase:'graybox-contact'","phase:'detailed-architecture'",1)
# Release duplicate PBR textures when replacing imported materials with the
# shared canonical palette. The accepted graybox/gameplay source stays intact.
old="else if(M.get(source.name)!==source){o.material=M.get(source.name);source.dispose();}"
assert s.count(old)==1
new="else if(M.get(source.name)!==source){const keep=M.get(source.name);o.material=keep;for(const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])if(source[key]&&source[key]!==keep[key])source[key].dispose();source.dispose();}"
s=s.replace(old,new,1)

target=R/'SIGHTLINE_SAINT_MERIDIAN_V02_DETAILED.html'
target.write_text(s)
report={'status':'FIRST DETAILED CANDIDATE; runtime acceptance pending','entry':target.name,
 'entrySHA256':sha(target),'manifestSHA256':sha(manifest),
 'graphSHA256':graphSHA256,'graphBuilderSHA256':sha(R/'scripts/vertical-v02/build_detailed_graph.py'),
 'acceptedSourceEntrySHA256':sha(source),'phase4GateSHA256':sha(D/'V02_Phase4_Gate.json'),
 'gameplayPolicy':'Exact accepted gameplay; district asset folder/labels differ and unused duplicate PBR textures are disposed when sharing materials.',
 'sourceChanged':False,'originalCityCopiesExported':0}
(D/'V02_Detailed_Build.json').write_text(json.dumps(report,indent=2)+'\n')
print('Built',target.name,report['entrySHA256'])
