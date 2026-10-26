"""Derive complete detailed-stage navigation records from actual exported data.

The accepted design graph remains immutable. Prior input evidence is provenance,
not a claim that changed architecture has passed current gameplay acceptance.
Native detailed tests produce a separate hash-bound admission overlay.
"""
from pathlib import Path
import copy, csv, hashlib, json, math

R=Path(__file__).resolve().parents[2]
D=R/'development/vertical-city-v02'
OUT=R/'assets/city/vertical-v02/detailed'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
canonical=lambda x:hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def build():
    mp=OUT/'manifest.json';m=json.loads(mp.read_text())
    base=json.loads((D/'V02_Movement_Graph.json').read_text())
    accepted=json.loads((D/'V02_Phase4_Gate.json').read_text())
    assert sha(D/'V02_Movement_Graph.json')==accepted['graphSHA256']
    base_edges={e['id']:e for e in base['edges']}
    public_edges={e['id']:e for e in m['navigation']['edges']}
    nodes={n['id']:copy.deepcopy(n)for n in base['nodes']}
    for n in m['navigation']['nodes']:nodes[n['id']]={**nodes.get(n['id'],{}),**n}
    # The legacy controlled drop ends on the 108m roof at Z377, while its
    # named onward waypoint is Z375. Represent the two-metre grounded exit
    # explicitly instead of silently declaring these positions equivalent.
    drop=base_edges['E0248']
    assert drop['destination']=='mastery-recovery-108' and drop['path'][-1]==[64,108,377]
    catch='detail-recovery-108-drop-catch'
    nodes[catch]={'id':catch,'position':drop['path'][-1],'kind':'supported controlled-drop landing'}
    base_edges['E0248']={**drop,'destination':catch}
    base_edges['detail-recovery-108-exit']={
      'id':'detail-recovery-108-exit','source':catch,'destination':'mastery-recovery-108','ability':'run',
      'path':[drop['path'][-1],nodes['mastery-recovery-108']['position']],
      'failureRecovery':'Remain on the broad 108m recovery roof; public stairs return to transit'}
    for n in nodes.values():
        n.update(layer=n['position'][1],supportStatus='Detailed exported geometry; per-route native acceptance remains separate',validation='CURRENT INPUT ADMISSION PENDING')
    edges=[]
    for id in list(base_edges)+[id for id in public_edges if id not in base_edges]:
        old=copy.deepcopy(base_edges.get(id,{}));e={**old,**public_edges.get(id,{})}
        path=e['path'];assert len(path)>=2
        assert e['source']in nodes and e['destination']in nodes
        if id in ['E0230','E0233']:
            # Authored rail-surface positions sit 2cm above architectural
            # floor nodes. Keep that source attachment position visible,
            # and include its short access segment in the movement path.
            node=nodes[e['source']]['position']
            assert path[0][0]==node[0] and path[0][2]==node[2] and abs(path[0][1]-node[1]-.02)<1e-6
            e['attachmentPosition']=path[0];path=[node,*path];e['path']=path
        assert math.dist(nodes[e['source']]['position'],path[0])<.011,(id,'source mismatch')
        assert math.dist(nodes[e['destination']]['position'],path[-1])<.011,(id,'destination mismatch')
        ability=e['ability'];speed=1.65 if ability in ['walk','stairs']else 6.6
        horizontal=sum(math.hypot(b[0]-a[0],b[2]-a[2])for a,b in zip(path,path[1:]))
        e.update(directionality='directed',elevationChange=path[-1][1]-path[0][1],horizontalDistance=horizontal,
          distance3D=sum(math.dist(a,b)for a,b in zip(path,path[1:])),
          requiredAfterstepImpulses=e.get('requiredAfterstepImpulses',0),requiredReplaySlots=e.get('requiredReplaySlots',0),
          expectedSeconds=e.get('expectedSeconds',round(horizontal/speed,3)),
          timeEvidence=e.get('timeEvidence','Geometric planning estimate at measured native walk/run speed; not observed traversal time'),
          difficulty=e.get('difficulty','public'),risk=e.get('risk','low'),
          failureRecovery=e.get('failureRecovery','Return down the same supported market stair to the lower commercial gallery'),
          validation={'geometry':'Detailed exported placement; original-volume and recorded-path compatibility are separate reports',
                      'input':'NOT TESTED on current detailed manifest; no acceptance inherited from the graybox'},
          traversalAgent=e.get('traversalAgent','player'))
        if id.startswith('detail-market-'):
            e['requiredAbilities']=['ordinary grounded movement','step rise <=0.18m']if ability=='stairs'else['ordinary grounded movement']
        edges.append(e)
    topology={
      'nodes':[{'id':n['id'],'position':n['position']}for n in nodes.values()],
      'edges':[{k:e[k]for k in ['id','source','destination','ability','path']}for e in edges]}
    graph={**base,'schema':'sm-v02-detailed-movement-1',
      'authority':'Current detailed Blender export plus accepted movement design; original source graph preserved',
      'status':'Detailed graph ready for current native admission; not full route certification',
      'sourceGraphSHA256':sha(D/'V02_Movement_Graph.json'),'sourcePhase4GateSHA256':sha(D/'V02_Phase4_Gate.json'),
      'sourceBuilderSHA256':sha(Path(__file__)),
      'exportedGeometrySHA256':canonical({'records':m['records'],'chunks':m['chunks']}),
      'topologySHA256':canonical(topology),'nodes':list(nodes.values()),'edges':edges,
      'preservation':{'acceptedGraphUnchanged':True,'acceptedGrayboxManifestSHA256':accepted['manifestSHA256']},
      'remainingGates':['Current detailed route reexecution and camera review','New stair route native admission',
                        'Full detailed architecture, transit/world life, visual and performance acceptance']}
    graph.pop('publicConnectivity',None) # old counts must not masquerade as current evidence
    # Topology check: public stair/terrace must be mutually reachable through
    # the actual directed edges. This is connectivity evidence, not gameplay.
    adjacency={id:[]for id in nodes}
    for e in edges:
        if e['ability']in ['walk','run','stairs']and not e['requiredAfterstepImpulses']:adjacency[e['source']].append(e['destination'])
    def reaches(a,b):
        seen={a};queue=[a]
        for n in queue:
            for other in adjacency[n]:
                if other not in seen:seen.add(other);queue.append(other)
        return b in seen
    assert reaches('poi-market','detail-market-upper-terrace') and reaches('detail-market-upper-terrace','poi-market')
    graph['publicConnectivity']={'status':'PASS directed topology only','marketTerraceReturn':True,'nodes':len(nodes),'edges':len(edges)}
    file=D/'V02_Detailed_Movement_Graph.json';file.write_text(json.dumps(graph,indent=2)+'\n')
    fields=['id','source','destination','ability','elevationChange','horizontalDistance','distance3D',
            'requiredAfterstepImpulses','requiredReplaySlots','expectedSeconds','timeEvidence','directionality',
            'difficulty','risk','failureRecovery','validation']
    with (D/'V02_Detailed_AbilityRoute_Matrix.csv').open('w',newline='')as f:
        writer=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');writer.writeheader()
        writer.writerows({k:json.dumps(e[k])if isinstance(e[k],dict)else e[k]for k in fields}for e in edges)
    m['graphSHA256']=sha(file);m['navigation']={'nodes':[nodes[n['id']]for n in m['navigation']['nodes']],
      'edges':[next(e for e in edges if e['id']==id)for id in public_edges]}
    m['navigationAuthority']='V02_Detailed_Movement_Graph.json; input validation is independently hash-bound'
    mp.write_text(json.dumps(m,indent=2)+'\n')
    for name in ['collisions.json','structure_ownership.json','threadrail_surfaces.json']:
        p=OUT/name;data=json.loads(p.read_text());data['sourceManifestSHA256']=sha(mp);p.write_text(json.dumps(data,indent=2)+'\n')
    print('Detailed graph:',len(nodes),'nodes,',len(edges),'directed edges;',len(public_edges),'public runtime edges')
    return sha(file)

if __name__=='__main__':build()
