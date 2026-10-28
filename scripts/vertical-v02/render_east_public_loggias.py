"""Saved-source public-room inspection; no runtime or reference-quality claim."""
import bpy
import hashlib
import json
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT/'development/vertical-city-v02'
OUT = DEV/'evidence/east-public-loggias'
OUT.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
author = json.loads((DEV/'V02_East_Public_Loggias_Authoring.json').read_text())
gate = json.loads((DEV/'V02_East_Public_Loggias_Master_Validation.json').read_text())
assert gate['status'].startswith('PASS')
assert gate['masterSHA256'] == author['masterSHA256'] == sha(ROOT/author['master'])
bpy.ops.wm.open_mainfile(filepath=str(ROOT/author['master']))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.render.threads_mode = 'FIXED'
scene.render.threads = 8
scene.render.resolution_x = 1280
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_depth = '8'
conversion = Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
views = [('public-entry-52',[97,53.65,309.2],[103.2,53.5,310],65),
         ('stacked-public-rooms',[87,41,290],[102,55,310],60)]
report = {'status':'RUNNING saved-source inspection','masterSHA256':author['masterSHA256'],
          'scriptSHA256':sha(Path(__file__)),'captures':[],
          'scope':'Actual saved source geometry with existing source lights and new emissive strips. '
                  'No browser render, gameplay entry, shader parity or full reference acceptance implied.'}
target = DEV/'V02_East_Public_Loggias_Blender.json'
target.write_text(json.dumps(report,indent=2)+'\n')
for name, pos, look, fov in views:
    position, focus = Vector(pos), Vector(look)
    direction = (focus-position).normalized()
    right = direction.cross(Vector((0,1,0))).normalized()
    up = right.cross(direction).normalized()
    game_matrix = Matrix((right,up,-direction)).transposed().to_4x4()
    game_matrix.translation = position
    data = bpy.data.cameras.new('East public room '+name)
    camera = bpy.data.objects.new(data.name,data)
    scene.collection.objects.link(camera)
    camera.matrix_world = conversion @ game_matrix
    data.sensor_fit = 'VERTICAL'
    data.sensor_height = 24
    data.lens = 12/math.tan(math.radians(fov/2))
    data.clip_start = .05
    data.clip_end = 1800
    scene.camera = camera
    file = OUT/(name+'.png')
    scene.render.filepath = str(file)
    bpy.ops.render.render(write_still=True)
    report['captures'].append({'id':name,'file':str(file.relative_to(ROOT)),
                               'sha256':sha(file),'position':pos,'lookAt':look,'fov':fov,'samples':64})
    target.write_text(json.dumps(report,indent=2)+'\n')
report['status'] = 'RENDERED saved-source room views; visual inspection and native acceptance pending'
target.write_text(json.dumps(report,indent=2)+'\n')
print(report['status'],flush=True)
