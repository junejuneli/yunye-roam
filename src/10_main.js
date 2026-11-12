/* ===== 声音：全部现场合成，不加载音频文件 ===== */
const AU={vol:0.55,ctx:null,master:null,music:null,on:true,next:3,idx:4,windG:null,buf:null,last:{},windT:0};
function audioInit(){
  if(AU.ctx)return;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=AU.ctx=new AC();
    AU.master=c.createGain();AU.master.gain.value=AU.on?AU.vol:0;AU.master.connect(c.destination);
    const dl=c.createDelay(1);dl.delayTime.value=0.38;const fb=c.createGain();fb.gain.value=0.36;const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2200;
    AU.music=c.createGain();AU.music.gain.value=0.55;AU.music.connect(AU.master);AU.music.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(AU.master);
    const nb=AU.buf=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const ws=c.createBufferSource();ws.buffer=nb;ws.loop=true;const wf=c.createBiquadFilter();wf.type='lowpass';wf.frequency.value=420;
    AU.windG=c.createGain();AU.windG.gain.value=0;ws.connect(wf);wf.connect(AU.windG);AU.windG.connect(AU.master);ws.start();
  }catch(e){AU.ctx=null;}
}
function tone(f,d,type,vol,f2,delay,bus){
  const c=AU.ctx;if(!c||!AU.on)return;
  try{const t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    o.connect(g);g.connect(bus||AU.master);o.start(t);o.stop(t+d+0.05);}catch(e){}
}
function hiss(d,vol,f1,f2,q){
  const c=AU.ctx;if(!c||!AU.on)return;
  try{const t=c.currentTime,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
    s.buffer=AU.buf;f.type='bandpass';f.Q.value=q||1;f.frequency.setValueAtTime(f1,t);f.frequency.exponentialRampToValueAtTime(f2,t+d);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
    s.connect(f);f.connect(g);g.connect(AU.master);s.start(t,Math.random());s.stop(t+d+0.05);}catch(e){}
}
const SFX={
  jump:function(){tone(320,0.16,'sine',0.14,620);},
  jump2:function(){tone(520,0.18,'sine',0.13,980);hiss(0.2,0.07,900,2600,1);},
  land:function(){hiss(0.12,0.14,220,90,1);},
  thump:function(){hiss(0.3,0.28,160,50,1);tone(80,0.3,'sine',0.28,40);},
  splash:function(){hiss(0.4,0.18,1400,500,0.7);},
  slash:function(){hiss(0.16,0.2,2600,700,1.2);},
  whoosh:function(){hiss(0.22,0.15,1200,3200,1.5);},
  icebolt:function(){tone(1400,0.18,'triangle',0.09,2400);hiss(0.15,0.05,4000,6000,2);},
  hit:function(){tone(260,0.09,'square',0.09,120);hiss(0.08,0.13,1800,600,1);},
  pop:function(){tone(420,0.2,'sine',0.18,90);hiss(0.2,0.11,900,300,1);},
  hurt:function(){tone(220,0.3,'sawtooth',0.13,70);},
  heal:function(){tone(660,0.2,'sine',0.11);tone(880,0.3,'sine',0.11,0,0.1);},
  pickup:function(){tone(1318,0.25,'sine',0.13,0,0,AU.music);tone(1976,0.4,'sine',0.11,0,0.08,AU.music);},
  chest:function(){[523,659,784,1047].forEach(function(f,i){tone(f,0.5,'triangle',0.13,0,i*0.09,AU.music);});},
  tower:function(){[262,392,523,659,784,1047].forEach(function(f,i){tone(f,2.2,'sine',0.11,0,i*0.13,AU.music);});hiss(1.6,0.13,300,3000,0.6);},
  finale:function(){[523,659,784,1047,1319,1568,2093].forEach(function(f,i){tone(f,2.6,'triangle',0.1,0,i*0.16,AU.music);});},
  switch:function(){tone(700,0.12,'triangle',0.11,1100);},
  dash:function(){hiss(0.28,0.22,500,4200,1);tone(180,0.25,'sawtooth',0.06,520);},
  wind:function(){hiss(0.8,0.22,300,2400,0.6);tone(300,0.6,'sine',0.07,900);},
  glide:function(){hiss(0.5,0.09,500,1400,0.8);},
  ice:function(){[1568,2093,2637,3136].forEach(function(f,i){tone(f,0.7,'sine',0.06,0,i*0.05,AU.music);});hiss(0.5,0.11,3000,7000,1.5);},
  break:function(){hiss(0.5,0.32,900,120,0.6);tone(110,0.4,'square',0.11,45);},
  orb:function(){tone(500,0.3,'sine',0.06,250);},
  deny:function(){tone(160,0.12,'square',0.04);},
  clang:function(){tone(1900,0.12,'square',0.05,1500);tone(2700,0.2,'triangle',0.05,2500);hiss(0.06,0.1,5000,3000,2);},
  shatter:function(){[2637,3136,3951,4699].forEach(function(f,i){tone(f,0.25,'triangle',0.06,f*0.7,i*0.025);});hiss(0.3,0.2,6000,1800,1);},
  ready:function(){tone(784,0.14,'triangle',0.1,0,0,AU.music);tone(1175,0.3,'triangle',0.1,0,0.1,AU.music);},
  ult:function(){hiss(0.7,0.25,200,5000,0.6);[196,294,392,587].forEach(function(f,i){tone(f,0.9,'sawtooth',0.05,f*2,i*0.04);});},
  swoop:function(){hiss(0.4,0.14,2400,600,1.4);},
  screech:function(){tone(2300,0.22,'sawtooth',0.035,3100);},
  fire:function(){hiss(0.3,0.16,700,200,0.8);},
  charge:function(){tone(90,0.7,'sawtooth',0.09,260);hiss(0.6,0.07,300,1400,1);},
  blink:function(){tone(1200,0.2,'sine',0.07,300);},
  rustle:function(){hiss(0.18,0.12,3000,1200,0.8);},
  crack:function(){hiss(0.16,0.2,1400,300,0.9);tone(180,0.1,'square',0.06,90);},
  boing:function(){tone(180,0.32,'sine',0.16,620);tone(360,0.2,'triangle',0.05,900);},
  flap:function(){hiss(0.5,0.1,900,2400,1.2);}
};
function sfx(n){if(!AU.ctx||!AU.on)return;const now=performance.now();if(AU.last[n]&&now-AU.last[n]<45)return;AU.last[n]=now;SFX[n]();}
const SCALE=[261.63,293.66,329.63,392,440,523.25,587.33,659.25,783.99,880];
function audioTick(dt){
  if(!AU.ctx||!AU.on||!started)return;
  AU.next-=dt;
  if(AU.next<=0){const night=DN.night>0.5,n=1+Math.floor(Math.random()*3);let tt=0;
    for(let i=0;i<n;i++){AU.idx=clamp(AU.idx+Math.floor(Math.random()*5)-2,0,SCALE.length-1);const f=SCALE[AU.idx]*(night?0.5:1);
      tone(f,2.6,'sine',0.08,0,tt,AU.music);tone(f*2,1.2,'sine',0.018,0,tt,AU.music);tt+=0.3+Math.random()*0.5;}
    AU.next=tt+(night?4:2.4)+Math.random()*4;}
  AU.windT-=dt;
  if(AU.windT<=0){AU.windT=0.25;const tg=0.025+clamp(H.p.y/110,0,1)*0.07+(H.glide?0.09:0)+(H.running?0.02:0);
    try{AU.windG.gain.setTargetAtTime(tg,AU.ctx.currentTime,0.4);}catch(e){}}
}
function setSound(on){AU.on=on;if(on)audioInit();if(AU.master){try{AU.master.gain.setTargetAtTime(on?AU.vol:0,AU.ctx.currentTime,0.05);}catch(e){}}
  $('mSound').textContent='声音：'+(on?'开':'关');}

