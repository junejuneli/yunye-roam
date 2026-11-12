/* ===== 建筑与可互动物 ===== */
const stoneA=toon(0xc2bbaa,{flatShading:true}),stoneB=toon(0x958e80,{flatShading:true}),grassTop=toon(0x86cf5c),goldMat=toon(0xf2c14e),woodMat=toon(0x8a5a36);
const AMBER=0xffa64d,CYAN=0x74f2ff;
function mesh(parent,geo,mat,x,y,z,cast){const m=new THREE.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);if(cast!==false)m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}

/* 石台 */
(function(){const t=TOWERS[0],H=t.y-t.g;
  const g=jitter(new THREE.CylinderGeometry(8.2,10.8,H+3,13,5),0.55,11);
  mesh(scene,g,stoneB,t.x,t.g+(H+3)/2-3.8,t.z);
  mesh(scene,new THREE.CylinderGeometry(8.7,8.3,0.7,13),grassTop,t.x,t.y-0.35,t.z);
  addPlat(t.x,t.z,8.5,t.y,t.g-4);})();

/* 浮岛 */
ISLES.forEach((s,i)=>{const g=new THREE.Group();g.position.set(s.x,s.y,s.z);scene.add(g);
  mesh(g,new THREE.CylinderGeometry(s.r+0.2,s.r*0.94,1.3,14),grassTop,0,-0.65,0);
  const under=jitter(new THREE.ConeGeometry(s.r*0.95,s.r*1.5,10,3),0.6,20+i);under.rotateX(Math.PI);mesh(g,under,stoneB,0,-1.3-s.r*0.75,0);
  [[0.55,2.2,-1.6],[-0.5,1.6,-2.6],[0.1,1.2,-4.2]].forEach((a,j)=>{mesh(g,rockGeo,stoneA,Math.cos(i+j*2.1)*s.r*a[0],a[2]-s.r*0.6,Math.sin(i+j*2.1)*s.r*a[0]).scale.setScalar(a[1]);});
  mesh(g,i===1?pineGeo:leafGeo,toon(i===1?0x2f8a62:(i===0?0xffa3c6:0x6dc350),{vertexColors:true}),-s.r*0.45,-0.2,s.r*0.3).scale.setScalar(0.95);
  addPlat(s.x,s.z,s.r,s.y,s.y-3);addCol(s.x-s.r*0.45,s.z+s.r*0.3,0.5).yMin=s.y-1;});

/* 上升气流 */
const colMat=new THREE.ShaderMaterial({uniforms:{uTime:windU.uTime},vertexShader:COL_VS,fragmentShader:COL_FS,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
COLUMNS.forEach(c=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.3,c.H,20,1,true),colMat);m.position.set(c.x,c.y0+c.H/2,c.z);m.renderOrder=1;scene.add(m);
  const ring=mesh(scene,new THREE.TorusGeometry(3.4,0.28,6,20),stoneA,c.x,c.y0+0.1,c.z,false);ring.rotation.x=Math.PI/2;});

/* 风塔 */
const octGeo=new THREE.OctahedronGeometry(1,0);
TOWERS.forEach(t=>{const g=new THREE.Group();g.position.set(t.x,t.y,t.z);scene.add(g);
  mesh(g,new THREE.CylinderGeometry(3.5,3.9,0.5,12),stoneA,0,0.25,0);
  mesh(g,new THREE.CylinderGeometry(1.5,1.9,0.5,8),stoneB,0,0.75,0);
  mesh(g,new THREE.CylinderGeometry(0.5,0.85,5.6,6),stoneA,0,3.8,0);
  mesh(g,new THREE.CylinderGeometry(1.25,0.5,0.7,8),stoneB,0,6.95,0);
  for(let i=0;i<4;i++){const a=i*Math.PI/2+0.4;mesh(g,new THREE.BoxGeometry(0.5,1.5,0.5),stoneB,Math.cos(a)*3,1.2,Math.sin(a)*3);}
  t.lit=false;t.sealed=t.kind==='sealed';
  t.runeMat=basic(AMBER);
  [2.2,4.4].forEach(y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(0.82-(y-2.2)*0.07,0.07,6,18),t.runeMat);r.rotation.x=Math.PI/2;r.position.y=y;g.add(r);});
  t.crystal=new THREE.Mesh(octGeo,basic(AMBER));t.crystal.position.y=8.5;t.crystal.scale.set(0.7,1.15,0.7);g.add(t.crystal);
  t.glow=glowSprite(AMBER,7,0.8);t.glow.position.y=8.5;g.add(t.glow);
  t.beam=new THREE.Mesh(new THREE.CylinderGeometry(0.45,0.45,420,8,1,true),glowy(AMBER,0.22));t.beam.position.y=218;g.add(t.beam);
  addPlat(t.x,t.z,3.7,t.y+0.5,t.y-3);addCol(t.x,t.z,1.25).yMin=t.y-1;});
function lightTower(t,quiet){t.lit=true;t.runeMat.color.set(CYAN);t.crystal.material.color.set(CYAN);t.glow.material.color.set(CYAN);t.glow.scale.set(11,11,1);
  t.beam.material.color.set(CYAN);t.beam.material.opacity=0.42;}

