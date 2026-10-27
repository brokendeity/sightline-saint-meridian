"""Bind the bounded camera milestone to its actual source, renders and tests."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
build=read(D/'V02_Views_Build.json');native=read(D/'V02_Views_Native.json');hud=read(D/'V02_Views_HUD.json');author=read(D/'V02_Views_Authoring.json');blender=read(D/'V02_Views_Blender.json');base=read(D/'V02_Coffered_Evidence.json')
assert build['entrySHA256']==sha(R/build['entry'])==native['entrySHA256']==hud['hashes'][build['entry']]
assert native['status'].startswith('PASS')and hud['status'].startswith('PASS')and blender['status'].startswith('PASS')and not native['errors']and not hud['errors']
assert blender['nativeReportSHA256']==sha(D/'V02_Views_Native.json')
assert author['masterSHA256']==sha(R/author['master'])==blender['masterSHA256']
assert author['sourceMasterSHA256']==sha(R/author['sourceMaster'])==base['masterSHA256']
assert build['contractSHA256']==author['contractSHA256']==native['contractSHA256']==blender['contractSHA256']==sha(R/'assets/city/vertical-v02/reference_views.json')
assert build['scriptSHA256']==native['scriptSHA256']==sha(R/'scripts/game_vertical_views_v02.js');assert build['cssSHA256']==native['cssSHA256']==sha(R/'scripts/game_vertical_views_v02.css')
inverse=(R/build['entry']).read_text()
for old,new in reversed(build['patches']):assert inverse.count(new)==1;inverse=inverse.replace(new,old,1)
assert inverse.encode()==(R/build['source']).read_bytes()
protected={**base['protectedEntries'],base['entry']:base['entrySHA256']}
for file,digest in protected.items():assert sha(R/file)==digest,file
assert sha(R/base['manifest'])==base['manifestSHA256']
for c in native['captures']+blender['captures']:assert sha(D/c['file'])==c['sha256']
stock=D/'evidence/stock-transit-views';assert sorted(p.name for p in stock.iterdir())==['shot-0.png','state-0.json'];state=read(stock/'state-0.json');assert state['ready']and state['active']and state['actionWorld']['hero']=='backspool'and state['visuals']['buildings']['buildings']==310
files=['V02_Views_Build.json','V02_Views_Native.json','V02_Views_HUD.json','V02_Views_Authoring.json','V02_Views_Blender.json','V02_Coffered_Evidence.json','V02_Reference_Views.json']
result={'status':'PASS bounded paused city-view milestone; full V02 remains INCOMPLETE','entry':build['entry'],'entrySHA256':sha(R/build['entry']),'master':author['master'],'masterSHA256':author['masterSHA256'],'evidence':{f:sha(D/f)for f in files},'protectedEntries':protected,'unchangedRuntimeManifest':{'file':base['manifest'],'sha256':base['manifestSHA256']},'sourceInverseExact':True,'unchangedBlenderSourceObjects':author['unchangedSourceObjects'],'addedCameras':2,'nativeGroups':len(native['results']),'retainedHUDGroups':len(hud['results']),'maximumProjectionErrorPixels':max(c['maximumLandmarkProjectionErrorPixels']for c in blender['captures']),'stock':{p.name:sha(p)for p in stock.iterdir()},'stockScope':'Short installed-client smoke; canvas-only capture, not motion-route or sustained-performance acceptance. Actual stock state retains CPU cost and dropped-time observations.','visualReview':{'browserAndBlenderImagesOpened':True,'portraitAndLandscapeOpened':True,'trainReadableInOverlook':True,'fullReferenceQuality':'FAIL / unfinished','remaining':['Plain repetitive tower faces still dominate; refine architectural bays and silhouettes around preserved source geometry.','Large central support mass limits the canyon composition.','Native cyan/warm material response and Blender response differ visibly.','Deep skyline layering, warm balconies and useful facade variety do not yet match approved art.','Lower view shows layered infrastructure but the train itself remains occluded.','Inspection bookmarks are free cameras, not proof of player access or a completed traversal route.']},'knownRemaining':base['knownRemaining'],'fullGoalComplete':False}
(D/'V02_Views_Evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
