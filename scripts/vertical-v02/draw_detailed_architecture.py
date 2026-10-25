"""Dimensioned source sheet from the current exported detailed architecture.

This is an architectural plan/section, not a Blender or browser render.
"""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
mp=R/'assets/city/vertical-v02/detailed/manifest.json';m=json.loads(mp.read_text())
bg='#081523';ink='#d9eff7';cyan='#56d8e4';amber='#edbc78'
im=Image.new('RGB',(1600,1120),bg);d=ImageDraw.Draw(im)
fontpath='/System/Library/Fonts/Menlo.ttc'
font=lambda n:ImageFont.truetype(fontpath,n)
def text(x,y,s,n=17,color=ink):d.text((x,y),s,font=font(n),fill=color)
text(40,25,'SAINT MERIDIAN V02 / DETAILED ARCHITECTURE',28)
text(40,68,'Actual exported geometry / game metres / source drawing, not a rendered gameplay view',17,amber)
def panel(title,x,y,w,h,xmin,xmax,zmin,zmax,level):
    p=Image.new('RGB',(w,h),'#0e2030');q=ImageDraw.Draw(p)
    scale=min((w-55)/(xmax-xmin),(h-60)/(zmax-zmin));ox=25;oy=35
    xy=lambda a,b:(ox+(a-xmin)*scale,oy+(b-zmin)*scale)
    def box(r,color,outline):
        b=r['box'];a=xy(b['min'][0],b['min'][2]);c=xy(b['max'][0],b['max'][2]);q.rectangle((*a,*c),fill=color,outline=outline,width=1)
    for r in m['records']:
        b=r['box']
        if b['max'][0]<xmin or b['min'][0]>xmax or b['max'][2]<zmin or b['min'][2]>zmax:continue
        if r['walkable'] and abs(b['max'][1]-level)<.025:box(r,'#164554','#3a798a')
    for r in m['records']:
        b=r['box']
        if b['max'][0]<xmin or b['min'][0]>xmax or b['max'][2]<zmin or b['min'][2]>zmax:continue
        if r['solid']and b['min'][1]<level+1.2 and b['max'][1]>level+.05:box(r,'#4d6674'if not r.get('detail')else'#715534',amber if r.get('detail')else'#92adba')
        elif r.get('flight')=='detail-market-stair'and level in [24,27.6]:box(r,'#334a55','#7d9aaa')
    q.rectangle((0,0,w,32),fill='#0e2030');q.text((12,9),title,font=font(18),fill=ink)
    for a in range(int(xmin)+2,int(xmax),5):
        px,py=xy(a,zmax);q.text((px-12,py+5),str(a),font=font(11),fill='#9ab8c5')
    q.text((w-65,h-25),'X m',font=font(12),fill=ink)
    for z in range(int(zmin)+2,int(zmax),5):
        px,py=xy(xmin,z);q.text((2,py),str(z),font=font(10),fill='#9ab8c5')
    q.text((w-72,35),'N / -Z',font=font(12),fill=cyan)
    im.paste(p,(x,y));d.rectangle((x,y,x+w,y+h),outline='#39546a',width=1)
    return lambda a,b:tuple(v+o for v,o in zip(xy(a,b),(x,y)))

a=panel('01 / MARKET / FLOOR24m',40,115,730,465,56,94,351,380,24)
b=panel('02 / UPPER COMMERCIAL TERRACE27.6m',800,115,760,465,75,94,351,362,27.6)
# Actual tagged stair centres. The line depicts the authored walking route;
# its input validation is recorded separately, never implied by this drawing.
route=m['detailedPublicRoutes'][0]['path'];d.line([b(p[0],p[2])for p in route],fill=cyan,width=3)
text(820,520,'20 risers x0.18m /2.0m stair width',16,cyan)
text(820,546,'Top roof31.54m / terrace floor27.60m',16,amber)

text(40,615,'03 / STAIR SECTION AT Z353.9m',20)
x0,y0=70,935;scale=27
xy=lambda x,y:(x0+(x-75)*scale,y0-(y-23)*scale)
for r in m['records']:
    q=r['box']
    if not r.get('detail')or not r['solid']or q['max'][0]<75 or q['min'][0]>94 or not(q['min'][2]<=353.9<=q['max'][2]):continue
    lo=xy(q['min'][0],q['max'][1]);hi=xy(q['max'][0],q['min'][1]);d.rectangle((*lo,*hi),fill='#34505b',outline=cyan,width=1)
d.line((*xy(75,24),*xy(94,24)),fill=amber,width=2)
for y in [24,27.6,31.54]:
    xx,yy=xy(75,y);d.line((xx,yy,xx+515,yy),fill='#264151',width=1);text(40,yy-21,f'{y:.2f}m',13,amber)
text(65,975,'North-edge stair; upper landing connects',16)
text(65,1002,'to the sheltered terrace south of this cut.',16)

panel('04 / OBSERVATION / FLOOR128m',800,615,760,400,70,87,410,430,128)
text(815,1028,'West entry open / physical north + south glass',15,cyan)
text(40,1060,'Cyan: usable floor/stair  |  Amber: new vertical architecture  |  Grey: retained boundaries',16)
digest=hashlib.sha256(mp.read_bytes()).hexdigest()
text(40,1090,'Manifest '+digest[:24]+' / native gameplay acceptance remains separate',13,'#91afbf')
target=D/'V02_Detailed_Architecture_Source_Sheet.png';im.save(target)
(D/'V02_Detailed_Architecture_Source_Sheet.json').write_text(json.dumps({'scope':__doc__.strip(),'manifestSHA256':digest,'file':target.name},indent=2)+'\n')
print('Wrote',target.name)
