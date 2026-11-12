/* ===== 游戏状态 ===== */
const heroes=HEROES.map((d,i)=>{const m=buildHero(d,i);m.root.visible=i===0;scene.add(m.root);return m;});
const heroShadow=blobShadow(0.55);
const H={p:new V3(SPAWN.x,SPAWN.y,SPAWN.z),v:new V3(),vy:0,grounded:true,swim:false,glide:false,jumps:0,air:0,face:-2.3,ci:0,
  hp:6,maxHp:6,st:100,maxSt:100,stLock:false,stWait:0,inv:0,atkT:0,atkDur:0.3,atkCd:0,combo:0,comboT:0,hitT:-1,
  dashT:0,dashX:0,dashZ:1,dashId:0,frost:0,cds:[0,0,0],castT:0,dead:false,deadT:0,
  safe:new V3(SPAWN.x,SPAWN.y,SPAWN.z),safeT:0,walk:0,frags:0,pop:0,stepT:0,twist:0,
  en:0,relay:0,skillAgo:9,spinT:0,spinN:0,ultT:0};
const S={shards:0,chestsOpen:0,towersLit:0,done:false,hints:{},respawn:new V3(SPAWN.x,SPAWN.y,SPAWN.z),stBonus:0,fin:0,
  kills:0,time:0,bossDead:false,hits:0,hitsT:0,seen:{}};
const I={mx:0,mz:0,run:false,jumpHeld:false,jump:false,atk:false,skill:false,ult:false};
let started=false,paused=false,shake=0;

/* ===== 敌人 ===== */
const EDEF={
  slime:{name:'草史莱姆',hp:4,dmg:1,r:0.75,h:0.6,aggro:17,info:'一蹦一跳地撞过来。',weak:'没有特别的弱点，适合练手。'},
  aqua:{name:'水史莱姆',hp:5,dmg:1,r:0.75,h:0.6,aggro:17,info:'住在水边，身子湿漉漉的。',weak:'被冻住的时间比别的敌人更长。'},
  ember:{name:'炎史莱姆',hp:6,dmg:1,r:0.8,h:0.62,aggro:18,info:'落地会溅起火花，燃烧着倒下时还会爆炸。',weak:'霜月的冰能浇灭它，并造成双倍伤害。'},
  bat:{name:'风蝠',hp:3,dmg:1,r:0.5,h:0,fly:true,aggro:20,info:'在头顶盘旋，看准了就俯冲下来。',weak:'青岚的风刃双倍伤害；「乘风」能把它们吹落在地。'},
  wisp:{name:'幽火',hp:4,dmg:1,r:0.5,h:0,fly:true,aggro:22,info:'远远地丢火球，靠近了会闪开。',weak:'冻住之后就闪不掉了。'},
  golem:{name:'岩傀',hp:14,dmg:2,r:1.3,h:1.4,heavy:true,aggro:17,info:'披着石甲，寻常攻击只能蹭掉一点皮。举拳时地上会亮起红圈。',weak:'赤羽的「冲刺斩」可以破甲，并让它跪地不起。'},
  king:{name:'史莱姆王',hp:26,dmg:2,r:1.9,h:1.5,heavy:true,aggro:20,info:'守着林隐之塔。落地有冲击波，受伤后会分裂。',weak:'先冻住，再用重击「碎冰」。'},
  boss:{name:'霜卫',hp:70,dmg:2,r:2.6,h:2.8,heavy:true,aggro:30,info:'霜顶之塔的守卫。砸地、冰锥齐射、落冰。无法被冻结。',weak:'「冲刺斩」破甲后它会瘫倒几秒，趁机全力输出。'}};
const enemies=[];
function addEnemy(type,x,z){
  const D=EDEF[type],y=groundH(x,z);let m,sc=1;
  if(type==='wisp')m=buildWisp();else if(type==='bat')m=buildBat();else if(type==='golem')m=buildGolem(1,false);
  else if(type==='boss'){m=buildGolem(2,true);sc=2;}else if(type==='king'){m=buildSlime(2.6,0xffa53d,'king');sc=2.6;}
  else if(type==='ember')m=buildSlime(1.05,0xf0603a,'ember');else if(type==='aqua')m=buildSlime(1,0x5ab8ee,'water');else m=buildSlime(1,0x7ddc6a,'grass');
  const e={type:type,D:D,r:D.r,hp:D.hp,maxHp:D.hp,dmg:D.dmg,fly:!!D.fly,heavy:!!D.heavy,home:{x:x,z:z},p:new V3(x,D.fly?y+(type==='bat'?4:2.2):y,z),v:new V3(),vy:0,grounded:true,
    t:Math.random()*2,frozen:0,flash:0,alive:true,respawn:0,cool:1+Math.random()*2,cool2:3,m:m,sq:0,dash:-1,seed:Math.random()*10,stun:0,air:0,st:'idle',stT:0,down:0,doused:0,
    armor:type==='golem'||type==='boss',armorT:1e9,face:0,walk:0,summoned:false,temp:false,blink:0,pulse:-1};
  e.bar=hpBar(m.g,type==='wisp'?0.75:(type==='bat'?0.7:(type==='golem'?3.1:(type==='king'?1.8:1.6))),sc);
  e.sh=blobShadow(e.r*0.95);
  e.ice=new THREE.Mesh(iceGeo,iceMat);e.ice.visible=false;e.ice.renderOrder=2;scene.add(e.ice);
  m.g.position.copy(e.p);scene.add(m.g);enemies.push(e);return e;
}
(function(){
  const camp=[['slime','slime','slime'],['slime','ember','wisp','slime'],['aqua','aqua','bat','bat'],['golem','slime','slime'],['ember','ember','wisp','bat']];
  CAMPS.forEach((c,i)=>{camp[i].forEach((ty,k)=>{const a=k*TAU/camp[i].length+i,rr=ty==='golem'?6:4.8;addEnemy(ty,c.x+Math.cos(a)*rr,c.z+Math.sin(a)*rr);});});
  const t=TOWERS[2];addEnemy('king',t.x+9,t.z+7);addEnemy('slime',t.x-8,t.z+6);addEnemy('slime',t.x+4,t.z-9);
  [1,2].forEach(i=>{const s=ROCKSPOTS[i],p=nearLand(s.x+7,s.z+5);addEnemy('golem',p[0],p[1]);});
  const t3=TOWERS[3];addEnemy('boss',t3.x+8.5,t3.z+3);
  const r=rngOf(3131);
  function scatter(type,n,ok){let c=0;for(let i=0;i<4000&&c<n;i++){const x=(r()*2-1)*WORLD_R,z=(r()*2-1)*WORLD_R,h=groundH(x,z);
    if(h<2||nearSite(x,z,12)||Math.hypot(x-SPAWN.x,z-SPAWN.z)<45||!ok(x,z,h))continue;addEnemy(typeof type==='function'?type(h):type,x,z);c++;}}
  scatter(h=>h<6?'aqua':'slime',15,(x,z,h)=>h<30&&forestN(x,z)<=0.5);
  scatter('wisp',7,(x,z,h)=>h>3&&(forestN(x,z)>0.62||(h>38&&h<72)));
  scatter('bat',9,(x,z,h)=>h>8&&h<50&&slopeAt(x,z)<0.7);
  scatter('ember',6,(x,z,h)=>h>10&&h<40&&forestN(x,z)<0.5&&slopeAt(x,z)<0.5);
  scatter('golem',4,(x,z,h)=>h>14&&h<46&&slopeAt(x,z)<0.35);
})();
const bossE=enemies.find(e=>e.type==='boss');
const eCy=e=>e.fly?e.p.y:e.p.y+e.D.h;
function nearestEnemy(range){let best=null,bd=range;
  for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const d=Math.hypot(e.p.x-H.p.x,e.p.z-H.p.z)-e.r;
    if(d<bd&&Math.abs(e.p.y-H.p.y)<11){bd=d;best=e;}}return best;}
