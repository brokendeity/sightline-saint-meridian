/* Swept vertical capsule against vertical capsule, independent of rendering. */
(function(root){
 const EPS=1e-8;
 function dimensions(actor,shape={}){
  const radius=(shape.radius??.55)+(actor.radius??.32)+(shape.margin??.025);
  const pr=shape.radius??.55,offset=shape.offset??.42,height=shape.height??1.72;
  return{radius,lo:actor.y+(actor.radius??.32)-(height-pr),hi:actor.y+(actor.height??1.72)-(actor.radius??.32)-(pr-offset)};
 }
 function separation(point,actor,shape){const d=dimensions(actor,shape),y=Math.max(d.lo,Math.min(d.hi,point.y));return{...d,x:point.x-actor.x,y:point.y-y,z:point.z-actor.z};}
 function occupied(point,actor,shape){const q=separation(point,actor,shape);return q.x*q.x+q.y*q.y+q.z*q.z<(q.radius-1e-5)**2;}
 function sweep(start,end,actor,shape={}){
  const d=dimensions(actor,shape),dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z,len2=dx*dx+dy*dy+dz*dz;
  if(len2<EPS*EPS)return null;
  const q=separation(start,actor,shape),inside=q.x*q.x+q.y*q.y+q.z*q.z<d.radius*d.radius-1e-7;
  if(inside){
   const endQ=separation(end,actor,shape),before=q.x*q.x+q.y*q.y+q.z*q.z,after=endQ.x*endQ.x+endQ.y*endQ.y+endQ.z*endQ.z;
   // Existing overlap may escape, but a segment may not traverse the body.
   if(q.x*dx+q.y*dy+q.z*dz>=-EPS&&after>before+EPS)return null;
   const length=Math.hypot(q.x,q.y,q.z),speed=Math.sqrt(len2);
   return{t:0,normal:length>EPS?{x:q.x/length,y:q.y/length,z:q.z/length}:{x:-dx/speed,y:-dy/speed,z:-dz/speed},initialOverlap:true};
  }
  let best=null;
  function accept(t,nx,ny,nz){if(t<-EPS||t>1+EPS||best&&t>=best.t)return;const length=Math.hypot(nx,ny,nz);if(length<EPS)return;nx/=length;ny/=length;nz/=length;if(dx*nx+dy*ny+dz*nz>=-EPS)return;best={t:Math.max(0,Math.min(1,t)),normal:{x:nx,y:ny,z:nz}};}
  const x=start.x-actor.x,z=start.z-actor.z,a=dx*dx+dz*dz,b=2*(x*dx+z*dz),c=x*x+z*z-d.radius*d.radius,disc=b*b-4*a*c;
  if(a>EPS&&disc>=-EPS){const t=(-b-Math.sqrt(Math.max(0,disc)))/(2*a),y=start.y+dy*t;if(y>=d.lo-EPS&&y<=d.hi+EPS)accept(t,x+dx*t,0,z+dz*t);}
  for(const[centre,upper]of [[d.lo,false],[d.hi,true]]){
   const y=start.y-centre,bb=2*(x*dx+y*dy+z*dz),cc=x*x+y*y+z*z-d.radius*d.radius,dd=bb*bb-4*len2*cc;
   if(dd<-EPS)continue;const t=(-bb-Math.sqrt(Math.max(0,dd)))/(2*len2),yy=start.y+dy*t;
   if(upper?yy>=centre-EPS:yy<=centre+EPS)accept(t,x+dx*t,yy-centre,z+dz*t);
  }
  return best;
 }
 const api={sweep,occupied,dimensions};root.v02FriendlyContactCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
