/* ===== 游戏状态 ===== */
const heroes=HEROES.map((d,i)=>{const m=buildHero(d,i);m.root.visible=i===0;scene.add(m.root);return m;});
const heroShadow=blobShadow(0.55);
const H={p:new V3(SPAWN.x,SPAWN.y,SPAWN.z),v:new V3(),vy:0,grounded:true,swim:false,glide:false,jumps:0,air:0,face:-2.3,ci:0,
  hp:6,maxHp:6,st:100,maxSt:100,stLock:false,stWait:0,inv:0,atkT:0,atkDur:0.3,atkCd:0,combo:0,comboT:0,hitT:-1,
  dashT:0,dashX:0,dashZ:1,dashId:0,frost:0,cds:[0,0,0],castT:0,dead:false,deadT:0,
  safe:new V3(SPAWN.x,SPAWN.y,SPAWN.z),safeT:0,walk:0,frags:0,pop:0,stepT:0,twist:0};
const S={shards:0,chestsOpen:0,towersLit:0,done:false,hints:{},respawn:new V3(SPAWN.x,SPAWN.y,SPAWN.z),stBonus:0,fin:0};
const I={mx:0,mz:0,run:false,jumpHeld:false,jump:false,atk:false,skill:false};
let started=false,paused=false,shake=0;

/* ===== 敌人 ===== */
const enemies=[];
function addEnemy(type,x,z,hex){
  const y=groundH(x,z);let m,e;
  if(type==='wisp'){m=buildWisp();e={r:0.5,hp:3,dmg:1};}
  else if(type==='king'){m=buildSlime(2.6,0xffa53d,true);e={r:1.9,hp:18,dmg:2};}
  else{m=buildSlime(1,hex||0x7ddc6a);e={r:0.75,hp:4,dmg:1};}
  e.type=type;e.home={x:x,z:z};e.p=new V3(x,type==='wisp'?y+2.2:y,z);e.v=new V3();e.vy=0;e.maxHp=e.hp;e.grounded=true;
  e.t=Math.random()*2;e.frozen=0;e.flash=0;e.alive=true;e.respawn=0;e.cool=1+Math.random()*2;e.m=m;e.sq=0;e.dash=-1;e.seed=Math.random()*10;
  e.bar=hpBar(m.g,type==='wisp'?0.75:1.55,type==='king'?2.6:1);
  e.sh=blobShadow(e.r*0.95);
  m.g.position.copy(e.p);scene.add(m.g);enemies.push(e);return e;
}
(function(){
  CAMPS.forEach((c,i)=>{for(let k=0;k<3;k++){const a=k*2.1+i;addEnemy('slime',c.x+Math.cos(a)*4.5,c.z+Math.sin(a)*4.5,i%2?0x6ac8f0:0x7ddc6a);}
    if(i===1||i===4)addEnemy('wisp',c.x+2,c.z-5);});
  const t=TOWERS[2];addEnemy('king',t.x+9,t.z+7);addEnemy('slime',t.x-8,t.z+6);addEnemy('slime',t.x+4,t.z-9);
  const r=rngOf(3131);let n=0;
  for(let i=0;i<3000&&n<16;i++){const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);
    if(h<2||h>30||forestN(x,z)>0.5||nearSite(x,z,12)||Math.hypot(x-SPAWN.x,z-SPAWN.z)<45)continue;addEnemy('slime',x,z,h<6?0x6ac8f0:0x7ddc6a);n++;}
  n=0;for(let i=0;i<3000&&n<8;i++){const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);
    if(h<3||nearSite(x,z,12)||!(forestN(x,z)>0.62||(h>38&&h<72)))continue;addEnemy('wisp',x,z);n++;}
})();
function nearestEnemy(range){let best=null,bd=range;
  for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const d=Math.hypot(e.p.x-H.p.x,e.p.z-H.p.z)-e.r;
    if(d<bd&&Math.abs(e.p.y-H.p.y)<9){bd=d;best=e;}}return best;}