/* ===== 存档 ===== */
const SAVE_KEY='yunye-save-v2';
let SENS=1,INVY=1,camYaw=0.9,camPitch=0.2,camDist=coarse?10.5:9.5,camCur=8.2;
function snapshot(){return {v:2,sh:shards.filter(function(s){return s.got;}).map(function(s){return s.id;}),
  ch:chests.filter(function(c){return c.open;}).map(function(c){return c.id;}),
  cr:cracks.filter(function(c){return !c.alive;}).map(function(c){return c.id;}),
  tw:TOWERS.filter(function(t){return t.lit;}).map(function(t){return t.id;}),
  p:[H.safe.x,H.safe.y,H.safe.z],rp:[S.respawn.x,S.respawn.y,S.respawn.z],ci:H.ci,hp:H.hp,frags:H.frags,tod:DN.tod,hints:S.hints,done:S.done,sound:AU.on,yaw:camYaw,started:started,
  en:Math.round(H.en),bd:S.bossDead,tr:trials.filter(function(T){return T.state===2;}).map(function(T){return T.id;}),seen:S.seen,kills:S.kills,time:Math.round(S.time),vol:AU.vol,sens:SENS,inv:INVY};}
function saveGame(){if(!started)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot()));}catch(e){}}
function loadGame(d){
  if(!d||d.v!==2)return false;
  (d.sh||[]).forEach(function(id){const s=shards[id];if(s&&!s.got){s.got=true;s.m.visible=false;S.shards++;}});
  (d.cr||[]).forEach(function(id){const c=cracks[id];if(c&&c.alive){c.alive=false;c.m.visible=false;c.glow.visible=false;c.col.on=false;if(c.chest){c.chest.hidden=false;c.chest.g.visible=true;}if(c.tower)c.tower.sealed=false;}});
  (d.ch||[]).forEach(function(id){const c=chests[id];if(c&&!c.open){c.open=true;c.t=1;c.lid.rotation.x=-1.9;c.glow.visible=false;c.hidden=false;c.g.visible=true;S.chestsOpen++;}});
  (d.tw||[]).forEach(function(id){const t=TOWERS[id];if(t&&!t.lit){t.sealed=false;lightTower(t);S.towersLit++;}});
  H.frags=d.frags||0;S.stBonus=Math.floor(S.shards/12);H.maxSt=100+20*S.stBonus;H.st=H.maxSt;
  H.maxHp=6+2*S.towersLit+2*Math.floor(H.frags/4);H.hp=clamp(d.hp||H.maxHp,1,H.maxHp);
  if(d.p){H.p.set(d.p[0],d.p[1],d.p[2]);H.safe.copy(H.p);}
  if(d.rp)S.respawn.set(d.rp[0],d.rp[1],d.rp[2]);
  if(typeof d.ci==='number'&&d.ci!==H.ci){heroes[H.ci].root.visible=false;H.ci=d.ci;heroes[H.ci].root.visible=true;}
  if(typeof d.tod==='number')DN.tod=d.tod;if(typeof d.yaw==='number')camYaw=d.yaw;
  S.hints=d.hints||{};S.done=!!d.done;if(S.done)skyU.uAurora.value=1;
  if(d.sound===false)AU.on=false;
  (d.tr||[]).forEach(function(id){const T=trials[id];if(T&&T.state!==2){trialDone(T,true);S.trials++;}});
  H.en=clamp(d.en||0,0,100);S.seen=d.seen||{};S.kills=d.kills||0;S.time=d.time||0;
  if(typeof d.vol==='number')AU.vol=clamp(d.vol,0,1);if(typeof d.sens==='number')SENS=clamp(d.sens,0.4,2);if(d.inv===-1)INVY=-1;
  if(d.bd||TOWERS[3].lit){S.bossDead=true;TOWERS[3].sealed=false;if(TOWERS[3].seal)TOWERS[3].seal.visible=false;
    if(bossE){bossE.alive=false;bossE.respawn=1e9;bossE.m.g.visible=false;bossE.sh.visible=false;}}
  return true;
}

