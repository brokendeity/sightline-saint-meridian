"""Rebuild the 36 RT moves and their defence poses from Backspool's own Mixamo combat clips.

Move ids, kinds, chains, damage, push, reactions, support and movement policy
are copied from the action-v2 manifest unchanged; only the clip and its timing
change. Each move is a window around the striking limb's measured peak (from
measure_action_v3_reach.cjs), cropped into the move duration like action-v2.
Clip ids keep the action-v2- prefix so the runtime's strike grounding still
applies; hips horizontal position is centred on the actor instead.
"""
import gzip, json, math, bisect
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'assets/backspool'
def gzwrite(path,data):path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=9,mtime=0))
def lerpq(a,b,f):
 if sum(x*y for x,y in zip(a,b))<0:b=[-x for x in b]
 v=[x+(y-x)*f for x,y in zip(a,b)];n=math.sqrt(sum(x*x for x in v));return [x/n for x in v]
def trsample(tr,t):
 ts=tr['times'];v=tr['values'];stride=4 if tr['type']=='quaternion' else 3;i=max(0,min(len(ts)-1,bisect.bisect_right(ts,t)-1));a=v[i*stride:(i+1)*stride]
 if i==len(ts)-1:return a
 f=max(0,min(1,(t-ts[i])/max(1e-9,ts[i+1]-ts[i])));b=v[(i+1)*stride:(i+2)*stride]
 return lerpq(a,b,f) if stride==4 else [x+(y-x)*f for x,y in zip(a,b)]
def crop(entry,clipid,start,end,duration):
 rate=(end-start)/duration;assert .8499<=rate<=1.5001,(clipid,rate)
 assert 0<=start<end<=entry['clip']['duration']+.0001,(clipid,start,end)
 times=[i/120 for i in range(math.ceil(duration*120))]+[duration];tracks=[]
 for tr in entry['clip']['tracks']:
  values=[]
  for t in times:values.extend(round(x,7) for x in trsample(tr,start+t*rate))
  if tr['name']=='mixamorigHips.position':
   # Centre horizontal hips on the actor, as the reach measurement does. Some clips start
   # far from the origin (heavy uppercut z+1.4 m, Chapa-Giratoria x+1.65 m), so holding the
   # first key would draw the body well away from the capsule.
   for i in range(0,len(values),3):values[i]=0;values[i+2]=0
  tracks.append({**tr,'times':[round(t,7) for t in times],'values':values})
 return dict(id=clipid,name=clipid,sourceFolder='Action v3 Mixamo gameplay segments',character='native',characterLabel='Backspool Mixamo',sourceAnimation=entry['name'],playbackRate=1,provenance=dict(animation=entry['name'],nativeId=entry['id'],start=round(start,5),end=round(end,5),playbackRate=rate,sourceDuration=entry['clip']['duration']),clip=dict(name=clipid,uuid=clipid,duration=duration,tracks=tracks))
