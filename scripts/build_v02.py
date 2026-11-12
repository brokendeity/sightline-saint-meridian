"""Build a V02 playable HTML from the canonical source in src/v02/ (replaces the HTML patch chain).

The page template src/v02/page.html holds the markup. Each inline <script>/<style> body is an include marker:
  @@include file:<path>@@                      one file, verbatim
  @@include file:<path>|drop-extract-note@@    one file minus a leading "/* Extracted verbatim ... */" header line
  @@include list:<path.json>@@                 the entries of a JSON list, in order: {"file": path} or {"text": str}
Paths are relative to the repository root. Modules that the old builds inlined unchanged are included straight from
scripts/ (one copy); the engine's own code lives in src/v02/engine/.

Usage (run from the repository root):
  python3 scripts/build_v02.py --check [BUILD.html]
      (Without a name: the newest build, from src/v02/latest.json.) Assemble in memory with module ?v= tags exactly as written in the template; report whether the result is
      byte-identical to that build. Writes nothing.
  python3 scripts/build_v02.py --out SIGHTLINE_SAINT_MERIDIAN_V02_<NAME>.html --record V02_<Name>_Build.json \
      --label "what changed" [--previous V02_<Prev>_Build.json, default: the newest build's record]
      Write a NEW build. Refuses to overwrite an existing file (rule: never overwrite older playable builds).
      Refreshes every stale ?v= cache tag (a tag whose hash prefix no longer matches its file) in the build AND in
      src/v02/page.html, so --check against the newest build always passes. Writes a build record that carries the
      previous record's fields, so existing test runners (V02_ACTION_BUILD=...) still work, and updates src/v02/latest.json.
  python3 scripts/build_v02.py --map
      Print the source map: which file each part of the page comes from, with sizes.
"""
from pathlib import Path
import argparse,hashlib,json,re,sys
R=Path(__file__).resolve().parents[1];SRC=R/'src/v02';DEV=R/'development/vertical-city-v02'
TEMPLATE=SRC/'page.html';LATEST=SRC/'latest.json';MARKER=re.compile(r'@@include ([^@]+)@@')
EXTRACT_NOTE=re.compile(r'\A/\* Extracted verbatim from [^\n]*?\*/')
sha=lambda b:hashlib.sha256(b).hexdigest()
def read(path):
 p=R/path;assert p.is_file(),'missing source file: '+str(path);return p.read_bytes().decode('utf-8')
def resolve(spec,used):
 kind,_,rest=spec.partition(':');path,_,option=rest.partition('|')
 if kind=='file':
  text=read(path);used.append(path)
  if option=='drop-extract-note':
   m=EXTRACT_NOTE.match(text);assert m,path+' has no extract note to drop';text=text[m.end():]
  else:assert not option,'unknown include option: '+option
  return text
 if kind=='list':
  used.append(path);out=[]
  for entry in json.loads(read(path)):
   if 'file' in entry:out.append(read(entry['file']));used.append(entry['file'])
   else:out.append(entry['text'])
  return ''.join(out)
 raise ValueError('unknown include kind: '+spec)
def assemble():
 template=TEMPLATE.read_bytes().decode('utf-8');used=['src/v02/page.html']
 page=MARKER.sub(lambda m:resolve(m.group(1),used),template)
 assert '@@include' not in page,'unresolved include marker'
 return page,used
TAG=re.compile(r'((?:src|href)="(scripts/[^"?]+)\?v=)([0-9a-f]{8,64})')
def stale_tags(page):
 out=[]
 for m in TAG.finditer(page):
  path,v=m.group(2),m.group(3);p=R/path
  if p.is_file() and not sha(p.read_bytes()).startswith(v):out.append((path,v,sha(p.read_bytes())[:len(v)]))
 return out
def refresh(page):
 return TAG.sub(lambda m:m.group(1)+(sha((R/m.group(2)).read_bytes())[:len(m.group(3))] if (R/m.group(2)).is_file() else m.group(3)),page)
def main():
 a=argparse.ArgumentParser();a.add_argument('--check',nargs='?',const='LATEST');a.add_argument('--out');a.add_argument('--record');a.add_argument('--label',default='')
 a.add_argument('--previous');a.add_argument('--map',action='store_true');o=a.parse_args()
 page,used=assemble()
 if o.map:
  for path in dict.fromkeys(used):print(f"{(R/path).stat().st_size:9d}  {path}")
  return
 if o.check=='LATEST':o.check=json.loads(LATEST.read_text())['entry']
 if o.check:
  ref=(R/o.check).read_bytes();mine=page.encode('utf-8')
  if mine==ref:print('IDENTICAL',o.check,sha(ref));stale=stale_tags(page);[print('  note: stale ?v= tag',*x) for x in stale];return
  i=next((k for k in range(min(len(mine),len(ref))) if mine[k]!=ref[k]),min(len(mine),len(ref)))
  print('DIFFERENT at byte',i,'sizes',len(mine),len(ref));print('  source:',mine[max(0,i-80):i+80]);print('  build :',ref[max(0,i-80):i+80]);sys.exit(1)
 if o.out:
  assert o.out.endswith('.html') and '/' not in o.out,'--out is a new .html file name in the repository root'
  assert o.record and o.record.endswith('_Build.json'),'--record V02_<Name>_Build.json is required'
  stale=stale_tags(page);page=refresh(page);data=page.encode('utf-8');target=R/o.out;record=DEV/o.record
  # Keep the invariant "src/v02 rebuilds the latest build byte for byte": refreshed tags go back into the template.
  template=TEMPLATE.read_bytes().decode('utf-8');fresh=refresh(template)
  if fresh!=template:TEMPLATE.write_bytes(fresh.encode('utf-8'));print('updated ?v= tags in src/v02/page.html:',', '.join(p for p,_,_ in stale))
  if target.exists():
   assert target.read_bytes()==data,'refusing to overwrite an existing, different build: '+o.out;print('already built, identical (record left as it is):',o.out);return
  target.write_bytes(data)
  assert not record.exists() or json.loads(record.read_text()).get('entry')==o.out,'refusing to overwrite another build record: '+o.record
  previous=o.previous or json.loads(LATEST.read_text())['record'];prev=json.loads((DEV/previous).read_text());assert sha((R/prev['entry']).read_bytes())==prev['entrySHA256'],'previous build changed'
  files={p:sha((R/p).read_bytes()) for p in dict.fromkeys(used)}
  report={**prev,'status':'BUILT from the canonical source (src/v02); '+o.label,'entry':o.out,'entrySHA256':sha(data),'source':prev['entry'],'sourceSHA256':prev['entrySHA256'],
   'builder':'scripts/build_v02.py','builderSHA256':sha(Path(__file__).read_bytes()),'canonicalSource':{'template':'src/v02/page.html','files':files},
   'refreshedVersionTags':[{'path':p,'from':v,'to':n} for p,v,n in stale],'hooks':[],'scope':o.label}
  record.write_text(json.dumps(report,indent=2)+'\n');LATEST.write_text(json.dumps({'entry':o.out,'record':o.record,'entrySHA256':report['entrySHA256']},indent=1)+'\n');print(o.out,report['entrySHA256'],'record',o.record,'refreshed tags',len(stale));return
 a.print_help()
if __name__=='__main__':main()
