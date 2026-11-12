/* TEST HARNESS ONLY (labelled setup, not gameplay): the V02 suites hard-code http://127.0.0.1:8766/, which on this machine
   serves the main worktree for other sessions. Preloaded with NODE_OPTIONS=--require <this file>, it makes every Playwright
   browser context route requests for 127.0.0.1:8766 / localhost:8766 to V02_REDIRECT_PORT (default 8768, this worktree's
   server). The page keeps its 8766 origin (localStorage etc. unchanged); only where the bytes come from changes.
   Nothing in the game or in any test is edited. */
const PW='/opt/homebrew/lib/node_modules/playwright';
const port=process.env.V02_REDIRECT_PORT||'8768',FROM=/^http:\/\/(127\.0\.0\.1|localhost):8766\//;
let pw;try{pw=require(PW);}catch(_){pw=null;}
if(pw&&!pw.__v02Redirect){
 pw.__v02Redirect=true;
 const routed=new WeakSet();
 const route=async ctx=>{if(routed.has(ctx))return ctx;routed.add(ctx);await ctx.route(FROM,r=>r.continue({url:r.request().url().replace(FROM,`http://127.0.0.1:${port}/`)}));return ctx;};
 for(const type of ['chromium','firefox','webkit']){
  const bt=pw[type];if(!bt)continue;
  const launch=bt.launch.bind(bt);
  bt.launch=async(...a)=>{const b=await launch(...a);const nc=b.newContext.bind(b),np=b.newPage.bind(b);
   b.newContext=async(...o)=>route(await nc(...o));
   b.newPage=async(...o)=>{const p=await np(...o);await route(p.context());return p;};
   return b;};
  if(bt.launchPersistentContext){const lpc=bt.launchPersistentContext.bind(bt);bt.launchPersistentContext=async(...a)=>route(await lpc(...a));}
 }
}
