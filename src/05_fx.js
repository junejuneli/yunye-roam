/* ===== 粒子 ===== */
const PN=coarse?500:900;
const PT={pos:new Float32Array(PN*3),col:new Float32Array(PN*4),size:new Float32Array(PN),vel:new Float32Array(PN*3),
  life:new Float32Array(PN),max:new Float32Array(PN),grav:new Float32Array(PN),drag:new Float32Array(PN),s0:new Float32Array(PN),next:0};
const ptU={uScale:{value:600}};
const ptGeo=new THREE.BufferGeometry();
ptGeo.setAttribute('position',new THREE.BufferAttribute(PT.pos,3));
ptGeo.setAttribute('aCol',new THREE.BufferAttribute(PT.col,4));
ptGeo.setAttribute('aSize',new THREE.BufferAttribute(PT.size,1));
const ptMesh=new THREE.Points(ptGeo,new THREE.ShaderMaterial({uniforms:ptU,vertexShader:PT_VS,fragmentShader:PT_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
ptMesh.frustumCulled=false;scene.add(ptMesh);
function spark(x,y,z,vx,vy,vz,life,size,hex,grav,drag){
  const i=PT.next;PT.next=(i+1)%PN;tc2.set(hex);
  PT.pos[i*3]=x;PT.pos[i*3+1]=y;PT.pos[i*3+2]=z;PT.vel[i*3]=vx;PT.vel[i*3+1]=vy;PT.vel[i*3+2]=vz;
  PT.col[i*4]=tc2.r;PT.col[i*4+1]=tc2.g;PT.col[i*4+2]=tc2.b;PT.col[i*4+3]=1;
  PT.life[i]=PT.max[i]=life;PT.s0[i]=size;PT.size[i]=size;PT.grav[i]=grav||0;PT.drag[i]=drag||0;
}
function burst(x,y,z,n,speed,hex,size,life,up,grav){
  for(let i=0;i<n;i++){const a=Math.random()*TAU,b=Math.acos(Math.random()*2-1),s=speed*(0.4+Math.random()*0.6);
    spark(x,y,z,Math.sin(b)*Math.cos(a)*s,Math.cos(b)*s+(up||0),Math.sin(b)*Math.sin(a)*s,life*(0.6+Math.random()*0.6),size*(0.6+Math.random()*0.8),hex,grav===undefined?6:grav,1.5);}
}
function updateParticles(dt){
  for(let i=0;i<PN;i++){if(PT.life[i]<=0)continue;
    PT.life[i]-=dt;if(PT.life[i]<=0){PT.size[i]=0;PT.col[i*4+3]=0;continue;}
    const k=PT.life[i]/PT.max[i],dr=Math.max(0,1-PT.drag[i]*dt);
    PT.vel[i*3]*=dr;PT.vel[i*3+1]=PT.vel[i*3+1]*dr-PT.grav[i]*dt;PT.vel[i*3+2]*=dr;
    PT.pos[i*3]+=PT.vel[i*3]*dt;PT.pos[i*3+1]+=PT.vel[i*3+1]*dt;PT.pos[i*3+2]+=PT.vel[i*3+2]*dt;
    PT.col[i*4+3]=Math.min(1,k*2);PT.size[i]=PT.s0[i]*(0.4+0.6*k);}
  ptGeo.attributes.position.needsUpdate=true;ptGeo.attributes.aCol.needsUpdate=true;ptGeo.attributes.aSize.needsUpdate=true;
}

/* ===== 环境粒子：雪、花瓣、萤火 ===== */
const AN=coarse?110:200;
const AM={pos:new Float32Array(AN*3),col:new Float32Array(AN*4),size:new Float32Array(AN),seed:new Float32Array(AN),mode:0};
const amGeo=new THREE.BufferGeometry();
amGeo.setAttribute('position',new THREE.BufferAttribute(AM.pos,3));
amGeo.setAttribute('aCol',new THREE.BufferAttribute(AM.col,4));
amGeo.setAttribute('aSize',new THREE.BufferAttribute(AM.size,1));
const amMesh=new THREE.Points(amGeo,new THREE.ShaderMaterial({uniforms:ptU,vertexShader:PT_VS,fragmentShader:PT_FS,transparent:true,depthWrite:false}));
amMesh.frustumCulled=false;scene.add(amMesh);
(function(){for(let i=0;i<AN;i++){AM.pos[i*3]=(Math.random()-0.5)*56;AM.pos[i*3+1]=Math.random()*22;AM.pos[i*3+2]=(Math.random()-0.5)*56;AM.seed[i]=Math.random();}})();
const AMC=[[1,1,1],[1,0.72,0.84],[0.8,1,0.45],[1,0.97,0.8]];
/* mode: 0 雪 1 花瓣 2 萤火 3 飞絮 */
function updateAmbient(dt,t,cx,cy,cz,mode,strength){
  const c=AMC[mode];
  for(let i=0;i<AN;i++){const s=AM.seed[i];let x=AM.pos[i*3],y=AM.pos[i*3+1],z=AM.pos[i*3+2];
    if(mode===0){y-=(2.2+s*2)*dt;x+=Math.sin(t*0.7+s*40)*dt*1.2+dt*1.5;}
    else if(mode===1){y-=(0.7+s*0.7)*dt;x+=(1.6+Math.sin(t+s*30))*dt;z+=Math.cos(t*0.8+s*20)*dt*0.8;}
    else if(mode===2){y+=Math.sin(t*0.9+s*50)*dt*0.5;x+=Math.cos(t*0.5+s*33)*dt*0.7;z+=Math.sin(t*0.4+s*71)*dt*0.7;}
    else{y+=Math.sin(t*0.5+s*50)*dt*0.3-dt*0.1;x+=(0.8+s)*dt;z+=Math.sin(t*0.3+s*9)*dt*0.4;}
    const top=mode===2?5:22;
    if(y<-1)y+=top+1;else if(y>top)y-=top+1;
    if(x-cx>28)x-=56;else if(x-cx<-28)x+=56;
    if(z-cz>28)z-=56;else if(z-cz<-28)z+=56;
    AM.pos[i*3]=x;AM.pos[i*3+1]=y;AM.pos[i*3+2]=z;
    const tw=mode===2?(0.35+0.65*Math.max(0,Math.sin(t*2.2+s*60))):1;
    AM.col[i*4]=c[0];AM.col[i*4+1]=c[1];AM.col[i*4+2]=c[2];AM.col[i*4+3]=strength*tw*(mode===3?0.55:0.9);
    AM.size[i]=(mode===0?0.16:mode===1?0.2:mode===2?0.26:0.12)*(0.6+s*0.8);}
  amMesh.position.y=cy-(mode===2?1:6);
  amGeo.attributes.position.needsUpdate=true;amGeo.attributes.aCol.needsUpdate=true;amGeo.attributes.aSize.needsUpdate=true;
}

/* ===== 着色器特效：刀光、冲击环、法阵、火墙、光柱、穹顶、风带 ===== */
const ringGeo=(function(){const g=new THREE.RingGeometry(0.82,1,48);g.rotateX(-Math.PI/2);return g;})();
/* 极坐标 UV 的弧面：u 沿弧线，v 从内到外 */
function arcGeoP(r0,r1,span,seg){const n=seg+1,pos=new Float32Array(n*6),uv=new Float32Array(n*4),idx=[];
  for(let i=0;i<n;i++){const a=-span/2+span*i/seg,sx=Math.sin(a),cz=Math.cos(a);pos.set([sx*r0,0,cz*r0,sx*r1,0,cz*r1],i*6);uv.set([i/seg,0,i/seg,1],i*4);
    if(i<seg){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);return g;}
const arcGeoA=arcGeoP(0.9,2.6,2.7,28),arcGeoFull=arcGeoP(0.55,1,TAU,56),ringGeoP=arcGeoP(0.7,1,TAU,56);
const circleGeo=(function(){const g=new THREE.PlaneGeometry(2,2);g.rotateX(-Math.PI/2);return g;})();
const wallGeo=(function(){const g=new THREE.CylinderGeometry(1,1,1,40,1,true);g.translate(0,0.5,0);return g;})();
const coneWallGeo=(function(){const g=new THREE.CylinderGeometry(0.55,1,1,24,1,true);g.translate(0,0.5,0);return g;})();
const domeGeo=new THREE.SphereGeometry(1,36,14,0,TAU,0,Math.PI/2);
/* 螺旋风带 */
const helixGeo=(function(){const seg=64,n=seg+1,pos=new Float32Array(n*6),uv=new Float32Array(n*4),idx=[];
  for(let i=0;i<n;i++){const t=i/seg,a=t*TAU*2.2,r=1-t*0.35,y=t;pos.set([Math.cos(a)*r,y,Math.sin(a)*r,Math.cos(a)*r,y+0.09,Math.sin(a)*r],i*6);uv.set([t,0,t,1],i*4);
    if(i<seg){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);return g;})();
function fxMat(fs,vs){return new THREE.ShaderMaterial({uniforms:{uTime:windU.uTime,uCol:{value:C(0xffffff)},uCol2:{value:C(0xffffff)},uA:{value:1},uP:{value:1},uKind:{value:0}},
  vertexShader:vs||FX_VS,fragmentShader:fs,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});}
const FXS=[],FXDEF={arc:[arcGeoA,TRAIL_FS],arcF:[arcGeoFull,TRAIL_FS],ring:[ringGeoP,RING_FS],circle:[circleGeo,CIRCLE_FS],wall:[wallGeo,FLAME_FS],cone:[coneWallGeo,FLAME_FS],
  dome:[domeGeo,DOME_FS,DOME_VS],helix:[helixGeo,TRAIL_FS],twist:[wallGeo,TWIST_FS]};
const lighten=(hex,k)=>{tc2.set(hex);tc2.r+=(1-tc2.r)*k;tc2.g+=(1-tc2.g)*k;tc2.b+=(1-tc2.b)*k;return tc2;};
function fx(kind,x,y,z,hex,dur,o){let f=null;for(let i=0;i<FXS.length;i++)if(FXS[i].t<=0&&FXS[i].kind===kind){f=FXS[i];break;}
  if(!f){if(FXS.length>110)return null;const D=FXDEF[kind];f={m:new THREE.Mesh(D[0],fxMat(D[1],D[2])),kind:kind,t:0,U:null};f.U=f.m.material.uniforms;f.m.visible=false;f.m.renderOrder=2;f.m.frustumCulled=false;scene.add(f.m);FXS.push(f);}
  f.t=f.d=dur;f.o=o||{};f.delay=f.o.delay||0;f.U.uCol.value.set(hex);f.U.uCol2.value.copy(f.o.hex2!==undefined?tc2.set(f.o.hex2):lighten(hex,0.75));f.U.uA.value=0;f.U.uP.value=0;f.U.uKind.value=f.o.kind||0;
  f.m.position.set(x,y,z);f.m.rotation.set(f.o.rx||0,f.o.ry||0,f.o.rz||0);f.m.scale.set(1,1,1);f.m.visible=false;return f;}
function slashArc(x,y,z,face,dir,scale,hex){fx('arc',x,y,z,hex,0.26,{ry:face,rz:0.25*dir,s:scale,dir:dir});}
function slashFull(x,y,z,R,hex,dur,tilt){fx('arcF',x,y,z,hex,dur||0.35,{s:R,rz:tilt||0,ry:Math.random()*TAU,dir:1});}
function shockRing(x,y,z,r,hex,dur){fx('ring',x,y,z,hex,dur||0.5,{s0:0.3,s1:r});}
function magicCircle(x,y,z,R,kind,hex,dur,follow){return fx('circle',x,y+0.14,z,hex,dur,{s:R,kind:kind,follow:follow});}
function fireWall(x,y,z,R0,R1,h,hex,hex2,dur,delay){fx('wall',x,y,z,hex,dur,{s0:R0,s1:R1,h:h,hex2:hex2,kind:Math.max(4,Math.round(R1*2.2)),delay:delay});}
function pillar(x,y,z,r,h,hex,dur,delay){fx('cone',x,y,z,hex,dur||0.5,{s0:r,s1:r*0.45,h:h,kind:5,delay:delay,hex2:lighten(hex,0.6).getHex()});}
function dome(x,y,z,R,hex,dur){fx('dome',x,y,z,hex,dur,{s:R});}
function helix(x,y,z,R,h,hex,dur,delay,spin){fx('helix',x,y,z,hex,dur,{s:R,h:h,delay:delay,spin:spin||7});}
function updateFx(dt){
  const dim=0.62+0.38*DN.night; /* 白天背景亮，叠加特效要收一点才不会糊成一片白 */
  for(let i=0;i<FXS.length;i++){const f=FXS[i];if(f.t<=0)continue;if(f.delay>0){f.delay-=dt;continue;}
    f.t-=dt;if(f.t<=0){f.m.visible=false;continue;}f.m.visible=true;const o=f.o,e=f.d-f.t,k=e/f.d,ease=1-(1-k)*(1-k),U=f.U,m=f.m;
    if(f.kind==='arc'||f.kind==='arcF'){const s=o.s*(0.9+0.25*ease);m.scale.set(s*(o.dir||1),s,s);U.uP.value=k*1.9;U.uA.value=Math.min(1,f.t/f.d*2.2);}
    else if(f.kind==='ring'){const s=lerp(o.s0,o.s1,ease);m.scale.set(s,1,s);U.uA.value=(1-k)*0.95;}
    else if(f.kind==='circle'){m.scale.set(o.s,1,o.s);U.uP.value=Math.min(1.15,e/0.3*1.15);U.uA.value=Math.min(1,f.t/0.35)*0.85*dim;if(o.follow)m.position.set(o.follow.x,o.follow.y+0.14,o.follow.z);}
    else if(f.kind==='wall'||f.kind==='cone'){const r=lerp(o.s0,o.s1,ease);m.scale.set(r,o.h*(0.5+0.5*Math.min(1,e/0.12)),r);U.uA.value=Math.pow(1-k,0.6)*(f.kind==='cone'?0.5:0.8)*dim;U.uP.value=i*1.7;}
    else if(f.kind==='dome'){const s=o.s*Math.min(1,0.2+e/0.25);m.scale.set(s,s,s);U.uA.value=Math.min(1,e/0.2,f.t/0.5)*dim;}
    else if(f.kind==='helix'){m.scale.set(o.s,o.h,o.s);m.rotation.y+=dt*o.spin;U.uP.value=k*2;U.uA.value=Math.min(1,f.t/f.d*2.5);}
    else if(f.kind==='twist'){U.uA.value=o.a===undefined?1:o.a;}
  }
}
/* 星芒：命中和暴击时的十字闪光 */
const starTex=(function(){const cv=document.createElement('canvas');cv.width=cv.height=128;const x=cv.getContext('2d');
  if(x&&x.createRadialGradient){x.translate(64,64);for(let k=0;k<4;k++){x.rotate(Math.PI/4);const L=k%2?60:34,g=x.createLinearGradient(-L,0,L,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(0.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g;x.beginPath();x.moveTo(-L,0);x.quadraticCurveTo(0,k%2?5:3,L,0);x.quadraticCurveTo(0,k%2?-5:-3,-L,0);x.fill();}
    const g=x.createRadialGradient(0,0,0,0,0,26);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(-26,-26,52,52);}
  return new THREE.CanvasTexture(cv);})();
const stars=[];
function star(x,y,z,hex,size,dur){let f=null;for(let i=0;i<stars.length;i++)if(stars[i].t<=0){f=stars[i];break;}
  if(!f){if(stars.length>30)return;f={s:new THREE.Sprite(new THREE.SpriteMaterial({map:starTex,color:hex,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true})),t:0};f.s.visible=false;f.s.renderOrder=5;scene.add(f.s);stars.push(f);}
  f.s.material.color.set(hex);f.s.material.rotation=Math.random()*1.5;f.t=f.d=dur||0.22;f.size=size;f.s.position.set(x,y,z);f.s.visible=true;f.s.scale.set(size*0.3,size*0.3,1);}
/* 剑刃拖尾：记下最近十几帧剑身的位置，连成一条带子 */
const RB={N:16,hist:[],live:false,pos:null,al:null,m:null,U:null};
(function(){const N=RB.N,pos=RB.pos=new Float32Array(N*6),al=RB.al=new Float32Array(N*2),idx=[];for(let i=0;i<N-1;i++){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aA',new THREE.BufferAttribute(al,1));g.setIndex(idx);
  RB.U={uCol:{value:C(0xffffff)}};RB.m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:RB.U,vertexShader:RIB_VS,fragmentShader:RIB_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
  RB.m.frustumCulled=false;RB.m.renderOrder=3;RB.m.visible=false;scene.add(RB.m);for(let i=0;i<N;i++)RB.hist.push([0,0,0,0,0,0,0]);})();
function ribbonStep(dt,blade,on,hex){
  if(!blade||!blade.localToWorld)return;const N=RB.N,H0=RB.hist;
  if(on){blade.updateMatrixWorld(true);tv.set(0,0.2,0);blade.localToWorld(tv);tv2.set(0,1.12,0);blade.localToWorld(tv2);
    if(!RB.live){for(let i=0;i<N;i++){const h=H0[i];h[0]=tv.x;h[1]=tv.y;h[2]=tv.z;h[3]=tv2.x;h[4]=tv2.y;h[5]=tv2.z;h[6]=0;}}
    const last=H0.pop();last[0]=tv.x;last[1]=tv.y;last[2]=tv.z;last[3]=tv2.x;last[4]=tv2.y;last[5]=tv2.z;last[6]=1;H0.unshift(last);RB.U.uCol.value.set(hex);}
  RB.live=on;let any=false;
  for(let i=0;i<N;i++){const h=H0[i];h[6]=Math.max(0,h[6]-dt*(on?3.4:6));if(h[6]>0)any=true;RB.pos.set([h[0],h[1],h[2],h[3],h[4],h[5]],i*6);const a=h[6]*(1-i/N);RB.al[i*2]=a*0.15;RB.al[i*2+1]=a;}
  RB.m.visible=any;if(any){RB.m.geometry.attributes.position.needsUpdate=true;RB.m.geometry.attributes.aA.needsUpdate=true;}
}
function speedLines(css){const e=document.getElementById('lines');if(!e)return;e.style.setProperty('--lc',css||'#fff');e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}

/* ===== 技能特效：闪光、地刺、光柱、残影、延时 ===== */
const flashes=[];
function flash(x,y,z,hex,size,dur){let f=null;for(let i=0;i<flashes.length;i++)if(flashes[i].t<=0){f=flashes[i];break;}
  if(!f){if(flashes.length>40)return;f={s:glowSprite(hex,1,1),t:0,d:1,size:1};f.s.visible=false;scene.add(f.s);flashes.push(f);}
  f.s.material.color.set(hex);f.t=f.d=dur||0.25;f.size=size;f.s.position.set(x,y,z);f.s.scale.set(size,size,1);f.s.visible=true;}
const spikeGeoFx=(function(){const g=new THREE.ConeGeometry(1,1,5);g.translate(0,0.5,0);return g;})();
const iceSpikeMat=new THREE.MeshPhongMaterial({color:0xd6f4ff,shininess:110,specular:0xffffff,transparent:true,opacity:0.88,emissive:0x2a6a9a,emissiveIntensity:0.35});
const spikes=[];
/* kind: 0 冰棱（实体） 1 光焰（发光） */
function spikeFx(x,y,z,h,r,kind,hex,dur,delay,tx,tz){let s=null;for(let i=0;i<spikes.length;i++)if(spikes[i].t<=0&&spikes[i].kind===kind){s=spikes[i];break;}
  if(!s){if(spikes.length>150)return;s={m:new THREE.Mesh(spikeGeoFx,kind?glowy(hex,0.85):iceSpikeMat),kind:kind,t:0};s.m.visible=false;if(kind)s.m.renderOrder=2;scene.add(s.m);spikes.push(s);}
  if(kind)s.m.material.color.set(hex);s.t=s.d=dur;s.delay=delay||0;s.h=h;s.r=r;s.m.position.set(x,y-0.1,z);s.m.rotation.set(tx||0,Math.random()*TAU,tz||0);s.m.scale.set(r,0.01,r);s.m.visible=false;}
function spikeRing(x,z,R,n,h,r,kind,hex,dur,stagger,lean){
  for(let i=0;i<n;i++){const a=i/n*TAU+Math.random()*0.3,px=x+Math.cos(a)*R,pz=z+Math.sin(a)*R,gy=Math.max(groundH(px,pz),WATER);
    spikeFx(px,gy,pz,h*(0.7+Math.random()*0.6),r*(0.8+Math.random()*0.4),kind,hex,dur,i*(stagger||0),Math.sin(a)*(lean||0.3),-Math.cos(a)*(lean||0.3));}}
const streakGeo=(function(){const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})();
const streaks=[];
function streak(x0,z0,x1,z1,y,w,hex,dur){let s=null;for(let i=0;i<streaks.length;i++)if(streaks[i].t<=0){s=streaks[i];break;}
  if(!s){if(streaks.length>12)return;s={m:new THREE.Mesh(streakGeo,glowy(hex,0.8)),t:0};s.m.visible=false;s.m.renderOrder=2;scene.add(s.m);streaks.push(s);}
  const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz)||0.01;s.m.material.color.set(hex);s.t=s.d=dur||0.35;s.w=w;s.l=l;
  s.m.position.set((x0+x1)/2,y,(z0+z1)/2);s.m.rotation.set(0,Math.atan2(dx,dz),0);s.m.scale.set(w,1,l);s.m.visible=true;}
const laters=[];
function later(sec,fn){laters.push({t:sec,fn:fn});}
let freezeT=0;
function hitStop(sec){freezeT=Math.max(freezeT,sec);}
function screenFlash(css){const e=document.getElementById('flash');if(!e)return;e.style.background=css||'#fff';e.classList.remove('on');void e.offsetWidth;e.classList.add('on');}
function updateFx2(dt){
  for(let i=0;i<flashes.length;i++){const f=flashes[i];if(f.t<=0)continue;f.t-=dt;if(f.t<=0){f.s.visible=false;continue;}const k=f.t/f.d,s=f.size*(1.3-0.5*k);f.s.scale.set(s,s,1);f.s.material.opacity=k;}
  for(let i=0;i<spikes.length;i++){const s=spikes[i];if(s.t<=0)continue;if(s.delay>0){s.delay-=dt;continue;}
    s.t-=dt;if(s.t<=0){s.m.visible=false;continue;}s.m.visible=true;const e=s.d-s.t,up=Math.min(1,e/0.12),down=Math.min(1,s.t/0.3),k=(1-(1-up)*(1-up))*down;
    s.m.scale.set(s.r*(0.6+0.4*down),Math.max(0.01,s.h*k*(1+0.15*Math.max(0,1-e/0.25))),s.r*(0.6+0.4*down));if(s.kind)s.m.material.opacity=0.85*down;}
  for(let i=0;i<stars.length;i++){const f=stars[i];if(f.t<=0)continue;f.t-=dt;if(f.t<=0){f.s.visible=false;continue;}const k=1-f.t/f.d,sc=f.size*(0.3+0.7*Math.sin(Math.min(1,k*1.6)*Math.PI*0.5));f.s.scale.set(sc,sc,1);f.s.material.opacity=1-k*k;f.s.material.rotation+=dt*2;}
  for(let i=0;i<streaks.length;i++){const s=streaks[i];if(s.t<=0)continue;s.t-=dt;if(s.t<=0){s.m.visible=false;continue;}const k=s.t/s.d;s.m.scale.set(s.w*k,1,s.l);s.m.material.opacity=0.85*k;}
  for(let i=laters.length-1;i>=0;i--){const l=laters[i];l.t-=dt;if(l.t<=0){laters.splice(i,1);l.fn();}}
}
