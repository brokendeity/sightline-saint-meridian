"""Package the current Three.js game without changing gameplay or asset identities."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'SIGHTLINE_SAINT_MERIDIAN_TOON.html'
DEST=ROOT/'threejs-game'
def build():
    raw=SOURCE.read_bytes();html=raw.decode();files={};scripts=[]
    names=['vendor/three.js','vendor/fflate.js','vendor/FBXLoader.js','vendor/GLTFLoader.js','src/engine-check.js','src/game.js']
    def script(match):
        attrs,body=match.groups()
        if re.search(r'\bsrc\s*=',attrs):return match.group(0)
        name=names[len(scripts)];scripts.append(name);files[name]=body
        return '<script src="threejs-game/'+name+'"'+attrs+'></script>'
    html=re.sub(r'<script\b([^>]*)>([\s\S]*?)</script\s*>',script,html,flags=re.I)
    if len(scripts)!=6:raise ValueError('Source script structure changed; inspect before packaging')
    styles=[]
    def style(match):
        name=f'ui/game-{len(styles)+1}.css';styles.append(name);files[name]=match.group(1)
        return '<link rel="stylesheet" href="threejs-game/'+name+'">'
    html=re.sub(r'<style\b[^>]*>([\s\S]*?)</style\s*>',style,html,flags=re.I)
    # Asset URLs and existing relative loaders retain the original workspace root.
    html=html.replace('<head>','<head>\n<base href="../">',1)
    html=re.sub(r'<title>.*?</title>','<title>Sightline &amp; Backspool — Three.js</title>',html,count=1,flags=re.S)
    files['index.html']=html
    for name,body in files.items():
        path=DEST/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(body)
    manifest={'schemaVersion':1,'source':SOURCE.name,'sourceSha256':hashlib.sha256(raw).hexdigest(),'engine':'Three.js','engineRevision':re.search(r'const e="([0-9]+)"',files['vendor/three.js']).group(1),'entrypoint':'threejs-game/index.html','assetRoot':'../','scope':'Faithful external-file packaging of the existing Three.js runtime; no gameplay rewrite.','files':{name:{'sha256':hashlib.sha256((DEST/name).read_bytes()).hexdigest(),'bytes':(DEST/name).stat().st_size} for name in files}}
    (DEST/'build-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps({'entrypoint':manifest['entrypoint'],'engineRevision':manifest['engineRevision'],'files':len(files),'sourceSha256':manifest['sourceSha256']}))
if __name__=='__main__':build()
