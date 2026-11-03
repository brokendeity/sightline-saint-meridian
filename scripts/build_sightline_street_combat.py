"""Build Sightline's street-fight move set from the licensed Mixamo combat clips.

Sightline fights in short bursts: a four-hit RT chain (jab, lead hook, body
hook, uppercut), kicks on the stick, a knee for the heavy, and a high guard.
Windows, contact timing and hip centring follow the Backspool v3 builder.
Sightline's FBX uses centimetre units, so the manifest records the source
hips rest height and the game rescales hips height to Sightline's rig at load.
"""
import gzip, json
from pathlib import Path
from build_backspool_action_v3_mixamo import crop, peak, gzwrite
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'assets/backspool';OUT=ROOT/'assets/sightline'
STYLE='street'
# suffix: (native clip, socket, approximate strike s, pre s, post s, duration s, base action-v3 move)
MOVES={
 'light-1':('left punch','leftHand',.43,.22,.25,.36,'impact-light-1'),
 'light-2':('hook with lead hand','leftHand',.55,.28,.28,.42,'impact-light-2'),
 'light-3':('body hook','leftHand',.53,.30,.30,.44,'impact-light-3'),
 'light-4':('heavy uppercut','rightHand',.30,.23,.45,.52,'impact-light-4'),
 'left':('Mma Kick','rightFoot',.75,.40,.30,.50,'impact-right'),
 'right':('Side Kick with back foot','rightFoot',.70,.35,.30,.48,'impact-left'),
 'heavy':('jumping knee followed by punch','rightFoot',.30,.25,.45,.70,'impact-heavy'),
 'launcher':('heavy uppercut','rightHand',.30,.23,.60,.75,'impact-launcher'),
 'air-light':('Flying Kick','leftFoot',.43,.30,.25,.40,'impact-air-light'),
 'air-finisher':('jumping knee followed by punch','leftHand',1.33,.45,.35,.70,'impact-air-finisher'),
 'counter-1':('body hook','leftHand',.53,.30,.30,.44,'impact-counter-1'),
 'counter-2':('heavy uppercut','rightHand',.30,.23,.40,.48,'impact-counter-2'),
}
# role: (native clip, start, end, duration). The stance holds the high guard from the reference rhythm.
DEFENSE={'stance':('standing idle to fight stance',.5,1.0,.50),'guard':('defence guard up side step to the left',0,.6,.60),'dodge':('Standing Dodge Left',.05,.6,.48)}
REACTIONS={'reaction':('Hit Reaction',0,.4,.4),'reaction-head':('Receive Uppercut To The Face',0,.5,.45),'reaction-body':('Big Body Blow getting pushed back and fall',0,.5,.45)}
def build():
 native={e['name']:e for e in json.load(gzip.open(ASSETS/'animations-web.json.gz'))}
 reach=json.loads((ASSETS/'action-v3-reach.json').read_text())['clips']
 v3=json.loads((ASSETS/'action-v3-manifest.json').read_text());base={m['id']:m for m in v3['moves']}
 rest=[t for t in native['Breathing Idle without skin']['clip']['tracks'] if t['name']=='mixamorigHips.position'][0]['values'][1]
 pack=[];moves=[]
 for suffix,(name,socket,approx,pre,post,duration,template) in MOVES.items():
  moveid=STYLE+'-'+suffix;b=base[template];entry=native[name]
  hit=peak(reach[name]['rows'],socket,approx);start=max(0,hit-pre);end=min(entry['clip']['duration'],hit+post)
  seg=crop(entry,'action-v2-sl-'+moveid,start,end,duration);rate=seg['provenance']['playbackRate'];ct=round((hit-start)/rate,5)
  assert .01<ct<duration-.06,(moveid,ct,duration)
  planted=[] if b['kind']=='air' else ['rightFoot'] if socket=='leftFoot' else ['leftFoot'] if socket=='rightFoot' else ['leftFoot','rightFoot']
  nxt=b['next']
  if isinstance(nxt,str):nxt=nxt.replace('impact-',STYLE+'-')
  elif isinstance(nxt,dict):nxt={k:v.replace('impact-',STYLE+'-') for k,v in nxt.items()}
  # The RT chain is a four-hit burst: the uppercut ends it, as in the reference rhythm.
  if suffix=='light-4':nxt=None
  move={**b,'id':moveid,'name':'Street '+suffix.replace('-',' ').title(),'state':STYLE,'clipId':seg['id'],'sourceStart':0,'sourceEnd':duration,'duration':duration,
   'contact':[{**b['contact'][0],'id':moveid+'-contact','time':ct,'socket':socket,'radius':.32 if 'Hand' in socket else .38}],
   'chainAt':round(max(ct+.07,duration*.68),5),'cancelAt':round(max(ct+.065,duration*.66),5),'comboOpen':round(max(0,ct-.04),5),'comboClose':round(duration-.015,5),
   'next':nxt,'sourceFamily':'native','sourceLabel':'Sightline Mixamo','provenance':seg['provenance'],'sourceFacingYaw':0,
   'support':{**b['support'],'plantedSockets':planted,'contactStart':round(max(0,ct-.025),5),'contactEnd':round(ct+.055,5)},
   'timingMap':{'sourceStart':seg['provenance']['start'],'sourceEnd':seg['provenance']['end'],'playbackRate':rate,'start':0,'end':duration},
   'transition':{'entryEnd':round(min(.055,ct*.6),5),'exitStart':round(ct+.055,5),'exitEnd':round(max(ct+.07,duration*.68),5)}}
  seg['moveId']=moveid;seg['combatRole']='air' if b['kind']=='air' else 'ground';seg['support']={'mode':b['support']['mode']};seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);moves.append(move)
 state={'name':'Street','moves':moves};defense={}
 for role,(name,start,end,duration) in {**DEFENSE,**REACTIONS}.items():
  seg=crop(native[name],'action-v2-sl-'+STYLE+'-'+role,start,end,duration);seg['combatRole']=role.split('-')[0];seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);state[role]=seg['id'];defense[role]=seg['id']
 manifest={'version':3,'hero':'sightline','animationPack':'assets/sightline/action-street-gameplay.json.gz','states':{STYLE:state},'moves':moves,'defense':{STYLE:defense},
  'sourceHipsRestY':rest,'hipsPolicy':'horizontal hips centred; height rescaled at load by Sightline idle hips height / sourceHipsRestY',
  'sourceBoundary':"Backspool's licensed Mixamo combat clips played on Sightline's Mixamo rig; move rules copied from the action-v3 impact style.",
  'rhythm':'four-hit RT burst; kicks on the stick; knee heavy; high guard on LB','contactPolicy':v3['contactPolicy']}
 OUT.mkdir(exist_ok=True);(OUT/'action-street-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');gzwrite(OUT/'action-street-gameplay.json.gz',pack)
 print('authored',len(moves),'street moves and',len(pack),'clips; source hips rest',round(rest,4))
if __name__=='__main__':build()
