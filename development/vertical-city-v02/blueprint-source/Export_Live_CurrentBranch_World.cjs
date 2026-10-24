/* Read-only runtime geometry exporter for the exact current megacity branch.
   Run in the local full repository checkout with Playwright available:
     python3 -m http.server 8766
     node Export_Live_CurrentBranch_World.cjs
   Adapt the game entrypoint in GAME_URL if the selected playable version changes.
   Not run or validated in the present site-study session. */
const fs=require('fs');
let chromium;
try {chromium=require('playwright').chromium;}
catch(e){try{chromium=require('/opt/homebrew/lib/node_modules/playwright').chromium;}catch(_){throw new Error('Install Playwright or configure its local module path.')}}
const GAME_URL=process.env.GAME_URL||'http://127.0.0.1:8766/SIGHTLINE_BACKSPOOL_WHIP_THROW.html?capture=backspool';
const OUTPUT=process.env.OUTPUT||'V02_live_world_export.json';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(GAME_URL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof gameReady!=='undefined'&&gameReady&&typeof roadNetworkState==='function'&&roadNetworkState().ready,{timeout:120000});
  await page.waitForFunction(()=>typeof verticalCityState==='function'&&(verticalCityState().ready||verticalCityState().error),{timeout:120000});
  const data=await page.evaluate(()=>{
   const P=v=>v&&[v.x,v.y,v.z];
   const BOX=b=>b&&{min:P(b.min),max:P(b.max)};
   const colliders=typeof buildingColliders!=='undefined'?buildingColliders:[];
   const roads=typeof roadNetwork!=='undefined'?roadNetwork:null;
   const props=typeof propColliders!=='undefined'?propColliders:[];
   const buildingData=colliders.map((c,i)=>({index:i,id:String(c.id??`lot-${i}`),destroyed:!!c.destroyed,meshPosition:P(c.mesh?.position),box:BOX(c.box),originalBounds:BOX(c.originalBounds),parts:(c.parts||[]).map(p=>({id:String(p.id??''),box:BOX(p.box)}))}));
   const allProps=props.filter(c=>String(c.id||'').startsWith('vertical-')).map(c=>({id:String(c.id),box:BOX(c.box),type:c.type,nonDestructible:!!c.nonDestructible}));
   const r=roads?{
    nodes:(roads.nodes||[]).map(n=>({id:n.id,pos:P(n.position),valid:!!n.valid})),
    segments:(roads.segments||[]).map(s=>({id:s.id,a:P(s.a),b:P(s.b),active:!!s.active,kind:s.kind,width:s.width})),
    lanes:(roads.lanes||[]).map(l=>({id:l.id,active:!!l.active,startNode:l.startNode,endNode:l.endNode,points:l.points?.map(P),width:l.width,speedLimit:l.speedLimit}))
   }:null;
   return{generatedAt:new Date().toISOString(),entry:location.pathname,branch:'feature/saint-meridian-vertical-megacity-v1',buildings:buildingData,verticalProps:allProps,roadNetwork:r,verticalState:window.verticalCityState?.(),counts:{buildingColliders:colliders.length,verticalProps:allProps.length}};
  });
  fs.writeFileSync(OUTPUT,JSON.stringify(data,null,2));
  console.log(`Wrote ${OUTPUT}: ${data.counts.buildingColliders} buildings / ${data.counts.verticalProps} vertical props`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