function damageEnemy(e,d,kx,kz,freeze){
  if(!e.alive)return;e.hp-=d;e.flash=0.14;
  const cy=e.type==='wisp'?e.p.y:e.p.y+e.r*0.8;
  burst(e.p.x,cy,e.p.z,8,5,0xffffff,0.35,0.3,1);
  if(e.type!=='king'){e.v.x=kx*7;e.v.z=kz*7;if(e.type!=='wisp'){e.vy=5;e.grounded=false;}}
  if(freeze)e.frozen=Math.max(e.frozen,freeze);
  e.cool=Math.max(e.cool,0.5);sfx('hit');
  if(e.hp<=0){e.alive=false;e.respawn=e.type==='king'?1e9:110;e.m.g.visible=false;e.sh.visible=false;
    burst(e.p.x,cy,e.p.z,26,7,e.m.base.getHex(),0.5,0.7,2);shockRing(e.p.x,e.p.y+0.2,e.p.z,e.r*3,0xffffff,0.35);sfx('pop');
    if(Math.random()<0.4||e.type==='king')heal(e.type==='king'?4:1,e.p.x,cy,e.p.z);
    if(e.type==='king')toast('史莱姆王被打败了');}
}
function updateEnemies(dt,t){
  for(let i=0;i<enemies.length;i++){const e=enemies[i];
    if(!e.alive){e.respawn-=dt;if(e.respawn<=0&&Math.hypot(e.home.x-H.p.x,e.home.z-H.p.z)>70){
        e.alive=true;e.hp=e.maxHp;e.p.set(e.home.x,groundH(e.home.x,e.home.z)+(e.type==='wisp'?2.2:0),e.home.z);e.v.set(0,0,0);e.frozen=0;e.m.g.visible=true;e.sh.visible=true;}
      continue;}
    const dx=H.p.x-e.p.x,dz=H.p.z-e.p.z,d=Math.hypot(dx,dz);
    if(d>130){e.m.g.visible=false;e.sh.visible=false;continue;}
    e.m.g.visible=true;e.sh.visible=true;
    e.t+=dt;e.cool-=dt;e.flash-=dt;
    const frozen=e.frozen>0;if(frozen)e.frozen-=dt;
    const aggro=started&&!H.dead&&d<(e.type==='wisp'?22:17)&&Math.abs(H.p.y-e.p.y)<8;
    if(aggro&&!S.hints.fight)hint('fight','有敌人。攻击键出招，技能键放技能');
    if(e.type==='wisp'){
      const gy=Math.max(groundH(e.p.x,e.p.z),WATER)+2.2+Math.sin(e.t*2+e.seed)*0.35;
      if(!frozen){
        let tx=0,tz=0;
        if(aggro&&d>0.1){const want=d>11?1:(d<7?-1:0);tx=dx/d*want*3.6-dz/d*1.6*Math.sin(e.t*0.7+e.seed);tz=dz/d*want*3.6+dx/d*1.6*Math.sin(e.t*0.7+e.seed);
          if(e.cool<=0&&d<20){e.cool=2.6;const oy=H.p.y+1-e.p.y,l=Math.hypot(d,oy);shoot('orb',e.p.x,e.p.y,e.p.z,dx/l,oy/l,dz/l,null);sfx('orb');}}
        else{const hx=e.home.x-e.p.x,hz=e.home.z-e.p.z,hd=Math.hypot(hx,hz);if(hd>6){tx=hx/hd*2;tz=hz/hd*2;}else{tx=Math.cos(e.t*0.5+e.seed)*1.2;tz=Math.sin(e.t*0.4+e.seed)*1.2;}}
        const k=Math.min(1,dt*3);e.v.x+=(tx-e.v.x)*k;e.v.z+=(tz-e.v.z)*k;
        e.p.x+=e.v.x*dt;e.p.z+=e.v.z*dt;e.p.y+=(gy-e.p.y)*Math.min(1,dt*4);
        e.m.orb.rotation.y=e.t*3;e.m.g.rotation.y=Math.atan2(dx,dz);
      }
    }else{
      if(e.grounded){
        e.v.x*=Math.max(0,1-dt*10);e.v.z*=Math.max(0,1-dt*10);
        if(!frozen&&e.cool<=0){
          let tx,tz,sp,up;
          if(aggro&&d>0.1){tx=dx/d;tz=dz/d;sp=e.type==='king'?7.5:6.4;up=e.type==='king'?9:7.2;e.cool=(e.type==='king'?1.1:0.5)+Math.random()*0.35;}
          else{const hx=e.home.x-e.p.x,hz=e.home.z-e.p.z,hd=Math.hypot(hx,hz);
            if(hd>9){tx=hx/hd;tz=hz/hd;}else{const a=Math.random()*TAU;tx=Math.cos(a);tz=Math.sin(a);}sp=2.4;up=4.6;e.cool=1.4+Math.random()*2.2;}
          if(groundH(e.p.x+tx*sp*0.5,e.p.z+tz*sp*0.5)>0.4){e.v.x=tx*sp;e.v.z=tz*sp;e.vy=up;e.grounded=false;e.m.g.rotation.y=Math.atan2(tx,tz);}
        }
      }
      if(!e.grounded){
        const nx=e.p.x+e.v.x*dt,nz=e.p.z+e.v.z*dt;
        if(groundH(nx,nz)>0.2){e.p.x=nx;e.p.z=nz;}else{e.v.x=e.v.z=0;}
        pushOut(e.p,e.r*0.7);
        e.vy-=24*dt;e.p.y+=e.vy*dt;const g=groundH(e.p.x,e.p.z);
        if(e.p.y<=g){e.p.y=g;e.grounded=true;e.sq=1;
          if(e.type==='king'&&e.vy<-6){shockRing(e.p.x,g+0.2,e.p.z,5.5,0xffc060,0.45);shake=Math.max(shake,0.3);sfx('thump');
            if(d<5.2&&H.grounded&&!H.dead)heroHurt(1,e.p.x,e.p.z);}
          e.vy=0;}
      }else e.p.y=groundH(e.p.x,e.p.z);
      e.sq=Math.max(0,e.sq-dt*4);
      const air=e.grounded?0:clamp(e.vy*0.03,-0.25,0.3),sy=1-e.sq*0.3+air+Math.sin(e.t*3+e.seed)*0.04;
      e.m.b.scale.set(1+(1-sy)*0.6,sy,1+(1-sy)*0.6);
    }
    if(!frozen&&!H.dead&&H.inv<=0&&d<e.r+0.55&&Math.abs((H.p.y+0.8)-(e.type==='wisp'?e.p.y:e.p.y+e.r*0.6))<1.6)heroHurt(e.dmg,e.p.x,e.p.z);
    e.m.g.position.copy(e.p);
    if(e.type==='wisp'){e.m.mat.color.copy(e.m.base);if(frozen)e.m.mat.color.set(0x9fdcff);if(e.flash>0)e.m.mat.color.set(0xffffff);}
    else{e.m.mat.color.copy(e.m.base);if(frozen)e.m.mat.color.set(0xa8e4ff);e.m.mat.emissive.setHex(e.flash>0?0xaaaaaa:0x000000);}
    const gh=groundH(e.p.x,e.p.z);e.sh.position.set(e.p.x,Math.max(gh,WATER)+0.1,e.p.z);
    const show=e.hp<e.maxHp;e.bar.bg.visible=e.bar.fg.visible=show;
    if(show){const r=Math.max(0.02,e.hp/e.maxHp);e.bar.fg.scale.x=e.bar.w*r;e.bar.fg.center.x=0.5/r;}
  }
}

