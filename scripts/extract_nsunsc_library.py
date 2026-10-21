"""Resumable native XFBIN scene/curve extraction. Never executes the source game."""
import sys,json,gzip,re,hashlib,ctypes,tempfile,os,collections,concurrent.futures,argparse,io,math
from pathlib import Path
import numpy as np
from extract_naruto_animation_probe import ROOT,OUT
BASE=Path(__file__).resolve().parents[1];DEST=BASE/'assets/nsunsc-library';DEST.mkdir(exist_ok=True)
sys.path.insert(0,str(OUT/'Blender-XFBIN-Importer/xfbin_lib'))
from xfbin import read_xfbin
from xfbin.structure.dds import NutTexture_to_DDS
from PIL import Image

from xfbin.structure.anm import AnmEntry
from xfbin.structure.nucc import NuccChunkTexture,ClumpModelGroup
original_entry_init=AnmEntry.init_data
parse_issues=[]
def bounded_entry(self,entry,*args):
 try:return original_entry_init(self,entry,*args)
 except IndexError:
  self.name=f'unresolved-target-{entry.clump_index}-{entry.bone_index}';self.clump=None;self.bone=None;self.material=None;self.chunk=None;self.entry_format=entry.entry_format;self.curves=[]
  parse_issues.append(self.name)
AnmEntry.init_data=bounded_entry

original_texture_init=NuccChunkTexture.init_data
def bounded_texture(self,chunk,*args):
 if getattr(chunk,'brNut',None) is None:
  self.data=chunk.data;self.nut=None;self.has_data=True;self.has_props=False;parse_issues.append('Unsupported texture container: '+self.name);return
 return original_texture_init(self,chunk,*args)
NuccChunkTexture.init_data=bounded_texture

original_group_init=ClumpModelGroup.init_data
def bounded_group(self,*args):
 try:return original_group_init(self,*args)
 except IndexError:parse_issues.append('Unresolved model coordinate in clump model group')
ClumpModelGroup.init_data=bounded_group

def safe(v):
 if isinstance(v,np.ndarray):return safe(v.tolist())
 if isinstance(v,np.generic):return safe(v.item())
 if isinstance(v,(tuple,list)):return [safe(x) for x in v]
 if isinstance(v,dict):return {k:safe(x) for k,x in v.items()}
 if isinstance(v,float) and not math.isfinite(v):return None
 return v

def texture_image(tex):
 if tex.pixel_format in (6,7,8,14,17):
  from xfbin.structure.dds import nut_pf_bitmasks
  masks=next(k for k,v in nut_pf_bitmasks.items() if v==tex.pixel_format)
  bits=16 if tex.pixel_format in (6,7,8) else 32
  v=np.frombuffer(bytes(tex.texture_data),dtype='>u2' if bits==16 else '>u4',count=tex.width*tex.height).astype(np.uint32)
  channels=[]
  for i,mask in enumerate(masks):
   if not mask:channels.append(np.full(v.shape,255 if i==3 else 0,dtype=np.uint8));continue
   shift=(mask & -mask).bit_length()-1;maximum=mask>>shift
   channels.append((((v&mask)>>shift)*255/maximum).astype(np.uint8))
  return Image.fromarray(np.stack(channels,axis=-1).reshape(tex.height,tex.width,4),'RGBA')
 return Image.open(io.BytesIO(NutTexture_to_DDS(tex)))

