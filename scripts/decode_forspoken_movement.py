#!/usr/bin/env python3
"""Bounded source-channel decoder across recovered movement packages.
Constant codec/scale selection is explicit and remains reviewable in diagnostics.
No retargeted gameplay clips are produced by this script.
"""
import argparse,hashlib,json,math,struct
from collections import Counter
from pathlib import Path
from decode_forspoken_seed import quaternion48,F
from decode_forspoken_vault_tracks import indices_for_frame
from inspect_forspoken_pka import parse_frame
from inspect_forspoken_binding import parse_binding
ROOT=Path(__file__).resolve().parents[1]/'output/rea-forspoken'
RAW_BY_CHANNEL={0:0,1:0,2:0,3:0,4:2,5:2,6:3,7:5}
def decode_clip(entry,rig):
 p=Path(entry['file']);b=p.read_bytes();meta=json.loads(p.with_suffix('.frames.json').read_text())
 if hashlib.sha256(b).hexdigest()!=meta['sha256']:raise ValueError('ANI identity changed')
 fps=struct.unpack_from('<I',b,12)[0];duration=struct.unpack_from('<f',b,0)[0]
 if fps not in (15,30,60):raise ValueError('Unvalidated source FPS')
 for frame in [meta['seedFrame']]+meta['frames']:
  actual=parse_frame(b,frame['offset'],len(b))
  if any(actual.get(k)!=frame.get(k) for k in actual):raise ValueError('Frame sidecar mismatch')
 if len(meta['frames'])!=round(duration*fps)+1:raise ValueError('Frame count mismatch')
 if any(n['type']=='0x106' for n in meta['customDataNodes']):raise ValueError('Packed override requires explicit decoding')
 active=set(meta['candidateBitMasks'][0]['setBits']);constant=set(meta['candidateBitMasks'][1]['setBits'])
 if not constant<=active:raise ValueError('Constant mask outside active mask')
 binding=parse_binding(p,rig,sorted(active));parts=[]
 for ch in binding['channels']:
  if ch['channel'] not in RAW_BY_CHANNEL and ch['animatedPartBindings']:raise ValueError('Unsupported source channel')
  for item in ch['animatedPartBindings']:parts.append({**item,'channel':ch['name'],'rawType':RAW_BY_CHANNEL[ch['channel']],'constant':item['partBit'] in constant})
 parts.sort(key=lambda x:x['partBit']);animated=[x for x in parts if not x['constant']];constants=[x for x in parts if x['constant']]
 counts=list(struct.unpack_from('<6H',b,24));got=[sum(x['rawType']==i for x in animated) for i in range(6)]
 if got!=counts:raise ValueError(f'Header/raw animated count mismatch {counts} != {got}')
 animated_raw=[i for i,n in enumerate(counts) if n];constant_raw=sorted(set(x['rawType'] for x in constants));cache_count=struct.unpack_from('<I',b,20)[0]
 if cache_count!=len(animated_raw):raise ValueError('Cache group count mismatch')
 group_sizes=[counts[i] for i in animated_raw];groups={raw:i for i,raw in enumerate(animated_raw)}
 unpack=struct.unpack_from('<Q',b,88)[0];custom=struct.unpack_from('<Q',b,96)[0];scale_count=len(animated_raw)+len(constant_raw)
 if unpack+4*scale_count>custom:raise ValueError('Scale array exceeds custom index')
 scales=list(struct.unpack_from('<%df'%scale_count,b,unpack)) if scale_count else []
 if not all(math.isfinite(x) and x>=0 for x in scales):raise ValueError('Invalid unpack scale')
 tracks=[{**x,'timesSeconds':[],'values':[],'sourceKeyOffsets':[]} for x in animated+constants];due=[0]*len(animated);events=0
 def append(index,offset,frame,scale):
  t=tracks[index];raw=b[offset:offset+6]
  if len(raw)!=6:raise ValueError('Truncated packed key')
  val=quaternion48(raw,True,False) if t['rawType']==0 else [F(x*scale) for x in struct.unpack('<3h',raw)]
  if not all(math.isfinite(x) for x in val):raise ValueError('Nonfinite key')
  t['timesSeconds'].append(frame/fps);t['values'].append(val);t['sourceKeyOffsets'].append(offset)
 seed=meta['seedFrame'];seed_indices=indices_for_frame(seed,group_sizes)
 if seed_indices!=list(range(len(animated))):raise ValueError('Incomplete animated seed')
 for k,index in enumerate(seed_indices):append(index,seed['packedKeysOffset']+k*6,0,scales[groups[animated[index]['rawType']]])
 for fr in meta['frames']:
  indices=indices_for_frame(fr,group_sizes);i=fr['index'];packed=bytes.fromhex(fr.get('timeBytesHex',''));times=[(v>>s)&15 for v in packed for s in (4,0)][:len(indices)]
  if len(times)!=len(indices):raise ValueError('Missing key timing')
  for k,(index,nibble) in enumerate(zip(indices,times)):
   if due[index]!=i:raise ValueError(f'Due key mismatch frame{i} part{index}')
   target=i//16*16+nibble
   if target<=i:target+=16
   if not i<target<=i+16:raise ValueError('Invalid key target')
   due[index]=target;append(index,fr['packedKeysOffset']+k*6,target,scales[groups[animated[index]['rawType']]]);events+=1
  if any(x==i for x in due):raise ValueError('Missing due key')
 const_off=struct.unpack_from('<Q',b,48)[0]
 if constants and (not const_off or const_off+6*len(constants)>struct.unpack_from('<Q',b,72)[0]):raise ValueError('Constant key span invalid')
 for k,t in enumerate(constants):append(len(animated)+k,const_off+k*6,0,scales[len(animated_raw)+constant_raw.index(t['rawType'])])
 for t in tracks:
  if any(a>=z for a,z in zip(t['timesSeconds'],t['timesSeconds'][1:])):raise ValueError('Nonmonotonic track')
 return dict(schema='forspoken-movement-source-tracks-v1',animationId=entry['animationId'],source=str(p),sourceSha256=meta['sha256'],sourcePack=entry['pack'],durationSeconds=duration,keyframeFps=fps,tracks=tracks,validation=dict(scheduledKeys=events,schedulingMismatches=0,finite=True,animatedTracks=len(animated),constantTracks=len(constants),animatedRawCounts=counts,constantRawTypes=constant_raw,scalars=scales),constantPolicy='packed six-byte keys in constant-mask order; scalars after animated groups by nonempty raw type; Ghidra FUN_1444bde40 constant loop and Flagrum layout evidence',status='source channel curves; pose application and retarget unverified',interpolation='original key samples; original interpolation remains separate')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--limit',type=int);args=ap.parse_args();inventory=json.loads((ROOT/'movement-coverage.json').read_text());rig=json.loads((ROOT/'hu000-rig.json').read_text());out=ROOT/'movement-source-tracks';out.mkdir(exist_ok=True);coverage=[]
 for entry in inventory['clips'][:args.limit]:
  record={k:entry[k] for k in ['animationId','file','pack']}
  try:
   result=decode_clip(entry,rig);dest=out/Path(entry['file']).parent.name/(Path(entry['file']).stem+'.json');dest.parent.mkdir(exist_ok=True);dest.write_text(json.dumps(result,separators=(',',':'))+'\n');record.update(status='decoded-source-curves',output=str(dest),**result['validation'])
  except Exception as e:record.update(status='unsupported',reason=str(e))
  coverage.append(record)
 summary=dict(schema='forspoken-movement-source-coverage-v1',indexedTotal=inventory['totalIndexed'],attempted=len(coverage),counts=dict(Counter(x['status'] for x in coverage)),gameplayIntegrated=False,clips=coverage)
 (out/'manifest.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='clips'}));print(Counter(x.get('reason') for x in coverage if x['status']=='unsupported'))
if __name__=='__main__':main()
