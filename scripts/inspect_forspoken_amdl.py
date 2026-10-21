#!/usr/bin/env python3
"""Bounded, read-only Luminous AMDL inspection; no game code is executed.
Schema reference: https://github.com/Kizari/FFXVTemplates (amdl.bt).
The inspected Forspoken file structurally matches this older Luminous template.
Raw transform space and animation channel-to-bone semantics are NOT certified.
"""
import argparse, hashlib, json, math, struct
from pathlib import Path

CHANNELS = ['syncRotation','rootRotation','skeletalRotation','rotation',
            'syncTranslation','rootTranslation','skeletalTranslation','scale','float']
RAW_TYPES = {0:'Quaternion',1:'UncompressedVector3',2:'Vector3_Range0',
             3:'Vector3_Range1',4:'Vector3_Range2',5:'Vector3_NoScale'}

class Reader:
    def __init__(self, data): self.data=data
    def span(self, offset, size):
        if not isinstance(offset,int) or offset<0 or size<0 or offset+size>len(self.data):
            raise ValueError(f'Out-of-bounds span {offset:#x}+{size:#x}')
        return self.data[offset:offset+size]
    def unpack(self, fmt, offset):
        return struct.unpack(fmt,self.span(offset,struct.calcsize(fmt)))
    def array(self, code, count, offset):
        if count<0 or count>100000: raise ValueError('Unreasonable array count')
        return list(self.unpack('<'+str(count)+code,offset))

def align(n,a): return (n+a-1)//a*a

def qmul(a,b):
    x,y,z,w=a; X,Y,Z,W=b
    return [w*X+x*W+y*Z-z*Y,w*Y-x*Z+y*W+z*X,w*Z+x*Y-y*X+z*W,w*W-x*X-y*Y-z*Z]

def qrotate(q,v):
    norm=sum(x*x for x in q)
    return qmul(qmul(q,list(v)+[0]),[-q[0]/norm,-q[1]/norm,-q[2]/norm,q[3]/norm])[:3]