/* ===== 飞行物 ===== */
const shots=[];
function shoot(kind,x,y,z,dx,dy,dz,target){
  let s=null;for(let i=0;i<shots.length;i++)if(!shots[i].on&&shots[i].kind===kind){s=shots[i];break;}
  if(!s){const g=new THREE.Group();let m;
    if(kind==='wind'){m=new THREE.Mesh(SPH,basic(0xd6fff3));m.scale.set(0.8,0.09,0.28);g.add(m);g.add(glowSprite(0x7ff5d8,2.4,0.7));}
    else if(kind==='ice'){m=new THREE.Mesh(octGeo,basic(0xe2f8ff));m.scale.set(0.17,0.17,0.45);g.add(m);g.add(glowSprite(0x8fdcff,2.2,0.85));}
    else{m=new THREE.Mesh(SPH,basic(0xf3c6ff));m.scale.setScalar(0.26);g.add(m);g.add(glowSprite(0xc070ff,2.6,0.85));}
    scene.add(g);s={g:g,m:m,kind:kind,p:new V3(),v:new V3(),on:false,life:0,target:null,sp:1};shots.push(s);}
  s.sp=kind==='wind'?30:(kind==='ice'?22:9.5);
  s.on=true;s.g.visible=true;s.p.set(x,y,z);s.v.set(dx*s.sp,dy*s.sp,dz*s.sp);s.life=kind==='orb'?3.2:(kind==='wind'?0.8:1.4);s.target=target;
  s.g.position.copy(s.p);s.g.rotation.y=Math.atan2(dx,dz);
}
function updateShots(dt){
  for(let i=0;i<shots.length;i++){const s=shots[i];if(!s.on)continue;s.life-=dt;
    if(s.kind==='ice'&&s.target&&s.target.alive){const e=s.target;tv.set(e.p.x-s.p.x,e.p.y+(e.type==='wisp'?0:e.r*0.8)-s.p.y,e.p.z-s.p.z).normalize().multiplyScalar(s.sp);s.v.lerp(tv,Math.min(1,dt*5));s.g.rotation.y=Math.atan2(s.v.x,s.v.z);}
    s.p.addScaledVector(s.v,dt);s.g.position.copy(s.p);
    if(s.kind==='wind')s.g.rotation.y+=dt*20;
    if(Math.random()<dt*30)spark(s.p.x,s.p.y,s.p.z,(Math.random()-0.5),(Math.random()-0.5),(Math.random()-0.5),0.35,0.3,s.kind==='wind'?0x9ff5e0:(s.kind==='ice'?0xaee9ff:0xd08cff),0,1);
    let hit=false;
    if(s.kind==='orb'){if(!H.dead&&Math.hypot(s.p.x-H.p.x,s.p.y-H.p.y-0.9,s.p.z-H.p.z)<0.9){heroHurt(1,s.p.x-s.v.x,s.p.z-s.v.z);hit=true;}}
    else for(let j=0;j<enemies.length;j++){const e=enemies[j];if(!e.alive)continue;
      const cy=e.type==='wisp'?e.p.y:e.p.y+e.r*0.8;
      if(Math.hypot(s.p.x-e.p.x,s.p.y-cy,s.p.z-e.p.z)<e.r+0.6){const l=Math.hypot(s.v.x,s.v.z)||1;damageEnemy(e,1.5,s.v.x/l,s.v.z/l,s.kind==='ice'?1.3:0);hit=true;break;}}
    if(hit||s.life<=0||s.p.y<groundH(s.p.x,s.p.z)-0.1){s.on=false;s.g.visible=false;burst(s.p.x,s.p.y,s.p.z,6,3,s.kind==='wind'?0x9ff5e0:(s.kind==='ice'?0xaee9ff:0xd08cff),0.3,0.3,0,0);}
  }
}

/* ===== 冰面 ===== */
const floes=[],floeGeo=new THREE.CylinderGeometry(2.05,1.7,0.5,6),floeMat=new THREE.MeshPhongMaterial({color:0xd9f4ff,transparent:true,opacity:0.86,shininess:90,specular:0xffffff,flatShading:true});
function addFloe(x,z){
  let f=null;for(let i=0;i<floes.length;i++)if(floes[i].t<=0){f=floes[i];break;}
  if(!f){if(floes.length>70)return;const m=new THREE.Mesh(floeGeo,floeMat);scene.add(m);f={m:m,plat:addPlat(0,0,2.0,WATER+0.12,WATER-1.4),t:0};f.plat.on=false;floes.push(f);}
  f.t=7.5;f.plat.x=x;f.plat.z=z;f.plat.on=true;f.m.visible=true;f.m.position.set(x,WATER-0.13,z);f.m.rotation.y=x*1.7+z;f.m.scale.set(0.2,1,0.2);
  burst(x,WATER+0.3,z,5,2.5,0xcff3ff,0.3,0.4,1.5);
}
function updateFloes(dt){for(let i=0;i<floes.length;i++){const f=floes[i];if(f.t<=0)continue;f.t-=dt;
  const s=Math.min(1,(7.5-f.t)*6,f.t*1.6);f.m.scale.set(s,1,s);f.m.position.y=WATER-0.13-(f.t<0.6?(0.6-f.t)*0.6:0);
  if(f.t<=0.25)f.plat.on=false;if(f.t<=0)f.m.visible=false;}}

