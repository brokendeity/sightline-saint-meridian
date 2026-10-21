#!/usr/bin/env python3
"""Regression checks for the bounded AMDL reader and preserved source rig."""
import importlib.util, struct, tempfile
from pathlib import Path
spec=importlib.util.spec_from_file_location('amdl',Path(__file__).with_name('inspect_forspoken_amdl.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
p=Path('output/rea-forspoken/hu000.amdl');data=p.read_bytes();rig=m.inspect(p)
assert rig['source']['sha256']=='46814fbb31d8fccd20146eebced063df10697dca169d72d5cd65e4f3774bcfd3'
assert rig['validation']['boneCount']==5977 and rig['validation']['roots']==[0]
assert rig['bones'][0]['name']=='Trans' and rig['bones'][1]['name']=='C_Hip'
assert [x['count'] for x in rig['rawTypes']]==[5978,2,5976,5977]
assert [x['count'] for x in rig['channels']]==[1,1,5976,0,1,1,5976,5977,0]
mutations=[]
mutations.append(data[:480])
b=bytearray(data);struct.pack_into('<Q',b,456,len(b)+100);mutations.append(b)
b=bytearray(data);struct.pack_into('<h',b,0xa0df4,0);mutations.append(b)
b=bytearray(data);struct.pack_into('<f',b,0xaf770,float('nan'));mutations.append(b)
b=bytearray(data);struct.pack_into('<f',b,0xaf770,20);mutations.append(b)
with tempfile.TemporaryDirectory() as tmp:
 for i,b in enumerate(mutations):
  f=Path(tmp)/str(i);f.write_bytes(b)
  try:m.inspect(f)
  except ValueError:pass
  else:raise AssertionError(f'Corrupt case {i} accepted')
print('AMDL source rig and 5 malformed input checks passed')
