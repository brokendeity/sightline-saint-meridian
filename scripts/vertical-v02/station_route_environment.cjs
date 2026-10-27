/* Select a hash-bound combined build without replacing retained graybox results.
 * This module configures test I/O only; it never changes the game or inputs. */
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const R=path.resolve(__dirname,'../..'),D=path.join(R,'development/vertical-city-v02');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
function load(){
  const name=process.env.V02_ROUTE_BUILD;
  if(!name)return {entry:'SIGHTLINE_SAINT_MERIDIAN_V02_GRAYBOX.html',manifest:'assets/city/vertical-v02/graybox/manifest.json',output:D,evidence:{},current:false};
  assert.equal(path.basename(name),name,'Build report must be a V02 filename');
  const build=JSON.parse(fs.readFileSync(path.join(D,name)));
  assert.equal(sha(build.entry),build.entrySHA256);
  assert.equal(sha(build.manifest),build.manifestSHA256);
  if(build.script)assert.equal(sha(build.script),build.scriptSHA256);
  if(build.materialContract)assert.equal(sha(build.materialContract),build.materialContractSHA256);
  const run=process.env.V02_ROUTE_RUN;assert(run&&/^[a-z0-9-]+$/.test(run),'Separate current evidence run required');
  const suite=process.env.V02_ROUTE_SUITE||'current-station-routes';assert(/^[a-z0-9-]+$/.test(suite),'Separate evidence suite must be a simple directory name');
  const output=path.join(D,'evidence',suite,run);fs.mkdirSync(path.join(output,'evidence'),{recursive:true});
  return {entry:build.entry,manifest:build.manifest,output,current:true,evidence:{entry:build.entry,manifest:build.manifest,buildReport:name,entrySHA256:sha(build.entry),manifestSHA256:sha(build.manifest),testConfigurationSHA256:sha(path.relative(R,__filename)),evidenceRun:run,evidenceSuite:suite}};
}
async function ready(page,environment){
  if(!environment.current)return;
  await page.waitForFunction(()=>window.verticalWorldLifeState?.().ready&&window.verticalAppearanceState?.().ready&&window.verticalViewsState?.().ready&&window.verticalHUDState?.().ready&&window.v02CameraRays&&(!window.verticalMaterialResponseState||verticalMaterialResponseState().ready),null,{timeout:120000});
  // Deferred view/UI scripts must finish bootstrapping before RAF is frozen.
  await page.evaluate(()=>renderNight(0));
}
module.exports={load,ready};
