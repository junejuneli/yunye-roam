/* ===== 角色与敌人模型 ===== */
const V2=THREE.Vector2;
const SPH=new THREE.SphereGeometry(1,20,16),BOX=new THREE.BoxGeometry(1,1,1),CYL=new THREE.CylinderGeometry(1,1,1,14),CONE=new THREE.ConeGeometry(1,1,12),CONE4=new THREE.ConeGeometry(1,1,4);
const capGeo=new THREE.SphereGeometry(1,20,12,0,TAU,0,1.85),UP=new V3(0,1,0);
const facePatch=new THREE.SphereGeometry(1,18,14,Math.PI/2-0.95,1.9,Math.PI/2-0.75,1.5);
const cylCache={};function cylG(rt,rb){const k=rt+'_'+rb;return cylCache[k]||(cylCache[k]=new THREE.CylinderGeometry(rt,rb,1,14));}
function lathe(pts,seg){return new THREE.LatheGeometry(pts.map(p=>new V2(p[0],p[1])),seg||18);}
/* 描边：背面沿法线在视空间外扩，粗细不受模型缩放影响 */
const olCache={};
function olMat(th){if(olCache[th])return olCache[th];
  const m=new THREE.MeshBasicMaterial({color:0x2b2236,side:THREE.BackSide});
  m.onBeforeCompile=function(sh){sh.vertexShader=sh.vertexShader.replace('#include <project_vertex>',
    '#include <project_vertex>\nmvPosition.xyz+=normalize(normalMatrix*normal)*'+th.toFixed(4)+';\ngl_Position=projectionMatrix*mvPosition;');};
  m.customProgramCacheKey=function(){return 'ol'+th;};
  return olCache[th]=m;}
const OL=0.016;
/* 棱角分明的石头用一份法线朝外的副本来描边，免得边缘裂开 */
const rockOL=(function(){const g=new THREE.BufferGeometry(),p=rockGeo.attributes.position,n=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){tv.set(p.getX(i),p.getY(i),p.getZ(i)).normalize();n[i*3]=tv.x;n[i*3+1]=tv.y;n[i*3+2]=tv.z;}
  g.setAttribute('position',p);g.setAttribute('normal',new THREE.BufferAttribute(n,3));return g;})();
function part(parent,geo,mat,px,py,pz,sx,sy,sz,ol){const m=new THREE.Mesh(geo,mat);m.position.set(px,py,pz);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);
  if(ol){if(geo===BOX){const o=new THREE.Mesh(geo,outlineMat);o.scale.set(1+0.03/Math.max(0.02,sx),1+0.03/Math.max(0.02,sy),1+0.03/Math.max(0.02,sz));m.add(o);}
    else m.add(new THREE.Mesh(geo===rockGeo?rockOL:geo,olMat(ol===true||ol>=1?OL:ol)));}
  return m;}
function pivot(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function spike(parent,mat,x,y,z,dx,dy,dz,r,len,ol){const m=part(parent,CONE,mat,x,y,z,r,len,r,ol===undefined?true:ol);m.quaternion.setFromUnitVectors(UP,tv.set(dx,dy,dz).normalize());return m;}
/* 发束：一根向下垂的扁锥，可以带弧度 */
const lockCache={};
function lockG(curve,twist){const k=curve+'_'+twist;if(lockCache[k])return lockCache[k];
  const g=new THREE.ConeGeometry(1,1,8,5);g.rotateX(Math.PI);g.translate(0,-0.5,0);
  const p=g.attributes.position;for(let i=0;i<p.count;i++){const t=-p.getY(i);p.setZ(i,p.getZ(i)*0.5+curve*t*t);p.setX(i,p.getX(i)+twist*t*t);}
  g.computeVertexNormals();return lockCache[k]=g;}
function lock(parent,mat,a,y,r,tilt,len,w,curve,twist,ol){const m=part(parent,lockG(curve||0,twist||0),mat,Math.sin(a)*r,y,Math.cos(a)*r,w,len,w,ol===undefined?true:ol);
  m.rotation.order='YXZ';m.rotation.y=a;m.rotation.x=tilt;return m;}
const blobShadowGeo=(function(){const g=new THREE.CircleGeometry(1,24);g.rotateX(-Math.PI/2);return g;})();
function blobShadow(r){const m=new THREE.Mesh(blobShadowGeo,basic(0x000000,{transparent:true,opacity:0.24,depthWrite:false}));m.scale.setScalar(r);scene.add(m);return m;}
function shapeGeo(pts){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const p=pts[i];if(p.length===4)s.quadraticCurveTo(p[0],p[1],p[2],p[3]);else s.lineTo(p[0],p[1]);}
  return new THREE.ShapeGeometry(s,6);}

