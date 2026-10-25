"""Blender-authored parapets on exposed public deck/stair boundaries.

All collision volumes are the visible parapet geometry. Adjacent supported
surfaces suppress interior rails. Authored ability paths reserve explicit
openings; those openings keep their recovery/acceptance requirements.
"""
import math,bisect

def build_public_guardrails(records,graph,emit):
 floors=[r for r in records if r['walkable']]
 ordered=sorted(floors,key=lambda r:r['box']['max'][1]);heights=[r['box']['max'][1]for r in ordered]
 prefixes=('gallery-','endpad-','upper-gallery-','upper-endpad-','upper-crossing','V1-BR-','V2-BR-','suspended-market','service-yard','service-mezzanine-','station-concourse','station-exit-side-link','station-north-access','station-stair-landing-','observation-deck')
 def eligible(r):
  return r['box']['max'][1]>1 and (r.get('stair')or r.get('stairLanding')or r.get('sourceStructure',r['id']).startswith(prefixes))
 def subtract(intervals,a,b):
  out=[]
  for lo,hi in intervals:
   if b<=lo+1e-6 or a>=hi-1e-6:out.append((lo,hi));continue
   if a>lo+1e-6:out.append((lo,a))
   if b<hi-1e-6:out.append((b,hi))
  return out
 ability_paths=[e['path']for e in graph['edges']if e['traversalAgent']=='player'and e['ability']in ['threadrail','rail-pop','wall-climb','controlled-drop','afterstep-transfer','flow-run','jump']]
 openings=graph.get('guardrailOpenings',[]);count=0;length=0;reserved=[]
 for r in floors:
  if not eligible(r):continue
  box=r['box'];y=box['max'][1];near=ordered[bisect.bisect_left(heights,y-.201):bisect.bisect_right(heights,y+.201)]
  for axis in [0,2]:
   along=2-axis
   for sign in [-1,1]:
    plane=box['min'if sign<0 else'max'][axis];intervals=[(box['min'][along],box['max'][along])];outside=plane+sign*.02
    for q in near:
     if q is r:continue
     b=q['box']
     if b['min'][axis]-1e-6<outside<b['max'][axis]+1e-6:intervals=subtract(intervals,b['min'][along],b['max'][along])
     if not intervals:break
    # Preserve deliberate source-graph ability corridors at the floor edge.
    for path in ability_paths:
     for a,b in zip(path,path[1:]):
      delta=b[axis]-a[axis]
      if abs(delta)<1e-8:continue
      t=(plane-a[axis])/delta
      if not 0<=t<=1:continue
      h=a[1]+t*(b[1]-a[1]);v=a[along]+t*(b[along]-a[along])
      if y-1<=h<=y+2:intervals=subtract(intervals,v-1.2,v+1.2)
    for opening in openings:
     b=opening['box']
     if b['min'][1]<=y<=b['max'][1]and b['min'][axis]-.05<=plane<=b['max'][axis]+.05:
      old=intervals;intervals=subtract(intervals,b['min'][along],b['max'][along])
      if old!=intervals:reserved.append({'opening':opening['id'],'surface':r['id'],'axis':axis,'plane':plane})
    for lo,hi in intervals:
     if hi-lo<.12:continue
     # Slightly inset, with the complete collision visible as a low parapet.
     center=[0,y+.55,0];center[axis]=plane-sign*.05;center[along]=(lo+hi)/2
     size=[0,1.1,0];size[axis]=.08;size[along]=hi-lo
     id=f'public-guard-{count:04d}';emit(id,center,size,r['collection'],kind='steel',solid=True,walkable=False,guardrail=True,sourceSurface=r['id'],edgeAxis=axis,edgeSign=sign)
     cap=center.copy();cap[1]=y+1.115;cap_size=size.copy();cap_size[1]=.025
     emit(id+'-cap',cap,cap_size,r['collection'],kind='cyan',solid=False,walkable=False,guardrail=True,sourceSurface=r['id'])
     count+=1;length+=hi-lo
 return {'status':'authored prototype; requires runtime edge, circulation, ability and clearance acceptance','parapets':count,'lengthMetres':length,'heightMetres':1.1,'thicknessMetres':.08,'reservedOpenings':reserved,'collisionPolicy':'solid visible low parapets; cyan caps are decoration only'}
