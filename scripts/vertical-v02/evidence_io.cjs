/* Keep exact per-frame evidence compressed; summaries remain small and readable. */
const fs=require('fs'),path=require('path'),zlib=require('zlib');
function saveEvidence(directory,name,report){const full=Buffer.from(JSON.stringify(report)),traceName=name.replace(/\.json$/,'.trace.json.gz');fs.writeFileSync(path.join(directory,traceName),zlib.gzipSync(full));const summary={...report,fullTrace:traceName};if(Array.isArray(summary.trace)){summary.traceFrames=summary.trace.length;delete summary.trace;}if(Array.isArray(summary.results))summary.results=summary.results.map(row=>{const r={...row};if(Array.isArray(r.trace)){r.traceFrames=r.trace.length;delete r.trace;}return r});fs.writeFileSync(path.join(directory,name),JSON.stringify(summary,null,2)+'\n');}
module.exports={saveEvidence};
