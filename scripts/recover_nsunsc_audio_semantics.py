"""Source-backed nominal event stop metadata, separate from unverified original mix."""
import json,hashlib,struct
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
FUN=BASE/'output/rea-naruto/ghidra/full-export/main-final/functions'
def semantics(event):
 dispatch=int(event['dispatchType']);mode=int(event['rawFloat_60']);stop=event['rawI16_56'];fade=event['rawI16_58']
 result=dict(dispatch=dispatch,runtimeStopMode=mode,startSourceSeconds=event['sourceFrame']/30,
  stopSourceSeconds=None,fadeSeconds=None,stopPolicy='unresolved',loop=False,
  loopEvidence='No physical HCA loop chunk in all 32 recovered pilot waveforms; ACB raw LoopFlag1 is not used as a browser loop switch.',
  rawGainCandidate=event['rawFloat_34'],rawPitchCandidate=event['rawI16_32'],gainPolicy='not applied: call-argument/ACB mix equivalence not fully verified')
 if dispatch==0 and mode in (1,2) and stop>=0:
  result.update(stopSourceSeconds=stop/30,fadeSeconds=max(0,fade)*33.33300018310547/1000,
   stopPolicy='absolute-source-frame stop; nominal source clock; engine adaptation retained as limitation')
 elif dispatch==4 and mode==8:
  result.update(stopPolicy='voice dispatch does not enter DemoEx expiry stop branches; waveform completes or voice-manager state stops it')
 return result

def main():
 out=BASE/'assets/nsunsc-library/original-audio';pilot=json.loads((out/'minato3mntspl1.json').read_text())
 addresses=['140928e70','1409291d0','140925ca0','140927a20','140926000','140927cf0','140927100','140926d70','140936760','1409354c0','140933f30']
 report=dict(schemaVersion=1,sequenceId='3mntspl1',sourceExecutableSha256='cecf0405b5ac00b9b9c95e8ff594bde5f8543413b6308f74991c701218b20d1e',evidence=[],events=[],waves=[],limits=[
 'Static reconstructed behavior, not original runtime observation or matched-footage verification.',
 'Absolute stop time is nominal source frame/30. Setup truncates/signed16 quantizes by configured FPS; countdown includes actor/global clock and owner speed.',
 'Fade factor is source constant33.33300018310547 milliseconds per raw fade unit, not exact 1/30.',
 'Gain/pitch/voice-manager policies and ACB commands are preserved but not certified; no original mix fidelity claim.',
 'Two SFX fade values are positive. Simulated source clock can schedule their fade from nominal stop; original per-update rounding remains unverified.'])
 for a in addresses:
  p=FUN/a[:6]/(a+'.c');report['evidence'].append(dict(address=a,file=str(p.relative_to(BASE)),sha256=hashlib.sha256(p.read_bytes()).hexdigest()))
 for row in pilot['events']:report['events'].append(dict(animation=row['animation'],eventIndex=row['event']['index'],cueName=row['event']['cueName'],**semantics(row['event'])))
 for cue in pilot['cues']:
  raw=BASE/cue['url'].replace('.wav','.hca');b=raw.read_bytes();length=int.from_bytes(b[6:8],'big');header=bytes(x&127 for x in b[:length]);loop=header.find(b'loop')
  item=dict(cueName=cue['cueName'],headerBytes=length,loopChunkPresent=loop>=0,rawAcbLoopFlag=cue['waveform']['LoopFlag'],hcaSha256=hashlib.sha256(b).hexdigest())
  if loop>=0:item['loopChunkHex']=header[loop:loop+16].hex()
  report['waves'].append(item)
 (out/'minato3mntspl1-semantics.json').write_text(json.dumps(report,separators=(',',':'))+'\n')
 print(json.dumps(dict(stopEvents=sum(r['stopSourceSeconds'] is not None for r in report['events']),voiceEvents=sum(r['dispatch']==4 for r in report['events']),fadeEvents=sum((r['fadeSeconds'] or 0)>0 for r in report['events']),physicalLoopChunks=sum(r['loopChunkPresent'] for r in report['waves']))))
if __name__=='__main__':main()
