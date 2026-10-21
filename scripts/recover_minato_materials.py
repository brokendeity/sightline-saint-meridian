"""Read source NUD material selectors and NUP4 program pairs, never execute game."""
import ctypes,hashlib,json,struct
from pathlib import Path
from extract_nsunsc_library import ROOT,OUT,DEST,read_xfbin
BASE=Path(__file__).resolve().parents[1]
def program_pairs(data):
 if data[:4]!=b'NUP4':raise ValueError('Expected NUP4')
 pos=16;rows=[]
 while pos<len(data):
  if pos+4>len(data):raise ValueError('Truncated selector')
  selector=struct.unpack_from('<I',data,pos)[0];pos+=4;pair={'selector':selector,'selectorHex':hex(selector)}
  for stage in ['vertex','pixel']:
   if pos+4>len(data):raise ValueError('Truncated length')
   n=struct.unpack_from('<I',data,pos)[0];pos+=4
   if n<32 or pos+n>len(data) or data[pos:pos+4]!=b'DXBC' or struct.unpack_from('<I',data,pos+24)[0]!=n:raise ValueError('Invalid DXBC pair')
   b=data[pos:pos+n];pair[stage]={'offset':pos,'bytes':n,'sha256':hashlib.sha256(b).hexdigest(),'url':'assets/nsunsc-library/original-shaders/'+hashlib.sha256(b).hexdigest()+'.dxbc'};pos+=n
  rows.append(pair)
 return rows

def extract(key):
 r=json.loads((DEST/key/'index.json').read_text());lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
 with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
 b=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();assert lib.decode_nsunsc(raw,len(raw),b,len(b),ctypes.byref(size))==0;assert hashlib.sha256(b.raw[:size.value]).hexdigest()==r['sha256'];obj=read_xfbin(bytearray(b.raw[:size.value]));materials=[];models=[]
 for p in obj.pages:
  for c in p.chunks:
   if type(c).__name__=='NuccChunkMaterial' and getattr(c,'has_data',False):
    materials.append(dict(name=c.name,sourceChunkSha256=hashlib.sha256(c.data).hexdigest(),**{k:getattr(c,k,None) for k in ['alpha','glare','flags','UV0','UV1','UV2','UV3','BlendRate','BlendType','fallOff','outlineID']},textures=[x.name for g in c.texture_groups for x in g.texture_chunks]))
   if type(c).__name__=='NuccChunkModel' and getattr(c,'nud',None):
    rows=[];meshIndex=0
    for group in c.nud.mesh_groups:
     for mesh in group.meshes:
      for passIndex,m in enumerate(mesh.materials):
       rows.append(dict(meshIndex=meshIndex,passIndex=passIndex,**{k:getattr(m,k) for k in ['flags','sourceFactor','destFactor','alphaTest','alphaFunction','refAlpha','cullMode','unk1','unk2','zBufferOffset']},properties=[dict(name=x.name,values=x.values) for x in m.properties],textures=[vars(x) for x in m.textures]))
      meshIndex+=1
    models.append(dict(name=c.name,materials=[x.name for x in c.material_chunks],meshes=rows))
 return dict(bundle=key,sourceSha256=r['sha256'],materials=materials,models=models)
def build():
 package=ROOT/'data/system/nuccMaterial_dx11.nsh';pairs=program_pairs(package.read_bytes());scene=json.loads(__import__('gzip').decompress((DEST/'c426d45069048ff1a4d4/scene.json.gz').read_bytes()));keys={'c426d45069048ff1a4d4'}
 index=json.loads((DEST/'anm-bindings-index.json').read_text())
 # Exact rig dependencies are selected by the native viewer; include Minato body bundles containing the named model rig.
 for p in DEST.glob('*/index.json'):
  r=json.loads(p.read_text())
  if r.get('path','').endswith('/3mntbod1.xfbin'):keys.add(p.parent.name)
 bundles=[extract(k) for k in sorted(keys)];selectors={m['flags'] for b in bundles for model in b['models'] for m in model['meshes']};matched=[p for p in pairs if p['selector'] in selectors]
 return dict(schemaVersion=1,id='source:minato-materials',sourcePackage=dict(path=str(package),sha256=hashlib.sha256(package.read_bytes()).hexdigest()),bundles=bundles,shaderPairs=matched,allSelectorCount=len(pairs),translatedSelectors=[0x1f002],translation=dict(selector=0x1f002,pixelProgramSha256=next(p['pixel']['sha256'] for p in matched if p['selector']==0x1f002),equations=['sample=texture0(uv)','alpha=sample.a*inputColor.a','discard if cb0[0].x >= alpha','alpha *= cb0[0].y','rgb=(sample.rgb*inputColor.rgb-g_fogColor.rgb)*inputFogFactor+g_fogColor.rgb'],constantBufferMap={'g_commonParam':{'offset':0,'bytes':16,'x':'alpha threshold','y':'alpha scale'},'g_fogColor':{'offset':16,'bytes':16},'g_fogParam':{'offset':32,'bytes':16},'g_ambientColor':{'offset':48,'bytes':16},'g_matWorldViewProj':{'offset':64,'bytes':64},'g_uvOffset0':{'offset':128,'bytes':16},'g_multColor':{'offset':192,'bytes':16}},vertexEquations=['clipPosition=sourceWorldViewProjection*position','inputColor.rgb=vertexColor.rgb*g_multColor.rgb*g_ambientColor.rgb','inputColor.a=vertexColor.a','uv=uv0*g_uvOffset0.zw+g_uvOffset0.xy','inputFogFactor=1+g_fogParam.z*((g_fogParam.y-clipPosition.w)/(g_fogParam.y-g_fogParam.x)-1)'],unresolved=['Exact source constant-buffer values for the runtime material instance','Source vertex declaration mapping and deformation agreement; constant-buffer addresses have reflection-backed names and offsets','Second render target, source draw order and original framebuffer postprocessing','Render-state enum translation requires executable evidence; raw source factors are preserved']),limits=['Shader pair selector equality recovered from sequential package records and original NUD flags. Runtime permutation selection still unverified.','Only selector 0x1f002 pixel color equation translated. Others are explicitly inspection fallbacks.','Browser inspection uses declared parameter defaults; it is not verified original shading.'])
if __name__=='__main__':
 r=build();p=DEST/'minato-material-evidence.json';p.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(dict(path=str(p),bundles=len(r['bundles']),models=sum(len(b['models']) for b in r['bundles']),selectors=len(r['shaderPairs']))))