def extract(r):
 key=hashlib.sha256((r['archive']+'::'+r['path']).encode()).hexdigest()[:20];dest=DEST/key;meta=dest/'index.json'
 if meta.exists():return json.loads(meta.read_text())
 dest.mkdir(exist_ok=True)
 result=dict(key=key,**r,animations=[],errors=[])
 try:
  parse_issues.clear()
  lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
  buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();rc=lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size));assert rc==0 and size.value==r['unpacked_bytes'],f'decode {rc}'
  decoded=buf.raw[:size.value];result['sha256']=hashlib.sha256(decoded).hexdigest()
  with tempfile.NamedTemporaryFile(suffix='.xfbin') as tmp:
   tmp.write(decoded);tmp.flush();obj=read_xfbin(tmp.name)
  chunks=[c for p in obj.pages for c in p.chunks];scene=dict(version=1,source=result.copy(),rigs=[],models=[],materials=[],textures=[],animations=[],references=[],unsupported=[])
  result['errors'].extend('Unresolved animation target: '+x for x in parse_issues)
  result['types']=dict(collections.Counter(type(c).__name__ for c in chunks))
  seen=set()
  for c in chunks:
   identity=(type(c).__name__,getattr(c,'file_path',''),c.name)
   if identity in seen:continue
   seen.add(identity);typ=type(c).__name__
   scene['references'].append(dict(type=typ,name=c.name,path=getattr(c,'file_path',''),hasData=bool(getattr(c,'has_data',False))))
   if typ=='NuccChunkClump' and getattr(c,'coord_chunks',None):
    coords=c.coord_chunks;ids={id(x.node):i for i,x in enumerate(coords)}
    scene['rigs'].append(dict(name=c.name,bones=[dict(name=x.name,parent=ids.get(id(x.node.parent),-1),position=safe(x.node.position),rotation=safe(x.node.rotation),scale=safe(x.node.scale)) for x in coords]))
   if typ=='NuccChunkAnm' and hasattr(c,'entries'):
    clumps=list(c.clumps);ci={id(x):i for i,x in enumerate(clumps)}
    a=dict(name=c.name,duration=c.frame_count/3000,frameCount=c.frame_count,frameSize=c.frame_size,loop=c.loop_flag,clumps=[dict(name=x.name,reference=getattr(x,'referenced_name',x.name),bones=[dict(name=b.name,parent=getattr(b.parent,'name',None)) for b in x.bones]) for x in clumps],entries=[])
    for e in c.entries:
     a['entries'].append(dict(name=e.name,format=int(e.entry_format),clump=ci.get(id(e.clump),-1),curves=[dict(path=v.data_path,keys=[[k.frame/3000,safe(k.value)] for k in v.keyframes]) for v in e.curves]))
    for entry in a['entries']:
     valid=[]
     for curve in entry['curves']:
      if 'null' in json.dumps(curve['keys']):result['errors'].append('Non-finite curve excluded: '+a['name']+'/'+entry['name']+'/'+curve['path'])
      else:valid.append(curve)
     entry['curves']=valid
    idx=len(scene['animations']);scene['animations'].append(a)
    result['animations'].append(dict(name=a['name'],duration=a['duration'],index=idx,clumps=[x['name'] for x in a['clumps']],formats=dict(collections.Counter(e['format'] for e in a['entries']))))
   if typ=='NuccChunkModel' and getattr(c,'nud',None):
    meshes=[]
    for g in c.nud.mesh_groups:
     for mi,m in enumerate(g.meshes):
      fields=m.vertices.dtype.names;v=m.vertices
      meshes.append(dict(attributes={n:safe(v[n].astype(float)) for n in fields if n in ['position','normal','bone_ids','bone_weights','uv0','color']},faces=safe(m.faces),material=mi))
    scene['models'].append(dict(name=c.name,rig=getattr(c.clump_chunk,'name',None),coord=c.coord_index,flags=int(c.rigging_flag),materials=[x.name for x in c.material_chunks],meshes=meshes))
   if typ=='NuccChunkMaterial' and getattr(c,'has_data',False):
    scene['materials'].append(dict(name=c.name,alpha=getattr(c,'alpha',1),textures=[x.name for g in getattr(c,'texture_groups',[]) for x in g.texture_chunks]))
   if typ=='NuccChunkTexture' and getattr(c,'nut',None):
    for ti,tex in enumerate(c.nut.textures):
     tid=hashlib.sha256((c.name+str(ti)).encode()).hexdigest()[:12]+'.png'
     try:texture_image(tex).save(dest/tid);scene['textures'].append(dict(name=c.name,index=ti,url=f'assets/nsunsc-library/{key}/{tid}'))
     except Exception as ex:result['errors'].append('Texture '+c.name+': '+str(ex)[:120])
   if 'Particle' in typ or typ in ['NuccChunkBinary','NuccChunkBillboard'] or (typ=='NuccChunkTexture' and not getattr(c,'nut',None)):
    data=getattr(c,'data',b'') or b''
    if isinstance(data,(bytes,bytearray)) and data:
     fn='raw-'+hashlib.sha256(data).hexdigest()+'.bin';(dest/fn).write_bytes(data)
     scene['unsupported'].append(dict(name=c.name,type=typ,bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),url=f'assets/nsunsc-library/{key}/{fn}'))
  result.update(status='extracted',rigNames=[x['name'] for x in scene['rigs']],rigs=len(scene['rigs']),models=len(scene['models']),textures=len(scene['textures']),unsupported=scene['unsupported'],scene=f'assets/nsunsc-library/{key}/scene.json.gz',references=scene['references'])
  (dest/'scene.json.gz').write_bytes(gzip.compress(json.dumps(safe(scene),separators=(',',':'),allow_nan=False).encode(),compresslevel=3,mtime=0))
 except Exception as ex:result.update(status='failed',error=f'{type(ex).__name__}: {ex}')
 meta.write_text(json.dumps(result,separators=(',',':')));return result

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--limit',type=int);ap.add_argument('--workers',type=int,default=4);ap.add_argument('--family');args=ap.parse_args()
 rows=json.load(open(OUT.parent/'cpk-members.json'))
 rows=[r for r in rows if re.match(r'data/spc/[0-9][a-z0-9]{3}.*\.xfbin$',r['path']) or re.match(r'data/(?:spc/)?(?:efb|efc)',r['path'])]
 if args.family:rows=[r for r in rows if '/'+args.family in r['path']]
 if args.limit:rows=rows[:args.limit]
 results=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
  for r in pool.map(extract,rows,chunksize=1):
   results.append(r)
   if len(results)%25==0:print(json.dumps(dict(done=len(results),total=len(rows),failed=sum(x['status']=='failed' for x in results),motions=sum(len(x['animations']) for x in results))),flush=True)
 (DEST/'extraction.json').write_text(json.dumps(results,separators=(',',':')))
 print('FINISHED',len(results),'bundles',sum(len(x['animations']) for x in results),'motions',sum(x['status']=='failed' for x in results),'failed',flush=True)
