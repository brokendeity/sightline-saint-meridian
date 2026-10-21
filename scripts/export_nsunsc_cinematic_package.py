"""Deterministic, dependency-aware recovery ZIP. Never claims verified playback."""
import argparse,gzip,hashlib,json,zipfile
from pathlib import Path,PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
def safe_path(root,relative):
    if not isinstance(relative,str) or '\\' in relative or '\x00' in relative:raise ValueError('invalid asset path')
    p=PurePosixPath(relative)
    if p.is_absolute() or '..' in p.parts or not p.parts:raise ValueError('unsafe asset path: '+relative)
    result=(root/relative).resolve()
    if not result.is_relative_to(root.resolve()):raise ValueError('asset outside workspace')
    return result

def read(path):
    return json.loads(gzip.decompress(path.read_bytes()) if path.suffix=='.gz' else path.read_text())
def asset_urls(value):
    if isinstance(value,str) and value.startswith(('assets/','output/rea-naruto/ghidra/')):yield value
    elif isinstance(value,dict):
        for v in value.values():yield from asset_urls(v)
    elif isinstance(value,list):
        for v in value:yield from asset_urls(v)
def remix_validate(remix,sequence,build):
    parent=remix.get('originalSequenceId',remix.get('parentSequenceId',remix.get('sourceSequenceId')))
    if parent!=sequence:raise ValueError('remix parent sequence mismatch')
    if remix.get('sourceBuildSha256')!=build:raise ValueError('remix source build mismatch')
    return remix

def collect(root,sequence_id,remix=None):
    root=Path(root).resolve()
    collection=read(root/'assets/nsunsc-library/cinematic-collection.json');catalog=read(root/'assets/motion-library/catalog.json')
    seq=next((s for s in collection['sequences'] if s['id']==sequence_id),None)
    if seq is None:raise ValueError('unknown sequence')
    build=seq['sourceBuildSha256']
    if remix is not None:
        remix_validate(remix,sequence_id,build)
        def check_paths(value):
            if isinstance(value,dict):
                for key,v in value.items():
                    if isinstance(v,str) and (key.lower().endswith(('url','path')) or v.startswith(('assets/','/','../'))):safe_path(root,v)
                    check_paths(v)
            elif isinstance(value,list):
                for v in value:check_paths(v)
        check_paths(remix)
    files=set();pending=[];missing=set();scenes=set()
    def add(url):
        p=safe_path(root,url)
        if not p.is_file():missing.add(url);return
        if url not in files:files.add(url);pending.append(url)
    def scene(url):
        if url in scenes:return
        scenes.add(url);add(url)
        directory=safe_path(root,url).parent
        # Decoded sidecars and raw payloads are part of the source bundle.
        if directory.is_dir():
            for p in sorted(directory.iterdir()):
                if p.is_file():add(p.relative_to(root).as_posix())
    scene(catalog['nativeBundles'][seq['sourceBundle']]['scene'])
    if remix is not None:
        for url in asset_urls(remix):add(url)
    for helper in ['cinematic_source_billboard.js','minato_victim_adapter.js','cinematic_collection_core.js','cinematic_source_audio.js','cinematic_source_effects.js','cinematic_source_materials.js','minato_transition_runtime.js','minato_phase_player.js','source_minato_camera.js','motion_camera_tracks.js','motion_attachment_bindings.js','cinematic_native_viewer.js','motion_sequence_tracks.js']:
        add('scripts/'+helper)
    add('assets/motion-library/engine.js')
    stem=seq['name']
    for name in ['minato-sprite-path.json','minato-light-override-trace.json','minato-victim-binding.json','minato-shader-bindings.json','minato-factory-attribution.json','minato-reference-review.json','minato-source-shot-index.json','reference-candidates/youtube-aJ31C701uH8.json','minato-original-evidence.json','minato-finisher-wrapper.json','minato-camera-evidence.json','minato-action-dispatch.json','minato-transition-evidence.json','minato-effect-runtime.json','minato-material-evidence.json','minato-body-shader-equations.json','original-shaders/index.json'] if stem=='3mntspl1' else []:add('assets/nsunsc-library/'+name)
    if stem=='3mntspl1':add('output/cinematic-collection/minato-sprite-assembly.json')
    audio='assets/nsunsc-library/original-audio/'+('minato3mntspl1.json' if stem=='3mntspl1' else stem+'.json')
    if safe_path(root,audio).exists():
        add(audio)
        semantics=audio[:-5]+'-semantics.json'
        if safe_path(root,semantics).exists():add(semantics)
    else:missing.add(audio)
    sound_index=root/'assets/nsunsc-library/sound-events-index.json'
    if sound_index.exists():
        index=read(sound_index)
        for bundle in index.get('bundles',{}).values():
            if any(r.get('name','').startswith(stem) for r in bundle.get('records',[])):add(bundle['url'])
    cards=root/'assets/nsunsc-library/cutin-catalog.json'
    if cards.exists():
        for card in read(cards).get('items',[]):
            if card.get('resourceName','').startswith(stem+'_fin'):
                for url in asset_urls(card):add(url)
    # Resolve exact source resource paths and clump identities recursively.
    bundle_paths={b['path'].replace('\\','/').lower():b['scene'] for b in catalog['nativeBundles'].values()}
    while pending:
        url=pending.pop();p=safe_path(root,url)
        if url.endswith('.wav'):
            hca=url[:-4]+'.hca'
            if safe_path(root,hca).exists():add(hca)
        if not url.endswith(('.json','.json.gz')):continue
        data=read(p)
        for target in asset_urls(data):
            if target.endswith('/scene.json.gz'):scene(target)
            else:add(target)
        if url.endswith('/scene.json.gz'):
            for anim in data.get('animations',[]):
                for clump in anim.get('clumps',[]):
                    for name in [clump.get('name'),clump.get('reference')]:
                        dep=catalog.get('nativeRigs',{}).get(name)
                        if dep:scene(dep)
            for ref in data.get('references',[]):
                target=ref.get('path','').replace('\\','/').lower()
                dep=bundle_paths.get(target)
                if dep:scene(dep)
                elif target.endswith('.xfbin') and not ref.get('hasData'):missing.add('unresolved source reference: '+target)
    manifest=dict(schemaVersion=1,kind='original recovery package',sequenceId=sequence_id,sourceBuildSha256=build,sequence=seq,verified=False,originalPlaybackComplete=False,dependencyScenes=sorted(scenes),missingDependencies=sorted(missing),unresolvedRuntime=[dict(component=k,status=v.get('status'),blockers=v.get('blockers',[])) for k,v in seq.get('components',{}).items() if v.get('status')!='verified'],requirements=['Serve extracted relative paths over HTTP. Load assets/motion-library/engine.js (bundled THREE), then motion_sequence_tracks, motion_camera_tracks, motion_attachment_bindings, source_minato_camera, cinematic_native_viewer, cinematic_collection_core and cinematic_source_audio helpers. Consumer supplies scene/camera/load and catalog mappings; no complete original player is claimed.','Archive contains recovered assets and unresolved original behavior; not a standalone verified cinematic.'],entries=[])
    return manifest,sorted(files)

