"""Extract original pre_spl finisher wrapper; source timing is not a hold policy."""
import gzip,hashlib,json,csv,io,math,struct
from pathlib import Path
from extract_nsunsc_library import extract,OUT,DEST

def decode_fcurve(raw):
 if len(raw)<4 or struct.unpack('>I',raw[:4])[0]!=len(raw)-4:raise ValueError('FCURVE byte length mismatch')
 lines=list(csv.reader(io.StringIO(raw[4:].decode('ascii'))))
 lines=[[v.strip() for v in row if v.strip()] for row in lines if any(v.strip() for v in row)]
 if len(lines)<3 or len(lines[0])!=1 or len(lines[1])!=1:raise ValueError('Invalid FCURVE header')
 kind,interpolation=lines[0][0],lines[1][0]
 if not kind.startswith('FCURVE_TYPE_') or interpolation!='FCURVE_INTERPOLATION_LINEAR':raise ValueError('Unsupported FCURVE declaration')
 count=int(lines[2][0]);rows=[[float(v) for v in row] for row in lines[3:]]
 if len(rows)!=count or not rows or any(len(r)!=len(rows[0]) for r in rows):raise ValueError('FCURVE key count/width mismatch')
 if not all(math.isfinite(v) for r in rows for v in r):raise ValueError('Nonfinite FCURVE key')
 if any(rows[i][0]>rows[i+1][0] for i in range(len(rows)-1)):raise ValueError('Unordered FCURVE keys')
 return dict(type=kind,interpolation=interpolation,keyCount=count,valueWidth=len(rows[0])-1,keys=[dict(sourceFrame=r[0],values=r[1:]) for r in rows],clockHz=None,boundary='Numeric keys and linear declaration recovered; source-frame clock and column semantics are not yet verified.')

def build():
 rows=json.loads((OUT.parent/'cpk-members.json').read_text())
 source=next(r for r in rows if r['path']=='data/ui/max/duel/pre_spl.xfbin')
 result=extract(source)
 if result['status']!='extracted':raise RuntimeError(result)
 scene=json.loads(gzip.decompress((DEST/result['key']/'scene.json.gz').read_bytes()))
 controls=[]
 for c in scene['unsupported']:
  if c['type']=='NuccChunkBinary':controls.append(dict(name=c['name'],sha256=c['sha256'],url=c['url'],**decode_fcurve((DEST.parents[1]/c['url']).read_bytes())))
 animations=[]
 for a in scene['animations']:
  animations.append(dict(name=a['name'],durationTicks=a['frameCount'],clockHz=3000,durationSeconds=a['duration'],frameSizeTicks=a['frameSize'],loopFlag=a['loop'],clumps=a['clumps'],entries=a['entries']))
 return dict(schemaVersion=1,id='source:pre_spl_fin',bundle=result['key'],sceneUrl=result['scene'],source=dict(archive=source['archive'],path=source['path'],offset=source['offset'],storedBytes=source['stored_bytes'],unpackedBytes=source['unpacked_bytes'],sha256=result['sha256']),animations=animations,
  runtimeBinding=dict(function='0x1409814e0',resource='pre_spl_fin',coordinateAlias='dmy_fin',spriteFunction='0x1410bd570',boundary='Sprite uses this animation binding; exact projection, sprite size, entry time and display exit are not yet verified.'),
  binaryControls=scene['unsupported'],postprocessCurves=controls,verified=False,executableOriginal=False,
  limits=['Duration is a stored animation domain with loop flag1, not original on-screen hold duration.','Source camera and coordinate transforms cannot be used as final composition until runtime conventions are recovered.','Companion overlays/effects require source shader and trigger recovery.','FLOATLINEAR data.lens retains packed[tick,value] and must use NativeCameraTracks.normalize.','No original runtime footage was observed.'])
if __name__=='__main__':
 out=DEST/'minato-finisher-wrapper.json';r=build();out.write_text(json.dumps(r,separators=(',',':'))+'\n');print(json.dumps(dict(output=str(out),bundle=r['bundle'],animations=len(r['animations']),scene=r['sceneUrl'])))
