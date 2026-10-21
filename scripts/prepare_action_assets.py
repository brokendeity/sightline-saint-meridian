"""Reproduce gameplay assets from the local, verified REA extraction cache."""
from pathlib import Path
import subprocess,sys,json,hashlib
root=Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(root/'scripts/build_backspool_action_v2_assets.py')],cwd=root,check=True)
for mode in ('anatomy','twist','facing','transitions','normalize','planted','support-index','validate','fidelity'):
    output=root/'output/action-v2'/('asset-'+mode+'.json')
    with output.open('w') as stream:
        subprocess.run(['node',str(root/'scripts/action_v2_pose_review.cjs'),mode],cwd=root,stdout=stream,check=True)
manifest=json.loads((root/'assets/backspool/action-v2-manifest.json').read_text())
(root/'assets/backspool/action-v2-manifest.js').write_text('window.backspoolMoveManifest='+json.dumps(manifest,separators=(',',':'))+';\n')
files=sorted((root/'assets/backspool').glob('action-v2-*'))
(root/'output/action-v2/asset-hashes.json').write_text(json.dumps({p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in files},indent=2)+'\n')
