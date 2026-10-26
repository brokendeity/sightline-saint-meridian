"""Independently inspect saved reference-only Blender face appearance."""
import bpy,hashlib,json,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
draft='--draft'in sys.argv
master=D/'blender'/('SaintMeridian_V02_Service_Architecture_Draft.blend'if draft else'SaintMeridian_V02_Detailed_Master.blend')
assert Path(bpy.data.filepath).resolve()==master
file=D/'V02_Reference_Appearance.json';a=json.loads(file.read_text())
world=json.loads((D/'V02_LiveWorld_Authoritative.json').read_text())
source={b['id']:b for b in world['buildings']};refs=bpy.data.collections['SM_EXISTING_REFERENCE']
assert len(refs.objects)==len(source)==310
rows=[];maximum=0
for family in a['families']:
    objects=[o for o in refs.objects if source[o.name]['family']==family['family']]
    meshes={o.data for o in objects};assert len(meshes)==1
    mesh=meshes.pop();assert len(mesh.polygons)==family['triangles'];assert len(mesh.materials)==len(family['palette'])
    for material,palette in zip(mesh.materials,family['palette']):
        b=material.node_tree.nodes.get('Principled BSDF');color=list(b.inputs['Base Color'].default_value)[:3];emission=list(b.inputs['Emission Color'].default_value)[:3]
        error=max(abs(x-y)for x,y in zip(color+emission,palette['color']+palette['emission']));maximum=max(maximum,error)
        assert error<1e-7
        assert max(abs(x-y)for x,y in zip(list(material.diffuse_color)[:3],palette['color']))<1e-7
    for face,index in zip(mesh.polygons,family['faceMaterials']):assert face.material_index==index
    for o in objects:assert o['referenceAppearanceSHA256']==sha(file) and o['export']is False
    rows.append({'family':family['family'],'objects':len(objects),'faces':len(mesh.polygons),'palette':len(mesh.materials)})
metadata=json.loads((R/'assets/city/vertical-v02/detailed/manifest.json').read_text())
assert not any(id in source for c in metadata['chunks']for id in c['recordIDs'])
report={'status':'PASS saved reference-only face palette and emission correspondence',
 'scope':__doc__.strip()+' Principled materials are an authoring interpretation. Original-game shader/lighting and browser reference matching remain separate.',
 'masterSHA256':sha(master),'sourceAppearanceSHA256':sha(file),'families':rows,'objects':sum(x['objects']for x in rows),
 'maximumColorEmissionError':maximum,'originalCopiesExported':0}
(D/('V02_Reference_Appearance_Draft_Validation.json'if draft else'V02_Reference_Appearance_Validation.json')).write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],report['objects'],'reference objects')
