"""Build evidence-aware collection; raw source tables are never a fidelity claim."""
import ctypes,gzip,hashlib,json,re,struct,sys,tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'assets/nsunsc-library'
STATUSES=['indexed','recovered','reconstructed','awaiting reference','verification failed','verified']
def ptr(raw,o):
    offset=o+struct.unpack_from('<q',raw,o)[0]
    if not 0<=offset<len(raw): return None
    end=raw.find(b'\0',offset)
    if end<0:return None
    try:return raw[offset:end].decode('utf-8')
    except UnicodeDecodeError:return None

def fixed_rows(raw,stride):
    if len(raw)<20 or struct.unpack_from('>I',raw)[0]!=len(raw)-4:raise ValueError('length mismatch')
    version,count=struct.unpack_from('<II',raw,4)
    if version not in (1000,1001) or 20+stride*count>len(raw):raise ValueError('unsupported table layout')
    return [(i,20+i*stride,raw[20+i*stride:20+(i+1)*stride]) for i in range(count)]

def read_source(member):
    from extract_naruto_animation_probe import OUT,ROOT as GAME
    members=json.loads((OUT.parent/'cpk-members.json').read_text())
    matches=[r for r in members if r['path']==member]
    if len(matches)!=1:raise ValueError('ambiguous/missing archive member '+member)
    row=matches[0]
    with (GAME/row['archive']).open('rb') as f:f.seek(row['offset']);stored=f.read(row['stored_bytes'])
    lib=ctypes.CDLL(str(OUT.parent/'full-library/decode.dylib'))
    lib.decode_nsunsc.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_void_p,ctypes.c_size_t,ctypes.POINTER(ctypes.c_size_t)]
    buffer=ctypes.create_string_buffer(row['unpacked_bytes']);size=ctypes.c_size_t()
    if lib.decode_nsunsc(stored,len(stored),buffer,len(buffer),ctypes.byref(size)) or size.value!=row['unpacked_bytes']:raise ValueError('archive decode failed')
    decoded=buffer.raw[:size.value]
    sys.path.insert(0,str(OUT/'Blender-XFBIN-Importer/xfbin_lib'))
    from xfbin import read_xfbin
    with tempfile.NamedTemporaryFile() as f:
        f.write(decoded);f.flush();xf=read_xfbin(f.name)
    chunks=[c for page in xf.pages for c in page.chunks if type(c).__name__=='NuccChunkBinary']
    if len(chunks)!=1:raise ValueError('expected one table payload')
    raw=bytes(chunks[0].data)
    return raw,dict(**row,decodedSha256=hashlib.sha256(decoded).hexdigest(),payloadSha256=hashlib.sha256(raw).hexdigest(),evidence='static archive payload')

