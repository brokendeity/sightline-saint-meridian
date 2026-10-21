"""Build separate Backspool v2 source/segment packs without touching the active build.
All timings below are authored Backspool gameplay, not recovered STORM gameplay rules.
"""
import json, gzip, math, sys, hashlib, bisect
from pathlib import Path
from retarget_storm_backspool import retarget, dest, mul, inv, norm, lerpq
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'output/rea-naruto/animation-pass';OUT=BASE/'action-v2';ASSETS=ROOT/'assets/backspool'
LABELS={'3mnt':'Minato','4ssi':'Shisui','2kks':'Kakashi','2ssk':'Sasuke','2skr':'Sakura','2tnd':'Tsunade','2guy':'Might Guy','2roc':'Rock Lee','2nej':'Neji','2hnt':'Hinata','2sik':'Shikamaru','2itc':'Itachi'}
def gzwrite(path,data):path.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=9,mtime=0))
def source_clips():
 cache=OUT/'source-retarget.json.gz'
 if cache.exists():return json.load(gzip.open(cache))
 clips=[];maps={}
 for code in LABELS:
  p=OUT/f'curves-{code}.json' if (OUT/f'curves-{code}.json').exists() else BASE/f'selected-curves-{code}.json'
  data=json.loads(p.read_text());rows,mp=retarget(data,source_timing=True);clips+=rows;maps[code]=mp;print(code,len(rows),flush=True)
 gzwrite(cache,clips);(OUT/'rig-mappings.json').write_text(json.dumps(maps,indent=2));return clips
if __name__=='__main__':
 rows=source_clips();print('source retarget',len(rows))
 gzwrite(ASSETS/'action-v2-source-preview.json.gz',[x for x in rows if x['character'] in ('2kks','2ssk','2skr','2tnd','2hnt','2itc')])

def trsample(tr,t):
 ts=tr['times'];v=tr['values'];stride=4 if tr['type']=='quaternion' else 3;i=max(0,min(len(ts)-1,bisect.bisect_right(ts,t)-1));a=v[i*stride:(i+1)*stride]
 if i==len(ts)-1:return a
 f=max(0,min(1,(t-ts[i])/max(1e-9,ts[i+1]-ts[i])));b=v[(i+1)*stride:(i+2)*stride]
 return lerpq(a,b,f) if stride==4 else [x+(y-x)*f for x,y in zip(a,b)]
def crop(entry,moveid,start,end,duration,support='feet'):
 rate=(end-start)/duration;assert .8499<=rate<=1.5001,(moveid,rate)
 assert 0<=start<end<=entry['clip']['duration']+.0001
 times=[i/120 for i in range(math.ceil(duration*120))]+[duration];tracks=[]
 for tr in entry['clip']['tracks']:
  values=[]
  for t in times:values.extend(round(x,7) for x in trsample(tr,start+t*rate))
  tracks.append({**tr,'times':[round(t,7) for t in times],'values':values})
 clipid='action-v2-'+moveid
 return dict(id=clipid,name=moveid.replace('-',' ').title(),sourceFolder='Action v2 gameplay segments',character=entry['character'],characterLabel=entry['characterLabel'],sourceAnimation=entry['sourceAnimation'],combatRole='air' if support=='air' else 'ground',playbackRate=1,support={'mode':support},provenance=dict(animation=entry['sourceAnimation'],start=start,end=end,playbackRate=rate,sourceDuration=entry['clip']['duration']),clip=dict(name=clipid,uuid=clipid,duration=duration,tracks=tracks))

