/* ===== 碰撞体 ===== */
const colliders=new Map(),CG=12;
function addCol(x,z,r){const k=Math.floor(x/CG)+','+Math.floor(z/CG);let a=colliders.get(k);if(!a){a=[];colliders.set(k,a);}const c={x:x,z:z,r:r,on:true};a.push(c);return c;}
function pushOut(p,rad){
  const cx=Math.floor(p.x/CG),cz=Math.floor(p.z/CG);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=colliders.get((cx+i)+','+(cz+j));if(!a)continue;
    for(let k=0;k<a.length;k++){const c=a[k];if(!c.on||(c.yMin!==undefined&&p.y<c.yMin))continue;const dx=p.x-c.x,dz=p.z-c.z,rr=c.r+rad,d2=dx*dx+dz*dz;
      if(d2<rr*rr&&d2>1e-6){const d=Math.sqrt(d2),s=(rr-d)/d;p.x+=dx*s;p.z+=dz*s;}}}
}
/* 平台：石台、浮岛、冰面 */
const plats=[];
function addPlat(x,z,r,top,bot){const p={x:x,z:z,r:r,top:top,bot:bot,on:true};plats.push(p);return p;}
function platFloor(x,z,y){let f=-1e9;for(let i=0;i<plats.length;i++){const p=plats[i];if(!p.on||p.top>y+0.6||p.top<f)continue;
  const dx=x-p.x,dz=z-p.z;if(dx*dx+dz*dz<p.r*p.r)f=p.top;}return f;}

/* ===== 分区实例化：按地块分组，方便视锥剔除 ===== */
function sectorInst(geo,mat,items,fn,cast){
  const SEC=192,map=new Map();
  items.forEach(it=>{const k=Math.floor((it.x+HALF)/SEC)+','+Math.floor((it.z+HALF)/SEC);let a=map.get(k);if(!a){a=[];map.set(k,a);}a.push(it);});
  map.forEach((list,k)=>{const q=k.split(','),cx=-HALF+(+q[0]+0.5)*SEC,cz=-HALF+(+q[1]+0.5)*SEC;
    let y0=1e9,y1=-1e9;list.forEach(it=>{y0=Math.min(y0,it.y);y1=Math.max(y1,it.y);});
    const g=new THREE.BufferGeometry();for(const n in geo.attributes)g.setAttribute(n,geo.attributes[n]);if(geo.index)g.setIndex(geo.index);
    g.boundingSphere=new THREE.Sphere(new V3(0,(y0+y1)/2,0),Math.hypot(SEC*0.72,(y1-y0)/2+12));
    const m=new THREE.InstancedMesh(g,mat,list.length);m.position.set(cx,0,cz);
    list.forEach((it,i)=>{dummy.position.set(0,0,0);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);tc.set(0xffffff);
      fn(it,dummy,tc);dummy.position.x-=cx;dummy.position.z-=cz;dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,tc);});
    m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;
    m.castShadow=!!cast;scene.add(m);});
}

/* ===== 树 ===== */
const leafGeo=(function(){const white=C(0xffffff),bark=C(0xb9794a);
  const tr=new THREE.CylinderGeometry(0.2,0.42,3.4,7);tr.translate(0,1.7,0);
  return mergeGeos([{g:tr,c:bark},
    {g:blobGeo(2.3,0,4.7,0,0.85,1),c:white,y0:2.8,y1:6.8,k0:0.7,k1:1.1},
    {g:blobGeo(1.55,1.45,3.9,0.5,0.9,2),c:white,y0:2.8,y1:6.8,k0:0.7,k1:1.1},
    {g:blobGeo(1.45,-1.1,4.1,-0.9,0.9,3),c:white,y0:2.8,y1:6.8,k0:0.7,k1:1.1},
    {g:blobGeo(1.3,0.2,6.1,0.1,0.9,4),c:white,y0:2.8,y1:7.2,k0:0.7,k1:1.12}]);})();
const pineGeo=(function(){const white=C(0xffffff),bark=C(0xa8714a);
  const tr=new THREE.CylinderGeometry(0.16,0.36,2.6,7);tr.translate(0,1.3,0);
  const parts=[{g:tr,c:bark}];
  [[2.05,2.7,3.0],[1.65,2.5,4.5],[1.25,2.3,5.9],[0.8,2.0,7.2]].forEach(a=>{const c=new THREE.ConeGeometry(a[0],a[1],9);c.translate(0,a[2],0);
    parts.push({g:c,c:white,y0:a[2]-a[1]/2,y1:a[2]+a[1]/2,k0:0.68,k1:1.1});});
  return mergeGeos(parts);})();
