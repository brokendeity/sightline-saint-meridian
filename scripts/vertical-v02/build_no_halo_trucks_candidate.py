"""No halo trucks candidate: removes the halo surveillance trucks from the game for now.

Builds on the frame pacing candidate. The truck model (a placeholder) is no longer
loaded, so no trucks spawn, and none add colliders, camera obstacles or ray targets.
The truck code stays in the build so replacement models can be dropped in later by
restoring the single load call.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Frame_Pacing_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
replace("window.haloTruckState=()=>haloTrucks.state();\nhaloTrucks.load();",
 "window.haloTruckState=()=>({...haloTrucks.state(),removed:'Halo trucks removed for now; replacement models pending'});\n// Halo trucks removed for now (placeholder model); restore haloTrucks.load() when replacement models exist.",
 'remove halo trucks')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_NO_HALO_TRUCKS.html';(R/entry).write_text(text)
report={**b,'status':'BUILT no-halo-trucks candidate; regressions pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Removes the halo surveillance trucks (placeholder model) until replacements exist. Everything else unchanged.'}
(D/'V02_No_Halo_Trucks_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
