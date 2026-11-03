"""Forspoken motion v19 candidate: running take-off.

Builds on the v18 vaults candidate with explicit, inverse-verified hooks.
Jump physics is unchanged; only the take-off clip changes. Ground dash is not
added: the flow dash never starts while Threadrail owns Shift, as in V02.
"""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((D/'V02_Forspoken_Vaults_Build.json').read_text());assert sha(R/b['entry'])==b['entrySHA256']
source=(R/b['entry']).read_text();text=source;edits=[]
def replace(old,new,label):
 global text
 assert text.count(old)==1,(label,text.count(old));text=text.replace(old,new);edits.append((old,new,label))
manifest='assets/backspool/traversal-forspoken-v19-roles.json'
replace('window.backspoolForspokenV17Roles=motionV17;',
 "window.backspoolForspokenV17Roles=motionV17;const motionV19=await unpack('"+manifest+"');const v19Roles=new Set(motionV19.roles.map(r=>r.role));flowManifest.roles=flowManifest.roles.filter(r=>!v19Roles.has(r.role));flowManifest.roles.push(...motionV19.roles);window.backspoolForspokenV19Roles=motionV19;",
 'v19 roles load after v17')
replace('let stride=null,strideIdle=9,strideClock=0,strideLast=null;function strideAnimate(){',
 'let stride=null,strideIdle=9,strideClock=0,strideLast=null,jumpLatch=null;function strideAnimate(){',
 'latched take-off state')
# The take-off is latched when jumpAge restarts, so air control cannot swap clips mid-jump.
replace("poseTail=null;return playSource(s.vel.y>1?'jump':'fall',st.jumpAge,false);}",
 "poseTail=null;if(!jumpLatch||st.jumpAge<jumpLatch.age)jumpLatch={role:Math.hypot(s.vel.x,s.vel.z)>3?'jumpMove':'jump'};jumpLatch.age=st.jumpAge;return playSource(s.vel.y>1?jumpLatch.role:'fall',st.jumpAge,false);}",
 'running jumps take off with the moving clip')
inverse=text
for before,after,label in reversed(edits):
 assert inverse.count(after)==1,label;inverse=inverse.replace(after,before)
assert inverse==source
entry='SIGHTLINE_SAINT_MERIDIAN_V02_FORSPOKEN_AIR.html';(R/entry).write_text(text)
report={**b,'status':'BUILT Forspoken motion v19 candidate; real-input traversal acceptance pending','entry':entry,'entrySHA256':sha(R/entry),'source':b['entry'],'sourceSHA256':b['entrySHA256'],'airManifest':manifest,'airManifestSHA256':sha(R/manifest),'builderSHA256':sha(Path(__file__)),
 'hooks':[{'label':label,'beforeSHA256':hashlib.sha256(before.encode()).hexdigest(),'afterSHA256':hashlib.sha256(after.encode()).hexdigest()}for before,after,label in edits],
 'scope':'Running take-off source clip over unchanged jump physics. Every other role unchanged.'}
(D/'V02_Forspoken_Air_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(entry,report['entrySHA256'],len(edits),'inverse-verified hooks')