# move suffix: (native clip, socket, approximate strike s, pre s, post s, duration s)
# Contact is refined to the frame within +-.3s where the limb comes closest to a practice-sized
# target 1.1 m ahead (the game's hurt column from 0.6 to 1.6 m), not to the furthest forward reach:
# spinning kicks cross the target line well before they reach furthest forward.
SPECS={
'flow':{
 'light-1':('left punch','leftHand',.43,.25,.25,.38),
 'light-2':('hook with lead hand','leftHand',.55,.28,.25,.40),
 'light-3':('Mma Kick','rightFoot',.75,.35,.25,.42),
 'light-4':('Martelo 2 high kick','leftFoot',.45,.35,.30,.46),
 'left':('Roundhouse Kick','leftFoot',.93,.40,.30,.50),
 'right':('Side Kick with back foot','rightFoot',.70,.35,.30,.48),
 'heavy':('Chapa-Giratoria high kick','leftFoot',1.13,.55,.40,.70),
 'launcher':('Flip Kick','rightFoot',1.23,.60,.40,.70),
 'air-light':('Flying Kick','leftFoot',.43,.30,.25,.40),
 'air-finisher':('butterfly kick','leftFoot',2.2,.45,.35,.60),
 'counter-1':('back side kick','rightFoot',.97,.40,.30,.50),
 'counter-2':('Martelo Do Chau Sem Mao attack','rightFoot',1.22,.45,.30,.52)},
'impact':{
 'light-1':('left punch','leftHand',.43,.27,.30,.44),
 'light-2':('hook with lead hand','leftHand',.55,.30,.30,.44),
 'light-3':('body hook','leftHand',.53,.30,.30,.44),
 'light-4':('heavy uppercut','rightHand',.30,.23,.37,.46),
 'left':('back side kick','rightFoot',.97,.40,.30,.50),
 'right':('Mma Kick','rightFoot',.75,.40,.30,.50),
 'heavy':('heavy uppercut','rightHand',.30,.23,.60,.75),
 'launcher':('jumping knee followed by punch','rightFoot',.30,.25,.45,.70),
 'air-light':('Flying Kick','leftFoot',.43,.30,.25,.40),
 'air-finisher':('jumping knee followed by punch','leftHand',1.33,.45,.35,.70),
 'counter-1':('body hook','leftHand',.53,.30,.30,.48),
 'counter-2':('heavy uppercut','rightHand',.30,.23,.40,.48)},
'counter':{
 'light-1':('Martelo 2 high kick','leftFoot',.45,.30,.25,.40),
 'light-2':('Chapa-Giratoria high kick','leftFoot',1.13,.45,.30,.52),
 'light-3':('Armada To Esquiva attack','leftFoot',1.32,.40,.30,.48),
 'light-4':('Martelo Do Chau Sem Mao attack','rightFoot',1.22,.45,.30,.52),
 'left':('Leg Sweep attack','rightFoot',1.13,.45,.35,.55),
 'right':('back side kick','rightFoot',.97,.40,.30,.50),
 'heavy':('Armada To Esquiva attack','leftFoot',1.32,.70,.50,.85),
 'launcher':('Inverted Double Kick To Kip Up attack','rightFoot',1.0,.50,.50,.75),
 'air-light':('Flying Kick','leftFoot',.43,.30,.25,.40),
 'air-finisher':('butterfly kick','leftFoot',2.2,.45,.35,.60),
 'counter-1':('left punch','leftHand',.43,.25,.25,.38),
 'counter-2':('Side Kick with back foot','rightFoot',.70,.35,.30,.48)}}
# RT chain hits 5-8 per style from the NSUNSC Motion Library's Backspool-rig retargets
# (assets/motion-library/<family>.json.gz). Grounded strikes only: aerial flips are left out
# because strike grounding would lay a horizontal body on the floor. Hit 8 finishes the chain.
# These are third-party placeholders and must be replaced before any public release.
# suffix: (library clip id, socket, approximate strike s, pre s, post s, duration s)
EXTEND={
'flow':{
 'light-5':('storm-local-2kkscmb02','rightHand',.15,.15,.35,.38),  # Kakashi lunge punch
 'light-6':('storm-local-2kkscmb10','leftFoot',.33,.28,.35,.48),   # Kakashi front kick
 'light-7':('storm-local-2itccmb08','leftFoot',.22,.22,.35,.44),   # Itachi side kick
 'light-8':('storm-local-2sskcmb10','rightFoot',.47,.30,.50,.66)}, # Sasuke high kick finisher
'impact':{
 'light-5':('storm-local-2tndcmb03','rightHand',.45,.30,.35,.50),  # Tsunade straight punch
 'light-6':('storm-local-2skrcmb01','leftFoot',.43,.30,.35,.50),   # Sakura kick
 'light-7':('storm-local-2roccmb05','leftFoot',.55,.30,.35,.50),   # Lee high kick
 'light-8':('storm-local-2tndcmb15','leftFoot',.50,.30,.50,.66)},  # Tsunade side kick finisher
'counter':{
 'light-5':('storm-local-2hntcmb03','rightHand',.40,.28,.35,.48),  # Hinata palm thrust
 'light-6':('storm-local-2hntcmb09','leftHand',.53,.30,.35,.50),   # Hinata palm strike
 'light-7':('storm-local-2nejcmb02','rightHand',.18,.18,.35,.40),  # Neji palm
 'light-8':('storm-local-2hntcmb04','leftFoot',.30,.28,.50,.62)}}  # Hinata sweep finisher
