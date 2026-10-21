"""Read-only source ACB/AFS2 recovery. No synthetic audio or name-guess mapping."""
import struct

def utf(b):
 if len(b)<32 or b[:4]!=b'@UTF':raise ValueError('invalid UTF header')
 size=struct.unpack_from('>I',b,4)[0]+8;rows=struct.unpack_from('>H',b,10)[0]+8;strings,data,name=struct.unpack_from('>III',b,12);cols,width,count=struct.unpack_from('>HHI',b,24);strings+=8;data+=8
 if not 32<=rows<=strings<=data<=size<=len(b) or count>1000000:raise ValueError('UTF bounds')
 if rows+width*count>strings:raise ValueError('UTF row overlap')
 def txt(n):
  if not strings<=strings+n<data:raise ValueError('UTF string bounds')
  end=b.find(b'\0',strings+n,data)
  if end<0:raise ValueError('UTF unterminated string')
  return b[strings+n:end].decode()
 fmts={0:'B',1:'b',2:'H',3:'h',4:'I',5:'i',6:'Q',7:'q',8:'f',9:'d',10:'I',11:'II'}
 def val(o,t):
  f='>'+fmts[t];v=struct.unpack_from(f,b,o);n=struct.calcsize(f)
  if t==10:return txt(v[0]),n
  if t==11:
   if data+v[0]+v[1]>size:raise ValueError('UTF blob bounds')
   return b[data+v[0]:data+v[0]+v[1]],n
  return v[0],n
 cs=[];p=32
 for i in range(cols):
  flag=b[p];k=txt(struct.unpack_from('>I',b,p+1)[0]);p+=5;t=flag&15;s=flag&240;v=None
  if s==48:v,n=val(p,t);p+=n
  cs.append((k,t,s,v))
 out=[]
 for i in range(count):
  p=rows+i*width;r={}
  for k,t,s,v in cs:
   if s==80:v,n=val(p,t);p+=n
   r[k]=v
  out.append(r)
 return txt(name),out

import pathlib,json,hashlib,gzip,subprocess
BASE=pathlib.Path(__file__).resolve().parents[1]
ROOT=pathlib.Path('/Users/richardmpayi/Downloads/nar/NARUTO X BORUTO Ultimate Ninja STORM CONNECTIONS')
def afs2(b):
 if len(b)<16 or b[:4]!=b'AFS2':raise ValueError('not AFS2')
 version,offset_width,id_width,reserved=b[4:8];count,align,subkey=struct.unpack_from('<IHH',b,8)
 if offset_width not in (2,4,8) or id_width not in (2,4) or not align:raise ValueError('unsupported AFS2 widths')
 if 16+count*id_width+(count+1)*offset_width>len(b):raise ValueError('truncated AFS2 directory')
 p=16;ids=[int.from_bytes(b[p+i*id_width:p+(i+1)*id_width],'little') for i in range(count)];p+=count*id_width
 offsets=[int.from_bytes(b[p+i*offset_width:p+(i+1)*offset_width],'little') for i in range(count+1)]
 result=[]
 for i,identifier in enumerate(ids):
  start=(offsets[i]+align-1)//align*align;end=offsets[i+1]
  if not 0<=start<=end<=len(b):raise ValueError('AFS2 bounds')
  result.append(dict(id=identifier,offset=start,bytes=end-start,sha256=hashlib.sha256(b[start:end]).hexdigest(),magic=b[start:start+4].hex()))
 return dict(version=version,alignment=align,subkey=subkey,waves=result)
def resolve(t,cue_index):
 cue=t['CueTable'][cue_index]
 if cue['ReferenceType']!=3:return [],'unsupported cue reference type'
 seq=t['SequenceTable'][cue['ReferenceIndex']];waves=[]
 for (trackid,) in struct.iter_unpack('>H',seq['TrackIndex']):
  track=t['TrackTable'][trackid];cmd=t['TrackEventTable'][track['EventIndex']]['Command'];p=0
  while p+3<=len(cmd):
   opcode,size=struct.unpack_from('>HB',cmd,p);arg=cmd[p+3:p+3+size];p+=3+size
   if opcode==2000 and size==4:
    typ,index=struct.unpack('>HH',arg)
    if typ!=2:return [],'unsupported track reference'
    synth=t['SynthTable'][index]
    for typ,wave in struct.iter_unpack('>HH',synth['ReferenceItems']):
     if typ!=1:return [],'unsupported synth reference'
     waves.append(wave)
 return waves,None
