/* Read-only static asset helpers carried from the source-tested room packager.
 * The older generator remains unchanged. No file mutation or asset admission
 * runs when this module is imported. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const THREE=createRequire(import.meta.url)('../vendor/three-r128.js');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function semantic(d){
  return JSON.stringify(d.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>({
    name:n.getName(),matrix:n.getWorldMatrix(),primitives:n.getMesh().listPrimitives().map(p=>({
      mode:p.getMode(),material:p.getMaterial().getName(),
      indices:Array.from(p.getIndices().getArray()),
      attributes:Object.fromEntries(p.listSemantics().sort().map(k=>{
        const a=p.getAttribute(k).getArray();
        return[k,sha(Buffer.from(a.buffer,a.byteOffset,a.byteLength))];
      }))
    }))
  })));
}
function materialState(d){
  return JSON.stringify(d.getRoot().listMaterials().map(m=>({
    name:m.getName(),base:m.getBaseColorFactor(),metal:m.getMetallicFactor(),rough:m.getRoughnessFactor(),
    emission:m.getEmissiveFactor(),strength:m.getExtension('KHR_materials_emissive_strength')?.getEmissiveStrength()||1,
    alphaMode:m.getAlphaMode(),alphaCutoff:m.getAlphaCutoff(),doubleSided:m.getDoubleSided(),
    normalScale:m.getNormalScale(),occlusion:m.getOcclusionStrength(),
    textures:['BaseColor','MetallicRoughness','Normal','Occlusion','Emissive'].map(k=>{
      const t=m['get'+k+'Texture']();
      if(!t)return null;
      const i=m['get'+k+'TextureInfo'](),transform=i.getExtension('KHR_texture_transform');
      return{name:k,mime:t.getMimeType(),image:sha(Buffer.from(t.getImage())),uv:i.getTexCoord(),
        filters:[i.getMinFilter(),i.getMagFilter(),i.getWrapS(),i.getWrapT()],
        transform:transform?{offset:transform.getOffset(),scale:transform.getScale(),rotation:transform.getRotation()}:null};
    })
  })));
}
function corners(d){
  const triangles=[];
  for(const node of d.getRoot().listNodes()){
    if(!node.getMesh())continue;
    const w=node.getWorldMatrix();
    const matrix=new THREE.Matrix4().fromArray(w),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
    const transform=(v,point)=>[0,1,2].map(i=>w[i]*v[0]+w[i+4]*v[1]+w[i+8]*v[2]+(point?w[i+12]:0));
    for(const p of node.getMesh().listPrimitives()){
      assert.equal(p.getMode(),4);
      const pos=p.getAttribute('POSITION').getArray(),normal=p.getAttribute('NORMAL').getArray();
      const uv=p.getAttribute('TEXCOORD_0').getArray(),ids=p.getIndices().getArray();
      for(let i=0;i<ids.length;i+=3){
        const cs=[];
        for(let j=0;j<3;j++){
          const k=ids[i+j];
          const attributes={};
          for(const semantic of p.listSemantics()){
            const accessor=p.getAttribute(semantic),size=accessor.getElementSize();
            const value=Array.from(accessor.getArray().slice(k*size,(k+1)*size));
            if(semantic==='POSITION')attributes[semantic]=transform(value,true);
            else if(semantic==='NORMAL')attributes[semantic]=new THREE.Vector3(...value).applyMatrix3(normalMatrix).normalize().toArray();
            else if(semantic==='TANGENT')attributes[semantic]=[...new THREE.Vector3(...value.slice(0,3)).transformDirection(matrix).toArray(),value[3]*Math.sign(matrix.determinant())];
            else attributes[semantic]=value;
          }
          cs.push({position:attributes.POSITION,normal:attributes.NORMAL,uv:attributes.TEXCOORD_0,attributes});
        }
        triangles.push({material:p.getMaterial().getName(),corners:cs});
      }
    }
  }
  return triangles;
}
function bakeStaticTransforms(d){
  // glTF Transform4.3.0 applyTangentMatrix writes v3[0] before computing
  // v3[1]/v3[2], corrupting rotated tangents. Do not patch the installed vendor.
  // Bake immutable input triples explicitly, then join identity-space nodes.
  const nodes=d.getRoot().listNodes(),world=new Map(nodes.map(n=>[n,n.getWorldMatrix()]));
  for(const node of nodes){
    assert(!node.getSkin());
    const source=node.getMesh();if(!source)continue;
    const matrix=new THREE.Matrix4().fromArray(world.get(node)),normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix);
    const mesh=d.createMesh(source.getName()).setExtras(source.getExtras());
    for(const primitive of source.listPrimitives()){
      const copy=primitive.clone();
      for(const name of primitive.listSemantics()){
        const accessor=primitive.getAttribute(name),input=accessor.getArray(),size=accessor.getElementSize();
        const output=new input.constructor(input);
        if(['POSITION','NORMAL','TANGENT'].includes(name))for(let i=0;i<input.length;i+=size){
          const v=new THREE.Vector3(input[i],input[i+1],input[i+2]);
          if(name==='POSITION')v.applyMatrix4(matrix);
          else if(name==='NORMAL')v.applyMatrix3(normalMatrix).normalize();
          else v.transformDirection(matrix);
          output[i]=v.x;output[i+1]=v.y;output[i+2]=v.z;
          if(name==='TANGENT')output[i+3]=input[i+3]*Math.sign(matrix.determinant());
        }
        copy.setAttribute(name,accessor.clone().setArray(output));
      }
      if(primitive.getIndices())copy.setIndices(primitive.getIndices().clone().setArray(new (primitive.getIndices().getArray().constructor)(primitive.getIndices().getArray())));
      mesh.addPrimitive(copy);
    }
    node.setMesh(mesh);
  }
  for(const node of nodes)node.setTranslation([0,0,0]).setRotation([0,0,0,1]).setScale([1,1,1]);
}
const cell=t=>[0,1,2].map(i=>Math.floor(t.corners.reduce((s,c)=>s+c.position[i],0)/3/.1));
const key=t=>t.material+'|'+cell(t).join(',');
function lookup(bins,t){
  const c=cell(t),out=[];
  // Adjacent cells avoid decimal-rounding discontinuities at bin boundaries.
  // Full oriented corner comparison below still establishes the match.
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)
    for(const candidate of bins.get(t.material+'|'+[c[0]+x,c[1]+y,c[2]+z].join(','))||[])
      if(!candidate.__consumed)out.push(candidate);
  return out;
}

export function compareRenderedCorners(actual,expected,ignore=[]){
 const bins=new Map(),ignored=new Set(ignore),maximumErrors={};
 for(const original of expected){const t={...original,__consumed:false},k=key(t);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(t);}
 assert.equal(actual.length,expected.length,'Triangle count changed');
 for(const triangle of actual){
  const candidates=lookup(bins,triangle);let match=-1,accepted;
  for(let i=0;i<candidates.length&&match<0;i++)for(let r=0;r<3;r++){
   let valid=true;const errors={};
   for(let j=0;j<3;j++){
    const a=triangle.corners[j].attributes,b=candidates[i].corners[(j+r)%3].attributes;
    const keysA=Object.keys(a).filter(k=>!ignored.has(k)).sort(),keysB=Object.keys(b).filter(k=>!ignored.has(k)).sort();
    if(keysA.join()!==keysB.join()){valid=false;break;}
    for(const name of keysA){
     const error=Math.max(...a[name].map((v,k)=>Math.abs(v-b[name][k])));
     const tolerance=['NORMAL','TANGENT'].includes(name)?1e-4:name==='POSITION'?4e-5:name.startsWith('TEXCOORD')?3e-5:1e-7;
     if(error>tolerance){valid=false;break;}errors[name]=Math.max(errors[name]||0,error);
    }
   }
   if(valid){match=i;accepted=errors;break;}
  }
  assert(match>=0,'Rendered corner mismatch '+key(triangle));candidates[match].__consumed=true;
  for(const [name,error]of Object.entries(accepted))maximumErrors[name]=Math.max(maximumErrors[name]||0,error);
 }
 assert([...bins.values()].every(rows=>rows.every(t=>t.__consumed)),'Unmatched original source corner');
 return{triangles:actual.length,maximumErrors,ignoredSemantics:ignore};
}
export {semantic,materialState,corners,bakeStaticTransforms,cell,key,lookup};
