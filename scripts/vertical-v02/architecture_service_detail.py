"""Blender-authored maintenance architecture for the accepted service-yard space.

Loaded by the detailed authoring pipeline. All accepted cover/landing contact
boxes stay intact. The closed utility cabinet is a visible new physical volume;
its export must pass original-city and input-path clearance before admission.
"""
import math

def build(api):
    bpy=api['bpy'];add=api['add'];refine=api['refine_parts'];label=api['label']
    records=api['records'];materials=api['materials'];uv_mesh=api['uv_mesh']
    C='SM_V02_SERVICE_YARDS'
    by=lambda id:next(r for r in records if r['id']==id)
    # The complete original top remains present and walkable. Subtle recessed
    # panels and grille ribs refine the closed facade below it.
    for id in ['service-cover-west','service-cover-south','service-jump-shelf']:
        r=by(id);sx,sy,sz=r['size'];wall=.10;top=min(.13,sy*.14)
        parts=[([0,sy/2-top/2,0],[sx,top,sz],'deck'),
          ([0,-sy/2+top/2,0],[sx,top,sz],'steel'),
          ([-sx/2+wall/2,0,0],[wall,sy,sz],'steel'),
          ([sx/2-wall/2,0,0],[wall,sy,sz],'steel'),
          ([0,0,-sz/2+wall/2],[sx,sy,wall],'steel'),
          ([0,0,sz/2-.065],[sx-.2,sy-top*2,.07],'steel')]
        count=max(4,int(sx/.24))
        for i in range(count):
            x=-sx/2+.18+(sx-.36)*i/(count-1)
            parts.append(([x,0,sz/2-.008],[.045,max(.1,sy-.34),.016],'deck'))
        parts.append(([0,sy/2-.18,sz/2-.012],[max(.2,sx-.4),.035,.024],'cyan'))
        refine(id,parts)
    for id in ['service-overhead-post-82','service-overhead-post-90.5']:
        r=by(id);sx,sy,sz=r['size']
        refine(id,[([0,0,-.015],[sx,sy,sz-.03],'steel'),
          ([-sx/2+.08,0,sz/2-.015],[.16,sy,.03],'steel'),
          ([sx/2-.08,0,sz/2-.015],[.16,sy,.03],'steel'),
          ([0,0,sz/2-.015],[.065,sy-.6,.03],'cyan'),
          ([0,-sy/2+.18,0],[sx,.36,sz],'deck'),
          ([0,sy/2-.18,0],[sx,.36,sz],'deck')])
    # This north-edge cabinet leaves the public guide/stair approach to its
    # south clear. It communicates the platform's maintenance purpose without
    # claiming a new interactive console or changing encounter rules.
    r=add('detail-service-utility-bank',[76.9,53.8,312.9],[4.8,3.6,1.2],C,walkable=True,
          role='closed ventilation and power cabinet; no invented interaction')
    refine(r['id'],[
      ([0,-1.65,0],[4.8,.3,1.2],'steel'),([0,1.65,0],[4.8,.3,1.2],'steel'),
      ([-2.31,0,0],[.18,3.6,1.2],'steel'),([2.31,0,0],[.18,3.6,1.2],'steel'),
      ([0,0,-.55],[4.8,3.6,.1],'steel'),([0,0,.55],[4.44,3,.1],'deck'),
      *[([x,0,.575],[.07,3,.05],'steel')for x in [-.78,.78]],
      ([0,1.25,.59],[4.25,.045,.02],'warm')])

    def fan(id,p,radius=.54):
        # A real annular grille and five fan blades, built as a mesh in local
        # Blender coordinates; its face points toward game +Z.
        record=add(id,p,[radius*2,radius*2,.07],C,'steel',False,bevel=0,
          sourceSurface='detail-service-utility-bank',role='surface-mounted ventilation grille attached to the closed cabinet face')
        verts=[];faces=[];slots=[];steps=32;inner=radius*.82
        for depth in [-.035,.035]:
            for rr in [radius,inner]:
                verts.extend([(rr*math.cos(i*2*math.pi/steps),depth,rr*math.sin(i*2*math.pi/steps))for i in range(steps)])
        for i in range(steps):
            j=(i+1)%steps
            faces.extend([(i,j,steps+j,steps+i),(2*steps+i,3*steps+i,3*steps+j,2*steps+j),
                          (i,2*steps+i,2*steps+j,j),(steps+i,steps+j,3*steps+j,3*steps+i)])
            slots.extend([0,0,0,0])
        for blade in range(5):
            a=blade*math.tau/5;first=len(verts)
            shape=[(.08,a-.18),(inner*.91,a+.04),(inner*.91,a+.46),(.08,a+.35)]
            verts.extend([(rr*math.cos(t),-.025,rr*math.sin(t))for rr,t in shape])
            faces.append(tuple(first+j for j in range(4)));slots.append(1)
        mesh=bpy.data.meshes.new(id+'__grille');mesh.from_pydata(verts,[],faces);mesh.update()
        mesh.materials.append(materials['steel']);mesh.materials.append(materials['deck'])
        for poly,index in zip(mesh.polygons,slots):poly.material_index=index
        uv_mesh(mesh);bpy.data.objects[id].data=mesh
        return record

    for i,x in enumerate([75.35,76.9,78.45]):
        fan('detail-service-grille-'+str(i),[x,54.1,313.535])
        add('detail-service-vent-label-'+str(i),[x,52.85,313.505],[1.1,.07,.01],C,'warm',False,bevel=0,
            sourceSurface=r['id'],role='equipment indicator inset in cabinet face')
    label('detail-service-bank-label','MAINTENANCE / 52M',[76.9,55.22,313.507],4.2,C)
    # Actual inset steel linework on the existing walkable deck edge, not an
    # extra floor, gameplay obstacle, floating destination or false doorway.
    for i,x in enumerate([62.5,65.5,68.5]):
        add('detail-service-deck-edge-marker-'+str(i),[x,51.96,312.02],[1.4,.035,.025],C,'warm',False,bevel=0,
            sourceSurface='service-yard',role='flush fascia marker below the existing floor')
    return {'id':'service-maintenance-architecture','preservedContactRecords':[
        'service-cover-west','service-cover-south','service-jump-shelf',
        'service-overhead-post-82','service-overhead-post-90.5'],
        'newCabinet':'detail-service-utility-bank','status':'Authored; actual export, source and native input acceptance required'}
