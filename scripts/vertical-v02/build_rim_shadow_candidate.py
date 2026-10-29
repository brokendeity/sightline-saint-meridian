from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'development/vertical-city-v02';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=R/'SIGHTLINE_SAINT_MERIDIAN_V02_PUBLIC_ROOM_LIFE.html';assert sha(source)=='d40e10c5d47b82ecd0eac30adc64e383566ce68cb0504635e256781a43c80300'
contract=R/'assets/city/vertical-v02/rim-shadow/contract.json';data=json.loads(contract.read_text());assert sha(R/data['master'])==data['masterSHA256']
script=R/'scripts/game_v02_rim_shadows.js';tag=f'<script src="scripts/game_v02_rim_shadows.js?v={sha(script)[:12]}&amp;contract={sha(contract)}"></script>\n'
entry=R/'SIGHTLINE_SAINT_MERIDIAN_V02_RIM_SHADOWS.html';text=source.read_text();assert text.count('</body>')==1
entry.write_text(text.replace('</body>',tag+'</body>'))
assert entry.read_text().replace(tag,'')==text
report={'status':'BUILT experimental source-light shadow child; acceptance pending','entry':str(entry.relative_to(R)),'entrySHA256':sha(entry),'source':str(source.relative_to(R)),'sourceSHA256':sha(source),'script':str(script.relative_to(R)),'scriptSHA256':sha(script),'contract':str(contract.relative_to(R)),'contractSHA256':sha(contract),'master':data['master'],'masterSHA256':data['masterSHA256']}
(D/'V02_Rim_Shadow_Build.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