/* 宝箱 */
const chests=[];
function addChest(x,y,z,hidden){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=(x*7.3+z*3.1)%TAU;scene.add(g);
  mesh(g,new THREE.BoxGeometry(1.15,0.62,0.78),woodMat,0,0.31,0);
  mesh(g,new THREE.BoxGeometry(1.2,0.12,0.83),goldMat,0,0.58,0,false);
  [-0.42,0.42].forEach(bx=>mesh(g,new THREE.BoxGeometry(0.12,0.66,0.82),goldMat,bx,0.31,0,false));
  const lid=new THREE.Group();lid.position.set(0,0.64,-0.39);g.add(lid);
  const lg=new THREE.CylinderGeometry(0.39,0.39,1.15,10,1,false,0,Math.PI);lg.rotateZ(Math.PI/2);mesh(lid,lg,woodMat,0,0,0.39);
  [-0.42,0.42].forEach(bx=>{const b=new THREE.CylinderGeometry(0.41,0.41,0.12,10,1,false,0,Math.PI);b.rotateZ(Math.PI/2);mesh(lid,b,goldMat,bx,0,0.39,false);});
  mesh(lid,new THREE.BoxGeometry(0.2,0.24,0.1),goldMat,0,0.02,0.8,false);
  const glow=glowSprite(0xffd76a,3.2,0.55);glow.position.y=0.9;g.add(glow);
  const c={id:chests.length,x:x,y:y,z:z,g:g,lid:lid,glow:glow,open:false,t:0,hidden:!!hidden};g.visible=!hidden;chests.push(c);return c;}
CAMPS.forEach(c=>{c.chest=addChest(c.x,c.y,c.z);});
OPENCHESTS.forEach(c=>addChest(c.x,c.y,c.z));
for(let i=1;i<ISLETS.length;i++){const x=ISLETS[i][0],z=ISLETS[i][1];addChest(x,groundH(x,z),z);}
ISLES.forEach(s=>addChest(s.x+s.r*0.3,s.y,s.z-s.r*0.25));

/* 裂岩：只有冲刺斩能击碎 */
const crackGeo=jitter(new THREE.DodecahedronGeometry(1,1),0.14,31);
const cracks=[];
function addCrack(x,y,z,s,chest,tower){const mat=toon(0x7c6f6a,{flatShading:true,emissive:0x5a2408,emissiveIntensity:0.5});
  const m=mesh(scene,crackGeo,mat,x,y+s*0.55,z);m.scale.set(s,s*0.85,s);m.rotation.y=x;
  const glow=glowSprite(0xff8a3a,s*3.2,0.35);glow.position.set(x,y+s*0.8,z);scene.add(glow);
  const c={id:cracks.length,x:x,y:y,z:z,s:s,m:m,mat:mat,glow:glow,alive:true,chest:chest||null,tower:tower||null,col:addCol(x,z,s*0.95)};cracks.push(c);return c;}
ROCKSPOTS.forEach(r=>addCrack(r.x,r.y,r.z,2.3,addChest(r.x,r.y,r.z,true)));
addCrack(TOWERS[2].x,TOWERS[2].y,TOWERS[2].z,4.6,null,TOWERS[2]);

/* 星辉 */
const shards=[];
const shardMat=basic(0xfff3b0);
function addShard(x,y,z){const m=new THREE.Mesh(octGeo,shardMat);m.scale.set(0.3,0.46,0.3);m.position.set(x,y,z);scene.add(m);
  const gl=glowSprite(0xffd866,2.4,0.75);m.add(gl);gl.scale.set(8,5.2,1);
  shards.push({id:shards.length,x:x,y:y,z:z,m:m,got:false,ph:x*0.37+z*0.11});}
(function(){
  const t0=TOWERS[0];addShard(t0.x+5,t0.y+1.3,t0.z+3);addShard(t0.x-5,t0.y+1.3,t0.z-3);
  ISLES.forEach(s=>{for(let k=0;k<3;k++){const a=k*2.1+1;addShard(s.x+Math.cos(a)*s.r*0.6,s.y+1.3+(k===2?3.5:0),s.z+Math.sin(a)*s.r*0.6);}});
  for(let i=1;i<ISLETS.length;i++){const x=ISLETS[i][0],z=ISLETS[i][1];addShard(x+3,groundH(x+3,z)+1.3,z);addShard(x-2,groundH(x-2,z+3)+1.3,z+3);}
  addShard(TOWERS[1].x+3.5,TOWERS[1].y+1.6,TOWERS[1].z-3.5);
  addShard(PEAK.x+5,groundH(PEAK.x+5,PEAK.z+4)+1.3,PEAK.z+4);addShard(PEAK.x-6,groundH(PEAK.x-6,PEAK.z-2)+1.3,PEAK.z-2);
  COLUMNS.forEach(c=>{addShard(c.x,c.y0+c.H*0.5,c.z);addShard(c.x,c.top+2,c.z);});
  const r=rngOf(606),pts=[];
  for(let i=0;i<6000&&pts.length<24;i++){const x=(r()*2-1)*WORLD_R*0.9,z=(r()*2-1)*WORLD_R*0.9,h=groundH(x,z);
    if(h<2||h>95||slopeAt(x,z)>0.8||nearSite(x,z,6))continue;
    let ok=true;for(let j=0;j<pts.length;j++)if(Math.hypot(pts[j][0]-x,pts[j][1]-z)<70){ok=false;break;}
    if(!ok)continue;pts.push([x,z]);addShard(x,h+(pts.length%4===0?5.6:1.4),z);}
})();
