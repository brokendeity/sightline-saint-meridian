import sys,json,ctypes,hashlib,collections
from pathlib import Path
from extract_naruto_animation_probe import ROOT,OUT,decode
sys.path.insert(0,str(OUT/'Blender-XFBIN-Importer/xfbin_lib'))
from xfbin import read_xfbin
lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
rows=json.load(open(OUT.parent/'cpk-members.json'));results=[]
for name in ['2sskbod1.xfbin','2sskskl1.xfbin','2sskspl1.xfbin','3mntspl1.xfbin','characode.bin.xfbin']:
 r=next(x for x in rows if x['path']=='data/spc/'+name)
 with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);raw=f.read(r['stored_bytes'])
 buf=ctypes.create_string_buffer(r['unpacked_bytes']);size=ctypes.c_size_t();rc=lib.decode_nsunsc(raw,len(raw),buf,len(buf),ctypes.byref(size));assert rc==0 and size.value==r['unpacked_bytes'];b=buf.raw[:size.value]
 if name in ['2sskskl1.xfbin','characode.bin.xfbin']:assert b==decode(raw)
 p=OUT.parent/'full-library'/name;p.write_bytes(b);obj=read_xfbin(str(p));chunks=[c for page in obj.pages for c in page.chunks];types=collections.Counter(type(c).__name__ for c in chunks);anm=[c for c in chunks if type(c).__name__=='NuccChunkAnm'];result={'file':name,'types':dict(types),'animations':[]}
 for c in anm[:3]:
  result['animations'].append({'name':c.name,'duration':c.frame_count/3000,'entries':[(e.name,int(e.entry_format),[(v.data_path,len(v.keyframes)) for v in e.curves]) for e in c.entries[:6]],'clumps':[getattr(a,'name','') for a in c.clumps]})
 for c in chunks:
  if type(c).__name__=='NuccChunkModel' and getattr(c,'nud',None):
   for g in c.nud.mesh_groups[:1]:
    for m in g.meshes[:1]:result['meshSample']={'name':c.name,'coord_index':c.coord_index,'clump':c.clump_chunk.name,'fields':str(m.vertices.dtype),'first':str(m.vertices[0]),'faces':str(m.faces[:2]),'materials':[z.name for z in c.material_chunks]}
   break
 results.append(result);print(json.dumps(result)[:3000],flush=True)
(OUT.parent/'full-library/probe.json').write_text(json.dumps(results,indent=2))
