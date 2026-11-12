/* ===== 场景小物：灌木、木箱陶罐、篝火营帐、弹跳菇、遗迹、石灯、风车、芦苇、蘑菇、飞鸟、试炼碑 ===== */
const props=[],fires=[],shrooms=[],lamps=[],mills=[],flocks=[];
const bushGeo=blobGeo(0.8,0,0.5,0,0.75,9),bushMats=[toon(0x4fae4a),toon(0x6dc350),toon(0x3f9a5a)],berryMats=[basic(0xff5a6e),basic(0xffd84d),basic(0xc7a8ff)];
function addBush(x,z,v){const y=groundH(x,z),g=new THREE.Group(),s=0.8+v*0.6,mat=bushMats[Math.floor(v*30)%3];g.position.set(x,y,z);g.rotation.y=v*20;
  part(g,bushGeo,mat,0,0,0,1,1,1,0.025);part(g,bushGeo,mat,0.6,-0.08,0.2,0.68,0.68,0.68,0.025);part(g,bushGeo,mat,-0.5,-0.1,-0.3,0.6,0.6,0.6,0.025);
  const bm=berryMats[Math.floor(v*70)%3];for(let i=0;i<5;i++){const a=i*1.9+v*9;part(g,SPH,bm,Math.cos(a)*0.55,0.55+Math.sin(i*2.3)*0.3,Math.sin(a)*0.55,0.07,0.07,0.07,0);}
  g.scale.setScalar(s);scene.add(g);props.push({kind:'bush',x:x,y:y,z:z,r:0.95*s,g:g,alive:true,t:0,s:s});}
