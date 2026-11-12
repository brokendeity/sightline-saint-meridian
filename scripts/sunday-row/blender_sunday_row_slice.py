"""Sunday Row look-dev slice: one block of Mercer Avenue (Mercer Strip), authored in Blender and exported as GLB.

Canon (lvl/SAINT MERIDIAN — MAP BIBLE): Mercer Avenue is Sunday Row's main east-west spine. Mercer Strip street character:
two- to four-story brick mixed-use buildings, ground-floor businesses, apartments above, fire escapes, window AC units,
church placards, stoops. Landmarks here: Weller's Bakery, Mr. Lawson's bodega milk-crate corner (Lawson Court is the
short service spur behind it), the bus stop on Mercer, barber frontage. Distances are compressed to fit one block.

Run: /Applications/Blender.app/Contents/MacOS/Blender -b --python scripts/sunday-row/blender_sunday_row_slice.py
Output: assets/city/sunday-row/slice/mercer_strip_slice.glb plus mercer_strip_slice.json (anchors for signs, views).
Deterministic (seeded). Every face gets planar UVs in metres so the runtime's painted textures tile at real scale.
Materials are named by role; the runtime look (toon ramp, outlines, painted maps) is applied by name.
"""
import bpy,bmesh,math,random,json,hashlib
from mathutils import Vector,Matrix
from pathlib import Path
R=Path(__file__).resolve().parents[2];OUT=R/'assets/city/sunday-row/slice';OUT.mkdir(parents=True,exist_ok=True)
rng=random.Random(406)  # 406 Bell Street
bpy.ops.wm.read_factory_settings(use_empty=True)
# ---------------------------------------------------------------- geometry accumulation per material
BUCKETS={}
def bucket(mat):
 if mat not in BUCKETS:BUCKETS[mat]=bmesh.new()
 return BUCKETS[mat]
def uv_face(bm,f):
 uv=bm.loops.layers.uv.verify();n=f.normal;ax=max(range(3),key=lambda i:abs(n[i]))
 for l in f.loops:
  co=l.vert.co
  if ax==2:u,v=co.x,co.y
  elif ax==0:u,v=co.y,co.z
  else:u,v=co.x,co.z
  l[uv].uv=(u,v)
def box(mat,cx,cy,cz,sx,sy,sz,rot=0.0):
 """Axis box centred at (cx,cy) with bottom at cz. Sizes in metres. rot about Z (radians)."""
 bm=bucket(mat);m=Matrix.Translation((cx,cy,cz+sz/2))@Matrix.Rotation(rot,4,'Z')@Matrix.Diagonal((sx,sy,sz,1))
 ret=bmesh.ops.create_cube(bm,size=1.0,matrix=m)
 for f in {f for v in ret['verts'] for f in v.link_faces}:uv_face(bm,f)
def cyl(mat,cx,cy,cz,r,h,seg=10,r2=None):
 bm=bucket(mat);m=Matrix.Translation((cx,cy,cz+h/2))
 ret=bmesh.ops.create_cone(bm,cap_ends=True,segments=seg,radius1=r,radius2=r if r2 is None else r2,depth=h,matrix=m)
 for f in {f for v in ret['verts'] for f in v.link_faces}:uv_face(bm,f)
def blob(mat,cx,cy,cz,r,sub=2,squash=1.0):
 bm=bucket(mat);m=Matrix.Translation((cx,cy,cz))@Matrix.Diagonal((r,r,r*squash,1))
 ret=bmesh.ops.create_icosphere(bm,subdivisions=sub,radius=1.0,matrix=m)
 for f in {f for v in ret['verts'] for f in v.link_faces}:uv_face(bm,f)
