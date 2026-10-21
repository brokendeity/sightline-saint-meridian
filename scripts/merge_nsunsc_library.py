"""Publish every successfully extracted timeline; keep failures and incomplete components explicit."""
import json,re,collections,gzip
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];dest=ROOT/'assets/nsunsc-library'
base=ROOT/'assets/motion-library/base-catalog.json';cat=json.loads((base if base.exists() else ROOT/'output/motion-library-v1/catalog.json').read_text());families={f['id']:f for f in cat['families']};bundles={};rigs={};extra=[];fail=[]
rows=[json.loads(p.read_text()) for p in sorted(dest.glob('*/index.json'))]
for r in rows:
 if r['status']!='extracted':fail.append(dict(path=r['path'],archive=r['archive'],error=r.get('error')));continue
 bundles[r['key']]=dict(scene=r['scene'],path=r['path'],archive=r['archive'],unsupported=len(r.get('unsupported',[])),errors=r['errors'])
 if r.get('rigs'):
  if 'rigNames' not in r:
   scene=json.loads(gzip.decompress((ROOT/r['scene']).read_bytes()));r['rigNames']=[x['name'] for x in scene['rigs']];(dest/r['key']/'index.json').write_text(json.dumps(r,separators=(',',':')))
  for name in r['rigNames']:
   if name not in rigs or re.search(r'bod\d+\.xfbin$',r['path']):rigs[name]=r['scene']
 m=re.match(r'data/spc/([0-9][a-z0-9]{3})',r['path'])
 if not m:continue
 code=m[1];f=families.setdefault(code,dict(id=code,name=code.upper(),identity='source ID; identity pending',assets=[],clips=[]))
 for a in r['animations']:
  category='Ultimate bundles' if 'spl' in Path(r['path']).name else 'Power bundles' if 'skl' in Path(r['path']).name else 'Effects' if 'eff' in Path(r['path']).name else 'Stances & other'
  if category=='Stances & other':
   n=a['name'].lower()
   if any(x in n for x in ['cmb','cma','attack','punch','kick']):category='Attacks'
   elif any(x in n for x in ['grd','dmg','dsb','guard','evade']):category='Defense'
   elif any(x in n for x in ['jmp','run','walk','dash','fall','move']):category='Movement'
  cid='native:'+r['key']+':'+str(a['index']);f['clips'].append(cid)
  extra.append(dict(id=cid,name=a['name'],sourceAnimation=a['name'],family=code,category=category,duration=a['duration'],status='native-preview',nativeBundle=r['key'],nativeIndex=a['index'],sourceFolder=r['path'],timing='source seconds preserved',notes='Native source timeline. Mesh/rig dependencies resolve where decoded; proprietary particle programs and original phase ordering remain unverified.',formats=a['formats'],clumps=a['clumps']))
namesPath=dest/'character-names.json'
if namesPath.exists():
 names=json.loads(namesPath.read_text())['characters']
 for code,variants in names.items():
  if code in families:
   families[code]['name']=' / '.join(dict.fromkeys(v['name'] for v in variants));families[code]['identity']='verified from playerSettingParam + English message table';families[code]['variants']=variants
for f in families.values():f['previewCount']=len(f['clips'])
cat.update(version=2,clips=cat['clips']+extra,families=sorted(families.values(),key=lambda f:(not bool(f['clips']),f['name'])),nativeBundles=bundles,nativeRigs=rigs,extractionFailures=fail,boundary='Native source timelines now include skeletal, camera and material tracks. Unknown particle programs are preserved but not simulated. Source IDs include variants and unverified identities. Ultimate phases are separate source timelines; original phase ordering and runtime triggers remain unverified.')
cat['stats'].update(namedFamilies=sum('variants' in f for f in families.values()),partialBundles=sum(bool(r['errors']) and r['status']=='extracted' for r in rows),nativeTimelines=len(extra),extractedBundles=len(bundles),failedBundles=len(fail),previewFamilies=sum(bool(f['clips']) and f['id']!='native' for f in families.values()),clips=len(cat['clips']))
(ROOT/'assets/motion-library/catalog.json').write_text(json.dumps(cat,separators=(',',':')))
(dest/'coverage.json').write_text(json.dumps(dict(stats=cat['stats'],failures=fail,textureFailures=[dict(path=r['path'],errors=r['errors']) for r in rows if r['errors']],boundary=cat['boundary']),indent=2));print(cat['stats'])
