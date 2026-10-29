"""Precise, graph-backed wayfinding artwork; no generated or invented lore."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
O=R/'assets/city/vertical-v02/furnished-public-rooms';O.mkdir(exist_ok=True)
graph=D/'V02_East_Public_Room_Movement_Graph.json';g=json.loads(graph.read_text())
levels=[(128,'OBSERVATION'),(100,'TRANSIT INTERCHANGE'),(84,'UPPER GALLERY'),(52,'SERVICE GALLERY'),(24,'LOWER GALLERY'),(0,'STREET ACCESS')]
assert all(any(abs(n['position'][1]-y)<.01 for n in g['nodes'])for y,_ in levels)
font=lambda size,bold=False:ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial'+(' Bold'if bold else '')+'.ttf',size)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();files=[]
for floor in [24,52,84]:
 im=Image.new('RGB',(1536,768),(9,20,29));a=ImageDraw.Draw(im)
 a.rectangle((0,0,1535,7),fill=(92,223,237));a.text((64,43),'SAINT MERIDIAN',font=font(30,True),fill=(111,221,232))
 a.text((64,91),f'LEVEL {floor:02d}  /  PUBLIC GALLERY',font=font(52,True),fill=(235,241,239))
 a.text((64,164),'DISTRICT CONNECTIONS',font=font(24),fill=(166,184,194))
 a.line((91,250,91,646),fill=(86,157,174),width=8)
 for i,(y,label)in enumerate(levels):
  cy=250+i*77;here=y==floor;c=(255,202,121)if here else(155,184,195)
  if here:a.rounded_rectangle((62,cy-28,875,cy+33),radius=8,fill=(39,51,57))
  a.ellipse((80,cy-11,102,cy+11),fill=c);a.text((127,cy-23),f'{y:03d} m',font=font(31,True),fill=c)
  a.text((270,cy-23),label,font=font(31,here),fill=c)
  if here:a.text((690,cy-18),'YOU ARE HERE',font=font(22,True),fill=c)
 a.line((934,235,934,676),fill=(57,79,91),width=2)
 a.text((990,245),'PUBLIC ROUTE',font=font(28,True),fill=(111,221,232))
 for i,t in enumerate(['Exit to the gallery.','Follow the public stair','connections between levels.']):a.text((990,303+i*43),t,font=font(25),fill=(223,230,231))
 a.text((990,488),'NO DRIVE CHARGE',font=font(25,True),fill=(255,202,121));a.text((990,527),'REQUIRED',font=font(25,True),fill=(255,202,121))
 a.text((990,613),'Walking route to transit',font=font(24),fill=(166,184,194));a.text((990,650),'via the public stairs',font=font(24),fill=(166,184,194))
 a.text((64,716),'PUBLIC CIRCULATION  /  HEIGHTS ABOVE STREET LEVEL',font=font(22),fill=(143,168,181))
 p=O/f'wayfinding-{floor}.png';im.save(p);files.append({'floor':floor,'file':str(p.relative_to(R)),'sha256':sha(p),'size':[1536,768]})
out={'status':'SOURCE ART: graph heights checked; in-world texture orientation/readability pending','graph':str(graph.relative_to(R)),'graphSHA256':sha(graph),'scriptSHA256':sha(Path(__file__)),'levels':levels,'files':files}
(D/'V02_Public_Room_Boards.json').write_text(json.dumps(out,indent=2)+'\n');print(out['status'])