def tube(mat,pts,r=0.02,seg=5):
 """Thin tube through points (wires). Built as connected ring loops."""
 bm=bucket(mat);rings=[]
 for i,p in enumerate(pts):
  a=Vector(pts[max(0,i-1)]);b=Vector(pts[min(len(pts)-1,i+1)]);t=(b-a).normalized()
  up=Vector((0,0,1)) if abs(t.z)<.9 else Vector((1,0,0));s1=t.cross(up).normalized();s2=t.cross(s1).normalized()
  rings.append([bm.verts.new(Vector(p)+r*(math.cos(2*math.pi*k/seg)*s1+math.sin(2*math.pi*k/seg)*s2)) for k in range(seg)])
 for A,B in zip(rings,rings[1:]):
  for k in range(seg):
   f=bm.faces.new((A[k],A[(k+1)%seg],B[(k+1)%seg],B[k]));uv_face(bm,f)
def catenary(a,b,sag,n=14):
 a=Vector(a);b=Vector(b);return[tuple(a.lerp(b,i/n)-Vector((0,0,sag*4*(i/n)*(1-i/n)))) for i in range(n+1)]
# ---------------------------------------------------------------- layout
X0,X1=-90.0,90.0;ROAD=6.5;WALK=4.5;FRONT=ROAD+WALK;COURT_X=(41.0,49.0)
anchors={'signs':[],'views':{},'lights':[],'dapple':[],'canon':{}}
# road, curbs, sidewalks
box('asphalt',0,0,-0.05,X1-X0+60,2*ROAD,0.05)
for s in(1,-1):
 box('curb',0,s*(ROAD+0.12),0,X1-X0,0.24,0.15)
 # sidewalk on both sides, with the Lawson Court gap on the north side
 if s==1:
  for a,b in((X0,COURT_X[0]),(COURT_X[1],X1)):box('sidewalk',(a+b)/2,s*(ROAD+WALK/2+0.12),0,b-a,WALK-0.24,0.14)
 else:box('sidewalk',0,s*(ROAD+WALK/2+0.12),0,X1-X0,WALK-0.24,0.14)
# Lawson Court spur (north) and its sidewalks
box('asphalt',sum(COURT_X)/2,FRONT+30,-0.05,COURT_X[1]-COURT_X[0],60,0.05)
# markings: double yellow centre, lane dashes, crosswalks either side of the spur
for dy in(-0.12,0.12):box('paint_yellow',0,dy,0,X1-X0+60,0.1,0.012)
for x in range(int(X0)-28,int(X1)+30,9):
 for s in(1,-1):box('paint_white',x,s*3.3,0,3.0,0.12,0.012)
for cx in(COURT_X[0]-3,COURT_X[1]+3):
 for k in range(9):box('paint_white',cx,-ROAD+0.7+k*1.45,0,2.6,0.7,0.012)
for k in range(5):box('paint_white',sum(COURT_X)/2-3.2+k*1.6,FRONT+1.6,0,0.7,2.6,0.012)
# ---------------------------------------------------------------- buildings
BRICKS=['brick_red','brick_brown','brick_umber','brick_rose','brick_tan']
def window(xc,ys,z,w,h,facing,ac=False):
 """Recessed window on a facade plane at y=ys (facing=+1 street side is -y for north row)."""
 d=0.06*facing
 box('window_glass',xc,ys+d,z,w,0.04,h)
 box('trim',xc,ys+d*2.2,z-0.12,w+0.3,0.18,0.12)        # sill
 box('trim',xc,ys+d*1.6,z+h,w+0.25,0.1,0.22)            # lintel
 for sx in(-1,1):box('window_frame',xc+sx*(w/2),ys+d*1.2,z,0.07,0.08,h)
 box('window_frame',xc,ys+d*1.2,z+h*0.5,w,0.08,0.06)
 if ac:box('ac_unit',xc+w*0.15,ys+facing*0.32,z+0.05,0.7,0.55,0.45)
