"""Source generator fields used by the bounded animated-resource replay."""
import gzip,hashlib,json,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/nsunsc-library';KEY='c426d45069048ff1a4d4'
def build():
 data=json.loads(gzip.decompress((OUT/KEY/'particle-sections.json.gz').read_bytes()));attachments=json.loads(gzip.decompress((OUT/KEY/'particle-attachments.json.gz').read_bytes()));rows=[]
 for r in data['records']:
  raw=(ROOT/r['rawUrl']).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['sha256'];gens=[]
  for c in r['generatorConfigs']:
   o=r['sections'][0]['start']+c['generator']*208;f=lambda p:struct.unpack_from('>f',raw,o+p)[0];vec=lambda p,n:[f(p+4*i) for i in range(n)]
   fields=dict(c,positionMode=raw[o+17],directionMode=raw[o+18],rotationMode=raw[o+20],forceFieldMask=struct.unpack_from('>I',raw,o+24)[0],radius=f(0x24),radiusVariation=f(0x28),velocity=f(0x34),velocityVariation=f(0x38),scaleStart=vec(0x5c,3),scaleRandom=vec(0x68,3),scaleMiddle=vec(0x74,3),scaleEnd=vec(0x80,3),scalePivot=f(0x8c),colorStart=vec(0x90,4),colorMiddle=vec(0xa0,4),colorEnd=vec(0xb0,4),colorPivot=f(0xc0))
   gens.append(fields)
  rows.append(dict(name=r['name'],sha256=r['sha256'],rawUrl=r['rawUrl'],generators=gens,events=r['emissionEvents'],resources=r['resources'],attachments=next(x['attachments'] for x in attachments['records'] if x['name']==r['name'] and x['sha256']==r['sha256'])))
 evidence=[]
 for a in ['14131bbb0','14131b5c0','14131c560','14131d460','14131d750','14130c350','14130b200','1412cd5c0','1412cd5f0','1412cd630','1412cd690','141386b70','141385ec0']:
  p=ROOT/'output/rea-naruto/ghidra/full-export/main/functions'/a[:6]/(a+'.c');evidence.append(dict(path=str(p.relative_to(ROOT)),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 result=dict(schemaVersion=1,sourceBundle=KEY,records=rows,evidence=evidence,clock=dict(configuredFps=30,policy='Nominal source 30 Hz inspection; runtime clock adaptation not yet verified.'),rng=dict(multiplier=214013,increment=2531011,mask=32767,seed=1,policy='Recovered LCG equation; local deterministic seed. Original global RNG state/call ordering unavailable.'),limits=['Animated NuccChunkAnm resources only in this replay; sprite/force-field simulation remains unsupported.','Source point emissions only; distributed or directional generators are withheld.','Source attachment identity and origin are exact; attachment orientation normalization remains under investigation.','Nominal lifetime, scale and color envelopes are recovered; exact frame ordering awaits reference.','Particle rotation, spawn jitter and velocity terms are not yet applied by the bounded animated-resource preview.','Bounded INSPECTION only, not original-ready: selected runtime manager force-field lists are unrecovered. No births are certified source-original-ready until required motion, RNG and force inputs are established.'],verified=False)
 p=OUT/'minato-effect-runtime.json';p.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n');print(json.dumps(dict(records=len(rows),generators=sum(len(x['generators']) for x in rows))))
if __name__=='__main__':build()
