"""Author a local warm-neutral reflected-fill interpretation in the new master.

The source fixture-weight atlas, light count and all original materials/assets
remain immutable. This color calibration is authored, not measured light transport.
"""
import bpy,json,hashlib
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();file=D/'V02_Coffered_Authoring.json';report=json.loads(file.read_text());master=R/report['master'];assert sha(master)==report['masterSHA256'];bpy.ops.wm.open_mainfile(filepath=str(master));oldFile=R/'assets/city/vertical-v02/visual/soffit_fill.json';old=json.loads(oldFile.read_text());new={**old,'status':'Authored warm-neutral reflected-fill calibration for coffered architecture; not physical light transport','colorLinear':[.14,.085,.04],'sourceDefinitionSHA256':sha(oldFile),'calibrationScope':'Downward-facing source architecture only, existing232fixture atlas/twelve elevations. No light/exposure/bloom changes.'};definition=R/'assets/city/vertical-v02/coffered/soffit_fill.json';definition.write_text(json.dumps(new,indent=2)+'\n')
for name in ['V02_deck','V02_steel']:
 m=bpy.data.materials[name];nodes=[n for n in m.node_tree.nodes if n.type=='EMISSION'];assert len(nodes)==1,name;node=nodes[0];assert max(abs(node.inputs['Color'].default_value[i]-old['colorLinear'][i])for i in range(3))<.000001;node.inputs['Color'].default_value=(*new['colorLinear'],1);m['cofferedFillDefinitionSHA256']=sha(definition)
bpy.ops.wm.save_as_mainfile(filepath=str(master));report['masterSHA256']=sha(master);report['lookFinish']={'definition':str(definition.relative_to(R)),'sha256':sha(definition),'scriptSHA256':sha(Path(__file__)),'oldColorLinear':old['colorLinear'],'colorLinear':new['colorLinear'],'scope':new['calibrationScope']};file.write_text(json.dumps(report,indent=2)+'\n');print('Authored local coffered finish',new['colorLinear'])
