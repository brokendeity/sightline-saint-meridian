"""Extract common effect containers without running the original game."""
import json,concurrent.futures,argparse
from extract_nsunsc_library import extract,OUT,DEST
from xfbin.structure.br.br_nucc import BrNuccChunkBillboard,BrNuccChunk
# High-level billboard export retains raw bytes. Avoid the legacy incorrect typed parser.
BrNuccChunkBillboard.init_data=BrNuccChunk.init_data
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--all-effects',action='store_true');ap.add_argument('--workers',type=int,default=4);args=ap.parse_args();rows=json.loads((OUT.parent/'cpk-members.json').read_text());selected=[r for r in rows if ((r['path'].startswith('data/effect/') and r['path'].endswith('.xfbin')) or r['path']=='data/ia/e/d_e.xfbin') if args.all_effects] if args.all_effects else [r for r in rows if r['path'] in ['data/effect/1efc.xfbin','data/effect/1efcmn.xfbin']];results=[]
 with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
  for result in pool.map(extract,selected):
   results.append(result)
   if len(results)%20==0 or result['status']!='extracted':print(len(results),'/',len(selected),result['path'],result['status'],result.get('error'),flush=True)
 (DEST/'shared-effect-extraction.json').write_text(json.dumps(results,separators=(',',':')));print('Complete',len(results),'failed',sum(r['status']!='extracted' for r in results),flush=True)
