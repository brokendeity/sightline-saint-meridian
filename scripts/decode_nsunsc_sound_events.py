"""Read-only extraction of 64-byte ultimate sound-event tables; no audio emulation."""
import argparse, ctypes, gzip, hashlib, json, math, re, struct
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
EVIDENCE=['140928e70','1409291d0','140925ca0','140927a20','140926000']

def decode_events(raw):
 raw=bytes(raw)
 if len(raw)<6:raise ValueError('truncated sound header')
 length,=struct.unpack_from('>I',raw)
 if length!=len(raw)-4:raise ValueError('binary length mismatch')
 count,=struct.unpack_from('<h',raw,4)
 if count<0 or len(raw)!=6+count*64:raise ValueError('unsupported sound record layout')
 events=[]
 for i in range(count):
  r=raw[6+i*64:6+(i+1)*64];name=r[:32].split(b'\0')[0]
  try:name=name.decode('ascii')
  except UnicodeDecodeError as err:raise ValueError('invalid cue encoding') from err
  if any(ord(c)<32 for c in name):raise ValueError('control character in cue')
  values={f'rawI16_{p}':struct.unpack_from('<h',r,p)[0] for p in [32,38,54,56,58]}
  floats={f'rawFloat_{p}':struct.unpack_from('<f',r,p)[0] for p in [34,40,46,50,60]}
  if not all(math.isfinite(x) for x in floats.values()):raise ValueError('nonfinite sound field')
  frame,=struct.unpack_from('<h',r,44)
  events.append(dict(index=i,cueName=name,sourceFrame=frame,sourceSeconds=frame/30,
                     dispatchType=floats['rawFloat_40'],**values,**floats))
 return dict(recordWidth=64,sourceFrameRate=30,eventCount=count,events=events)

def export(destination):
 from extract_nsunsc_library import ROOT,OUT,read_xfbin
 lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'));lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
 rows=[r for r in json.loads((OUT.parent/'cpk-members.json').read_text()) if re.fullmatch(r'data/sound/SndEvent/[^/]+_ev_spl\.xfbin',r['path'])]
 report=dict(schemaVersion=1,bundles={},errors=[],stats={},evidence=[f'output/rea-naruto/ghidra/full-export/main-final/functions/{x[:6]}/{x}.c' for x in EVIDENCE],semantics={
 'sourceFrame':'signed I16 at record+44; sourceSeconds=frame/30. Constant30.0 verified in original PE VA14176396c/file0x176296c.',
 'runtimeTiming':'Setup converts frame/(30/configuredUpdateRate) to integer then signed16; actor speed and global delta affect countdown. SourceSeconds is authored timing, not guaranteed wall-clock playback.',
 'dispatchType':'float at record+40 cast to integer selects runtime handler; preserve numeric type without guessing exact cue/voice semantics.',
 'rawI16_56':'runtime+0x4a, used in stop/lifetime handling; not event start time.',
 'limits':'Cue identities and event timing only. Audio bank lookup, waveform decoding, voice language and original playback remain unresolved.'})
 destination.parent.mkdir(parents=True,exist_ok=True);side=destination.parent/'sound-events';side.mkdir(exist_ok=True)
 for row in rows:
  key=hashlib.sha256((row['archive']+'::'+row['path']).encode()).hexdigest()[:20]
  try:
   with (ROOT/row['archive']).open('rb') as f:f.seek(row['offset']);packed=f.read(row['stored_bytes'])
   if packed.startswith(b'NUCC'):
    decoded=packed
   else:
    b=ctypes.create_string_buffer(row['unpacked_bytes']);n=ctypes.c_size_t();rc=lib.decode_nsunsc(packed,len(packed),b,len(b),ctypes.byref(n))
    if rc or n.value!=row['unpacked_bytes']:raise ValueError(f'decode failed{rc}')
    decoded=b.raw[:n.value]
   obj=read_xfbin(bytearray(decoded));records=[]
   for chunk in (c for p in obj.pages for c in p.chunks if type(c).__name__=='NuccChunkBinary' and c.name.endswith('_snd')):
    try:record=decode_events(chunk.data)
    except ValueError as err:report['errors'].append(dict(key=key,member=row['path'],chunk=chunk.name,error=str(err)));continue
    record.update(name=chunk.name,binarySha256=hashlib.sha256(bytes(chunk.data)).hexdigest());records.append(record)
   data=dict(source=dict(row,sha256=hashlib.sha256(decoded).hexdigest()),records=records)
   target=side/(key+'.json.gz')
   with gzip.open(target,'wt') as f:json.dump(data,f,separators=(',',':'))
   report['bundles'][key]=dict(url='assets/nsunsc-library/sound-events/'+target.name,source=row['path'],records=[dict(name=x['name'],eventCount=x['eventCount']) for x in records])
  except Exception as err:report['errors'].append(dict(key=key,member=row['path'],error=str(err)))
 report['stats']=dict(sourceBundles=len(rows),decodedBundles=len(report['bundles']),tables=sum(len(v['records']) for v in report['bundles'].values()),events=sum(r['eventCount'] for v in report['bundles'].values() for r in v['records']),errors=len(report['errors']))
 destination.write_text(json.dumps(report,separators=(',',':'))+'\n');print(json.dumps(report['stats']))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=BASE/'assets/nsunsc-library/sound-events-index.json');export(p.parse_args().output)