/* ===== 输入 ===== */
const keys={},stick={x:0,y:0};
let runToggle=false,jumpBtn=false,atkBtn=false,atkMouse=false,locked=false,stickId=null,lookId=null,sx=0,sy=0,lx=0,ly=0,downT=0,downMove=0,qManual=false;
const MOVE=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','Tab'];
addEventListener('keydown',function(e){
  if(!started)return;if(MOVE.indexOf(e.code)>=0)e.preventDefault();
  if(e.code==='Escape'||e.code==='KeyP'){if(!$('party').hidden)toggleParty(false);else if(!$('bigmap').hidden)toggleMap(false);else if(!$('ending').hidden)closeEnding();else toggleMenu();return;}
  if(!$('party').hidden){e.preventDefault();if(e.code==='Tab'||e.code==='KeyC'){if(!e.repeat)toggleParty(false);}else if(/^(Digit|Numpad)[123]$/.test(e.code))pickHero(+e.code.slice(-1)-1);return;}
  if((e.code==='Tab'||e.code==='KeyC')&&!e.repeat&&!paused){e.preventDefault();toggleParty(true);return;}
  if(e.code==='KeyM'&&!e.repeat&&$('menu').hidden&&$('ending').hidden){toggleMap();return;}
  if(paused)return;
  if(!e.repeat){
    if(e.code==='Space')I.jump=true;
    else if(e.code==='KeyJ')I.atk=true;
    else if(e.code==='KeyK'||e.code==='KeyE')I.skill=true;
    else if(e.code==='KeyR'||e.code==='KeyF'||e.code==='KeyL')I.ult=true;
    else if(e.code==='Digit1'||e.code==='Numpad1')switchHero(0);
    else if(e.code==='Digit2'||e.code==='Numpad2')switchHero(1);
    else if(e.code==='Digit3'||e.code==='Numpad3')switchHero(2);
    else if(e.code==='KeyQ')switchHero((H.ci+1)%3);
  }
  keys[e.code]=true;
});
addEventListener('keyup',function(e){keys[e.code]=false;});
addEventListener('blur',function(){for(const k in keys)keys[k]=false;atkMouse=false;});
const ring=$('ring'),knob=$('knob');
canvas.addEventListener('pointerdown',function(e){
  if(!started||paused)return;e.preventDefault();canvas.focus();
  if(e.pointerType==='touch'){
    document.body.classList.add('touch');
    try{canvas.setPointerCapture(e.pointerId);}catch(_){}
    if(e.clientX<innerWidth*0.45&&stickId===null){stickId=e.pointerId;sx=e.clientX;sy=e.clientY;ring.hidden=knob.hidden=false;
      ring.style.transform=knob.style.transform='translate('+sx+'px,'+sy+'px)';return;}
    if(lookId===null){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;}
    return;
  }
  if(e.button===2){I.skill=true;return;}
  if(e.button!==0)return;
  if(locked){atkMouse=true;I.atk=true;return;}
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  lookId=e.pointerId;lx=e.clientX;ly=e.clientY;downT=performance.now();downMove=0;
  if(!coarse&&canvas.requestPointerLock){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(function(){});}catch(_){}}
});
canvas.addEventListener('pointermove',function(e){
  if(e.pointerId===stickId){let dx=e.clientX-sx,dy=e.clientY-sy;const d=Math.hypot(dx,dy),R=54;if(d>R){dx*=R/d;dy*=R/d;}
    stick.x=dx/R;stick.y=dy/R;knob.style.transform='translate('+(sx+dx)+'px,'+(sy+dy)+'px)';return;}
  if(locked&&e.pointerType!=='touch'){camYaw-=(e.movementX||0)*0.0026*SENS;camPitch=clamp(camPitch+(e.movementY||0)*0.0022*SENS*INVY,-0.3,1.3);return;}
  if(e.pointerId===lookId){const k=(e.pointerType==='touch'?0.0062:0.0048)*SENS,dx=e.clientX-lx,dy=e.clientY-ly;
    camYaw-=dx*k;camPitch=clamp(camPitch+dy*k*0.8*INVY,-0.3,1.3);lx=e.clientX;ly=e.clientY;downMove+=Math.abs(dx)+Math.abs(dy);}
});
function release(e){
  if(e.pointerId===stickId){stickId=null;stick.x=stick.y=0;ring.hidden=knob.hidden=true;}
  if(e.pointerId===lookId){lookId=null;if(e.pointerType!=='touch'&&!locked&&downMove<6&&performance.now()-downT<300&&started&&!paused)I.atk=true;}
  atkMouse=false;
}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
canvas.addEventListener('contextmenu',function(e){e.preventDefault();});
canvas.addEventListener('wheel',function(e){e.preventDefault();camDist=clamp(camDist+Math.sign(e.deltaY)*1.2,4.5,24);},{passive:false});
document.addEventListener('pointerlockchange',function(){const was=locked;locked=document.pointerLockElement===canvas;if(locked)lookId=null;
  if(was&&!locked&&started&&!paused){atkMouse=false;toggleMenu(true);}});
