/* ===== 着色器 ===== */
const SKY_VS='varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const SKY_FS=[
'uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uSun;uniform vec3 uMoon;uniform vec3 uSunCol;uniform vec3 uDuskCol;uniform vec3 uCloudA;uniform vec3 uCloudB;',
'uniform float uTime;uniform float uNight;uniform float uDusk;uniform float uAurora;',
'varying vec3 vP;',
'float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);',
'  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);}',
'float fbm(vec2 p){float s=0.0;float a=0.5;for(int i=0;i<4;i++){s+=noise(p)*a;p=p*2.02+vec2(17.3,9.1);a*=0.5;}return s;}',
'float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}',
'void main(){',
'  vec3 d=normalize(vP);float h=d.y;',
'  vec3 col=mix(uHor,uZen,pow(clamp(h,0.0,1.0),0.5));',
'  float sd=max(dot(d,uSun),0.0);',
'  col+=uDuskCol*pow(sd,5.0)*(1.0-clamp(h*2.2,0.0,1.0))*uDusk*0.7;',
'  col+=uSunCol*(smoothstep(0.9992,0.9996,sd)+pow(sd,300.0)*0.5+pow(sd,20.0)*0.18);',
'  float md=max(dot(d,uMoon),0.0);',
'  col+=vec3(0.82,0.88,1.0)*(smoothstep(0.9993,0.9996,md)+pow(md,180.0)*0.2)*uNight;',
'  if(uNight>0.01&&h>0.0){vec3 sp=d*150.0;float r=hash3(floor(sp));vec3 f=fract(sp)-0.5;',
'    float st=step(0.993,r)*smoothstep(0.4,0.0,length(f))*(0.6+0.4*sin(uTime*2.0+r*90.0));',
'    col+=vec3(st)*uNight*clamp(h*4.0,0.0,1.0);}',
'  if(uAurora>0.01&&h>0.05){float ax=d.x/(h+0.3);float a=fbm(vec2(ax*2.5+uTime*0.03,uTime*0.02+d.z));',
'    float band=smoothstep(0.42,0.72,a)*smoothstep(0.05,0.3,h)*(1.0-smoothstep(0.5,0.9,h));',
'    float ray=0.6+0.4*sin(ax*40.0+a*20.0);',
'    col+=mix(vec3(0.2,1.0,0.6),vec3(0.5,0.4,1.0),clamp(h*1.4,0.0,1.0))*band*ray*uAurora*uNight*0.8;}',
'  if(h>0.0){vec2 cuv=d.xz/(h+0.14)*1.1+uTime*vec2(0.006,0.002);float n=fbm(cuv);float c=smoothstep(0.5,0.72,n);',
'    float n2=fbm(cuv+uSun.xz*0.12);float lit=smoothstep(0.0,0.25,n-n2+0.08);',
'    col=mix(col,mix(uCloudB,uCloudA,lit),c*smoothstep(0.0,0.16,h)*0.9);}',
'  gl_FragColor=vec4(col,1.0);',
'}'].join('\n');
const WATER_VS='varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const WATER_FS=[
'uniform sampler2D uHM;uniform float uTime;uniform float uLight;uniform float uFogNear;uniform float uFogFar;',
'uniform vec3 uSky;uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uFogCol;uniform vec3 uDeep;uniform vec3 uShallow;',
'varying vec3 vW;',
'void main(){',
'  vec2 p=vW.xz;float t=uTime;',
'  vec2 uv=p/960.0+0.5;',
'  float hh=texture2D(uHM,clamp(uv,0.0,1.0)).r*16.0-12.0;',
'  float inside=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);',
'  float depth=mix(12.0,max(-hh,0.0),inside);',
'  vec2 dn=vec2(sin(p.x*0.55+t*1.2)+0.6*sin((p.x+p.y)*0.85+t*1.8)+0.35*sin(p.y*2.3-t*2.2),',
'               sin(p.y*0.5+t*1.05)+0.6*sin((p.x-p.y)*0.8+t*1.5)+0.35*sin(p.x*2.1+t*2.4))*0.07;',
'  vec3 n=normalize(vec3(dn.x,1.0,dn.y));',
'  vec3 V=normalize(cameraPosition-vW);',
'  float fres=pow(1.0-max(dot(n,V),0.0),3.0);',
'  vec3 col=mix(uShallow,uDeep,smoothstep(0.0,6.0,depth))*uLight;',
'  col=mix(col,uSky,fres*0.7);',
'  float spec=pow(max(dot(reflect(-uSunDir,n),V),0.0),90.0);',
'  col+=uSunCol*spec*0.9;',
'  float glint=smoothstep(0.985,1.0,sin(p.x*1.3+t*0.7+dn.x*9.0)*sin(p.y*1.1-t*0.5+dn.y*9.0));',
'  col+=uSunCol*glint*0.25;',
'  float shore=1.0-smoothstep(0.0,0.7,depth);',
'  float wv=sin(depth*6.0-t*1.8+sin(p.x*0.35+p.y*0.25)*2.0)*0.5+0.5;',
'  float foam=shore*smoothstep(0.55,0.9,wv+shore*0.62);',
'  col=mix(col,vec3(uLight)+uSky*0.15,foam*0.9);',
'  float a=mix(0.5,0.94,smoothstep(0.0,3.5,depth));a=clamp(a+fres*0.3+foam,0.0,1.0);',
'  float fd=smoothstep(uFogNear,uFogFar,length(cameraPosition-vW));',
'  col=mix(col,uFogCol,fd);',
'  gl_FragColor=vec4(col,a);',
'}'].join('\n');
const COL_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const COL_FS=[
'uniform float uTime;varying vec2 vUv;',
'void main(){',
'  float s=sin(vUv.x*18.85+vUv.y*16.0-uTime*5.0);',
'  float s2=sin(vUv.x*12.57-vUv.y*9.0+uTime*3.0);',
'  float a=(smoothstep(0.55,1.0,s)*0.5+smoothstep(0.7,1.0,s2)*0.25)*(1.0-vUv.y)*smoothstep(0.0,0.06,vUv.y);',
'  gl_FragColor=vec4(0.75,1.0,0.93,a);',
'}'].join('\n');
const PT_VS=[
'attribute float aSize;attribute vec4 aCol;varying vec4 vCol;uniform float uScale;',
'void main(){vCol=aCol;vec4 mv=modelViewMatrix*vec4(position,1.0);',
'  gl_PointSize=aSize*uScale/max(-mv.z,0.1);gl_Position=projectionMatrix*mv;}'].join('\n');
/* 粒子：柔光圆点叠一个四芒星 */
const PT_FS='varying vec4 vCol;void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);vec2 q=abs(c);float a=smoothstep(0.5,0.05,d)*0.75+max(0.0,1.0-(q.x*q.y*110.0+d*2.2));gl_FragColor=vec4(vCol.rgb+a*0.25,vCol.a*min(a,1.0));}';
/* ===== 技能特效着色器 ===== */
const FX_NOISE=[
'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
'float n2(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y);}',
'float fb(vec2 p){return n2(p)*0.6+n2(p*2.1+3.7)*0.3+n2(p*4.3+9.1)*0.1;}',
'float ln(float x,float c,float w){return smoothstep(w,0.0,abs(x-c));}',''].join('\n');
const FX_HEAD='uniform vec3 uCol;uniform vec3 uCol2;uniform float uTime;uniform float uA;uniform float uP;uniform float uKind;varying vec2 vUv;\n'+FX_NOISE;
const FX_VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
/* 法阵：外圈符文带 + 各属性的图案（炎：六芒星，风：旋臂，霜：雪花） */
const CIRCLE_FS=FX_HEAD+[
'void main(){vec2 p=vUv*2.0-1.0;float r=length(p);if(r>1.0)discard;float a=atan(p.y,p.x);float t=uTime;',
'  float m=ln(r,0.97,0.012)+ln(r,0.86,0.008)+ln(r,0.555,0.008)+ln(r,0.5,0.006)*0.6;',
'  float ra=a+t*0.35;float cell=floor(ra*7.0028);float f=fract(ra*7.0028);float hh=h21(vec2(cell,3.0));',
'  m+=step(0.885,r)*step(r,0.945)*step(0.2,f)*step(f,0.8)*step(0.3,hh)*(0.35+0.4*step(0.5,fract(hh*7.0+(r-0.885)*33.0)));',
'  m+=step(0.575,r)*step(r,0.62)*step(0.5,fract((a-t*0.6)*1.9099))*0.7;',
'  float fig=0.0;',
'  if(uKind<0.5){',
'    for(int k=0;k<2;k++){float aa=a+t*0.5+float(k)*1.0472;float d=cos(floor(0.5+aa/2.0944)*2.0944-aa)*r;fig+=ln(d,0.25,0.012);}',
'    fig*=step(r,0.5);fig+=ln(r,0.2,0.01)+step(r,0.2)*0.25*(0.5+0.5*sin(a*8.0-t*6.0));',
'    fig+=smoothstep(0.6,1.0,fb(vec2(a*3.0,r*4.0-t*1.5)))*step(0.62,r)*step(r,0.86)*0.55;',
'  }else if(uKind<1.5){',
'    fig=smoothstep(0.7,1.0,sin(a*3.0+r*9.0-t*5.0))*step(r,0.5)*smoothstep(0.04,0.2,r);',
'    fig+=smoothstep(0.86,1.0,sin(a*6.0-r*14.0+t*3.0))*step(0.62,r)*step(r,0.86)*0.7;',
'  }else{',
'    float aa=abs(mod(a+t*0.2,1.0472)-0.5236);float x=cos(aa)*r;float y=sin(aa)*r;',
'    fig=ln(y,0.0,0.012)*step(x,0.5);',
'    for(int k=0;k<3;k++){float x0=0.14+float(k)*0.12;float d=abs(y*0.5-(x-x0)*0.866);float al=(x-x0)*0.5+y*0.866;fig+=ln(d,0.0,0.01)*step(0.0,al)*step(al,0.15-float(k)*0.03);}',
'    fig+=ln(cos(aa)*r,0.5,0.01)*0.0+ln(r,0.08,0.01);',
'    fig+=step(0.985,h21(floor(p*26.0)+floor(t*5.0)))*step(r,0.86)*0.9;',
'  }',
'  float rev=smoothstep(uP,uP-0.1,r);float glow=(1.0-r)*0.16;float s=clamp(m+fig,0.0,1.4);',
'  gl_FragColor=vec4(mix(uCol,uCol2,clamp(s*0.6+(1.0-r)*0.3,0.0,1.0)),clamp(s+glow,0.0,1.0)*uA*rev);}'].join('\n');
/* 月牙刀光／风带：u 沿长度，v 横向；uP 是刀头走到哪儿了 */
const TRAIL_FS=FX_HEAD+[
'void main(){float u=vUv.x;float v=vUv.y;float w=smoothstep(uP-0.75,uP,u)*step(u,uP);',
'  float prof=smoothstep(1.0-w,1.0-w+0.3,v)*smoothstep(1.0,0.9,v);',
'  float n=fb(vec2(u*16.0-uTime*3.0,v*4.0));',
'  float a=w*prof*(0.45+0.8*n)+smoothstep(0.86,0.97,v)*smoothstep(1.0,0.97,v)*w*0.9;',
'  vec3 col=mix(uCol,uCol2,pow(v,4.0)*w);gl_FragColor=vec4(col,clamp(a,0.0,1.0)*uA);}'].join('\n');
/* 冲击环：带噪声的软边 */
const RING_FS=FX_HEAD+[
'void main(){float v=vUv.y;float n=n2(vec2(vUv.x*46.0,uTime*4.0));float a=pow(sin(3.14159*v),1.6)*(0.55+0.6*n)+smoothstep(0.82,0.96,v)*smoothstep(1.0,0.96,v);',
'  gl_FragColor=vec4(mix(uCol,uCol2,smoothstep(0.6,1.0,v)),clamp(a,0.0,1.0)*uA);}'].join('\n');
/* 火焰／寒雾／气柱：向上翻卷、被噪声侵蚀的一面墙 */
const FLAME_FS=FX_HEAD+[
'void main(){float y=vUv.y;float f=fb(vec2(vUv.x*uKind+uP,y*2.2-uTime*2.6))*0.7+fb(vec2(vUv.x*uKind*2.0-uP,y*4.0-uTime*4.2))*0.3;',
'  float a=smoothstep(y*1.1+0.16,y*1.1+0.5,f+0.22*(1.0-y))*smoothstep(0.0,0.05,y)*(1.0-smoothstep(0.6,1.0,y));',
'  float h=f+(1.0-y)*0.45;vec3 col=mix(uCol,uCol2,smoothstep(0.35,0.9,h));col=mix(col,vec3(1.0),smoothstep(0.95,1.3,h)*0.45);',
'  gl_FragColor=vec4(col,a*uA);}'].join('\n');
/* 龙卷 */
const TWIST_FS=FX_HEAD+[
'void main(){float s=sin(vUv.x*18.85+vUv.y*10.0-uTime*9.0+fb(vUv*vec2(6.0,3.0))*3.0);float s2=sin(vUv.x*31.42-vUv.y*7.0-uTime*6.0);',
'  float a=(smoothstep(0.3,1.0,s)*0.6+smoothstep(0.6,1.0,s2)*0.3+0.07)*smoothstep(0.0,0.1,vUv.y)*(1.0-smoothstep(0.5,1.0,vUv.y));',
'  gl_FragColor=vec4(mix(uCol,uCol2,smoothstep(0.75,1.0,s)),a*uA);}'].join('\n');
/* 冰晶穹顶：菲涅尔边光 + 格线 + 闪点 */
const DOME_VS='varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vP=position;gl_Position=projectionMatrix*mv;}';
const DOME_FS='uniform vec3 uCol;uniform vec3 uCol2;uniform float uTime;uniform float uA;varying vec3 vN;varying vec3 vV;varying vec3 vP;\n'+FX_NOISE+[
'void main(){float fr=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.2);float an=atan(vP.z,vP.x);',
'  float g=max(smoothstep(0.93,1.0,abs(sin(an*9.0+vP.y*5.0))),max(smoothstep(0.93,1.0,abs(sin(an*9.0-vP.y*5.0))),smoothstep(0.95,1.0,abs(sin(vP.y*12.0-uTime*0.8)))));',
'  float sp=step(0.988,h21(floor(vec2(an*14.0,vP.y*22.0))+floor(uTime*7.0)));',
'  float a=(fr*0.8+g*0.16*(0.35+fr)+sp*0.7)*uA*smoothstep(0.0,0.06,vP.y);',
'  gl_FragColor=vec4(mix(uCol,uCol2,fr*0.7+sp),a);}'].join('\n');
/* 剑刃拖尾 */
const RIB_VS='attribute float aA;varying float vA;void main(){vA=aA;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const RIB_FS='uniform vec3 uCol;varying float vA;void main(){gl_FragColor=vec4(mix(uCol,vec3(1.0),vA*vA*0.7),vA);}';
