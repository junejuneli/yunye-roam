/* ===== 世界布局 ===== */
const PEAK=(function(){let m=-1e9,x=0,z=0;for(let j=0;j<N1;j++)for(let i=0;i<N1;i++){const h=HG[j*N1+i];if(h>m){m=h;x=-HALF+i*CELL;z=-HALF+j*CELL;}}return {x:x,z:z,h:m};})();
const sites=[];
function site(x,z,r,h){const y=flatten(x,z,r,h);sites.push([x,z,r*1.7]);return y;}
function nearSite(x,z,pad){for(let i=0;i<sites.length;i++){const s=sites[i];if(Math.hypot(x-s[0],z-s[1])<s[2]+(pad||0))return true;}return false;}
function nearLand(x,z){for(let r=0;r<90;r+=5)for(let a=0;a<10;a++){const px=x+Math.cos(a*0.628+r)*r,pz=z+Math.sin(a*0.628+r)*r,h=groundH(px,pz);
  if(h>1.8&&h<70&&slopeAt(px,pz)<0.45)return [px,pz];}return [x,z];}
const SPAWN={x:255,z:55};SPAWN.y=site(SPAWN.x,SPAWN.z,6);
const TOWERS=[
  {id:0,name:'风息之塔',x:290,z:-30,kind:'mesa',tip:'塔在石台顶上。旁边有上升气流。'},
  {id:1,name:'镜湖之塔',x:120,z:100,kind:'islet',tip:'塔在湖心小岛上。'},
  {id:2,name:'林隐之塔',x:-150,z:70,kind:'sealed',tip:'塔被裂岩封住了。'},
  {id:3,name:'霜顶之塔',x:PEAK.x,z:PEAK.z,kind:'summit',tip:'塔在雪山之巅。'}];
TOWERS[0].g=site(290,-30,12);TOWERS[0].y=TOWERS[0].g+20;
TOWERS[1].y=site(120,100,5,3.2);
TOWERS[2].y=site(-150,70,9);
TOWERS[3].y=site(PEAK.x,PEAK.z,11,PEAK.h-5);
for(let i=1;i<ISLETS.length;i++)site(ISLETS[i][0],ISLETS[i][1],4,3.4);
const COLUMNS=[{x:276,z:-19,H:30},{x:45,z:268,H:41}];
COLUMNS.forEach(c=>{c.y0=site(c.x,c.z,4);c.top=c.y0+c.H;});
const ISLES=[{x:345,z:-5,y:36,r:9},{x:-20,z:-215,y:78,r:10},{x:5,z:225,y:26,r:9}];
const CAMPS=[[310,115],[70,-50],[120,290],[-320,-40],[150,-225]].map(a=>{const p=nearLand(a[0],a[1]);return {x:p[0],z:p[1],y:site(p[0],p[1],8)};});
const ROCKSPOTS=[[205,-70],[-30,-300],[-250,170],[30,30],[330,40]].map(a=>{const p=nearLand(a[0],a[1]);return {x:p[0],z:p[1],y:site(p[0],p[1],4)};});
const OPENCHESTS=[[240,-120],[-60,-60],[235,150],[-220,-20]].map(a=>{const p=nearLand(a[0],a[1]);return {x:p[0],z:p[1],y:site(p[0],p[1],3)};});
const TRIALS=[[185,80],[-75,165],[55,-150]].map((a,i)=>{const p=nearLand(a[0],a[1]);return {id:i,x:p[0],z:p[1],y:site(p[0],p[1],9)};});

/* ===== 地形网格 ===== */
const PAL={sand:C(0xf2e5b3),g1:C(0x97d862),g2:C(0x70be4f),hi:C(0xb6d86c),forest:C(0x4b9947),rock:C(0x9d9686),cliff:C(0x7f786c),snow:C(0xf7fbfe),meadow:C(0xcfe070),shade:C(0x4fa851),bed:C(0x86d2bd),deep:C(0x3e8fb2)};
function groundColor(x,z,h,ny,c){
  if(h<-2.5)return c.copy(PAL.deep);
  if(h<0.2)return c.copy(PAL.bed).lerp(PAL.sand,sstep(-2.5,0.2,h));
  c.copy(PAL.g1).lerp(PAL.g2,vnoise(x*0.035,z*0.035));
  c.lerp(PAL.hi,sstep(16,30,h)*0.6);
  c.lerp(PAL.meadow,sstep(0.52,0.78,vnoise(x*0.011+9.1,z*0.011+3.3))*0.5);
  c.lerp(PAL.shade,sstep(0.6,0.85,vnoise(x*0.02+40.2,z*0.02+7.7))*0.3);
  c.lerp(PAL.forest,sstep(0.46,0.62,forestN(x,z))*0.8);
  c.lerp(PAL.sand,1-sstep(0.9,2.4,h));
  c.lerp(PAL.rock,sstep(36,48,h));
  c.lerp(PAL.cliff,1-sstep(0.6,0.8,ny));
  c.lerp(PAL.snow,sstep(50,60,h+vnoise(x*0.05,z*0.05)*8)*sstep(0.45,0.72,ny));
  return c;
}
const tGeo=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);tGeo.rotateX(-Math.PI/2);
(function(){
  const p=tGeo.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,HG[i]);
  tGeo.computeVertexNormals();
  const nor=tGeo.attributes.normal,col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){groundColor(p.getX(i),p.getZ(i),p.getY(i),nor.getY(i),tc);col[i*3]=tc.r;col[i*3+1]=tc.g;col[i*3+2]=tc.b;}
  tGeo.setAttribute('color',new THREE.BufferAttribute(col,3));
})();
const terrain=new THREE.Mesh(tGeo,new THREE.MeshToonMaterial({vertexColors:true,gradientMap:gradSoft}));
terrain.receiveShadow=true;scene.add(terrain);