function addEnergy(n){if(H.en>=100)return;H.en=Math.min(100,H.en+n);if(H.en>=100){sfx('ready');hint('ult','大招充能完毕。按 R（或大招键）释放');}}
function fmtD(d){return d%1?d.toFixed(1):String(d);}
function freezeEnemy(e,sec){
  if(!e.alive)return;
  if(e.type==='boss'){floatText(e.p.x,e.p.y+5,e.p.z,'免疫','block');return;}
  e.frozen=Math.max(e.frozen,sec*(e.type==='aqua'?1.6:1));if(e.type==='ember')e.doused=9;
  if(e.st==='aim'||e.st==='dive')e.st='hover';
}
function damageEnemy(e,d,kx,kz,o){
  if(!e.alive)return;o=o||{};const src=o.src||'melee';let tag='',crit=false;const cy=eCy(e);
  if(H.relay>0)d*=1.5;
  if(e.armor){
    if(src==='dash'||src==='ult0'){e.armor=false;e.armorT=e.type==='boss'?12:1e9;e.stun=e.type==='boss'?4.5:3;e.st='idle';e.m.shell.visible=false;tag='破甲';crit=true;
      burst(e.p.x,cy,e.p.z,34,9,e.type==='boss'?0xdff6ff:0x8a8f7a,0.6,0.9,3,14);shockRing(e.p.x,e.p.y+0.2,e.p.z,e.r*3.4,0xffe2a0,0.5);shake=Math.max(shake,0.5);sfx('break');}
    else{d*=0.25;tag='格挡';sfx('clang');hint('armor','石甲太硬了。切到赤羽，用「冲刺斩」破甲');}
  }
  if(e.frozen>0&&(src==='dash'||src==='ult0'||o.heavy)){d*=2;e.frozen=0;tag='碎冰';crit=true;
    burst(e.p.x,cy,e.p.z,26,8,0xd8f6ff,0.5,0.6,2,10);shockRing(e.p.x,e.p.y+0.2,e.p.z,e.r*3,0xaee9ff,0.4);sfx('shatter');}
  else if(e.frozen>0&&src==='melee')hint('shatter','冻住的敌人很脆。赤羽的第三段重击或「冲刺斩」能「碎冰」，伤害翻倍');
  if(e.type==='bat'&&(src==='wind'||src==='gust'||src==='tornado')){d*=2;if(!tag)tag='克制';crit=true;}
  if(e.type==='ember'&&(src==='ice'||src==='nova'||src==='bliz')){d*=2;e.doused=9;if(!tag)tag='浇灭';crit=true;}
  if((e.air>0&&!e.grounded||e.down>0)&&src!=='gust'&&src!=='tornado'){d*=1.5;if(!tag)tag='追击';}
  d=Math.max(0.5,Math.round(d*2)/2);
  e.hp-=d;e.flash=0.14;
  floatText(e.p.x,cy+e.r*0.7,e.p.z,(tag?tag+' ':'')+fmtD(d),crit?'crit':(tag==='格挡'?'block':''));
  burst(e.p.x,cy,e.p.z,8,5,0xffffff,0.35,0.3,1);
  if(!e.heavy&&e.frozen<=0){e.v.x=kx*7;e.v.z=kz*7;if(!e.fly&&e.grounded){e.vy=5;e.grounded=false;}}
  if(o.freeze)freezeEnemy(e,o.freeze);
  e.cool=Math.max(e.cool,0.5);if(tag!=='格挡')sfx('hit');
  addEnergy(d*3);S.hits++;S.hitsT=2.6;hudCombo();
  if(e.hp<=0)killEnemy(e);
}
function killEnemy(e){
  const cy=eCy(e);e.alive=false;e.respawn=(e.type==='king'||e.type==='boss'||e.temp)?1e9:120;e.m.g.visible=false;e.sh.visible=false;e.ice.visible=false;
  burst(e.p.x,cy,e.p.z,26,7,e.m.base.getHex(),0.5,0.7,2);shockRing(e.p.x,e.p.y+0.2,e.p.z,e.r*3,0xffffff,0.35);sfx('pop');
  S.kills++;addEnergy(8);
  if(Math.random()<0.4||e.heavy)heal(e.type==='boss'?8:(e.heavy?3:1),e.p.x,cy,e.p.z);
  if(e.type==='ember'&&e.doused<=0&&e.frozen<=0){hazard(e.p.x,e.p.z,3.4,0.75,2,0xff7a3a,null,true);sfx('charge');}
  if(e.type==='king')toast('史莱姆王被打败了');
  if(e.type==='boss')bossDown(e);
}
function bossDown(e){
  S.bossDead=true;const t=TOWERS[3];t.sealed=false;if(t.seal)t.seal.visible=false;
  for(let i=0;i<4;i++)burst(e.p.x,e.p.y+1+i*1.4,e.p.z,30,11,i%2?0xdff6ff:0x8fe8ff,0.7,1.2,3,8);
  shockRing(e.p.x,e.p.y+0.3,e.p.z,16,0xaee9ff,0.9);shake=Math.max(shake,0.7);sfx('tower');
  banner('霜卫倒下了','封住霜顶之塔的冰化开了');addEnergy(100);saveGame();
}
function bossReset(e){e.hp=e.maxHp;e.armor=true;e.armorT=1e9;e.m.shell.visible=true;e.st='idle';e.stun=0;e.p.set(e.home.x,groundH(e.home.x,e.home.z),e.home.z);}
function firstSeen(type){if(S.seen[type])return;S.seen[type]=1;
  if(type==='bat')hint('bat','风蝠飞得高，剑够不着。青岚的风刃克制它，「乘风」能把它们吹落');
  else if(type==='ember')hint('ember','炎史莱姆落地会溅火。用霜月的冰把它浇灭');
  else if(type==='golem')hint('golem','岩傀举拳时地上会亮红圈，快躲开。「冲刺斩」可以破开石甲');
  else if(type==='boss'){banner('霜卫','霜顶之塔的守卫');sfx('charge');}
  else hint('fight','有敌人。攻击键出招，技能键放技能');}

/* 预警圈：圈里的填充涨满时结算伤害 */
const hazards=[];
function hazard(x,z,r,delay,dmg,hex,owner,hitsEnemies){
  let h=null;for(let i=0;i<hazards.length;i++)if(hazards[i].t<=0){h=hazards[i];break;}
  if(!h){h={ring:new THREE.Mesh(ringGeo,glowy(hex,0.9)),fill:new THREE.Mesh(blobShadowGeo,glowy(hex,0.3)),t:0};h.ring.renderOrder=h.fill.renderOrder=2;scene.add(h.ring);scene.add(h.fill);hazards.push(h);}
  const y=Math.max(groundH(x,z),platFloor(x,z,H.p.y+1.5),WATER)+0.14;
  h.x=x;h.z=z;h.y=y;h.r=r;h.t=h.d=delay;h.dmg=dmg;h.hex=hex;h.owner=owner||null;h.he=!!hitsEnemies;
  h.ring.material.color.set(hex);h.fill.material.color.set(hex);h.ring.visible=h.fill.visible=true;
  h.ring.position.set(x,y,z);h.fill.position.set(x,y+0.02,z);h.ring.scale.set(r,1,r);h.fill.scale.setScalar(0.01);
  return h;
}
function updateHazards(dt){
  for(let i=0;i<hazards.length;i++){const h=hazards[i];if(h.t<=0)continue;
    const o=h.owner;if(o&&(!o.alive||o.frozen>0||o.stun>0)){h.t=0;h.ring.visible=h.fill.visible=false;continue;}
    h.t-=dt;const k=clamp(1-h.t/h.d,0,1);h.fill.scale.setScalar(Math.max(0.01,h.r*k));h.fill.material.opacity=0.2+0.3*k;h.ring.material.opacity=0.55+0.4*Math.sin(k*30);
    if(h.t<=0){h.ring.visible=h.fill.visible=false;
      shockRing(h.x,h.y+0.1,h.z,h.r*1.15,h.hex,0.4);burst(h.x,h.y+0.4,h.z,Math.round(10+h.r*6),h.r*2.2,h.hex,0.5,0.6,3,8);shake=Math.max(shake,0.12+h.r*0.06);sfx('thump');
      if(!H.dead&&Math.hypot(H.p.x-h.x,H.p.z-h.z)<h.r+0.2&&Math.abs(H.p.y-h.y)<2.6)heroHurt(h.dmg,h.x,h.z);
      if(h.he)for(let j=0;j<enemies.length;j++){const e=enemies[j];if(!e.alive||e===o)continue;const dx=e.p.x-h.x,dz=e.p.z-h.z,d=Math.hypot(dx,dz)||0.01;
        if(d<h.r+e.r&&Math.abs(e.p.y-h.y)<4)damageEnemy(e,3,dx/d,dz/d,{src:'env'});}}
  }
}

