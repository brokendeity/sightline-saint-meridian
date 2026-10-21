"""Re-export completed bundles that used unsupported texture paths."""
import json,concurrent.futures
from extract_nsunsc_library import DEST,extract
if __name__=='__main__':
 rows=[]
 for p in list(DEST.glob('*/index.json')):
  r=json.loads(p.read_text())
  if r['errors'] and r['status']=='extracted':rows.append((p,r))
 print('Repairing',len(rows),flush=True)
 for p,r in rows:p.unlink()
 with concurrent.futures.ProcessPoolExecutor(max_workers=2) as pool:
  for i,r in enumerate(pool.map(extract,[{k:r[k] for k in ['archive','path','offset','stored_bytes','unpacked_bytes','id']} for p,r in rows]),1):
   if i%25==0:print(i,'remaining texture errors',len(r['errors']),flush=True)
 print('DONE',flush=True)
