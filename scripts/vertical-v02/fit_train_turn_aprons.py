"""Bounded offline apron fitting against immutable original/current geometry.
This authors hypotheses only. It cannot certify mechanical coupling or transit.
"""
from pathlib import Path
import json,math,subprocess,itertools
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'output/local-scratch/v02-transit-study';O.mkdir(parents=True,exist_ok=True)
rows=[];best=None
for upper,lower,radius,spacing in itertools.product([552,560,568],[72,80,88],[12,14,16,18,20],[15,16]):
    cx=83.5
    points=[[80,100,180],[80,100,350],[80,100,430],[80,100,upper-90],[cx-radius,100,upper-30],[cx-radius,100,upper]]
    for i in range(1,9):
        a=math.pi*(1-i/8);points.append([cx+radius*math.cos(a),100,upper+radius*math.sin(a)])
    points += [[cx+radius,100,upper-30],[87,100,upper-90],[87,100,430],[87,100,350],[87,100,180],[87,100,145],[cx+radius,100,lower+30],[cx+radius,100,lower]]
    for i in range(1,9):
        a=-math.pi*i/8;points.append([cx+radius*math.cos(a),100,lower+radius*math.sin(a)])
    points += [[cx-radius,100,lower+30],[80,100,145]]
    name=f'u{upper}-l{lower}-r{radius}-s{spacing}-arc8192'
    proposal={'id':name,'closed':True,'curveType':'centripetal','spacing':spacing,'arcLengthDivisions':8192,'points':points,'scope':'Unimplemented apron design hypothesis; fixed main station straightsX80/87, unchanged current front/rear body envelopes.'}
    file=O/(name+'.json');file.write_text(json.dumps(proposal,indent=2)+'\n')
    run=subprocess.run(['node','scripts/vertical-v02/precheck_transit_envelopes.cjs',str(file)],cwd=R,capture_output=True,text=True);assert run.returncode==0,run.stderr
    detail=json.loads((D/'V02_Transit_Route_Study.json').read_text());metrics=detail['motionEnvelopeMetrics'];world=len(detail['worldConflicts']);convoy=sum(r['sampleCount']for r in detail['convoyConflicts'])
    # Prefer clear geometry before comparing articulation; keep all failures.
    score=world*1e12+convoy*1e8+max(0,.2-metrics['minimumAdjacentSeparatingAxisGap'])*1e6+metrics['maximumAdjacentYawDegrees']*1e3+spacing
    row={'id':name,'upper':upper,'lower':lower,'radius':radius,'spacing':spacing,'worldConflictOwners':world,'convoyConflictSamples':convoy,'maximumAdjacentYawDegrees':metrics['maximumAdjacentYawDegrees'],'minimumAdjacentSeparatingAxisGap':metrics['minimumAdjacentSeparatingAxisGap'],'routeLength':detail['routeLength'],'score':score};rows.append(row);print(json.dumps(row),flush=True)
    if best is None or score<best['row']['score']:best={'row':row,'proposal':proposal,'detail':detail}
report={'status':'DESIGN STUDY ONLY; no playable train change or acceptance','scope':'Ninety bounded apron/spacing candidates, actual native spline and unchanged shipped body bounds. Original/current geometry remains fixed. Sampled oriented envelopes only; later refined-car meshes, native playback, mechanical coupling/bogies, track supports, station operation and continuous sweeps still require validation.','rows':rows,'best':best}
(D/'V02_Transit_Apron_Fit_Study.json').write_text(json.dumps(report,indent=2)+'\n');(D/'V02_Transit_Route_Study.json').write_text(json.dumps(best['detail'],indent=2)+'\n')
