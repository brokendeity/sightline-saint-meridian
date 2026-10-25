"""Saved authoring bounds plus compatibility prechecks; not new input acceptance."""
import bpy,json,hashlib,gzip,re
from pathlib import Path
from mathutils import Vector
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';M=R/'assets/city/vertical-v02/graybox/manifest.json';m=json.loads(M.read_text());G=D/'V02_Movement_Graph.json';g=json.loads(G.read_text());assert m['graphSHA256']==hashlib.sha256(G.read_bytes()).hexdigest()
parts=[r for r in m['records']if r['id'].startswith('mastery-mantle-cover-')];assert len(parts)==18
maximum=0
for r in parts:
    o=bpy.data.objects[r['id']];assert o in bpy.data.collections[r['collection']].objects.values();assert o['solid']==r['solid']and o['walkable']==r['walkable'];assert o.data.materials[0].name=='V02_'+r['material']
    p=[o.matrix_world@Vector(v)for v in o.bound_box];game=[[v.x,v.z,-v.y]for v in p]
    error=max(abs(fn(v[i]for v in game)-r['box'][key][i])for key,fn in [('min',min),('max',max)]for i in range(3));assert error<5e-5;maximum=max(maximum,error)
native=(R/'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html').read_text();assert 'BODY_RADIUS=.55,BODY_HEIGHT=1.72,ROOF_CLEARANCE=.40'in native
padding_min=[.55,1.72,.55];padding_max=[.55,.4,.55];solid=[r for r in parts if r['solid']]
def contains(p,r):
    return all(r['box']['min'][i]-padding_min[i]+1e-5<p[i]<r['box']['max'][i]+padding_max[i]-1e-5 for i in range(3))
def sweep(a,b,r):
    enter,leave=0,1
    for i in range(3):
        delta=b[i]-a[i];lo=r['box']['min'][i]-padding_min[i];hi=r['box']['max'][i]+padding_max[i]
        if abs(delta)<1e-9:
            if not lo<=a[i]<=hi:return False
        else:
            t0,t1=sorted([(lo-a[i])/delta,(hi-a[i])/delta]);enter=max(enter,t0);leave=min(leave,t1)
            if enter>leave:return False
    return enter<=1 and leave>=0
rail=next(e for e in g['edges']if e['source']=='fast-launch'and e['ability']=='threadrail');rail_hits=[r['id']for r in solid if sweep(rail['anchors']['a'],rail['anchors']['b'],r)];assert not rail_hits,rail_hits
summary_path=D/'V02_Mastery_Full_Zero_Wall.json';summary=json.loads(summary_path.read_text());assert summary['status'].startswith('PASS');trace_path=D/summary['fullTrace'];trace=json.load(gzip.open(trace_path))['trace'];hits=[{'frame':i,'component':r['id'],'position':t['p']}for i,t in enumerate(trace)for r in solid if contains(t['p'],r)];assert not hits,hits[:5]
report={'status':'PASS saved mantle-cover bounds and prior input-path compatibility prechecks','scope':__doc__+' Native body expansion constants; first uphill rail segment and prior passing full-ground/four-wall root trajectory checked against only the new cover. This does not certify new live movement, limb poses, camera, projectile behavior or hostile safety.',
        'entrySHA256':hashlib.sha256(native.encode()).hexdigest(),'manifestSHA256':hashlib.sha256(M.read_bytes()).hexdigest(),'masterSHA256':hashlib.sha256((D/'blender/SaintMeridian_V02_AAA_Master.blend').read_bytes()).hexdigest(),'components':len(parts),'maximumBoundsErrorMetres':maximum,'firstRailCoverConflicts':rail_hits,'priorInputTrace':summary['fullTrace'],'priorTraceSHA256':hashlib.sha256(trace_path.read_bytes()).hexdigest(),'priorTraceManifestSHA256':summary['manifestSHA256'],'priorTrajectoryFrames':len(trace),'priorBodyCoverConflicts':hits}
(D/'V02_Mantle_Cover_Authoring.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
