"""Replace provisional roles with originally named, source-only parkour clips.

The name dictionary establishes motion identity; collision/travel adaptation is
still authored. This does not certify the original controller or original IK.
"""
import gzip
import hashlib
import json
from pathlib import Path
from build_forspoken_backspool_pilot import retarget

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'output/rea-forspoken'
CHOICES = {
    'wallClimb': ('2811ae77', 'pkr_mgc_climb_base_f000a'),
    'wallRun': ('2811ae77', 'pkr_mgc_climb_base_f000a'),
    'wallBoost': ('2811042b', 'pkr000_mgc_climb_first_base_h300a'),
    'mantle': ('281191f4', 'pkr000_mgc_climb_finish_base_h500a'),
    'tether': ('2811b550', 'pkr_mgc_grab_base_f000a'),
    'zipLaunch': ('28119e99', 'pkr000_mgc_gimmick_bungy_end_u000a'),
    'dash': ('28110410', 'pkr000_mgc_move_begin_dash_base_f000a'),
    'airDash': ('281103fb', 'pkr000_mgc_move_begin_dash_air_f000a'),
    'roll': ('2811a88a', 'pkr_mgc_avoid_roll_base_f000a'),
    'skip': ('2811bc3d', 'pkr000_mgc_diveportal_loop_middle_f000a'),
    'teleport': ('2811bc3d', 'pkr000_mgc_diveportal_loop_middle_f000a'),
    'float': ('2811a7db', 'pkr_mgc_prav_loop_base_f000a'),
    'glide': ('2811926e', 'pkr000_mgc_move_slide_f000a_lp'),
    'slide': ('2811926e', 'pkr000_mgc_move_slide_f000a_lp'),
}


def main():
    evidence = json.loads((OUT/'native-controller-contracts-v12.json').read_text())
    named = {m['animationId']: m for m in evidence['motions']}
    profiles = json.loads((OUT/'movement-kinematic-profiles.json').read_text())['clips']
    folder = ROOT/'assets/backspool/source-named-parkour-v12'
    folder.mkdir(exist_ok=True)
    roles = []
    for role, (identifier, expected_name) in CHOICES.items():
        source_id = '0x'+identifier
        original = named[source_id]
        if original['originalName'] != expected_name:
            raise ValueError('Original motion label changed')
        record = next(r for r in profiles if r['animationId'] == source_id)
        source = json.loads(Path(record['sourceTrackFile']).read_text())
        if source['sourceSha256'] != original['sourceSha256']:
            raise ValueError('Original named motion identity mismatch')
        clip = retarget(source, preserve_pelvis=True)
        clip['name'] = 'forspoken-flow-'+role
        clip['userData']['originalMotionName'] = expected_name
        path = folder/(role+'-'+identifier+'.json.gz')
        path.write_bytes(gzip.compress(json.dumps(clip, separators=(',', ':')).encode(), mtime=0))
        roles.append({'role': role, 'id': clip['name'], 'sourceAnimationId': source_id,
                      'sourceSha256': source['sourceSha256'], 'originalMotionName': expected_name,
                      'dictionaryOffset': original['dictionaryOffset'], 'dictionarySha256': evidence['dictionary']['sha256'],
                      'url': path.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                      'duration': clip['duration'], 'start': 0, 'end': clip['duration'], 'playbackRate': 1,
                      'pelvisTranslation': True, 'verifiedOriginalRole': False,
                      'roleEvidence': 'Exact original motion label; Backspool selection/travel/contact adapter remains authored.'})
    (ROOT/'assets/backspool/traversal-named-parkour-roles-v12.json').write_text(json.dumps(
        {'schema': 'backspool-named-parkour-v12', 'sourceOnly': True, 'roles': roles,
         'originalControllerVerified': False, 'originalIKVerified': False}, indent=2)+'\n')
    print(json.dumps({r['role']: {'source': r['sourceAnimationId'], 'duration': r['duration']} for r in roles}))


if __name__ == '__main__':
    main()