/* 脸：画在画布上再贴到头的前半球，睁眼闭眼各一张 */
function faceMat(tex){return new THREE.MeshToonMaterial({map:tex,gradientMap:gradSoft,transparent:true,alphaTest:0.04,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});}
function faceTex(o){
  const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d');
  if(!x||!x.ellipse)return new THREE.CanvasTexture(cv);
  x.lineCap='round';x.lineJoin='round';
  const cy=o.cy||140,gap=o.gap||52,ink='#2a1e2e';
  [-1,1].forEach(function(s){const cx=128+s*gap;
    if(o.style==='dot'){ /* 史莱姆之类的圆眼 */
      const rx=o.rx||13,ry=o.ry||19;
      if(o.closed){x.strokeStyle=ink;x.lineWidth=6;x.beginPath();x.moveTo(cx-rx,cy);x.quadraticCurveTo(cx,cy+10,cx+rx,cy);x.stroke();}
      else{x.fillStyle=ink;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,TAU);x.fill();
        x.fillStyle='#fff';x.beginPath();x.arc(cx-rx*0.3,cy-ry*0.4,rx*0.42,0,TAU);x.fill();x.beginPath();x.arc(cx+rx*0.35,cy+ry*0.4,rx*0.2,0,TAU);x.fill();}
      if(o.angry){x.strokeStyle=ink;x.lineWidth=7;x.beginPath();x.moveTo(cx-s*(rx+10),cy-ry-12);x.lineTo(cx+s*(rx+2),cy-ry+2);x.stroke();}
    }else if(o.closed){x.strokeStyle=ink;x.lineWidth=7;x.beginPath();x.moveTo(cx-22,cy+4);x.quadraticCurveTo(cx,cy+18,cx+22,cy+4);x.stroke();}
    else{
      x.save();x.beginPath();x.ellipse(cx,cy,21,27,0,0,TAU);x.fillStyle='#fff';x.fill();x.clip();
      const g=x.createLinearGradient(0,cy-24,0,cy+27);g.addColorStop(0,o.dark);g.addColorStop(0.5,o.eye);g.addColorStop(1,o.light);
      x.fillStyle=g;x.beginPath();x.ellipse(cx,cy+3,16.5,23.5,0,0,TAU);x.fill();
      x.fillStyle='#1c1424';x.beginPath();x.ellipse(cx,cy+1,7.5,11.5,0,0,TAU);x.fill();
      x.fillStyle='rgba(30,16,40,.32)';x.fillRect(cx-24,cy-30,48,15);
      x.restore();
      x.fillStyle='#fff';x.beginPath();x.arc(cx-7,cy-10,6.2,0,TAU);x.fill();x.beginPath();x.arc(cx+7,cy+13,3,0,TAU);x.fill();
      x.strokeStyle=ink;x.lineWidth=7.5;x.beginPath();x.moveTo(cx-24,cy-9);x.quadraticCurveTo(cx-s*3,cy-37,cx+24,cy-9);x.stroke();
      x.lineWidth=4.5;x.beginPath();x.moveTo(cx+s*22,cy-12);x.lineTo(cx+s*31,cy-19);x.stroke();
      x.lineWidth=2;x.globalAlpha=0.5;x.beginPath();x.moveTo(cx-12,cy+28);x.quadraticCurveTo(cx,cy+31,cx+12,cy+28);x.stroke();x.globalAlpha=1;
    }
    if(o.brow){x.strokeStyle=o.brow;x.lineWidth=5;x.beginPath();x.moveTo(cx-s*19,cy-49+(o.stern?-4:0));x.quadraticCurveTo(cx,cy-55,cx+s*19,cy-46+(o.stern?6:0));x.stroke();}
    if(o.blush!==false){x.fillStyle=o.blush||'rgba(255,118,118,.36)';x.beginPath();x.ellipse(128+s*(gap+24),cy+36,17,9,0,0,TAU);x.fill();}
  });
  x.strokeStyle=o.mouth||'#a2493f';x.lineWidth=4;x.beginPath();
  const my=o.my||cy+52;
  if(o.fang){x.moveTo(108,my);x.quadraticCurveTo(128,my+12,148,my);x.stroke();x.fillStyle='#fff';[-1,1].forEach(function(s){x.beginPath();x.moveTo(128+s*13,my+3);x.lineTo(128+s*8,my+16);x.lineTo(128+s*4,my+6);x.fill();});}
  else if(o.open){x.fillStyle='#8a3038';x.ellipse(128,my+2,9,7,0,0,TAU);x.fill();}
  else if(o.cat){x.moveTo(114,my-2);x.quadraticCurveTo(121,my+7,128,my-1);x.quadraticCurveTo(135,my+7,142,my-2);x.stroke();}
  else if(o.frown){x.moveTo(114,my+5);x.quadraticCurveTo(128,my-5,142,my+5);x.stroke();}
  else{x.moveTo(117,my);x.quadraticCurveTo(128,my+8,139,my);x.stroke();}
  return new THREE.CanvasTexture(cv);
}

const HEROES=[
  {name:'赤羽',role:'剑士',glyph:'羽',skill:'冲刺斩',sg:'斩',ult:'燎原',ug:'燎',css:'#f0604a',hex:0xf0604a,cd:4,
    hair:0x70402b,top:0x2c477f,bot:0xefe6d2,acc:0xe8503a,trim:0xf2c14e,shoe:0x5a3d2b,eye:'#d9652c',eyeD:'#5a1f10',eyeL:'#ffc27a',brow:'#4f2a1d'},
  {name:'青岚',role:'风行者',glyph:'岚',skill:'乘风',sg:'风',ult:'风眼',ug:'岚',css:'#35c2ae',hex:0x35c2ae,cd:7,
    hair:0xbdeedb,top:0xf2f8ff,bot:0x2c7f86,acc:0x2fa69b,trim:0xf2c14e,shoe:0x3d6b6b,eye:'#27b39c',eyeD:'#0d4a50',eyeL:'#b6ffe6',brow:'#7fb8a4'},
  {name:'霜月',role:'术士',glyph:'月',skill:'霜华',sg:'霜',ult:'霜天',ug:'雪',css:'#9a86f2',hex:0x9a86f2,cd:12,
    hair:0xe9ecf8,top:0x6a55b8,bot:0x47378c,acc:0xf2c14e,trim:0xf2c14e,shoe:0x3a2d6e,eye:'#8a6cf0',eyeD:'#2d1f6e',eyeL:'#e2d4ff',brow:'#a9aecb'}];

