"""Recover every hu000 PKA in the existing c000_001 index, preserving prior outputs.

This is a complete *indexed rig package* inventory, not a claim that every game
archive or state-machine dependency has been recovered. Never executes the game.
"""
import hashlib,json
from pathlib import Path
from collections import Counter
from extract_forspoken_movement_set import selected_ranges
from extract_forspoken_asset import decode_lz4
from inspect_forspoken_archive import OUT,ARCHIVE
from inspect_forspoken_pka import inspect,frames_evidence
from decode_forspoken_movement import decode_clip

def main():
 target=OUT/'full-player-inventory';target.mkdir(exist_ok=True)
 entries=json.loads((OUT/'c000_001-index.json').read_text())
 selected=[e for e in entries if '/hu000/anim/' in e['path'] and e['path'].endswith('.pka') and e['size']]
 prior={e['entry']:e for e in json.loads((OUT/'movement-assets/manifest.json').read_text())['entries']}
 missing=[e for e in selected if e['entry'] not in prior]
 plan=dict(archive=str(ARCHIVE),member='FORSPOKEN/datas/c000_001.earc',scope='All hu000 animation PKA packages in this archive index',entries=selected,newEntries=len(missing),newStoredBytes=sum(e['stored'] for e in missing),maxDecodedPrefixBytes=max(e['offset']+e['stored'] for e in missing),wholeMemberCrcVerified=False,executed=False)
 (target/'extraction-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
 # Explicit bound is based on the last selected indexed record, never arbitrary
 # unbounded archive expansion. Only the selected 53MB is retained in memory.
 todo=[e for e in missing if not (target/(str(e['entry'])+'-'+Path(e['path']).name)).exists()]
 raws=selected_ranges(plan['member'],todo,max_prefix_bytes=plan['maxDecodedPrefixBytes'])
 for e in todo:
  raw=bytes(raws[e['entry']]);decoded=decode_lz4(raw,e['size']) if raw[:4]==b'\x04\x22\x4d\x18' else raw
  if len(decoded)!=e['size']:raise ValueError('Inner asset size mismatch')
  (target/(str(e['entry'])+'-'+Path(e['path']).name)).write_bytes(decoded)
  print('Recovered',e['entry'],e['path'],flush=True)
 rig=json.loads((OUT/'hu000-rig.json').read_text());packages=[];clips=[]
 for e in selected:
  path=Path(prior[e['entry']]['output']) if e['entry'] in prior else target/(str(e['entry'])+'-'+Path(e['path']).name)
  digest=hashlib.sha256(path.read_bytes()).hexdigest();pack=inspect(path);folder=target/'ani'/path.stem;folder.mkdir(parents=True,exist_ok=True)
  packages.append(dict(**e,sha256=digest,output=str(path),clips=len(pack['clips']),previouslyRecovered=e['entry'] in prior))
  for c in pack['clips']:
   row=dict(pack=e['path'],animationId=c['animationId'],durationSeconds=c['durationSeconds'],packageSha256=digest,status='indexed')
   try:
    ani=frames_evidence({**pack,'clips':[c]},path,folder)['clips'][0]
    row.update(file=ani['file']);decoded=decode_clip(row,rig)
    dest=target/'tracks'/path.stem/(c['animationId'].removeprefix('0x')+'.json');dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(decoded,separators=(',',':'))+'\n');row.update(status='decoded',output=str(dest),channels=dict(Counter(t['channel'] for t in decoded['tracks'])),sourceSha256=decoded['sourceSha256'])
   except Exception as error:row.update(status='unsupported',reason=str(error))
   clips.append(row)
  doc=dict(schema='forspoken-full-player-inventory-v1',scope=plan['scope'],allGameArchivesExhausted=False,originalControllerRecovered=False,packageCount=len(selected),processedPackages=len(packages),previousPackageCount=12,counts=dict(Counter(c['status'] for c in clips)),packages=packages,clips=clips)
  (target/'manifest.json').write_text(json.dumps(doc,indent=2)+'\n')
  print('Indexed/decoded package',path.stem,len(clips),dict(Counter(c['status'] for c in clips)),flush=True)
 print('COMPLETE',dict(Counter(c['status'] for c in clips)),flush=True)
if __name__=='__main__':main()
