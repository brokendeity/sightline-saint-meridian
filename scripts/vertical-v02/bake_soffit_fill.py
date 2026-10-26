"""Bake a scalar shader data atlas from actual installed soffit luminaires.

This is radiance-weight data, not a painted replacement city texture.
"""
from pathlib import Path
import json,hashlib,math
from PIL import Image
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';OUT=R/'assets/city/vertical-v02/visual';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();source=R/'assets/city/vertical-v02/transit-world/manifest.json';m=json.loads(source.read_text());fixtures=[r for r in m['records']if r['id'].startswith('detail-soffit-')];levels=sorted(set(r['center'][1]for r in fixtures));W=128;H=256;x0=40;z0=200;sx=80;sz=270
pixels=[]
for level in levels:
 lights=[r for r in fixtures if r['center'][1]==level]
 for j in range(H):
  z=z0+(j+.5)/H*sz
  for i in range(W):
   x=x0+(i+.5)/W*sx;weight=0
   for light in lights:
    dx=max(0,abs(x-light['center'][0])-light['size'][0]/2);dz=max(0,abs(z-light['center'][2])-light['size'][2]/2)
    if dx*dx+dz*dz<100:weight+=math.exp(-(dx*dx+dz*dz)/(2*2.2**2))*.7
   pixels.append(round(255*min(1,weight)))
image=Image.new('L',(W,H*len(levels)));image.putdata(pixels);file=OUT/'soffit_fill.png';image.save(file,optimize=True)
result={'schema':'sm-v02-soffit-weight-1','status':'Authored scalar reflected-fill approximation; not physical light transport','url':str(file.relative_to(R)),'sha256':sha(file),'sourceManifestSHA256':sha(source),'bakerSHA256':sha(Path(__file__)),'fixtureCount':len(fixtures),'levels':levels,'tileWidth':W,'tileHeight':H,'boundsXZ':[x0,z0,sx,sz],'colorLinear':[.035,.014,.0045],'scope':'One shared static data texture, twelve source elevations, no dynamic lights. Only downward-facing architecture near installed luminaires receives the authored fill.'};(OUT/'soffit_fill.json').write_text(json.dumps(result,indent=2)+'\n');print('Baked',len(fixtures),'source fixtures across',len(levels),'levels;',file.stat().st_size,'bytes')
