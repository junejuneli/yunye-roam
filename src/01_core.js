/* ===== 基础工具与地形 ===== */
const TAU=Math.PI*2;
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const angDiff=(a,b)=>((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;
function rngOf(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const P=new Uint8Array(512),G=new Float32Array(256);
(function(){const rnd=rngOf(20261112),p=[];for(let i=0;i<256;i++){p[i]=i;G[i]=rnd();}
  for(let i=255;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}
  for(let i=0;i<512;i++)P[i]=p[i&255];})();
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),X=xi&255,Y=yi&255,X1=(X+1)&255,Y1=(Y+1)&255;
  const a=G[P[P[X]+Y]],b=G[P[P[X1]+Y]],c=G[P[P[X]+Y1]],d=G[P[P[X1]+Y1]];
  return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y){let s=0,a=0.5,f=1,n=0;for(let i=0;i<4;i++){s+=vnoise(x*f,y*f)*a;n+=a;a*=0.5;f*=2.03;}return s/n;}

const WORLD_R=400,WATER=0,SIZE=960,HALF=480,SEG=200,CELL=SIZE/SEG,N1=SEG+1;
const ISLETS=[[120,100,9,9],[372,-150,14,9],[-310,256,14,9],[256,310,14,9]];
const mtn=(x,z)=>Math.exp(-((x+130)*(x+130)+(z+170)*(z+170))/(2*105*105));
const lake=(x,z)=>Math.exp(-((x-120)*(x-120)+(z-100)*(z-100))/(2*48*48));
const forestN=(x,z)=>0.3*vnoise(x*0.012+51.3,z*0.012+17.9)+0.7*Math.max(Math.exp(-((x+150)*(x+150)+(z-70)*(z-70))/(2*105*105)),0.9*Math.exp(-((x-150)*(x-150)+(z+235)*(z+235))/(2*60*60)));
function rawH(x,z){
  const n=fbm(x*0.0045+7.3,z*0.0045+2.1);
  let e=(n-0.36)*62+2;
  e+=(vnoise(x*0.05,z*0.05)-0.5)*1.6;
  e+=mtn(x,z)*(58+(1-Math.abs(2*vnoise(x*0.014,z*0.014)-1))*34);
  const l=Math.min(1,lake(x,z)*1.4);
  e=e*(1-l)-5*l;
  const f=sstep(0.72,0.98,Math.hypot(x,z)/WORLD_R);
  e=e*(1-f)-9*f;
  for(let i=0;i<ISLETS.length;i++){const s=ISLETS[i],dx=x-s[0],dz=z-s[1];e+=s[2]*Math.exp(-(dx*dx+dz*dz)/(2*s[3]*s[3]));}
  return e;
}
const HG=new Float32Array(N1*N1);
for(let j=0;j<N1;j++)for(let i=0;i<N1;i++)HG[j*N1+i]=rawH(-HALF+i*CELL,-HALF+j*CELL);
function groundH(x,z){
  let gx=(x+HALF)/CELL,gz=(z+HALF)/CELL;
  if(gx<0)gx=0;else if(gx>SEG-0.001)gx=SEG-0.001;
  if(gz<0)gz=0;else if(gz>SEG-0.001)gz=SEG-0.001;
  const ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,i=iz*N1+ix;
  const ha=HG[i],hd=HG[i+1],hb=HG[i+N1],hc=HG[i+N1+1];
  return (u+v<=1)?ha+(hd-ha)*u+(hb-ha)*v:hc+(hb-hc)*(1-u)+(hd-hc)*(1-v);
}
const slopeAt=(x,z)=>Math.hypot(groundH(x+1.5,z)-groundH(x-1.5,z),groundH(x,z+1.5)-groundH(x,z-1.5))/3;
/* 把一块地压平，给建筑和营地用 */
function flatten(x,z,r,h){
  if(h===undefined)h=groundH(x,z);
  const i0=Math.max(0,Math.floor((x-r*2+HALF)/CELL)),i1=Math.min(SEG,Math.ceil((x+r*2+HALF)/CELL));
  const j0=Math.max(0,Math.floor((z-r*2+HALF)/CELL)),j1=Math.min(SEG,Math.ceil((z+r*2+HALF)/CELL));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
    const d=Math.hypot(-HALF+i*CELL-x,-HALF+j*CELL-z),t=1-sstep(r,r*2,d);
    HG[j*N1+i]=lerp(HG[j*N1+i],h,t);}
  return h;
}
