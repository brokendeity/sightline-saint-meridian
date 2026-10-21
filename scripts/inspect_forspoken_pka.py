#!/usr/bin/env python3
"""Bounded read-only PKA inventory; Forspoken extension fields remain hypotheses."""
import argparse, hashlib, json, math, pathlib, struct
SOURCES=['https://github.com/Kizari/FFXVTemplates/blob/master/Windows/pka.bt','https://github.com/Kizari/FFXVTemplates/blob/master/Windows/ani.bt','https://github.com/Kizari/Flagrum/blob/main/src/Flagrum.Core/Animation/Clip/AnimationClip.cs']
def inspect(path):
    if path.stat().st_size>64*1024*1024: raise ValueError('64 MiB inspection limit')
    data=path.read_bytes()
    if len(data)<32: raise ValueError('Truncated package')
    users,guid,size,kind,nids,nover,nitems=struct.unpack_from('<Q6I',data)
    if not 0<nitems<=4096 or nids>4096: raise ValueError('Invalid bounded item counts')
    end=32+4*nitems+4*nids+4+4*nitems
    if end>len(data): raise ValueError('Truncated package index')
    offsets=list(struct.unpack_from('<%dI'%nitems,data,32))
    ids=list(struct.unpack_from('<%dI'%nids,data,32+4*nitems))
    hashend=struct.unpack_from('<I',data,32+4*(nitems+nids))[0]
    hashes=list(struct.unpack_from('<%dI'%nitems,data,36+4*(nitems+nids)))
    if offsets!=sorted(set(offsets)) or offsets[0]<end or offsets[-1]>=len(data): raise ValueError('Invalid resource spans')
    clips=[]
    for i,start in enumerate(offsets):
        stop=offsets[i+1] if i+1<nitems else len(data)
        b=data[start:stop]
        if len(b)<112: raise ValueError('Truncated ANI metadata')
        dur,ident,props,fps,version,caches,parts,users,plays=struct.unpack_from('<fIIIfIIhh',b)
        if not math.isfinite(dur) or not 0<dur<3600 or not 0<fps<=1000: raise ValueError('Invalid ANI timing')
        # FFXV layout is incompatible: these 16 bytes intervene before its offset fields.
        ext=struct.unpack_from('<4I',b,32)
        pointers=struct.unpack_from('<7Q',b,48)
        custom,triggers=struct.unpack_from('<2I',b,104)
        names=['constantData','frameChunkTable','frameChunkInfo','frameData','seedFrame','unpackConstants','customUserDataIndex']
        valid=all(p==0 or p<len(b) for p in pointers)
        if not valid: raise ValueError('Forspoken candidate relative offsets outside resource')
        t=[]
        if triggers>4096 or 112+triggers*12>len(b): raise ValueError('Invalid trigger span')
        for j in range(triggers):
            frame,flags,unknown,track,index=struct.unpack_from('<HHIHh',b,112+j*12)
            t.append(dict(frame=frame,timeSeconds=frame/fps,flags=flags,unknown=unknown,trackType=hex(track),customDataIndex=index))
        chunks=[]
        if pointers[1]:
            count=int(dur*fps+0.001)//16+1
            if pointers[1]+count*8>len(b): raise ValueError('Truncated chunk table')
            chunks=list(struct.unpack_from('<%dQ'%count,b,pointers[1]))
            if chunks!=sorted(chunks) or any(x>=len(b) for x in chunks): raise ValueError('Invalid chunk offsets')
        clips.append(dict(index=i,offset=start,spanBytes=len(b),sha256=hashlib.sha256(b).hexdigest(),animationId=hex(ident),packageHash=hex(hashes[i]),idMatchesPackageHash=ident==hashes[i],durationSeconds=dur,keyframeFps=fps,version=version,properties=props,cacheTypesCount=caches,partsCountUnconfirmed=parts,usersCount=users,playCount=plays,extensionWords=list(ext),candidateOffsets=dict(zip(names,pointers)),customUserDataCount=custom,triggerCount=triggers,candidateTriggers=t,frameChunkOffsets=chunks,decodedBoneCurves=False))
    return dict(schema='forspoken-pka-structural-v1',source=str(path),sha256=hashlib.sha256(data).hexdigest(),sizeBytes=len(data),sources=SOURCES,package=dict(guid=hex(guid),declaredSize=size,type=kind,resourceIds=ids,resourceItemsCount=nitems,offsetToEndOfHashes=hashend),clips=clips,limitations=['FFXV PKA package layout matches; ANI differs by a 16-byte extension and candidate 12-byte triggers.','Metadata/relative offsets validated across six records; trigger semantics and curve codecs are not verified.','No bone names, skeleton binding, keyframe transforms or retargeted animation are produced.'])