function hold(el,down,up){el.addEventListener('pointerdown',function(e){e.preventDefault();try{el.setPointerCapture(e.pointerId);}catch(_){}down();});
  const u=function(){if(up)up();};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);el.addEventListener('contextmenu',function(e){e.preventDefault();});}
hold(bAtk,function(){atkBtn=true;I.atk=true;},function(){atkBtn=false;});
hold(bJump,function(){jumpBtn=true;I.jump=true;},function(){jumpBtn=false;});
hold(bSkill,function(){I.skill=true;});
hold(bUlt,function(){I.ult=true;});
hold(bRun,function(){runToggle=!runToggle;bRun.setAttribute('aria-pressed',String(runToggle));});
function readInput(){
  let mx=stick.x,mz=-stick.y;
  if(keys.KeyW||keys.ArrowUp)mz+=1;if(keys.KeyS||keys.ArrowDown)mz-=1;if(keys.KeyD||keys.ArrowRight)mx+=1;if(keys.KeyA||keys.ArrowLeft)mx-=1;
  I.mx=mx;I.mz=mz;I.run=!!(keys.ShiftLeft||keys.ShiftRight||runToggle);I.jumpHeld=!!(keys.Space||jumpBtn);
  if(keys.KeyJ||atkBtn||atkMouse)I.atk=true;
}