def building(x0,x1,side,stories,kind,name=None):
 """side=+1 north row (facade at y=FRONT, faces -y), -1 south row (facade at y=-FRONT, faces +y)."""
 w=x1-x0;xc=(x0+x1)/2;depth=rng.uniform(12,16);gf=4.3;fh=3.3;H=gf+fh*(stories-1)
 brick=rng.choice(BRICKS);ys=side*FRONT;facing=-side
 box(brick,xc,side*(FRONT+depth/2),0,w-0.04,depth,H)
 # cornice and parapet
 box('cornice',xc,ys+facing*0.18,H-0.1,w,0.5,0.55);box(brick,xc,side*(FRONT+depth/2),H+0.4,w-0.04,depth,0.5)
 box('roof_tar',xc,side*(FRONT+depth/2),H+0.9,w-0.6,depth-0.6,0.02)
 box('trim',xc,ys+facing*0.05,gf-0.15,w,0.25,0.3)          # storefront head band
 bays=max(2,int(w//3.1));pitch=w/bays
 for f in range(1,stories):
  z=gf+(f-1)*fh+0.75
  for b in range(bays):window(x0+pitch*(b+.5),ys,z,min(1.25,pitch*.55),1.75,facing,ac=rng.random()<0.22)
 # ground floor
 if kind in('shop','bakery','bodega','barber','church_hall'):
  box('storefront_frame',xc,ys+facing*0.03,0,w-0.6,0.12,0.4)
  box('storefront_glass',xc,ys+facing*0.05,0.4,w-1.2,0.06,2.6)
  for b in range(int(w//2.4)+1):box('storefront_frame',x0+0.6+b*(w-1.2)/max(1,int(w//2.4)),ys+facing*0.07,0.4,0.1,0.1,2.6)
  box('door',x0+w*0.2,ys+facing*0.06,0,1.1,0.08,2.5)
  box('sign_band',xc,ys+facing*0.1,gf-1.05,w-0.8,0.1,0.85)
  anchors['signs'].append({'kind':kind,'name':name,'center':[xc,ys+facing*0.16,gf-0.63],'width':w-0.8,'height':0.85,'facing':facing})
  if kind=='bakery' or (kind in('shop','barber') and rng.random()<0.8):
   aw='awning_cream' if kind=='bakery' else rng.choice(['awning_red','awning_green','awning_blue'])
   bm=bucket(aw);z0=gf-1.15;out=1.5*facing
   v=[bm.verts.new(p) for p in((x0+0.3,ys,z0+0.5),(x1-0.3,ys,z0+0.5),(x1-0.3,ys+out,z0),(x0+0.3,ys+out,z0))]
   f=bm.faces.new(v);uv_face(bm,f)
   box(aw,xc,ys+out,z0-0.35,w-0.6,0.04,0.35)
 else:
  # residential ground floor: stoop and door with transom
  sx=x0+w*0.3
  for k in range(4):box('stoop_stone',sx,ys+facing*(0.35+0.32*(3-k)),k*0.2,2.2,0.32*(k+1)+0.3,0.2)
  for s2 in(-1,1):box('railing',sx+s2*1.05,ys+facing*0.9,0.2,0.05,1.3,0.95)
  box('door',sx,ys+facing*0.06,0.8,1.15,0.08,2.4);box('window_glass',sx,ys+facing*0.06,3.3,1.15,0.06,0.55)
  for b in range(2):window(x0+w*(0.62+b*0.2),ys,1.2,1.0,1.6,facing)
 # fire escape on some facades
 if stories>=3 and rng.random()<0.55:
  fx=x0+w*rng.uniform(0.55,0.7)
  for f in range(1,stories):
   z=gf+(f-1)*fh+0.05
   for k in range(7):box('fire_escape',fx,ys+facing*(0.15+k*0.19),z,3.4,0.05,0.05)
   for e in(-1,1):box('fire_escape',fx+e*1.7,ys+facing*0.75,z,0.06,1.3,0.06)
   box('fire_escape',fx,ys+facing*1.38,z+0.95,3.4,0.05,0.05);box('fire_escape',fx,ys+facing*1.38,z+0.45,3.4,0.03,0.03)
   for k in range(9):box('fire_escape',fx-1.7+k*0.425,ys+facing*1.38,z,0.03,0.03,0.95)
   for e in(-1,1):box('fire_escape',fx+e*1.7,ys+facing*0.75,z+0.95,0.05,1.3,0.05)
   box('fire_escape',fx+1.2,ys+facing*0.9,z-fh+0.1,0.5,0.05,fh-0.1,rot=0)
 # rooftop clutter
 if rng.random()<0.5:box('roof_box',xc+rng.uniform(-w/4,w/4),side*(FRONT+depth*0.6),H+0.9,1.8,1.6,1.2)
 if rng.random()<0.18:
  tx=xc+rng.uniform(-w/4,w/4);ty=side*(FRONT+depth*0.55)
  for a in range(4):box('water_tank_leg',tx+(a%2-.5)*1.6,ty+(a//2-.5)*1.6,H+0.9,0.12,0.12,2.2)
  cyl('water_tank',tx,ty,H+3.1,1.25,2.6,12);cyl('water_tank_roof',tx,ty,H+5.7,1.35,0.8,12,r2=0.1)
 return{'x0':x0,'x1':x1,'side':side,'stories':stories,'kind':kind,'name':name,'height':H,'brick':brick}
blocks=[]
SHOP_NAMES=['SUNDAY WINGS','ROW BEAUTY SUPPLY','MERCER LAUNDRY','TAX & NOTARY','JERK SPOT','FISH FRY','PHONE REPAIR','GRACE TAILORS','MERCER DELI','CHECK CASHING','ROW RECORDS','FRESH CUTS']
_names=iter(SHOP_NAMES*3)
def row(side,start,end,specials):
 # Specials are placed exactly at their x; ordinary buildings fill the gaps between them.
 x=start;specials=sorted(specials,key=lambda s:s['x'])
 while x<end-4:
  sp=next((s for s in specials if abs(s['x']-x)<0.01),None)
  nxt=next((s['x'] for s in specials if s['x']>x+0.01),end)
  if sp:w=sp['w'];kind=sp['kind'];stories=sp.get('stories',3);name=sp.get('name')
  else:
   w=rng.choice([8.5,9.5,10.5,12.0,13.5,15.0]);gap=nxt-x
   if w>gap or gap-w<4:w=gap
   kind=rng.choice(['shop','shop','res','res','res','shop']);stories=rng.choice([2,3,3,4,4]);name=next(_names) if kind=='shop' else None
  w=min(w,end-x);blocks.append(building(x,x+w,side,stories,kind,name));x+=w
# north row: Weller's Bakery mid-west, Lawson's bodega on the corner west of Lawson Court
row(1,X0,COURT_X[0],[{'x':-48.0,'w':13.0,'kind':'bakery','name':"WELLER'S BAKERY",'stories':3},{'x':29.0,'w':12.0,'kind':'bodega','name':"LAWSON'S",'stories':4}])
row(1,COURT_X[1],X1,[{'x':COURT_X[1],'w':12.0,'kind':'church_hall','name':'MOUNT GIDEON ANNEX','stories':2}])
# south row: barber, laundromat-style shop, residential walk-ups
row(-1,X0,X1,[{'x':38.0,'w':9.5,'kind':'barber','name':'BARBER','stories':3},{'x':-10.0,'w':12.0,'kind':'shop','name':'CORNER STORE','stories':3}])
# Lawson Court side walls (the spur is a narrow service lane behind the bodega)
box('brick_umber',COURT_X[0]-0.3,FRONT+30,0,0.6,40,9);box('brick_brown',COURT_X[1]+0.3,FRONT+30,0,0.6,40,7)
for k in range(3):box('dumpster',COURT_X[0]+1.6,FRONT+14+k*7,0,1.8,1.1,1.25)
# ---------------------------------------------------------------- street furniture
# milk crates at Lawson's corner (the observation node), stacked
bx=COURT_X[0]-1.6
for i,(dx,dy,dz) in enumerate([(0,0,0),(0.42,0,0),(0,0,0.32),(0.21,0.42,0),(0.9,0.2,0)]):box('milk_crate',bx-dx,FRONT-0.9-dy,0.14+dz,0.4,0.4,0.32)
anchors['canon']['lawsons_corner']=[bx,FRONT-1.0,0.14]
# bakery planter (the utility arm / bakery planter crash site) and bench
box('planter',-41.5,FRONT-1.2,0.14,3.2,0.9,0.6);blob('shrub',-41.5,FRONT-1.2,0.95,0.55,1,0.7);blob('shrub',-40.5,FRONT-1.2,0.9,0.45,1,0.7);blob('shrub',-42.6,FRONT-1.2,0.9,0.5,1,0.7)
anchors['canon']['wellers_bakery']=[-41.5,FRONT,0]
# bus stop on Mercer (south side)
sx=-25.0;sy=-(ROAD+1.6)
box('bus_shelter_frame',sx,sy-1.1,0.14,4.2,0.08,2.5);box('bus_shelter_glass',sx,sy-1.05,0.4,4.0,0.04,2.0)
for e in(-1,1):box('bus_shelter_frame',sx+e*2.05,sy-0.5,0.14,0.08,1.3,2.5);box('bus_shelter_glass',sx+e*2.05,sy-0.5,0.4,0.03,1.1,2.0)
box('bus_shelter_roof',sx,sy-0.5,2.64,4.6,1.6,0.12);box('bench',sx,sy-0.8,0.6,3.0,0.45,0.08)
cyl('pole_metal',sx+3.0,sy+0.6,0.14,0.05,2.9,8);box('sign_bus',sx+3.0,sy+0.6,2.6,0.6,0.04,0.45)
anchors['signs'].append({'kind':'bus','name':'B-SR MERCER','center':[sx+3.0,sy+0.63,2.82],'width':0.6,'height':0.45,'facing':1})
anchors['canon']['mercer_bus_stop']=[sx,sy,0]
# utility poles with crossarms and sagging wires, both sides
poles={1:[],-1:[]}
for side in(1,-1):
 for x in range(int(X0)+6,int(X1),30):
  py=side*(ROAD+0.7)
  if side==1 and COURT_X[0]-1<x<COURT_X[1]+1:continue
  cyl('pole_wood',x,py,0.14,0.14,10.5,8,r2=0.11)
  box('pole_wood',x,py,9.4,0.14,2.6,0.14)
  for k in(-1,0,1):box('insulator',x,py+k*1.1,9.54,0.08,0.08,0.18)
  if rng.random()<0.4:cyl('transformer',x,py-side*0.35,7.6,0.32,1.0,10)
  poles[side].append((x,py))
 for (xa,ya),(xb,yb) in zip(poles[side],poles[side][1:]):
  for k in(-1,0,1):tube('wire',catenary((xa,ya+k*1.1,9.68),(xb,yb+k*1.1,9.68),0.75+0.15*k),0.018)
  tube('wire',catenary((xa,ya,7.9),(xb,yb,7.9),0.5),0.025)
# a few wires across the street (service drops)
for (xa,ya),(xb,yb) in zip(poles[1][::2],poles[-1][::2]):tube('wire',catenary((xa,ya,9.6),(xb,yb,9.6),0.9),0.016)
# street lamps (cobra head), offset from poles
for side in(1,-1):
 for x in range(int(X0)+21,int(X1),30):
  if side==1 and COURT_X[0]-2<x<COURT_X[1]+2:continue
  ly=side*(ROAD+0.55);cyl('pole_metal',x,ly,0.14,0.08,7.2,8,r2=0.06)
  box('pole_metal',x,ly-side*1.0,7.25,0.08,2.0,0.08);box('lamp_head',x,ly-side*2.0,7.05,0.45,0.75,0.2)
  anchors['lights'].append([x,ly-side*2.0,6.95])
# street trees in pits, between poles
for side in(1,-1):
 for x in range(int(X0)+14,int(X1),18):
  if side==1 and COURT_X[0]-3<x<COURT_X[1]+3:continue
  if abs(x-sx)<4 and side==-1:continue
  ty=side*(ROAD+2.2);box('tree_pit',x,ty,0.14,1.4,1.4,0.03)
  h=rng.uniform(4.6,6.2);cyl('tree_trunk',x,ty,0.14,0.17,h,7,r2=0.11)
  for k in range(rng.randint(9,13)):
   blob('foliage',x+rng.uniform(-1.8,1.8),ty+rng.uniform(-1.6,1.6),h+rng.uniform(-0.8,1.6),rng.uniform(0.8,1.4),3,0.85)
  anchors['dapple'].append([x,ty,h])
# hydrants, bins, newspaper boxes, bike racks
for x in(-70,-12,22,64):cyl('hydrant',x,-(ROAD+0.9),0.14,0.14,0.75,10);blob('hydrant',x,-(ROAD+0.9),0.9,0.15,1)
for x in(-55,-3,31,75):cyl('trash_can',x,ROAD+0.9,0.14,0.32,0.95,12)
for x in(-34,52):box('news_box',x,-(ROAD+0.8),0.14,0.55,0.5,1.05)
# parked cars along the curb (simple rounded-off forms)
CARS=['car_red','car_white','car_teal','car_navy','car_yellow']
for side,xs in((1,[-80,-63,-30,-6,12,60,78]),(-1,[-72,-50,-38,-4,15,50,70])):
 for x in xs:
  cy=side*(ROAD-1.25);c=rng.choice(CARS);L=rng.uniform(4.3,4.8)
  box(c,x,cy,0.30,L,1.8,0.6);box(c,x,cy,0.86,L*0.96,1.74,0.08)
  bm=bucket('car_glass');r0=bmesh.ops.create_cube(bm,size=1.0,matrix=Matrix.Translation((x-0.15,cy,1.2))@Matrix.Diagonal((L*0.52,1.6,0.6,1)))
  for v in r0['verts']:
   if v.co.z>1.2:v.co.x=x-0.15+(v.co.x-(x-0.15))*0.62;v.co.y=cy+(v.co.y-cy)*0.9
  for f in {f for v in r0['verts'] for f in v.link_faces}:uv_face(bm,f)
  box(c,x-0.15,cy,1.49,L*0.31,1.42,0.05)
  for f in(-1,1):box('car_light',x+L/2,cy+f*0.62,0.62,0.04,0.32,0.14);box('car_tail',x-L/2,cy+f*0.62,0.62,0.04,0.32,0.14)
  for e in(-1,1):
   for f in(-1,1):cyl('tire',x+e*L*0.33,cy+f*0.82,0.0,0.34,0.24,10)
# ---------------------------------------------------------------- street-level life (clutter density is most of the reference's look)
for b in blocks:
 side=b['side'];facing=-side;ys=side*FRONT;w=b['x1']-b['x0']
 if b['kind'] in('shop','bakery','bodega','barber'):
  if rng.random()<0.6:  # sidewalk A-frame sign
   ax=b['x0']+w*rng.uniform(.55,.85);ay=ys+facing*1.4
   for e in(-1,1):box('aframe',ax,ay+e*0.12,0.14,0.6,0.04,0.85,rot=0)
   anchors['signs'].append({'kind':'aframe','name':rng.choice(['OPEN','FRESH TODAY','2 FOR $5','HOT PATTIES','WE FIX PHONES','CUTS $15']),'center':[ax,ay+facing*0.15,0.6],'width':0.55,'height':0.7,'facing':facing})
  if rng.random()<0.45:  # wall poster beside the door
   px=b['x0']+w*0.08;anchors['signs'].append({'kind':'poster','name':rng.choice(['BLOCK PARTY SAT','CHOIR TONIGHT','COMFORT DRIVE','VOTE','LOST CAT']),'center':[px,ys+facing*0.09,1.55],'width':0.7,'height':0.95,'facing':facing})
 else:
  for k in range(rng.randint(1,3)):  # potted plants on the stoop
   kx=b['x0']+w*0.3+rng.uniform(-1.0,1.0);ky=ys+facing*rng.uniform(1.2,1.6)
   cyl('pot',kx,ky,0.14,0.22,0.38,10,r2=0.28);blob('shrub',kx,ky,0.72,0.32,2,0.9)
 if rng.random()<0.25:  # parked bike against the wall
  bx2=b['x0']+w*rng.uniform(.3,.8);by=ys+facing*0.45
  for e in(-1,1):cyl('tire',bx2+e*0.55,by,0.14,0.34,0.05,14)
  box('bike_frame',bx2,by,0.5,1.0,0.04,0.05);box('bike_frame',bx2+0.1,by,0.5,0.05,0.04,0.45)
# Lawson's corner: two folding chairs by the milk crates
for k,dx in enumerate((-2.6,-3.4)):
 cx2=COURT_X[0]+dx;cy2=FRONT-1.5
 box('chair',cx2,cy2,0.55,0.45,0.45,0.05);box('chair',cx2,cy2+0.22,0.55,0.45,0.04,0.5)
 for e in(-1,1):
  for f in(-1,1):box('chair',cx2+e*0.2,cy2+f*0.2,0.14,0.03,0.03,0.42)
# laundry line across Lawson Court
for k in range(2):
 z=5.5+k*3.0;pts=catenary((COURT_X[0],FRONT+9+k*6,z),(COURT_X[1],FRONT+9+k*6,z),0.35,10);tube('wire',pts,0.012)
 for i in range(2,9):
  if rng.random()<0.8:
   q=pts[i];box(rng.choice(['laundry_a','laundry_b','laundry_c']),q[0],q[1],q[2]-0.75,0.55,0.02,0.7)
# ---------------------------------------------------------------- build objects, one per material
for mat_name,bm in BUCKETS.items():
 me=bpy.data.meshes.new(mat_name);bm.to_mesh(me);bm.free()
 mat=bpy.data.materials.get(mat_name) or bpy.data.materials.new(mat_name);me.materials.append(mat)
 ob=bpy.data.objects.new('SR_'+mat_name,me);bpy.context.collection.objects.link(ob)
 for p in me.polygons:p.use_smooth=mat_name in('foliage','shrub','water_tank','tire','hydrant','trash_can','transformer','wire')
anchors['views']={
 'street_chase':{'pos':[-62,-3.2,1.9],'look':[-20,0.5,3.2]},
 'bakery':{'pos':[-49,-4.5,1.7],'look':[-41.5,FRONT,3.0]},
 'lawsons_corner':{'pos':[22,-5.0,1.75],'look':[COURT_X[0]-1.5,FRONT,2.4]},
 'bus_stop':{'pos':[-38,2.0,1.7],'look':[-25,-(ROAD+1.6),2.0]},
 'overview':{'pos':[-95,-28,22],'look':[0,4,2]}}
anchors['layout']={'x':[X0,X1],'road_half':ROAD,'walk':WALK,'front':FRONT,'lawson_court':COURT_X,'buildings':blocks}
glb=OUT/'mercer_strip_slice.glb'
bpy.ops.export_scene.gltf(filepath=str(glb),export_format='GLB',export_apply=True,export_yup=True,export_materials='PLACEHOLDER' if False else 'EXPORT')
anchors['coords']='Blender Z-up metres (x along Mercer Avenue, +y north). glTF export is Y-up: (x, y, z) -> (x, z, -y).'
anchors['glbSHA256']=hashlib.sha256(glb.read_bytes()).hexdigest()
(OUT/'mercer_strip_slice.json').write_text(json.dumps(anchors,indent=1)+'\n')
print('SLICE',glb,len(BUCKETS),'materials',sum(o.data.polygons.__len__() for o in bpy.data.objects if o.type=='MESH'),'faces')