function aiHop(e,dt,dx,dz,d,aggro,busy){
  const king=e.type==='king';
  if(e.grounded){
    e.v.x*=Math.max(0,1-dt*10);e.v.z*=Math.max(0,1-dt*10);
    if(!busy&&e.cool<=0){
      let tx,tz,sp,up;
      if(aggro&&d>0.1){tx=dx/d;tz=dz/d;sp=king?7.5:6.4;up=king?9:7.2;e.cool=(king?1.1:0.5)+Math.random()*0.35;}
      else{const hx=e.home.x-e.p.x,hz=e.home.z-e.p.z,hd=Math.hypot(hx,hz);
        if(hd>9){tx=hx/hd;tz=hz/hd;}else{const a=Math.random()*TAU;tx=Math.cos(a);tz=Math.sin(a);}sp=2.4;up=4.6;e.cool=1.4+Math.random()*2.2;}
      if(groundH(e.p.x+tx*sp*0.5,e.p.z+tz*sp*0.5)>0.4){e.v.x=tx*sp;e.v.z=tz*sp;e.vy=up;e.grounded=false;e.face=Math.atan2(tx,tz);}
    }
  }
  if(!e.grounded){
    const nx=e.p.x+e.v.x*dt,nz=e.p.z+e.v.z*dt;
    if(groundH(nx,nz)>0.2){e.p.x=nx;e.p.z=nz;}else{e.v.x=e.v.z=0;}
    pushOut(e.p,e.r*0.7);
    e.vy-=24*dt;e.p.y+=e.vy*dt;const g=groundH(e.p.x,e.p.z);
    if(e.p.y<=g){e.p.y=g;e.grounded=true;e.sq=1;e.air=0;
      if(king&&e.vy<-6){shockRing(e.p.x,g+0.2,e.p.z,5.5,0xffc060,0.45);shake=Math.max(shake,0.3);sfx('thump');
        if(d<5.2&&H.grounded&&!H.dead)heroHurt(1,e.p.x,e.p.z);}
      if(e.type==='ember'&&e.doused<=0&&!busy&&e.vy<-4&&aggro){shockRing(e.p.x,g+0.15,e.p.z,2.7,0xff8a3a,0.35);burst(e.p.x,g+0.3,e.p.z,12,4.5,0xffa040,0.45,0.5,2,6);sfx('fire');
        if(d<2.7&&Math.abs(H.p.y-g)<1.5&&!H.dead)heroHurt(1,e.p.x,e.p.z);}
      e.vy=0;}
  }else e.p.y=groundH(e.p.x,e.p.z);
  e.sq=Math.max(0,e.sq-dt*4);
  const air=e.grounded?0:clamp(e.vy*0.03,-0.25,0.3),sy=1-e.sq*0.3+air+Math.sin(e.t*3+e.seed)*0.04;
  e.m.b.scale.set(1+(1-sy)*0.6,sy,1+(1-sy)*0.6);
  if(king&&!e.summoned&&e.hp<e.maxHp*0.5){e.summoned=true;toast('史莱姆王分裂出了小史莱姆');
    for(let k=0;k<2;k++){const a=k*Math.PI+e.t,s=addEnemy('slime',e.p.x+Math.cos(a)*3,e.p.z+Math.sin(a)*3);s.temp=true;s.vy=7;s.grounded=false;burst(s.p.x,s.p.y+0.6,s.p.z,14,5,0xffa53d,0.45,0.5,2);}}
  if(e.m.flame){const lit=e.doused<=0&&e.frozen<=0;e.m.flame.visible=lit;if(lit){e.m.flame.scale.y=1+Math.sin(e.t*17)*0.14;
    if(Math.random()<dt*9)spark(e.p.x+(Math.random()-0.5)*0.6,e.p.y+1.2,e.p.z+(Math.random()-0.5)*0.6,0,2+Math.random()*2,0,0.5,0.32,0xffa040,-1,1);}}
}
function aiBat(e,dt,dx,dz,d,aggro,busy){
  const gy=Math.max(groundH(e.p.x,e.p.z),WATER);
  if(e.down>0||e.frozen>0){
    if(e.frozen<=0)e.down-=dt;
    e.vy-=24*dt;e.p.y+=e.vy*dt;if(e.p.y<gy+0.35){e.p.y=gy+0.35;e.vy=0;}
    const k=Math.max(0,1-dt*5);e.v.x*=k;e.v.z*=k;e.p.x+=e.v.x*dt;e.p.z+=e.v.z*dt;e.st='hover';e.cool=Math.max(e.cool,1);
    e.m.wL.rotation.z=-1.1;e.m.wR.rotation.z=1.1;e.m.b.rotation.x=e.down>0?1.2:0;return;}
  e.m.b.rotation.x=0;
  if(e.st==='aim'){e.stT-=dt;const k=Math.max(0,1-dt*8);e.v.x*=k;e.v.z*=k;e.vy*=k;e.face=Math.atan2(dx,dz);
    if(e.stT<=0){e.st='dive';e.stT=0.95;const oy=H.p.y+1-e.p.y,l=Math.hypot(d,oy)||1;e.v.x=dx/l*14;e.v.z=dz/l*14;e.vy=oy/l*14;sfx('swoop');}}
  else if(e.st==='dive'){e.stT-=dt;if(e.stT<=0||e.p.y<gy+0.7){e.st='hover';e.cool=2.2+Math.random()*2;}}
  else{let tx,ty,tz,sp=6.5;
    if(aggro&&!busy){const a=e.t*0.9+e.seed;tx=H.p.x+Math.cos(a)*6;tz=H.p.z+Math.sin(a)*6;ty=Math.max(H.p.y+3.9,gy+2.5);e.face=Math.atan2(dx,dz);
      if(e.cool<=0&&d<11){e.st='aim';e.stT=0.5;sfx('screech');}}
    else{const a=e.t*0.5+e.seed;tx=e.home.x+Math.cos(a)*5;tz=e.home.z+Math.sin(a)*5;ty=Math.max(groundH(tx,tz),WATER)+4;sp=3.2;e.face=Math.atan2(e.v.x,e.v.z);}
    const ox=tx-e.p.x,oy=ty-e.p.y,oz=tz-e.p.z,l=Math.hypot(ox,oy,oz)||1,k=Math.min(1,dt*3),s=Math.min(sp,l*2);
    e.v.x+=(ox/l*s-e.v.x)*k;e.v.z+=(oz/l*s-e.v.z)*k;e.vy+=(oy/l*s-e.vy)*k;}
  e.p.x+=e.v.x*dt;e.p.z+=e.v.z*dt;e.p.y+=e.vy*dt;if(e.p.y<gy+0.5)e.p.y=gy+0.5;
  const fl=Math.sin(e.t*(e.st==='dive'?8:19))*(e.st==='dive'?0.2:0.75)+(e.st==='dive'?0.5:0);e.m.wL.rotation.z=fl;e.m.wR.rotation.z=-fl;
  e.m.b.position.y=Math.sin(e.t*19)*-0.05;
}
function aiWisp(e,dt,dx,dz,d,aggro,busy){
  const gy=Math.max(groundH(e.p.x,e.p.z),WATER)+2.2+Math.sin(e.t*2+e.seed)*0.35;
  if(busy){e.p.y+=(gy-0.8-e.p.y)*Math.min(1,dt*4);return;}
  let tx=0,tz=0;
  if(aggro&&d>0.1){const want=d>11?1:(d<7?-1:0);tx=dx/d*want*3.6-dz/d*1.6*Math.sin(e.t*0.7+e.seed);tz=dz/d*want*3.6+dx/d*1.6*Math.sin(e.t*0.7+e.seed);
    if(e.cool<=0&&d<20){e.cool=2.6;const oy=H.p.y+1-e.p.y,l=Math.hypot(d,oy);shoot('orb',e.p.x,e.p.y,e.p.z,dx/l,oy/l,dz/l,null);sfx('orb');}
    if(d<4.2&&e.blink<=0){e.blink=5;burst(e.p.x,e.p.y,e.p.z,18,5,0xc070ff,0.45,0.5,0,0);
      const a=Math.atan2(-dz,-dx)+(Math.random()-0.5)*1.6;let nx=e.p.x+Math.cos(a)*9,nz=e.p.z+Math.sin(a)*9;if(groundH(nx,nz)<0.3){nx=e.home.x;nz=e.home.z;}
      e.p.x=nx;e.p.z=nz;e.v.set(0,0,0);burst(nx,e.p.y,nz,18,5,0xc070ff,0.45,0.5,0,0);sfx('blink');}}
  else{const hx=e.home.x-e.p.x,hz=e.home.z-e.p.z,hd=Math.hypot(hx,hz);if(hd>6){tx=hx/hd*2;tz=hz/hd*2;}else{tx=Math.cos(e.t*0.5+e.seed)*1.2;tz=Math.sin(e.t*0.4+e.seed)*1.2;}}
  const k=Math.min(1,dt*3);e.v.x+=(tx-e.v.x)*k;e.v.z+=(tz-e.v.z)*k;
  e.p.x+=e.v.x*dt;e.p.z+=e.v.z*dt;e.p.y+=(gy-e.p.y)*Math.min(1,dt*4);
  e.m.orb.rotation.y=e.t*3;e.face=Math.atan2(dx,dz);e.m.b.rotation.z=Math.sin(e.t*1.7)*0.12;
}
function aiWalk(e,dt,dx,dz,d,aggro,busy){
  const boss=e.type==='boss',reach=boss?6.2:4.2,R=boss?5.6:4.2,M=e.m,rage=boss&&e.hp<e.maxHp*0.5;
  e.p.y=groundH(e.p.x,e.p.z);
  let aL=0,aR=0,tx=0,by=0,moving=false;
  if(busy){e.st='idle';if(e.stun>0){tx=0.55;by=-0.25;aL=aR=0.5;}}
  else if(e.st==='wind'){e.stT-=dt;aL=aR=-2.7;tx=-0.25;if(e.stT<=0){e.st='rec';e.stT=boss?1.0:1.3;}}
  else if(e.st==='cast'){e.stT-=dt;aL=-1.6;aR=-1.6;tx=-0.1;
    if(Math.random()<dt*30)spark(e.p.x+(Math.random()-0.5)*4,e.p.y+3+Math.random()*3,e.p.z+(Math.random()-0.5)*4,0,-1,0,0.5,0.4,0xbfeeff,0,1);
    if(e.stT<=0){e.st='rec';e.stT=0.8;const sy=e.p.y+3.6,oy=H.p.y+1-sy,a0=Math.atan2(dx,dz);
      for(let k=-2;k<=2;k++){const a=a0+k*0.2,l=Math.hypot(d,oy)||1;shoot('frost',e.p.x+Math.sin(a)*2,sy,e.p.z+Math.cos(a)*2,Math.sin(a)*d/l,oy/l,Math.cos(a)*d/l,null);}sfx('icebolt');}}
  else if(e.st==='rec'){e.stT-=dt;aL=aR=0.45;tx=0.3;if(e.stT<=0){e.st='idle';e.cool=boss?0.8:1.2;}}
  else if(aggro&&d>0.1){
    e.face+=angDiff(Math.atan2(dx,dz),e.face)*Math.min(1,dt*4);
    if(d>reach*0.75){const sp=boss?(rage?4.4:3.2):2.5,nx=e.p.x+dx/d*sp*dt,nz=e.p.z+dz/d*sp*dt;
      if(groundH(nx,nz)>0.5&&Math.hypot(nx-e.home.x,nz-e.home.z)<(boss?17:45)){e.p.x=nx;e.p.z=nz;e.walk+=dt*sp;moving=true;}}
    if(d<reach&&e.cool<=0&&Math.abs(H.p.y-e.p.y)<4){e.st='wind';e.stT=boss?1.0:0.9;const off=boss?2.2:1.4;hazard(e.p.x+Math.sin(e.face)*off,e.p.z+Math.cos(e.face)*off,R,e.stT,2,boss?0x8fe8ff:0xff7a3a,e);sfx('charge');}
    else if(boss&&e.cool2<=0&&d>4.5){e.cool2=rage?3:4.6;
      if(Math.random()<0.5){e.st='cast';e.stT=0.7;sfx('charge');}
      else{e.st='rec';e.stT=0.7;sfx('charge');for(let k=0;k<(rage?7:5);k++){const a=Math.random()*TAU,rr=k?2+Math.random()*5:0;hazard(H.p.x+Math.cos(a)*rr,H.p.z+Math.sin(a)*rr,2.3,0.95+k*0.2,1,0x8fe8ff,e);}}}
  }else{const hx=e.home.x-e.p.x,hz=e.home.z-e.p.z,hd=Math.hypot(hx,hz);
    if(hd>2){e.face+=angDiff(Math.atan2(hx,hz),e.face)*Math.min(1,dt*3);e.p.x+=hx/hd*1.6*dt;e.p.z+=hz/hd*1.6*dt;e.walk+=dt*1.6;moving=true;}
    if(boss&&e.hp<e.maxHp&&(H.dead||d>45))bossReset(e);}
  pushOut(e.p,e.r*0.5);
  const k=Math.min(1,dt*(e.st==='rec'?26:8)),sw=moving?Math.sin(e.walk*2.6)*0.5:0;
  M.armL.rotation.x+=(aL+sw*0.6-M.armL.rotation.x)*k;M.armR.rotation.x+=(aR-sw*0.6-M.armR.rotation.x)*k;
  M.legL.rotation.x+=(-sw-M.legL.rotation.x)*k;M.legR.rotation.x+=(sw-M.legR.rotation.x)*k;
  M.torso.rotation.x+=(tx-M.torso.rotation.x)*k;M.b.position.y+=(by+(moving?Math.abs(Math.cos(e.walk*2.6))*0.08:0)-M.b.position.y)*k;
  M.core.rotation.y=e.t*2;M.cgl.material.opacity=e.armor?0.35:0.75+Math.sin(e.t*8)*0.2;
  if(!e.armor&&e.armorT<1e8){e.armorT-=dt;if(e.armorT<=0){e.armor=true;M.shell.visible=true;floatText(e.p.x,e.p.y+5,e.p.z,'冰甲重生','block');sfx('ice');}}
  /* 别让角色钻进大块头的身体里 */
  if(d<e.r+0.3&&d>0.01&&Math.abs(H.p.y-e.p.y)<e.D.h*2&&!H.dead&&H.dashT<=0){const s=(e.r+0.3-d)/d;H.p.x+=dx*s;H.p.z+=dz*s;}
}
function updateEnemies(dt,t){
  for(let i=0;i<enemies.length;i++){const e=enemies[i];
    if(!e.alive){if(e.respawn<1e8){e.respawn-=dt;if(e.respawn<=0&&Math.hypot(e.home.x-H.p.x,e.home.z-H.p.z)>70){
        e.alive=true;e.hp=e.maxHp;e.p.set(e.home.x,groundH(e.home.x,e.home.z)+(e.fly?(e.type==='bat'?4:2.2):0),e.home.z);e.v.set(0,0,0);e.vy=0;e.frozen=0;e.stun=0;e.down=0;e.doused=0;e.st='idle';e.grounded=true;
        if(e.type==='golem'){e.armor=true;e.m.shell.visible=true;}e.m.g.visible=true;e.sh.visible=true;}}
      continue;}
    const dx=H.p.x-e.p.x,dz=H.p.z-e.p.z,d=Math.hypot(dx,dz);
    if(d>120){e.m.g.visible=false;e.sh.visible=false;e.ice.visible=false;if(e.type==='boss'&&e.hp<e.maxHp)bossReset(e);continue;}
    e.m.g.visible=true;e.sh.visible=true;
    e.t+=dt;e.cool-=dt;e.cool2-=dt;e.flash-=dt;e.blink-=dt;if(e.doused>0)e.doused-=dt;
    const frozen=e.frozen>0;if(frozen)e.frozen-=dt;if(e.stun>0)e.stun-=dt;
    const busy=frozen||e.stun>0;
    const aggro=started&&!H.dead&&d<e.D.aggro&&Math.abs(H.p.y-e.p.y)<(e.fly?14:9);
    if(aggro)firstSeen(e.type);
    if(e.type==='bat')aiBat(e,dt,dx,dz,d,aggro,busy);else if(e.type==='wisp')aiWisp(e,dt,dx,dz,d,aggro,busy);
    else if(e.heavy&&e.type!=='king')aiWalk(e,dt,dx,dz,d,aggro,busy);else aiHop(e,dt,dx,dz,d,aggro,busy);
    const touch=e.type==='golem'||e.type==='boss'?false:(e.type==='bat'?e.st==='dive':true);
    if(touch&&!busy&&e.down<=0&&!H.dead&&H.inv<=0&&d<e.r+0.55&&Math.abs((H.p.y+0.8)-eCy(e))<1.7)heroHurt(e.dmg,e.p.x,e.p.z);
    e.m.g.position.copy(e.p);e.m.g.rotation.y=e.face;
    const fl=e.flash>0?0x999999:(e.st==='aim'||e.st==='wind'?(Math.floor(e.t*14)%2?0x802018:0):0);
    for(let k=0;k<e.m.mats.length;k++)e.m.mats[k].emissive.setHex(fl);
    if(e.doused>0&&e.type==='ember')e.m.mats[0].color.setHex(0x7a5a52);else if(e.type==='ember')e.m.mats[0].color.copy(e.m.base);
    e.ice.visible=frozen;if(frozen){const hh=e.fly?e.r:Math.max(e.r,e.D.h);e.ice.position.set(e.p.x,eCy(e),e.p.z);e.ice.scale.set(e.r*1.25,hh*1.25,e.r*1.25);e.ice.rotation.y=e.seed;}
    const gh=groundH(e.p.x,e.p.z);e.sh.position.set(e.p.x,Math.max(gh,WATER)+0.1,e.p.z);
    const show=e.hp<e.maxHp&&e.type!=='boss';e.bar.bg.visible=e.bar.fg.visible=show;
    if(show){const r=Math.max(0.02,e.hp/e.maxHp);e.bar.fg.scale.x=e.bar.w*r;e.bar.fg.center.x=0.5/r;e.bar.fg.material.color.setHex(e.armor?0xffc24a:(frozen?0x8fdcff:0xff5a6e));}
  }
}

