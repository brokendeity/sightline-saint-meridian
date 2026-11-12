#!/usr/bin/env python3
"""Pack a Kimodo (NVIDIA text-to-motion) clip into the small JSON the Loadout Interface v10 plays as an upper-body layer.

Kimodo writes motion for its 77-joint SOMA skeleton: `global_rot_mats` are world rotations away from SOMA's T-pose and
`posed_joints` the joint positions (Y up, +X his left, +Z ahead; 30 fps). This keeps only what the layer needs:
world quaternions (x, y, z, w) of the torso, both arms and the right-hand fingers, trimmed to the reach (from the hand
leaving its start to it being back near the body), the frame of furthest reach, and each joint's rest direction to its
child, so the game can line Loadout's Mixamo bind pose up with SOMA's T-pose. Nothing here is specific to one clip.

  python3 pack_kimodo_pocket_reach.py in.npz out.json [--sample 0] [--range A B] [--enter E] [--reach R] [--meta '{"prompt": "..."}']
"""
import argparse, json
import numpy as np

SOMA77 = ["Hips","Spine1","Spine2","Chest","Neck1","Neck2","Head","HeadEnd","Jaw","LeftEye","RightEye","LeftShoulder","LeftArm","LeftForeArm","LeftHand",
 "LeftHandThumb1","LeftHandThumb2","LeftHandThumb3","LeftHandThumbEnd","LeftHandIndex1","LeftHandIndex2","LeftHandIndex3","LeftHandIndex4","LeftHandIndexEnd",
 "LeftHandMiddle1","LeftHandMiddle2","LeftHandMiddle3","LeftHandMiddle4","LeftHandMiddleEnd","LeftHandRing1","LeftHandRing2","LeftHandRing3","LeftHandRing4","LeftHandRingEnd",
 "LeftHandPinky1","LeftHandPinky2","LeftHandPinky3","LeftHandPinky4","LeftHandPinkyEnd","RightShoulder","RightArm","RightForeArm","RightHand",
 "RightHandThumb1","RightHandThumb2","RightHandThumb3","RightHandThumbEnd","RightHandIndex1","RightHandIndex2","RightHandIndex3","RightHandIndex4","RightHandIndexEnd",
 "RightHandMiddle1","RightHandMiddle2","RightHandMiddle3","RightHandMiddle4","RightHandMiddleEnd","RightHandRing1","RightHandRing2","RightHandRing3","RightHandRing4","RightHandRingEnd",
 "RightHandPinky1","RightHandPinky2","RightHandPinky3","RightHandPinky4","RightHandPinkyEnd","LeftLeg","LeftShin","LeftFoot","LeftToeBase","LeftToeEnd","RightLeg","RightShin","RightFoot","RightToeBase","RightToeEnd"]
IDX = {n: i for i, n in enumerate(SOMA77)}
PARENTS = [-1,0,1,2,3,4,5,6,6,6,6,3,11,12,13,14,15,16,17,14,19,20,21,22,14,24,25,26,27,14,29,30,31,32,14,34,35,36,37,3,39,40,41,42,43,44,45,42,47,48,49,50,42,
 52,53,54,55,42,57,58,59,60,42,62,63,64,65,0,67,68,69,70,0,72,73,74,75]
# joint -> the joint its bone points at (for lining the two rest poses up)
CHILD = {"Hips":"Spine1","Spine1":"Spine2","Spine2":"Chest","Chest":"Neck1","Neck1":"Head",
 **{s+a:s+b for s in ("Left","Right") for a,b in (("Shoulder","Arm"),("Arm","ForeArm"),("ForeArm","Hand"),("Hand","HandMiddle2"))},
 "RightHandThumb1":"RightHandThumb2","RightHandThumb2":"RightHandThumb3","RightHandThumb3":"RightHandThumbEnd",
 **{"RightHand"+f+str(i):"RightHand"+f+(str(i+1) if i<4 else "End") for f in ("Index","Middle","Ring","Pinky") for i in (2,3,4)}}
KEEP = list(CHILD)

def m2q(m):
    w=np.sqrt(np.clip(1+m[...,0,0]+m[...,1,1]+m[...,2,2],0,None))/2;x=np.sqrt(np.clip(1+m[...,0,0]-m[...,1,1]-m[...,2,2],0,None))/2
    y=np.sqrt(np.clip(1-m[...,0,0]+m[...,1,1]-m[...,2,2],0,None))/2;z=np.sqrt(np.clip(1-m[...,0,0]-m[...,1,1]+m[...,2,2],0,None))/2
    x=np.copysign(x,m[...,2,1]-m[...,1,2]);y=np.copysign(y,m[...,0,2]-m[...,2,0]);z=np.copysign(z,m[...,1,0]-m[...,0,1])
    q=np.stack([x,y,z,w],-1);return q/np.linalg.norm(q,axis=-1,keepdims=True)