const treeMat=windify(new THREE.MeshToonMaterial({vertexColors:true,gradientMap:gradTex}),false);
const pines=[],leafs=[],rocks=[];
(function(){
  const r=rngOf(77),max=coarse?1250:1900;
  for(let i=0;i<16000&&pines.length+leafs.length<max;i++){
    const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);
    if(h<1.7||h>72||slopeAt(x,z)>0.9||nearSite(x,z,2))continue;
    const f=forestN(x,z),lk=lake(x,z),shore=lk>0.2&&lk<0.5&&h<12;
    const p=h>40?0.13:(f>0.6?0.92:(f>0.5?0.4:(shore?0.3:0.035)));
    if(r()>p)continue;
    const t={x:x,z:z,y:h,s:0.85+r()*0.75,rot:r()*TAU,v:r(),snow:h>45,cherry:shore||r()<0.03};
    if(h>30||mtn(x,z)>0.3||(!t.cherry&&r()<0.28))pines.push(t);else leafs.push(t);
    addCol(x,z,0.5*t.s);
  }
  const rr=rngOf(912);
  for(let i=0;i<(coarse?300:460);i++){
    let x=(rr()*2-1)*WORLD_R,z=(rr()*2-1)*WORLD_R;
    if(i%3===0){x=-130+(rr()*2-1)*180;z=-170+(rr()*2-1)*180;}
    const h=groundH(x,z);if(h<-0.6||nearSite(x,z,3))continue;
    const s=0.45+rr()*rr()*2.8;rocks.push({x:x,z:z,y:h,s:s,rot:rr()*TAU,v:rr()});
    if(s>1)addCol(x,z,s*0.85);
  }
})();
sectorInst(pineGeo,treeMat,pines,(t,d,c)=>{d.position.set(t.x,t.y-0.25,t.z);d.rotation.y=t.rot;d.scale.set(t.s,t.s*(0.9+t.v*0.35),t.s);
  c.set(0x2f8a62).offsetHSL((t.v-0.5)*0.05,0,(t.v-0.5)*0.1);if(t.snow)c.lerp(tc2.set(0xe8f3f8),0.62);},true);
sectorInst(leafGeo,treeMat,leafs,(t,d,c)=>{d.position.set(t.x,t.y-0.25,t.z);d.rotation.y=t.rot;d.scale.set(t.s,t.s*(0.9+t.v*0.25),t.s);
  if(t.cherry)c.set(t.v>0.5?0xffa3c6:0xffbcd6);else if(t.v>0.955)c.set(0xf2b445);else c.set(0x6dc350).offsetHSL((t.v-0.5)*0.07,0,(t.v-0.5)*0.12);},true);
const rockGeo=jitter(new THREE.DodecahedronGeometry(1,0),0.16,5);
const stoneMat=toon(0xffffff,{flatShading:true});
sectorInst(rockGeo,stoneMat,rocks,(t,d,c)=>{d.position.set(t.x,t.y+t.s*0.18,t.z);d.rotation.set(t.v*3,t.rot,t.v*2);d.scale.set(t.s,t.s*0.72,t.s*(0.8+t.v*0.4));
  c.set(0xa6a091).offsetHSL(0,0,(t.v-0.5)*0.1);if(t.y>50)c.lerp(tc2.set(0xeef5f8),0.55);},true);

/* ===== 草：围着角色的一圈草块，走到哪铺到哪 ===== */
const bladeGeo=(function(){const g=new THREE.PlaneGeometry(0.22,1,1,3);g.translate(0,0.5,0);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(1-y*0.88));p.setZ(i,y*y*0.2);}
  const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);
  const idx=Array.from(g.index.array),both=idx.slice();for(let i=0;i<idx.length;i+=3)both.push(idx[i],idx[i+2],idx[i+1]);
  g.setIndex(both);return g;})();