/* ===== 菜单 ===== */
function applyQuality(){const q=QUALITY[qIdx];renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,q.pr));sunL.castShadow=q.shadow;grassRebuild();resize();
  $('mQuality').textContent='画质：'+q.name;}
function releaseKeys(){for(const k in keys)keys[k]=false;atkMouse=false;if(document.exitPointerLock&&locked){try{document.exitPointerLock();}catch(_){}}}
function toggleMenu(force){
  if(!started||!$('bigmap').hidden||!$('ending').hidden||!$('party').hidden)return;paused=force===true?true:!paused;$('menu').hidden=!paused;
  if(paused){buildPanes();$('sVol').value=Math.round(AU.vol*100);$('sSens').value=Math.round(SENS*100);$('mInvert').textContent='视角上下：'+(INVY<0?'反转':'正常');releaseKeys();saveGame();}
  else canvas.focus();
}
function toggleMap(force){
  if(!started||!$('menu').hidden||!$('ending').hidden||!$('party').hidden)return;const open=force===undefined?$('bigmap').hidden:force;
  $('bigmap').hidden=!open;paused=open;if(open){drawBigMap();releaseKeys();}else canvas.focus();
}
function toggleParty(open){
  if(!started||!$('menu').hidden||!$('ending').hidden||!$('bigmap').hidden||H.dead)return;if(open===undefined)open=$('party').hidden;
  $('party').hidden=!open;paused=open;if(open){buildParty();releaseKeys();}else canvas.focus();
}
function pickHero(i){toggleParty(false);switchHero(i);}
$('bSwap').addEventListener('click',function(){toggleParty();});
$('card').addEventListener('click',function(){toggleParty(true);});
$('ptClose').addEventListener('click',function(){toggleParty(false);});
function closeEnding(){$('ending').hidden=true;paused=false;canvas.focus();}
$('menuBtn').addEventListener('click',function(){toggleMenu();});
$('mapBtn').addEventListener('click',function(){toggleMap();});
$('mapWrap').addEventListener('click',function(){toggleMap();});
$('bmClose').addEventListener('click',function(){toggleMap(false);});
$('eClose').addEventListener('click',closeEnding);
$('mClose').addEventListener('click',function(){toggleMenu();});
Array.prototype.forEach.call(document.querySelectorAll('#menu .tabs button'),function(b){b.addEventListener('click',function(){
  Array.prototype.forEach.call(document.querySelectorAll('#menu .tabs button'),function(o){const on=o===b;o.setAttribute('aria-selected',String(on));$(o.getAttribute('data-tab')).hidden=!on;});});});
$('mSound').addEventListener('click',function(){setSound(!AU.on);saveGame();});
$('sVol').addEventListener('input',function(){AU.vol=clamp(this.value/100,0,1);if(AU.vol>0&&!AU.on)setSound(true);else setSound(AU.on);});
$('sSens').addEventListener('input',function(){SENS=clamp(this.value/100,0.4,2);});
$('mInvert').addEventListener('click',function(){INVY=-INVY;this.textContent='视角上下：'+(INVY<0?'反转':'正常');});
$('mFull').addEventListener('click',function(){const d=document,el=d.documentElement;
  try{if(d.fullscreenElement||d.webkitFullscreenElement){(d.exitFullscreen||d.webkitExitFullscreen).call(d);}else{const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el);if(r&&r.catch)r.catch(function(){});}}catch(_){toast('这个浏览器不支持全屏');}});
