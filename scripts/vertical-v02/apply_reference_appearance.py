"""Apply recovered original face appearance to Blender reference meshes only."""
import hashlib,json

def apply(bpy,R,D):
    sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    p=D/'V02_Reference_Appearance.json';a=json.loads(p.read_text())
    assert a['status'].startswith('PASS recovered original face colors')
    assert a['sourceEntrySHA256']==sha(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html')
    assert a['sourceGeometrySHA256']==sha(D/'V02_BuildingGeometry.json')
    world=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
    reference=bpy.data.collections['SM_EXISTING_REFERENCE'];assert len(reference.objects)==310
    family_by_id={b['id']:b['family']for b in world['buildings']}
    changed=[]
    for f in a['families']:
        assert sha(R/f['sourceGLB'])==f['sourceGLBSHA256']
        objects=[o for o in reference.objects if family_by_id[o.name]==f['family']]
        meshes={o.data for o in objects};assert len(meshes)==1
        mesh=meshes.pop();assert len(mesh.polygons)==f['triangles']
        mesh.materials.clear()
        for i,palette in enumerate(f['palette']):
            mat=bpy.data.materials.new('SM_REF_family'+str(f['family'])+'_palette'+str(i));mat.use_nodes=True
            mat.diffuse_color=(*palette['color'],1)
            bsdf=mat.node_tree.nodes.get('Principled BSDF')
            bsdf.inputs['Base Color'].default_value=(*palette['color'],1)
            bsdf.inputs['Metallic'].default_value=.48;bsdf.inputs['Roughness'].default_value=.45
            bsdf.inputs['Emission Color'].default_value=(*palette['emission'],1)
            bsdf.inputs['Emission Strength'].default_value=1
            mesh.materials.append(mat)
        for face,index in zip(mesh.polygons,f['faceMaterials']):face.material_index=index
        for o in objects:
            o['referenceAppearanceSHA256']=sha(p);o['export']=False
        changed.append({'family':f['family'],'objects':len(objects),'triangles':len(mesh.polygons),'palette':len(f['palette'])})
    assert sum(r['objects']for r in changed)==310
    return {'sourceSHA256':sha(p),'families':changed,'objects':310,
      'scope':'Original source-face colors/emission on reference-only geometry. Principled shading is a Blender interpretation, not runtime-toon visual certification.'}
