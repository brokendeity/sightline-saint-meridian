"""Study a real block-circling metro route instead of adjacent-lane hairpins.
Design data only; existing station straight X80 is preserved, city immutable.
"""
from pathlib import Path
import json,math,subprocess,itertools
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=R/'output/local-scratch/v02-transit-study';rows=[];best=None
for radius,spacing in itertools.product([12,16,20,24],[14.5,15,16]):
    left,right,near,far=80,240,80,560
    points=[[left,100,near+radius],[left,100,180],[left,100,350],[left,100,430],[left,100,far-radius]]
    def arc(cx,cz,start,end):
        for i in range(1,9):
            a=start+(end-start)*i/8;points.append([cx+radius*math.cos(a),100,cz+radius*math.sin(a)])
    arc(left+radius,far-radius,math.pi,math.pi/2)
    points.append([right-radius,100,far]);arc(right-radius,far-radius,math.pi/2,0)
    points.extend([[right,100,430],[right,100,350],[right,100,180],[right,100,near+radius]])
    arc(right-radius,near+radius,0,-math.pi/2)
    points.append([left+radius,100,near]);arc(left+radius,near+radius,-math.pi/2,-math.pi)
    points.pop() # Closed spline reuses its first endpoint.
    name=f'block80-240-r{radius}-s{spacing}';proposal={'id':name,'closed':True,'curveType':'centripetal','spacing':spacing,'arcLengthDivisions':8192,'points':points,'scope':'Unimplemented block-circling metro design; main station approach remainsX80, new opposite corridorX240. No original building or public layout changes.'}
    file=O/(name+'.json');file.write_text(json.dumps(proposal,indent=2)+'\n')
    run=subprocess.run(['node','scripts/vertical-v02/precheck_transit_envelopes.cjs',str(file)],cwd=R,capture_output=True,text=True);assert run.returncode==0,run.stderr
    detail=json.loads((D/'V02_Transit_Route_Study.json').read_text());metric=detail['motionEnvelopeMetrics'];world=len(detail['worldConflicts']);convoy=sum(r['sampleCount']for r in detail['convoyConflicts'])
    score=world*1e12+convoy*1e8+max(0,.2-metric['minimumAdjacentSeparatingAxisGap'])*1e6+metric['maximumAdjacentYawDegrees']*1e3+spacing
    row={'id':name,'radius':radius,'spacing':spacing,'worldConflictOwners':world,'convoyConflictSamples':convoy,'maximumAdjacentYawDegrees':metric['maximumAdjacentYawDegrees'],'minimumAdjacentSeparatingAxisGap':metric['minimumAdjacentSeparatingAxisGap'],'routeLength':detail['routeLength'],'score':score};rows.append(row);print(json.dumps(row),flush=True)
    if best is None or score<best['row']['score']:best={'row':row,'proposal':proposal,'detail':detail}
report={'status':'DESIGN STUDY ONLY; no runtime promotion','scope':'Twelve fixed candidate block loops over actual exported city streets, native spline and unchanged shipped4bodyenvelopes. This tests a broader functional metro topology, not shrinking vehicle bodies or moving buildings. Native playback, refined consist, mechanical coupling, static infrastructure, stations and continuous sweeps remain separate.','rows':rows,'best':best}
(D/'V02_Transit_Block_Loop_Study.json').write_text(json.dumps(report,indent=2)+'\n');(D/'V02_Transit_Route_Study.json').write_text(json.dumps(best['detail'],indent=2)+'\n')
