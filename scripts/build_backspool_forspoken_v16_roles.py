"""Source-only v16 wall and graded-landing motion admission; selection is authored.

Clips come from the already decoded local movement tracks; nothing new is
extracted. Roles keep provenance so each can be swapped for a replacement clip.
"""
import gzip, hashlib, json
from pathlib import Path
import build_forspoken_backspool_pilot as pilot
from build_forspoken_backspool_pilot import retarget
from build_backspool_source_movement import compact
ROOT=Path(__file__).resolve().parents[1]
# Decoded tracks and rig bindings live beside the project, outside the repository checkout.
TRACKS=ROOT.parent/'output/rea-forspoken'
pilot.OUT=TRACKS;pilot.ROOT=ROOT.parent
# role: (source id, start, end, playback rate). Original names prove clip
# identity, not the original game's contextual selection or IK.
CHOICES={
 # Forspoken has no sideways wall-run loop: wall_rondart is a cartwheel off the wall (0-.9s) into a run.
 'wallFlip':('28112ccd',0,.90,1.1),      # pkr000_ntl_wall_rondart_base_f000a, cartwheel portion only
 'wallKick':('281103cf',0,.65,1.1),      # pkr000_ntl_wallkick_base_b000a, backflip portion before it stands
 'landSoft':('281126ef',0,.90,1),        # pkr000_ntl_land_hgt1_base_f000a
 'landSoftMove':('2811abff',0,2/3,1),    # pkr000_ntl_land_hgt1_move_f000a
 # pkr000_ntl_land_hgt4_base is a roll and reads wrong with the hips held in place.
 'landHeavy':('28113d04',0,1.60,1),      # air_land_hgt3_inplace_n000a, knee-down landing, standing by 1.4s
 'landMoveFast':('2811b928',0,1.10,1.1), # pkr000_mgc_land_hgt3_move_f000a
}
def main():
 names=json.loads(gzip.decompress((ROOT/'assets/backspool/original-motion-names-v12.json.gz').read_bytes()))
 named={e['animationId']:e for e in names['motions']}
 index=json.loads((TRACKS/'movement-kinematic-profiles.json').read_text())['clips']
 source_index=json.loads((TRACKS/'movement-source-tracks/manifest.json').read_text())['clips']
 sources={e['animationId']:e['output'] for e in source_index}
 for e in index:sources.setdefault(e['animationId'],e['sourceTrackFile'])
 folder=ROOT/'assets/backspool/source-forspoken-v16';folder.mkdir(exist_ok=True)
 roles=[]
 for role,(ident,start,end,rate) in CHOICES.items():
  native=named['0x'+ident]
  if '0x'+ident not in sources:raise ValueError('Source tracks required '+ident)
  source=json.loads(Path(sources['0x'+ident]).read_text())
  assert source['sourceSha256']==native['sourceSha256']
  clip=compact(retarget(source,preserve_pelvis=True));clip['name']='forspoken-v16-'+role
  assert 0<=start<end<=clip['duration']+1e-6
  clip['userData']['originalMotionName']=native['originalName']
  path=folder/(role+'-'+ident+'.json.gz');path.write_bytes(gzip.compress(json.dumps(clip,separators=(',',':')).encode(),mtime=0))
  roles.append(dict(role=role,id=clip['name'],sourceAnimationId='0x'+ident,sourceSha256=source['sourceSha256'],originalMotionName=native['originalName'],dictionaryOffset=native['dictionaryOffset'],url=path.relative_to(ROOT).as_posix(),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),duration=clip['duration'],start=start,end=end,playbackRate=rate,pelvisTranslation=True,verifiedOriginalRole=False,replaceable=True))
 (ROOT/'assets/backspool/traversal-forspoken-v16-roles.json').write_text(json.dumps(dict(schema='backspool-forspoken-v16',sourceOnly=True,roles=roles,originalControllerVerified=False,originalIKVerified=False),indent=2)+'\n')
 print('Admitted',len(roles),'v16 source motion roles')
if __name__=='__main__':main()
