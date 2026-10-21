#!/usr/bin/env python3
"""Reproduce recovered packed-key codec math. Asset codec selection remains pending."""
import hashlib,json,math,pathlib,struct
F=lambda x:struct.unpack('<f',struct.pack('<f',x))[0]
def quaternion48(raw,full_range=False,mirror_yz=False):
    a,b,c=struct.unpack('<3H',raw)
    starts=[a>>15,(a>>15)+(b>>15)+1,(a>>15)+(b>>15)+(c>>15)+2]
    if len(set(starts))!=3 or max(starts)>3:raise ValueError('Invalid packed quaternion component selector')
    omitted=next(i for i in range(4) if i not in starts)
    scale=6.103701889514923e-05 if full_range else 4.3159689084859565e-05
    bias=1.0 if full_range else 0.7071067690849304
    vals=[F(F((x&32767)*scale)-bias) for x in (a,b,c)]
    radicand=F(1.0-F(F(F(vals[2]*vals[2])+F(vals[0]*vals[0]))+F(vals[1]*vals[1])))
    if radicand < 0:raise ValueError('Packed quaternion has negative recovered square-root radicand')
    sign=2*(((c&32767)>>12 | (omitted+1))>>2)-1
    q=[0.0]*4
    for i,v in zip(starts,vals):q[i]=v
    q[omitted]=F(math.sqrt(radicand)*sign);q[3]=F(q[3]*sign)
    if mirror_yz:q[1]=-q[1];q[2]=-q[2]
    return q
def inspect():
    root=pathlib.Path('output/rea-forspoken');binding=json.loads((root/'vault-rig-binding.json').read_text());records=[]
    for clip in binding['clips']:
        p=pathlib.Path(clip['file']);b=p.read_bytes();meta=json.loads(p.with_suffix('.frames.json').read_text());start=meta['seedFrame']['packedKeysOffset'];keys=[];bindings=sorted([dict(x,channel=ch['name']) for ch in clip['channels'] for x in ch['animatedPartBindings']],key=lambda x:x['partBit'])
        if len(bindings)!=meta['seedFrame']['keyCount']:raise ValueError('Seed binding count mismatch')
        for i,entry in enumerate(bindings):
            raw=b[start+6*i:start+6*i+6];rec=dict(entry,rawHex=raw.hex(),offset=start+6*i)
            if 'Rotation' in entry['channel']:
                for codec,full in [('FUN_140504bb0',False),('FUN_140505a50',True)]:
                    try:rec[codec]=dict(quaternionXYZW=quaternion48(raw,full,not full),codecEquationRecovered=True,assetCodecSelectionVerified=False)
                    except ValueError as e:rec[codec]=dict(rejected=str(e))
            else:rec['signedComponents']=list(struct.unpack('<3h',raw))
            keys.append(rec)
        records.append(dict(animationId=meta['animationId'],source=str(p),sourceSha256=hashlib.sha256(b).hexdigest(),keys=keys))
    result=dict(schema='forspoken-seed-codec-investigation-v1',sourceFunctions={'smallestThreeMirrorYZ':'0x140504bb0','fullRangePreserveXYZ':'0x140505a50','scaledVector':'0x140504170'},status='Recovered codec equations; exact asset codec dispatch and playback semantics pending',clips=records)
    (root/'pka-seed-codec-candidates.json').write_text(json.dumps(result,indent=2)+'\n');return result
if __name__=='__main__':
    r=inspect();print(json.dumps({'clips':len(r['clips']),'decodedPlayableAnimations':0}))
