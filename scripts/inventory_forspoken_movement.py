"""Inventory all recovered movement resources; preserve failures rather than narrow coverage."""
import json,sys
from pathlib import Path
from inspect_forspoken_pka import inspect,frames_evidence
OUT=Path(__file__).resolve().parents[1]/'output/rea-forspoken'
def main():
 inputs=json.loads((OUT/'movement-assets/manifest.json').read_text())['entries'];rows=[]
 for asset in inputs:
  if not asset['path'].endswith('.pka'):continue
  path=Path(asset['output']);pack=inspect(path);folder=OUT/'movement-ani'/path.stem;folder.mkdir(parents=True,exist_ok=True);good=[]
  for c in pack['clips']:
   row={'pack':asset['path'],'animationId':c['animationId'],'durationSeconds':c['durationSeconds'],'fps':c['keyframeFps'],'properties':c['properties'],'assetSha256':asset['sha256'],'status':'indexed'}
   try:
    result=frames_evidence({**pack,'clips':[c]},path,folder)['clips'][0];good.append(result);row.update(status='frames-parsed',file=result['file'],frameCount=result['frameCount'],constantData=c['candidateOffsets']['constantData'],maskPopulations=[m['population'] for m in result['candidateBitMasks']])
   except Exception as e:row.update(status='unsupported-frame-profile',error=str(e))
   rows.append(row)
  (folder/'manifest.json').write_text(json.dumps({'clips':good},indent=2))
 result={'scope':'All12 recovered hu000 movement/ability packages; further linked source inventory not yet excluded','totalIndexed':len(rows),'framesParsed':sum(r['status']=='frames-parsed' for r in rows),'clips':rows,'gameplayIntegrated':0}
 (OUT/'movement-coverage.json').write_text(json.dumps(result,indent=2));print('Indexed',len(rows),'parsed',result['framesParsed'],'failures',len(rows)-result['framesParsed'])
if __name__=='__main__':main()