$('mQuality').addEventListener('click',function(){qIdx=(qIdx+1)%QUALITY.length;qManual=true;applyQuality();});
let resetArm=false;
$('mReset').addEventListener('click',function(){
  if(!resetArm){resetArm=true;$('mReset').textContent='再点一次，清空存档重新开始';return;}
  try{localStorage.removeItem(SAVE_KEY);}catch(e){}started=false;location.reload();
});
canvas.addEventListener('webglcontextlost',function(e){e.preventDefault();toast('画面中断了，正在恢复…');});

/* ===== 主循环 ===== */
const camT=new V3(H.p.x,H.p.y+1.5,H.p.z);
function resize(){const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;
  /* 标题画面把画面整体上移一些，让三位旅人站在标题上方 */
  if(cam.setViewOffset){if(started)cam.clearViewOffset();else cam.setViewOffset(w,h,0,Math.round(h*0.3),w,h);}
  cam.updateProjectionMatrix();
  ptU.uScale.value=canvas.height/(2*Math.tan(58*Math.PI/360));}
addEventListener('resize',resize);
function updateCamera(dt){
  const k=1-Math.exp(-dt*9);camT.x+=(H.p.x-camT.x)*k;camT.y+=(H.p.y+1.5-camT.y)*k;camT.z+=(H.p.z-camT.z)*k;
  const wantFov=58+(H.running?5:0)+(H.dashT>0?12:0)+(H.glide?5:0);
  if(Math.abs(wantFov-cam.fov)>0.05){cam.fov+=(wantFov-cam.fov)*Math.min(1,dt*6);cam.updateProjectionMatrix();}
  const cp=Math.cos(camPitch),ox=Math.sin(camYaw)*cp,oy=Math.sin(camPitch),oz=Math.cos(camYaw)*cp,want=started?camDist:7.4;
  let dd=want;
  for(let i=1;i<=8;i++){const f=i/8*want;if(groundH(camT.x+ox*f,camT.z+oz*f)+0.4>camT.y+oy*f){dd=Math.max(2.6,f-want/8);break;}}
  camCur+=(dd-camCur)*Math.min(1,dt*(dd<camCur?14:3));
  cam.position.set(camT.x+ox*camCur,camT.y+oy*camCur,camT.z+oz*camCur);
  const minY=Math.max(groundH(cam.position.x,cam.position.z),WATER)+0.7;if(cam.position.y<minY)cam.position.y=minY;
  if(shake>0){shake=Math.max(0,shake-dt*1.6);const s=shake*shake*1.3;cam.position.x+=(Math.random()-0.5)*s;cam.position.y+=(Math.random()-0.5)*s;cam.position.z+=(Math.random()-0.5)*s;}
  cam.lookAt(camT);sky.position.copy(cam.position);
}
let last=performance.now(),gT=0,hudT=0,regName='',regT=0,saveT=0,fpsT=0,fpsN=0,lowN=0,amMode=3,amFade=0;
function frame(now){
  requestAnimationFrame(frame);
  let dt=(now-last)/1000;last=now;if(document.hidden||dt<=0)return;dt=Math.min(dt,0.05);
  if(freezeT>0&&!paused){freezeT-=dt;dt*=0.06;}
  if(!paused){try{
    gT+=dt;windU.uTime.value=gT;
    readInput();
    if(started)updateHero(dt,gT);else{camYaw=0.9+(reduced?0:Math.sin(gT*0.13)*0.3);camPitch=0.14;}
    animHero(dt,gT);updateEnemies(dt,gT);updateShots(dt);updateObjects(dt,gT);updateParticles(dt);updateFx(dt);updateFx2(dt);
    updateSky(dt,started);
    grassUpdate(H.p.x,H.p.z);windU.uHero.value.copy(H.p);
    tv.copy(DN.dir);tv.y=Math.max(tv.y,0.28);tv.normalize();
    const lx2=Math.round(H.p.x/8)*8,ly2=Math.round(H.p.y/8)*8,lz2=Math.round(H.p.z/8)*8;
    sunL.target.position.set(lx2,ly2,lz2);sunL.position.set(lx2+tv.x*190,ly2+tv.y*190,lz2+tv.z*190);
    updateCamera(dt);
    let mode=3,str=0.7*DN.day;
    if(H.p.y>44&&mtn(H.p.x,H.p.z)>0.3){mode=0;str=1;}else if(DN.night>0.5){mode=2;str=DN.night;}else if(lake(H.p.x,H.p.z)>0.18){mode=1;str=0.9;}
    if(mode!==amMode){amMode=mode;amFade=0;}amFade=Math.min(1,amFade+dt*0.6);
    updateAmbient(dt,gT,cam.position.x,H.p.y,cam.position.z,amMode,str*amFade);
    hudFrame(dt);audioTick(dt);
    hudT-=dt;
    if(hudT<=0){hudT=0.12;drawMap();elClock.textContent=(DN.night>0.5?'☾ ':'☀ ')+clockText();
      const rg=regionOf();if(rg[0]!==regName){regT+=0.12;if(regT>0.8){regName=rg[0];regT=0;elRegion.textContent=rg[0];if(started)banner(rg[0],rg[1]);}}else regT=0;}
    if(started){saveT+=dt;if(saveT>12){saveT=0;saveGame();}
      fpsT+=dt;fpsN++;if(fpsT>3){const fps=fpsN/fpsT;fpsT=0;fpsN=0;
        if(fps<26&&qIdx>0&&!qManual){lowN++;if(lowN>=2){lowN=0;qIdx--;applyQuality();toast('画面有点吃力，已自动调低画质');}}else lowN=0;}}
  }catch(err){if(!frame.bad){frame.bad=1;console.error(err);}}}
  renderer.render(scene,cam);
}