def parse_frame(b, pos, limit):
    """Frame boundaries only: packed values deliberately remain raw six-byte keys."""
    if pos+2>limit: raise ValueError('Truncated frame header')
    a,flags=b[pos:pos+2];count=16*a+(flags>>4)
    if count==0:return dict(offset=pos,end=pos+2,keyCount=0,empty=True)
    if pos+3>limit: raise ValueError('Truncated frame modifiers')
    n=b[pos+2];times=(count+1)//2;key_start=(pos+3+n+times+1)//2*2;end=key_start+6*count
    if end>limit: raise ValueError('Packed frame exceeds resource boundary')
    return dict(offset=pos,end=end,keyCount=count,headerFlags=flags,stepModifiers=list(b[pos+3:pos+3+n]),timeBytesHex=b[pos+3+n:pos+3+n+times].hex(),packedKeysOffset=key_start,packedKeysBytes=6*count,packedKeysSha256=hashlib.sha256(b[key_start:end]).hexdigest())
def frames_evidence(package, source, target):
    target.mkdir(parents=True,exist_ok=True);data=source.read_bytes();records=[]
    for clip in package['clips']:
        b=data[clip['offset']:clip['offset']+clip['spanBytes']];stem=clip['animationId'][2:];out=target/(stem+'.ani');out.write_bytes(b)
        ptr=clip['candidateOffsets'];pos=ptr['frameData'];frames=[];count=round(clip['durationSeconds']*clip['keyframeFps'])+1
        for j in range(count):
            if j%16==0 and pos!=clip['frameChunkOffsets'][j//16]:raise ValueError('Frame chunk boundary mismatch')
            f=parse_frame(b,pos,ptr['seedFrame']);f['index']=j;frames.append(f);pos=f['end']
        if pos!=ptr['seedFrame']:raise ValueError('Animated frames do not terminate at seed frame')
        seed=parse_frame(b,pos,len(b));padding=b[seed['end']:]
        if (seed['end']+15)//16*16!=len(b):raise ValueError('Unexpected post-seed span')
        trigger_end=(112+clip['triggerCount']*12+7)//8*8;mask_end=ptr['frameChunkTable'];mask_bytes=mask_end-trigger_end
        masks=None
        if mask_bytes>0 and mask_bytes%24==0:
            length=mask_bytes//3
            masks=[]
            for k in range(3):
                raw=b[trigger_end+k*length:trigger_end+(k+1)*length]
                masks.append(dict(offset=trigger_end+k*length,bytes=length,hex=raw.hex(),population=sum(x.bit_count() for x in raw),setBits=[j for j in range(length*8) if raw[j//8]&(1<<(j%8))]))
        nodes=[]
        for j in range(clip['customUserDataCount']):
            p=ptr['customUserDataIndex']+j*16
            if p+16>len(b):raise ValueError('Custom index outside ANI')
            relative,kind,reserved=struct.unpack_from('<QII',b,p);absolute=ptr['customUserDataIndex']+relative
            if absolute>=len(b):raise ValueError('Custom node target outside ANI')
            nodes.append(dict(index=j,offset=p,relativeDataOffset=relative,dataOffset=absolute,type=hex(kind),reserved=hex(reserved)))
        constants=[]
        for j in range(clip['cacheTypesCount']+1):
            v=struct.unpack_from('<f',b,ptr['unpackConstants']+j*4)[0];constants.append(v if math.isfinite(v) else 'NaN')
        rec=dict(animationId=clip['animationId'],file=str(out),sha256=clip['sha256'],sizeBytes=len(b),frameCount=count,allChunkBoundariesMatch=True,animatedFramesEndAtSeed=True,frames=frames,seedFrame=seed,trailingPaddingHex=padding.hex(),candidateBitMasks=masks,customDataPointerBase='customUserDataIndex table base',unpackConstants=constants,customDataNodes=nodes,decodedTransforms=False)
        (target/(stem+'.frames.json')).write_text(json.dumps(rec,indent=2)+'\n');records.append({k:v for k,v in rec.items() if k!='frames'})
    result=dict(schema='forspoken-packed-frame-boundaries-v1',clips=records,limitations=['Packed six-byte keys are preserved and bounded; quaternion/vector values and channel assignments are not decoded.','Three pre-chunk bitmask spans and custom node targets are candidate interpretations, not verified semantic mappings.'])
    (target/'manifest.json').write_text(json.dumps(result,indent=2)+'\n');return result
def main():
    p=argparse.ArgumentParser();p.add_argument('source',nargs='?',default='output/rea-forspoken/vault-vlt000.pka');p.add_argument('--output',default='output/rea-forspoken/pka-structure.json');p.add_argument('--extract-dir');a=p.parse_args()
    result=inspect(pathlib.Path(a.source));frames_evidence(result,pathlib.Path(a.source),pathlib.Path(a.extract_dir)) if a.extract_dir else None;pathlib.Path(a.output).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'clips':len(result['clips']),'output':a.output,'decodedBoneCurves':False}))
if __name__=='__main__':main()