function buildHero(def,idx){
  const root=new THREE.Group(),tilt=new THREE.Group(),body=new THREE.Group();root.add(tilt);tilt.add(body);
  const skin=toon(0xffe0c6,{gradientMap:gradSoft}),hair=toon(def.hair),top=toon(def.top),bot=toon(def.bot),acc=toon(def.acc),trim=toon(def.trim),shoe=toon(def.shoe),white=toon(0xfbf7ee),dark=toon(0x3a3044);
  const swings=[];
  /* 腿：大腿 + 膝 + 小腿和鞋 */
  function leg(x,thigh,shin){const g=pivot(body,x,0.62,0);part(g,cylG(0.105,0.088),thigh,0,-0.14,0,1,0.3,1,true);
    const k=pivot(g,0,-0.29,0);part(k,cylG(0.084,0.07),shin,0,-0.1,0,1,0.22,1,true);
    part(k,cylG(0.098,0.09),shoe,0,-0.21,0,1,0.14,1,true);part(k,cylG(0.108,0.104),trim,0,-0.135,0,1,0.03,1,0);
    part(k,SPH,shoe,0,-0.275,0.05,0.098,0.065,0.165,true);return {g:g,k:k};}
  /* 手臂：上臂 + 肘 + 前臂和手 */
  function arm(x,up,fore,cuff){const g=pivot(body,x,1.12,0);part(g,SPH,up,0,0,0,0.098,0.098,0.098,true);part(g,cylG(0.085,0.072),up,0,-0.14,0,1,0.26,1,true);
    const e=pivot(g,0,-0.27,0);part(e,cylG(0.07,idx===2?0.125:0.066),fore,0,-0.1,0,1,0.2,1,true);
    if(cuff)part(e,cylG(idx===2?0.13:0.076,idx===2?0.132:0.076),cuff,0,-0.19,0,1,0.035,1,0);
    part(e,SPH,skin,0,-0.235,0,0.072,0.08,0.072,true);g.rotation.z=x>0?0.13:-0.13;return {g:g,e:e};}
  let L,R,AL,AR;
  if(idx===0){L=leg(0.125,bot,bot);R=leg(-0.125,bot,bot);AL=arm(0.31,top,top,trim);AR=arm(-0.31,top,top,trim);}
  else if(idx===1){L=leg(0.12,bot,white);R=leg(-0.12,bot,white);AL=arm(0.3,top,acc,trim);AR=arm(-0.3,top,acc,trim);}
  else{L=leg(0.11,white,white);R=leg(-0.11,white,white);AL=arm(0.3,top,top,trim);AR=arm(-0.3,top,top,trim);}
  /* 头 */
  part(body,cylG(0.07,0.08),skin,0,1.24,0,1,0.14,1,0);
  const head=pivot(body,0,1.47,0);
  part(head,SPH,skin,0,0,0,0.36,0.35,0.345,true);
  [0.345,-0.345].forEach(x=>part(head,SPH,skin,x,-0.04,0,0.05,0.085,0.06,true));
  const fo={eye:def.eye,dark:def.eyeD,light:def.eyeL,brow:def.brow,stern:idx===0,cat:idx===1};
  const texOpen=faceTex(fo),texClosed=faceTex(Object.assign({closed:true},fo));
  const face=part(head,facePatch,faceMat(texOpen),0,0,0,0.362,0.352,0.347,0);face.castShadow=false;
  const cap=part(head,capGeo,hair,0,0.02,-0.02,0.385,0.38,0.385,true);cap.rotation.x=-0.5;
  const m={root:root,tilt:tilt,body:body,head:head,legL:L.g,legR:R.g,kneeL:L.k,kneeR:R.k,armL:AL.g,armR:AR.g,elbL:AL.e,elbR:AR.e,swings:swings,glider:null,idx:idx,
    face:face,texOpen:texOpen,texClosed:texClosed,blink:2+idx,aura:null};
  if(idx===0){
    /* 赤羽：短外套、红围巾、头带、单肩甲、长剑 */
    part(body,lathe([[0,0.55],[0.2,0.56],[0.25,0.6],[0.238,0.7],[0.205,0.84],[0.218,0.98],[0.24,1.08],[0.2,1.16],[0.1,1.21],[0,1.21]]),top,0,0,0,1,1,0.84,true);
    const hem=part(body,new THREE.TorusGeometry(0.245,0.018,6,20),trim,0,0.59,0,1,0.84,1,0);hem.rotation.x=Math.PI/2;
    const belt=part(body,new THREE.TorusGeometry(0.222,0.032,6,20),shoe,0,0.7,0,1,0.84,1,0);belt.rotation.x=Math.PI/2;
    part(body,BOX,trim,0,0.7,0.2,0.09,0.075,0.03,true);
    part(body,SPH,white,0,1.04,0.16,0.085,0.14,0.05,0);
    [0.93,0.83].forEach(y=>part(body,SPH,trim,0.1,y,0.17,0.022,0.022,0.015,0));
    const pa=part(AL.g,capGeo,toon(0xaebcd2),0.02,0.03,0,0.15,0.13,0.15,true);pa.rotation.z=-0.5;part(AL.g,SPH,trim,0.1,0.07,0,0.035,0.035,0.035,0);
    const sc=part(body,new THREE.TorusGeometry(0.17,0.085,8,16),acc,0,1.2,0.01,1,0.95,1,true);sc.rotation.x=Math.PI/2;
    part(body,SPH,acc,0.13,1.17,0.14,0.085,0.07,0.07,true);
    const t1=pivot(body,0.13,1.17,-0.16);part(t1,BOX,acc,0,-0.25,0,0.16,0.5,0.035,true);part(t1,BOX,trim,0,-0.47,0,0.165,0.035,0.04,0);swings.push({g:t1,base:0.3,amp:1.05,f:7});
    const t2=pivot(body,0.02,1.17,-0.18);part(t2,BOX,acc,0,-0.18,0,0.13,0.36,0.03,true);swings.push({g:t2,base:0.42,amp:0.9,f:8.3});
    /* 头发：刘海 + 一圈外翘的发刺 */
    [[-0.8,0.25,0.3],[-0.4,0.12,-0.5],[-0.02,0.2,0.4],[0.36,0.13,-0.3],[0.76,0.24,0.5]].forEach(a=>lock(head,hair,a[0],0.21,0.3,-0.3,a[1],0.11,0,a[2]*0.4));
    [1.25,-1.25].forEach(a=>lock(head,hair,a,0.1,0.34,-0.12,0.32,0.085,0.1,0));
    for(let i=0;i<9;i++){const a=1.15+i*(TAU-2.3)/8;lock(head,hair,a,0.16+(i%2)*0.06,0.26,-2.0-(i%3)*0.16,0.34+(i%2)*0.08,0.13,-0.25,0);}
    for(let i=0;i<7;i++){const a=1.5+i*(TAU-3.0)/6;lock(head,hair,a,-0.05,0.3,-1.15,0.3,0.12,-0.2,0);}
    lock(head,hair,0.3,0.33,0.06,-2.6,0.28,0.075,-0.5,0);lock(head,hair,-0.5,0.32,0.1,-2.4,0.24,0.08,-0.4,0);lock(head,hair,2.4,0.3,0.12,-2.7,0.3,0.1,-0.3,0);
    const hb=part(head,new THREE.TorusGeometry(0.366,0.03,6,22),acc,0,0.13,-0.01,1,1,1,0);hb.rotation.x=Math.PI/2+0.16;
    const kn=pivot(head,0,0.07,-0.37);part(kn,SPH,acc,0,0,0,0.05,0.05,0.04,true);
    [0.07,-0.06].forEach((x,i)=>{const hbT=pivot(kn,x,0,0);part(hbT,BOX,acc,0,-0.16,0,0.055,0.32,0.02,true);hbT.rotation.z=x*4;swings.push({g:hbT,base:0.5,amp:1.0,f:9+i*2});});
    /* 剑 */
    const sw=pivot(AR.e,0,-0.235,0);sw.rotation.x=Math.PI/2;
    const blade=toon(0xeef3fa);
    part(sw,BOX,blade,0,0.53,0,0.09,0.78,0.024,true);part(sw,CONE4,blade,0,0.985,0,0.046,0.14,0.012,true);
    part(sw,BOX,toon(0xbfd0e6),0,0.5,0,0.022,0.66,0.03,0);
    part(sw,BOX,trim,0,0.11,0,0.3,0.055,0.075,true);[0.16,-0.16].forEach(x=>part(sw,SPH,trim,x,0.11,0,0.045,0.045,0.045,true));
    part(sw,SPH,basic(0xff5a4a),0,0.11,0.04,0.035,0.035,0.02,0);
    part(sw,CYL,shoe,0,-0.02,0,0.028,0.2,0.028,true);part(sw,SPH,trim,0,-0.14,0,0.045,0.045,0.045,true);
    m.blade=sw;
    /* 背后的剑鞘 */
    const sh=part(body,BOX,shoe,-0.04,0.95,-0.22,0.1,0.72,0.045,true);sh.rotation.z=0.7;part(sh,BOX,trim,0,0.46,0,1.15,0.07,1.2,0);
  }else if(idx===1){
    /* 青岚：短斗篷、束腰短衣、高马尾、羽饰、滑翔翼 */
    part(body,lathe([[0.3,0.44],[0.27,0.5],[0.2,0.63],[0.186,0.8],[0.2,0.96],[0.225,1.08],[0.19,1.16],[0.09,1.21],[0,1.21]]),top,0,0,0,1,1,0.84,true);
    const hem=part(body,new THREE.TorusGeometry(0.295,0.02,6,20),acc,0,0.45,0,1,0.84,1,0);hem.rotation.x=Math.PI/2;
    const sash=part(body,new THREE.TorusGeometry(0.205,0.04,6,20),acc,0,0.68,0,1,0.84,1,0);sash.rotation.x=Math.PI/2;
    part(body,SPH,trim,0,0.68,0.19,0.045,0.045,0.03,true);
    part(body,BOX,acc,0,0.86,0.168,0.06,0.3,0.02,0);[0.94,0.84,0.76].forEach(y=>part(body,SPH,trim,0,y,0.185,0.02,0.02,0.012,0));
    part(body,lathe([[0.32,0.96],[0.3,1.0],[0.25,1.1],[0.17,1.19],[0.1,1.23],[0,1.23]]),acc,0,0,0,1,1,0.88,true);
    part(body,octGeo,basic(0xb8ffe9),0,1.13,0.2,0.04,0.055,0.025,0);part(body,SPH,trim,0,1.13,0.19,0.055,0.065,0.02,true);
    const cape=pivot(body,0,1.14,-0.2);part(cape,BOX,acc,0,-0.3,0,0.56,0.6,0.03,true);part(cape,BOX,white,0,-0.57,0,0.57,0.05,0.035,0);
    [0.2,-0.2].forEach(x=>{const c=part(cape,CONE4,acc,x,-0.66,0,0.085,0.16,0.016,true);c.rotation.x=Math.PI;});swings.push({g:cape,base:0.16,amp:0.8,f:5});
    [L.k,R.k].forEach(k=>{const an=part(k,new THREE.TorusGeometry(0.085,0.016,5,14),trim,0,-0.02,0,1,1,1,0);an.rotation.x=Math.PI/2;});
    /* 头发 */
    [[-0.82,0.26,0.5],[-0.42,0.12,0.5],[-0.04,0.19,0.6],[0.34,0.12,-0.4],[0.74,0.24,-0.5]].forEach(a=>lock(head,hair,a[0],0.21,0.3,-0.3,a[1],0.115,0,a[2]*0.4));
    [1.2,-1.2].forEach(a=>lock(head,hair,a,0.1,0.34,-0.06,0.56,0.085,0.12,0));
    for(let i=0;i<7;i++){const a=1.6+i*(TAU-3.2)/6;lock(head,hair,a,-0.02,0.31,-0.5,0.3,0.14,-0.3,0);}
    lock(head,hair,0.1,0.34,0.02,-2.75,0.3,0.035,-0.9,0.3);
    const tie=pivot(head,0,0.22,-0.34);part(tie,SPH,hair,0,0,0,0.12,0.12,0.12,true);const tr=part(tie,new THREE.TorusGeometry(0.085,0.03,6,14),acc,0,-0.03,-0.02,1,1,1,0);tr.rotation.x=0.9;
    const p1=pivot(tie,0,-0.02,-0.04);part(p1,lockG(0.25,0),hair,0,0,0,0.17,0.5,0.2,true);swings.push({g:p1,base:0.55,amp:0.9,f:6});
    const p2=pivot(p1,0,-0.36,0.1);part(p2,lockG(0.3,0),hair,0,0,0,0.12,0.42,0.14,true);swings.push({g:p2,base:-0.25,amp:0.5,f:7.5});
    const fe=pivot(head,-0.33,0.14,0.04);const f1=part(fe,lockG(0.3,0),white,0,0,0,0.07,0.36,0.03,true);f1.rotation.x=-2.4;f1.rotation.z=0.5;
    const f2=part(fe,lockG(0.3,0),acc,0,-0.03,-0.02,0.055,0.26,0.03,true);f2.rotation.x=-2.1;f2.rotation.z=0.7;part(fe,SPH,trim,0,0,0,0.04,0.04,0.03,true);
    /* 滑翔翼 */
    const gl=pivot(tilt,0,2.28,0.12),sail=toon(0xf6f0dc,{side:THREE.DoubleSide}),sail2=toon(def.acc,{side:THREE.DoubleSide});
    const wg=shapeGeo([[0,0.75],[0.5,0.42,1.95,-0.2],[1.5,-0.5],[1.1,-0.3,0.95,-0.62],[0.5,-0.36,0,-0.7],[-0.5,-0.36,-0.95,-0.62],[-1.1,-0.3,-1.5,-0.5],[-1.95,-0.2],[-0.5,0.42,0,0.75]]);wg.rotateX(-Math.PI/2);
    const wm=new THREE.Mesh(wg,sail);wm.castShadow=true;gl.add(wm);
    const sg2=shapeGeo([[0,0.5],[0.3,0.3,1.2,-0.12],[0.6,-0.2,0,-0.42],[-0.6,-0.2,-1.2,-0.12],[-0.3,0.3,0,0.5]]);sg2.rotateX(-Math.PI/2);const wm2=new THREE.Mesh(sg2,sail2);wm2.position.y=0.02;gl.add(wm2);
    [0.5,-0.5].forEach(s=>{const rb=part(gl,CYL,shoe,s*1.9,0.01,-0.02,0.022,2.0,0.022,0);rb.rotation.z=Math.PI/2;rb.rotation.y=s*0.47;});
    part(gl,CYL,shoe,0,0.01,0.03,0.025,1.45,0.025,0).rotation.x=Math.PI/2;
    [0.3,-0.3].forEach(x=>part(gl,CYL,shoe,x,-0.32,0,0.016,0.66,0.016,0).rotation.z=x*0.5);
    gl.visible=false;m.glider=gl;
  }else{
    /* 霜月：长袍、尖帽、月杖 */
    part(body,lathe([[0.47,0.02],[0.45,0.08],[0.33,0.36],[0.24,0.56]]),white,0,0,0,1,1,0.9,true);
    part(body,lathe([[0.52,0.1],[0.5,0.14],[0.38,0.38],[0.25,0.6],[0.19,0.72],[0.2,0.9],[0.225,1.06],[0.19,1.15],[0.09,1.21],[0,1.21]]),top,0,0,0,1,1,0.86,true);
    const hem=part(body,new THREE.TorusGeometry(0.515,0.022,6,24),trim,0,0.115,0,1,0.86,1,0);hem.rotation.x=Math.PI/2;
    for(let i=0;i<6;i++){const a=i*TAU/6+0.5;part(body,octGeo,trim,Math.sin(a)*0.445,0.26,Math.cos(a)*0.445*0.86,0.03,0.045,0.02,0);}
    const wb=part(body,new THREE.TorusGeometry(0.2,0.035,6,20),trim,0,0.7,0,1,0.86,1,0);wb.rotation.x=Math.PI/2;
    const bow=pivot(body,0,0.7,-0.19);[1,-1].forEach(s=>{const b=part(bow,SPH,def.acc?toon(0xf7d98a):trim,s*0.1,0,0,0.1,0.06,0.03,true);b.rotation.z=s*0.4;});
    const bt=pivot(bow,0,0,0);part(bt,BOX,toon(0xf7d98a),0.05,-0.2,0,0.06,0.36,0.02,true);part(bt,BOX,toon(0xf7d98a),-0.05,-0.17,0,0.06,0.3,0.02,true);swings.push({g:bt,base:0.2,amp:0.7,f:6});
    part(body,lathe([[0.33,0.95],[0.31,0.99],[0.25,1.1],[0.17,1.19],[0.1,1.23],[0,1.23]]),toon(def.bot),0,0,0,1,1,0.88,true);
    const cl=part(body,new THREE.TorusGeometry(0.05,0.016,6,14,4.4),trim,0,1.12,0.2,1,1,1,0);cl.rotation.z=2.5;
    L.g.position.y=R.g.position.y=0.5;
    /* 头发：齐刘海 + 长直发 */
    for(let i=0;i<7;i++){const a=-0.84+i*0.28;lock(head,hair,a,0.21,0.3,-0.3,i===0||i===6?0.24:0.125+(i%2)*0.015,0.11,0,0);}
    [1.15,-1.15].forEach(a=>{lock(head,hair,a,0.12,0.34,-0.03,0.7,0.09,0.1,0);lock(head,hair,a*0.86,0.1,0.35,-0.08,0.4,0.06,0.08,0);});
    const bh=pivot(head,0,0.05,-0.2);part(bh,SPH,hair,0,-0.34,-0.06,0.35,0.5,0.13,true);
    for(let i=0;i<5;i++)part(bh,lockG(0.15,0),hair,-0.24+i*0.12,-0.62,-0.07,0.11,0.42+(i%2)*0.07,0.12,true);
    swings.push({g:bh,base:0.06,amp:0.42,f:4});
    /* 帽子 */
    const hat=pivot(head,0,0.24,-0.03),hm=toon(def.bot,{side:THREE.DoubleSide});hat.rotation.x=-0.16;hat.rotation.z=0.06;
    part(hat,lathe([[0.3,0.04],[0.5,0.0],[0.64,-0.05],[0.7,-0.045]],26),hm,0,0,0,1,1,1,true);
    part(hat,lathe([[0.37,0],[0.33,0.14],[0.24,0.36],[0.15,0.56],[0.1,0.66],[0,0.68]]),hm,0,0,0,1,1,1,true);
    const tip=pivot(hat,0,0.62,0);const tp=part(tip,lockG(0.55,0),hm,0,0,0,0.1,0.42,0.2,true);tp.rotation.x=Math.PI-0.5;
    const band=part(hat,new THREE.TorusGeometry(0.36,0.035,6,22),trim,0,0.05,0,1,1,1,0);band.rotation.x=Math.PI/2;
    const mo=part(hat,new THREE.TorusGeometry(0.075,0.022,6,14,4.3),trim,0.12,0.2,0.3,1,1,1,0);mo.rotation.z=2.4;
    const charm=pivot(tip,0,0.3,-0.36);part(charm,octGeo,basic(0xbfeaff),0,-0.1,0,0.04,0.07,0.04,0);const cg=glowSprite(0x9fdcff,0.5,0.8);cg.position.y=-0.1;charm.add(cg);swings.push({g:charm,base:0,amp:0.6,f:5});
    /* 月杖 */
    const st=pivot(AR.e,0,-0.235,0);part(st,cylG(0.026,0.03),toon(0x7a5a8a),0,0.36,0.07,1,1.55,1,true);
    part(st,SPH,trim,0,-0.42,0.07,0.045,0.045,0.045,true);
    const mn=part(st,new THREE.TorusGeometry(0.17,0.032,7,20,4.5),trim,0,1.3,0.07,1,1,1,true);mn.rotation.z=-0.68;
    part(st,cylG(0.05,0.03),trim,0,1.1,0.07,1,0.08,1,true);
    const cr=part(st,octGeo,basic(0xc9f3ff),0,1.3,0.07,0.07,0.12,0.07,0);m.crystal=cr;
    const sg=glowSprite(0x8fe3ff,1.0,0.85);sg.position.set(0,1.3,0.07);st.add(sg);m.staffGlow=sg;
  }
  return m;
}