/* ===== 启动 ===== */
let saveData=null;
try{saveData=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){saveData=null;}
if(saveData&&saveData.v!==2)saveData=null;
function begin(){
  started=true;H.face=camYaw+Math.PI;camPitch=0.2;$('title').hidden=true;document.body.classList.add('playing');audioInit();if(AU.ctx&&AU.ctx.resume){try{AU.ctx.resume();}catch(e){}}
  resize();setSound(AU.on);canvas.focus();heroes.forEach(function(m,i){m.root.visible=i===H.ci;});hudHearts();hudTrack();hudChars();camT.set(H.p.x,H.p.y+1.5,H.p.z);regName='';
  if(coarse&&innerHeight>innerWidth)setTimeout(function(){toast('把手机横过来，视野更开阔');},900);
  setTimeout(function(){hint('goal','目标：点亮四座风塔。远处那几道光柱就是');},2500);
  setTimeout(function(){$('keys').classList.add('gone');},16000);
}
/* 标题画面：三位旅人站成一排 */
function titlePose(){H.face=0.9;const rx=Math.cos(H.face),rz=-Math.sin(H.face);
  [1,2].forEach(function(i){const m=heroes[i],s=i===1?1.5:-1.5,x=H.p.x+rx*s,z=H.p.z+rz*s;m.root.position.set(x,groundH(x,z),z);m.root.rotation.y=H.face;m.root.visible=true;});}
makePortraits();hudPortraits();
$('go').disabled=false;$('go').textContent=saveData?'继续旅程':'开始旅程';document.body.classList.remove('booting');
if(saveData){$('fresh').hidden=false;
  $('saveInfo').textContent='上次的旅程：风塔 '+(saveData.tw||[]).length+'/4 · 星辉 '+(saveData.sh||[]).length+' · 宝箱 '+(saveData.ch||[]).length;}
$('go').addEventListener('click',function(){if(saveData)loadGame(saveData);begin();});
$('fresh').addEventListener('click',function(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}saveData=null;begin();});
document.addEventListener('visibilitychange',function(){if(document.hidden){saveGame();if(AU.ctx&&AU.ctx.suspend)try{AU.ctx.suspend();}catch(e){}}else if(AU.ctx&&AU.ctx.resume&&started)try{AU.ctx.resume();}catch(e){}});
applyQuality();updateSky(0,false);hudHearts();hudTrack();hudChars();grassUpdate(H.p.x,H.p.z);titlePose();
if(saved&&saved.v===2&&saved.started){loadGame(saved);begin();}
if(window.claude&&window.claude.hot&&window.claude.hot.snapshot)window.claude.hot.snapshot(snapshot);
function setCam(y,p,d){camYaw=y;camPitch=p;camDist=d;camCur=d;}
requestAnimationFrame(frame);
