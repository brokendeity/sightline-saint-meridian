"""Resolve one original billboard path; never invent unresolved emitter transforms."""
import gzip,hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets/nsunsc-library';KEY='c426d45069048ff1a4d4'
def readgz(path):return json.loads(gzip.decompress(path.read_bytes()))
def identity(path):return dict(path=str(path.relative_to(ROOT)),sha256=hashlib.sha256(path.read_bytes()).hexdigest())
def build():
 folder=ASSETS/KEY
 billboard=next(r for r in readgz(folder/'billboards.json.gz')['records'] if r['name']=='3mntspl1_aura05')
 assert hashlib.sha256((ROOT/billboard['rawUrl']).read_bytes()).hexdigest()==billboard['sha256']
 scene_path=ROOT/json.loads((folder/'index.json').read_text())['scene'];scene=readgz(scene_path)
 model=next(m for m in scene['models'] if m['name']==billboard['modelReference']['name'])
 materials=[m for m in scene['materials'] if m['name'] in model['materials']]
 textures=[t for t in scene['textures'] if t['name'] in {n for m in materials for n in m['textures']}]
 record=next(r for r in json.loads((ASSETS/'minato-effect-runtime.json').read_text())['records'] if r['name']=='3mntspl1_atk')
 sections=next(r for r in readgz(folder/'particle-sections.json.gz')['records'] if r['name']==record['name']);raw=(ROOT/record['rawUrl']).read_bytes();start=sections['sections'][0]['start']
 generators=[]
 for i in (13,31):
  config=dict(record['generators'][i]);config['forceFieldMask']=struct.unpack_from('>I',raw,start+i*208+24)[0]
  generators.append(dict(config=config,events=next(r['events'] for r in record['events'] if r['generator']==i),resources=[r for r in record['resources'] if r['generatorIndex']==i],attachments=[r for r in record['attachments'] if r['generatorIndex']==i]))
 addresses=['14134c4e0','1413917e0','1412c8110','1412c7b00','1412c7dd0','14130b200','14131b5c0','14131c560','1412c84b0','1412b8ca0','141280930','1411b6df0','1411ae650','141386b70','141385ec0']
 evidence=[]
 for a in addresses:
  p=ROOT/'output/rea-naruto/ghidra/full-export/main/functions'/a[:6]/(a+'.c')
  if not p.exists():p=ROOT/'output/rea-naruto/ghidra/full-export/main-final/functions'/a[:6]/(a+'.c')
  evidence.append(dict(function='0x'+a,**identity(p)))
 assembly=ROOT/'output/cinematic-collection/minato-sprite-assembly.json'
 if assembly.exists():evidence.append(dict(kind='static assembly and source constants; no execution',**identity(assembly)))
 result=dict(schemaVersion=1,id='source-billboard:3mntspl1_aura05',sourceBundle=KEY,status='resource geometry, texture, channel clock and emitter settings recovered; source spawning withheld',verified=False,billboard=billboard,scene=identity(scene_path),model=model,materials=materials,textures=[dict(t,sourceFile=identity(ROOT/t['url'])) for t in textures],generators=generators,
  channelBindings=[dict(channel=3,objectOffset='0xa0',materialOffset=None,meaning='billboard alpha',evidence='0x1412c7b00 / 0x1412c7dd0'),dict(channel=4,objectOffset='0x2c8',materialOffset='0x30',meaning='UV0 offset',evidence='0x1412c7b00 / 0x1412c7dd0'),dict(channel=5,objectOffset='0x2d0',materialOffset='0x50',meaning='UV0 scale',evidence='0x1412c7b00 / 0x1412c7dd0')],
  lifetime=dict(billboardLoop=True,billboardFrames=32,ticksPerFrame=50,ticksPerSecond=3000,animationSeconds=32*50/3000,generator13Updates=15,generator31Updates=12,randomLifetimeFraction=1,originalEquation='trunc(baseLifetimeUpdates + random(0, randomLifetimeFraction) * baseLifetimeUpdates)',generator13LifetimeUpdateRange=[15,30],generator31LifetimeUpdateRange=[12,24],nominalGeneratorUpdatesPerSecond=30,policy='The 15/12 values are BASE lifetimes, not fixed lifetimes. Resource loop duration does not determine particle lifetime. Particle-managed billboard updates and original global clock ordering remain separate from isolated 60 Hz resource audition.'),
  blockers=[dict(component='force-field state',function='0x141386b70 / 0x141385ec0',offsets=['generator+8','particle+0x200','manager+0x90'],reason='Both source generators select force-field mask 1. The runtime manager list, including proof of emptiness, is missing; silently assuming no forces would be invented original behavior.'),dict(component='distributed spawn input',function='0x14131c560',offsets=['generator+0x14','generator+0x18','positionAttachment+0x10','particle+0x108'],reason='Spherical equations recovered in explicit source-matrix API. Original global RNG state and source attachment normalization/scale input remain unverified.'),dict(component='camera facing input',function='0x1412c84b0',offsets=['camera+0x80','billboard+0x2bc','billboard+0x2b0'],reason='Exact camera-world-basis x scalar-Z-rotation x axis-scale API recovered. Source camera inverse/view attribution to the current browser composition remains to be verified.'),dict(component='material rendering',function='0x1412c7dd0',offsets=['billboard+0x2f4','billboard+0xa0'],reason='Atlas geometry/texture is available but original material blend/depth and shader bindings still need full-sequence comparison.')],evidence=evidence)
 path=ASSETS/'minato-sprite-path.json';path.write_text(json.dumps(result,indent=2)+'\n');return result
if __name__=='__main__':
 r=build();print(json.dumps(dict(id=r['id'],vertices=sum(len(m['attributes']['position']) for m in r['model']['meshes']),triangles=sum(len(m['faces']) for m in r['model']['meshes']),texture=r['textures'][0]['url'],spawning='withheld')))
