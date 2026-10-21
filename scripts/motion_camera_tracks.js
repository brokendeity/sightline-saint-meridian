/* Correct the saved importer's FLOATLINEAR camera-lens packing.
 * Original raw record is int32 sourceTick + float32 fieldOfView.
 * The old importer emitted [arrayIndex*frameSize, [sourceTick, value]].
 * Preserve raw assets and normalize only this unambiguous camera scalar shape.
 * This does not establish original camera parenting or projection aspect rules.
 */
(function(root){
 const cache=new WeakMap();
 function normalize(curve){
  if(curve?.path!=='data.lens'||!curve.keys?.length)return curve;
  if(cache.has(curve))return cache.get(curve);
  const packed=curve.keys.every(k=>Array.isArray(k[1])&&k[1].length===2&&Number.isInteger(k[1][0])&&Number.isFinite(k[1][1]));
  const value=packed?{...curve,keys:curve.keys.map(k=>[k[1][0]/3000,[k[1][1]]]),sourceClock:3000,sourceTimeRepair:'FLOATLINEAR tick/value unpacked'}:curve;
  cache.set(curve,value);return value;
 }
 const api={normalize};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NativeCameraTracks=api;
})(typeof window!=='undefined'?window:globalThis);