/* ===== 角色动作 ===== */
function heal(n,x,y,z){if(H.hp>=H.maxHp)return;H.hp=Math.min(H.maxHp,H.hp+n);hudHearts();
  burst(x===undefined?H.p.x:x,y===undefined?H.p.y+1:y,z===undefined?H.p.z:z,10,3,0xff7a9a,0.4,0.8,3,-1);sfx('heal');}
function heroHurt(d,fx,fz){
  if(H.inv>0||H.dead||!started)return;
  H.hp-=d;H.inv=1.1;let kx=H.p.x-fx,kz=H.p.z-fz;const l=Math.hypot(kx,kz)||1;kx/=l;kz/=l;
  H.v.x=kx*9;H.v.z=kz*9;H.vy=6;H.grounded=false;H.glide=false;H.dashT=0;shake=Math.max(shake,0.35);
  burst(H.p.x,H.p.y+1,H.p.z,12,5,0xff6a6a,0.4,0.4,1);sfx('hurt');hudHearts();vignette();
  if(H.hp<=0){H.hp=0;H.dead=true;H.deadT=2.4;fade(true);toast('倒下了。回到上一个落脚点');hudHearts();}
}
function respawnHero(){H.dead=false;H.p.copy(S.respawn);H.v.set(0,0,0);H.vy=0;H.hp=H.maxHp;H.st=H.maxSt;H.stLock=false;H.inv=2;H.grounded=true;H.frost=0;hudHearts();fade(false);}
function drown(){toast('体力耗尽，被浪推回了岸边');H.p.copy(H.safe);H.v.set(0,0,0);H.vy=0;H.st=H.maxSt*0.5;H.stLock=false;H.swim=false;H.inv=0;heroHurt(1,H.p.x,H.p.z+1);H.v.set(0,0,0);H.vy=0;
  if(!S.hints.ice)hint('ice','水太宽就别硬游。切到霜月放「霜华」，能踏冰过水');}
function switchHero(i){
  if(i===H.ci||H.dead||H.dashT>0)return;
  heroes[H.ci].root.visible=false;H.ci=i;heroes[i].root.visible=true;H.glide=false;H.atkT=0;H.pop=1;
  if(heroes[1].glider)heroes[1].glider.visible=false;
  burst(H.p.x,H.p.y+1,H.p.z,22,4,HEROES[i].hex,0.45,0.5,2,0);shockRing(H.p.x,H.p.y+0.15,H.p.z,2.6,HEROES[i].hex,0.35);sfx('switch');hudChars();
}
function tryAttack(){
  if(H.atkCd>0||H.swim||H.glide||H.dashT>0||H.dead)return;
  const ci=H.ci;
  if(ci===0){
    H.combo=H.comboT>0?(H.combo+1)%3:0;H.comboT=0.8;const big=H.combo===2;
    H.atkDur=H.atkT=big?0.36:0.27;H.atkCd=big?0.44:0.3;H.hitT=0.08;
    const e=nearestEnemy(5);if(e)H.face=Math.atan2(e.p.x-H.p.x,e.p.z-H.p.z);
    if(H.grounded){H.v.x+=Math.sin(H.face)*5.5;H.v.z+=Math.cos(H.face)*5.5;}
    slashArc(H.p.x+Math.sin(H.face)*0.4,H.p.y+1.0,H.p.z+Math.cos(H.face)*0.4,H.face,H.combo%2?-1:1,big?1.4:1,big?0xffd27a:0xffffff);sfx('slash');
  }else{
    const e=nearestEnemy(23);let dx=Math.sin(H.face),dy=0,dz=Math.cos(H.face);
    if(e){H.face=Math.atan2(e.p.x-H.p.x,e.p.z-H.p.z);tv.set(e.p.x-H.p.x,e.p.y+(e.type==='wisp'?0:e.r*0.8)-(H.p.y+1.15),e.p.z-H.p.z).normalize();dx=tv.x;dy=tv.y;dz=tv.z;}
    H.atkDur=H.atkT=0.26;H.atkCd=ci===1?0.38:0.55;H.hitT=-1;
    shoot(ci===1?'wind':'ice',H.p.x+Math.sin(H.face)*0.5,H.p.y+1.15,H.p.z+Math.cos(H.face)*0.5,dx,dy,dz,e);sfx(ci===1?'whoosh':'icebolt');
  }
}
function meleeHit(){
  const big=H.combo===2,reach=big?3.5:2.9,dmg=big?3:2;let hit=false;
  for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;
    if(d<reach+e.r&&Math.abs(e.p.y-H.p.y)<3.2&&(d<1.3+e.r||Math.abs(angDiff(Math.atan2(dx,dz),H.face))<1.3)){damageEnemy(e,dmg,dx/d,dz/d);hit=true;}}
  if(hit)shake=Math.max(shake,big?0.3:0.16);
}
function breakCrack(c){
  c.alive=false;c.m.visible=false;c.glow.visible=false;c.col.on=false;
  burst(c.x,c.y+c.s*0.6,c.z,40,9,0xc9a27a,0.6,0.9,3,14);burst(c.x,c.y+c.s*0.6,c.z,20,6,0xff9a4a,0.5,0.5,2);
  shockRing(c.x,c.y+0.2,c.z,c.s*2.4,0xffc890,0.5);shake=Math.max(shake,0.5);sfx('break');
  if(c.chest){c.chest.hidden=false;c.chest.g.visible=true;toast('岩石里藏着一只宝箱');}
  if(c.tower){c.tower.sealed=false;toast('封印解开了。走近风塔把它点亮');}
  saveGame();
}
function trySkill(wx,wz,mag){
  const ci=H.ci;if(H.dead||H.dashT>0)return;
  if(H.cds[ci]>0){sfx('deny');return;}
  if(ci===0){
    if(H.swim)return;let dx=Math.sin(H.face),dz=Math.cos(H.face);
    if(mag>0.2){const l=Math.hypot(wx,wz);dx=wx/l;dz=wz/l;}else{const e=nearestEnemy(9);if(e){const l=Math.hypot(e.p.x-H.p.x,e.p.z-H.p.z)||1;dx=(e.p.x-H.p.x)/l;dz=(e.p.z-H.p.z)/l;}}
    H.dashX=dx;H.dashZ=dz;H.dashT=0.22;H.dashId++;H.inv=Math.max(H.inv,0.42);H.face=Math.atan2(dx,dz);H.atkT=0;sfx('dash');
  }else if(ci===1){
    H.vy=26;H.grounded=false;H.swim=false;H.jumps=1;H.air=1;H.p.y+=0.15;
    shockRing(H.p.x,H.p.y+0.2,H.p.z,6.5,0x9ff5e0,0.5);
    for(let i=0;i<26;i++){const a=i/26*TAU;spark(H.p.x+Math.cos(a)*1.2,H.p.y+0.2,H.p.z+Math.sin(a)*1.2,Math.cos(a)*2,9+Math.random()*6,Math.sin(a)*2,0.7,0.45,0xb8ffe9,6,0.5);}
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;if(d<5.5+e.r&&Math.abs(e.p.y-H.p.y)<4)damageEnemy(e,1,dx/d,dz/d);}
    sfx('wind');
  }else{
    H.castT=0.5;H.frost=12;shockRing(H.p.x,H.p.y+0.3,H.p.z,8.5,0xaee9ff,0.65);shockRing(H.p.x,H.p.y+0.3,H.p.z,5,0xffffff,0.45);
    burst(H.p.x,H.p.y+1,H.p.z,40,8,0xbfeeff,0.5,0.9,2,2);
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;if(d<8.5+e.r&&Math.abs(e.p.y-H.p.y)<6)damageEnemy(e,2,dx/d*0.2,dz/d*0.2,4.2);}
    if(H.swim||groundH(H.p.x,H.p.z)<WATER-0.15){addFloe(H.p.x,H.p.z);H.p.y=Math.max(H.p.y,WATER+0.12);H.swim=false;H.vy=0;H.grounded=true;}
    sfx('ice');
  }
  H.cds[ci]=HEROES[ci].cd;
}

