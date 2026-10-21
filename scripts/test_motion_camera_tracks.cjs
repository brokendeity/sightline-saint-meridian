const assert=require('assert'),fs=require('fs'),zlib=require('zlib'),{normalize}=require('./motion_camera_tracks.js');
const sparse={path:'data.lens',keys:[[0,[0,30]],[1/30,[3000,60]],[2/30,[-1,30]]]};
const fixed=normalize(sparse);assert.deepEqual(fixed.keys,[[0,[30]],[1,[60]],[-1/3000,[30]]]);assert.strictEqual(normalize(sparse),fixed);assert.equal(sparse.keys[1][0],1/30);
const scalar={path:'data.lens',keys:[[0,[30]],[1,[60]]]};assert.strictEqual(normalize(scalar),scalar);
const vector={path:'location',keys:[[0,[3000,2]]]};assert.strictEqual(normalize(vector),vector);
const scene=JSON.parse(zlib.gunzipSync(fs.readFileSync('assets/nsunsc-library/c426d45069048ff1a4d4/scene.json.gz'))),a=scene.animations.find(x=>x.name==='3mntspl1_atk'),lens=a.entries.find(e=>e.format===2).curves.find(c=>c.path==='data.lens'),repaired=normalize(lens);
assert.notStrictEqual(repaired,lens);assert(repaired.keys.every(k=>k[1].length===1));assert(repaired.keys.some((k,i)=>Math.abs(k[0]-lens.keys[i][0])>.01));
console.log('Sparse camera lens source ticks, sentinel handling, immutable normalization, scalar/vector preservation and actual Minato source data passed.');
