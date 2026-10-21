"""Decode recovered vault streams to source-channel curves, not a gameplay retarget.
Run-length/high-first timing interpretation is checked against every due-key event.
Source pose application and exact interpolation remain separate validation gates.
"""
import hashlib,json,math,struct
from pathlib import Path
from decode_forspoken_seed import quaternion48,F
from inspect_forspoken_pka import parse_frame
OUT=Path(__file__).resolve().parents[1]/'output/rea-forspoken'
def indices_for_frame(frame,sizes):
 if not frame['keyCount']:return []
 if frame['headerFlags']&15:raise ValueError('Unrecovered nonzero initial-run flags')
 g=run=base=0;active=True;indices=[]
 for amount in frame['stepModifiers']:
  if amount<0 or g>=len(sizes) or run+amount>sizes[g]:raise ValueError('Run crosses channel group')
  if active:indices.extend(range(base+run,base+run+amount))
  run+=amount;active=not active
  if run==sizes[g]:base+=run;run=0;g+=1;active=True
 if g!=len(sizes) or len(indices)!=frame['keyCount']:raise ValueError('Run/key count mismatch')
 return indices

def decode_clip(clip):
 path=Path(clip['file']);b=path.read_bytes();meta=json.loads(path.with_suffix('.frames.json').read_text())
 if hashlib.sha256(b).hexdigest()!=clip['sha256']:raise ValueError('ANI identity changed')
 for frame in [meta['seedFrame']]+meta['frames']:
  actual=parse_frame(b,frame['offset'],len(b))
  if any(actual.get(k)!=frame.get(k) for k in actual):raise ValueError('Frame sidecar differs from raw source')
 if len(meta['frames'])!=round(struct.unpack_from('<f',b,0)[0]*struct.unpack_from('<I',b,12)[0])+1:raise ValueError('Source frame count mismatch')
 fps=struct.unpack_from('<I',b,12)[0]
 if fps!=60:raise ValueError('Only recovered 60 FPS vault profile admitted')
 if any(n['type']=='0x106' for n in meta['customDataNodes']):raise ValueError('Packed type override requires explicit decoding')
 model=(OUT/'hu000.amdl').read_bytes();nc=struct.unpack_from('<I',model,12)[0];co=struct.unpack_from('<Q',model,16)[0]
 if any(struct.unpack_from('<I',model,co+i*16+8)[0]==0x106 for i in range(nc)):raise ValueError('Model packed type override unsupported')
 channels=[ch for ch in clip['channels'] if ch['animatedPartBindings']];sizes=[len(ch['animatedPartBindings']) for ch in channels];parts=[]
 for gi,ch in enumerate(channels):
  for p in ch['animatedPartBindings']:parts.append({**p,'channel':ch['name'],'group':gi})
 tracks=[{**p,'timesSeconds':[],'values':[],'sourceKeyOffsets':[]} for p in parts];due=[0]*len(parts);events=0
 def append(part,offset,time):
  t=tracks[part];raw=b[offset:offset+6]
  if len(raw)!=6:raise ValueError('Truncated key')
  if 'Rotation' in t['channel']:value=quaternion48(raw,full_range=True,mirror_yz=False)
  else:
   scale=meta['unpackConstants'][t['group']]
   if not isinstance(scale,(float,int)) or not math.isfinite(scale):raise ValueError('Invalid group scale')
   value=[F(x*scale) for x in struct.unpack('<3h',raw)]
  if not all(math.isfinite(x) for x in value):raise ValueError('Nonfinite decoded key')
  t['timesSeconds'].append(time/fps);t['values'].append(value);t['sourceKeyOffsets'].append(offset)
 seed=meta['seedFrame'];seed_indices=indices_for_frame(seed,sizes)
 if seed_indices!=list(range(len(parts))):raise ValueError('Incomplete seed')
 for k,part in enumerate(seed_indices):append(part,seed['packedKeysOffset']+k*6,0)
 for frame in meta['frames']:
  indices=indices_for_frame(frame,sizes);i=frame['index'];packed=bytes.fromhex(frame.get('timeBytesHex',''));times=[(x>>shift)&15 for x in packed for shift in (4,0)][:len(indices)]
  if len(times)!=len(indices):raise ValueError('Missing key times')
  for k,(part,nibble) in enumerate(zip(indices,times)):
   if due[part]!=i:raise ValueError(f'Due key mismatch frame {i} part {part}: {due[part]}')
   target=(i//16)*16+nibble
   if target<=i:target+=16
   if not i<target<=i+16:raise ValueError('Invalid future-key frame')
   due[part]=target;append(part,frame['packedKeysOffset']+k*6,target);events+=1
  # Every due key must be consumed; otherwise runs silently omitted a track.
  if any(v==i for v in due):raise ValueError('Missing due event')
 for t in tracks:
  if any(a>=c for a,c in zip(t['timesSeconds'],t['timesSeconds'][1:])):raise ValueError('Nonmonotonic curve')
 return {'animationId':meta['animationId'],'source':str(path),'sourceSha256':clip['sha256'],'durationSeconds':struct.unpack_from('<f',b,0)[0],'keyframeFps':fps,'tracks':tracks,'validation':{'scheduledKeys':events,'schedulingMismatches':0,'finite':True,'allSeedBindings':True},'status':'decoded source-channel curves; pose application and retarget unverified','codecPolicy':'AMDL/ANI have no0x106 override; raw quaternion default2, normal full-range preserveXYZ callback140504580->140505a50; vectors signed16*group unpack constant','interpolation':'key samples recovered; browser slerp/linear would be an inspection approximation of original interpolator'}
def main():
 out=OUT/'vault-source-tracks';out.mkdir(exist_ok=True);clips=json.loads((OUT/'vault-rig-binding.json').read_text())['clips'];summary=[]
 for clip in clips:
  result=decode_clip(clip);p=out/(clip['file'].split('/')[-1].replace('.ani','.json'));p.write_text(json.dumps(result,separators=(',',':'))+'\n');summary.append({'animationId':result['animationId'],'tracks':len(result['tracks']),**result['validation'],'output':str(p)})
 (out/'manifest.json').write_text(json.dumps({'clips':summary,'gameplayIntegrated':False},indent=2));print(json.dumps(summary,indent=2))
if __name__=='__main__':main()