/* ===== 飞行物 ===== */
const shots=[];
const SHOT={wind:{sp:30,life:0.8,col:0x9ff5e0},ice:{sp:22,life:1.4,col:0xaee9ff},orb:{sp:9.5,life:3.2,col:0xd08cff},frost:{sp:13,life:3,col:0xbfeeff}};
function shoot(kind,x,y,z,dx,dy,dz,target){
  let s=null;for(let i=0;i<shots.length;i++)if(!shots[i].on&&shots[i].kind===kind){s=shots[i];break;}
  if(!s){const g=new THREE.Group();let m;
    if(kind==='wind'){m=new THREE.Mesh(SPH,basic(0xd6fff3));m.scale.set(0.8,0.09,0.28);g.add(m);g.add(glowSprite(0x7ff5d8,2.4,0.7));}
    else if(kind==='ice'){m=new THREE.Mesh(octGeo,basic(0xe2f8ff));m.scale.set(0.17,0.17,0.45);g.add(m);g.add(glowSprite(0x8fdcff,2.2,0.85));}
    else if(kind==='frost'){m=new THREE.Mesh(octGeo,basic(0xf0fbff));m.scale.set(0.3,0.3,0.7);g.add(m);g.add(glowSprite(0x8fdcff,3.4,0.85));}
    else{m=new THREE.Mesh(SPH,basic(0xf3c6ff));m.scale.setScalar(0.26);g.add(m);g.add(glowSprite(0xc070ff,2.6,0.85));}
    scene.add(g);s={g:g,m:m,kind:kind,p:new V3(),v:new V3(),on:false,life:0,target:null,sp:1};shots.push(s);}
  const K=SHOT[kind];s.sp=K.sp;
  s.on=true;s.g.visible=true;s.p.set(x,y,z);s.v.set(dx*s.sp,dy*s.sp,dz*s.sp);s.life=K.life;s.target=target;
  s.g.position.copy(s.p);s.g.rotation.y=Math.atan2(dx,dz);
}
function updateShots(dt){
  for(let i=0;i<shots.length;i++){const s=shots[i];if(!s.on)continue;s.life-=dt;const col=SHOT[s.kind].col;
    if(s.kind==='ice'&&s.target&&s.target.alive){const e=s.target;tv.set(e.p.x-s.p.x,eCy(e)-s.p.y,e.p.z-s.p.z).normalize().multiplyScalar(s.sp);s.v.lerp(tv,Math.min(1,dt*5));s.g.rotation.y=Math.atan2(s.v.x,s.v.z);}
    s.p.addScaledVector(s.v,dt);s.g.position.copy(s.p);
    if(s.kind==='wind')s.g.rotation.y+=dt*20;
    if(Math.random()<dt*30)spark(s.p.x,s.p.y,s.p.z,(Math.random()-0.5),(Math.random()-0.5),(Math.random()-0.5),0.35,0.3,col,0,1);
    let hit=false;
    if(s.kind==='orb'||s.kind==='frost'){if(!H.dead&&Math.hypot(s.p.x-H.p.x,s.p.y-H.p.y-0.9,s.p.z-H.p.z)<(s.kind==='frost'?1.1:0.9)){heroHurt(1,s.p.x-s.v.x,s.p.z-s.v.z);hit=true;}}
    else for(let j=0;j<enemies.length;j++){const e=enemies[j];if(!e.alive)continue;
      if(Math.hypot(s.p.x-e.p.x,s.p.y-eCy(e),s.p.z-e.p.z)<Math.max(e.r,e.D.h)+0.6){const l=Math.hypot(s.v.x,s.v.z)||1;damageEnemy(e,1.5,s.v.x/l,s.v.z/l,s.kind==='ice'?{src:'ice',freeze:1.3}:{src:'wind'});hit=true;break;}}
    if(hit||s.life<=0||s.p.y<groundH(s.p.x,s.p.z)-0.1){s.on=false;s.g.visible=false;burst(s.p.x,s.p.y,s.p.z,6,3,col,0.3,0.3,0,0);}
  }
}