def main():
 out=BASE/'assets/nsunsc-library/original-audio';out.mkdir(exist_ok=True)
 eventIndex=json.loads((BASE/'assets/nsunsc-library/sound-events-index.json').read_text())
 pilotNames=set()
 for item in eventIndex['bundles'].values():
  if item['source'].endswith('/3mnt_ev_spl.xfbin'):
   for record in json.load(gzip.open(BASE/item['url']))['records']:
    pilotNames.update(e['cueName'] for e in record['events'])
 members=json.loads((BASE/'output/rea-naruto/cpk-members.json').read_text())
 manifest=dict(schemaVersion=1,language='US/English',banks=[],pilotEvents=[],limits=['ACB graph mapping is structural source evidence; runtime gain, pitch, cue branches and stop semantics remain unverified.','No matched original footage/audio reference is available.'])
 for suffix in ['Voice/US/v_spl.xfbin','Se/player_se_spl.xfbin','Se/btlcmn.xfbin','Se/common.xfbin']:
  r=next((x for x in members if x['path'].endswith(suffix)),None)
  if not r:continue
  with (ROOT/r['archive']).open('rb') as f:f.seek(r['offset']);b=f.read(r['stored_bytes'])
  acbo=b.find(b'@UTF');header=utf(b[acbo:])[1][0];tables={k:utf(v)[1] for k,v in header.items() if isinstance(v,bytes) and v.startswith(b'@UTF')};name=header['Name'];bank=dict(name=name,source=dict(r,sha256=hashlib.sha256(b).hexdigest()),acbOffset=acbo,cues=[],errors=[])
  if name=='v_spl':
   ar=next(x for x in members if x['path'].endswith('Voice/US/v_spl.awb'))
   with (ROOT/ar['archive']).open('rb') as f:f.seek(ar['offset']);awb=f.read(ar['stored_bytes'])
   bank['waveSource']=dict(ar,sha256=hashlib.sha256(awb).hexdigest())
  else:
   awb=header.get('AwbFile',b'');bank['waveSource']=dict(embeddedAcbField='AwbFile',sha256=hashlib.sha256(awb).hexdigest())
  if not awb:bank['errors'].append('no AWB bytes');manifest['banks'].append(bank);continue
  directory=afs2(awb);bank['afs2']=directory;byid={x['id']:x for x in directory['waves']}
  for row in tables.get('CueNameTable',[]):
   try:indices,error=resolve(tables,row['CueIndex'])
   except (KeyError,IndexError,struct.error) as e:indices,error=[],str(e)
   cue=dict(row,waveIndices=indices,error=error,waves=[])
   for index in indices:
    wave=tables['WaveformTable'][index];identifier=wave['StreamAwbId'] if wave['Streaming'] else wave['MemoryAwbId'];entry=byid.get(identifier)
    cue['waves'].append(dict(waveform=wave,awbId=identifier,entry=entry))
    if entry and row['CueName'] in pilotNames:
     raw=awb[entry['offset']:entry['offset']+entry['bytes']];target=out/(name+'-'+row['CueName']+'.hca');target.write_bytes(raw)
     result=subprocess.run(['ffmpeg','-v','error','-y','-i',str(target),str(target.with_suffix('.wav'))],capture_output=True,text=True)
     cue['decode']=dict(exitCode=result.returncode,error=result.stderr[:1000])
     if not result.returncode:cue['waves'][-1]['playableUrl']='assets/nsunsc-library/original-audio/'+target.with_suffix('.wav').name
   bank['cues'].append(cue)
  with gzip.open(out/(name+'-tables.json.gz'),'wt') as f:json.dump(tables,f,default=lambda v:dict(hex=v.hex()),separators=(',',':'))
  manifest['banks'].append(bank)
 index=json.loads((BASE/'assets/nsunsc-library/sound-events-index.json').read_text())
 for v in index['bundles'].values():
  if not v['source'].endswith('/3mnt_ev_spl.xfbin'):continue
  events=json.load(gzip.open(BASE/v['url']))
  for record in events['records']:
   for event in record['events']:
    matches=[dict(bank=b['name'],cue=c) for b in manifest['banks'] for c in b['cues'] if c['CueName']==event['cueName']]
    manifest['pilotEvents'].append(dict(animation=record['name'],event=event,matches=matches,status='mapped' if len(matches)==1 else 'ambiguous' if matches else 'unresolved'))
 pilot=dict(schemaVersion=1,sequenceId='3mntspl1',language='US/English',status='recovered-unverified',cues=[],events=manifest['pilotEvents'],limits=manifest['limits'])
 for bank in manifest['banks']:
  for cue in bank['cues']:
   if cue['CueName'] not in pilotNames:continue
   for wave in cue['waves']:
    if not wave.get('playableUrl'):continue
    decoded=BASE/wave['playableUrl'];probe=subprocess.run(['ffprobe','-v','error','-show_entries','stream=sample_rate,channels,duration','-of','json',str(decoded)],capture_output=True,text=True)
    pilot['cues'].append(dict(cueName=cue['CueName'],url=wave['playableUrl'],sourceBank=bank['source'],waveSource=bank['waveSource'],cueIndex=cue['CueIndex'],waveIndex=cue['waveIndices'],entry=wave['entry'],waveform=wave['waveform'],decodedSha256=hashlib.sha256(decoded.read_bytes()).hexdigest(),decoded=json.loads(probe.stdout),playback=dict(loop=False,gain=1,pitch=1,policy='one-shot inspection defaults; original loop flag, gain, pitch and stop semantics not interpreted'),mappingEvidence='Exact CueName→CueTable ReferenceType3→Sequence TrackIndex→TrackEvent opcode2000 referenceType2→Synth ReferenceItems type1→Waveform→AFS2 ID. Structural ACB interpretation; not runtime verified.'))
 (out/'minato3mntspl1.json').write_text(json.dumps(pilot,separators=(',',':'))+'\n')
 (out/'manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
 print(json.dumps(dict(banks=len(manifest['banks']),cues=sum(len(b['cues']) for b in manifest['banks']),pilotEvents=len(manifest['pilotEvents']),mapped=sum(x['status']=='mapped' for x in manifest['pilotEvents']))))
if __name__=='__main__':main()
