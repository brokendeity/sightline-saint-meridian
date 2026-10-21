"""Decode emission commands verified in 14131bbb0; do not simulate unknown particles."""
import json,gzip,struct
from pathlib import Path
DEST=Path(__file__).resolve().parents[1]/'assets/nsunsc-library'
def event(value):
 if not isinstance(value,int) or not 0<=value<=0xffffffff:raise ValueError('not a packed u32')
 return dict(packed=value,milliseconds=value&0x0fffffff,seconds=(value&0x0fffffff)/1000,command='enable' if value&0x80000000 else 'stop-and-drain' if value&0x40000000 else 'disable-emission',reservedFlags=value&0x30000000)
def main():
 index=json.loads((DEST/'particle-sections-index.json').read_text());total=generators=reserved=0
 for key in index['bundles']:
  p=DEST/key/'particle-sections.json.gz';data=json.loads(gzip.decompress(p.read_bytes()))
  for r in data['records']:
   a=r['sections'][0];raw=(DEST.parents[1]/r['rawUrl']).read_bytes();r['generatorConfigs']=[]
   for i in range(a['count']):
    offset=a['start']+i*a['recordBytes'];u16=lambda o:struct.unpack_from('>H',raw,offset+o)[0];s16=lambda o:struct.unpack_from('>h',raw,offset+o)[0];f32=lambda o:struct.unpack_from('>f',raw,offset+o)[0]
    r['generatorConfigs'].append(dict(generator=i,id=struct.unpack_from('>I',raw,offset+4)[0],emissionMode=raw[offset+0x10],updateRateSetting=raw[offset+0x15]&63,flags=u16(0x16),generatorUpdateCap=s16(0x1c),emissionAmount=f32(0x20),baseLifetimeUpdates=s16(0x2c),randomLifetimeFraction=f32(0x30),fadeInFraction=f32(0x4c),fadeOutFraction=f32(0x50)))
   lists=r['sections'][4].get('lists',[]);r['emissionEvents']=[dict(generator=i,sourceReference=(r.get('references') or [])[i] if i<len(r.get('references',[])) else None,events=[event(v) for v in group['values']]) for i,group in enumerate(lists)]
   r['eventGeneratorCountMatches']=len(lists)==a['count'];total+=sum(len(g['events']) for g in r['emissionEvents']);generators+=len(lists);reserved+=sum(bool(e['reservedFlags']) for g in r['emissionEvents'] for e in g['events'])
  data['eventSchemaVersion']=1;data['eventEvidence']='14131bbb0 packed low28 milliseconds, 0x80000000 enable, 0x40000000 stop/drain; 141276690/141320270 generator list association';p.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),mtime=0))
 report=dict(events=total,generators=generators,reservedFlagEvents=reserved);(DEST/'particle-events-report.json').write_text(json.dumps(report,indent=2));print(report)
if __name__=='__main__':main()
