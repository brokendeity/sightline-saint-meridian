from pathlib import Path
import json,struct,hashlib,shutil,io
from PIL import Image
root=Path(__file__).resolve().parents[1];out=root/'assets/city/tripo';records=[]
for kind,task in [('barrier','900243fe-8813-47d1-84c0-d602e2e167a3'),('planter','7bedbba7-e3db-4691-a900-f2d04b76c31a')]:
 src=Path.home()/'Downloads'/f'neon street {kind} 3d model.glb';shutil.copy2(src,out/'source'/f'{kind}.glb');b=src.read_bytes();n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);binary=b[28+n:];images={im['bufferView']:im for im in j['images']};data=bytearray()
 for i,v in enumerate(j['bufferViews']):
  blob=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
  if i in images:
   image=Image.open(io.BytesIO(blob)).convert('RGB');image.thumbnail((1024,1024),Image.Resampling.LANCZOS);buf=io.BytesIO();image.save(buf,format='PNG' if images[i]['mimeType']=='image/png' else 'JPEG',**({'optimize':True} if images[i]['mimeType']=='image/png' else {'quality':90}));blob=buf.getvalue()
  while len(data)%4:data.append(0)
  v['byteOffset']=len(data);v['byteLength']=len(blob);data.extend(blob)
 while len(data)%4:data.append(0)
 j['buffers'][0]['byteLength']=len(data);js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4);result=struct.pack('<III',0x46546c67,2,28+len(js)+len(data))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(data),0x004e4942)+data;dest=out/f'{kind}.glb';dest.write_bytes(result);records.append({'id':kind,'task':task,'sourceSha256':hashlib.sha256(b).hexdigest(),'runtimeSha256':hashlib.sha256(result).hexdigest(),'sourceBytes':len(b),'runtimeBytes':len(result),'textureMax':1024,'sourcePage':f'https://studio.tripo3d.ai/workspace/generate/{task}'})
(out/'manifest.json').write_text(json.dumps(records,indent=2)+'\n');print(json.dumps(records,indent=2))
