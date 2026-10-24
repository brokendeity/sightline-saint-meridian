"""Separate V02 graybox using the exact latest gameplay; V1 remains unchanged."""
from pathlib import Path
import hashlib,json
R=Path(__file__).resolve().parents[2]
s=(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html').read_text();source_hash=hashlib.sha256(s.encode()).hexdigest()
old=(R/'scripts/game_vertical_city.js').read_text();assert s.count(old)==1,'V1 module/source mismatch'
# Preserve current real train/traffic as a provisional starting point, remove superseded V1 architecture.
v=old;a=v.index('function construct(){');b=v.index(' const points=',a);v=v[:a]+'function construct(){const L=layout;'+v[b:]
a=v.index(' for(const x of [62,104])');b=v.index(' for(const [j,y]of L.trafficBands.entries())',a);v=v[:a]+v[b:]
s=s.replace(old,v,1)
needle='function updatePlayer(dt,realDt=dt)';assert s.count(needle)==1;s=s.replace(needle,(R/'scripts/game_vertical_district_v02.js').read_text()+'\n'+needle,1)
old='verticalCity.build();}},100);';assert s.count(old)==1;s=s.replace(old,'verticalCity.build();verticalDistrict.build();}},100);')
old='if(!start)return buildingColliders.flatMap(c=>c.parts||[c]).concat(propColliders);';assert s.count(old)==1;s=s.replace(old,'if(!start)return buildingColliders.flatMap(c=>c.parts||[c]).concat(propColliders,window.verticalDistrict?.colliders()||[]);')
old='.concat(propColliders.filter(c=>c.box.intersectsBox(area)));';assert s.count(old)==1;s=s.replace(old,'.concat(propColliders.filter(c=>c.box.intersectsBox(area)),window.verticalDistrict?.colliders(start,end)||[]);')
old='return Math.max(h,window.backspoolFlow?.terrainHeight(x,z,currentY)??-Infinity)';assert s.count(old)==1;s=s.replace(old,'return Math.max(h,window.backspoolFlow?.terrainHeight(x,z,currentY)??-Infinity,window.verticalDistrict?.surfaceFeetAt(x,z,currentY)??-Infinity)')
# Only explicitly tagged new stair risers get ground step treatment; original colliders are unchanged.
old='for(const c of allColliders(start,end)){\n  const b=c.box;';assert s.count(old)==1;s=s.replace(old,'for(const c of allColliders(start,end)){\n  if(window.verticalDistrict?.stepRiserPass(start,c))continue;\n  const b=c.box;')
old='for(const c of allColliders(s.pos)){const b=c.box,lo=';assert s.count(old)==1;s=s.replace(old,'for(const c of allColliders(s.pos)){if(window.verticalDistrict?.stepRiserPass(s.pos,c))continue;const b=c.box,lo=')
# New grouped GLBs have immutable structural owners rather than one destructible
# mesh per collider. Honour that ownership in both impact mutation paths; keep
# decals, sound, debris and normal solid landing/collision responses active.
old='if(!c||c.prop||c.destroyed)return false;';assert s.count(old)==1;s=s.replace(old,'if(!c||c.prop||c.destroyed||c.nonDestructible||!c.mesh)return false;')
old='if(owner&&speed>=28&&!owner.destroyed)';assert s.count(old)==1;s=s.replace(old,'if(owner&&speed>=28&&!owner.destroyed&&!owner.nonDestructible)')
s=s.replace('<title>Forspoken Whip Cast — ', '<title>Saint Meridian V02 Graybox — ')
name='SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html';(R/name).write_text(s)
(R/'development/vertical-city-v02/V02_Graybox_Build.json').write_text(json.dumps({'entry':name,'sha256':hashlib.sha256(s.encode()).hexdigest(),'sourceEntry':'SIGHTLINE_BACKSPOOL_WHIP_THROW.html','sourceSHA256':source_hash,'scope':'V1 static vertical prototype replaced with Blender modular graybox only in candidate; actual train/scenic traffic retained provisionally. Original game and all older HTML untouched.','gate':'Input acceptance pending'},indent=2)+'\n')
print('Built',name)
