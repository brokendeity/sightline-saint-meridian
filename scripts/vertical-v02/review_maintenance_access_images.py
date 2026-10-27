"""Make labelled contact sheets from actual route screenshots, without synthesis."""
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json,re
D=Path(__file__).resolve().parents[2]/'development/vertical-city-v02';E=D/'evidence/maintenance-access';out=[]
for folder in ['momentum-zero','momentum-banked','mastery-zero','mastery-brake']:
 files=sorted((D/'evidence/maintenance-access-routes'/folder/'evidence').glob('*.png'),key=lambda p:(int(re.search(r'-(\d+)$',p.stem).group(1))if re.search(r'-(\d+)$',p.stem)else 999,p.name))
 assert files,folder
 w,h=420,260;sheet=Image.new('RGB',(w*3,h*((len(files)+2)//3)),(12,18,24));draw=ImageDraw.Draw(sheet)
 for i,p in enumerate(files):
  im=Image.open(p).convert('RGB');im.thumbnail((w,h-28));x=(i%3)*w;y=(i//3)*h;sheet.paste(im,(x,y));draw.text((x+4,y+h-25),p.stem,fill=(220,230,235))
 f=E/('review-'+folder+'.jpg');sheet.save(f,quality=90);out.append({'file':str(f.relative_to(D)),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'inputs':{str(p.relative_to(D)):hashlib.sha256(p.read_bytes()).hexdigest()for p in files}})
(E/'contact-sheets.json').write_text(json.dumps(out,indent=2)+'\n');print(len(out),'sheets; human visual review remains required')