def component(status='indexed',evidence=None,blockers=None):return dict(status=status,evidence=evidence or [],blockers=blockers or [])
def main():
    catalog=json.loads((ROOT/'assets/motion-library/catalog.json').read_text())
    names=json.loads((DEST/'character-names.json').read_text())['characters']
    sources={};raws={}
    for name in ['playerSettingParam.bin','characode.bin','spSkillCustomizeParam','pairSpSkillCombinationParam']:
        raws[name],sources[name]=read_source('data/spc/'+name+'.xfbin')
    from extract_naruto_animation_probe import ROOT as GAME
    executableSha256=hashlib.file_digest((GAME/'NSUNSC.exe').open('rb'),'sha256').hexdigest()
    settings=[];by_id={}
    for i,o,row in fixed_rows(raws['playerSettingParam.bin'],64):
        b=raws['playerSettingParam.bin'];code=ptr(b,o+16)
        item=dict(row=i,playerSettingId=struct.unpack_from('<I',row)[0],code=code,baseMessage=ptr(b,o+32),variantMessage=ptr(b,o+40),rawU32=list(struct.unpack('<16I',row)),rawHex=row.hex())
        settings.append(item);by_id[item['playerSettingId']]=item
    chars={}
    raw=raws['characode.bin']
    if struct.unpack_from('>I',raw)[0]!=len(raw)-4 or (len(raw)-8)%8:raise ValueError('characode layout')
    for i in range((len(raw)-8)//8):
        code=raw[8+i*8:16+i*8].split(b'\0')[0].decode('ascii');chars[code]=dict(id=code,name=(names.get(code) or [{}])[0].get('name',code),variants=[],sequenceIds=[],status='indexed',blockers=['Playable/form classification requires source selection/availability rules.','No matched original footage.'],characodeIndex=i,provenance=[dict(table='characode.bin',row=i)])
    code_by_player_id={c['characodeIndex']+1:c['id'] for c in chars.values()}
    for row in settings:
        code=row['code'] or '';family=code_by_player_id.get(row['rawU32'][1],code[:4])
        row['sourcePlayerId']=row['rawU32'][1]
        row['rosterCode']=family
        if family not in chars:continue
        named=next((n for n in names.get(family,[]) if n['code']==code),{})
        chars[family]['variants'].append(dict(**row,name=named.get('name'),classification='source player-setting variant; form/costume distinction unresolved',provenance=dict(table='playerSettingParam.bin',row=row['row'])))
    skills=[]
    b=raws['spSkillCustomizeParam']
    for i,o,row in fixed_rows(b,112):
        skills.append(dict(id='special-setting:'+str(i),row=i,messageId=ptr(b,o+48),selectorId=struct.unpack_from('<I',row)[0],messageOptions=[dict(slot=k,messageId=ptr(b,o+48+k*16),rawValue=struct.unpack_from('<I',row,56+k*16)[0]) for k in range(4)],evidence=['Ghidra140701f70: stride112; selector key at+0; four relative string/value options at+48+16*k'],rawU32=list(struct.unpack('<28I',row)),rawHex=row.hex(),characterIds=[],mappingStatus='unresolved: source selector linkage required'))
    teams=[]
    b=raws['pairSpSkillCombinationParam']
    for i,o,row in fixed_rows(b,112):
        player_ids=[n for n in struct.unpack('<28I',row)[8:] if n]
        candidates=sorted({code_by_player_id[n] for n in player_ids if n in code_by_player_id})
        teams.append(dict(id='team-setting:'+str(i),row=i,messageId=ptr(b,o),rawU32=list(struct.unpack('<28I',row)),rawHex=row.hex(),characterIds=candidates,eligiblePlayerIds=player_ids,requiredParticipantCount=struct.unpack_from('<I',row,0x14)[0],participantRule='Every selected nonzero PLAYER_ID must occur in the eligible pool; count must match. Costume/form exclusions also apply.',mappingStatus='eligible PLAYER_ID pool recovered; not an ordered fixed team',evidence=['Ghidra 14066e4f0: source112byte rows copied unchanged to runtime120byte rows','Ghidra 14066f2d0: runtime+0x20..0x6c returned as PLAYER_ID vector','Ghidra 14066f730: count+0x14 and eligible-player pool membership','characode one-based identity corroborated by playerSettingParam numeric field+4; aliases retained']))
    audit=json.loads((DEST/'cinematic-audit.json').read_text())
    seqs=[]
    for r in audit['routes']:
        stem=r['name'][:-4];family=stem[:4];sid='original:'+stem;ids=[family] if family in chars else []
        components={k:component(blockers=['Original behavior not reconstructed.']) for k in ['execution','camera','particles','shaders','soundBank','synchronization','weapons','morphs']}
        components['animation']=component('recovered',[dict(bundle=r['bundle'],timeline=r['name'],clipId=r['id'])],['Original animation dispatch/branch mapping unresolved.'])
        components['camera']=component('recovered' if r['audit']['cameras'] else 'indexed',[dict(cameraEntries=r['audit']['cameras'])],['Parenting/composition and reference comparison unresolved.'])
        components['soundBank']=component(evidence=[dict(sourceCueCount=r['soundCueCount'])],blockers=['Cue timelines recovered; original bank mapping/playback unresolved.'])
        components['reference']=component(blockers=['Matched original-game footage unavailable.'])
        pilot_evidence=None
        if stem=='3mntspl1':
            evidence_url='assets/nsunsc-library/minato-original-evidence.json'
            audio_url='assets/nsunsc-library/original-audio/minato3mntspl1.json'
            wrapper_url='assets/nsunsc-library/minato-finisher-wrapper.json'
            pilot_evidence=json.loads((ROOT/evidence_url).read_text()) if (ROOT/evidence_url).exists() else None
            if pilot_evidence:
                components['execution']=component('recovered',[dict(url=evidence_url,scope=pilot_evidence['recoveredSubmachine']['scope'],submachine=pilot_evidence['recoveredSubmachine'])],['Generic cut-in submachine only; full combat entry, hit/miss/lethal/nonlethal triggers remain unresolved.'])
                components['animation']['evidence'].append(dict(url=evidence_url,attachmentMetadata='Decoded source coordinate/parent bindings; runtime composition remains unverified.'))
                components['weapons']=component('recovered',[dict(url=evidence_url,sourceResources=['3mntspl1_kni01'],scope='Weapon geometry/rig/attachment metadata recovered, not fully reconstructed original dispatch.')],['Runtime weapon spawn, visibility and effect composition remain unverified.'])
                components['camera']['evidence'].append(dict(url=wrapper_url,scope='Recovered finisher wrapper camera and coordinate binding; not verified composition.'))
            if (ROOT/audio_url).exists():
                audio=json.loads((ROOT/audio_url).read_text())
                components['soundBank']=component('recovered',[dict(url=audio_url,language=audio.get('language'),sourceEventCount=len(audio.get('events',[])),mappedEventCount=sum(e.get('status')=='mapped' for e in audio.get('events',[])),waveformCount=len(audio.get('cues',[])),mapping='Exact source cue/bank/waveform graph; original WAV and HCA retained.')],['Original mix/gain, loop, pitch and stop semantics remain unverified.','Supplied footage audio language and original mix comparison remain unverified.'])
        if stem=='3mntspl1':
            for name,component_name,scope in [('minato-transition-evidence.json','execution','Source scalar predicates integrated; actor-state graph incomplete.'),('minato-effect-runtime.json','particles','Bounded original animated-resource replay; sprite and force generators withheld.'),('minato-material-evidence.json','shaders','Exact NUP4 selector matches and 0x1f002 fragment/fog equations; runtime parameter bindings unresolved.')]:
                url='assets/nsunsc-library/'+name
                if (ROOT/url).exists():
                    components[component_name]['status']='recovered'
                    components[component_name]['evidence'].append(dict(url=url,scope=scope))
            for name, key, scope in [('minato-sprite-path.json','particles','Exact aura05 mesh/atlas resource and source emitter paths under investigation; full placement/render path remains unverified.'),('minato-victim-binding.json','animation','Reference-selected Madara inspection adapter; original opponent dispatch and secondary motion unverified.'),('minato-shader-bindings.json','shaders','Exact shader reflection contracts; source per-draw values and MRT composition unresolved.'),('minato-factory-attribution.json','execution','Character109 factory branches and table scan recovered; source mode26 meaning and callsite/later mutation checks remain open.')]:
                url='assets/nsunsc-library/'+name
                if (ROOT/url).exists():components[key]['evidence'].append(dict(url=url,scope=scope))
            review_url='assets/nsunsc-library/minato-reference-review.json'
            if (ROOT/review_url).exists():
                components['reference']=component('recovered',[dict(url=review_url,scope='User-supplied compilation sampled; three cut brackets align. Not complete-sequence certification.')],['Exact reference build/audio identity and complete sequence comparison remain unverified.'])
            action_url='assets/nsunsc-library/minato-action-dispatch.json'
            shader_url='assets/nsunsc-library/original-shaders/index.json'
            if (ROOT/action_url).exists():
                components['execution']['evidence'].append(dict(url=action_url,scope='Seven explicit action-to-timeline bindings, not a complete execution graph.'))
            if (ROOT/shader_url).exists():
                components['shaders']=component('recovered',[dict(url=shader_url,scope='Original installed DX11 bytecode and reflection.'),dict(url='assets/nsunsc-library/minato-material-evidence.json',scope='Exact selector matches; source equation translation with unresolved runtime bindings.'),dict(url='assets/nsunsc-library/minato-body-shader-equations.json',scope='Original 0xf00a/0x2f00a pixel equations translated; source input adapter and MRT pipeline unresolved.')],['Minato material selectors, browser translation and reference comparison remain unresolved.'])
            if (DEST/'minato-shader-bindings.json').exists():components['shaders']['evidence'].append(dict(url='assets/nsunsc-library/minato-shader-bindings.json',scope='Exact source reflection contracts; per-draw buffer values and MRT composition unresolved.'))
            if (DEST/'minato-light-override-trace.json').exists():components['shaders']['evidence'].append(dict(url='assets/nsunsc-library/minato-light-override-trace.json',scope='Source direction override to TLS state recovered; per-draw shader upload linkage unverified.'))
            camera_url='assets/nsunsc-library/minato-camera-evidence.json'
            semantics_url='assets/nsunsc-library/original-audio/minato3mntspl1-semantics.json'
            if (ROOT/camera_url).exists():
                camera_evidence=json.loads((ROOT/camera_url).read_text())
                components['camera']['evidence'].append(dict(url=camera_url,proven=camera_evidence['proven']))
                components['camera']['blockers']=camera_evidence['unresolved']
            if (ROOT/semantics_url).exists():
                semantics=json.loads((ROOT/semantics_url).read_text());events=semantics['events']
                components['soundBank']['evidence'].append(dict(url=semantics_url,sourceSfxAbsoluteStops=sum(e.get('stopSourceSeconds') is not None for e in events),voiceStopExclusions=sum(e.get('dispatch')==4 for e in events),scope='Nominal source stop scheduling recovered; original runtime clock adaptation unverified.'))
                components['soundBank']['blockers']=['Original gain/mix, pitch, fade shape, voice manager and per-update runtime clock adaptation remain unverified.','Supplied footage audio language and original mix comparison remain unverified.']
        seqs.append(dict(id=sid,name=stem,kind='ultimate candidate',characterIds=ids,sourceClipId=r['id'],sourceBundle=r['bundle'],sourceBuildSha256=executableSha256,sourceTimelines=r['sourceTimelines'],components=components,branches=[],execution=dict(recovered=False,entryState=None,states=[],recoveredSubmachine=pilot_evidence.get('recoveredSubmachine') if pilot_evidence else None,blockers=['Original triggers, transitions and branch rules unresolved; no suffix-based execution allowed.']),provenance=[dict(sourcePath=r['sourcePath'],decodedSceneSha256=r['decodedSceneSha256'],evidence='decoded timeline; cinematic classification inferred from naming, not confirmed dispatch')],status='recovered',blockers=['Original entry-point mapping unresolved.','Original execution/render/audio incomplete.','Supplied footage sampled; exact build/audio and full comparison unverified.' if stem=='3mntspl1' else 'Matched original-game footage unavailable.'],queueState='active pilot' if stem=='3mntspl1' else 'pending pilot acceptance'))
        for cid in ids:chars[cid]['sequenceIds'].append(sid)
    clips=[c for c in catalog['clips'] if c.get('nativeBundle')]
    classified={r['sourceClipId'] for r in seqs};unclassified=[dict(id=c['id'],name=c.get('sourceAnimation'),bundle=c['nativeBundle']) for c in clips if c['id'] not in classified and re.search(r'(spl|jyu|ult|union|awake)',c.get('sourceAnimation') or '',re.I)]
    manifest=dict(version=1,sourceBuild=dict(executableSha256=executableSha256,identity='Installed archive set; exact executable/build/DLC availability not yet certified',sources=sources),characters=sorted(chars.values(),key=lambda c:c['id']),sequences=sorted(seqs,key=lambda s:s['id']),sourceTables=dict(playerSettings=settings,specialSettings=skills,teamSettings=teams),queue=dict(pilotSequenceId='original:3mntspl1',activeCharacterId='3mnt',order=['3mnt']+[c for c in sorted(chars) if c!='3mnt'],advanceGate='Pilot and complete active-character checklist must be reference-verified.'),stats=dict(sourceCharacterCodes=len(chars),playerSettingRows=len(settings),specialSettingRows=len(skills),teamSettingRows=len(teams),candidateSequences=len(seqs),unclassifiedTimelineFragments=len(unclassified),verifiedSequences=0,verifiedCharacters=0,authoritativePlayableRosterComplete=False,authoritativeCinematicDenominatorComplete=False),unclassified=unclassified,allowedStatuses=STATUSES,limits=['Source character codes include forms, helpers and non-playable actors; not a playable roster count.','Cinematic candidates are discovered timelines, not an authoritative move denominator.','Team eligible PLAYER_ID pools recovered; exact combinations, costume exclusions and cinematic dispatch links remain unresolved. Special selector links remain unresolved.','Costume, DLC, awakening and opponent/kill branches remain unclassified.','No sequence or character is verified without matched original footage.'])
    (DEST/'cinematic-collection.json').write_text(json.dumps(manifest,indent=2))
    report=ROOT/'output/motion-library/CINEMATIC_COLLECTION_INVENTORY.md'
    report.write_text('# Original cinematic collection inventory\n\n'+json.dumps(manifest['stats'],indent=2)+'\n\n'+'\n'.join('- '+x for x in manifest['limits'])+'\n\nMinato original:3mntspl1 is the active pilot. Original state execution is fail-closed until source transitions are recovered. No queue completion is inferred from archive availability.\n')
    print(json.dumps(manifest['stats']))
if __name__=='__main__':main()