/* ===== 冰面 ===== */
const floes=[],floeGeo=new THREE.CylinderGeometry(2.05,1.7,0.5,6),floeMat=new THREE.MeshPhongMaterial({color:0xd9f4ff,transparent:true,opacity:0.86,shininess:90,specular:0xffffff,flatShading:true});
function addFloe(x,z,quiet){
  for(let i=0;i<floes.length;i++){const f=floes[i];if(f.t>1.5&&Math.hypot(f.plat.x-x,f.plat.z-z)<1.3){f.t=Math.max(f.t,7.5);return;}}
  let f=null;for(let i=0;i<floes.length;i++)if(floes[i].t<=0){f=floes[i];break;}
  if(!f){if(floes.length>90)return;const m=new THREE.Mesh(floeGeo,floeMat);scene.add(m);f={m:m,plat:addPlat(0,0,2.0,WATER+0.12,WATER-1.4),t:0};f.plat.on=false;floes.push(f);}
  f.t=7.5;f.plat.x=x;f.plat.z=z;f.plat.on=true;f.m.visible=true;f.m.position.set(x,WATER-0.13,z);f.m.rotation.y=x*1.7+z;f.m.scale.set(0.2,1,0.2);
  if(!quiet)burst(x,WATER+0.3,z,5,2.5,0xcff3ff,0.3,0.4,1.5);
}
function updateFloes(dt){for(let i=0;i<floes.length;i++){const f=floes[i];if(f.t<=0)continue;f.t-=dt;
  const s=Math.min(1,(7.5-f.t)*6,f.t*1.6);f.m.scale.set(s,1,s);f.m.position.y=WATER-0.13-(f.t<0.6?(0.6-f.t)*0.6:0);
  if(f.t<=0.25)f.plat.on=false;if(f.t<=0)f.m.visible=false;}}

/* ===== 大招：风眼与霜天 ===== */
const TW={t:0,x:0,z:0,y:0,tick:0,m:null};
(function(){const g=new THREE.Group();
  [[2.2,4.2,14,0.9],[1.2,2.6,10,-1.4]].forEach(a=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(a[1],a[0],a[2],20,1,true),colMat);c.position.y=a[2]/2;c.renderOrder=1;c.userData={sp:a[3]};g.add(c);});
  g.visible=false;scene.add(g);TW.m=g;})();
const BZ={t:0,x:0,z:0,y:0,tick:0,ring:null};
(function(){const r=new THREE.Mesh(ringGeo,glowy(0xaee9ff,0.5));r.visible=false;r.renderOrder=2;scene.add(r);BZ.ring=r;})();
function inUpdraft(x,y,z){
  for(let i=0;i<COLUMNS.length;i++){const c=COLUMNS[i];if(Math.hypot(x-c.x,z-c.z)<3.8&&y>c.y0-1&&y<c.top)return true;}
  return TW.t>0&&Math.hypot(x-TW.x,z-TW.z)<4.2&&y>TW.y-1&&y<TW.y+15;
}
function updateFields(dt,t){
  if(TW.t>0){TW.t-=dt;TW.tick-=dt;const fade=Math.min(1,TW.t*2,(6-TW.t)*4);TW.m.visible=true;TW.m.position.set(TW.x,TW.y,TW.z);TW.m.scale.set(fade,fade,fade);
    TW.m.children.forEach(c=>{c.rotation.y+=dt*c.userData.sp*5;});
    for(let k=0;k<3;k++){const a=Math.random()*TAU,r=1+Math.random()*3.5;spark(TW.x+Math.cos(a)*r,TW.y+Math.random()*2,TW.z+Math.sin(a)*r,-Math.sin(a)*7,5+Math.random()*6,Math.cos(a)*7,0.9,0.4,k?0xb8ffe9:0xffffff,-2,0.6);}
    const hit=TW.tick<=0;if(hit)TW.tick=0.5;
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=TW.x-e.p.x,dz=TW.z-e.p.z,d=Math.hypot(dx,dz)||0.01;
      if(d>9||Math.abs(e.p.y-TW.y)>12)continue;
      if(!e.heavy&&e.frozen<=0){const pull=Math.min(9,d*3)*dt;e.p.x+=dx/d*pull-dz/d*pull*0.5;e.p.z+=dz/d*pull+dx/d*pull*0.5;
        if(e.type==='bat')e.down=Math.max(e.down,1.5);
        else if(!e.fly&&d<4){e.vy=Math.max(e.vy,5.5);e.grounded=false;e.air=1;}}
      if(hit&&d<5)damageEnemy(e,1,0,0,{src:'tornado'});}
    if(TW.t<=0)TW.m.visible=false;}
  if(BZ.t>0){BZ.t-=dt;BZ.tick-=dt;const R=9;BZ.ring.visible=true;BZ.ring.position.set(BZ.x,BZ.y+0.15,BZ.z);BZ.ring.scale.set(R,1,R);BZ.ring.material.opacity=Math.min(0.6,BZ.t)*(0.6+0.3*Math.sin(t*5));
    for(let k=0;k<4;k++){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*R;spark(BZ.x+Math.cos(a)*r,BZ.y+7+Math.random()*3,BZ.z+Math.sin(a)*r,1.5,-7-Math.random()*4,0,1.1,0.36,k%2?0xffffff:0xbfeeff,0,0);}
    if(Math.random()<dt*14){const a=Math.random()*TAU,r=Math.sqrt(Math.random())*(R-1.5),x=BZ.x+Math.cos(a)*r,z=BZ.z+Math.sin(a)*r;if(groundH(x,z)<WATER-0.15&&platFloor(x,z,WATER+0.6)<WATER)addFloe(x,z,true);}
    if(BZ.tick<=0){BZ.tick=0.7;shockRing(BZ.x,BZ.y+0.2,BZ.z,R,0xdff6ff,0.6);
      for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-BZ.x,dz=e.p.z-BZ.z,d=Math.hypot(dx,dz);
        if(d<R+e.r&&Math.abs(e.p.y-BZ.y)<9)damageEnemy(e,1,0,0,{src:'bliz',freeze:1.6});}}
    if(BZ.t<=0)BZ.ring.visible=false;}
}
function tryUlt(){
  if(H.dead||H.dashT>0||H.spinT>0)return;
  if(H.en<100){sfx('deny');return;}
  const ci=H.ci;if(ci===0&&H.swim){sfx('deny');return;}
  H.en=0;H.inv=Math.max(H.inv,1.1);H.ultT=0.9;shake=Math.max(shake,0.35);ultCut(ci);sfx('ult');
  if(ci===0){H.spinT=0.9;H.spinN=0;H.glide=false;}
  else if(ci===1){const e=nearestEnemy(12);TW.x=e?e.p.x:H.p.x+Math.sin(H.face)*5;TW.z=e?e.p.z:H.p.z+Math.cos(H.face)*5;TW.y=Math.max(groundH(TW.x,TW.z),WATER);TW.t=6;TW.tick=0;
    shockRing(TW.x,TW.y+0.2,TW.z,8,0x9ff5e0,0.6);sfx('wind');hint('tw','「风眼」是一股会走的上升气流。青岚滑翔进去会被托上高空');}
  else{BZ.x=H.p.x;BZ.z=H.p.z;BZ.y=Math.max(groundH(H.p.x,H.p.z),WATER);BZ.t=7;BZ.tick=0;H.frost=Math.max(H.frost,12);H.castT=0.6;
    burst(H.p.x,H.p.y+1,H.p.z,50,10,0xdff6ff,0.5,1.0,3,2);sfx('ice');
    if(H.swim||groundH(H.p.x,H.p.z)<WATER-0.15){addFloe(H.p.x,H.p.z);H.p.y=Math.max(H.p.y,WATER+0.12);H.swim=false;H.vy=0;H.grounded=true;}}
}