/* ===== 敌人 ===== */
const faceCache={};
function eFace(k,o){if(!faceCache[k])faceCache[k]=faceMat(faceTex(Object.assign({style:'dot',blush:'rgba(255,255,255,.0)',cy:128,gap:48,my:168},o)));return faceCache[k];}
const iceGeo=jitter(new THREE.IcosahedronGeometry(1,0),0.18,77);
const iceMat=new THREE.MeshPhongMaterial({color:0xcdf1ff,transparent:true,opacity:0.34,shininess:90,specular:0xffffff,depthWrite:false});
function buildSlime(scale,hex,kind){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const mat=toon(hex),dark=toon(C(hex).multiplyScalar(0.72).getHex());
  part(b,SPH,dark,0,0.17,0,0.8,0.2,0.8,true);
  part(b,SPH,mat,0,0.55,0,0.75,0.6,0.75,true);
  const face=part(b,facePatch,eFace(kind==='king'?'king':(kind==='ember'?'ember':'slime'),kind==='king'?{angry:true,rx:11,ry:15,frown:true}:(kind==='ember'?{angry:true,fang:true}:{blush:'rgba(255,255,255,.28)',cat:true})),0,0.55,0,0.757,0.607,0.757,0);face.castShadow=false;
  const hl=basic(0xffffff,{transparent:true,opacity:0.5});part(b,SPH,hl,-0.3,0.96,0.26,0.16,0.08,0.11,0);part(b,SPH,hl,-0.46,0.8,0.3,0.05,0.04,0.04,0);
  const out={g:g,b:b,mats:[mat,dark],base:C(hex),flame:null};
  if(kind==='grass'){const lf=toon(0x4fae4a);part(b,CYL,lf,0,1.2,0,0.025,0.16,0.025,0);
    [1,-1].forEach(s=>{const l=part(b,SPH,lf,s*0.13,1.3,0,0.15,0.03,0.08,true);l.rotation.z=s*0.5;});}
  else if(kind==='water'){const tp=part(b,lockG(0.4,0),mat,0,1.1,0,0.2,0.36,0.4,true);tp.rotation.x=Math.PI;part(b,SPH,hl,0.05,1.36,0.06,0.04,0.04,0.04,0);}
  else if(kind==='ember'){const fl=pivot(b,0,1.08,0);
    [[0,0,0.2,0.56,0xff7a2a],[0.16,0.08,0.13,0.36,0xffb03a],[-0.15,-0.06,0.13,0.4,0xffb03a],[0,0.02,0.1,0.34,0xfff0a0]].forEach(a=>part(fl,CONE,basic(a[4]),a[0],a[3]/2,a[1],a[2],a[3],a[2],0));
    const gs=glowSprite(0xff8a3a,2.6,0.6);gs.position.y=0.3;fl.add(gs);out.flame=fl;out.fglow=gs;}
  else if(kind==='king'){const gm=toon(0xf2c14e);
    part(b,lathe([[0.3,1.08],[0.36,1.14],[0.34,1.22],[0.4,1.36]],14),toon(0xf2c14e,{side:THREE.DoubleSide}),0,0,0,1,1,1,true);
    for(let i=0;i<6;i++){const a=i*TAU/6;part(b,CONE,gm,Math.cos(a)*0.38,1.42,Math.sin(a)*0.38,0.07,0.2,0.07,true);part(b,SPH,basic(i%2?0xff5a6e:0x6ad0ff),Math.cos(a)*0.35,1.2,Math.sin(a)*0.35,0.04,0.04,0.04,0);}
    part(b,SPH,toon(0xb03a4a),0,1.16,0,0.3,0.1,0.3,0);}
  g.scale.setScalar(scale);
  return out;
}
function buildWisp(){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const mat=toon(0x6a4bc0),hood=toon(0x47308c);
  part(b,lathe([[0,-0.78],[0.07,-0.62],[0.2,-0.34],[0.31,-0.04],[0.3,0.14],[0.2,0.3],[0.08,0.38],[0,0.39]],14),mat,0,0,0,1,1,1,true);
  part(b,lathe([[0.33,-0.02],[0.335,0.12],[0.25,0.3],[0.12,0.4],[0,0.42]],14),hood,0,0.02,-0.03,1,1,1.05,true);
  spike(b,hood,0,0.42,-0.1,0,0.6,-1,0.07,0.26);
  part(b,SPH,basic(0x160d2a),0,0.1,0.17,0.21,0.19,0.14,0);
  [0.09,-0.09].forEach(x=>{part(b,SPH,basic(0xfff0a8),x,0.11,0.3,0.045,0.06,0.02,0);});
  const eg=glowSprite(0xffd76a,0.7,0.7);eg.position.set(0,0.11,0.32);b.add(eg);
  [0.24,-0.24].forEach(x=>{const s=part(b,lockG(0.5,0),mat,x,0,0.06,0.07,0.34,0.1,true);s.rotation.z=x*-3.2;});
  const gl=glowSprite(0xb060ff,3.4,0.6);b.add(gl);
  const orb=pivot(b,0,0,0);for(let i=0;i<3;i++){const a=i*TAU/3;part(orb,octGeo,basic(0xc9a0ff),Math.cos(a)*0.62,-0.05,Math.sin(a)*0.62,0.07,0.13,0.07,0);}
  return {g:g,b:b,mats:[mat,hood],base:C(0x6a4bc0),orb:orb};
}
const batWing=shapeGeo([[0,0.14],[0.8,0.34],[0.62,0.08,0.74,-0.12],[0.54,-0.02,0.46,-0.22],[0.32,-0.06,0.2,-0.22],[0,-0.1]]);
function buildBat(){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const mat=toon(0x587a9c),wing=toon(0x3d5576,{side:THREE.DoubleSide}),belly=toon(0xcfe4ee);
  part(b,SPH,mat,0,0,0,0.34,0.32,0.3,true);part(b,SPH,belly,0,-0.08,0.1,0.22,0.2,0.2,0);
  const face=part(b,facePatch,eFace('bat',{angry:true,fang:true,rx:11,ry:13,gap:44,cy:118,my:156}),0,0,0,0.345,0.325,0.305,0);face.castShadow=false;
  [1,-1].forEach(s=>{const e=part(b,CONE,mat,s*0.2,0.34,0,0.1,0.26,0.06,true);e.rotation.z=-s*0.35;part(b,CONE,belly,s*0.2,0.32,0.03,0.05,0.16,0.02,0).rotation.z=-s*0.35;});
  [0.1,-0.1].forEach(x=>part(b,SPH,wing,x,-0.33,0.02,0.04,0.06,0.05,0));
  const wL=pivot(b,0.24,0.04,-0.04),wR=pivot(b,-0.24,0.04,-0.04);
  const ml=new THREE.Mesh(batWing,wing);ml.castShadow=true;ml.scale.set(1.25,1.25,1);wL.add(ml);
  const mr=new THREE.Mesh(batWing,wing);mr.castShadow=true;mr.scale.set(-1.25,1.25,1);wR.add(mr);
  return {g:g,b:b,mats:[mat],base:C(0x587a9c),wL:wL,wR:wR};
}
function buildGolem(scale,ice){
  const g=new THREE.Group(),b=new THREE.Group();g.add(b);
  const rock=toon(ice?0xa9d8ee:0x938a7c),rockD=toon(ice?0x6fa9cf:0x6e675d),shellM=toon(ice?0xe6f6ff:0x5c6a58),glowC=ice?0x8fe8ff:0xffa040;
  function rk(par,mat,x,y,z,sx,sy,sz,ry){const m=part(par,rockGeo,mat,x,y,z,sx,sy,sz,0.03);m.rotation.y=ry||0;return m;}
  const legL=pivot(b,0.42,0.7,0),legR=pivot(b,-0.42,0.7,0);rk(legL,rockD,0,-0.32,0,0.36,0.46,0.4,0.4);rk(legR,rockD,0,-0.32,0,0.36,0.46,0.4,1.9);
  const torso=pivot(b,0,1.45,0);
  rk(torso,rock,0,0,0,0.95,0.82,0.7,0.3);rk(torso,rockD,0,-0.5,0,0.62,0.4,0.52,1.2);
  const core=part(torso,octGeo,basic(glowC),0,0.05,0.52,0.2,0.26,0.14,0);const cgl=glowSprite(glowC,1.6,0.7);cgl.position.set(0,0.05,0.62);torso.add(cgl);
  const shell=pivot(torso,0,0,0);
  rk(shell,shellM,0,0.1,0.42,0.72,0.6,0.34,0.8);rk(shell,shellM,0.74,0.42,0,0.5,0.42,0.52,2.2);rk(shell,shellM,-0.74,0.42,0,0.5,0.42,0.52,0.5);rk(shell,shellM,0,0.2,-0.5,0.7,0.6,0.3,1.4);
  const head=pivot(torso,0,0.86,0.08);rk(head,rock,0,0,0,0.42,0.36,0.4,0.7);
  part(head,BOX,basic(glowC),0,0,0.3,0.34,0.07,0.1,0);const eg=glowSprite(glowC,1.1,0.6);eg.position.set(0,0,0.4);head.add(eg);
  const armL=pivot(torso,1.02,0.3,0),armR=pivot(torso,-1.02,0.3,0);
  [armL,armR].forEach((a,i)=>{rk(a,rock,0,-0.35,0,0.32,0.44,0.34,i);rk(a,rockD,0,-0.98,0,0.44,0.44,0.46,i+2.4);});
  if(ice){const cm=new THREE.MeshPhongMaterial({color:0xd6f4ff,shininess:100,specular:0xffffff,transparent:true,opacity:0.86});
    [[0.3,0.3,0,0.5,1,-0.2,0.12,0.6],[-0.3,0.3,0,-0.5,1,-0.2,0.12,0.6],[0,0.34,-0.1,0,1,-0.5,0.1,0.4]].forEach(a=>{const s=part(head,CONE4,cm,a[0],a[1],a[2],a[6],a[7],a[6],0);s.quaternion.setFromUnitVectors(UP,tv.set(a[3],a[4],a[5]).normalize());});
    [[0.8,0.8,0,0.5,1,0,0.2,0.9],[-0.8,0.8,0,-0.5,1,0,0.2,0.9],[0.5,0.7,-0.4,0.3,1,-0.6,0.16,0.7],[-0.5,0.7,-0.4,-0.3,1,-0.6,0.16,0.7],[0,0.6,-0.6,0,0.8,-1,0.2,1.0]].forEach(a=>{const s=part(shell,CONE4,cm,a[0],a[1],a[2],a[6],a[7],a[6],0);s.quaternion.setFromUnitVectors(UP,tv.set(a[3],a[4],a[5]).normalize());});
  }else{const moss=toon(0x6fae4e);
    [[0.7,0.86,0.1,0.34,0.14,0.34],[-0.6,0.84,-0.1,0.3,0.12,0.3],[0.1,1.2,0.05,0.26,0.1,0.26]].forEach(a=>part(torso,SPH,moss,a[0],a[1],a[2],a[3],a[4],a[5],0));
    part(torso,CYL,toon(0x4fae4a),0.16,1.36,0.05,0.02,0.16,0.02,0);part(torso,SPH,toon(0xffd84d),0.16,1.46,0.05,0.06,0.04,0.06,0);}
  g.scale.setScalar(scale);
  return {g:g,b:b,mats:[rock,rockD,shellM],base:C(ice?0xa9d8ee:0x938a7c),armL:armL,armR:armR,legL:legL,legR:legR,torso:torso,shell:shell,core:core,cgl:cgl,headP:head};
}
function hpBar(g,y,scale){
  const bg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x1a1420,transparent:true,opacity:0.75,depthWrite:false,depthTest:false}));
  const fg=new THREE.Sprite(new THREE.SpriteMaterial({color:0xff5a6e,depthWrite:false,depthTest:false,transparent:true}));
  const w=1.4/scale,h=0.15/scale;bg.scale.set(w*1.04,h,1);fg.scale.set(w,h*0.62,1);
  bg.position.y=y;fg.position.y=y;bg.renderOrder=3;fg.renderOrder=4;bg.visible=fg.visible=false;g.add(bg);g.add(fg);
  return {bg:bg,fg:fg,w:w};
}
