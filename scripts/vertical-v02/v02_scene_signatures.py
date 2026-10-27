import bpy,json,hashlib,array
def signatures():
 cache={};result={}
 for o in bpy.data.objects:
  data={'type':o.type,'matrix':[list(row)for row in o.matrix_world],'properties':dict(o.items())}
  if o.type=='MESH':
   key=o.data.as_pointer()
   if key not in cache:
    raw=b''
    for prop,n,src in [('co',3,o.data.vertices),('normal',3,o.data.vertices)]:
     a=array.array('f',[0])*(len(src)*n);src.foreach_get(prop,a);raw+=a.tobytes()
    for uv in o.data.uv_layers:
     a=array.array('f',[0])*(len(uv.data)*2);uv.data.foreach_get('uv',a);raw+=a.tobytes()
    cache[key]=hashlib.sha256(raw+json.dumps([(list(p.vertices),p.material_index)for p in o.data.polygons]).encode()).hexdigest()
   data['mesh']=cache[key];data['materials']=[m.name if m else None for m in o.data.materials]
  result[o.name]=hashlib.sha256(json.dumps(data,sort_keys=True,default=str).encode()).hexdigest()
 return result
