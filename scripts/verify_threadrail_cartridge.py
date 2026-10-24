from pathlib import Path
import json,struct,hashlib,math
D=Path(__file__).resolve().parents[1]/'assets/backspool/threadrail-cartridge';records=[]
for relative in ['source/model.glb','backspool_threadrail_cartridge_master.glb','backspool_threadrail_cartridge_game.glb']:
 p=D/relative;b=p.read_bytes();assert struct.unpack_from('<III',b,0)==(0x46546c67,2,len(b));n,kind=struct.unpack_from('<II',b,12);assert kind==0x4e4f534a;g=json.loads(b[20:20+n]);assert g['asset']['version']=='2.0';names=[o.get('name') for o in g['nodes']];triangles=sum(g['accessors'][p['indices']]['count']//3 for m in g['meshes'] for p in m['primitives']);assert 5000<=triangles<=15000
 for a in g['accessors']:
  for field in ['min','max']:assert all(math.isfinite(v) for v in a.get(field,[]))
 if relative!='source/model.glb':
  for required in ['ThreadrailCartridge_Root','Disc_MainBody','Spool_Core','Housing_Lower','ThreadExit','DockingMount','DockingClip','A_Label','B_Label']:assert required in names,required
  assert sum(n is not None and n.startswith('AnchorFin_') for n in names)==4
  assert sum(n is not None and n.startswith('LockingJaw_') for n in names)==4
  for node in g['nodes']:
   if str(node.get('name','')).startswith('AnchorFin_'):assert len(node['extras']['deployOffset'])==3
 records.append({'path':relative,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'triangles':triangles,'nodes':len(names),'materials':len(g['materials'])})
p=D/'manifest.json';m=json.loads(p.read_text());m['files']=records;m['authoredChanges']+=[] if 'detachable belt clips' in m['authoredChanges'] else ['detachable belt clips'];p.write_text(json.dumps(m,indent=2)+'\n')
p=D/'preflight.json';m=json.loads(p.read_text());m['status']='completed-see-manifest';p.write_text(json.dumps(m,indent=2)+'\n')
p=D/'states.json';m=json.loads(p.read_text());m['coreEmissiveIntensity']={'folded':.3,'flight':1.4,'anchored':1};p.write_text(json.dumps(m,indent=2)+'\n');print(json.dumps(records,indent=2))
