// Subtract the world-space impact box by clipping triangles, preserving every vertex attribute.
// A small hit must cut a large wall triangle even when that triangle's centroid lies elsewhere.
function cutImportedGeometry(source,cut,mesh){
 mesh.updateMatrixWorld(true);const inverse=mesh.matrixWorld.clone().invert(),localCut=cut.clone().applyMatrix4(inverse),keys=Object.keys(source.attributes),sizes=keys.map(k=>source.attributes[k].itemSize),offsets=[];let stride=0;for(const n of sizes){offsets.push(stride);stride+=n}const values=keys.map(()=>[]),positionOffset=offsets[keys.indexOf('position')],count=source.index?source.index.count:source.attributes.position.count;
 function vertex(index){const v=[];for(const key of keys){const a=source.attributes[key];for(let j=0;j<a.itemSize;j++)v.push(a.array[index*a.itemSize+j])}return v}
 function emit(poly){for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]])for(let k=0;k<keys.length;k++)for(let j=0;j<sizes[k];j++)values[k].push(v[offsets[k]+j])}
 function split(poly,axis,edge,sign){const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a[positionOffset+axis]-edge)*sign,db=(b[positionOffset+axis]-edge)*sign;const inA=da>=-1e-8,inB=db>=-1e-8;(inA?inside:outside).push(a);if(inA!==inB){const t=da/(da-db),v=a.map((n,k)=>n+(b[k]-n)*t);inside.push(v);outside.push(v)}}return{inside,outside}}
 const planes=[[0,localCut.min.x,1],[0,localCut.max.x,-1],[1,localCut.min.y,1],[1,localCut.max.y,-1],[2,localCut.min.z,1],[2,localCut.max.z,-1]];
 for(let i=0;i<count;i+=3){let poly=[0,1,2].map(k=>vertex(source.index?source.index.getX(i+k):i+k));if(planes.some(([axis,edge,sign])=>poly.every(v=>(v[positionOffset+axis]-edge)*sign<0))){emit(poly);continue}for(const [axis,edge,sign] of planes){if(poly.length<3)break;const clipped=split(poly,axis,edge,sign);if(clipped.outside.length>=3)emit(clipped.outside);poly=clipped.inside}}
 const out=new THREE.BufferGeometry();for(let k=0;k<keys.length;k++)out.setAttribute(keys[k],new THREE.Float32BufferAttribute(values[k],sizes[k]));out.computeBoundingSphere();out.computeBoundingBox();return out;
}
