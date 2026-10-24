import json, math, csv, textwrap, zipfile
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Rectangle, Circle, FancyArrowPatch, PathPatch
from matplotlib.lines import Line2D
from matplotlib.backends.backend_pdf import PdfPages

OUT=Path(__file__).resolve().parent;OUT.mkdir(exist_ok=True)
SOURCE=OUT/'V02_Existing_Lots_Source_Reconstructed.json'
bs=json.loads(SOURCE.read_text())['buildings']
DARK='#071625';BG='#092135';BG2='#102a41';CYAN='#43DDEB';BLUE='#79BEDC';WHITE='#E9F6FC';MUTED='#98B0C4';YELLOW='#F6BD72';RED='#FF7486';MINT='#65E7BA';PURPLE='#B49CFF';GREY='#547184'
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9,'text.color':WHITE,'axes.facecolor':DARK,'figure.facecolor':DARK,'savefig.facecolor':DARK,'xtick.color':MUTED,'ytick.color':MUTED,'axes.labelcolor':MUTED,'axes.edgecolor':GREY})
LAYOUT={'schema':'saint-meridian-vertical-1','corridor':{'x':80,'zStart':180,'zEnd':460},'levels':[24,52,84,128],'bridgeZ':[210,280,350,430],'sides':[55,105],'train':{'height':100,'speed':16,'cars':4,'spacing':14},'trafficBands':[38,65,114],'quality':'medium','bookmarks':{'A':{'position':[78,132,185],'look':[82,70,400]},'B':{'position':[80,2,185],'look':[80,90,400]}}}
CURRENT=[{'id':f'V1-BR{i}', 'x':80,'z':z,'y':y,'width':50,'depth':7, 'status':'rejected' if i==1 else 'admitted','ref':f'bridge{i}'} for i,(z,y) in enumerate(zip(LAYOUT['bridgeZ'],LAYOUT['levels']))]
NEW=[
 {'id':'V2-BR-L2','x':80,'z':350,'y':24,'width':50,'depth':7,'role':'lower loop return crossing','status':'proposed'},
 {'id':'V2-BR-M1','x':80,'z':280,'y':52,'width':50,'depth':8,'role':'redesign V1 rejected crossing at verified portal','status':'redesign'},
 {'id':'V2-BR-M2','x':80,'z':350,'y':52,'width':50,'depth':8,'role':'mid-city loop return crossing','status':'proposed'},
 {'id':'V2-BR-H2','x':80,'z':430,'y':84,'width':50,'depth':7,'role':'high level loop return crossing','status':'proposed'},
]
# Proposed pedestrian galleries are sketches, not reserved buildable footprints
SPINES=[{'id':f'V2-SP-{side}-{y}','x':side,'z0':210,'z1':430,'y':y,'status':'proposed','purpose':'segmented walkable spine, clearance-route around host facades'} for side in [55,105] for y in [24,52,84]]
VERT=[
 {'id':'V2-VT-A','x':55,'z':215,'y0':0,'y1':84,'type':'stair/lift spine','status':'proposed'},
 {'id':'V2-VT-B','x':105,'z':350,'y0':0,'y1':84,'type':'secondary elevator/service ascent','status':'proposed'},
 {'id':'V2-VT-C','x':55,'z':420,'y0':24,'y1':128,'type':'wall-climb + lift + safe descent','status':'proposed'},
 {'id':'V2-VT-D','x':105,'z':425,'y0':84,'y1':128,'type':'high ascent transfer','status':'proposed'}]
HUBS=[
 {'id':'H-G','name':'Ground access / recovery','x':55,'z':205,'y':0,'type':'public-entry','status':'proposed location'},
 {'id':'H-L','name':'Suspended market + civilian rescue','x':55,'z':355,'y':24,'type':'rescue','status':'proposed location'},
 {'id':'H-M','name':'Multi-tier service yard + combat','x':105,'z':345,'y':52,'type':'combat','status':'proposed location'},
 {'id':'H-U','name':'Transit interchange + pursuit','x':80,'z':355,'y':100,'type':'chase','status':'proposed location'},
 {'id':'H-R','name':'Upper roof vantage','x':55,'z':422,'y':128,'type':'landmark','status':'proposed location'}]