def export(root,sequence_id,destination,remix=None):
    manifest,files=collect(root,sequence_id,remix)
    destination=Path(destination);destination.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as archive:
        for url in files:
            p=safe_path(root,url);h=hashlib.sha256();size=0
            info=zipfile.ZipInfo(url,date_time=(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            with p.open('rb') as source,archive.open(info,'w',force_zip64=True) as target:
                while block:=source.read(1024*1024):h.update(block);size+=len(block);target.write(block)
            manifest['entries'].append(dict(path=url,bytes=size,sha256=h.hexdigest()))
        if remix is not None:
            payload=json.dumps(remix,sort_keys=True,indent=2).encode()
            archive.writestr(zipfile.ZipInfo('remix.json',date_time=(1980,1,1,0,0,0)),payload)
            manifest['entries'].append(dict(path='remix.json',bytes=len(payload),sha256=hashlib.sha256(payload).hexdigest()))
        archive.writestr(zipfile.ZipInfo('package-manifest.json',date_time=(1980,1,1,0,0,0)),json.dumps(manifest,sort_keys=True,indent=2))
    return manifest

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--sequence',required=True);parser.add_argument('--destination',required=True);parser.add_argument('--remix');args=parser.parse_args()
    destination=safe_path(ROOT,args.destination);remix=read(Path(args.remix)) if args.remix else None
    manifest=export(ROOT,args.sequence,destination,remix)
    package=dict(url=destination.relative_to(ROOT).as_posix(),sha256=hashlib.file_digest(destination.open('rb'),'sha256').hexdigest(),bytes=destination.stat().st_size,entryCount=len(manifest['entries']),dependencyScenes=len(manifest['dependencyScenes']),missingDependencies=manifest['missingDependencies'],unresolvedRuntime=manifest['unresolvedRuntime'],verified=False,status='recovered; original playback incomplete')
    index=ROOT/'output/cinematic-collection/package-index.json';old=read(index) if index.exists() else {'packages':{}};old['packages'][args.sequence]=package;index.write_text(json.dumps(old,indent=2));print(json.dumps({k:v for k,v in package.items() if k not in ['missingDependencies','unresolvedRuntime']}))
if __name__=='__main__':main()