LIBRARY_FAMILIES={'2kks','2itc','2ssk','2tnd','2skr','2roc','2hnt','2nej'}
# role: (native clip, start, end, duration). Stances end in the fight stance the pose hold samples.
DEFENSE={
 'flow':{'stance':('Action Idle To Fight Idle',.55,1.0,.45),'guard':('defence guard up side step to the left',0,.6,.60),'dodge':('Standing Dodge Backward',.1,.7,.48)},
 'impact':{'stance':('standing idle to fight stance',.5,1.0,.50),'guard':('defence guard up side step to the left',0,.6,.60),'dodge':('Standing Dodge Backward',.1,.7,.48)},
 'counter':{'stance':('Action Idle To Fight Idle',.55,1.0,.45),'guard':('defence guard up side step to the left',0,.6,.60),'dodge':('Standing Dodge Backward',.1,.7,.48)}}
TARGET_AHEAD,HURT_LOW,HURT_HIGH,REACH=1.1,.6,1.6,.93-.08  # game hit radius .55+.38, less a margin
def gap(r,socket):
 # Measured from the actor origin, where the game places the body and aims the target.
 x,y,z=r[socket]
 return math.sqrt(x**2+(z-TARGET_AHEAD)**2+max(0,HURT_LOW-y,y-HURT_HIGH)**2)
def peak(rows,socket,approx):
 best=min((r for r in rows if abs(r['t']-approx)<=.3),key=lambda r:gap(r,socket))
 assert gap(best,socket)<REACH,(socket,approx,round(gap(best,socket),3))
 return best['t']
