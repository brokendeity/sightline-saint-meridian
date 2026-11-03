"""Isolated whip-cast candidate; keeps the cartridge and Fusion V6 rollbacks intact."""
from pathlib import Path
import re
R=Path(__file__).resolve().parents[1]
s=(R/'SIGHTLINE_BACKSPOOL_CARTRIDGE.html').read_text()
def change(old,new):
 global s
 assert s.count(old)==1,(old[:100],s.count(old))
 s=s.replace(old,new,1)
start=s.index('/* Authored cartridge timeline;');end=s.index('})(typeof window',start);end=s.index(';',end)+1
s=s[:start]+(R/'scripts/game_whip_cartridge_deployment.js').read_text()+s[end:]
change('const threadrailGame=(()=>{',(R/'scripts/game_threadrail_whip.js').read_text()+'\nconst threadrailGame=(()=>{')
change(' const mastery=createRailMastery();',' const whipCast=createThreadrailWhip(THREE,()=>model);\n const mastery=createRailMastery();')
start=s.index(' function applyCartridgePose(){');end=s.index(' const pendingDevice=',start)
s=s[:start]+s[end:]
change("const deploy=createCartridgeDeployment({valid:validAnchor,hand:index=>{if(pendingAnchor)index=1;", "const deploy=createCartridgeDeployment({valid:validAnchor,gesture:index=>whipCast.gesture(index),handIndex:index=>pendingAnchor?1:index,hand:index=>{")
change("const index=pendingAnchor?1:shot.index,pair=index?'B':'A';", "const index=shot.handIndex,pair=index?'B':'A';")
change("if(dep.clock<shot.releaseAt-.16)continue;", "if(dep.clock<shot.gestureAt)continue;")
change("function lifecycle(why){cartridgeVisuals.reset();", "function lifecycle(why){whipCast.reset();cartridgeVisuals.reset();")
change('beginFrame:()=>{restoreSurfPose();', 'beginFrame:()=>{whipCast.restore();restoreSurfPose();')
change("deploy.cancel('COMBAT INTERRUPT');deploy.update(dt);drawProjectiles();", "deploy.cancel('COMBAT INTERRUPT');")
change('applySurfPose(dt);applyCartridgePose();', "applySurfPose(dt);if(backspoolCombat.staggered()||backspoolCombat.activeAction()||backspoolPowers.isRetracing()||backspoolPreviewActive()||[P.IMPACT,P.UNCONTROLLED].includes(s.mode))deploy.cancel('CAST INTERRUPTED');whipCast.apply(deploy.state(),Math.min(dt,.05));deploy.update(dt);drawProjectiles();")
change('cartridgeAsset:cartridgeVisuals.state(),snapback:', 'cartridgeAsset:cartridgeVisuals.state(),whipCast:whipCast.state(),snapback:')
change("function quickRail(){if(!movementReady())", "function quickRail(){if(!whipCast.isReady()){say('SOURCE CAST LOADING');return false;}if(!movementReady())")
change("function precisionStart(){", "function precisionStart(){if(!whipCast.isReady()){say('SOURCE CAST LOADING');return false;}")
# The inherited combat panel hides touchButtons for Backspool; keep the throw reachable there.
change('function present(){drawCartridgeAssets();', "function present(){const touchHost=document.body.classList.contains('touchPlay')?$('backspoolCombatHUD')?.querySelector('.combatTouch'):$('touchButtons');if(touchHost&&$('tThreadrail').parentNode!==touchHost)touchHost.append($('tThreadrail'));drawCartridgeAssets();")
change("if(up)b.onpointerup=b.onpointercancel=up;$('touchButtons').append(b);", "if(up){b.onpointerup=up;b.onpointercancel=b.onlostpointercapture=()=>{precisionAt=null;aimMarker.visible=false;};}$('touchButtons').append(b);")
change("if(document.body.classList.contains('touchPlay'))for(const id of ['tAfterstep','tThreadrail','tDriveModes'])", "if(document.body.classList.contains('touchPlay'))for(const id of ['tAfterstep','tDriveModes'])")
change('</head>', '<style>body.touchPlay #tThreadrail{min-height:44px;touch-action:none}</style></head>')
change('<title>Tripo Cartridge — ', '<title>Forspoken Whip Cast — ')
(R/'SIGHTLINE_BACKSPOOL_WHIP_THROW.html').write_text(s)
print('Built SIGHTLINE_BACKSPOOL_WHIP_THROW.html')