NODES=[
 dict(id='G0',x=55,z=205,y=0,kind='street'),
 dict(id='LWA',x=55,z=210,y=24,kind='walk'),dict(id='LEA',x=105,z=210,y=24,kind='walk'),dict(id='LWB',x=55,z=350,y=24,kind='hub'),dict(id='LEB',x=105,z=350,y=24,kind='walk'),
 dict(id='MWA',x=55,z=280,y=52,kind='walk'),dict(id='MEA',x=105,z=280,y=52,kind='walk'),dict(id='MWB',x=55,z=350,y=52,kind='walk'),dict(id='MEB',x=105,z=350,y=52,kind='hub'),
 dict(id='HWA',x=55,z=350,y=84,kind='walk'),dict(id='HEA',x=105,z=350,y=84,kind='walk'),dict(id='HWB',x=55,z=430,y=84,kind='walk'),dict(id='HEB',x=105,z=430,y=84,kind='walk'),
 dict(id='UW',x=55,z=430,y=128,kind='roof'),dict(id='UE',x=105,z=430,y=128,kind='roof'),
 dict(id='TS',x=80,z=355,y=100,kind='transit'),
]
EDGES=[]
def edge(a,b,mode='walk',status='proposed',group='transfer',resource='none',danger='standard'):
 EDGES.append(dict(id=f'E{len(EDGES)+1:02}',a=a,b=b,directed=False,mode=mode,status=status,group=group,resource=resource,danger=danger,verified_in_game=False))
# three intended rings (not certified)
for a,b,status in [('LWA','LEA','current admitted proxy'),('LEA','LEB','proposed east spine'),('LEB','LWB','proposed new crossing'),('LWB','LWA','proposed west spine')]:edge(a,b,status=status,group='lower')
for a,b,status in [('MWA','MEA','redesign rejected V1 span'),('MEA','MEB','proposed east spine'),('MEB','MWB','proposed new crossing'),('MWB','MWA','proposed west spine')]:edge(a,b,status=status,group='mid')
for a,b,status in [('HWA','HEA','current admitted proxy'),('HEA','HEB','proposed east spine'),('HEB','HWB','proposed new crossing'),('HWB','HWA','proposed west spine')]:edge(a,b,status=status,group='high')
for a,b,mode in [('G0','LWA','stairs/lift'),('G0','LWB','wall run + intermediate landings'),('LWA','MWA','stairs/lift'),('LWB','MWB','stairs/lift'),('LEB','MEB','lift'),('MWB','HWA','wall run / stair'),('MEB','HEA','lift'),('HWA','HWB','gallery'),('HWB','UW','wall run + recovery'),('HEB','UE','lift'),('UW','UE','current upper bridge at Y128, Z430'),('HWA','TS','Threadrail + station landing'),('TS','UW','Threadrail / transit connection'),('TS','HEA','safe station access (proposed)')]:edge(a,b,mode=mode,group='vertical')
# metrics: physical separation; warning max span only applies to Threadrail endpoints not bridge lengths
mapN={n['id']:n for n in NODES}
for e in EDGES:
 a,b=mapN[e['a']],mapN[e['b']]; dist=math.dist((a['x'],a['y'],a['z']),(b['x'],b['y'],b['z']));hor=math.hypot(a['x']-b['x'],a['z']-b['z']);dy=abs(a['y']-b['y']);e['distance_m']=round(dist,1);e['straight_slope_deg']=round(math.degrees(math.atan2(dy,hor)),1) if hor else 90; e['threadrail_direct_legal_envelope'] = dist<=100 and e['straight_slope_deg']<=55;e['note']='No collision/projectile/landing certification; envelopes alone insufficient.'

