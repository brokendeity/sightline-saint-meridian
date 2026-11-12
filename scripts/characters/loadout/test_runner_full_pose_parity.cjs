/* Plain-node check of the full Runner conversion (assets/loadout/runner/full/) against the earlier, separately
   reviewed 56-clip conversion (assets/loadout/runner/loadout_runner_clips.json.gz, convert_runner_clips.cjs).
   For every clip both files hold unmirrored and without faceEnd, every bone rotation on every frame must agree
   within MAX_DEG degrees, and the strike frames of attacks must agree. This catches a pose that is turned or
   pitched as a whole (for example a root node left at its rest rotation).
   Also checks the index: 872 clips, 484 in-place + 388 root, every clip's pose present and sized.
   Usage: node scripts/characters/loadout/test_runner_full_pose_parity.cjs */
const fs=require('fs'),zlib=require('zlib'),path=require('path'),assert=require('assert/strict');
const MAX_DEG=1.0,DIR='assets/loadout/runner/full/';
const idx=JSON.parse(fs.readFileSync(DIR+'runner_full_index.json','utf8'));
const old=JSON.parse(zlib.gunzipSync(fs.readFileSync('assets/loadout/runner/loadout_runner_clips.json.gz')).toString());
const bins=Object.fromEntries(Object.keys(idx.files).map(f=>[f,zlib.gunzipSync(fs.readFileSync(DIR+f))]));
const report={counts:idx.counts,compared:[],worstDeg:0,failures:[]};
assert.equal(Object.keys(idx.clips).length,872);assert.equal(idx.counts.inPlace,484);assert.equal(idx.counts.root,388);
const B=idx.bones.length;
function pose(name){const e=idx.clips[name],pe=e.poseOf?idx.clips[e.poseOf]:e,buf=bins[pe.pose.file],o=pe.pose.offset;
 assert.equal(pe.pose.q16Bytes,pe.frames*B*8,name+' q16 size');assert.equal(pe.pose.hipsBytes,pe.frames*12,name+' hips size');
 const q=new Int16Array(buf.buffer.slice(buf.byteOffset+o,buf.byteOffset+o+pe.pose.q16Bytes));return{frames:pe.frames,q};}
for(const n of Object.keys(idx.clips))pose(n);
for(const [name,e] of Object.entries(old.clips)){
 if(e.mirror||e.faceEnd||!idx.clips[name])continue;
 const p=pose(name),tracks=e.clip.tracks.filter(t=>t.name.endsWith('.quaternion'));let worst=0;
 for(const t of tracks){const b=idx.bones.indexOf(t.name.replace('.quaternion',''));if(b<0)continue;
  const frames=Math.min(p.frames,t.times.length);
  for(let i=0;i<frames;i++){let dot=0,nn=0;for(let k=0;k<4;k++){const a=p.q[(i*B+b)*4+k]/32767;nn+=a*a;dot+=a*t.values[i*4+k];}dot=Math.abs(dot/Math.sqrt(nn));const deg=2*Math.acos(Math.min(1,dot))*180/Math.PI;worst=Math.max(worst,deg);}}
 const strikeOld=e.strike,strikeNew=idx.clips[name].strike;
 const strikeOk=!strikeOld||strikeNew&&strikeNew.socket===strikeOld.socket&&Math.abs(strikeNew.time-strikeOld.time)<.02;
 report.compared.push({name,worstDeg:+worst.toFixed(3),strikeOk});report.worstDeg=Math.max(report.worstDeg,worst);
 if(worst>MAX_DEG||!strikeOk)report.failures.push({name,worstDeg:+worst.toFixed(3),strikeOld,strikeNew});
}
fs.mkdirSync('development/characters/loadout/evidence/runner-full',{recursive:true});
fs.writeFileSync('development/characters/loadout/evidence/runner-full/pose-parity.json',JSON.stringify(report,null,1));
console.log('compared',report.compared.length,'clips; worst',report.worstDeg.toFixed(3),'deg; failures',report.failures.length);
assert.ok(report.compared.length>=40,'too few clips compared');assert.equal(report.failures.length,0,JSON.stringify(report.failures.slice(0,3)));
console.log('PASS pose parity');