function updateHero(dt,t){
  H.inv=Math.max(0,H.inv-dt);H.atkCd-=dt;H.comboT-=dt;H.castT-=dt;H.frost=Math.max(0,H.frost-dt);H.pop=Math.max(0,H.pop-dt*4);
  for(let i=0;i<3;i++)H.cds[i]=Math.max(0,H.cds[i]-dt);
  if(H.dead){H.deadT-=dt;I.jump=I.atk=I.skill=false;if(H.deadT<=0)respawnHero();return;}
  let ix=I.mx,iz=I.mz,mag=Math.hypot(ix,iz);if(mag>1){ix/=mag;iz/=mag;mag=1;}
  const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
  const wx=fx*iz+rx*ix,wz=fz*iz+rz*ix;
  const g0=groundH(H.p.x,H.p.z);let drain=0;
  if(I.skill){I.skill=false;trySkill(wx,wz,mag);}
  if(I.atk){I.atk=false;tryAttack();}
  if(H.atkT>0){H.atkT-=dt;if(H.hitT>=0&&H.atkDur-H.atkT>=H.hitT){H.hitT=-1;meleeHit();}}
  let running=false;
  if(H.dashT>0){
    H.dashT-=dt;H.v.x=H.dashX*44;H.v.z=H.dashZ*44;if(H.vy<0)H.vy=0;
    for(let i=0;i<3;i++)spark(H.p.x+(Math.random()-0.5)*0.6,H.p.y+0.4+Math.random()*1.2,H.p.z+(Math.random()-0.5)*0.6,-H.dashX*3,Math.random(),-H.dashZ*3,0.35,0.5,i?0xff9a7a:0xfff0d0,0,2);
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive||e.dash===H.dashId)continue;
      if(Math.hypot(e.p.x-H.p.x,e.p.z-H.p.z)<2.5+e.r&&Math.abs(e.p.y-H.p.y)<3.5){e.dash=H.dashId;damageEnemy(e,4,H.dashX,H.dashZ);shake=Math.max(shake,0.3);}}
    for(let i=0;i<cracks.length;i++){const c=cracks[i];if(c.alive&&Math.hypot(c.x-H.p.x,c.z-H.p.z)<c.s+1.9&&Math.abs(c.y-H.p.y)<5)breakCrack(c);}
    if(H.dashT<=0){H.v.x*=0.22;H.v.z*=0.22;slashArc(H.p.x,H.p.y+1,H.p.z,H.face,1,1.6,0xffb08a);}
  }else{
    running=I.run&&mag>0.1&&!H.stLock&&H.grounded&&!H.swim;
    let sp=running?11.5:6.2;if(H.swim)sp=3.4;if(H.glide)sp=9.5;if(H.atkT>0&&H.grounded)sp*=0.35;if(H.castT>0)sp*=0.3;
    if(running)drain=11;
    const k=1-Math.exp(-dt*(H.grounded?12:(H.glide?3.5:2.6)));
    H.v.x+=(wx*sp-H.v.x)*k;H.v.z+=(wz*sp-H.v.z)*k;
  }
  let dx=H.v.x*dt,dz=H.v.z*dt;const step=Math.hypot(dx,dz);
  if(step>1e-5){
    if(H.grounded&&!H.swim&&H.dashT<=0&&H.p.y<=g0+0.05){const rise=(groundH(H.p.x+dx,H.p.z+dz)-g0)/step;if(rise>0.95){const f=Math.max(0.14,1-(rise-0.95)*0.9);dx*=f;dz*=f;}}
    H.p.x+=dx;H.p.z+=dz;}
  const rr=Math.hypot(H.p.x,H.p.z),lim=WORLD_R+40;if(rr>lim){H.p.x*=lim/rr;H.p.z*=lim/rr;}
  pushOut(H.p,0.38);
  for(let i=0;i<plats.length;i++){const p=plats[i];if(!p.on)continue;const px=H.p.x-p.x,pz=H.p.z-p.z,d=Math.hypot(px,pz);
    if(d>=p.r+0.38)continue;
    if(H.p.y<p.top-0.6&&H.p.y+1.7>p.bot){if(H.p.y<p.bot&&H.vy>0&&d<p.r){H.vy=0;}else if(d>0.001){const s=(p.r+0.38)/d;H.p.x=p.x+px*s;H.p.z=p.z+pz*s;}}}
  const g=groundH(H.p.x,H.p.z),pf=platFloor(H.p.x,H.p.z,H.p.y),wf=WATER-1.05,floor=Math.max(g,pf,wf);
  if(I.jump){I.jump=false;
    if(H.grounded||H.air<0.12){H.vy=H.swim?6.5:10.8;H.grounded=false;H.jumps=1;H.air=1;sfx('jump');}
    else if(H.ci===1&&H.jumps<2&&H.vy<8){H.vy=10.4;H.jumps=2;H.air=1;shockRing(H.p.x,H.p.y,H.p.z,1.6,0xb8ffe9,0.3);sfx('jump2');}
  }
  const wasGlide=H.glide;
  H.glide=H.ci===1&&!H.grounded&&I.jumpHeld&&(wasGlide||H.vy<2)&&!H.stLock&&H.dashT<=0&&H.p.y-floor>1.0;
  if(H.glide&&!wasGlide)sfx('glide');
  if(heroes[1].glider)heroes[1].glider.visible=H.glide;
  if(H.grounded&&H.vy<=0&&H.p.y-floor<0.7){H.p.y=floor;H.vy=0;}
  else{
    if(H.glide){drain=6;let lift=false;
      for(let i=0;i<COLUMNS.length;i++){const c=COLUMNS[i];if(Math.hypot(H.p.x-c.x,H.p.z-c.z)<3.8&&H.p.y>c.y0-1&&H.p.y<c.top){lift=true;break;}}
      if(lift){H.vy+=(11-H.vy)*Math.min(1,dt*4);if(Math.random()<dt*20)spark(H.p.x+(Math.random()-0.5)*2,H.p.y,H.p.z+(Math.random()-0.5)*2,0,8,0,0.5,0.3,0xd8fff4,0,0);}
      else{H.vy-=30*dt;if(H.vy<-1.7)H.vy+=(-1.7-H.vy)*Math.min(1,dt*8);}
    }else H.vy-=30*dt;
    H.p.y+=H.vy*dt;
    if(H.p.y<=floor){if(!H.grounded&&H.vy<-9&&floor>wf){burst(H.p.x,floor+0.1,H.p.z,8,2.5,0xe8e0c8,0.3,0.4,1,2);sfx('land');}
      if(!H.grounded&&floor===wf&&H.vy<-4){burst(H.p.x,WATER+0.1,H.p.z,14,4,0xd8f4ff,0.35,0.6,3,9);sfx('splash');}
      H.p.y=floor;H.vy=0;H.grounded=true;H.glide=false;}
    else H.grounded=false;
  }
  H.swim=H.grounded&&floor===wf&&H.p.y<=wf+0.02;
  if(H.grounded){H.air=0;H.jumps=0;}else H.air+=dt;
  if(H.swim){drain=10;if(!S.hints.swim)hint('swim','游泳会消耗体力，耗尽就会被冲回岸边');}
  if(drain>0){H.st-=drain*dt;H.stWait=0.9;if(H.st<=0){H.st=0;H.stLock=true;if(H.swim)drown();}}
  else{H.stWait-=dt;if(H.stWait<=0&&H.grounded&&!H.swim)H.st=Math.min(H.maxSt,H.st+34*dt);if(H.stLock&&H.st>=H.maxSt*0.3)H.stLock=false;}
  if(H.grounded&&!H.swim&&g>0.8&&Math.abs(H.p.y-g)<0.1){H.safeT+=dt;if(H.safeT>0.4){H.safe.copy(H.p);H.safeT=0;}}
  if(H.frost>0&&!H.swim){
    const qx=H.p.x+H.v.x*0.2,qz=H.p.z+H.v.z*0.2;
    if(groundH(qx,qz)<WATER-0.15&&platFloor(qx,qz,WATER+0.6)<WATER&&H.p.y<WATER+1.2)addFloe(qx,qz);
    if(Math.random()<dt*14)spark(H.p.x+(Math.random()-0.5),H.p.y+0.1,H.p.z+(Math.random()-0.5),0,1.2,0,0.7,0.28,0xcff3ff,-0.5,0);
  }
  const hs=Math.hypot(H.v.x,H.v.z);
  if(H.dashT<=0&&H.atkT<=0&&hs>0.6)H.face+=angDiff(Math.atan2(H.v.x,H.v.z),H.face)*Math.min(1,dt*13);
  if(running&&H.grounded){H.stepT-=dt;if(H.stepT<=0){H.stepT=0.16;spark(H.p.x,H.p.y+0.1,H.p.z,-H.v.x*0.1,0.8,-H.v.z*0.1,0.4,0.35,0xe8e0c8,-1,2);}}
  H.running=running;H.speed=hs;
}