STUDY={'title':'Saint Meridian V02 - site study / AAA quality gate','status':'SOURCE-AUDITED ARCHITECTURAL STUDY / PROPOSED V02 NOT GAMEPLAY VERIFIED','source':{'repo':'brokendeity/sightline-saint-meridian','branch':'feature/saint-meridian-vertical-megacity-v1','files':['assets/city/vertical/layout.json','scripts/game_vertical_city.js','docs/vertical-city/IMPLEMENTATION.md','output/vertical-city/audit.json','docs/vertical-city/HI3D_TRAIN_INTEGRATION.md'],'lotReference':'2026-10-19 reconstructed 310-lot data; not direct Oct-24 runtime geometry export'},'verified_branch_facts':{'original_lots_preserved':310,'corridor':LAYOUT['corridor'],'levels':LAYOUT['levels'],'current_bridge_decks':CURRENT,'rejected_placements':26,'bridge_rejected_id':'bridge1','admitted_primitive_assemblies':1474,'vertical_collision_boxes':952,'scenic_vehicles':24,'train_cars':4,'train_height':100,'train_front_real_hi3d_model_loaded':True,'train_middle_rear':'procedural placeholders','scenic_traffic_physics':False,'full_traversal_acceptance':False,'train_camera_performance':'single-sample render only (not baseline p95)'},'older_v01_plan':'Retired: previous X240-850/Z-225..240 proposal must NOT be overlaid onto current V1 as if implemented','new_v02':{'crossings':NEW,'segmented_spines':SPINES,'vertical_transfers':VERT,'hubs':HUBS,'nodes':NODES,'edges':EDGES,'loops':['lower','mid','high'],'landmarks':['transit interchange','suspended market','service yard','upper rooftop lookout'],'quality_gates':['G0 authoritative runtime export','G1 collision and transport sweep','G2 resource-aware 3D navigation loops','G3 three route variants to train station','G4 encounter staging','G5 player recovery and signage','G6 motion and performance / visual match']},'limitations':['No current-branch world-position/collider export available in this chat','Reconstructed source footprints not an authenticated runtime dump','Proposed V02 bridge paths and host facades not spatially validated','Blue/amber architectural palette referenced, not a game screenshot','No claims of AAA parity or playable route verification']}
(OUT/'V02_CurrentBranch_SiteStudy_Manifest.json').write_text(json.dumps(STUDY,indent=2))
with open(OUT/'V02_AbilityRoute_Matrix.csv','w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(EDGES[0]));w.writeheader();w.writerows(EDGES)
with open(OUT/'V02_Existing_Buildings_ReferenceOnly.csv','w',newline='') as f:
 fields=['id','kind','x','z','w','d','h'];w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows({k:b.get(k) for k in fields} for b in bs)

# Drawing utilities

def figure(n,title,subtitle):
 fig=plt.figure(figsize=(16.0,10.0),facecolor=DARK)
 fig.text(.045,.957,'S A I N T   M E R I D I A N    /    A R C H I T E C T U R A L   S I T E   S T U D Y',color=CYAN,fontsize=13,fontweight='bold')
 fig.text(.045,.91,title,color=WHITE,fontsize=23,fontweight='bold');fig.text(.047,.88,subtitle,color=MUTED,fontsize=10)
 fig.text(.955,.955,f'V02  /  A-{n:02d}',ha='right',color=YELLOW,fontsize=14,fontweight='bold')
 fig.add_artist(Line2D([.045,.955],[.858,.858],transform=fig.transFigure,color=GREY,lw=1.4))
 fig.add_artist(Line2D([.045,.955],[.079,.079],transform=fig.transFigure,color=GREY,lw=1.1))
 fig.text(.048,.054,'SOURCE: GITHUB VERTICAL-MEGACITY-V1 BRANCH   +   RECONSTRUCTED ORIGINAL-LOT PROXY',color=MUTED,fontsize=7.9)
 fig.text(.953,.054,'24 OCT 2026   •   SCHEMATIC / NOT A VERIFIED CONSTRUCTION SURVEY',ha='right',color=YELLOW,fontsize=7.9)
 return fig

def axmap(fig,box,xlim,ylim,step=80):
 ax=fig.add_axes(box);ax.set_xlim(*xlim);ax.set_ylim(*ylim);ax.set_aspect('equal');ax.set_xticks(np.arange(math.ceil(xlim[0]/step)*step,xlim[1]+1,step));ax.set_yticks(np.arange(math.ceil(ylim[0]/step)*step,ylim[1]+1,step));ax.grid(alpha=.35,color='#345267',lw=.5);ax.tick_params(labelsize=8);ax.set_xlabel('GAME X  /  METRES');ax.set_ylabel('GAME Z  /  METRES');return ax

def draw_lots(ax,alpha=1,label=False):
 for b in bs:
  r=Rectangle((b['x']-b['w']/2,b['z']-b['d']/2),b['w'],b['d'],facecolor='#17384c',edgecolor='#6a90a4',lw=.48,alpha=.58*alpha)
  ax.add_patch(r)
  if label and -65<=b['x']<=205 and 145<=b['z']<=500:
   ax.text(b['x'],b['z'],b['id'],fontsize=7,color='#afccd9',ha='center',va='center')

def textbox(fig,x,y,title,lines,width=52,fs=10,color=WHITE,leading=.043):
 fig.text(x,y,title,color=YELLOW,fontsize=11,fontweight='bold',va='top'); yy=y-.041
 for s in lines:
  wrap=textwrap.wrap(str(s),width=width) or ['']
  for t in wrap:fig.text(x,yy,t,color=color,fontsize=fs,va='top');yy-=leading*.62
  yy-=leading*.2
 return yy

def badge(ax,x,y,t,c=CYAN,sz=8):
 ax.text(x,y,t,color=c,fontsize=sz,weight='bold',ha='center',va='center',bbox={'boxstyle':'round,pad=.25','facecolor':DARK,'edgecolor':c,'lw':.8})

# page1 citywide
fig1=figure(1,'CURRENT CITY  /  BASELINE AND PROVENANCE','The new branch is authoritative for additions. Original 310-lot footprints remain a reconstruction until live-export validation.')
a=axmap(fig1,[.09,.15,.52,.67],(-1090,1090),(-1090,1090),320);draw_lots(a);a.add_patch(Circle((0,0),115,ec=YELLOW,fc='none',lw=1.6,ls='--'));a.add_patch(Rectangle((35,160),90,320,fc=CYAN,ec=CYAN,alpha=.18,lw=1.5));a.add_patch(Rectangle((35,160),90,320,fc='none',ec=CYAN,lw=1.9));a.plot([80,80],[180,460],color=YELLOW,lw=2);badge(a,80,515,'ACTIVE V1 CANYON',CYAN,7)
textbox(fig1,.665,.77,'CONFIRMED CURRENT BRANCH',['Prototype corridor: X≈80, Z=180–460.','Four levels: Y=24 / 52 / 84 / 128 m.','Train on Y≈100 m; 4 cars.','Flying traffic: 38 / 65 / 114 m.','Existing building count: 310.','The V1 release is a prototype, not AAA acceptance.'],width=39,fs=10)
textbox(fig1,.665,.47,'PROVENANCE / LIMITS',['Original footprints shown on this sheet are from a 2026-10-19 reconstructed candidate.','They are not a direct geometry/collision export of this branch.','Older east-central proposal X=240–850 is RETIRED for V02.','This drawing is planning-grade; live runtime collision must be exported.'],width=40,fs=9.7)
fig1.text(.68,.14,'NOT FOR AUTOMATIC BLENDER PLACEMENT\nUNTIL LIVE WORLD-EXPORT MATCHES',color=RED,fontsize=11,weight='bold')

# page2 actual prototype
fig2=figure(2,'CURRENT V1  /  SITE CONDITIONS AND FAILURE MAP','As built in game_vertical_city.js / layout.json; accepted/rejected structures and incomplete walkable networks.')
a=axmap(fig2,[.09,.15,.47,.67],(-100,270),(115,545),40);draw_lots(a,label=True)
a.axvspan(55,105,alpha=.07,color=CYAN);a.plot([55,55],[200,440],ls='--',color=BLUE,lw=3);a.plot([105,105],[200,440],ls=':',color=RED,lw=3)
for b in CURRENT:
 c=RED if b['status']=='rejected' else MINT
 a.plot([55,105],[b['z'],b['z']],c=c,lw=5,alpha=.87);badge(a,80,b['z']+9,f"Y{b['y']} {'BLOCKED' if c==RED else 'V1'}",c,7)
a.plot([80,80],[180,460],color=YELLOW,lw=3,alpha=.75,label='Train centerline, Y=100 (schematic)')
for y,c,off in [(38,PURPLE,-3),(65,CYAN,0),(114,YELLOW,3)]:a.plot([76+off,76+off],[180,460],c=c,lw=1.7,ls=(0,(6,4)),alpha=.8)
a.scatter([55],[220],marker='^',s=95,c=YELLOW,zorder=11);a.text(58,226,'STAIR APPROACH',fontsize=8,color=YELLOW)
textbox(fig2,.6,.77,'V1 ACTUAL ARCHITECTURE',['Crossing Y24 / Z210: admitted.','Crossing Y52 / Z280: REJECTED.','Crossing Y84 / Z350: admitted.','Crossing Y128 / Z430: admitted.','Side galleries at X105 rejected; some terraces/supports rejected.'],width=46,fs=10)
textbox(fig2,.6,.47,'RECORDED IMPLEMENTATION GAPS',['26 structures rejected by building clearance.','1,474 primitive pieces admitted; 952 collision boxes.','24 flying cars are scenic, with placeholder bodies.','Only the front train carriage uses the Hi3D model.','No finished continuous ground-to-upper-to-street playtest.','One sampled render is not sustained performance certification.'],width=43,fs=9.2,leading=.033)
fig2.text(.61,.11,'CRITICAL: V1 IS NOT YET AN INTERCONNECTED\nMULTI-ELEVATION PLAYER NETWORK',color=RED,fontsize=11,weight='bold')

# page3 design V02 overlay
fig3=figure(3,'V02 PROPOSED  /  MULTI-LEVEL NETWORK SITE PLAN','Same X80/Z180–460 corridor. Proposals are not imported, collision-validated or approved yet.')
a=axmap(fig3,[.09,.15,.52,.67],(-65,240),(125,520),40);draw_lots(a,label=True)
for y,z,col in [(24,210,MINT),(52,280,PURPLE),(84,350,CYAN),(128,430,YELLOW)]:
 a.plot([55,105],[z,z],c=col,lw=4,alpha=.8)
for br in NEW:
 a.plot([55,105],[br['z'],br['z']],c=RED if br['status']=='redesign' else MINT,lw=2.3,ls='--')
 a.text(112,br['z'],br['id'],color=RED if br['status']=='redesign' else MINT,fontsize=7,va='center')
for spine_x in [55,105]:
 a.plot([spine_x,spine_x],[210,430],c=MINT,lw=3.0,alpha=.9,ls='--')
for v in VERT:
 a.scatter([v['x']],[v['z']],marker='s',s=140,edgecolors=PURPLE,facecolors=DARK,lw=2,zorder=6)
 a.text(v['x']+5,v['z']+4,v['id'].replace('V2-',''),c=PURPLE,fontsize=7)
for h in HUBS:
 a.scatter([h['x']],[h['z']],marker='o',s=110,c=YELLOW,edgecolors=DARK,zorder=7)
 a.text(h['x']-5,h['z']+13,h['id'],color=YELLOW,fontsize=8,weight='bold')
a.plot([80,80],[180,460],c=YELLOW,lw=2.0,alpha=.8,ls=':')
a.text(80,475,'TRAIN ROUTE Y100',color=YELLOW,fontsize=8,ha='center')
textbox(fig3,.67,.78,'NEW NETWORK INTENT',['Three designed loop types: lower, mid and high.','Two walkable spines connected by cross-canyon paths.','Vertical transfer nodes at different Z stations.','A train-station destination with safe, fast and mastery approaches.','Four meaningful activity/encounter hubs plus rooftop landmark.'],width=39,fs=9.7)
textbox(fig3,.67,.43,'NOT CONSTRUCTION-VALIDATED',['Red dashed bridge replaces V1 rejected Y52 span.','All X55/X105 spines must be segmented, stepped and fitted to actual facades.','No bridge automatically inherits a doorway or an anchor.','Test collision, camera, drops, true Threadrail reach before modeling detail.'],width=40,fs=9.2,leading=.034)
fig3.text(.673,.113,'MINT = V02 LINKS   /   PURPLE = VERTICAL TRANSFER\nYELLOW = LANDMARK OR DESTINATION',fontsize=9,color=CYAN,weight='bold')

# page4 section
fig4=figure(4,'VERTICAL SECTION  /  EXISTING VS PROPOSED','Conceptual section looking along the corridor; elevations derive from the latest branch, extra routes are V02 proposals.')
a=fig4.add_axes([.095,.18,.68,.65]);a.set_xlim(170,485);a.set_ylim(-8,160);a.set_xlabel('GAME Z  /  METRES');a.set_ylabel('GAME Y  /  ELEVATION METRES');a.grid(color=GREY,alpha=.25)
for b in bs:
 if abs(b['x']-80)<120 and 140<b['z']<510:
  a.add_patch(Rectangle((b['z']-b['d']/2,0),b['d'],min(155,b['h']),facecolor='#213c50',edgecolor='#526e84',lw=.7,alpha=.47))
for y,z,c in [(24,210,MINT),(52,280,RED),(84,350,CYAN),(128,430,YELLOW)]:
 a.plot([z-16,z+16],[y,y],lw=5,color=c,solid_capstyle='butt')
 a.text(z+20,y+3,('REJECTED' if y==52 else 'V1 CROSSING')+f' {y}m',color=c,fontsize=8)
for y,c in [(38,PURPLE),(65,MINT),(114,CYAN)]:
 a.axhline(y,alpha=.5,c=c,ls=(0,(4,5)));a.text(175,y+2,f'FLYING TRAFFIC  {y}m',fontsize=7,color=c)
a.axhline(100,c=YELLOW,lw=2.5);a.text(175,102,'TRAIN CENTRE Y100',fontsize=9,c=YELLOW)
for z in [215,350,425]:a.plot([z,z],[0,84 if z<400 else 128],c=PURPLE,ls=':',lw=2.8)
for y in [24,52,84,128]: a.plot([205,430],[y,y],c=MINT,alpha=.35,lw=1.7,ls='--')
a.plot([175,480],[0,0],color='#91b4c9',lw=2)
textbox(fig4,.80,.77,'SECTION INTENT',['Y0: retained road network.','Y24: accessible lower public loop.','Y52: service combat / retail middle loop.','Y84: upper walkway and transfer loop.','Y100: moving four-car transit.','Y128: rooftop gallery / high-speed routes.'],width=31,fs=9.2)
textbox(fig4,.80,.43,'CLEARANCE WARNINGS',['Y100 train and Y114 traffic share 14m vertical separation before envelopes.','At Y84 upper bridges, Y65 and Y114 traffic need swept clearance.','Y52 crossing currently rejected by existing building collision.','Drawn facades are reconstructed proxies only.'],width=29,fs=8.7,leading=.032)

# page5 navigation loops 3 columns in graph-like 2D hubs
fig5=figure(5,'AAA QUALITY GATE  /  PLAYABLE MOVEMENT LOOPS','Proposed network topology: three complete loops, two-way transfers, player choice; every edge remains untested.')
axes=[]
for i,(group,c,name) in enumerate([('lower',MINT,'LOW / PUBLIC ROUTE'),('mid',PURPLE,'MID / COMBAT + MARKET'),('high',CYAN,'HIGH / SKILL ROUTE')]):
 ax=fig5.add_axes([.075+i*.305,.31,.273,.48]);ax.set_xlim(37,123);ax.set_ylim(190,460);ax.set_facecolor(BG);ax.grid(alpha=.25,color=GREY)
 es=[e for e in EDGES if e['group']==group]
 for e in es:
  p,q=mapN[e['a']],mapN[e['b']];ax.plot([p['x'],q['x']],[p['z'],q['z']],c=c,lw=3,ls='--' if e['status']!='current admitted proxy' else '-')
 for n in {e['a'] for e in es}|{e['b'] for e in es}:
  p=mapN[n];ax.scatter([p['x']],[p['z']],color=YELLOW,s=90,edgecolors=DARK,zorder=6);ax.text(p['x']+2,p['z']+7,n,color=WHITE,fontsize=7)
 ax.set_title(name,color=c,fontsize=10,weight='bold',pad=8);ax.set_xlabel('X');ax.set_ylabel('Z' if i==0 else '');axes.append(ax)
fig5.text(.085,.235,'SAFE ROUTE: walk, stair and lift links, no banked impulses required.',fontsize=10,color=MINT)
fig5.text(.085,.197,'FAST ROUTE: Threadrail shortcuts with valid physical anchors and momentum checks.',fontsize=10,color=CYAN)
fig5.text(.085,.159,'MASTERY ROUTE: higher-risk Rail Pop + Afterstep sequences with designed recovery.',fontsize=10,color=YELLOW)
fig5.text(.085,.119,'Graph closure is DESIGN INTENT — not evidence of traversable runtime geometry.',fontsize=9,color=RED,fontweight='bold')

# page6 AAA audit and matrix
fig6=figure(6,'DESIGN READINESS  /  CONFLICTS AND ACCEPTANCE','No claim of equivalence to Spider-Man, GTA V or Arkham Knight; benchmark their design principles and validate player routes.')
a=fig6.add_axes([.06,.22,.88,.58]);a.axis('off');
rows=[
 ('01  Reference accuracy','LIVE-WORLD EXPORT','V1 reconstruct is not authoritative; 310 old envelopes must be reconciled'),
 ('02  Real buildability','26 V1 REJECTIONS','Existing building intersects Y52 bridge and galleries/supports'),
 ('03  Connected traversal','FAIL / NOT YET TESTED','3 loops exist only as V02 graph; surface support/clearance pending'),
 ('04  Player agency','NOT IMPLEMENTED','3 destination paths: safe, fast, mastery with no-resource fallback'),
 ('05  Encounters','MISSING','Chase/transit, service-yard combat, civilian-gallery rescue'),
 ('06  Landmarks / navigation','PROPOSED','Transit gate; suspended market; service yard; high roof'),
 ('07  Transport','PARTIAL','Moving four-car train; only front hi3d mesh, near traffic scenic'),
 ('08  Threadrail rules','LIMITED','6–100m physical span / max 55deg / validated anchors required'),
 ('09  Player recovery','NOT TESTED','Missed-landing surfaces, public lift and return loops required'),
 ('10  Game acceptance','NOT MET','No uninterrupted controlled traversal nor matched 60s performance sample'),
]
from matplotlib.table import Table
tb=Table(a,bbox=[0,0,1,1]);he=1/(len(rows)+1);ws=[.26,.21,.53];
for j,h in enumerate(['GATE','CURRENT STATUS','REQUIRED CORRECTION']):
 cell=tb.add_cell(0,j,width=ws[j],height=he,text=h,loc='left',facecolor='#204a60',edgecolor=GREY);cell.get_text().set_color(WHITE);cell.get_text().set_weight('bold');cell.get_text().set_fontsize(9)
for i,row in enumerate(rows,1):
 for j,t in enumerate(row):
  cell=tb.add_cell(i,j,width=ws[j],height=he,text=t,loc='left',facecolor=BG if i%2 else BG2,edgecolor='#375469');cell.PAD=.07;cell.get_text().set_color(YELLOW if j==1 else WHITE);cell.get_text().set_fontsize(8.2)
a.add_table(tb)
fig6.text(.075,.156,'RELEASE GATE: Verify current runtime geometry, V02 3D routes, swept clearances and normal-control traversal before detailed Blender construction.',fontsize=10,color=RED,weight='bold')
fig6.text(.075,.121,'DESIGN BENCHMARK: movement-aware block scale (Spider-Man) • believable districts (GTA V) • multi-system encounters (Arkham Knight).',fontsize=9,color=CYAN)

sheets=[fig1,fig2,fig3,fig4,fig5,fig6]
for i,f in enumerate(sheets,1):
 p=OUT/(f'V02_A{i:02}_'+['Existing_Citywide','CurrentBranch_AsBuilt','Proposed_AAA_Overlay','Vertical_Section','Traversal_Loops','Acceptance_Gates'][i-1]+'.png')
 f.savefig(p,dpi=150,facecolor=DARK);print(p.name)
with PdfPages(OUT/'Saint_Meridian_V02_CurrentBranch_Architectural_Site_Study.pdf') as pdf:
 for f in sheets:pdf.savefig(f,facecolor=DARK)
for f in sheets:plt.close(f)

report='''# SAINT MERIDIAN — V02 ARCHITECTURAL SITE STUDY + AAA LEVEL DESIGN QUALITY GATE

**Baseline:** `brokendeity/sightline-saint-meridian` / `feature/saint-meridian-vertical-megacity-v1`, reviewed 2026-10-24.

**Status:** Current source code and audit inspected. Proposed V02 site improvements have **not** been built, collision-tested or playtested. The original 310-building footprint overlay is a **2026-10-19 reconstructed envelope**, **not** an authenticated runtime export of this branch. Dimensions and positions must be calibrated in the game's actual world.

## What changed since the previous blueprint

The old corridor at X=240–850, Z=-225..240 belongs to the earlier proposed V01 site study and must not be treated as implemented. The current branch's `assets/city/vertical/layout.json` defines a different vertical corridor at **X≈80, Z=180–460**, with cross-bridges at **(Z=210, Y=24), (Z=280, Y=52), (Z=350, Y=84), (Z=430, Y=128)**. The Y52/Z280 crossing is **rejected** by building clearance. The GitHub audit records **26 rejected structural pieces**, **1,474 accepted primitives**, **952 vertical collision boxes**, **24 scenic aerial vehicles** at **Y=38/65/114**, and a **4-car train at Y=100**. The Hi3D front carriage is integrated; middle/rear cars are procedural placeholders.

The repository itself states this is **not** a completed reference-quality playable release: full route continuity, camera, collisions/clearances, encounter activities, vehicle physics and performance acceptance remain pending.

## Architectural diagnosis

The new prototype stacks vertical bridges but has no authoritatively verified full 3D navigation graph. A rejected mid bridge and rejected east galleries prevent assuming continuous routes. The current static centerline train clearance samples are not a swept envelope for all four cars. Scene composition cannot substitute for actual movement, mission and collision coverage.

## V02 proposal (not yet built)

Keep the current corridor and add three physically connected player loops with more than one entry/exit; replace rejected Y52 crossing with clearance-adapted geometry; segment and fit the east/west galleries to actual facades instead of accepting whole-span reject; add two vertical transfer hubs and carefully fitted secondary connectors. Proposals are shown in A-03 and V02 manifest. Do not lock their exact X/Z until an actual live world export is acquired.

**Lower loop:** two compatible Y24 bridges and segmented side walkways; ground approach plus civilian gallery/rescue hub.

**Mid loop:** two compatible Y52 crossings, side galleries and a multi-tier service-yard combat hub. V1 mid crossing remains rejected until reconstructed and verified.

**Upper loop:** two Y84 crossings, short side connections, transfers to transit Y100 and upper roof Y128. Fast/high-risk Threadrail routes use separate physical surface checks.

**Player choice:** one meaningful objective at the train interchange with three actual approaches: (1) public stairs/lifts/walkways with no impulse requirements; (2) faster momentum-based Threadrail shortcuts; (3) high-skill ascent / Rail Pop / Afterstep transfer. All must be tested at zero and full bank resources.

**World activity:** commuter/transit flow, public sky-market, Civic Halo threat/response, service yard maintenance, civilian incident; no claim that these systems currently exist.

## Mandatory quality gate

1. **Live export before Blender detail:** export 310 lot transforms, compound collision volumes, roofs, roads, mission/spawn blockers, new structures and support ownership; reconcile IDs and coordinate axes.
2. **Sustainable graph:** test three rings, 3 routes to station, inter-level links, recovery drop locations, and one return loop, using normal movement without teleporting.
3. **Physical envelope:** Threadrail spans 6–100m and max slope 55° by actual game solver; full physical throws and surface/material validity are additional conditions. Also sweep moving train/taxi envelopes and camera motion through bridges.
4. **Encounter usability:** chase at train, layered combat at service yard, public rescue at market, at least 3 distinct landmarks and 4 discoverable points of interest.
5. **Baseline protection:** no original city duplicate, missions and road graph unchanged; no new destruction ghosts or invisible blockers.
6. **Performance:** matched 60s gameplay recordings and load/CPU/drawcall/triangle/memory metrics; screenshot A/B only count as visual evidence.
7. **Production release:** graybox gameplay gates pass BEFORE full Blender materials and new paid 3D assets.

## Honesty and limitations

This study is a **source-reviewed and coordinate-schematic proposal**, not an as-surveyed CAD drawing. The only current branch evidence inspected is source and recorded GitHub tests, not an independent execution of the live game in this session. The V02 routes are not certified as geometrically feasible because live imported building collider meshes/active walkable components are not available as a spatial dump. All proposed changes need a real full-height physics pass before becoming placement instructions.

## Files

- `V02_A01...A06` architectural PNG sheets
- `Saint_Meridian_V02_CurrentBranch_Architectural_Site_Study.pdf` six-sheet PDF
- `V02_CurrentBranch_SiteStudy_Manifest.json` source facts and proposed geometry/graph
- `V02_AbilityRoute_Matrix.csv` movement network, distances and resource prerequisites
- `V02_Existing_Buildings_ReferenceOnly.csv` previous reconstructed lots (reference only)
- `Blender_V02_Blockout_From_Manifest.py` read-only Blender visualization of proposed geometry (not runtime acceptance)
'''
(OUT/'V02_Source_Audit_and_Design_Gates.md').write_text(report)
print('GENERATED ALL SHEETS')
