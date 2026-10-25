/* Bounded, offline phase2/4 design investigation, not a transit integration.
 * Keeps all buildings, approved public geometry and the current runtime fixed. */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),assert=require('assert/strict');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02'),O=path.join(R,'output/local-scratch/v02-transit-study');fs.mkdirSync(O,{recursive:true});const rows=[];let best=null;
for(const upper of [560,720])for(const radius of [12,16,20,24])for(const spacing of [14,15.5,16]){
 const lower=80,cx=83.5,points=[[80,100,180],[80,100,350],[80,100,430],[80,100,upper-90],[cx-radius,100,upper-30],[cx-radius,100,upper]];
 for(let i=1;i<=8;i++){const a=Math.PI*(1-i/8);points.push([cx+radius*Math.cos(a),100,upper+radius*Math.sin(a)]);}
 points.push([cx+radius,100,upper-30],[87,100,upper-90],[87,100,430],[87,100,350],[87,100,180],[87,100,145],[cx+radius,100,lower+30],[cx+radius,100,lower]);
 for(let i=1;i<=8;i++){const a=-Math.PI*i/8;points.push([cx+radius*Math.cos(a),100,lower+radius*Math.sin(a)]);}
 points.push([cx-radius,100,lower+30],[80,100,145]);
 // Remove repeated/longitudinally reversed transition points on the shorter
 // northern variant before sampling the native spline.
 const clean=points.filter((p,i)=>!i||Math.hypot(...p.map((v,k)=>v-points[i-1][k]))>.001);
 const id='u'+upper+'-r'+radius+'-s'+spacing,file=path.join(O,id+'.json'),proposal={id,closed:true,curveType:'centripetal',spacing,points:clean,scope:'Unimplemented route hypothesis. Current4bodyenvelopes; station mainstraight remainsX80/87. Source geometry/sample checks only.'};fs.writeFileSync(file,JSON.stringify(proposal,null,2)+'\n');
 const run=spawnSync(process.execPath,['scripts/vertical-v02/precheck_transit_envelopes.cjs',file],{cwd:R,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const detail=JSON.parse(fs.readFileSync(path.join(D,'V02_Transit_Route_Study.json'))),world=detail.worldConflicts,convoy=detail.convoyConflicts,score=world.length*1e6+convoy.reduce((sum,r)=>sum+r.sampleCount,0)*100+detail.routeLength;
 const row={id,radius,spacing,upper,routeLength:detail.routeLength,worldConflictOwners:world.length,worldConflictSamples:world.reduce((sum,r)=>sum+r.sampleCount,0),convoyPairs:convoy.length,convoyConflictSamples:convoy.reduce((sum,r)=>sum+r.sampleCount,0),score};rows.push(row);console.log(JSON.stringify(row));
 if(!best||score<best.row.score)best={row,proposal,detail};
}
const result={status:'DESIGN STUDY ONLY; no runtime or acceptance promotion',scope:'Twenty-four bounded candidate splines evaluated with the actual normalized front and shipped rear-car envelope against unchanged current geometry. Conservative <=.25mOBBs; native playback, coupling, track support, station behavior and continuous sweeps remain unverified.',rows,best};fs.writeFileSync(path.join(D,'V02_Transit_Turn_Study.json'),JSON.stringify(result,null,2)+'\n');
// Avoid leaving a random last candidate as the selected proposal.
fs.writeFileSync(path.join(D,'V02_Transit_Route_Study.json'),JSON.stringify(best.detail,null,2)+'\n');