def inspect(path):
    data=path.read_bytes()
    if not 480<=len(data)<=64*1024*1024: raise ValueError('Unexpected AMDL size')
    r=Reader(data)
    size,version,bind_offset,custom_count=r.unpack('<IfII',0)
    if size!=len(data): raise ValueError('Header file size mismatch')
    custom_offset,instance_offset,transition_offset,default_transition=r.unpack('<4Q',16)
    transition_count,instance_types,instance_size=r.unpack('<3I',48)
    if instance_types>16 or custom_count>64: raise ValueError('Unexpected header counts')
    # Forspoken header uses fixed 112-byte prefix, confirmed by the retained template.
    base=112
    pose_size,raw_count,raw_rel,parts_blocks=r.unpack('<4I',base)
    if raw_count>16 or parts_blocks>4096: raise ValueError('Unexpected pose counts')
    channels=[]
    for i,name in enumerate(CHANNELS):
        count,offset,model_rel,mask,padding=r.unpack('<IIQII',240+24*i)
        if count>65535: raise ValueError('Unreasonable channel count')
        channels.append(dict(name=name,count=count,poseDataOffset=offset,
            modelInfoRelativeOffset=model_rel,partMaskStartBit=mask))
    names_rel,names_count,layers,total_parts=r.unpack('<QIII',456)
    if not 1<=names_count<=20000: raise ValueError('Unexpected skeleton size')
    names=[]
    for i in range(names_count):
        raw=r.span(base+names_rel+i*48,48)
        if b'\0' not in raw: raise ValueError('Unterminated bone name')
        names.append(raw.split(b'\0',1)[0].decode('ascii',errors='strict'))
    cursor=476
    for c in channels:
        c['indices']=r.array('H',c['count'],cursor); c['indicesOffset']=cursor
        cursor+=2*c['count']
    layer_ids=r.array('I',layers,cursor)
    raw=[]
    for i in range(raw_count):
        kind,count=r.unpack('<II',base+raw_rel+i*8)
        if kind not in RAW_TYPES or count>100000: raise ValueError('Invalid raw descriptor')
        raw.append(dict(type=kind,name=RAW_TYPES[kind],count=count))
    nodes=[]
    for i in range(custom_count):
        rel,kind,pad=r.unpack('<QII',custom_offset+i*16)
        nodes.append(dict(type=kind,offset=custom_offset+rel))
    skeletal=[n for n in nodes if n['type']==0]
    if len(skeletal)!=1: raise ValueError('Expected exactly one skeletal info record')
    start=skeletal[0]['offset']
    count,full,bind,after,kd,dummy=r.unpack('<II4H',start)
    if full!=names_count or not 1<=count<=full or bind>full:
        raise ValueError('Skeleton/name/count mismatch')
    cursor=start+16
    arrays={}
    for name,n,code,width in [('childOffsets',count,'h',2),('childIndices',count,'h',2),
            ('parentIndices',full,'h',2),('fullChildOffsets',full,'h',2),
            ('fullChildIndices',full,'h',2),('boneIds',full,'I',4)]:
        arrays[name]=r.array(code,n,cursor); cursor+=n*width
    cursor=align(cursor,16); rotation_offset=cursor
    rotations=[list(r.unpack('<4f',cursor+i*16)) for i in range(full)]; cursor+=full*16
    translation_offset=cursor
    translations=[list(r.unpack('<4f',cursor+i*16)) for i in range(full)]; cursor+=full*16
    matrix_offset=cursor
    matrices=[list(r.unpack('<16f',cursor+i*64)) for i in range(bind)]
    values=[v for seq in rotations+translations+matrices for v in seq]
    if not all(math.isfinite(v) for v in values): raise ValueError('Nonfinite transforms')
    norms=[math.sqrt(sum(v*v for v in q)) for q in rotations]
    if any(abs(v-1)>0.001 for v in norms): raise ValueError('Nonunit rest quaternion')
    parents=arrays['parentIndices']
    if any(p < -1 or p>=full or p==i for i,p in enumerate(parents)):
        raise ValueError('Invalid parent index')
    depths=[]
    for i in range(full):
        seen=set(); j=i
        while j!=-1:
            if j in seen: raise ValueError('Hierarchy cycle')
            seen.add(j); j=parents[j]
        depths.append(len(seen)-1)
    # Algebraic cross-check against inverse bind matrices establishes this file's
    # mixed convention: rotations in model/world rest space, translations local.
    world_positions=[None]*full; local_rotations=[None]*full
    for i in sorted(range(full),key=lambda i:depths[i]):
        parent=parents[i]
        if parent==-1:
            world_positions[i]=translations[i][:3]; local_rotations[i]=rotations[i]
        else:
            delta=qrotate(rotations[parent],translations[i][:3])
            world_positions[i]=[world_positions[parent][j]+delta[j] for j in range(3)]
            q=rotations[parent];n=sum(v*v for v in q)
            local_rotations[i]=qmul([-q[0]/n,-q[1]/n,-q[2]/n,q[3]/n],rotations[i])
    bind_errors=[]
    for i,matrix in enumerate(matrices):
        # Column-major inverse bind matrix translation = -inverse(R)*worldPosition.
        p=world_positions[i]
        predicted=[-sum(matrix[row+col*4]*p[col] for col in range(3)) for row in range(3)]
        bind_errors.append(math.sqrt(sum((predicted[j]-matrix[12+j])**2 for j in range(3))))
    if max(bind_errors)>0.00001:raise ValueError('Rest convention failed inverse bind validation')
    # Default pose translation channels store parent-relative vectors in model axes.
    root_translation_offset=channels[5]['poseDataOffset']
    root_rotation_offset=channels[1]['poseDataOffset']
    default_model_offsets=[list(r.unpack('<4f',bind_offset+root_translation_offset+16*i)) for i in range(full)]
    default_delta_rotations=[list(r.unpack('<4f',bind_offset+root_rotation_offset+16*i)) for i in range(full)]
    if not all(math.isfinite(v) for seq in default_model_offsets+default_delta_rotations for v in seq):
        raise ValueError('Nonfinite default pose')
    bones=[dict(index=i,name=names[i],parent=parents[i],depth=depths[i],
                defaultPoseModelSpaceOffset=default_model_offsets[i],
                defaultPoseDeltaRotationXYZW=default_delta_rotations[i],
                derivedLocalRotationXYZW=local_rotations[i],derivedWorldPosition=world_positions[i],
                sourceBoneId=arrays['boneIds'][i],sourceRotationXYZW=rotations[i],
                sourceTranslationXYZW=translations[i],
                bindMatrix16=matrices[i] if i<bind else None) for i in range(full)]
    return dict(schemaVersion=1,source=dict(path=str(path),size=len(data),
        sha256=hashlib.sha256(data).hexdigest(),executed=False),
        interpretation=dict(schema='Kizari FFXVTemplates amdl.bt, structurally validated against Forspoken',
            transformSpace='AMDL algebra verified: rotation model/world rest space; translation parent-local; coordinate-axis names and unit scale unverified',
            quaternionOrder='XYZW inferred from identity and unit norms; original engine convention unverified',
            channelIndices='raw source part-index tables; semantic bone assignment is not assumed',
            retargeted=False),
        header=dict(version=version,bindPoseOffset=bind_offset,poseSize=pose_size,
            instanceDataOffset=instance_offset,instanceTypes=instance_types,
            instanceSize=instance_size,transitionOffset=transition_offset,
            transitionCount=transition_count,defaultTransitionOffset=default_transition),
        skeletal=dict(count=count,fullCount=full,bindOnlyCount=bind,
            afterBonamikStartIndex=after,kdBonesStartIndex=kd,recordOffset=start,
            rotationsOffset=rotation_offset,translationsOffset=translation_offset,
            matricesOffset=matrix_offset),
        validation=dict(parentBounds=True,acyclic=True,finiteTransforms=True,
            unitQuaternions=True,quaternionNormMin=min(norms),quaternionNormMax=max(norms),
            roots=[i for i,p in enumerate(parents) if p==-1],maxDepth=max(depths),
            inverseBindTranslationMaxError=max(bind_errors),inverseBindTranslationMeanError=sum(bind_errors)/len(bind_errors),
            uniqueNames=len(set(names)),boneCount=full),
        rawTypes=raw,channels=channels,parts=dict(sizeBlocks=parts_blocks,
            layerIds=layer_ids,totalParts=total_parts),bones=bones)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,default=Path('output/rea-forspoken/hu000.amdl'))
    p.add_argument('--output',type=Path,default=Path('output/rea-forspoken/hu000-rig.json'))
    a=p.parse_args(); result=inspect(a.input)
    a.output.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result['validation'],indent=2))
