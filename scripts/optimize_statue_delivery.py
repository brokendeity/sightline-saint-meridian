"""Create a texture-bounded local delivery GLB without altering the source asset."""
import io,json,struct,hashlib
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'buildings/mystical_statue/mystical+statue+3d+model-gglb version.glb'
TARGET=ROOT/'buildings/mystical_statue/browser-statue.glb'
b=SOURCE.read_bytes();magic,version,total=struct.unpack_from('<III',b)
assert magic==0x46546c67 and version==2
length,kind=struct.unpack_from('<II',b,12);data=json.loads(b[20:20+length]);offset=20+length
bin_length,bin_kind=struct.unpack_from('<II',b,offset);blob=b[offset+8:offset+8+bin_length]
images={image['bufferView']:image for image in data.get('images',[]) if 'bufferView' in image}
new=bytearray();audit=[]
for i,view in enumerate(data['bufferViews']):
 old=blob[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
 payload=old
 if i in images:
  image=images[i];im=Image.open(io.BytesIO(old));original=im.size;im.thumbnail((2048,2048),Image.Resampling.LANCZOS)
  out=io.BytesIO();color='color' in image.get('name','').lower()
  if color:
   im.convert('RGB').save(out,format='JPEG',quality=88,optimize=True);image['mimeType']='image/jpeg'
  else:
   im.convert('RGB').save(out,format='PNG',optimize=True);image['mimeType']='image/png'
  payload=out.getvalue();audit.append({'name':image.get('name'), 'sourceSize':original,'deliveredSize':im.size,'sourceBytes':len(old),'deliveredBytes':len(payload)})
 while len(new)%4:new.append(0)
 view['byteOffset']=len(new);view['byteLength']=len(payload);new.extend(payload)
while len(new)%4:new.append(0)
data['buffers'][0]['byteLength']=len(new)
data.setdefault('asset',{}).setdefault('extras',{}).update({'deliverySourceSHA256':hashlib.sha256(b).hexdigest(),'textureLimit':2048})
j=json.dumps(data,separators=(',',':')).encode();j+=b' ' *((-len(j))%4)
result=struct.pack('<III',0x46546c67,2,12+8+len(j)+8+len(new))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(new),0x004e4942)+new
TARGET.write_bytes(result)
report={'source':str(SOURCE.relative_to(ROOT)),'target':str(TARGET.relative_to(ROOT)),'sourceBytes':len(b),'deliveredBytes':len(result),'ratio':round(len(result)/len(b),3),'geometryChanged':False,'images':audit}
report_path=ROOT/'output/action-redesign/statue-delivery.json';report_path.parent.mkdir(parents=True,exist_ok=True);report_path.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
