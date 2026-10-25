/* Isolate arc-length lookup accuracy from body size/clearance. No runtime edits. */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),O=path.join(R,'output/local-scratch/v02-transit-study');
const base=JSON.parse(fs.readFileSync(path.join(D,'V02_Transit_Turn_Study.json'))).best.proposal,rows=[];let best=null;
for(const divisions of [200,2048,8192])for(const spacing of [14,14.5,15,15.5,16]){
 const proposal={...base,id:base.id+'-arc'+divisions+'-s'+spacing,spacing,arcLengthDivisions:divisions},file=path.join(O,proposal.id+'.json');fs.writeFileSync(file,JSON.stringify(proposal,null,2)+'\n');
 const run=spawnSync(process.execPath,['scripts/vertical-v02/precheck_transit_envelopes.cjs',file],{cwd:R,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const detail=JSON.parse(fs.readFileSync(path.join(D,'V02_Transit_Route_Study.json'))),row={id:proposal.id,divisions,spacing,worldConflictOwners:detail.worldConflicts.length,convoyPairs:detail.convoyConflicts.length,convoyConflictSamples:detail.convoyConflicts.reduce((sum,r)=>sum+r.sampleCount,0),routeLength:detail.routeLength};
 row.score=row.worldConflictOwners*1e9+row.convoyConflictSamples*1e6+spacing*1e3+divisions*.001;rows.push(row);console.log(JSON.stringify(row));if(!best||row.score<best.row.score)best={row,proposal,detail};
}
const report={status:'DESIGN STUDY ONLY; native playback and transit acceptance pending',scope:'Same world-clear candidate curve and unchanged shipped body bounds; only arc-length sampling accuracy and carriage centre spacing vary. Zero sampled overlap is a proposal precheck, not continuous collision, mechanical coupling, passenger operation or final art acceptance.',rows,best};fs.writeFileSync(path.join(D,'V02_Transit_Turn_Refinement.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(D,'V02_Transit_Route_Study.json'),JSON.stringify(best.detail,null,2)+'\n');
