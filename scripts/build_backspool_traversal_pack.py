"""Deterministically package existing native clips; no source-game extraction claims."""
from pathlib import Path
import gzip,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
NAMES={'vault':'Vault Over Box to crouched cover','climb':'run to wall climb it and crouch on top of wall','slide':'Running Slide','ledgeClimb':'from hang to climb up on top of ledge','wallClimb':'Climbing Up Wall'}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def build():
 source=ROOT/'assets/backspool/animations.json';entries=json.loads(source.read_text());pack=[];manifest=[]
 for role,name in NAMES.items():
  entry=next(e for e in entries if e['name']==name);native=Path('/Users/richardmpayi/Downloads/yellow+armored')/entry['sourceFolder'];matches=[p for p in native.glob('*.fbx') if p.stem.strip()==name]
  if len(matches)!=1:raise RuntimeError((name,matches))
  path=matches[0];item={**entry,'traversalRole':role};pack.append(item)
  manifest.append(dict(role=role,id=entry['id'],name=name,duration=entry['clip']['duration'],sourcePath=str(path),sourceSha256=digest(path),existingAsset=entry['url'],existingAssetSha256=digest(ROOT/entry['url']),trackCount=len(entry['clip']['tracks']),playbackRate=1,sourceStart=0,sourceEnd=entry['clip']['duration'],admission='candidate; pose/contact validation pending',rootMotion='cleanClip removes horizontal translation; vertical root requires contact review'))
 target=ROOT/'assets/backspool/traversal-native-candidate.json.gz';target.write_bytes(gzip.compress(json.dumps(pack,separators=(',',':')).encode(),mtime=0))
 data=dict(version=1,origin='Existing user-provided Backspool native FBX animations; not Forspoken motions',packUrl=target.relative_to(ROOT).as_posix(),packSha256=digest(target),inventorySourceSha256=digest(source),clips=manifest,admittedToActiveGame=False,requiredValidation=['Skeleton compatibility using current loader','Dense floor/contact/limb sampling','Match body motion to swept path at native timing','Full-body collision and supported exit','Combat/hero-switch interruption cleanup'])
 out=ROOT/'assets/backspool/traversal-native-candidate-manifest.json';out.write_text(json.dumps(data,indent=2)+'\n');return data
if __name__=='__main__':
 d=build();print(json.dumps({'clips':len(d['clips']),'bytes':(ROOT/d['packUrl']).stat().st_size,'sha256':d['packSha256']}))
