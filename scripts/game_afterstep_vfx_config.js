/* Shared visual-only controls. The controller never reads these settings. */
(function(root){'use strict';
 const defaults={quality:'high',maxShards:96,shardCount:48,shardSize:1,shardOpacity:.25,shardSpeed:5.5,shardLifetime:.68,shardRotation:.7,violetBalance:.28,outlineBrightness:1.3,afterimageCount:3,afterimageOpacity:.22,afterimageSpacing:.85,afterimageFade:.55,outletBrightness:1.3,intensity:1,trailLength:7};
 const ranges={maxShards:[8,96],shardCount:[0,80],shardSize:[.2,2],shardOpacity:[0,.5],shardSpeed:[0,12],shardLifetime:[.1,1.2],shardRotation:[0,3],violetBalance:[0,1],outlineBrightness:[0,2.5],afterimageCount:[0,4],afterimageOpacity:[0,.5],afterimageSpacing:[.25,2.5],afterimageFade:[.1,.9],outletBrightness:[0,2.5],intensity:[0,1.8],trailLength:[1,12]};
 function settings(patch={},base=defaults){const out={...base};for(const key in ranges)if(Number.isFinite(patch[key]))out[key]=Math.max(ranges[key][0],Math.min(ranges[key][1],patch[key]));for(const key of ['maxShards','shardCount','afterimageCount'])out[key]=Math.round(out[key]);if(['low','medium','high'].includes(patch.quality))out.quality=patch.quality;return out;}
 root.AfterstepVfx={defaults:Object.freeze(defaults),settings};if(typeof module!=='undefined')module.exports=root.AfterstepVfx;
})(typeof window!=='undefined'?window:globalThis);