def build():
 native={e['name']:e for e in json.load(gzip.open(ASSETS/'animations-web.json.gz'))}
 reach=json.loads((ASSETS/'action-v3-reach.json').read_text())['clips']
 v2=json.loads((ASSETS/'action-v2-manifest.json').read_text());old={m['id']:m for m in v2['moves']}
 old_pack={e['id']:e for e in json.load(gzip.open(ASSETS/'action-v2-gameplay.json.gz'))}
 library={e['id']:e for f in LIBRARY_FAMILIES for e in json.load(gzip.open(ROOT/'assets/motion-library'/(f+'.json.gz')))}
 storm=json.load(gzip.open(ASSETS/'action-v3-storm-reach.json.gz'))['clips']
 pack=[];moves=[];states={}
 for state,specs in SPECS.items():
  smoves=[]
  for suffix,spec in specs.items():
   name,socket,approx,pre,post,duration=spec[:6]
   moveid=state+'-'+suffix;base=old[moveid];entry=native[name]
   hit=peak(reach[name]['rows'],socket,approx);start=max(0,hit-pre);end=min(entry['clip']['duration'],hit+post)
   seg=crop(entry,'action-v2-mx-'+moveid,start,end,duration);rate=seg['provenance']['playbackRate'];ct=round((hit-start)/rate,5)
   assert .01<ct<duration-.06,(moveid,ct,duration)
   # Same window rules as action-v2, applied to the new contact time.
   contact=[{**base['contact'][0],'time':ct,'socket':socket,'radius':.32 if 'Hand' in socket else .38}]
   planted=[] if base['kind']=='air' else ['rightFoot'] if socket=='leftFoot' else ['leftFoot'] if socket=='rightFoot' else ['leftFoot','rightFoot']
   support={**base['support'],'plantedSockets':planted,'contactStart':round(max(0,ct-.025),5),'contactEnd':round(ct+.055,5)}
   move={**base,'clipId':seg['id'],'sourceStart':0,'sourceEnd':duration,'duration':duration,'contact':contact,
    'chainAt':round(max(ct+.07,duration*.68),5),'cancelAt':round(max(ct+.065,duration*.66),5),'comboOpen':round(max(0,ct-.04),5),'comboClose':round(duration-.015,5),
    'sourceFamily':'native','sourceLabel':'Backspool Mixamo','provenance':seg['provenance'],'support':support,'sourceFacingYaw':0,
    'timingMap':{'sourceStart':seg['provenance']['start'],'sourceEnd':seg['provenance']['end'],'playbackRate':rate,'start':0,'end':duration},
    'transition':{'entryEnd':round(min(.055,ct*.6),5),'exitStart':round(ct+.055,5),'exitEnd':round(max(ct+.07,duration*.68),5)},'version':3}
   seg['moveId']=moveid;seg['combatRole']='air' if base['kind']=='air' else 'ground';seg['support']={'mode':base['support']['mode']};seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);moves.append(move);smoves.append(move)
  if state in EXTEND:
   smoves[[m['id'] for m in smoves].index(state+'-light-4')]['next']=state+'-light-5'
   base4=old[state+'-light-4']
   for suffix,(clipid,socket,approx,pre,post,duration) in EXTEND[state].items():
    moveid=state+'-'+suffix;entry=library[clipid];n=int(suffix[-1]);finisher=n==8
    hit=peak(storm[clipid]['rows'],socket,approx);start=max(0,hit-pre);end=min(entry['clip']['duration'],hit+post)
    seg=crop(entry,'action-v2-mx-'+moveid,start,end,duration);rate=seg['provenance']['playbackRate'];ct=round((hit-start)/rate,5)
    assert .01<ct<duration-.06,(moveid,ct,duration)
    damage=base4['contact'][0]['damage']+(12 if finisher else 0)
    contact=[{**base4['contact'][0],'id':moveid+'-contact','time':ct,'socket':socket,'radius':.32 if 'Hand' in socket else .38,'damage':damage,'push':2.3 if finisher else base4['contact'][0]['push'],'heavy':finisher}]
    planted=['rightFoot'] if socket=='leftFoot' else ['leftFoot'] if socket=='rightFoot' else ['leftFoot','rightFoot']
    seg['provenance']={**seg['provenance'],'library':'NSUNSC Motion Library','character':entry.get('characterLabel'),'placeholder':'third-party; replace before public release'}
    move={**base4,'id':moveid,'name':moveid.replace('-',' ').title(),'clipId':seg['id'],'sourceStart':0,'sourceEnd':duration,'duration':duration,'contact':contact,
     'chainAt':round(max(ct+.07,duration*.68),5),'cancelAt':round(max(ct+.065,duration*.66),5),'comboOpen':round(max(0,ct-.04),5),'comboClose':round(duration-.015,5),
     'next':None if finisher else state+'-light-'+str(n+1),'damage':damage,'reaction':'heavy' if finisher else base4['reaction'],
     'sourceFamily':entry.get('character'),'sourceLabel':entry.get('characterLabel'),'provenance':seg['provenance'],'sourceFacingYaw':0,
     'support':{**base4['support'],'plantedSockets':planted,'contactStart':round(max(0,ct-.025),5),'contactEnd':round(ct+.055,5)},
     'timingMap':{'sourceStart':seg['provenance']['start'],'sourceEnd':seg['provenance']['end'],'playbackRate':rate,'start':0,'end':duration},
     'transition':{'entryEnd':round(min(.055,ct*.6),5),'exitStart':round(ct+.055,5),'exitEnd':round(max(ct+.07,duration*.68),5)},'version':3}
    seg['moveId']=moveid;seg['combatRole']='ground';seg['support']={'mode':'feet'};seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);moves.append(move);smoves.append(move)
  states[state]={**{k:v for k,v in v2['states'][state].items() if k!='moves'},'moves':smoves}
 defense={}
 for state,roles in DEFENSE.items():
  defense[state]={}
  for role,(name,start,end,duration) in roles.items():
   seg=crop(native[name],'action-v2-mx-'+state+'-'+role,start,end,duration);seg['combatRole']=role;seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);states[state][role]=seg['id'];defense[state][role]=seg['id']
  # Reactions were already native Mixamo in action-v2; reuse those segments unchanged.
  rid=v2['defense'][state]['reaction'];pack.append(old_pack[rid]);states[state]['reaction']=rid;defense[state]['reaction']=rid
 manifest={**v2,'version':3,'animationPack':'assets/backspool/action-v3-gameplay.json.gz','states':states,'moves':moves,'defense':defense,
  'sourceBoundary':"Backspool's own licensed Mixamo combat clips. Move ids, chains, damage and cancel rules are the authored action-v2 rules; contact times are measured limb peaks.",
  'createdFrom':{'source':'assets/backspool/animations-web.json.gz','reach':'assets/backspool/action-v3-reach.json','chainExtensions':{'source':'assets/motion-library/<family>.json.gz','reach':'assets/backspool/action-v3-storm-reach.json.gz','moves':sum(len(v) for v in EXTEND.values()),'placeholder':'NSUNSC-derived; replace before public release'},'moves':len(moves),'replaces':'action-v2 STORM-derived segments'}}
 (ASSETS/'action-v3-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');gzwrite(ASSETS/'action-v3-gameplay.json.gz',pack)
 print('authored',len(moves),'moves and',len(pack),'gameplay clips from',len({p['provenance']['animation'] for p in pack if 'provenance' in p}),'native clips')
if __name__=='__main__':build()