const grassMat=windify(new THREE.MeshToonMaterial({color:0xffffff,gradientMap:gradSoft}),true);
const GR={CH:12,N:9,n:0,mesh:null,slots:[],pcx:1e9,pcz:1e9};
function grassRebuild(){
  if(GR.mesh){scene.remove(GR.mesh);}
  GR.n=QUALITY[qIdx].grass;
  const m=GR.mesh=new THREE.InstancedMesh(bladeGeo,grassMat,GR.N*GR.N*GR.n);
  m.frustumCulled=false;m.receiveShadow=true;
  dummy.position.set(0,-999,0);dummy.rotation.set(0,0,0);dummy.scale.set(0,0,0);dummy.updateMatrix();tc.set(0xffffff);
  for(let i=0;i<m.count;i++){m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,tc);}
  GR.slots=new Array(GR.N*GR.N).fill('');GR.pcx=1e9;scene.add(m);
}
function grassFill(si,wx,wz){
  const r=rngOf((wx*73856093)^(wz*19349663)),m=GR.mesh,CH=GR.CH;
  for(let k=0;k<GR.n;k++){
    const x=(wx+r())*CH,z=(wz+r())*CH,sv=r(),rv=r(),idx=si*GR.n+k,h=groundH(x,z);
    let ok=h>1.7&&h<40;
    if(ok){const sl=slopeAt(x,z);ok=sl<0.75&&rv<1-sstep(0.55,0.75,forestN(x,z))*0.55-sstep(30,40,h);
      if(ok){dummy.position.set(x,h-0.03,z);dummy.rotation.set(0,rv*31.4,(sv-0.5)*0.5);dummy.scale.set(1+sv*1.2,0.42+sv*0.6,1);
        groundColor(x,z,h,1/Math.sqrt(1+sl*sl),tc);tc.r*=1.06;tc.g*=1.1;tc.b*=0.92;}}
    if(!ok){dummy.position.set(x,-999,z);dummy.scale.set(0,0,0);tc.set(0xffffff);}
    dummy.updateMatrix();m.setMatrixAt(idx,dummy.matrix);m.setColorAt(idx,tc);
  }
}
function grassUpdate(px,pz){
  const pcx=Math.floor(px/GR.CH),pcz=Math.floor(pz/GR.CH);if(pcx===GR.pcx&&pcz===GR.pcz)return;
  GR.pcx=pcx;GR.pcz=pcz;const N=GR.N,R=(N-1)/2;let ch=false;
  for(let wz=pcz-R;wz<=pcz+R;wz++)for(let wx=pcx-R;wx<=pcx+R;wx++){
    const si=(((wz%N)+N)%N)*N+(((wx%N)+N)%N),key=wx+','+wz;
    if(GR.slots[si]===key)continue;GR.slots[si]=key;grassFill(si,wx,wz);ch=true;}
  if(ch){GR.mesh.instanceMatrix.needsUpdate=true;if(GR.mesh.instanceColor)GR.mesh.instanceColor.needsUpdate=true;}
}

/* ===== 花 ===== */
(function(){const r=rngOf(4242),list=[],FL=[0xfff7dc,0xffd84d,0xff9fc6,0xc7a8ff,0xff7a6b,0x9fe0ff];
  for(let i=0;i<400&&list.length<(coarse?700:1300);i++){
    const cx=(r()*2-1)*WORLD_R,cz=(r()*2-1)*WORLD_R,h=groundH(cx,cz);
    if(h<2||h>32||forestN(cx,cz)>0.6)continue;
    const k=Math.floor(r()*FL.length),n=5+Math.floor(r()*9);
    for(let j=0;j<n;j++){const x=cx+(r()-0.5)*7,z=cz+(r()-0.5)*7,y=groundH(x,z);if(y<1.8)continue;list.push({x:x,z:z,y:y,k:k,v:r()});}
  }
  const g=new THREE.IcosahedronGeometry(0.17,0),m=new THREE.InstancedMesh(g,new THREE.MeshLambertMaterial({color:0xffffff}),Math.max(1,list.length));
  m.count=list.length;
  list.forEach((t,i)=>{dummy.position.set(t.x,t.y+0.5+t.v*0.25,t.z);dummy.rotation.set(t.v,t.v*5,0);dummy.scale.set(1,0.7,1);dummy.updateMatrix();
    m.setMatrixAt(i,dummy.matrix);m.setColorAt(i,tc.set(FL[t.k]));});
  m.frustumCulled=false;scene.add(m);
})();
