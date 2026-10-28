"""Real upper-transfer receiving posts: proposal pending source/native clearance."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256((R/p).read_bytes()).hexdigest()
source='development/vertical-city-v02/blender/SaintMeridian_V02_Diffuse_Pilot.blend';manifest='assets/city/vertical-v02/diffuse-pilot/runtime/manifest.json';base=json.loads((R/manifest).read_text());records=[];mounts=[]
def part(id,c,size,mat,solid=True):
 r={'id':id,'owner':'v02:'+id,'center':c,'size':size,'box':{'min':[a-b/2 for a,b in zip(c,size)],'max':[a+b/2 for a,b in zip(c,size)]},'material':mat,'solid':solid,'walkable':False,'collection':'SM_V02_UPPER_ANCHOR_MOUNTS','upperAnchorMount':True,'nonDestructible':True};records.append(r);return r
for tag,z in [('departure',424),('arrival',400)]:
 prefix='upper-anchor-'+tag;support=next(r for r in base['records']if r['solid']and r['walkable']and r['box']['min'][0]<65.6<r['box']['max'][0]and r['box']['min'][2]<z<r['box']['max'][2]and abs(r['box']['max'][1]-128)<1e-6)
 part(prefix+'-housing',[65.5,128.8,z],[.5,1.6,.7],'steel')
 part(prefix+'-shoe',[65.6,128.06,z],[.7,.12,.9],'steel')
 pad=part(prefix+'-receiver',[65.23,128.85,z],[.04,.64,.48],'deck');pad['structuralAttachment']=prefix+'-housing'
 for dz in [-.27,.27]:part(prefix+('-cyan-left'if dz<0 else'-cyan-right'),[65.205,128.85,z+dz],[.018,.72,.025],'cyan',False)
 part(prefix+'-status',[65.203,129.24,z],[.02,.055,.22],'warm',False)
 mounts.append({'id':prefix,'supportID':support['id'],'target':[65.21,128.85,z],'contactNormal':[-1,0,0],'expectedRailRoot':[64.49,128.85,z],'laneRootX':64,'existingSupportFloor':128})
assert len(records)==12
for r in records:
 # Existing structures above the mounting floor must remain clear. Deliberate
 # receiver/housing and shoe/floor attachments are explicit new-source overlaps.
 for old in base['records']:
  if not old['solid']or old['box']['max'][1]<=128+1e-6:continue
  if all(max(r['box']['min'][i],old['box']['min'][i])<min(r['box']['max'][i],old['box']['max'][i])-1e-6 for i in range(3)):raise AssertionError((r['id'],old['id']))
plan={'status':'PLANNED: manifest AABB/source/native/envelope/input acceptance still pending','sourceMaster':source,'sourceMasterSHA256':sha(source),'sourceManifest':manifest,'sourceManifestSHA256':sha(manifest),'failureEvidence':'development/vertical-city-v02/evidence/body-framing-station-routes/mastery-zero/V02_Mastery_Full_Zero.json','problem':'Grazing roof aim struck a vertical platform edge4.5mm below floor; the0.72m lateral anchor offset did not provide capsule floor clearance. Previous lucky top hits are not a robust receiving surface.','scope':'Two physical, visible receiving posts beside the retained x64m running lane. No original geometry, power limits, body dimensions or gameplay controller changes.','mounts':mounts,'additions':records,'referenceEnvelope':{'actorRadius':.575,'actorRootFloorOffset':.42,'nominalRailHeightAboveFloor':.85,'nominalPostClearanceAtRailRoot':.145},'acceptance':['Independently reopen source; verify all unrelated object signatures and each manifold/UV/normal/bounds','Continuous train/aerial and original building clearance; supported mounting footprints','Physical source mesh attachment and collision-checked complete rails, normal catches/Pop/descent atzero/full legal bank','Repeat whole public routes/loops and original city preservation; inspect current native/source images','Retain failed grazing-hit case as a separate failure/recovery requirement, never certify with the new success']};(D/'V02_Upper_Anchor_Plan.json').write_text(json.dumps(plan,indent=2)+'\n');print('PLANNED',len(records),'components on',[(m['id'],m['supportID'])for m in mounts])
