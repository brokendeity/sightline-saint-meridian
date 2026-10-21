"""Build a provenance-aware library from shipped motion packs and the local CPK index."""
import json,gzip,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/motion-library';OUT.mkdir(exist_ok=True)
def read(p):
 p=ROOT/p;return json.loads(gzip.decompress(p.read_bytes()) if p.suffix=='.gz' else p.read_text())
def writegz(p,x):p.write_bytes(gzip.compress(json.dumps(x,separators=(',',':')).encode(),mtime=0))
index=read('assets/backspool/action-v2-preview-index.json');manifest=read('assets/backspool/action-v2-manifest.json');moves={m['clipId']:m for m in manifest['moves']}
labels={'1nrt':'Naruto','1roc':'Rock Lee · early source','2roc':'Rock Lee','2guy':'Might Guy','2nej':'Neji','2sik':'Shikamaru','3mnt':'Minato','4ssi':'Shisui','2kks':'Kakashi','2ssk':'Sasuke','2skr':'Sakura','2tnd':'Tsunade','2hnt':'Hinata','2itc':'Itachi'}
packs={p: {x['id']:x for x in read(p)} for p in sorted({x['packUrl'] for x in index})};fresh={x['id']:x for x in read('output/rea-naruto/animation-pass/action-v2/source-retarget.json.gz')}
clips=[];split={};families={}
def role(row):
 m=moves.get(row['id'])
 if m:return 'Attacks'
 s=(row.get('sourceAnimation') or row['name']).lower()
 if 'cmb' in s or 'cma' in s or any(t in s for t in ['kick','punch','hook','strike','attack']):return 'Attacks'
 if any(t in s for t in ['grd','guard','dodge','evade','dsb','dmg','hit']):return 'Defense'
 if any(t in s for t in ['jmp','jump','flip','fall','climb','run','walk','sprint','dash','move','rail','hang']):return 'Movement'
 return 'Stances & other'
for row in index:
 item=fresh.get(row['id']) or packs[row['packUrl']][row['id']];src=row.get('sourceAnimation') or item.get('sourceAnimation');code=src[:4] if src and re.match('[0-9][a-z0-9]{3}',src) else 'native';label=labels.get(code,row.get('characterLabel') or 'Backspool native');m=moves.get(row['id']);family=families.setdefault(code,dict(id=code,name=label,identity='verified source family' if code in labels else 'native library' if code=='native' else 'source ID; identity pending',assets=[],clips=[]))
 metadata=dict(id=row['id'],name=m['name'] if m else row['name'].replace('Storm ','').replace('storm-local-',''),family=code,category=role(row),duration=item['clip']['duration'],sourceAnimation=src,sourceFolder=row['sourceFolder'],status='combat-ready' if m else 'preview',pack=f'assets/motion-library/{code}.json.gz',timing='authored Backspool segment' if m else 'source seconds preserved' if row['id'] in fresh else 'existing retarget timing',moveId=m['id'] if m else None,move=m,notes='Body motion on Backspool; source weapons, powers and effects are not included.' if code!='native' else 'Native Backspool motion.')
 clips.append(metadata);family['clips'].append(row['id']);split.setdefault(code,[]).append(item)
archive=read('output/rea-naruto/cpk-members.json');bodycodes={re.match(r'data/spc/([0-9][a-z0-9]{3})bod',r['path'])[1] for r in archive if re.match(r'data/spc/[0-9][a-z0-9]{3}bod',r['path'])}
for code in bodycodes:families.setdefault(code,dict(id=code,name=labels.get(code,code.upper()),identity='verified source family' if code in labels else 'source ID; identity pending',assets=[],clips=[]))
for r in archive:
 match=re.match(r'data/spc/([0-9][a-z0-9]{3})(.*)',r['path'])
 if not match or match[1] not in families:continue
 tail=match[2];category='Ultimate bundles' if tail.startswith('spl') else 'Power bundles' if tail.startswith('skl') else 'Effects' if tail.startswith('eff') else 'Motion bundles' if re.match(r'bod\d+[cl](?:\.|_)',tail) else 'Models & other'
 families[match[1]]['assets'].append(dict(id=r['archive']+'::'+r['path'],name=Path(r['path']).name,path=r['path'],archive=r['archive'],category=category,bytes=r['unpacked_bytes'],status='indexed-only',note='Filename-based bundle grouping; contents and behavior have not been validated.'))
for code,rows in split.items():writegz(OUT/(code+'.json.gz'),rows)
for f in families.values():f['previewCount']=len(f['clips']);f['indexedCount']=len(f['assets'])
result=dict(version=1,source='Local NSUNSC archive inventory and recovered motion packs',boundary='Body families include variants and unverified IDs. Indexed bundles are not imported or preview-ready powers/models. Original STORM gameplay timings and behavior are not recovered by these previews.',families=sorted(families.values(),key=lambda f:(not bool(f['clips']),f['name'])),clips=clips,stats=dict(bodyFamilies=len(bodycodes),previewFamilies=len([f for f in families.values() if f['clips'] and f['id']!='native']),clips=len(clips),combatMoves=len(moves)))
(OUT/'catalog.json').write_text(json.dumps(result,separators=(',',':')))
# Reuse locally shipped, attributed Three.js / fflate / FBX loader, no network dependency.
html=(ROOT/'SIGHTLINE_SAINT_MERIDIAN_TOON.html').read_text();scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html)
(OUT/'engine.js').write_text('\n;\n'.join(scripts[:3]))
(OUT/'build.json').write_text(json.dumps(dict(catalogSha256=hashlib.sha256((OUT/'catalog.json').read_bytes()).hexdigest(),stats=result['stats']),indent=2))
print(result['stats'])

# Preserve the retargeted catalog as the base of the native source expansion.
(OUT/"base-catalog.json").write_text(json.dumps(result,separators=(",",":")))
if (ROOT/"assets/nsunsc-library/character-names.json").exists():
 import subprocess,sys
 subprocess.run([sys.executable,str(ROOT/"scripts/merge_nsunsc_library.py")],check=True)
