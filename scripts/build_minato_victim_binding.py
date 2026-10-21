#!/usr/bin/env python3
"""Index a reference-selected victim adapter; never labels retargeting recovered behavior."""
import gzip,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):
 p=ROOT/p
 return json.load(gzip.open(p) if p.suffix=='.gz' else p.open())
def semantic(n): return n.split(' ',1)[1] if ' ' in n else ('@actor' if n.endswith('t0') else '@'+n)
def main():
 c=read('assets/motion-library/catalog.json');paths=[c['nativeRigs'][n] for n in ['1cmnbod1','5mdrbod1']];scenes=[read(p) for p in paths];rigs=[next(r for r in s['rigs'] if r['name']==n) for s,n in zip(scenes,['1cmnbod1','5mdrbod1'])]
 source=read('assets/nsunsc-library/c426d45069048ff1a4d4/scene.json.gz');a=next(a for a in source['animations'] if a['name']=='3mntspl1_dmg');target={semantic(b['name']):b for b in rigs[1]['bones']};mapping=[]
 for b in rigs[0]['bones']:
  t=target.get(semantic(b['name']))
  if t:mapping.append({'sourceName':b['name'],'targetName':t['name'],'sourceRest':b,'targetRest':t,'rootMotion':semantic(b['name']) in ['@actor','trall','pelvis']})
 names={x['sourceName'] for x in mapping};tracks=[e['name'] for e in a['entries'] if e['clump']==2 and e['format']==1]
 out={'schemaVersion':1,'sequenceId':'original:3mntspl1','status':'unverified reference-selected inspection adapter','verified':False,'sourceAnimation':a['name'],'sourceClump':'1cmnbod1','targetClump':'5mdrbod1','targetIdentity':'Six Paths Madara candidate; reference appearance, costume unverified','sourceScene':paths[0],'targetScene':paths[1],'sourceSha256':scenes[0]['source']['sha256'],'targetSha256':scenes[1]['source']['sha256'],'sequenceSha256':source['source']['sha256'],'mapping':mapping,'mappedTrackCount':sum(n in names for n in tracks),'unmappedTracks':[n for n in tracks if n not in names],'policy':{'placement':'Retain recovered reaction trall/actor/pelvis channels in shared attacker scene frame','limbs':'Preserve target rest position plus source animated translation delta; correct quaternion by target-rest times inverse-source-rest','unmatched':'Retain target rest pose; do not invent cloth simulation','material':'Retain recovered model textures; original shader bindings remain unresolved'},'limitations':['Original runtime generic-body-to-opponent dispatch has not been recovered','Face, clothing, staff and truth-seeking-orb behavior is not recovered by this adapter','Actor identity/costume and complete contact/framing remain reference-review gates']}
 p=ROOT/'assets/nsunsc-library/minato-victim-binding.json';p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({'path':str(p),'mapped':out['mappedTrackCount'],'unmapped':len(out['unmappedTracks'])}))
if __name__=='__main__':main()
