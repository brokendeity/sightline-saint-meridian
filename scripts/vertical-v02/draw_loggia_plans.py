"""Current component-envelope drawings from independent saved-source bounds.

These are measured coordination drawings, not triangle-exact construction plans
or native traversal certification. Reference/source/master identities are bound.
"""
from pathlib import Path
import hashlib,json,html
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';O=D/'drawings/loggia-terraces';O.mkdir(parents=True,exist_ok=True)
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
a=read(D/'V02_Loggia_Terraces_Authoring.json');v=read(D/'V02_Loggia_Terraces_Master_Validation.json');plan=read(D/'V02_Loggia_Terraces_Plan.json');b=read(D/'V02_Loggia_Terraces_Build.json');assert sha(R/a['master'])==a['masterSHA256']==v['masterSHA256'];assert sha(D/'V02_Loggia_Terraces_Plan.json')==v['planSHA256']
records={r['id']:r for r in plan['additions']+[c['after']for c in plan['changes']]};rows=v['results'];assert len(rows)==3115
font='/System/Library/Fonts/Menlo.ttc'
class Sheet:
 def __init__(self,title,subtitle):
  self.image=Image.new('RGB',(1500,1100),'#071622');self.draw=ImageDraw.Draw(self.image);self.svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1100" viewBox="0 0 1500 1100"><rect width="1500" height="1100" fill="#071622"/>'];self.text(40,24,title,'#e0edf5',24);self.text(40,65,subtitle,'#e6bb7b',14)
 def text(self,x,y,t,c='#a6c2d5',size=13):
  self.draw.text((x,y),t,fill=c,font=ImageFont.truetype(font,size));self.svg.append(f'<text x="{x}" y="{y+size}" fill="{c}" font-family="monospace" font-size="{size}">{html.escape(t)}</text>')
 def rect(self,x,y,w,h,c,stroke=None,title=''):
  self.draw.rectangle((x,y,x+w,y+h),fill=c,outline=stroke,width=1);self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" stroke="{stroke or c}"><title>{html.escape(title)}</title></rect>')
 def line(self,x,y,xx,yy,c='#233c50',width=1):
  self.draw.line((x,y,xx,yy),fill=c,width=width);self.svg.append(f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{c}" stroke-width="{width}"/>')
 def save(self,name):
  self.text(40,965,'Cyan: supported floor tops | Amber: treads/landings | Blue: intersecting solid component bounds',size=14)
  self.text(40,997,'SOURCE ENVELOPES ONLY. No implied doors, walk links or structural engineering approval.',size=14)
  self.text(40,1028,'Saved Blender master SHA256 '+a['masterSHA256'],size=12)
  self.text(40,1052,'Manifest '+b['manifestSHA256']+' | detailed provenance in JSON',size=11)
  png=O/(name+'.png');svg=O/(name+'.svg');self.image.save(png);svg.write_text('\n'.join(self.svg+['</svg>']));return[png,svg]
files=[];panels=[]
s=Sheet('SAINT MERIDIAN V02 | PUBLIC LOGGIA FLOOR PLANS','Saved-source component bounds | same scale X/Z | world metres, +Z downward | geometry-only evidence')
for i,floor in enumerate([40,68,100]):
 left=65+i*485;top=160;scale=22;xmin=27;zmin=280
 def p(x,z):return left+(x-xmin)*scale,top+(z-zmin)*scale
 s.text(left,112,'Y '+str(floor)+' m | public shelter',size=19)
 for x in range(28,46,2):
  xx,yy=p(x,280);s.line(xx,yy,xx,yy+29*scale);s.text(xx-8,top+29*scale+9,str(x))
 for z in range(280,310,2):
  xx,yy=p(xmin,z);s.line(xx,yy,xx+18*scale,yy);s.text(left-40,yy-7,str(z))
 floors=[r for r in rows if r['walkable']and abs(r['actualBounds']['max'][1]-floor)<.03]
 solids=[r for r in rows if r['solid']and r['actualBounds']['min'][1]<floor+1 and r['actualBounds']['max'][1]>floor+.2]
 for group in [floors,solids]:
  for r in group:
   q=r['actualBounds'];x,y=p(q['min'][0],q['min'][2]);xx,yy=p(q['max'][0],q['max'][2]);c='#b48a4d'if records[r['id']].get('stair')else'#367b91'if r in floors else'#34475c';s.rect(x,y,max(.6,xx-x),max(.6,yy-y),c,'#6ba8b9',r['id'])
 s.text(left,850,'8.8 x 8 m shelter walking floor',size=14);s.text(left,877,'Access through open front at Z296',size=13)
 panels.append({'floor':floor,'supportedTopIDs':[r['id']for r in floors],'intersectingSolidIDs':[r['id']for r in solids],'solidSliceY':floor+1})
files+=s.save('V02_Loggia_Source_Floor_Plans')
s=Sheet('SAINT MERIDIAN V02 | SWITCHBACK STAIR SECTIONS','Saved-source component-envelope cuts | X=33.8 / 39.0 m | +Z horizontal, +Y vertical | scales differ')
for i,xplane in enumerate([33.8,39.0]):
 left=90+i*720;top=165;sz=16;sy=5.3;zmin=278
 def p(z,y):return left+(z-zmin)*sz,top+(132-y)*sy
 s.text(left,112,'SECTION X='+str(xplane)+' m',size=20)
 for y in [0,24,40,52,68,84,100,128]:
  x,yy=p(278,y);s.line(x,yy,x+31*sz,yy);s.text(left-43,yy-6,str(y))
 for z in range(280,310,5):
  xx,yy=p(z,0);s.line(xx,top,xx,yy);s.text(xx-12,yy+12,str(z))
 selected=[r for r in rows if r['actualBounds']['min'][0]<=xplane<=r['actualBounds']['max'][0]]
 for r in sorted(selected,key=lambda r:bool(r['walkable'])):
  q=r['actualBounds'];x,y=p(q['min'][2],q['max'][1]);xx,yy=p(q['max'][2],q['min'][1]);c='#b48a4d'if records[r['id']].get('stair')else'#4b9bae'if r['walkable']else'#34475c';s.rect(x,y,max(.6,xx-x),max(.6,yy-y),c,None,r['id'])
 s.text(left,905,'26 flights total across both stair lanes',size=14)
files+=s.save('V02_Loggia_Source_Stair_Sections')
report={'status':'GENERATED measured source-envelope drawings; visual review required','sourceMasterSHA256':a['masterSHA256'],'sourceValidationSHA256':sha(D/'V02_Loggia_Terraces_Master_Validation.json'),'manifestSHA256':b['manifestSHA256'],'scriptSHA256':sha(Path(__file__)),'components':len(rows),'floorPanels':panels,'scope':__doc__.strip(),'artifacts':[{'file':str(p.relative_to(D)),'sha256':sha(p),'bytes':p.stat().st_size}for p in files]};(D/'V02_Loggia_Terraces_Drawings.json').write_text(json.dumps(report,indent=2)+'\n');print(report['status'])
