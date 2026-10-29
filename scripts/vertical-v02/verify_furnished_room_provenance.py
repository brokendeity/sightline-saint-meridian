"""Name both furnishing/shipping parents and validate exact record preservation."""
from pathlib import Path
import json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02'
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
b=read(D/'V02_Furnished_Public_Rooms_Build.json');f=read(D/'V02_Furnished_Public_Rooms_Authoring.json')
original=read(R/f['sourceManifest']);source=read(R/f['manifest']);current=read(R/b['manifest']);n=len(original['records'])
assert current['records']==source['records'] and current['records'][:n]==original['records']
assert current['records'][n:]==f['newRecords'] and len(f['newRecords'])==9 and sum(r['solid']for r in f['newRecords'])==3
old={c['id']:c for c in original['chunks']};changed={r['id']for r in f['exports']}
assert all(c==old[c['id']]for c in current['chunks']if c['id']not in changed)
result={'status':'PASS explicit source/shipping record provenance; package terminology clarified','entrySHA256':b['entrySHA256'],
 'packageReportSHA256':sha(D/'V02_Furnished_Public_Lighting_Package.json'),
 'earlierShippingManifest':f['sourceManifest'],'earlierShippingManifestSHA256':sha(R/f['sourceManifest']),
 'furnishedSourceManifest':f['manifest'],'furnishedSourceManifestSHA256':sha(R/f['manifest']),
 'currentShippingManifest':b['manifest'],'currentShippingManifestSHA256':sha(R/b['manifest']),
 'preservedRecords':n,'appendedRecords':9,'newSolidRecords':3,'reusedChunks':len(current['chunks'])-len(changed),
 'verifierSHA256':sha(Path(__file__)),
 'interpretation':'recordsUnchanged is relative to furnished source records; parentManifestSHA256 refers to earlier flared shipping metadata. They are different parents.'}
(D/'V02_Furnished_Public_Rooms_Provenance.json').write_text(json.dumps(result,indent=2)+'\n');print(result['status'])
