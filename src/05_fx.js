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

/* ===== 刀光与冲击环 ===== */
const arcGeo=(function(){const g=new THREE.RingGeometry(1.1,2.5,24,1,-Math.PI/2-1.15,2.3);g.rotateX(-Math.PI/2);return g;})();
const ringGeo=(function(){const g=new THREE.RingGeometry(0.82,1,48);g.rotateX(-Math.PI/2);return g;})();
const fxs=[];
function fxMesh(geo,hex){for(let i=0;i<fxs.length;i++){const f=fxs[i];if(f.t<=0&&f.m.geometry===geo){f.m.material.color.set(hex);return f;}}
  const f={m:new THREE.Mesh(geo,glowy(hex,1)),t:0,d:1,kind:0,s0:1,s1:1,r0:0,r1:0};f.m.visible=false;f.m.renderOrder=2;scene.add(f.m);fxs.push(f);return f;}
function slashArc(x,y,z,face,dir,scale,hex){const f=fxMesh(arcGeo,hex);f.t=f.d=0.2;f.kind=0;f.s0=scale*0.85;f.s1=scale*1.2;f.r0=face-0.7*dir;f.r1=face+0.5*dir;
  f.m.position.set(x,y,z);f.m.rotation.set(0,f.r0,0.25*dir);f.m.visible=true;}
function shockRing(x,y,z,r,hex,dur){const f=fxMesh(ringGeo,hex);f.t=f.d=dur||0.5;f.kind=1;f.s0=0.3;f.s1=r;f.m.position.set(x,y,z);f.m.rotation.set(0,0,0);f.m.visible=true;}
function updateFx(dt){for(let i=0;i<fxs.length;i++){const f=fxs[i];if(f.t<=0)continue;f.t-=dt;
  if(f.t<=0){f.m.visible=false;continue;}const k=1-f.t/f.d,s=lerp(f.s0,f.s1,1-(1-k)*(1-k));
  f.m.scale.set(s,1,s);f.m.material.opacity=(1-k)*0.9;if(f.kind===0)f.m.rotation.y=lerp(f.r0,f.r1,k);}}
