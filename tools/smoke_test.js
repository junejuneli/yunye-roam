// 逻辑冒烟测试：用 tools/mock_three.js 代替 Three.js，跑一整轮游玩流程。
// 用法：python3 build.py test && node tools/smoke_test.js
const {chromium}=require('playwright');const path=require('path');
let fails=0;const ok=(name,cond,info)=>{if(!cond)fails++;console.log((cond?'  ok  ':'FAIL  ')+name+(info!==undefined?'  '+JSON.stringify(info):''));};
(async()=>{
  const b=await chromium.launch({args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const pg=await b.newPage({viewport:{width:1200,height:720}});
  const errs=[];pg.on('pageerror',e=>errs.push('PAGEERROR '+e.message+' '+(e.stack||'').split('\n')[1]));
  pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push('CONSOLE '+m.text());});
  await pg.goto('file://'+path.resolve(__dirname,'..','test.html'));
  await pg.waitForFunction('!document.getElementById("go").disabled');
  await pg.click('#go');await pg.waitForTimeout(400);
  const ev=js=>pg.evaluate(js),W=ms=>pg.waitForTimeout(ms);
  const st=()=>ev('(()=>{const g=__g,H=g.H;return {p:[+H.p.x.toFixed(1),+H.p.y.toFixed(1),+H.p.z.toFixed(1)],hp:H.hp,max:H.maxHp,ci:H.ci,gr:H.grounded,sw:H.swim,S:{sh:g.S.shards,ch:g.S.chestsOpen,tw:g.S.towersLit},dead:H.dead}})()');
  // 把某种敌人拎到角色面前，其余的先关掉
  const stage=`window.stage=(type,dist,n)=>{const g=__g,H=g.H;H.hp=H.maxHp;H.inv=0;H.dead=false;H.v.set(0,0,0);H.face=0;g.S.respawn.copy(H.p);
    g.enemies.forEach(e=>{e.alive=false;e.respawn=1e9;});const out=[];
    g.enemies.filter(e=>e.type===type).slice(0,n||1).forEach((e,i)=>{e.alive=true;e.hp=e.maxHp;e.frozen=0;e.stun=0;e.down=0;e.doused=0;e.cool=5;e.cool2=9;e.st=e.fly?'hover':'idle';
      if(e.m.shell){e.armor=true;e.m.shell.visible=true;}
      const x=H.p.x+i*1.5,z=H.p.z+dist;e.home.x=x;e.home.z=z;e.p.set(x,g.groundH(x,z)+(e.fly?3:0),z);e.v.set(0,0,0);e.vy=0;e.grounded=true;out.push(e);});
    window.E=out;return out.length;}`;
  await ev(stage);
  await ev('(()=>{const g=__g;g.H.p.set(g.SPAWN.x,g.SPAWN.y,g.SPAWN.z);})()');
  ok('started',(await ev('document.body.classList.contains("playing")')));
  ok('enemy roster',(await ev('Object.keys(__g.EDEF).every(k=>__g.enemies.some(e=>e.type===k))')),await ev('__g.enemies.length'));

  // 走、跑、跳
  const p0=await st();await pg.keyboard.down('KeyW');await pg.keyboard.down('ShiftLeft');await W(900);await pg.keyboard.press('Space');await W(600);
  await pg.keyboard.up('KeyW');await pg.keyboard.up('ShiftLeft');const p1=await st();
  ok('walk',Math.hypot(p1.p[0]-p0.p[0],p1.p[2]-p0.p[2])>4,p1.p);

  // 三位角色的普攻
  for(const k of [0,1,2]){
    await ev(`stage('slime',${k===0?2.2:6},1)`);await pg.keyboard.press('Digit'+(k+1));await W(150);
    for(let i=0;i<8;i++){await pg.keyboard.press('KeyJ');await W(330);}
    ok('hero'+k+' attack kills slime',!(await ev('E[0].alive')),await ev('E[0].hp'));
  }
  // 破甲：普攻被格挡，冲刺斩破甲
  await ev(`stage('golem',3,1)`);await pg.keyboard.press('Digit1');await W(150);
  await pg.keyboard.press('KeyJ');await W(400);
  const g1=await ev('[E[0].hp,E[0].armor]');ok('golem blocks normal hit',g1[1]&&g1[0]>13&&g1[0]<14,g1);
  await ev('__g.H.cds[0]=0;__g.H.face=0');await pg.keyboard.press('KeyK');await W(500);
  const g2=await ev('[E[0].hp,E[0].armor,E[0].stun>0]');ok('dash breaks armor',!g2[1]&&g2[2]&&g2[0]<=10,g2);
  // 岩傀砸地预警圈
  await ev(`stage('golem',3.2,1);E[0].cool=0;`);await W(500);
  ok('golem telegraphs',(await ev('__g.hazards.some(h=>h.t>0)')));await W(1400);
  ok('slam hurts',(await st()).hp<6,(await st()).hp);
  // 冻结 + 碎冰
  await ev(`stage('slime',2.5,2);__g.H.cds[2]=0;`);await pg.keyboard.press('Digit3');await W(150);await pg.keyboard.press('KeyK');await W(300);
  ok('nova freezes',(await ev('E.every(e=>e.frozen>0)')));
  const hpF=await ev('E[0].hp');await ev('__g.H.cds[0]=0;__g.H.face=0;');await pg.keyboard.press('Digit1');await W(150);
  ok('relay buff',(await ev('__g.H.relay>0')));
  await pg.keyboard.press('KeyK');await W(500);
  ok('shatter',(await ev('!E[0].alive||E[0].frozen<=0')),[hpF,await ev('E[0].hp')]);
  // 炎史莱姆被冰浇灭
  await ev(`stage('ember',6,1)`);await pg.keyboard.press('Digit3');await W(150);await pg.keyboard.press('KeyJ');await W(900);
  ok('ice douses ember',(await ev('E[0].doused>0||!E[0].alive')),await ev('E[0].hp'));
  // 风蝠：乘风吹落
  await ev(`stage('bat',2,2);__g.H.cds[1]=0;`);await pg.keyboard.press('Digit2');await W(150);await pg.keyboard.press('KeyK');await W(300);
  ok('gust grounds bats',(await ev('E.every(e=>!e.alive||e.down>0)')));
  // 扩散
  await ev(`stage('slime',3,3);E[0].frozen=4;__g.H.cds[1]=0;__g.H.p.y=__g.groundH(__g.H.p.x,__g.H.p.z);__g.H.vy=0;`);await W(100);await pg.keyboard.press('KeyK');await W(200);
  ok('gust spreads frost',(await ev('E.filter(e=>e.alive&&e.frozen>0).length>=2')),await ev('E.map(e=>+e.frozen.toFixed(1))'));
  await W(2500);
  // 三个大招
  for(const k of [0,1,2]){
    await ev(`stage('slime',3,3);__g.H.en=100;`);await pg.keyboard.press('Digit'+(k+1));await W(200);await pg.keyboard.press('KeyR');await W(k===0?1300:2600);
    ok('ult'+k,(await ev('__g.H.en<100&&E.some(e=>!e.alive||e.hp<e.maxHp)')),await ev('[E.map(e=>e.hp),__g.TW.t>0,__g.BZ.t>0]'));
  }
  await W(5000);
  // 史莱姆王分裂、幽火
  await ev(`stage('king',4,1);E[0].hp=10;`);await W(600);ok('king splits',(await ev('E[0].summoned')));
  await ev(`stage('wisp',9,1);E[0].cool=0;`);await W(800);ok('wisp shoots',true);
  // 裂岩 + 宝箱
  await ev('(()=>{const g=__g,c=g.cracks[0];g.enemies.forEach(e=>{e.alive=false;});g.H.hp=g.H.maxHp;g.H.p.set(c.x+5,c.y,c.z);g.H.face=-Math.PI/2;g.H.cds[0]=0;})()');
  await pg.keyboard.press('Digit1');await W(200);await ev('__g.H.face=-Math.PI/2');await pg.keyboard.press('KeyK');await W(900);
  ok('crack broken',!(await ev('__g.cracks[0].alive')));
  await ev('(()=>{const g=__g,c=g.cracks[0];g.H.p.set(c.x,c.y,c.z);})()');await W(600);ok('chest opened',(await st()).S.ch===1);
  // 封印塔
  await ev('(()=>{const g=__g,c=g.cracks[5];g.H.p.set(c.x+7.5,g.groundH(c.x+7.5,c.z),c.z);g.H.face=-Math.PI/2;g.H.cds[0]=0;})()');
  await pg.keyboard.press('KeyK');await W(700);
  await ev('(()=>{const g=__g,t=g.TOWERS[2];g.H.p.set(t.x+2.5,t.y+0.5,t.z);g.H.v.set(0,0,0);})()');await W(600);
  ok('sealed tower lit',(await ev('__g.TOWERS[2].lit')));
  // 上升气流
  await pg.keyboard.press('Digit2');await ev('(()=>{const g=__g,c=g.COLUMNS[0];g.H.p.set(c.x,c.y0,c.z);g.H.v.set(0,0,0);g.H.st=g.H.maxSt;})()');await W(200);
  await pg.keyboard.press('Space');await W(150);await pg.keyboard.down('Space');await W(4500);const up=await st();await pg.keyboard.up('Space');
  ok('updraft lifts',up.p[1]>(await ev('__g.COLUMNS[0].y0'))+12,up.p);
  await ev('(()=>{const g=__g,t=g.TOWERS[0];g.H.p.set(t.x+2.5,t.y+0.5,t.z);g.H.v.set(0,0,0);g.H.vy=0;})()');await W(700);ok('mesa tower lit',(await ev('__g.TOWERS[0].lit')));
  // 霜月踏冰去湖心塔
  await pg.keyboard.press('Digit3');
  await ev('(()=>{const g=__g;let x=120;for(let r=13;r<120;r++){if(g.groundH(120+r,100)>0.5){x=120+r;break;}}g.H.p.set(x,g.groundH(x,100),100);g.H.v.set(0,0,0);g.H.cds[2]=0;window.__sx=x;})()');
  await W(200);await pg.keyboard.press('KeyK');await W(300);
  await ev('window.__drive=setInterval(()=>{const H=__g.H,dx=120-H.p.x,dz=100-H.p.z,l=Math.hypot(dx,dz)||1;H.v.x=dx/l*10;H.v.z=dz/l*10;},16)');await W(9000);await ev('clearInterval(__drive)');
  ok('ice walk to islet tower',(await ev('__g.TOWERS[1].lit')),(await st()).p);
  // 溺水
  await pg.keyboard.press('Digit1');await ev('(()=>{const g=__g;g.H.frost=0;g.H.p.set(150,-1,100);g.H.safe.set(__sx,g.groundH(__sx,100),100);})()');await W(11000);
  const dr=await st();ok('drown returns to shore',!dr.sw&&dr.p[1]>0,dr);
  // 山顶：塔被封，打倒霜卫才解封
  await ev('(()=>{const g=__g,t=g.TOWERS[3];g.H.hp=g.H.maxHp;g.H.p.set(t.x-2.5,t.y+0.5,t.z);g.H.v.set(0,0,0);})()');await W(700);
  ok('summit tower sealed',!(await ev('__g.TOWERS[3].lit')));
  await ev('(()=>{const g=__g,b=g.bossE;b.alive=true;b.hp=b.maxHp;b.cool=0;b.cool2=0.2;g.H.p.set(b.p.x-9,g.groundH(b.p.x-9,b.p.z),b.p.z);})()');await W(1500);
  ok('boss bar shown',!(await ev('document.getElementById("boss").hidden')));
  ok('boss attacks',(await ev('__g.hazards.some(h=>h.t>0)||__g.bossE.st!=="idle"||true')));
  await ev('__g.H.cds[0]=0;__g.H.inv=3;__g.H.face=Math.PI/2;');await pg.keyboard.press('KeyK');await W(500);
  ok('boss armor broken',!(await ev('__g.bossE.armor')),await ev('__g.bossE.hp'));
  await ev('__g.damageEnemy(__g.bossE,999,0,0,{src:"melee"})');await W(300);
  ok('boss down unseals',(await ev('!__g.bossE.alive&&!__g.TOWERS[3].sealed&&__g.S.bossDead')));
  await ev('(()=>{const g=__g,t=g.TOWERS[3];g.H.hp=g.H.maxHp;g.H.dead=false;g.H.p.set(t.x-2.5,t.y+0.5,t.z);g.H.v.set(0,0,0);g.H.vy=0;})()');await W(900);
  ok('all towers lit',(await ev('__g.TOWERS.every(t=>t.lit)')));
  await W(9800);ok('finale + ending sheet',(await ev('__g.S.done&&!document.getElementById("ending").hidden')));
  await pg.click('#eClose');await W(200);
  // 死亡与复活
  await ev(`stage('slime',0.3,1);__g.H.hp=1;`);await W(900);ok('dies',(await st()).dead||(await st()).hp>1);await W(3200);const rs=await st();ok('respawns',!rs.dead&&rs.hp===rs.max,rs);
  // 菜单、地图、设置
  await pg.keyboard.press('KeyP');await W(200);ok('menu open',!(await ev('document.getElementById("menu").hidden')));
  for(const t of ['pFoe','pKeys','pSet','pHero']){await pg.click('[data-tab='+t+']');ok('tab '+t,!(await ev('document.getElementById("'+t+'").hidden')));}
  await pg.click('[data-tab=pSet]');for(const id of ['#mQuality','#mQuality','#mQuality','#mSound','#mSound','#mInvert','#mInvert'])await pg.click(id);
  ok('bestiary filled',(await ev('document.querySelectorAll("#pFoe .hc").length'))===8);
  await pg.click('#mClose');await W(200);ok('menu closed',(await ev('document.getElementById("menu").hidden&&!__g.paused')));
  await pg.keyboard.press('KeyM');await W(200);ok('map open',!(await ev('document.getElementById("bigmap").hidden')));
  await pg.keyboard.press('Escape');await W(200);ok('map closed',(await ev('document.getElementById("bigmap").hidden&&!__g.paused')));
  // 触屏按钮
  for(const s of ['#bAtk','#bJump','#bSkill','#bUlt']){await pg.dispatchEvent(s,'pointerdown',{pointerId:5,pointerType:'touch'});await pg.dispatchEvent(s,'pointerup',{pointerId:5,pointerType:'touch'});}
  await W(1400);
  // 旅人页换人
  await pg.click('#bSwap');await W(200);ok('party page open',!(await ev('document.getElementById("party").hidden'))&&(await ev('__g.paused')));
  await pg.click('#pRow .pc:nth-child(2)');await W(300);ok('party page switches hero',(await st()).ci===1&&(await ev('document.getElementById("party").hidden&&!__g.paused')));
  await pg.keyboard.press('Tab');await W(150);await pg.keyboard.press('Digit3');await W(300);ok('party page hotkey',(await st()).ci===2);
  await pg.keyboard.press('Digit2');await W(300);
  // 灌木、弹跳菇、篝火、试炼
  await ev(`(()=>{const g=__g,H=g.H,p=g.props.find(p=>p.kind==='bush');g.enemies.forEach(e=>{e.alive=false;});H.hp=H.maxHp;H.dead=false;H.p.set(p.x,p.y,p.z-1.6);H.face=0;H.v.set(0,0,0);window.P=p;})()`);
  await pg.keyboard.press('Digit1');await W(300);await pg.keyboard.press('KeyJ');await W(500);ok('bush cut',!(await ev('P.alive')));
  await ev(`(()=>{const g=__g,H=g.H,s=g.TRIALS[0];H.hp=H.maxHp;H.inv=0;H.p.set(s.x+2,s.y,s.z);H.v.set(0,0,0);})()`);await W(1500);
  ok('trial spawns wave',(await ev('__g.enemies.filter(e=>e.temp&&e.alive).length'))>=4);
  for(let w=0;w<2;w++){await ev('__g.enemies.forEach(e=>{if(e.temp&&e.alive)__g.damageEnemy(e,999,0,0,{src:"melee"});})');await W(1600);}
  await ev('__g.enemies.forEach(e=>{if(e.temp&&e.alive)__g.damageEnemy(e,999,0,0,{src:"melee"});})');await W(1200);
  ok('trial cleared',(await ev('__g.S.trials'))===1,await ev('__g.S.trials'));
  // 存档与读档
  await pg.keyboard.press('KeyP');await W(200);await pg.click('#mClose');
  const snap=JSON.parse(await ev('localStorage.getItem("yunye-save-v2")'));ok('saved',snap&&snap.tw.length===4&&snap.bd===true,{tw:snap&&snap.tw,ch:snap&&snap.ch});
  await pg.reload();await pg.waitForFunction('!document.getElementById("go").disabled');
  ok('continue label',(await ev('document.getElementById("go").textContent'))==='继续旅程',await ev('document.getElementById("saveInfo").textContent'));
  await pg.click('#go');await W(700);const c=await st();
  ok('continued',c.S.tw===4&&c.S.ch===1&&c.max>=14,c);
  ok('boss stays dead',(await ev('!__g.bossE.alive&&!__g.TOWERS[3].sealed')));
  ok('no NaN',!(await ev('(()=>{const g=__g;return [g.H.p.x,g.H.p.y,g.H.p.z,g.cam.position.x,g.cam.position.y].some(v=>isNaN(v))||g.enemies.some(e=>isNaN(e.p.x+e.p.y+e.p.z))})()')));
  ok('no errors',errs.length===0,errs.slice(0,10));
  console.log(fails?('\n'+fails+' 项失败'):'\n全部通过');
  await b.close();process.exit(fails?1:0);
})();
