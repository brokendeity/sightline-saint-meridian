#!/usr/bin/env python3
import json,tempfile,struct
from pathlib import Path
from inspect_forspoken_binding import parse_binding,ROOT
rig=json.loads((ROOT/'hu000-rig.json').read_text())
manifest=json.loads((ROOT/'pka-ani/manifest.json').read_text())
for c in manifest['clips']:
 result=parse_binding(Path(c['file']),rig,c['candidateBitMasks'][0]['setBits'])
 bindings=[v for ch in result['channels'] for v in ch['animatedPartBindings']]
 assert len(bindings)==c['seedFrame']['keyCount']
 assert len({x['partBit'] for x in bindings})==len(bindings)
 assert result['allIdsMatch']
 with tempfile.TemporaryDirectory() as tmp:
  b=bytearray(Path(c['file']).read_bytes());base=result['anibOffset']
  struct.pack_into('<I',b,base,0xfffffffe)
  p=Path(tmp)/'bad.ani';p.write_bytes(b)
  try:parse_binding(p,rig)
  except ValueError:pass
  else:raise AssertionError('Invalid root offset accepted')
print('6 ANIB exact source-ID/mask/seed-count checks and 6 malformed-offset cases passed')