function animHero(dt,t){
  const m=heroes[H.ci],hs=H.speed||0,amt=Math.min(1,hs/6.2),run=clamp((hs-6.2)/5,0,1);
  H.walk+=hs*dt*1.75;const s=Math.sin(H.walk),c=Math.cos(H.walk);
  let aL=0,aR=0,lL=0,lR=0,by=Math.sin(t*2)*0.012,tx=0,twist=0;
  if(H.dead){tx=-1.45;}
  else if(H.dashT>0){tx=0.65;aR=-1.4;aL=0.8;lL=0.7;lR=-0.5;}
  else if(H.glide){aL=aR=-2.95;lL=0.3+Math.sin(t*3)*0.1;lR=0.12-Math.sin(t*3)*0.1;tx=0.3;}
  else if(H.swim){tx=1.1;aL=-2.3+s*0.9;aR=-2.3-s*0.9;lL=s*0.5;lR=-s*0.5;by=Math.sin(t*2.5)*0.05;}
  else if(!H.grounded){const f=clamp(-H.vy*0.05,-0.5,0.9);aL=aR=-0.9-f;lL=0.55;lR=-0.3;tx=0.08;}
  else{lL=s*(0.75+run*0.3)*amt;lR=-lL;aL=-s*(0.6+run*0.45)*amt;aR=-aL;by+=Math.abs(c)*0.055*amt;tx=amt*(0.05+run*0.2);}
  if(m.idx===2&&H.grounded&&!H.swim)by+=0.05+Math.sin(t*2.4)*0.04;
  if(H.atkT>0){const k=1-H.atkT/H.atkDur;
    if(H.ci===0){aR=lerp(-2.7,1.0,sstep(0,0.55,k));twist=lerp(0.75,-0.65,sstep(0,0.6,k))*(H.combo%2?-1:1);}
    else{aR=-1.5-Math.sin(k*Math.PI)*0.5;if(H.ci===1){aL=-1.2;twist=0.4;}}}
  if(H.castT>0){aL=aR=-2.7;}
  const k=Math.min(1,dt*18);
  m.armL.rotation.x+=(aL-m.armL.rotation.x)*k;m.armR.rotation.x+=(aR-m.armR.rotation.x)*k;
  m.legL.rotation.x+=(lL-m.legL.rotation.x)*k;m.legR.rotation.x+=(lR-m.legR.rotation.x)*k;
  m.tilt.rotation.x+=(tx-m.tilt.rotation.x)*Math.min(1,dt*9);
  H.twist+=(twist-H.twist)*Math.min(1,dt*22);m.body.rotation.y=H.twist;
  m.body.position.y=by;
  m.head.rotation.x=H.grounded?Math.sin(t*1.3)*0.03:-0.1;
  for(let i=0;i<m.swings.length;i++){const w=m.swings[i];
    w.g.rotation.x=w.base+amt*w.amp*(0.6+run*0.4)+(H.glide?0.9:0)+clamp(-H.vy*0.03,-0.3,0.6)*(H.grounded?0:1)+Math.sin(t*w.f+i)*0.09*(0.5+amt);}
  const pop=1+H.pop*0.25;m.root.scale.set(1/Math.sqrt(pop),pop,1/Math.sqrt(pop));
  m.root.position.copy(H.p);if(H.swim)m.root.position.y+=0.25;
  m.root.rotation.y=H.face;
  m.root.visible=!(H.inv>0&&H.dashT<=0&&!H.dead&&Math.floor(t*16)%2===0);
  const g=Math.max(groundH(H.p.x,H.p.z),platFloor(H.p.x,H.p.z,H.p.y+0.5));
  heroShadow.visible=!H.swim&&g>WATER-0.3;heroShadow.position.set(H.p.x,g+0.08,H.p.z);heroShadow.scale.setScalar(Math.max(0.2,0.55-(H.p.y-g)*0.03));
}