const potGeo=lathe([[0,0],[0.3,0.02],[0.46,0.3],[0.44,0.62],[0.28,0.84],[0.26,0.92],[0.34,0.98]],12),potMat=toon(0xc98a5a,{side:THREE.DoubleSide}),potBand=toon(0x3d8f8a);
function addCrate(x,z,v){const y=groundH(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=v*9;
  if(v>0.5){part(g,potGeo,potMat,0,0,0,1,1,1,0.025);const b=part(g,new THREE.TorusGeometry(0.455,0.035,5,14),potBand,0,0.46,0,1,1,1,0);b.rotation.x=Math.PI/2;}
  else{part(g,BOX,woodMat,0,0.42,0,0.84,0.84,0.84,true);[0.42,-0.42].forEach(q=>{part(g,BOX,toon(0x6b4326),0,0.42+q*0.86,0,0.9,0.1,0.9,0);part(g,BOX,toon(0x6b4326),q*0.86,0.42,0,0.1,0.9,0.9,0);});part(g,BOX,goldMat,0,0.42,0.43,0.2,0.2,0.04,0);}
  scene.add(g);props.push({kind:'crate',x:x,y:y,z:z,r:0.6,g:g,alive:true,t:0,s:1,col:addCol(x,z,0.5)});}
function addFire(x,z,tent){const y=groundH(x,z),g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  for(let i=0;i<7;i++){const a=i*TAU/7;part(g,rockGeo,stoneA,Math.cos(a)*0.8,0.1,Math.sin(a)*0.8,0.24,0.18,0.24,0);}
  [0.5,-0.6,1.7].forEach(r=>{const l=part(g,CYL,woodMat,0,0.16,0,0.09,1.1,0.09,0);l.rotation.set(Math.PI/2-0.25,r,0);});
  const fl=pivot(g,0,0.15,0);[[0,0,0.3,0.95,0xff7a2a],[0.16,0.06,0.2,0.62,0xffa63a],[-0.14,-0.1,0.2,0.7,0xffa63a],[0,0.03,0.14,0.55,0xfff0a0]].forEach(a=>part(fl,CONE,basic(a[4]),a[0],a[3]/2,a[1],a[2],a[3],a[2],0));
  const gl=glowSprite(0xff9a3a,5,0.7);gl.position.y=0.8;g.add(gl);fires.push({x:x,y:y,z:z,fl:fl,gl:gl,t:0});
  if(tent){const tx=x+tent[0],tz=z+tent[1],ty=groundH(tx,tz),tg=new THREE.Group();tg.position.set(tx,ty,tz);tg.rotation.y=Math.atan2(-tent[0],-tent[1])+Math.PI/4;scene.add(tg);
    const cv=toon(tent[2]);part(tg,CONE4,cv,0,1.25,0,2.2,2.5,2.2,0.03);part(tg,CONE4,toon(0xf6f0dc),0,2.2,0,0.75,0.7,0.75,0);
    part(tg,BOX,toon(0x2b2236),0.78,0.6,0.78,0.7,1.2,0.05,0).rotation.y=Math.PI/4;
    part(tg,CYL,woodMat,0,2.9,0,0.04,1.2,0.04,0);const fg=pivot(tg,0,3.3,0);part(fg,BOX,toon(tent[2]),0.3,0,0,0.6,0.32,0.03,true);addCol(tx,tz,1.7);}
}
const capGeoS=lathe([[1.3,0],[1.34,0.12],[1.1,0.5],[0.6,0.8],[0,0.9]],16);
function addShroom(x,z,v){const y=groundH(x,z),g=new THREE.Group(),s=0.9+v*0.4;g.position.set(x,y,z);scene.add(g);
  part(g,cylG(0.36,0.5),toon(0xf7efdc),0,0.55,0,1,1.1,1,0.025);const cap=pivot(g,0,1.05,0);
  part(cap,capGeoS,toon(v>0.5?0xf0604a:0xf2a04a),0,0,0,1,1,1,0.03);part(cap,blobShadowGeo,toon(0xf7e3c8,{side:THREE.DoubleSide}),0,0.01,0,1.28,1,1.28,0);
  for(let i=0;i<7;i++){const a=i*0.9+v*5,r=0.35+(i%3)*0.3;part(cap,SPH,basic(0xfff7e6),Math.cos(a)*r,0.86-r*r*0.42,Math.sin(a)*r,0.13,0.05,0.13,0);}
  g.scale.setScalar(s);shrooms.push({x:x,z:z,y:y,top:y+1.9*s,r:1.3*s,cap:cap,sq:0});addCol(x,z,0.4*s).yMin=-1e9;}
function addLamp(x,z){const y=groundH(x,z),g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  part(g,cylG(0.2,0.3),stoneB,0,0.2,0,1,0.4,1,0);part(g,cylG(0.1,0.12),stoneA,0,0.9,0,1,1.1,1,0);part(g,BOX,stoneB,0,1.52,0,0.5,0.1,0.5,0);
  const lm=basic(0xffe2a0);part(g,BOX,lm,0,1.78,0,0.34,0.4,0.34,0);[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(q=>part(g,BOX,stoneB,q[0]*0.18,1.78,q[1]*0.18,0.06,0.42,0.06,0));
  part(g,CONE4,stoneB,0,2.14,0,0.44,0.3,0.44,0).rotation.y=Math.PI/4;const gl=glowSprite(0xffc870,4.5,0);gl.position.y=1.8;g.add(gl);lamps.push({gl:gl,m:lm});addCol(x,z,0.3);}
function addMill(x,z){const y=groundH(x,z),g=new THREE.Group();g.position.set(x,y-0.3,z);g.rotation.y=x;scene.add(g);
  part(g,lathe([[1.9,0],[1.7,1.5],[1.25,5.2],[1.1,6.4]],12),toon(0xf3ead8),0,0,0,1,1,1,0.03);part(g,CONE,toon(0xd0584a),0,7.2,0,1.5,1.7,1.5,0.03);
  part(g,BOX,woodMat,0,1.1,1.78,0.8,1.7,0.1,0);[[0.6,3.6],[-0.5,5]].forEach(q=>part(g,BOX,toon(0x7fc4e8),q[0],q[1],1.42-q[1]*0.06,0.45,0.55,0.08,0));
  const hub=pivot(g,0,6.1,1.5);part(hub,CYL,woodMat,0,0,-0.2,0.16,0.7,0.16,0).rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const b=pivot(hub,0,0,0);b.rotation.z=i*Math.PI/2;part(b,BOX,woodMat,0,2.2,0,0.12,4.4,0.08,0);part(b,BOX,toon(0xfbf3df),0.5,2.6,0,0.9,3.2,0.04,true);}
  mills.push(hub);addCol(x,z,2);}
function addRuin(x,z,r){const n=4+Math.floor(r()*3),R=3.4+r()*1.6;let prev=null;
  for(let i=0;i<n;i++){const a=i*TAU/n+r(),px=x+Math.cos(a)*R,pz=z+Math.sin(a)*R,y=groundH(px,pz);if(y<0.8){prev=null;continue;}const h=1.2+r()*3.6,g=new THREE.Group();g.position.set(px,y-0.3,pz);scene.add(g);
    part(g,BOX,stoneB,0,0.25,0,1.3,0.5,1.3,0).receiveShadow=true;part(g,cylG(0.42,0.48),stoneA,0,0.5+h/2,0,1,h,1,0);
    if(h>3.6){part(g,BOX,stoneB,0,0.6+h,0,1.2,0.3,1.2,0);if(prev&&prev.h>3.6){const mx=(px+prev.x)/2,mz=(pz+prev.z)/2,l=part(scene,BOX,stoneA,mx,Math.max(y,prev.y)+h+0.75,mz,Math.hypot(px-prev.x,pz-prev.z)+1,0.5,0.9,0);l.rotation.y=-Math.atan2(pz-prev.z,px-prev.x);}}
    else{const top=part(g,rockGeo,stoneA,0,0.5+h,0,0.45,0.3,0.45,0);top.rotation.set(r(),r()*3,r());}
    if(r()<0.5)part(g,SPH,bushMats[1],0.3,0.5+h*r()*0.6,0.3,0.3,0.14,0.3,0);
    addCol(px,pz,0.6);prev={x:px,z:pz,y:y,h:h};}
  const y=groundH(x,z);for(let i=0;i<4;i++){const d=part(scene,rockGeo,stoneB,x+(r()-0.5)*5,y+0.1,z+(r()-0.5)*5,0.5,0.3,0.6,0);d.rotation.y=r()*6;}}
(function(){
  const r=rngOf(5151);
  let n=0;for(let i=0;i<4000&&n<80;i++){const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);if(h<2||h>32||forestN(x,z)>0.62||slopeAt(x,z)>0.6||nearSite(x,z,2))continue;addBush(x,z,r());n++;}
  const tents=[0xe8503a,0x2fa69b,0xf2c14e,0x6a55b8,0x3d8fd0];
  CAMPS.forEach((c,i)=>{addFire(c.x+3.2,c.z+2,[-5.5,-2.5,tents[i]]);for(let k=0;k<3;k++){const a=k*1.1+i*2+2.4;addCrate(c.x+Math.cos(a)*6.3,c.z+Math.sin(a)*6.3,r());}addLamp(c.x-2.5,c.z+6.5);});
  addFire(SPAWN.x+3.5,SPAWN.z-3.5,null);addCrate(SPAWN.x+5.5,SPAWN.z+1.5,0.2);addCrate(SPAWN.x+5,SPAWN.z+3,0.8);addLamp(SPAWN.x-4,SPAWN.z-4);addLamp(SPAWN.x-5,SPAWN.z+4);
  addShroom(SPAWN.x-13,SPAWN.z-9,0.7);
  n=0;for(let i=0;i<4000&&n<14;i++){const x=(r()*2-1)*WORLD_R*0.9,z=(r()*2-1)*WORLD_R*0.9,h=groundH(x,z);if(h<3||h>44||slopeAt(x,z)>0.5||nearSite(x,z,6))continue;addShroom(x,z,r());if(r()<0.6)addShroom(x+3+r()*2,z+2-r()*4,r());n++;}
  n=0;const ru=[];for(let i=0;i<4000&&n<8;i++){const x=(r()*2-1)*WORLD_R*0.85,z=(r()*2-1)*WORLD_R*0.85,h=groundH(x,z);if(h<3||h>40||slopeAt(x,z)>0.35||nearSite(x,z,12)||ru.some(q=>Math.hypot(q[0]-x,q[1]-z)<90))continue;ru.push([x,z]);addRuin(x,z,r);n++;}
  [[205,10],[10,115],[-240,60],[90,-120]].forEach(a=>{const p=nearLand(a[0],a[1]);if(!nearSite(p[0],p[1],6))addMill(p[0],p[1]);});
  /* 水边的芦苇、林间的小蘑菇 */
  function inst(geo,list,sc){const m=new THREE.InstancedMesh(geo,new THREE.MeshLambertMaterial({vertexColors:true}),Math.max(1,list.length));m.count=list.length;
    list.forEach((t,i)=>{dummy.position.set(t[0],t[1],t[2]);dummy.rotation.set((t[3]-0.5)*0.3,t[3]*20,(t[3]-0.5)*0.3);dummy.scale.setScalar(sc*(0.7+t[3]*0.7));dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});m.frustumCulled=false;scene.add(m);}
  const reedG=(function(){const p=[];[[0,0],[0.12,0.05],[-0.1,0.1],[0.03,-0.13]].forEach((o,i)=>{const s=new THREE.CylinderGeometry(0.015,0.022,1.5-i*0.2,4);s.translate(o[0],0.75-i*0.1,o[1]);p.push({g:s,c:C(0x7fae4e)});
      const t=new THREE.CylinderGeometry(0.045,0.045,0.3,5);t.translate(o[0],1.5-i*0.2,o[1]);p.push({g:t,c:C(0x7a4a2a)});});return mergeGeos(p);})();
  const reeds=[];for(let i=0;i<30000&&reeds.length<(coarse?260:420);i++){const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);if(h<-0.45||h>0.5||(lake(x,z)<0.08&&r()>0.25))continue;reeds.push([x,Math.max(h,-0.2)-0.1,z,r()]);}
  inst(reedG,reeds,1);
  const musG=(function(){const s=new THREE.CylinderGeometry(0.05,0.07,0.26,5);s.translate(0,0.13,0);const c=new THREE.SphereGeometry(0.17,7,5,0,TAU,0,1.6);c.translate(0,0.24,0);
    const s2=new THREE.CylinderGeometry(0.035,0.05,0.16,5);s2.translate(0.2,0.08,0.1);const c2=new THREE.SphereGeometry(0.11,6,4,0,TAU,0,1.6);c2.translate(0.2,0.15,0.1);
    return mergeGeos([{g:s,c:C(0xf5ead6)},{g:c,c:C(0xe8604a)},{g:s2,c:C(0xf5ead6)},{g:c2,c:C(0xf2b445)}]);})();
  const mus=[];for(let i=0;i<20000&&mus.length<(coarse?200:340);i++){const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);if(h<2||h>40||forestN(x,z)<0.5)continue;mus.push([x,h,z,r()]);}
  inst(musG,mus,1.3);
  /* 鸟群 */
  const birdM=toon(0x4a5568),birdW=toon(0xf2f2ea,{side:THREE.DoubleSide});
  n=0;for(let i=0;i<3000&&n<7;i++){const x=(r()*2-1)*WORLD_R*0.85,z=(r()*2-1)*WORLD_R*0.85,h=groundH(x,z);if(h<2.5||h>28||forestN(x,z)>0.5||nearSite(x,z,10))continue;n++;
    const f={x:x,z:z,fly:0,t:r()*9,b:[]};for(let k=0;k<5;k++){const g=new THREE.Group();part(g,SPH,birdM,0,0.12,0,0.09,0.09,0.16,0);part(g,CONE,toon(0xf2a04a),0,0.13,0.18,0.03,0.08,0.03,0).rotation.x=Math.PI/2;
        const wl=pivot(g,0.05,0.14,0),wr=pivot(g,-0.05,0.14,0);part(wl,BOX,birdW,0.17,0,0,0.34,0.015,0.16,0);part(wr,BOX,birdW,-0.17,0,0,0.34,0.015,0.16,0);
        scene.add(g);f.b.push({g:g,wl:wl,wr:wr,ox:(r()-0.5)*5,oz:(r()-0.5)*5,ph:r()*6,p:new V3(x,h,z)});}
    flocks.push(f);}
})();
/* 试炼碑 */
const trials=TRIALS.map((s,i)=>{const g=new THREE.Group();g.position.set(s.x,s.y,s.z);scene.add(g);
  part(g,BOX,stoneB,0,0.2,0,2.4,0.4,1.6,0);part(g,BOX,stoneA,0,1.9,0,1.3,3,0.5,0);part(g,CONE4,stoneA,0,3.7,0,0.9,0.7,0.36,0).rotation.y=Math.PI/4;
  const rm=basic(0xc59bff),rune=part(g,new THREE.TorusGeometry(0.34,0.05,6,6),rm,0,2.2,0.27,1,1,1,0);part(g,octGeo,rm,0,2.2,0.27,0.12,0.2,0.05,0);part(g,BOX,rm,0,1.2,0.26,0.5,0.06,0.02,0);
  const gl=glowSprite(0xb060ff,5,0.5);gl.position.set(0,2.2,0.4);g.add(gl);
  const ring=new THREE.Mesh(ringGeo,glowy(0xb060ff,0.35));ring.position.set(s.x,s.y+0.12,s.z);ring.scale.set(8.5,1,8.5);ring.renderOrder=1;scene.add(ring);
  addCol(s.x,s.z,1.1);addLamp(s.x+4,s.z-5);
  return {id:i,x:s.x,y:s.y,z:s.z,state:0,wave:0,foes:[],rm:rm,gl:gl,ring:ring,rune:rune,chest:addChest(s.x+2.6,s.y,s.z+2.2,true),t:0};});