def q2m(q):  # (w, x, y, z)
    w,x,y,z=[q[...,i] for i in range(4)]
    return np.stack([np.stack([1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],-1),np.stack([2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],-1),np.stack([2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)],-1)],-2)

def main():
    ap=argparse.ArgumentParser();ap.add_argument("src");ap.add_argument("out");ap.add_argument("--sample",type=int,default=0)
    ap.add_argument("--range",type=int,nargs=2);ap.add_argument("--reach",type=int);ap.add_argument("--enter",type=int,help="frame the hand arrives at full reach; --reach is then the frame it starts to withdraw");ap.add_argument("--meta",default="{}")
    a=ap.parse_args();d=np.load(a.src)
    if "quats" in d.files:  # packed by AssetFurnace: only frame-0 joints are kept, so positions are rebuilt from the rest offsets
        G=q2m(d["quats"].astype(np.float64));J0=d["joints0"].astype(np.float64);hips=d["hips"].astype(np.float64)
        off=np.zeros((77,3));
        for j in range(1,77):off[j]=G[0,PARENTS[j]].T@(J0[j]-J0[PARENTS[j]])
        P=np.zeros((len(G),77,3));P[:,0]=hips
        for j in range(1,77):P[:,j]=P[:,PARENTS[j]]+np.einsum('tij,j->ti',G[:,PARENTS[j]],off[j])
    else:
        G=d["global_rot_mats"].astype(np.float64);P=d["posed_joints"].astype(np.float64)
        if G.ndim==5:G,P=G[a.sample],P[a.sample]
        off=np.zeros((77,3))
        for j in range(1,77):off[j]=G[0,PARENTS[j]].T@(P[0,j]-P[0,PARENTS[j]])
    fps=float(d["fps"]) if "fps" in d.files else 30.0
    T=len(G);rel=P[:,IDX["RightHand"]]-P[:,IDX["RightArm"]];ext=np.linalg.norm(rel,axis=1)  # how far the hand is from its shoulder
    fwd0=G[0,0]@np.array([0,0,1.]);fwd0[1]=0;fwd0/=np.linalg.norm(fwd0);ahead=rel@fwd0
    score=ext+ahead;reach=int(np.argmax(score)) if a.reach is None else a.reach
    if a.range:k0,k1=a.range
    else:
        lo=score[:reach+1].min();hi=score[reach];k0=reach
        while k0>0 and score[k0]>lo+.06*(hi-lo):k0-=1
        tail=score[reach:];lo2=tail.min();k1=reach
        while k1<T-1 and score[k1]>lo2+.08*(hi-lo2):k1+=1
    k0=max(0,k0-2);k1=min(T-1,k1+2)
    rest={n:(off[IDX[CHILD[n]]] if PARENTS[IDX[CHILD[n]]]==IDX[n] else None) for n in KEEP}
    for n in KEEP:  # a child further down the chain (Neck1 -> Head, Hand -> Middle2): add the rest offsets along the way
        if rest[n] is None:
            v=np.zeros(3);j=IDX[CHILD[n]]
            while j!=IDX[n]:v+=off[j];j=PARENTS[j]
            rest[n]=v
    q=m2q(G[k0:k1+1][:,[IDX[n] for n in KEEP]])
    for t in range(1,len(q)):  # keep neighbouring frames on the same side, so a straight blend never takes the long way
        flip=np.sum(q[t]*q[t-1],-1)<0;q[t][flip]*=-1
    hipsMove=P[k0:k1+1,0]-P[k0,0]
    out={"schema":1,"source":"NVIDIA Kimodo text-to-motion (SOMA 77-joint skeleton), packed by pack_kimodo_pocket_reach.py","fps":fps,"frames":len(q),"reach":reach-k0,"enter":(reach if a.enter is None else a.enter)-k0,
         "range":[int(k0),int(k1)],"of":T,"joints":KEEP,"rest":{n:[round(float(x),4) for x in rest[n]/np.linalg.norm(rest[n])] for n in KEEP},
         "reachExtent":round(float(ext[reach]),3),"armLength":round(float(np.linalg.norm(off[IDX["RightForeArm"]])+np.linalg.norm(off[IDX["RightHand"]])),3),
         "hipsTravel":round(float(np.abs(hipsMove).max()),3),"meta":json.loads(a.meta),"q":[round(float(x),4) for x in q.reshape(-1)]}
    json.dump(out,open(a.out,"w"),separators=(",",":"))
    print("frames",len(q),"of",T,"range",k0,k1,"reach at",reach-k0,"extent %.3f of arm %.3f"%(out["reachExtent"],out["armLength"]),"hips travel",out["hipsTravel"],"bytes",len(json.dumps(out,separators=(",",":"))))
if __name__=="__main__":main()
