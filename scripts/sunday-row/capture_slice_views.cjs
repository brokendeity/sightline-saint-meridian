/* Renders every preset view of the Sunday Row look-dev slice (LOOKDEV_SUNDAY_ROW.html) to PNG at 1280x720,
   then a side-by-side sheet against the chosen reference frames. Usage: node scripts/sunday-row/capture_slice_views.cjs [outDir] */
const{chromium}=require('/opt/homebrew/lib/node_modules/playwright'),fs=require('fs'),path=require('path');
const OUT=process.argv[2]||'development/sunday-row/evidence/slice-v1';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});const p=await b.newPage({viewport:{width:1280,height:720}});const errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.goto('http://127.0.0.1:8766/LOOKDEV_SUNDAY_ROW.html'+(process.env.LOOK?'?look='+process.env.LOOK:''));await p.waitForFunction(()=>window.LOOKDEV&&(LOOKDEV.ready||LOOKDEV.error),null,{timeout:120000});
 const st=await p.evaluate(()=>LOOKDEV.error?{error:LOOKDEV.error}:{views:LOOKDEV.views,meshes:LOOKDEV.meshes});if(st.error)throw Error(st.error);
 await p.keyboard.press('KeyH');const shots=[];
 for(const v of st.views){await p.evaluate(v=>LOOKDEV.setView(v),v);await p.waitForTimeout(600);const file=path.join(OUT,v+'.png');await p.screenshot({path:file});shots.push(file);}
 const info=await p.evaluate(()=>LOOKDEV.info());
 fs.writeFileSync(path.join(OUT,'capture.json'),JSON.stringify({views:st.views,meshes:st.meshes,drawCalls:info.calls,triangles:info.triangles,errors},null,1)+'\n');
 console.log('views',st.views.length,'meshes',st.meshes,'calls',info.calls,'tris',info.triangles,'errors',errors.length,errors.slice(0,3));await b.close();})().catch(e=>{console.error(e);process.exit(1);});