# One contact / one input. Timings are authored around measured forward extensions.
# Weapon-owning source families are admitted only through foot-contact slices.
SPECS={
'flow':[
 ('light-1','3mntcmb02',.035,.375,.30,.13,'rightHand','light'),
 ('light-2','4ssicmb00',.065,.425,.30,.17,'leftHand','light'),
 ('light-3','2kkscmb01',.06,.408,.30,.167,'rightFoot','light'),
 ('light-4','2sskcmb02',.26,.62,.32,.367,'rightFoot','light'),
 ('left','4ssicmb02',.19,.586,.34,.30,'leftFoot','direction'),
 ('right','3mntcmb01',.54,.936,.34,.65,'rightFoot','direction'),
 ('heavy','2kkscmb10',.11,.86,.65,.333,'leftFoot','heavy'),
 ('launcher','2sskcmb10',.03,.81,.65,.252,'leftFoot','heavy'),
 ('air-light','4ssicma00',.08,.44,.32,.18,'leftHand','air'),
 ('air-finisher','2sskcma02',.25,.91,.55,.50,'rightFoot','air'),
 ('counter-1','2kkscmb06',.13,.565,.36,.25,'rightFoot','counter'),
 ('counter-2','3mntcmb02',.01,.39,.34,.13,'rightHand','counter'),
],
'impact':[
 ('light-1','2skrcmb00',.055,.58,.44,.25,'rightHand','light'),
 ('light-2','2tndcmb00',.035,.56,.44,.217,'rightHand','light'),
 ('light-3','2guycmb00',.01,.53,.44,.167,'rightHand','light'),
 ('light-4','2roccmb00',.01,.55,.46,.167,'leftFoot','light'),
 ('left','2tndcmb02',.095,.665,.48,.267,'rightFoot','direction'),
 ('right','2guycmb02',.005,.575,.48,.20,'rightFoot','direction'),
 ('heavy','2skrcmb01',.18,1.055,.75,.43,'rightHand','heavy'),
 ('launcher','2tndcmb04',.04,.90,.75,.30,'leftHand','heavy'),
 ('air-light','2guycma00',.02,.57,.46,.217,'rightHand','air'),
 ('air-finisher','2roccma01',.14,.98,.70,.38,'rightFoot','air'),
 ('counter-1','2skrcmb02',.15,.72,.48,.32,'rightHand','counter'),
 ('counter-2','2tndcmb03',.22,.79,.48,.383,'rightHand','counter'),
],
'counter':[
 ('light-1','2nejcmb00',.035,.455,.36,.167,'leftHand','light'),
 ('light-2','2hntcmb00',.055,.475,.36,.20,'leftHand','light'),
 ('light-3','2sikcmb00',.07,.49,.36,.20,'rightHand','light'),
 ('light-4','2itccmb08',.085,.505,.36,.217,'leftFoot','light'),
 ('left','2hntcmb02',.12,.576,.38,.25,'leftHand','direction'),
 ('right','2sikcmb02',.055,.535,.40,.20,'rightFoot','direction'),
 ('heavy','2nejcmb02',.22,1.0,.65,.50,'rightHand','heavy'),
 ('launcher','2itccmb14',.23,1.07,.70,.483,'rightFoot','heavy'),
 ('air-light','2hntcma00',.10,.58,.40,.25,'leftHand','air'),
 ('air-finisher','2itccma02',.07,.79,.60,.333,'rightFoot','air'),
 ('counter-1','2nejcmb01',.11,.566,.38,.267,'leftHand','counter'),
 ('counter-2','2hntcmb03',.25,.73,.40,.40,'rightHand','counter'),
]}
def author(rows):
 byname={x['sourceAnimation']:x for x in rows};pack=[];states={};moves=[]
 for state,specs in SPECS.items():
  smoves=[]
  for suffix,source,start,end,duration,contact,socket,kind in specs:
   moveid=state+'-'+suffix;entry=byname[source];air=kind=='air';seg=crop(entry,moveid,start,end,duration,'air' if air else 'feet');rate=seg['provenance']['playbackRate'];ct=round((contact-start)/rate,5);assert .01<ct<duration-.06,(moveid,ct,duration)
   isheavy=kind=='heavy' or suffix=='air-finisher';launcher=suffix=='launcher';damage=(14 if state=='flow' else 19 if state=='impact' else 15)+(12 if isheavy else 0)+(6 if kind=='counter' else 0)
   event=dict(id=moveid+'-contact',time=ct,socket=socket,radius=.32 if 'Hand' in socket else .38,damage=damage,push=2.3 if isheavy else .18 if state=='flow' else .35 if state=='impact' else .12,heavy=isheavy,launcher=launcher)
   chain=round(max(ct+.07,duration*.68),5);cancel=round(max(ct+.065,duration*.66),5)
   move=dict(id=moveid,name=seg['name'],state=state,version=2,clipId=seg['id'],sourceStart=0,sourceEnd=duration,duration=duration,contact=[event],chainAt=chain,cancelAt=cancel,comboOpen=round(max(0,ct-.04),5),comboClose=round(duration-.015,5),next=state+'-light-'+str(int(suffix[-1])+1) if suffix.startswith('light-') and int(suffix[-1])<4 else None,kind=kind,sourceFamily=entry['character'],sourceLabel=entry['characterLabel'],provenance=seg['provenance'],support={'mode':'air' if air else 'feet','plantedSockets':[] if air else ['rightFoot'] if socket=='leftFoot' else ['leftFoot'] if socket=='rightFoot' else ['leftFoot','rightFoot']},movement={'distance':.23 if state=='flow' else .19 if state=='impact' else .12,'maxYaw':6 if state=='flow' else 3.5 if state=='impact' else 5},damage=damage,reaction='launch' if launcher else 'heavy' if isheavy else 'stagger',landing='close' if air else 'ground')
   if suffix=='air-light':move['next']={'light':state+'-air-light','finisher':state+'-air-finisher'}
   if suffix=='counter-1':move['next']=state+'-counter-2'
   seg['moveId']=moveid;seg['support']=move['support'];seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);moves.append(move);smoves.append(move)
  states[state]=dict(name=state.title(),moves=smoves)
 defenseSpecs={'flow':{'stance':('3mntgrd0',.12,.72,.60),'guard':('2kksgrd0',.10,.70,.60),'dodge':('4ssidsb0',.04,.592,.48)},'impact':{'stance':('2guygrd0',.16,.76,.60),'guard':('2tndgrd0',.08,.68,.60),'dodge':('2skrdsb0',.06,.612,.48)},'counter':{'stance':('2nejgrd0',.18,.78,.60),'guard':('2hntgrd0',.12,.72,.60),'dodge':('2itcdsb0',.07,.622,.48)}}
 defense={}
 for state,roles in defenseSpecs.items():
  defense[state]={}
  for role,(source,start,end,duration) in roles.items():
   seg=crop(byname[source],state+'-'+role,start,end,duration);seg['combatRole']=role;seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);states[state][role]=seg['id'];defense[state][role]=seg['id']
 # Separate native reactions preserve their original anatomical fit and natural first .4 seconds.
 native=json.load(gzip.open(ASSETS/'animations-web.json.gz'))
 for state,name in [('flow','Hit Reaction'),('impact','Hit On left Side Of Head while running'),('counter','Hit On right  Side Of Head while running')]:
  entry=next(x for x in native if x['name']==name);duration=.4;entry={**entry,'character':'native','characterLabel':'Backspool native','sourceAnimation':entry['id']};seg=crop(entry,state+'-reaction',0,duration,duration);seg['combatRole']='reaction';seg['contactPolicy']='authored-sole-root-v2';pack.append(seg);states[state]['reaction']=seg['id'];defense[state]['reaction']=seg['id']
 manifest=dict(version=2,animationPack='assets/backspool/action-v2-gameplay.json.gz',states=states,moves=moves,defense=defense,sourceBoundary='Supported local motion curves only; move timing/hit/cancel rules are authored for Backspool, not recovered STORM gameplay.',contactPolicy='full mesh sole-root normalization; runtime correction cap .12m',createdFrom={'sourceFamilies':LABELS,'moves':len(moves)})
 (ASSETS/'action-v2-manifest.json').write_text(json.dumps(manifest,indent=2));(ASSETS/'action-v2-manifest.js').write_text('window.backspoolMoveManifest='+json.dumps(manifest,separators=(',',':'))+';\n')
 gzwrite(ASSETS/'action-v2-gameplay.json.gz',pack)
 coreNames={'Breathing Idle without skin','Sneak Walk','Standard Run','sprint','Shooting ability out of hand','jump- from idle to jump','rail grinding','Falling To Landing on feet transition','Big Body Blow getting pushed back and fall','Fall Flat on face from hard hit on the back','Jumping','Running to Forward Flip','Front Twist Flip when jumping while running','Hit Reaction','Aerial Evade for incoming projectile','Standing Dodge Right','Standing Dodge Left','Standing Dodge Backward','Hit On left Side Of Head while running','Hit On right  Side Of Head while running','Dying no health','Action Idle To Fight Idle','standing idle to fight stance','Mma Kick','body hook','left punch','heavy uppercut','hook with lead hand','Roundhouse Kick','Leg Sweep attack','back side kick','Standing Dodge Backward'}
 core=[e for e in native if e['name'] in coreNames];assert coreNames<={x['name'] for x in core};gzwrite(ASSETS/'action-v2-core-native.json.gz',core)
 old=json.load(gzip.open(ASSETS/'storm-local-clips.json.gz'));new=[x for x in rows if x['character'] in ('2kks','2ssk','2skr','2tnd','2hnt','2itc')]
 index=[]
 for collection,url in [(native,'assets/backspool/animations-web.json.gz'),(old,'assets/backspool/storm-local-clips.json.gz'),(new,'assets/backspool/action-v2-source-preview.json.gz')]:
  for e in collection:index.append({**{k:e.get(k) for k in ('id','name','sourceFolder','characterLabel','sourceAnimation','combatRole')},'pack':url,'packUrl':url,'duration':e['clip']['duration'],'gameplayIntegrated':False})
 for e in pack:index.append({**{k:e.get(k) for k in ('id','name','sourceFolder','characterLabel','sourceAnimation','combatRole')},'pack':'assets/backspool/action-v2-gameplay.json.gz','packUrl':'assets/backspool/action-v2-gameplay.json.gz','duration':e['clip']['duration'],'gameplayIntegrated':True})
 (ASSETS/'action-v2-preview-index.json').write_text(json.dumps(index,separators=(',',':')))
 print('authored',len(moves),'moves',len(pack),'gameplayclips',len(core),'core',len(index),'previewmetadata')
 return manifest,pack
if __name__=='__main__':author(rows)