/* ===== 角色动作 ===== */
function heal(n,x,y,z){if(H.hp>=H.maxHp)return;H.hp=Math.min(H.maxHp,H.hp+n);hudHearts();
  burst(x===undefined?H.p.x:x,y===undefined?H.p.y+1:y,z===undefined?H.p.z:z,10,3,0xff7a9a,0.4,0.8,3,-1);sfx('heal');}
function heroHurt(d,fx,fz){
  if(H.inv>0||H.dead||!started)return;
  H.hp-=d;H.inv=1.1;let kx=H.p.x-fx,kz=H.p.z-fz;const l=Math.hypot(kx,kz)||1;kx/=l;kz/=l;
  H.v.x=kx*9;H.v.z=kz*9;H.vy=6;H.grounded=false;H.glide=false;H.dashT=0;shake=Math.max(shake,0.35);S.hits=0;hudCombo();
  burst(H.p.x,H.p.y+1,H.p.z,12,5,0xff6a6a,0.4,0.4,1);sfx('hurt');hudHearts();vignette();
  if(H.hp<=0){H.hp=0;H.dead=true;H.deadT=2.6;fade(true);hudHearts();}
}
function respawnHero(){H.dead=false;H.p.copy(S.respawn);H.v.set(0,0,0);H.vy=0;H.hp=H.maxHp;H.st=H.maxSt;H.stLock=false;H.inv=2;H.grounded=true;H.frost=0;H.spinT=0;hudHearts();fade(false);}
function drown(){toast('体力耗尽，被浪推回了岸边');H.p.copy(H.safe);H.v.set(0,0,0);H.vy=0;H.st=H.maxSt*0.5;H.stLock=false;H.swim=false;H.inv=0;heroHurt(1,H.p.x,H.p.z+1);H.v.set(0,0,0);H.vy=0;
  if(!S.hints.ice)hint('ice','水太宽就别硬游。切到霜月放「霜华」，能踏冰过水');}
function switchHero(i){
  if(i===H.ci||H.dead||H.dashT>0||H.spinT>0||!started)return;
  heroes[H.ci].root.visible=false;H.ci=i;heroes[i].root.visible=true;H.glide=false;H.atkT=0;H.pop=1;
  if(heroes[1].glider)heroes[1].glider.visible=false;
  burst(H.p.x,H.p.y+1,H.p.z,22,4,HEROES[i].hex,0.45,0.5,2,0);shockRing(H.p.x,H.p.y+0.15,H.p.z,2.6,HEROES[i].hex,0.35);sfx('switch');
  /* 接力：放完技能马上换人，下一位出手更重 */
  if(H.skillAgo<3.5){H.relay=6;H.skillAgo=9;floatText(H.p.x,H.p.y+2.3,H.p.z,'接力！','relay');shockRing(H.p.x,H.p.y+0.15,H.p.z,4,0xffd166,0.45);sfx('ready');hint('relay','「接力」：放完技能立刻换人，接下来 6 秒伤害提高五成');}
  hudChars();
}
function tryAttack(){
  if(H.atkCd>0||H.swim||H.glide||H.dashT>0||H.dead||H.spinT>0)return;
  const ci=H.ci;
  if(ci===0){
    H.combo=H.comboT>0?(H.combo+1)%3:0;H.comboT=0.8;const big=H.combo===2;
    H.atkDur=H.atkT=big?0.36:0.27;H.atkCd=big?0.44:0.3;H.hitT=0.08;
    const e=nearestEnemy(5);if(e)H.face=Math.atan2(e.p.x-H.p.x,e.p.z-H.p.z);
    if(H.grounded){H.v.x+=Math.sin(H.face)*5.5;H.v.z+=Math.cos(H.face)*5.5;}
    slashArc(H.p.x+Math.sin(H.face)*0.4,H.p.y+1.0,H.p.z+Math.cos(H.face)*0.4,H.face,H.combo%2?-1:1,big?1.4:1,big?0xffd27a:0xffffff);sfx('slash');
  }else{
    const e=nearestEnemy(23);let dx=Math.sin(H.face),dy=0,dz=Math.cos(H.face);
    if(e){H.face=Math.atan2(e.p.x-H.p.x,e.p.z-H.p.z);tv.set(e.p.x-H.p.x,eCy(e)-(H.p.y+1.15),e.p.z-H.p.z).normalize();dx=tv.x;dy=tv.y;dz=tv.z;}
    H.atkDur=H.atkT=0.26;H.atkCd=ci===1?0.38:0.55;H.hitT=-1;
    shoot(ci===1?'wind':'ice',H.p.x+Math.sin(H.face)*0.5,H.p.y+1.15,H.p.z+Math.cos(H.face)*0.5,dx,dy,dz,e);sfx(ci===1?'whoosh':'icebolt');
  }
}
function meleeHit(){
  const big=H.combo===2,reach=big?3.5:2.9,dmg=big?3:2;let hit=false;
  for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;
    if(d<reach+e.r&&Math.abs(e.p.y-H.p.y)<3.2&&(d<1.3+e.r||Math.abs(angDiff(Math.atan2(dx,dz),H.face))<1.3)){damageEnemy(e,dmg,dx/d,dz/d,{src:'melee',heavy:big});hit=true;}}
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
  const ci=H.ci;if(H.dead||H.dashT>0||H.spinT>0)return;
  if(H.cds[ci]>0){sfx('deny');hudDeny();return;}
  if(ci===0){
    if(H.swim)return;let dx=Math.sin(H.face),dz=Math.cos(H.face);
    if(mag>0.2){const l=Math.hypot(wx,wz);dx=wx/l;dz=wz/l;}else{const e=nearestEnemy(9);if(e){const l=Math.hypot(e.p.x-H.p.x,e.p.z-H.p.z)||1;dx=(e.p.x-H.p.x)/l;dz=(e.p.z-H.p.z)/l;}}
    H.dashX=dx;H.dashZ=dz;H.dashT=0.22;H.dashId++;H.inv=Math.max(H.inv,0.42);H.face=Math.atan2(dx,dz);H.atkT=0;sfx('dash');
  }else if(ci===1){
    H.vy=26;H.grounded=false;H.swim=false;H.jumps=1;H.air=1;H.p.y+=0.15;
    shockRing(H.p.x,H.p.y+0.2,H.p.z,6.5,0x9ff5e0,0.5);
    for(let i=0;i<26;i++){const a=i/26*TAU;spark(H.p.x+Math.cos(a)*1.2,H.p.y+0.2,H.p.z+Math.sin(a)*1.2,Math.cos(a)*2,9+Math.random()*6,Math.sin(a)*2,0.7,0.45,0xb8ffe9,6,0.5);}
    let spread=null;
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;
      if(d<6.5+e.r&&Math.abs(e.p.y-H.p.y)<(e.fly?9:4)){
        if(e.frozen>0&&!spread)spread=e;
        damageEnemy(e,1,dx/d,dz/d,{src:'gust'});
        if(e.alive&&e.type==='bat'){e.down=3.5;e.vy=-4;floatText(e.p.x,e.p.y+0.8,e.p.z,'吹落','relay');}
        else if(e.alive&&!e.heavy&&!e.fly&&e.frozen<=0){e.vy=13;e.grounded=false;e.air=1.6;e.v.x*=0.3;e.v.z*=0.3;}}}
    /* 扩散：风卷着寒气，把冻结传给周围 */
    if(spread){let n=0;for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive||e.frozen>0||e.type==='boss')continue;
        if(Math.hypot(e.p.x-spread.p.x,e.p.z-spread.p.z)<9&&Math.abs(e.p.y-spread.p.y)<8){freezeEnemy(e,2.8);e.vy=Math.min(e.vy,0);n++;}}
      shockRing(spread.p.x,spread.p.y+0.3,spread.p.z,9,0xaee9ff,0.6);
      if(n){floatText(spread.p.x,eCy(spread)+1.4,spread.p.z,'扩散','relay');sfx('ice');}}
    sfx('wind');
  }else{
    H.castT=0.5;H.frost=12;shockRing(H.p.x,H.p.y+0.3,H.p.z,8.5,0xaee9ff,0.65);shockRing(H.p.x,H.p.y+0.3,H.p.z,5,0xffffff,0.45);
    burst(H.p.x,H.p.y+1,H.p.z,40,8,0xbfeeff,0.5,0.9,2,2);
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;if(d<8.5+e.r&&Math.abs(e.p.y-H.p.y)<7)damageEnemy(e,2,dx/d*0.2,dz/d*0.2,{src:'nova',freeze:4.2});}
    if(H.swim||groundH(H.p.x,H.p.z)<WATER-0.15){addFloe(H.p.x,H.p.z);H.p.y=Math.max(H.p.y,WATER+0.12);H.swim=false;H.vy=0;H.grounded=true;}
    sfx('ice');
  }
  H.cds[ci]=HEROES[ci].cd;H.skillAgo=0;
}