function hitProps(x,z,r,y){let any=false;
  for(let i=0;i<props.length;i++){const p=props[i];if(!p.alive)continue;const dx=p.x-x,dz=p.z-z;if(dx*dx+dz*dz<(r+p.r)*(r+p.r)&&Math.abs((y===undefined?p.y:y)-p.y)<3.5){breakProp(p);any=true;}}
  return any;}
function breakProp(p){p.alive=false;p.g.visible=false;p.t=90;if(p.col)p.col.on=false;
  if(p.kind==='bush'){burst(p.x,p.y+0.6,p.z,16,4,0x7ddc6a,0.4,0.7,2,7);sfx('rustle');}else{burst(p.x,p.y+0.5,p.z,16,5,0xc9a27a,0.45,0.6,3,12);sfx('crack');}
  if(H.hp<H.maxHp&&Math.random()<(p.kind==='crate'?0.6:0.25))heal(1,p.x,p.y+0.6,p.z);else{addEnergy(p.kind==='crate'?10:3);for(let k=0;k<4;k++)spark(p.x,p.y+0.6,p.z,(Math.random()-0.5)*3,3+Math.random()*2,(Math.random()-0.5)*3,0.7,0.34,0xffe27a,5,1);}}
function updateProps(dt,t){
  const hx=H.p.x,hz=H.p.z;
  for(let i=0;i<props.length;i++){const p=props[i];if(p.alive)continue;p.t-=dt;if(p.t<=0&&Math.hypot(p.x-hx,p.z-hz)>60){p.alive=true;p.g.visible=true;if(p.col)p.col.on=true;}}
  for(let i=0;i<fires.length;i++){const f=fires[i],d=Math.hypot(f.x-hx,f.z-hz);if(d>130)continue;f.fl.scale.set(1+Math.sin(t*13+i)*0.08,1+Math.sin(t*17+i)*0.16,1+Math.cos(t*11+i)*0.08);f.gl.material.opacity=0.55+0.15*Math.sin(t*9+i);
    if(d<60&&Math.random()<dt*10)spark(f.x+(Math.random()-0.5)*0.4,f.y+0.8,f.z+(Math.random()-0.5)*0.4,(Math.random()-0.5)*0.6,1.8+Math.random()*1.5,(Math.random()-0.5)*0.6,1.1,0.22,0xffb050,-0.6,0.4);
    if(d<4.2&&started&&!H.dead&&Math.abs(H.p.y-f.y)<3){hint('fire','在篝火旁歇一会儿，会慢慢恢复生命');f.t+=dt;if(f.t>1.8){f.t=0;if(H.hp<H.maxHp)heal(1);}}}
  for(let i=0;i<shrooms.length;i++){const s=shrooms[i];s.sq=Math.max(0,s.sq-dt*3);const k=1-Math.sin(s.sq*Math.PI)*0.35*s.sq;s.cap.scale.set(1+(1-k)*0.5,k,1+(1-k)*0.5);
    if(started&&!H.dead&&H.vy<=0.1&&Math.hypot(s.x-hx,s.z-hz)<s.r&&H.p.y<s.top+0.5&&H.p.y>s.top-1.5&&H.dashT<=0){H.p.y=s.top;H.vy=I.jumpHeld?24:19;H.grounded=false;H.jumps=1;H.air=1;H.glide=false;s.sq=1;
      shockRing(s.x,s.top,s.z,2.4,0xffe2c0,0.35);burst(s.x,s.top,s.z,10,3,0xfff0d8,0.35,0.5,2,4);sfx('boing');hint('shroom','大蘑菇会把你弹上天。按住跳跃键弹得更高');}}
  const nt=DN.night;for(let i=0;i<lamps.length;i++){lamps[i].gl.material.opacity=nt*0.75*(0.9+0.1*Math.sin(t*3+i));lamps[i].m.color.setHex(nt>0.4?0xffe2a0:0x8a8478);}
  for(let i=0;i<mills.length;i++)mills[i].rotation.z=t*0.5+i;
  for(let i=0;i<flocks.length;i++){const f=flocks[i],d=Math.hypot(f.x-hx,f.z-hz);if(d>150){if(f.b[0].g.visible)f.b.forEach(b=>{b.g.visible=false;});continue;}
    f.t+=dt;if(f.fly<=0&&d<10&&started){f.fly=16;sfx('flap');}if(f.fly>0)f.fly-=dt;
    for(let k=0;k<f.b.length;k++){const b=f.b[k];b.g.visible=true;let tx,ty,tz,sp;
      if(f.fly>2.5){const a=f.t*0.7+k*1.26;tx=f.x+Math.cos(a)*(9+k);tz=f.z+Math.sin(a)*(9+k);ty=Math.max(groundH(tx,tz),WATER)+8+Math.sin(f.t+k)*1.2;sp=3.2;}
      else{tx=f.x+b.ox;tz=f.z+b.oz;ty=groundH(tx,tz);sp=f.fly>0?2.4:6;}
      const ox=tx-b.p.x,oy=ty-b.p.y,oz=tz-b.p.z,l=Math.hypot(ox,oy,oz),air=b.p.y-groundH(b.p.x,b.p.z)>0.15;
      if(l>0.05){const s=Math.min(1,dt*sp*(l>3?0.6:1.2));b.p.x+=ox*s;b.p.y+=oy*s;b.p.z+=oz*s;if(l>0.3)b.g.rotation.y=Math.atan2(ox,oz);}
      b.g.position.copy(b.p);const w=air?Math.sin(t*22+b.ph)*0.9:0.15;b.wl.rotation.z=w;b.wr.rotation.z=-w;
      if(!air)b.g.position.y+=Math.max(0,Math.sin(t*6+b.ph))*0.06;}}
}
