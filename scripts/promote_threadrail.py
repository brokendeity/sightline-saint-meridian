"""Publish a separately named local HTML only when its recorded automated gates pass."""
import argparse,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/threadrail'
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def require(value,message):
 if not value:raise SystemExit(message)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--version',default='V2');args=parser.parse_args();version=args.version.upper();require(bool(re.fullmatch(r'V(?:[2-9]|[1-9][0-9]+)',version)),'Use a version name such as V2 or V3.')
 source=ROOT/'SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html';sha=digest(source)
 checks=json.loads((OUT/'validation-run.json').read_text())
 require(checks['allExecutedPassed'] and checks['buildSha256']==checks['buildSha256After']==sha,'Validation is missing, failed, or belongs to a different build.')
 presentation=json.loads((OUT/'presentation-v2-report.json').read_text())
 require(len(presentation['tests'])>=19 and not presentation['errors'],'Presentation acceptance has not passed.')
 chains=json.loads((OUT/'chain-report.json').read_text())
 require(len(chains['results'])==8 and all(x['pass'] for x in chains['results']),'All eight physical chains must pass.')
 perf=json.loads((OUT/'performance.json').read_text());candidate=perf['runs'][1]
 require(candidate['buildSha256']==candidate['buildSha256After']==sha,'Performance measurements belong to a different build.')
 require(perf['comparison']['medianFrameTimeIncreasePercent']<=10 and perf['comparison']['medianDrawCallIncrease']<=20,'Rendering targets have not passed.')
 require(perf['stress']['seconds']>=60 and not perf['stress']['errors'] and not any(x['errors'] for x in perf['runs']),'Performance/error stress acceptance has not passed.')
 protected={'SIGHTLINE_SAINT_MERIDIAN_TOON.html':'58f8de3207eb6b5ff5289a0a636e079fe030bbe970761933da1e2890081d1063','SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html':'3c852ba5de9f4262ac9b290c941ca686bd3f21fae64d477171ede4ecd8a3a03b','SIGHTLINE_BACKSPOOL_THREADRAIL_V1.html':'b702d85b7c0da20d5fed4a7ce5ea2365005967beb63e66443575c96d007fb179'}
 if version!='V2':
  protected['SIGHTLINE_BACKSPOOL_THREADRAIL_V2.html']='a9128294928c13bf91f95162d3b23d12ebe4432e878b87045f3150caff4ae163'
  city=json.loads((OUT/'city-routes/report.json').read_text());require(city['sha256']==sha and len(city['tests'])>=52 and not city['failures'] and not city['errors'],'Real-city route acceptance has not passed for this build.')
  controller=json.loads((OUT/'controller-bank-report.json').read_text());require(controller['sha256']==sha and len(controller['tests'])>=11 and not controller['errors'],'Controller banking acceptance has not passed for this build.')
  soak=json.loads((OUT/'soak.json').read_text());r=soak['result'];require(soak['buildSha256']==soak['buildSha256After']==sha and soak['seconds']>=300 and not soak['errors'] and not r['invalidFrames'] and not r['peakOwnerConflicts'] and r['peakRetraces']>=2,'Five-minute ownership and resource soak has not passed for this build.')
  require(r['peakBank']<=5 and r['peakRails']<=4 and r['peakBodies']<=3 and r['peakFootfalls']<=8,'Resource pools exceeded their limits during the soak.')
 for name,expected in protected.items():require(digest(ROOT/name)==expected,'Protected build changed: '+name)
 target=ROOT/('SIGHTLINE_BACKSPOOL_THREADRAIL_'+version+'.html')
 require(not target.exists() or digest(target)==sha,version+' already contains another release. Preserve it and choose a new version name.')
 target.write_bytes(source.read_bytes())
 (OUT/('release-'+version.lower()+'.json')).write_text(json.dumps({'file':target.name,'sha256':sha,'status':'automated-acceptance-passed','validationGroups':len(checks['results']),'protectedBuilds':protected,'physicalDevicesTested':False,'originalForspokenControllerVerified':False,'originalForspokenIKVerified':False},indent=2)+'\n')
 print(target)
if __name__=='__main__':main()
