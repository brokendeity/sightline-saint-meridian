from pathlib import Path
import json,gzip,math,hashlib
root=Path(__file__).resolve().parents[1];assets=root/'assets/backspool'
manifest=json.loads((assets/'action-v2-manifest.json').read_text());pack=json.loads(gzip.decompress((assets/'action-v2-gameplay.json.gz').read_bytes()));moves=manifest['moves'];checks=[]
def check(name,passed):checks.append(dict(name=name,pass_=bool(passed)))
check('36 distinct attacks and12 defensive segments',len(moves)==36 and len(pack)==48 and len({m['id'] for m in moves})==36)
check('Four verified families in each state',all(len({m['sourceFamily'] for m in moves if m['state']==s})>=4 for s in manifest['states']))
check('Six additional source families admitted',{'2kks','2ssk','2skr','2tnd','2hnt','2itc'}<={m['sourceFamily'] for m in moves})
check('Per-segment playback bounded .85–1.5',all(.8499<=e['provenance']['playbackRate']<=1.5001 for e in pack))
check('All imported bone scale channels are unit scale',all(all(abs(v-1)<1e-6 for v in t['values']) for e in pack for t in e['clip']['tracks'] if t['name'].endswith('.scale')))
check('Every shipped track is finite and ordered',all(all(math.isfinite(v) for v in t['values']) and all(b>a for a,b in zip(t['times'],t['times'][1:])) for e in pack for t in e['clip']['tracks']))
check('All shipped quaternions normalized',all(abs(sum(v*v for v in t['values'][i:i+4])-1)<2e-5 for e in pack for t in e['clip']['tracks'] if t['name'].endswith('.quaternion') for i in range(0,len(t['values']),4)))
check('Every move has source,contact,chain,cancel,movement and support policy',all(m.get('provenance') and m.get('timingMap') and m['contact'] and m['chainAt']>=m['contact'][-1]['time']+.05 and m['cancelAt']>=m['contact'][-1]['time']+.05 and m.get('movement') and m.get('support') for m in moves))
budgets={'flow':(.25,.36,.07,.11),'impact':(.38,.52,.12,.18),'counter':(.30,.42,.09,.14)}
check('Light strikes meet state-specific timing budgets',all(budgets[m['state']][0]<=m['duration']<=budgets[m['state']][1] and budgets[m['state']][2]<=m['contact'][0]['time']<=budgets[m['state']][3] for m in moves if m['kind']=='light'))
check('Heavy and launcher contact fits authored budget',all(.5<=m['duration']<=.85 and .18<=m['contact'][0]['time']<=.28 for m in moves if m['kind']=='heavy'))
skin=json.loads((root/'output/rea-naruto/animation-pass/action-v2/skin-validation.json').read_text())
check('480Hz full skin samples stay above authored support',all(e['min']>=-2e-5 for e in skin if '-air-' not in e['id']))
fidelity=json.loads((root/'output/rea-naruto/animation-pass/action-v2/fidelity-validation.json').read_text())
check('Jacket edge95th percentile below admitted1.55envelope',all(e['p95']<=1.55 for e in fidelity if e['id'].startswith('action-v2-')))
result={'checks':[{'name':c['name'],'pass':c['pass_']} for c in checks],'passed':sum(c['pass_'] for c in checks),'total':len(checks),'samples':sum(len(e['samples']) for e in skin),'vertices':56190,'assetHashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in assets.glob('action-v2-*')}}
(root/'output/action-v2/asset-validation.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ['passed','total','samples']},indent=2));print([c['name'] for c in result['checks'] if not c['pass']])
