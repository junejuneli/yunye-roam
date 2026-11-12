/* ===== 角色与敌人模型 ===== */
const SPH=new THREE.SphereGeometry(1,18,14),BOX=new THREE.BoxGeometry(1,1,1),CYL=new THREE.CylinderGeometry(1,1,1,12),CONE=new THREE.ConeGeometry(1,1,10),CONE4=new THREE.ConeGeometry(1,1,4);
const capGeo=new THREE.SphereGeometry(1,18,10,0,TAU,0,1.85),UP=new V3(0,1,0);
const cylCache={};function cylG(rt,rb){const k=rt+'_'+rb;return cylCache[k]||(cylCache[k]=new THREE.CylinderGeometry(rt,rb,1,12));}
function part(parent,geo,mat,px,py,pz,sx,sy,sz,ol){const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);
  if(ol){const o=new THREE.Mesh(geo,outlineMat);o.scale.setScalar(ol);m.add(o);}return m;}
function pivot(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function spike(parent,mat,x,y,z,dx,dy,dz,r,len){const m=part(parent,CONE,mat,x,y,z,r,len,r,1.1);m.quaternion.setFromUnitVectors(UP,tv.set(dx,dy,dz).normalize());return m;}
const blobShadowGeo=(function(){const g=new THREE.CircleGeometry(1,20);g.rotateX(-Math.PI/2);return g;})();
function blobShadow(r){const m=new THREE.Mesh(blobShadowGeo,basic(0x000000,{transparent:true,opacity:0.24,depthWrite:false}));m.scale.setScalar(r);scene.add(m);return m;}

const HEROES=[
  {name:'赤羽',role:'剑士',glyph:'羽',skill:'冲刺斩',sg:'斩',css:'#f0604a',hex:0xf0604a,cd:4,hair:0x5b3626,top:0x2f4f8f,bot:0xece4d2,acc:0xe8503a},
  {name:'青岚',role:'风行者',glyph:'岚',skill:'乘风',sg:'风',css:'#35c2ae',hex:0x35c2ae,cd:7,hair:0xc9efd9,top:0xf3efe1,bot:0x2c7078,acc:0x2fa69b},
  {name:'霜月',role:'术士',glyph:'月',skill:'霜华',sg:'霜',css:'#9a86f2',hex:0x9a86f2,cd:12,hair:0xe9ecf8,top:0x6a55b8,bot:0x4a3a8f,acc:0xf2c14e}];

function buildHero(def,idx){
  const root=new THREE.Group(),tilt=new THREE.Group(),body=new THREE.Group();root.add(tilt);tilt.add(body);
  const skin=toon(0xffdcbc),hair=toon(def.hair),top=toon(def.top),bot=toon(def.bot),acc=toon(def.acc),shoe=toon(0x5a3d2b),eye=basic(0x2a2030),white=basic(0xffffff);
  const swings=[];
  function leg(x){const g=pivot(body,x,0.6,0);part(g,CYL,bot,0,-0.25,0,0.1,0.5,0.1,1.14);part(g,BOX,shoe,0,-0.54,0.05,0.2,0.13,0.32,1.14);return g;}
  const legL=leg(0.13),legR=leg(-0.13);
  if(idx===2){legL.visible=legR.visible=false;part(body,cylG(0.2,0.5),top,0,0.42,0,1,0.76,1,1.05);part(body,cylG(0.5,0.52),acc,0,0.07,0,1,0.07,1,0);}
  part(body,cylG(0.22,0.29),top,0,0.86,0,1,0.56,1,1.07);
  part(body,CYL,idx===0?shoe:acc,0,0.63,0,0.3,0.08,0.3,0);
  const head=pivot(body,0,1.42,0);
  part(head,SPH,skin,0,0,0,0.36,0.35,0.35,1.06);
  [0.135,-0.135].forEach(x=>{part(head,SPH,eye,x,-0.02,0.318,0.05,0.085,0.03,0);part(head,SPH,white,x-0.015,0.02,0.345,0.017,0.022,0.01,0);});
  const blush=basic(0xffb0a8);[0.2,-0.2].forEach(x=>part(head,SPH,blush,x,-0.12,0.29,0.06,0.035,0.02,0));
  const cap=part(head,capGeo,hair,0,0.02,-0.02,0.39,0.385,0.39,1.05);cap.rotation.x=-0.32;
  [-0.2,0,0.2].forEach((x,i)=>spike(head,hair,x,0.2,0.3,x*0.6,-1,0.3,0.1,i===1?0.26:0.2));
  function arm(x){const g=pivot(body,x,1.1,0);part(g,CYL,top,0,-0.2,0,0.075,0.4,0.075,1.14);part(g,SPH,skin,0,-0.43,0,0.085,0.085,0.085,1.12);g.rotation.z=x>0?0.14:-0.14;return g;}
  const armL=arm(0.31),armR=arm(-0.31);
  const m={root:root,tilt:tilt,body:body,head:head,legL:legL,legR:legR,armL:armL,armR:armR,swings:swings,glider:null,idx:idx};
  if(idx===0){
    for(let i=0;i<7;i++){const a=-1.35+i*0.45;spike(head,hair,Math.sin(a)*0.3,0.2-Math.abs(a)*0.07,-Math.cos(a)*0.3,Math.sin(a)*0.8,0.45,-Math.cos(a)*0.8,0.12,0.3);}
    spike(head,hair,0.05,0.36,0.05,0.2,1,0.35,0.1,0.24);spike(head,hair,-0.1,0.35,-0.08,-0.3,1,-0.1,0.1,0.22);
    const sc=part(body,new THREE.TorusGeometry(0.2,0.08,8,14),acc,0,1.15,0,1,1,1,1.08);sc.rotation.x=Math.PI/2;
    const tail=pivot(body,0.1,1.14,-0.2);part(tail,BOX,acc,0,-0.27,0,0.17,0.54,0.04,1.1);swings.push({g:tail,base:0.25,amp:1.05,f:7});
    const sw=pivot(armR,0,-0.43,0);sw.rotation.x=Math.PI/2;
    part(sw,BOX,toon(0xeaf0f7),0,0.52,0,0.075,0.84,0.025,1.18);part(sw,BOX,toon(0xf2c14e),0,0.08,0,0.28,0.05,0.08,0);part(sw,CYL,shoe,0,-0.03,0,0.03,0.18,0.03,0);
  }else if(idx===1){
    const pt=pivot(head,0,0.12,-0.33);part(pt,SPH,hair,0,0,0,0.13,0.13,0.13,1.1);const pc=part(pt,CONE,hair,0,-0.36,0,0.13,0.7,0.13,1.1);pc.rotation.x=Math.PI;
    swings.push({g:pt,base:0.3,amp:0.9,f:6});
    [0.33,-0.33].forEach(x=>{const s=part(head,CONE,hair,x,-0.16,0.08,0.07,0.4,0.07,1.1);s.rotation.x=Math.PI;});
    const fe=part(head,CONE,toon(0xffffff),0.27,0.3,0.02,0.05,0.34,0.05,1.15);fe.rotation.z=-0.7;
    const cape=pivot(body,0,1.13,-0.2);part(cape,BOX,acc,0,-0.32,0,0.58,0.66,0.035,1.06);swings.push({g:cape,base:0.16,amp:0.8,f:5});
    part(body,cylG(0.26,0.3),acc,0,1.1,0,1,0.1,1,0);
    const gl=pivot(tilt,0,2.3,0.1);part(gl,CONE4,toon(0xf6f0dc),0,0,0,1.75,0.16,1.0,1.03);part(gl,CONE4,acc,0,0.035,0,1.1,0.17,0.62,0);
    part(gl,BOX,shoe,0,-0.3,0,0.05,0.6,0.05,0);gl.visible=false;m.glider=gl;
  }else{
    const bh=pivot(head,0,0,-0.27);part(bh,BOX,hair,0,-0.42,0,0.54,0.84,0.1,1.06);swings.push({g:bh,base:0.1,amp:0.45,f:4});
    [0.34,-0.34].forEach(x=>{const s=part(head,CONE,hair,x,-0.22,0.06,0.07,0.52,0.07,1.1);s.rotation.x=Math.PI;});
    const hat=pivot(head,0,0.25,-0.02),hm=toon(def.bot);hat.rotation.x=-0.14;
    part(hat,CYL,hm,0,0,0,0.62,0.045,0.62,1.04);part(hat,CONE,hm,0,0.36,0,0.35,0.72,0.35,1.05);
    const tip=part(hat,CONE,hm,0,0.76,-0.1,0.13,0.34,0.13,1.08);tip.rotation.x=-0.8;
    part(hat,CYL,acc,0,0.06,0,0.355,0.07,0.355,0);
    const st=pivot(armR,0,-0.43,0);part(st,CYL,shoe,0,0.35,0.07,0.028,1.5,0.028,1.3);
    part(st,octGeo,basic(0xb5efff),0,1.2,0.07,0.13,0.2,0.13,0);const sg=glowSprite(0x8fe3ff,1.0,0.85);sg.position.set(0,1.2,0.07);st.add(sg);
    part(st,new THREE.TorusGeometry(0.1,0.025,6,12),acc,0,1.03,0.07,1,1,1,0).rotation.x=Math.PI/2;
  }
  return m;
}

function buildSlime(scale,hex,king){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const mat=toon(hex,{emissive:0x000000}),eye=basic(0x241a2e),white=basic(0xffffff);
  part(b,SPH,mat,0,0.55,0,0.75,0.6,0.75,1.07);
  [0.27,-0.27].forEach(x=>{part(b,SPH,white,x,0.68,0.58,0.16,0.19,0.09,0);part(b,SPH,eye,x,0.66,0.65,0.075,0.105,0.045,0);});
  part(b,SPH,basic(0xffffff,{transparent:true,opacity:0.45}),-0.3,0.95,0.28,0.15,0.08,0.11,0);
  if(king){const gm=toon(0xf2c14e);part(b,cylG(0.36,0.32),gm,0,1.17,0,1,0.14,1,0);for(let i=0;i<5;i++){const a=i*TAU/5;part(b,CONE,gm,Math.cos(a)*0.3,1.32,Math.sin(a)*0.3,0.08,0.22,0.08,0);}}
  g.scale.setScalar(scale);
  return {g:g,b:b,mat:mat,base:C(hex)};
}
function buildWisp(){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const mat=basic(0xe4c2ff);part(b,SPH,mat,0,0,0,0.3,0.3,0.3,0);
  const gl=glowSprite(0xb060ff,3.2,0.85);b.add(gl);
  const orb=pivot(b,0,0,0);for(let i=0;i<3;i++){const a=i*TAU/3;part(orb,octGeo,basic(0x9a5cff),Math.cos(a)*0.6,0,Math.sin(a)*0.6,0.09,0.15,0.09,0);}
  [0.1,-0.1].forEach(x=>part(b,SPH,basic(0x2a1840),x,0.03,0.27,0.04,0.07,0.03,0));
  return {g:g,b:b,mat:mat,base:C(0xe4c2ff),orb:orb};
}
function hpBar(g,y,scale){
  const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x1a1420,transparent:true,opacity:0.7,depthWrite:false}));
  const fg=new THREE.Sprite(new THREE.SpriteMaterial({color:0xff5a6e,depthWrite:false,transparent:true}));
  const w=1.3/scale,h=0.13/scale;bg.scale.set(w,h,1);fg.scale.set(w,h*0.7,1);
  bg.position.y=y;fg.position.y=y;bg.renderOrder=3;fg.renderOrder=4;bg.visible=fg.visible=false;g.add(bg);g.add(fg);
  return {bg:bg,fg:fg,w:w};
}