function updateHero(dt,t){
  H.inv=Math.max(0,H.inv-dt);H.atkCd-=dt;H.comboT-=dt;H.castT-=dt;H.frost=Math.max(0,H.frost-dt);H.pop=Math.max(0,H.pop-dt*4);
  H.relay=Math.max(0,H.relay-dt);H.skillAgo+=dt;H.ultT=Math.max(0,H.ultT-dt);S.time+=dt;
  if(S.hitsT>0){S.hitsT-=dt;if(S.hitsT<=0){S.hits=0;hudCombo();}}
  for(let i=0;i<3;i++)H.cds[i]=Math.max(0,H.cds[i]-dt);
  if(H.dead){H.deadT-=dt;I.jump=I.atk=I.skill=I.ult=false;if(H.deadT<=0)respawnHero();return;}
  let ix=I.mx,iz=I.mz,mag=Math.hypot(ix,iz);if(mag>1){ix/=mag;iz/=mag;mag=1;}
  const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
  const wx=fx*iz+rx*ix,wz=fz*iz+rz*ix;
  const g0=groundH(H.p.x,H.p.z);let drain=0;
  if(I.ult){I.ult=false;tryUlt();}
  if(I.skill){I.skill=false;trySkill(wx,wz,mag);}
  if(I.atk){I.atk=false;tryAttack();}
  if(H.atkT>0){H.atkT-=dt;if(H.hitT>=0&&H.atkDur-H.atkT>=H.hitT){H.hitT=-1;meleeHit();}}
  /* 燎原：原地回旋三斩 */
  if(H.spinT>0){H.spinT-=dt;H.face+=dt*24;H.inv=Math.max(H.inv,0.2);
    for(let k=0;k<3;k++){const a=H.face+k*2.1;spark(H.p.x+Math.sin(a)*3.2,H.p.y+0.9+Math.random()*0.6,H.p.z+Math.cos(a)*3.2,Math.sin(a)*4,2+Math.random()*3,Math.cos(a)*4,0.5,0.6,k?0xff8a3a:0xffe2a0,-2,1);}
    if(0.9-H.spinT>=H.spinN*0.28&&H.spinN<3){H.spinN++;const last=H.spinN===3,R=last?7:5.6;
      shockRing(H.p.x,H.p.y+0.9,H.p.z,R,last?0xffe2a0:0xff8a3a,0.4);slashArc(H.p.x,H.p.y+1,H.p.z,H.face,1,R/2.2,0xffb060);slashArc(H.p.x,H.p.y+1,H.p.z,H.face+Math.PI,1,R/2.2,0xffb060);
      shake=Math.max(shake,last?0.55:0.3);sfx(last?'break':'slash');
      for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive)continue;const dx=e.p.x-H.p.x,dz=e.p.z-H.p.z,d=Math.hypot(dx,dz)||0.01;
        if(d<R+e.r&&Math.abs(e.p.y-H.p.y)<5)damageEnemy(e,last?5:3,dx/d,dz/d,{src:'ult0',heavy:true});}
      for(let i=0;i<cracks.length;i++){const c=cracks[i];if(c.alive&&Math.hypot(c.x-H.p.x,c.z-H.p.z)<c.s+R-1&&Math.abs(c.y-H.p.y)<5)breakCrack(c);}}
  }
  let running=false;
  if(H.dashT>0){
    H.dashT-=dt;H.v.x=H.dashX*44;H.v.z=H.dashZ*44;if(H.vy<0)H.vy=0;
    for(let i=0;i<3;i++)spark(H.p.x+(Math.random()-0.5)*0.6,H.p.y+0.4+Math.random()*1.2,H.p.z+(Math.random()-0.5)*0.6,-H.dashX*3,Math.random(),-H.dashZ*3,0.35,0.5,i?0xff9a7a:0xfff0d0,0,2);
    for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive||e.dash===H.dashId)continue;
      if(Math.hypot(e.p.x-H.p.x,e.p.z-H.p.z)<2.5+e.r&&Math.abs(e.p.y-H.p.y)<3.5+e.D.h){e.dash=H.dashId;damageEnemy(e,4,H.dashX,H.dashZ,{src:'dash'});shake=Math.max(shake,0.3);}}
    for(let i=0;i<cracks.length;i++){const c=cracks[i];if(c.alive&&Math.hypot(c.x-H.p.x,c.z-H.p.z)<c.s+1.9&&Math.abs(c.y-H.p.y)<5)breakCrack(c);}
    if(H.dashT<=0){H.v.x*=0.22;H.v.z*=0.22;slashArc(H.p.x,H.p.y+1,H.p.z,H.face,1,1.6,0xffb08a);}
  }else{
    running=I.run&&mag>0.1&&!H.stLock&&H.grounded&&!H.swim;
    let sp=running?11.5:6.2;if(H.swim)sp=3.4;if(H.glide)sp=9.5;if(H.atkT>0&&H.grounded)sp*=0.35;if(H.castT>0)sp*=0.3;if(H.spinT>0)sp*=0.5;
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
    if(H.glide){drain=6;
      if(inUpdraft(H.p.x,H.p.y,H.p.z)){H.vy+=(11-H.vy)*Math.min(1,dt*4);if(Math.random()<dt*20)spark(H.p.x+(Math.random()-0.5)*2,H.p.y,H.p.z+(Math.random()-0.5)*2,0,8,0,0.5,0.3,0xd8fff4,0,0);}
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
  if(H.relay>0&&Math.random()<dt*16)spark(H.p.x+(Math.random()-0.5)*0.9,H.p.y+0.2+Math.random()*1.4,H.p.z+(Math.random()-0.5)*0.9,0,1.6,0,0.6,0.3,0xffd166,-0.5,0);
  if(H.en>=100&&Math.random()<dt*8)spark(H.p.x+(Math.random()-0.5)*0.9,H.p.y+0.1,H.p.z+(Math.random()-0.5)*0.9,0,2.2,0,0.7,0.26,HEROES[H.ci].hex,-0.5,0);
  const hs=Math.hypot(H.v.x,H.v.z);
  if(H.dashT<=0&&H.atkT<=0&&H.spinT<=0&&hs>0.6)H.face+=angDiff(Math.atan2(H.v.x,H.v.z),H.face)*Math.min(1,dt*13);
  if(running&&H.grounded){H.stepT-=dt;if(H.stepT<=0){H.stepT=0.16;spark(H.p.x,H.p.y+0.1,H.p.z,-H.v.x*0.1,0.8,-H.v.z*0.1,0.4,0.35,0xe8e0c8,-1,2);}}
  H.running=running;H.speed=hs;
}

function animHero(dt,t){
  const m=heroes[H.ci],hs=H.speed||0,amt=Math.min(1,hs/6.2),run=clamp((hs-6.2)/5,0,1);
  H.walk+=hs*dt*1.75;const s=Math.sin(H.walk),c=Math.cos(H.walk);
  let aL=0,aR=0,lL=0,lR=0,kL=0,kR=0,eL=-0.12,eR=-0.12,by=Math.sin(t*2)*0.012,tx=0,twist=0;
  if(H.dead){tx=-1.45;}
  else if(H.spinT>0){aR=-1.5;aL=-1.2;eR=0;eL=-0.4;tx=0.2;lL=0.3;lR=-0.3;kL=0.4;}
  else if(H.dashT>0){tx=0.65;aR=-1.4;aL=0.8;lL=0.7;lR=-0.5;kL=0.7;eR=0;}
  else if(H.glide){aL=aR=-2.95;eL=eR=0;lL=0.3+Math.sin(t*3)*0.1;lR=0.12-Math.sin(t*3)*0.1;kL=0.5;kR=0.3;tx=0.3;}
  else if(H.swim){tx=1.1;aL=-2.3+s*0.9;aR=-2.3-s*0.9;lL=s*0.5;lR=-s*0.5;by=Math.sin(t*2.5)*0.05;}
  else if(!H.grounded){const f=clamp(-H.vy*0.05,-0.5,0.9);aL=aR=-0.9-f;lL=-0.55;lR=0.3;kL=0.9;kR=0.5;tx=0.08;eL=eR=-0.5;}
  else{lL=s*(0.75+run*0.3)*amt;lR=-lL;aL=-s*(0.6+run*0.45)*amt;aR=-aL;by+=Math.abs(c)*0.055*amt;tx=amt*(0.05+run*0.2);
    kL=(Math.max(0,lL)*0.9+Math.max(0,-c)*0.5*(0.4+run))*amt;kR=(Math.max(0,lR)*0.9+Math.max(0,c)*0.5*(0.4+run))*amt;
    eL=eR=-0.12-amt*(0.35+run*0.6);
    if(amt<0.1){aL+=Math.sin(t*1.5)*0.03;aR-=Math.sin(t*1.5)*0.03;if(m.idx===2){aR=-0.5;eR=-0.5;}}}
  if(m.idx===2&&H.grounded&&!H.swim)by+=0.05+Math.sin(t*2.4)*0.04;
  if(H.atkT>0){const k=1-H.atkT/H.atkDur;
    if(H.ci===0){aR=lerp(-2.7,1.0,sstep(0,0.55,k));eR=-0.1;twist=lerp(0.75,-0.65,sstep(0,0.6,k))*(H.combo%2?-1:1);}
    else{aR=-1.5-Math.sin(k*Math.PI)*0.5;eR=-0.2;if(H.ci===1){aL=-1.2;eL=-0.2;twist=0.4;}}}
  if(H.castT>0||H.ultT>0&&H.ci!==0){aL=aR=-2.7;eL=eR=-0.1;}
  const k=Math.min(1,dt*18);
  m.armL.rotation.x+=(aL-m.armL.rotation.x)*k;m.armR.rotation.x+=(aR-m.armR.rotation.x)*k;
  m.legL.rotation.x+=(lL-m.legL.rotation.x)*k;m.legR.rotation.x+=(lR-m.legR.rotation.x)*k;
  m.kneeL.rotation.x+=(kL-m.kneeL.rotation.x)*k;m.kneeR.rotation.x+=(kR-m.kneeR.rotation.x)*k;
  m.elbL.rotation.x+=(eL-m.elbL.rotation.x)*k;m.elbR.rotation.x+=(eR-m.elbR.rotation.x)*k;
  m.tilt.rotation.x+=(tx-m.tilt.rotation.x)*Math.min(1,dt*9);
  H.twist+=(twist-H.twist)*Math.min(1,dt*22);m.body.rotation.y=H.twist;
  m.body.position.y=by;
  m.head.rotation.x=H.grounded?Math.sin(t*1.3)*0.03:-0.1;m.head.rotation.y=H.grounded&&amt<0.1?Math.sin(t*0.6)*0.12:0;
  m.blink-=dt;if(m.blink<=0)m.blink=2.4+Math.random()*3;
  const shut=m.blink<0.13||H.dead||H.inv>0.7&&H.dashT<=0&&H.ultT<=0;
  if(m.shut!==shut){m.shut=shut;m.face.material.map=shut?m.texClosed:m.texOpen;}
  if(m.crystal){m.crystal.rotation.y=t*2;m.staffGlow.material.opacity=0.6+0.25*Math.sin(t*3)+(H.castT>0?0.3:0);}
  for(let i=0;i<m.swings.length;i++){const w=m.swings[i];
    w.g.rotation.x=w.base+amt*w.amp*(0.6+run*0.4)+(H.glide?0.9:0)+clamp(-H.vy*0.03,-0.3,0.6)*(H.grounded?0:1)+Math.sin(t*w.f+i)*0.09*(0.5+amt);}
  const pop=1+H.pop*0.25;m.root.scale.set(1/Math.sqrt(pop),pop,1/Math.sqrt(pop));
  m.root.position.copy(H.p);if(H.swim)m.root.position.y+=0.25;
  m.root.rotation.y=H.face;
  m.root.visible=!(H.inv>0&&H.dashT<=0&&H.spinT<=0&&H.ultT<=0&&!H.dead&&Math.floor(t*16)%2===0);
  const g=Math.max(groundH(H.p.x,H.p.z),platFloor(H.p.x,H.p.z,H.p.y+0.5));
  heroShadow.visible=!H.swim&&g>WATER-0.3;heroShadow.position.set(H.p.x,g+0.08,H.p.z);heroShadow.scale.setScalar(Math.max(0.2,0.55-(H.p.y-g)*0.03));
}

/* 目标圈：标出下一击会打向谁 */
const tgtRing=new THREE.Mesh(ringGeo,glowy(0xffffff,0.8));tgtRing.visible=false;tgtRing.renderOrder=2;scene.add(tgtRing);
let tgtE=null;
function updateTarget(t){
  const e=started&&!H.dead?nearestEnemy(H.ci===0?7:23):null;tgtE=e;
  if(!e){tgtRing.visible=false;return;}
  const gy=Math.max(groundH(e.p.x,e.p.z),WATER);tgtRing.visible=true;tgtRing.position.set(e.p.x,(e.fly?gy:e.p.y)+0.16,e.p.z);
  const s=e.r*1.25+Math.sin(t*5)*0.06;tgtRing.scale.set(s,1,s);tgtRing.rotation.y=t*1.5;tgtRing.material.color.setHex(HEROES[H.ci].hex);tgtRing.material.opacity=0.55;
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
  burst(c.x,c.y+0.8,c.z,36,6,0xffd76a,0.5,1.0,5,6);shockRing(c.x,c.y+0.2,c.z,3,0xffe7a0,0.5);sfx('chest');hudTrack(true);addEnergy(25);
  if(H.frags%4===0){H.maxHp+=2;H.hp=H.maxHp;hudHearts();toast('集齐 4 枚心之碎片，生命上限 +1');}
  else{toast('宝箱：心之碎片 '+(H.frags%4)+'/4');heal(2);}
  saveGame();
}
function activateTower(tw){
  lightTower(tw);S.towersLit++;H.maxHp+=2;H.hp=H.maxHp;H.st=H.maxSt;S.respawn.set(tw.x+2.6,tw.y+0.5,tw.z+1.2);
  shockRing(tw.x,tw.y+0.7,tw.z,14,CYAN,0.9);shockRing(tw.x,tw.y+0.7,tw.z,7,0xffffff,0.6);
  for(let i=0;i<70;i++){const a=Math.random()*TAU,r=Math.random()*1.5;spark(tw.x+Math.cos(a)*r,tw.y+1+Math.random()*7,tw.z+Math.sin(a)*r,Math.cos(a)*2.5,6+Math.random()*10,Math.sin(a)*2.5,1.4,0.55,i%3?CYAN:0xffffff,3,0.4);}
  shake=Math.max(shake,0.4);sfx('tower');hudHearts();hudTrack(true);addEnergy(100);
  banner(tw.name,'已点亮 · 生命上限 +1 · 这里成为新的落脚点');
  saveGame();
  if(S.towersLit===TOWERS.length&&!S.done)S.fin=4;
}
function finale(){
  S.done=true;banner('云野的风，再次流动','四座风塔全部点亮 · 今夜起天上会有极光');sfx('finale');saveGame();S.fireworks=7;
  setTimeout(showEnding,5200);
}
let hintT=0,hintGap=0;
function hint(key,msg){if(S.hints[key]||hintGap>0||!started)return;S.hints[key]=1;hintGap=6;toast(msg,true);}
function updateObjects(dt,t){
  const hx=H.p.x,hy=H.p.y+0.9,hz=H.p.z;
  for(let i=0;i<shards.length;i++){const sh=shards[i];if(sh.got)continue;const m=sh.m;
    const dx=hx-sh.x,dz=hz-sh.z;if(dx*dx+dz*dz>110000){m.visible=false;continue;}m.visible=true;
    m.position.set(sh.x,sh.y+Math.sin(t*2+sh.ph)*0.18,sh.z);m.rotation.y=t*1.6+sh.ph;
    const dy=hy-m.position.y,d2=dx*dx+dy*dy+dz*dz;
    if(d2<18&&!H.dead){const k=dt*3.2;sh.x+=dx*k;sh.y+=dy*k;sh.z+=dz*k;}
    if(d2<2.8&&!H.dead&&started)collectShard(sh);}
  for(let i=0;i<chests.length;i++){const c=chests[i];if(c.hidden)continue;
    if(!c.open){c.glow.material.opacity=0.42+0.2*Math.sin(t*3+c.id);
      if(Math.hypot(hx-c.x,hz-c.z)<1.9&&Math.abs(H.p.y-c.y)<1.6&&!H.dead&&started)openChest(c);}
    else if(c.t<1){c.t=Math.min(1,c.t+dt*2.5);c.lid.rotation.x=-1.9*(1-(1-c.t)*(1-c.t));}}
  for(let i=0;i<TOWERS.length;i++){const tw=TOWERS[i];
    tw.crystal.rotation.y=t*(tw.lit?1.6:0.6);tw.crystal.position.y=8.5+Math.sin(t*1.3+tw.id)*0.2;
    tw.beam.material.opacity=(tw.lit?0.4:0.2)+Math.sin(t*2+tw.id)*0.05;
    if(tw.ringsG)tw.ringsG.rotation.y=t*(tw.lit?0.9:0.25);
    const near=Math.hypot(hx-tw.x,hz-tw.z)<3.4&&Math.abs(H.p.y-(tw.y+0.5))<1.2;
    if(!tw.lit&&!tw.sealed&&started&&!H.dead&&H.grounded&&near)activateTower(tw);
    if(tw.sealed&&tw.kind==='summit'&&Math.hypot(hx-tw.x,hz-tw.z)<6)hint('seal3','塔被寒冰封住了。打倒霜卫，冰才会化开');}
  for(let i=0;i<cracks.length;i++){const c=cracks[i];if(!c.alive)continue;const k=0.5+0.5*Math.sin(t*2.5+c.id);c.glow.material.opacity=0.2+0.25*k;c.mat.emissiveIntensity=0.35+0.5*k;}
  updateFloes(dt);updateHazards(dt);updateFields(dt,t);updateTarget(t);
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
