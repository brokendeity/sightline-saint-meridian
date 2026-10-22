"""Run presentation tests against the reference candidate without changing rollback tests/builds."""
from pathlib import Path
import argparse,subprocess,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
def run(*args):subprocess.run(args,cwd=ROOT,check=True)
def adapted(source,name):
 s=(ROOT/source).read_text().replace('SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html','SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html').replace('SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html','SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html')
 s=s.replace('output/vault-course','output/afterstep-vfx/vault').replace('output/wall-seamless','output/afterstep-vfx/wall').replace('output/threadrail/chain-report','output/afterstep-vfx/chain-report')
 p=ROOT/'output/local-scratch'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s);run('node',str(p))
def main():
 args=argparse.ArgumentParser();args.add_argument('--regressions',action='store_true');args.add_argument('--performance',action='store_true');a=args.parse_args()
 protected=['SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html','SIGHTLINE_BACKSPOOL_THREADRAIL_V3.html','SIGHTLINE_SAINT_MERIDIAN_TOON.html','SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html']
 hashes=lambda:{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in protected};before=hashes()
 run('python3','scripts/build_afterstep_vfx.py')
 for name in ['test_temporal_exhaust.cjs','test_movement_afterimages.cjs','test_afterstep_reference_units.cjs','test_afterstep_reference_vfx.cjs']:run('node','scripts/'+name)
 if a.regressions:
  for name in ['vault','wall']:(ROOT/'output/afterstep-vfx'/name).mkdir(parents=True,exist_ok=True)
  for src,name in [('test_backspool_vault_course.cjs','vfx-vault.cjs'),('test_backspool_wall_seamless.cjs','vfx-wall.cjs'),('test_threadrail_chains.cjs','vfx-chains.cjs')]:adapted('scripts/'+src,name)
 if a.performance:
  s=(ROOT/'scripts/benchmark_threadrail.cjs').read_text().replace("path.resolve(__dirname,'..')","process.cwd()").replace("path.join(root,'output/threadrail')","path.join(root,'output/afterstep-vfx/performance')").replace("['SIGHTLINE_BACKSPOOL_TRAVERSAL_CANDIDATE.html','SIGHTLINE_BACKSPOOL_THREADRAIL_CANDIDATE.html']","['SIGHTLINE_BACKSPOOL_VAULT_PLAYGROUND.html','SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html']")
  (ROOT/'output/afterstep-vfx/performance').mkdir(exist_ok=True);p=ROOT/'output/local-scratch/vfx-performance.cjs';p.write_text(s);run('node',str(p))
 assert before==hashes(),'A protected entrypoint changed during validation'
 target=ROOT/'SIGHTLINE_BACKSPOOL_AFTERSTEP_VFX.html'
 (ROOT/'output/afterstep-vfx/validation.json').write_text(json.dumps({'passed':True,'regressions':a.regressions,'performanceRerun':a.performance,'buildSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'protectedBuilds':before},indent=2)+'\n')
if __name__=='__main__':main()