/* 高度图：给水面算深浅和岸边浪花 */
const hmTex=(function(){const W=256,d=new Uint8Array(W*W);
  for(let j=0;j<W;j++)for(let i=0;i<W;i++){const h=groundH(-HALF+(i+0.5)/W*SIZE,-HALF+(j+0.5)/W*SIZE);d[j*W+i]=Math.round(clamp((h+12)/16,0,1)*255);}
  const t=new THREE.DataTexture(d,W,W,THREE.LuminanceFormat);t.minFilter=t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;})();

/* ===== 水面 ===== */
const waterU={uHM:{value:hmTex},uTime:windU.uTime,uLight:{value:1},uFogNear:{value:130},uFogFar:{value:780},
  uSky:{value:C(0xd6eef2)},uSunDir:{value:new V3(0,1,0)},uSunCol:{value:C(0xffffff)},uFogCol:{value:scene.fog.color},
  uDeep:{value:C(0x1c69ab)},uShallow:{value:C(0x5fdccd)}};
const water=new THREE.Mesh(new THREE.PlaneGeometry(4200,4200),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:waterU,
  vertexShader:WATER_VS,fragmentShader:WATER_FS}));
water.rotation.x=-Math.PI/2;water.position.y=WATER;water.renderOrder=-1;scene.add(water);

/* ===== 天空与昼夜 ===== */
const skyU={uZen:{value:C(0x2f80d8)},uHor:{value:C(0xcdeaf5)},uSun:{value:new V3(0,1,0)},uMoon:{value:new V3(0,-1,0)},
  uSunCol:{value:C(0xfff2d6)},uDuskCol:{value:C(0xff9a55)},uCloudA:{value:C(0xffffff)},uCloudB:{value:C(0xa9bfd8)},
  uTime:windU.uTime,uNight:{value:0},uDusk:{value:0},uAurora:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(1200,32,18),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
  vertexShader:SKY_VS,fragmentShader:SKY_FS}));
sky.frustumCulled=false;scene.add(sky);
const SKY={zenD:C(0x2f80d8),horD:C(0xcdeaf5),zenN:C(0x070d26),horN:C(0x1b2950),zenK:C(0x45599c),horK:C(0xffab78),
  sunD:C(0xfff2d6),sunK:C(0xff9c58),moonL:C(0x8ea6ff),hSkyD:C(0xd4f0ff),hGndD:C(0x86a865),hSkyN:C(0x4c5e9c),hGndN:C(0x1a2436),
  cAD:C(0xffffff),cBD:C(0xa9bfd8),cAK:C(0xffd2a6),cBK:C(0x8d72a0),cAN:C(0x3a466f),cBN:C(0x161d38)};
const DN={tod:0.283,sun:new V3(),moon:new V3(),dir:new V3(0,1,0),el:1,day:1,night:0,dusk:0};
function updateSky(dt,flow){
  if(flow)DN.tod=(DN.tod+dt/(DN.night>0.5?280:620))%1;
  const a=(DN.tod-0.25)*TAU;
  DN.sun.set(Math.cos(a)*0.85,Math.sin(a),0.4).normalize();
  DN.moon.set(-Math.cos(a)*0.85,-Math.sin(a),0.4).normalize();
  const el=DN.el=DN.sun.y,day=DN.day=sstep(-0.08,0.28,el),dusk=DN.dusk=clamp(1-Math.abs(el-0.04)/0.3,0,1),night=DN.night=1-sstep(-0.22,0.02,el);
  skyU.uZen.value.copy(SKY.zenN).lerp(SKY.zenD,day).lerp(SKY.zenK,dusk*0.5);
  skyU.uHor.value.copy(SKY.horN).lerp(SKY.horD,day).lerp(SKY.horK,dusk*0.8);
  skyU.uSun.value.copy(DN.sun);skyU.uMoon.value.copy(DN.moon);
  skyU.uSunCol.value.copy(SKY.sunK).lerp(SKY.sunD,sstep(0.05,0.4,el)).multiplyScalar(sstep(-0.12,0.02,el));
  skyU.uNight.value=night;skyU.uDusk.value=dusk;
  skyU.uCloudA.value.copy(SKY.cAN).lerp(SKY.cAD,day).lerp(SKY.cAK,dusk*0.7);
  skyU.uCloudB.value.copy(SKY.cBN).lerp(SKY.cBD,day).lerp(SKY.cBK,dusk*0.7);
  scene.fog.color.copy(skyU.uHor.value);
  if(el>0){DN.dir.copy(DN.sun);sunL.color.copy(SKY.sunK).lerp(SKY.sunD,sstep(0.05,0.4,el));sunL.intensity=0.62*sstep(-0.03,0.14,el);}
  else{DN.dir.copy(DN.moon);sunL.color.copy(SKY.moonL);sunL.intensity=0.3*sstep(0.02,0.25,-el);}
  hemi.color.copy(SKY.hSkyN).lerp(SKY.hSkyD,day).lerp(SKY.horK,dusk*0.38);
  hemi.groundColor.copy(SKY.hGndN).lerp(SKY.hGndD,day);
  hemi.intensity=lerp(0.42,0.5,day)+dusk*0.1;
  waterU.uSky.value.copy(skyU.uHor.value).lerp(skyU.uZen.value,0.35);
  waterU.uSunDir.value.copy(DN.dir);
  waterU.uSunCol.value.copy(sunL.color).multiplyScalar(sunL.intensity);
  waterU.uLight.value=lerp(0.3,1,day);
}
function clockText(){const m=Math.floor(DN.tod*1440),h=Math.floor(m/60),mm=m%60;return (h<10?'0':'')+h+':'+(mm<10?'0':'')+mm;}
