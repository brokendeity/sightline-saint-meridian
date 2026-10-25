/* Run retained factory tests against the actual candidate-embedded modules.
 * The fusion builder intentionally modifies standalone modules. Testing those
 * standalone files alone cannot establish preservation of the shipped code.
 * This supplements normal-input browser acceptance; it does not replace it. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{spawnSync}=require('child_process');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const cases={
 threadrail:{source:'game_threadrail.js',test:'test_threadrail.cjs'},
 drive:{source:'game_afterstep_drive.js',test:'test_afterstep_drive.cjs'}
};
function extract(spec){
 const entry=fs.readFileSync(path.join(R,'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html'),'utf8');
 const source=fs.readFileSync(path.join(R,'scripts',spec.source),'utf8');
 const prefix=source.slice(0,500),start=entry.indexOf(prefix),end=entry.indexOf('\n});',start+prefix.length);
 assert(start>=0&&entry.indexOf(prefix,start+1)<0,'Ambiguous embedded start '+spec.source);
 assert(end>start,'Missing top-level UMD terminator '+spec.source);
 const code=entry.slice(start,end+5).trim();
 assert(code.endsWith('});'),'Embedded module terminator changed '+spec.source);
 return{code,source,entry};
}
const name=process.argv[2];
if(name){
 const spec=cases[name];assert(spec,'Unknown factory case');const{code}=extract(spec);
 const file=path.join(R,'scripts',spec.source),loaded=require(file),record=require.cache[require.resolve(file)],module={exports:{}};
 new Function('module','exports','window',code)(module,module.exports,{});
 assert(module.exports,'Candidate did not export a factory');record.exports=module.exports;
 require(path.join(R,'scripts',spec.test));record.exports=loaded;
}else{
 const report={status:'FAIL',scope:'Retained Threadrail and Drive factory assertions executed against exact modules extracted from the V02 HTML. Does not establish movement/animation/mission integration, disabled legacy Flow behavior or sustained performance.',entrySHA256:hash(fs.readFileSync(path.join(R,'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html'))),manifestSHA256:hash(fs.readFileSync(path.join(R,'assets/city/vertical-v02/graybox/manifest.json'))),cases:[]};
 for(const[name,spec]of Object.entries(cases)){
  const{code,source}=extract(spec),result=spawnSync(process.execPath,[__filename,name],{cwd:R,encoding:'utf8'});
  report.cases.push({name,retainedTest:'scripts/'+spec.test,embeddedSHA256:hash(code),standaloneSHA256:hash(source),exactStandaloneMatch:code===source.trim(),returncode:result.status,stdout:result.stdout,stderr:result.stderr});
  console.log(name,result.status===0?'PASS':'FAIL');if(result.status!==0)console.error(result.stdout,result.stderr);
 }
 if(report.cases.every(c=>c.returncode===0))report.status='PASS retained assertions against candidate-embedded physics';
 fs.writeFileSync(path.join(D,'V02_Embedded_Core_Units.json'),JSON.stringify(report,null,2)+'\n');
 assert(report.status.startsWith('PASS'),'Candidate embedded factory regression failed');
}
