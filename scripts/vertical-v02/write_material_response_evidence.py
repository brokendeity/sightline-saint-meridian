"""Bind the bounded checkpoint evidence; never promote the full visual/release gate."""
from pathlib import Path
import json,hashlib,subprocess
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
b=read(D/'V02_Material_Response_Build.json');a=read(D/'V02_Material_Response_Authoring.json')
for field in ['entry','manifest','script','materialContract']:assert sha(R/b[field])==b[field+'SHA256']
assert sha(R/a['master'])==a['masterSHA256']and sha(R/a['sourceMaster'])==a['sourceMasterSHA256']
n=read(D/'V02_Material_Response_Native.json');v=read(D/'V02_Material_Response_Validation.json');s=read(D/'V02_Material_Response_Blender.json');checks=read(D/'V02_Material_Response_Checks.json');routes=read(D/'V02_Material_Response_Routes.json');bench=read(D/'V02_Material_Response_Benchmark.json')
assert all(x['status'].startswith('PASS')for x in[n,v,s,checks,routes])
assert n['entrySHA256']==b['entrySHA256']and n['scriptSHA256']==b['scriptSHA256']and n['contractSHA256']==b['materialContractSHA256']
assert v['masterSHA256']==a['masterSHA256']and v['contractSHA256']==b['materialContractSHA256']
assert s['nativeReportSHA256']==sha(D/'V02_Material_Response_Native.json')and s['masterSHA256']==a['masterSHA256']
assert all(sha(R/f)==h for f,h in checks['identities'].items())
assert len(routes['jobs'])==6 and all(j['returncode']==0 for j in routes['jobs'])
assert bench['status'].startswith('MEASURED')and len(bench['runs'])==2
assert all(sha(R/f)==h for f,h in bench['hashes'].items())
assert bench['comparison']['maxPositionDifference']==0 and bench['comparison']['maxCameraDifference']==0
for run in bench['runs']:
    assert run['simulationSeconds']==60 and run['wallSeconds']>=60 and run['internalResolution']==[1280,800]and run['distance']>500 and not run['errors']
    assert run['gpuTiming']['supported']and run['gpuTimeMs']['samples']>100 and run['gpuTiming']['disjointSamples']==0
    assert sha(R/run['entry'])==run['entrySHA256']
old=(R/b['source']).read_text();tag='<script src="'+b['script']+'?v='+b['scriptSHA256'][:12]+'"></script>\n'
assert (R/b['entry']).read_text().replace(tag,'',1)==old
protected=[]
baseline_revision=subprocess.check_output(['git','log','-1','--format=%H','--',b['source']],cwd=R,text=True).strip()
prior_files=subprocess.check_output(['git','ls-tree','-r','--name-only',baseline_revision],cwd=R,text=True).splitlines()
for f in [f for f in prior_files if f.startswith('SIGHTLINE') and f.endswith('.html') and '/'not in f]:
    original=subprocess.check_output(['git','show',baseline_revision+':'+f],cwd=R)
    assert (R/f).read_bytes()==original,f
    protected.append({'entry':f,'sha256':sha(R/f)})
files=[R/b['entry'],R/b['script'],R/a['master'],R/a['sourceMaster'],R/b['materialContract']]
files+=list((R/'assets/city/vertical-v02/material-response').glob('*'))
files+=list(D.glob('V02_Material_Response_*.json'))
files=[f for f in files if f.name!='V02_Material_Response_Evidence.json']
for folder in ['material-response','material-response-checks','material-response-routes','material-response-loops','material-response-hud','stock-material-response','material-response-benchmark']:
    files+=list((D/'evidence'/folder).rglob('*'))
files=sorted(set(f for f in files if f.is_file()))
baseline,candidate=bench['runs'];report={'status':'PASS bounded material-response source/native/routes/input checkpoint; full goal INCOMPLETE',
 'entry':b['entry'],'entrySHA256':b['entrySHA256'],'manifest':b['manifest'],'manifestSHA256':b['manifestSHA256'],
 'master':a['master'],'masterSHA256':a['masterSHA256'],'sourceMaster':a['sourceMaster'],'sourceMasterSHA256':a['sourceMasterSHA256'],
 'originalBuildings':310,'newGeometry':0,'newDynamicLights':0,'reflectanceVertices':n['loaded']['reflectanceVertices'],
 'districtFacadeMaterialBindings':n['loaded']['materials'],'compressedHDRBytes':a['environment']['bytes'],
 'geometryRoutesPreserved':True,'protectedBaselineRevision':baseline_revision,'protectedPreviousEntries':protected,
 'performance':{'scope':bench['scope'],'fixedInternalResolution':[1280,800],
 'baselineMedianFrameMs':baseline['frameIntervalsMs']['p50'],'candidateMedianFrameMs':candidate['frameIntervalsMs']['p50'],
 'baselineMedianGpuMs':baseline['gpuTimeMs']['p50'],'candidateMedianGpuMs':candidate['gpuTimeMs']['p50'],
 'gpuMedianRatio':candidate['gpuTimeMs']['p50']/baseline['gpuTimeMs']['p50'],'finalCombinedReleaseAcceptance':False},
 'fullApprovedReferenceVisualQuality':'FAIL — repetitive facade grids, insufficient architectural depth/variety, strong specular patch and source/native lighting differences remain',
 'unresolved':['Broader approved-reference facade massing/material/light-response work','Full current encounter/replay/destruction/mission/failure regressions','Final combined sustained combat/replay/destruction/city workload and GPU budget optimization','Broader camera, physical controller and touchscreen release checks'],
 'limitations':['Single static local reflection probe does not update after destruction or dynamic transit; it is not ray-traced or screen-space reflection','Only three original corridor owners gain PBR; remaining city building toon materials stay unchanged','GLTF roughness/metalness factors and linked texture maps are preserved','Bounded CPU differences are measured observations, not optimization claims; GPU cost increased','Frame-scheduler drop counter is not a complete outer-clamp time measure; heap snapshots are not peak/leak evidence','Benchmark end screenshots follow its synthetic inactive-game flag and do not certify paused HUD or hero-objective presentation; use active video/input tests for their stated scopes'],
 'retainedFailures':['initial-face-slot-failure.blend and its contract/native report','initial-runtime-material-mismatch.json.gz/png','initial-compositor-counter.json.gz'],
 'artifacts':[{'file':str(f.relative_to(R)),'sha256':sha(f),'bytes':f.stat().st_size}for f in files]}
(D/'V02_Material_Response_Evidence.json').write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],'artifacts',len(files),'previous entries',len(protected),flush=True)
