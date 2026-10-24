"""Retarget recovered Forspoken Zip/grab candidates without changing source assets."""
import gzip,hashlib,json
from pathlib import Path
import build_forspoken_backspool_pilot as pilot
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'output/rea-forspoken'
pilot.OUT=SOURCE
pilot.ROOT=ROOT.parent
names=json.loads((SOURCE/'original-player-motion-names-v12.json').read_text())
profiles=json.loads((SOURCE/'movement-kinematic-profiles.json').read_text())['clips']
folder=ROOT/'assets/backspool/threadrail-whip';folder.mkdir(exist_ok=True)
records=[]
for identifier in ['2811b550','2811be99','2811c0d4','28119ec7']:
    entry=next(m for m in names['motions'] if m['animationId']=='0x'+identifier)
    profile=next(m for m in profiles if m['animationId']=='0x'+identifier)
    source=json.loads(Path(profile['sourceTrackFile']).read_text())
    assert source['sourceSha256']==entry['sourceSha256']
    clip=pilot.retarget(source,preserve_pelvis=False)
    clip['name']='forspoken-threadrail-whip-'+identifier
    clip['userData'].update(originalMotionName=entry['originalName'],sourcePack=entry['pack'],adaptation='Source upper-body quaternion layer; authored cartridge release, no original event timing recovered')
    path=folder/(identifier+'.json.gz');path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
    records.append({**entry,'duration':clip['duration'],'url':path.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
manifest={'schema':'threadrail-whip-source-v1','sourceDictionary':names['dictionary'],'originalControllerVerified':False,'originalReleaseMarkerRecovered':False,'candidates':records}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(records,indent=2))
# Sagittal mirror of animated model-space deltas, then rebuild local rotations.
# Mirroring quaternion components in arbitrary local bone axes would twist wrists.
bind=json.loads((ROOT.parent/'output/rea-naruto/animation-pass/backspool-bind.json').read_text())
bones={b['name']:b for b in bind};rest={};identity=[0,0,0,1]
def world_rest(n):
    if n not in rest:
        b=bones[n];rest[n]=pilot.mul(world_rest(b['parent']) if b['parent'] in bones else identity,b['quaternion'])
    return rest[n]
for n in bones:world_rest(n)
clip=json.loads(gzip.decompress((folder/'2811be99.json.gz').read_bytes()))
tracks={t['name'].split('.')[0]:t for t in clip['tracks'] if t['type']=='quaternion'}
times=next(iter(tracks.values()))['times'];mirrored={n:[] for n in tracks}
for i,t in enumerate(times):
    world={};wanted={}
    def w(n):
        if n not in world:
            b=bones[n];world[n]=pilot.mul(w(b['parent']) if b['parent'] in bones else identity,tracks[n]['values'][i*4:i*4+4])
        return world[n]
    for n in tracks:
        twin=n.replace('Left','@').replace('Right','Left').replace('@','Right')
        delta=pilot.mul(w(twin),pilot.inv(rest[twin]));reflection=[delta[0],-delta[1],-delta[2],delta[3]]
        wanted[n]=pilot.mul(reflection,rest[n])
    for n in tracks:
        parent=bones[n]['parent'];q=pilot.norm(pilot.mul(pilot.inv(wanted.get(parent,identity)),wanted[n]));previous=mirrored[n][-4:]
        if previous and sum(a*b for a,b in zip(q,previous))<0:q=[-v for v in q]
        mirrored[n].extend(q)
for n,tr in tracks.items():tr['values']=mirrored[n]
clip['name']+='-mirrored';clip['userData']['authoredMirror']='Model-space sagittal reflection of original deltas; left-hand Backspool adaptation, not a separately recovered source clip'
path=folder/'2811be99-left.json.gz';path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
manifest['gameplay']={'sourceAnimationId':'0x2811be99','originalMotionName':'pkr_mgc_grab_short_f000a','rightUrl':'assets/backspool/threadrail-whip/2811be99.json.gz','leftUrl':path.relative_to(ROOT).as_posix(),'mirrorSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'sourceStart':0,'sourceEnd':.54,'rate':1.05,'releaseSourceTime':.30,'blendIn':.075,'blendOut':.14,'castSpacing':.62,'releaseTiming':'Authored at forward extension; original release event unrecovered','bodyPolicy':'Spine/arms/fingers quaternion layer only; physics and leg animation retain ownership'}
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