/* ===== 世界里的东西 ===== */
function collectShard(sh){
  sh.got=true;sh.m.visible=false;S.shards++;burst(sh.m.position.x,sh.m.position.y,sh.m.position.z,16,4,0xffe27a,0.45,0.6,2,3);sfx('pickup');hudTrack(true);
  if(S.shards%12===0){H.maxSt+=20;H.st=H.maxSt;S.stBonus++;toast('集满 '+S.shards+' 枚星辉，体力上限提升');sfx('chest');}
  if(S.shards===shards.length)toast('所有星辉都找到了');
  saveGame();
}
function openChest(c){
  c.open=true;S.chestsOpen++;H.frags++;c.glow.visible=false;
  burst(c.x,c.y+0.8,c.z,36,6,0xffd76a,0.5,1.0,5,6);shockRing(c.x,c.y+0.2,c.z,3,0xffe7a0,0.5);sfx('chest');hudTrack(true);
  if(H.frags%4===0){H.maxHp+=2;H.hp=H.maxHp;hudHearts();toast('集齐 4 枚心之碎片，生命上限 +1');}
  else{toast('宝箱：心之碎片 '+(H.frags%4)+'/4');heal(2);}
  saveGame();
}
function activateTower(tw){
  lightTower(tw);S.towersLit++;H.maxHp+=2;H.hp=H.maxHp;H.st=H.maxSt;S.respawn.set(tw.x+2.6,tw.y+0.5,tw.z+1.2);
  shockRing(tw.x,tw.y+0.7,tw.z,14,CYAN,0.9);shockRing(tw.x,tw.y+0.7,tw.z,7,0xffffff,0.6);
  for(let i=0;i<70;i++){const a=Math.random()*TAU,r=Math.random()*1.5;spark(tw.x+Math.cos(a)*r,tw.y+1+Math.random()*7,tw.z+Math.sin(a)*r,Math.cos(a)*2.5,6+Math.random()*10,Math.sin(a)*2.5,1.4,0.55,i%3?CYAN:0xffffff,3,0.4);}
  shake=Math.max(shake,0.4);sfx('tower');hudHearts();hudTrack(true);
  banner(tw.name,'已点亮 · 生命上限 +1 · 这里成为新的落脚点');
  saveGame();
  if(S.towersLit===TOWERS.length&&!S.done)S.fin=4;
}
function finale(){
  S.done=true;banner('云野的风，再次流动','四座风塔全部点亮 · 今夜起天上会有极光');sfx('finale');saveGame();S.fireworks=7;
}
let hintT=0,hintGap=0;
function hint(key,msg){if(S.hints[key]||hintGap>0)return;S.hints[key]=1;hintGap=6;toast(msg,true);}
function updateObjects(dt,t){
  const hx=H.p.x,hy=H.p.y+0.9,hz=H.p.z;
  for(let i=0;i<shards.length;i++){const sh=shards[i];if(sh.got)continue;const m=sh.m;
    const dx=hx-sh.x,dz=hz-sh.z;if(dx*dx+dz*dz>110000){m.visible=false;continue;}m.visible=true;
    m.position.set(sh.x,sh.y+Math.sin(t*2+sh.ph)*0.18,sh.z);m.rotation.y=t*1.6+sh.ph;
    const dy=hy-m.position.y,d2=dx*dx+dy*dy+dz*dz;
    if(d2<18&&!H.dead){const k=dt*3.2;sh.x+=dx*k;sh.y+=dy*k;sh.z+=dz*k;}
    if(d2<2.8&&!H.dead)collectShard(sh);}
  for(let i=0;i<chests.length;i++){const c=chests[i];if(c.hidden)continue;
    if(!c.open){c.glow.material.opacity=0.42+0.2*Math.sin(t*3+c.id);
      if(Math.hypot(hx-c.x,hz-c.z)<1.9&&Math.abs(H.p.y-c.y)<1.6&&!H.dead&&started)openChest(c);}
    else if(c.t<1){c.t=Math.min(1,c.t+dt*2.5);c.lid.rotation.x=-1.9*(1-(1-c.t)*(1-c.t));}}
  for(let i=0;i<TOWERS.length;i++){const tw=TOWERS[i];
    tw.crystal.rotation.y=t*(tw.lit?1.6:0.6);tw.crystal.position.y=8.5+Math.sin(t*1.3+tw.id)*0.2;
    tw.beam.material.opacity=(tw.lit?0.4:0.2)+Math.sin(t*2+tw.id)*0.05;
    if(!tw.lit&&!tw.sealed&&started&&!H.dead&&H.grounded&&Math.hypot(hx-tw.x,hz-tw.z)<3.4&&Math.abs(H.p.y-(tw.y+0.5))<1.2)activateTower(tw);}
  for(let i=0;i<cracks.length;i++){const c=cracks[i];if(!c.alive)continue;const k=0.5+0.5*Math.sin(t*2.5+c.id);c.glow.material.opacity=0.2+0.25*k;c.mat.emissiveIntensity=0.35+0.5*k;}
  updateFloes(dt);
  if(S.fin>0){S.fin-=dt;if(S.fin<=0)finale();}
  if(S.fireworks>0){S.fireworks-=dt;if(Math.random()<dt*5){const a=Math.random()*TAU,r=10+Math.random()*25;
    burst(hx+Math.cos(a)*r,H.p.y+14+Math.random()*14,hz+Math.sin(a)*r,40,10,[0xffd76a,0x74f2ff,0xff9fc6,0xb8ffe9][Math.floor(Math.random()*4)],0.7,1.3,0,5);sfx('pickup');}}
  if(S.done)skyU.uAurora.value=Math.min(1,skyU.uAurora.value+dt*0.2);
  /* 提示 */
  hintGap-=dt;hintT-=dt;
  if(hintT<=0&&started&&!H.dead){hintT=0.5;
    if(H.ci!==1)for(let i=0;i<COLUMNS.length;i++){const c=COLUMNS[i];if(Math.hypot(hx-c.x,hz-c.z)<16)hint('col','这里有上升气流。切到青岚，跳起后按住跳跃键滑翔进去');}
    if(H.ci!==0)for(let i=0;i<cracks.length;i++){const c=cracks[i];if(c.alive&&Math.hypot(hx-c.x,hz-c.z)<c.s+9)hint('crack','这块岩石有裂纹。切到赤羽，用「冲刺斩」撞碎它');}
    if(H.ci!==2&&!H.swim&&groundH(hx,hz)<0.6&&groundH(hx,hz)>-1&&lake(hx,hz)>0.25)hint('lake','湖心有座塔。切到霜月放「霜华」，可以踏冰过去');
    if(H.ci===1&&!H.grounded&&!H.glide&&H.vy<-6&&H.air>0.5)hint('glide','在空中按住跳跃键可以滑翔');
  }
}
function regionOf(){
  if(H.p.y-groundH(H.p.x,H.p.z)>14&&H.grounded)return ['云端','离地很远，风很近'];
  if(lake(H.p.x,H.p.z)>0.3)return ['镜湖','水面像一块没擦干的玻璃'];
  if(H.p.y>42||mtn(H.p.x,H.p.z)>0.45)return ['霜脊雪山','越往上，声音越少'];
  if(H.swim||Math.hypot(H.p.x,H.p.z)>WORLD_R*0.84||groundH(H.p.x,H.p.z)<1.6)return ['潮声海岸','浪一遍一遍数着沙'];
  if(forestN(H.p.x,H.p.z)>0.56)return ['低语森林','树叶在商量什么'];
  return ['风息草原','草比风先知道方向'];
}
