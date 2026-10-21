/* Native pose admission helper. Timing and visual contact anchoring are authored. */
(function(root){'use strict';
 function prepare(THREE,entries,manifest){
  const result=[];
  for(const spec of manifest.roles){const entry=entries.find(e=>e.id===spec.sourceId);if(!entry)throw Error('Traversal source missing: '+spec.sourceId);const source=THREE.AnimationClip.parse(entry.clip),duration=(spec.sourceEnd-spec.sourceStart)/spec.playbackRate;
   const tracks=source.tracks.map(original=>{const t=original.clone(),stride=t.getValueSize(),interpolant=original.createInterpolant(),times=[0,...Array.from(original.times).filter(x=>x>spec.sourceStart&&x<spec.sourceEnd).map(x=>(x-spec.sourceStart)/spec.playbackRate),duration],values=[];for(const time of times)values.push(...interpolant.evaluate(spec.sourceStart+time*spec.playbackRate));if(t.name==='mixamorigHips.position')for(let i=0;i<values.length;i+=stride)for(let k=0;k<3;k++)values[i+k]=original.values[k];t.times=new Float32Array(times);t.values=new Float32Array(values);return t;});
   const clip=new THREE.AnimationClip(spec.id,duration,tracks);result.push({...entry,id:spec.id,name:spec.role+' · traversal candidate',clip,traversalSpec:spec});
  }return result;
 }
 // One precomputed visual anchor, not a second world-ground query. Actor collision
 // path owns all world movement; this aligns its feet-origin to the deformed pose.
 function visualOffset(spec,time,actorClearance=.42){const samples=spec.visualAnchor;let a=samples[0],b=samples[samples.length-1];for(let i=1;i<samples.length;i++)if(time<=samples[i].time){a=samples[i-1];b=samples[i];break;}const t=Math.max(0,Math.min(1,(time-a.time)/Math.max(1e-9,b.time-a.time)));return -actorClearance-(a.minimumY+(b.minimumY-a.minimumY)*t);}
 root.BackspoolTraversalPose={prepare,visualOffset};if(typeof module!=='undefined')module.exports={prepare,visualOffset};
})(typeof window!=='undefined'?window:globalThis);
