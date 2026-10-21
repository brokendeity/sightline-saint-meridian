#include <stdint.h>
#include <stdlib.h>
#include <string.h>
// Bounded translation of the already reviewed local FastCPK decode path.
int decode_nsunsc(const unsigned char *input,size_t length,unsigned char *out,size_t cap,size_t *written){
 unsigned char *b=malloc(length);if(!b)return -1;memcpy(b,input,length);uint32_t x=0x154f048d,y=0x02b3d1cd,z=0x43a3d2f9,w=0x617e9602;
 for(size_t i=0;i<length;i+=4){uint32_t t=x^(x<<11);t^=t>>8;uint32_t n=w^(w>>19)^t;for(int j=0;j<4&&i+j<length;j++)b[i+j]^=(n>>(j*8))&255;x=y;y=z;z=w;w=n;}
 if(length<16||memcmp(b,"CRILAYLA",8)){if(length>cap){free(b);return -2;}memcpy(out,b,length);*written=length;free(b);return 0;}
 uint32_t n=b[8]|b[9]<<8|b[10]<<16|(uint32_t)b[11]<<24,h=b[12]|b[13]<<8|b[14]<<16|(uint32_t)b[15]<<24;
 if((size_t)n+256>cap||(size_t)h+272>length||length<272){free(b);return -3;}memcpy(out,b+h+16,256);size_t done=0,end=(size_t)n+255;long pos=(long)length-257;unsigned pool=0,left=0;int error=0;
 #define BITS(K,V) do{unsigned need=(K);(V)=0;while(need){if(!left){if(pos<16){error=1;break;}pool=b[pos--];left=8;}unsigned take=left<need?left:need;(V)=((V)<<take)|((pool>>(left-take))&((1u<<take)-1));left-=take;need-=take;}}while(0)
 while(done<n&&!error){unsigned flag;BITS(1,flag);if(error)break;if(flag){unsigned back;BITS(13,back);size_t src=end-done+back+3,run=3;unsigned widths[]={2,3,5,8},part=0;int full=1;for(int k=0;k<4;k++){BITS(widths[k],part);run+=part;if(part!=((1u<<widths[k])-1)){full=0;break;}}if(full)do{BITS(8,part);run+=part;}while(part==255&&!error);for(size_t j=0;j<run&&done<n;j++){if(src>=n+256){error=1;break;}out[end-done]=out[src--];done++;}}else{unsigned v;BITS(8,v);if(error)break;out[end-done++]=v;}}
 free(b);if(error)return -4;*written=(size_t)n+256;return 0;
}
