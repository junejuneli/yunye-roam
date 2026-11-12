/* ===== 界面 ===== */
const elHearts=$('hearts'),elStam=$('stam'),elTrack=$('track'),elToasts=$('toasts'),elBanner=$('banner'),elClock=$('clock'),elRegion=$('region'),
  bAtk=$('bAtk'),bSkill=$('bSkill'),bUlt=$('bUlt'),bJump=$('bJump'),bRun=$('bRun'),elChars=$('chars'),elFloats=$('floats'),elQuest=$('quest'),elMark=$('mark'),
  elBoss=$('boss'),elBuffs=$('buffs'),elCombo=$('combo'),elCut=$('cut');
const HDESC=[
  {atk:'三段连斩，第三段是重击。',skill:'突进伤敌，撞碎有裂纹的岩石，破开石甲。',ult:'原地回旋三斩，范围很大，同样能破甲、碎冰。'},
  {atk:'远程风刃。可以二段跳，空中按住跳跃滑翔。',skill:'把自己送上高空，掀飞周围的敌人，吹落风蝠。',ult:'召来一股龙卷，把敌人卷到一起；滑翔进去还能被托上高空。'},
  {atk:'自动追敌的冰锥，命中会短暂冻结。',skill:'冻住周围敌人，之后 12 秒踏水成冰。',ult:'降下一片暴雪，持续冻结范围内的敌人，水面也会结冰。'}];
/* 头像：把模型单独渲染一张小图 */
function snapModel(root,cp,look,fov,ry){
  try{
    if(!THREE.WebGLRenderTarget||!renderer.readRenderTargetPixels)return '';
    const N=192,rt=new THREE.WebGLRenderTarget(N,N),sc=new THREE.Scene(),pc=new THREE.PerspectiveCamera(fov||26,1,0.1,60);
    sc.add(new THREE.HemisphereLight(0xffffff,0xd0c0b0,0.98));const dl=new THREE.DirectionalLight(0xffffff,0.5);dl.position.set(2,3,4);sc.add(dl);
    const par=root.parent,pos=root.position.clone(),oy=root.rotation.y,vis=root.visible;
    sc.add(root);root.position.set(0,0,0);root.rotation.y=ry===undefined?0.32:ry;root.visible=true;
    pc.position.set(cp[0],cp[1],cp[2]);pc.lookAt(look[0],look[1],look[2]);
    renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(sc,pc);
    const buf=new Uint8Array(N*N*4);renderer.readRenderTargetPixels(rt,0,0,N,N,buf);renderer.setRenderTarget(null);
    sc.remove(root);if(par)par.add(root);root.position.copy(pos);root.rotation.y=oy;root.visible=vis;
    const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),im=x.createImageData(N,N);
    for(let j=0;j<N;j++)im.data.set(buf.subarray((N-1-j)*N*4,(N-j)*N*4),j*N*4);
    x.putImageData(im,0,0);rt.dispose();return cv.toDataURL('image/png');
  }catch(e){try{renderer.setRenderTarget(null);}catch(_){}return '';}
}
const PORT=['','',''],EPORT={};
function ptHTML(src,glyph){return '<span class="g">'+glyph+'</span>'+(src?'<img alt="" src="'+src+'">':'');}
function setPt(el,src,glyph){el.innerHTML=ptHTML(src,glyph);}
function makePortraits(){
  heroes.forEach(function(m,i){m.root.scale.set(1,1,1);PORT[i]=snapModel(m.root,[0.42,1.62,2.75],[0,i===2?1.56:1.47,0],i===2?27:23);});
  const mk={slime:function(){return buildSlime(1,0x7ddc6a,'grass');},aqua:function(){return buildSlime(1,0x5ab8ee,'water');},ember:function(){return buildSlime(1,0xf0603a,'ember');},
    bat:function(){const b=buildBat();b.wL.rotation.z=0.3;b.wR.rotation.z=-0.3;return b;},wisp:buildWisp,golem:function(){return buildGolem(1,false);},king:function(){return buildSlime(1,0xffa53d,'king');},boss:function(){return buildGolem(1,true);}};
  const camOf={slime:[[0.6,1.0,3.7],[0,0.68,0]],aqua:[[0.6,1.0,3.7],[0,0.72,0]],ember:[[0.6,1.1,4.1],[0,0.8,0]],bat:[[0.3,0.25,3.6],[0,0.04,0]],wisp:[[0.3,0.1,3.4],[0,-0.14,0]],
    golem:[[1.2,2.3,8.6],[0,1.5,0]],king:[[0.6,1.1,4.3],[0,0.82,0]],boss:[[1.2,2.5,9.4],[0,1.65,0]]};
  for(const k in mk){const m=mk[k]();EPORT[k]=snapModel(m.g,camOf[k][0],camOf[k][1],26,0.25);}
}
function hudHearts(){let s='';const n=H.maxHp/2;for(let i=0;i<n;i++){const v=H.hp-i*2;s+='<i class="'+(v>=2?'f':(v>=1?'h':'e'))+'"></i>';}elHearts.innerHTML=s;
  document.body.classList.toggle('lowhp',started&&!H.dead&&H.hp<=2);}
function hudTrack(pop){
  elTrack.innerHTML='<span><i style="--ic:#74f2ff"></i>风塔 <b>'+S.towersLit+'</b>/'+TOWERS.length+'</span><span><i style="--ic:#fff3a0"></i>星辉 <b>'+S.shards+'</b>/'+shards.length+'</span><span><i style="--ic:#ffb84a"></i>宝箱 <b>'+S.chestsOpen+'</b>/'+chests.length+'</span>';
  if(pop){elTrack.classList.remove('pop');void elTrack.offsetWidth;elTrack.classList.add('pop');}
}
function toast(msg,isHint){
  const d=document.createElement('div');d.className='toast'+(isHint?' hint':'');d.textContent=msg;elToasts.appendChild(d);
  while(elToasts.children.length>3)elToasts.removeChild(elToasts.firstChild);
  setTimeout(function(){d.classList.add('out');setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},500);},isHint?7000:3400);
}
function banner(title,sub){elBanner.querySelector('h2').textContent=title;elBanner.querySelector('p').textContent=sub||'';
  elBanner.classList.remove('show');void elBanner.offsetWidth;elBanner.classList.add('show');}
function vignette(){const v=$('vig');v.classList.remove('hit');void v.offsetWidth;v.classList.add('hit');elHearts.classList.remove('hit');void elHearts.offsetWidth;elHearts.classList.add('hit');}
function fade(on){$('fade').classList.toggle('on',!!on);}
/* 飘字：伤害数字和联动提示 */
function floatText(x,y,z,txt,cls){
  if(!tv.project||!started)return;
  tv.set(x,y,z).project(cam);if(tv.z>1||Math.abs(tv.x)>1.1||Math.abs(tv.y)>1.1)return;
  const d=document.createElement('div');d.className='ft'+(cls?' '+cls:'');d.textContent=txt;
  d.style.left=((tv.x*0.5+0.5)*innerWidth+(Math.random()-0.5)*26).toFixed(0)+'px';d.style.top=((0.5-tv.y*0.5)*innerHeight+(Math.random()-0.5)*14).toFixed(0)+'px';
  elFloats.appendChild(d);while(elFloats.children.length>26)elFloats.removeChild(elFloats.firstChild);
  setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},880);
}
function hudCombo(){const n=S.hits;if(n>=3){elCombo.querySelector('b').textContent=n;elCombo.classList.add('on');elCombo.classList.remove('bump');void elCombo.offsetWidth;elCombo.classList.add('bump');}else elCombo.classList.remove('on');}
function hudDeny(){bSkill.classList.remove('deny');void bSkill.offsetWidth;bSkill.classList.add('deny');}
function ultCut(i){const d=HEROES[i];elCut.style.setProperty('--hc',d.css);setPt(elCut.querySelector('.pt'),PORT[i],d.glyph);
  elCut.querySelector('b').textContent=d.ult;elCut.querySelector('span').textContent=d.name+' · 大招';elCut.classList.remove('show');void elCut.offsetWidth;elCut.classList.add('show');}
const charBtns=HEROES.map(function(d,i){
  const b=document.createElement('button');b.type='button';b.className='ch';b.style.setProperty('--hc',d.css);
  b.setAttribute('aria-label','切换到'+d.name+'（'+d.role+'）');
  b.innerHTML='<span class="pt">'+ptHTML('',d.glyph)+'</span><kbd>'+(i+1)+'</kbd>';
  b.addEventListener('pointerdown',function(e){e.preventDefault();switchHero(i);});
  elChars.appendChild(b);return b;});
function hudPortraits(){charBtns.forEach(function(b,i){setPt(b.querySelector('.pt'),PORT[i],HEROES[i].glyph);});hudChars();}
function hudChars(){
  const d=HEROES[H.ci];
  charBtns.forEach(function(b,i){b.classList.toggle('on',i===H.ci);b.setAttribute('aria-pressed',String(i===H.ci));});
  bSkill.querySelector('.g').textContent=d.sg;bSkill.style.setProperty('--hc',d.css);bSkill.setAttribute('aria-label','技能：'+d.skill);
  bUlt.querySelector('.g').textContent=d.ug;bUlt.style.setProperty('--hc',d.css);bUlt.setAttribute('aria-label','大招：'+d.ult);
  $('card').style.setProperty('--hc',d.css);setPt($('pt'),PORT[H.ci],d.glyph);
  $('who').innerHTML='<b>'+d.name+'</b><span>'+d.role+'</span>';
}
let hudLast={st:'',cd:'',low:null,frost:null,en:'',buff:'',quest:'',boss:'',cn:''},questT=0;
function questTarget(){let best=null,bd=1e9;for(let i=0;i<TOWERS.length;i++){const t=TOWERS[i];if(t.lit)continue;const d=Math.hypot(t.x-H.p.x,t.z-H.p.z);if(d<bd){bd=d;best=t;}}return best;}
function questTip(t){
  if(t.kind==='mesa')return '塔在石台顶上。用青岚乘旁边的上升气流';
  if(t.kind==='islet')return '塔在湖心小岛。用霜月的「霜华」踏冰过去';
  if(t.kind==='sealed')return t.sealed?'塔被裂岩封住了。用赤羽的「冲刺斩」撞开':'封印已解，走近把它点亮';
  return t.sealed?'塔在雪山之巅，被寒冰封着。先打倒霜卫':'冰化开了，走近把它点亮';}
function hudFrame(dt){
  const r=H.st/H.maxSt,st=r>=0.995?'full':(r*100).toFixed(0);
  if(st!==hudLast.st){hudLast.st=st;elStam.style.opacity=st==='full'?'0':'1';if(st!=='full')elStam.style.setProperty('--p',st+'%');}
  if(H.stLock!==hudLast.low){hudLast.low=H.stLock;elStam.classList.toggle('low',H.stLock);}
  let cds='';for(let i=0;i<3;i++)cds+=(H.cds[i]/HEROES[i].cd).toFixed(2)+',';
  if(cds!==hudLast.cd){hudLast.cd=cds;const q=cds.split(',');for(let i=0;i<3;i++)charBtns[i].style.setProperty('--cd',i===H.ci?'0':q[i]);
    bSkill.style.setProperty('--cd',q[H.ci]);const rdy=q[H.ci]==='0.00';bSkill.classList.toggle('ready',rdy);bSkill.classList.toggle('cool',!rdy);}
  const cn=H.cds[H.ci]>0?String(Math.ceil(H.cds[H.ci])):'';if(cn!==hudLast.cn){hudLast.cn=cn;bSkill.querySelector('.n').textContent=cn;}
  const en=(H.en/100).toFixed(2);if(en!==hudLast.en){hudLast.en=en;bUlt.style.setProperty('--en',en);bUlt.classList.toggle('full',H.en>=100);}
  const fr=H.frost>0;if(fr!==hudLast.frost){hudLast.frost=fr;document.body.classList.toggle('frost',fr);}
  let bf='';if(H.relay>0)bf+='<span style="--bc:#ffd166">接力 '+Math.ceil(H.relay)+'</span>';if(H.frost>0)bf+='<span style="--bc:#9fe8ff">踏冰 '+Math.ceil(H.frost)+'</span>';
  if(bf!==hudLast.buff){hudLast.buff=bf;elBuffs.innerHTML=bf;}
  /* 首领血条 */
  let bs='';const b=bossE;
  if(b&&b.alive&&started&&!H.dead&&Math.hypot(b.p.x-H.p.x,b.p.z-H.p.z)<34)bs=(b.hp/b.maxHp).toFixed(3)+(b.armor?'a':(b.stun>0?'s':'n'));
  if(bs!==hudLast.boss){hudLast.boss=bs;elBoss.hidden=!bs;
    if(bs){elBoss.querySelector('.bn').textContent=b.D.name;$('bossFill').style.transform='scaleX('+Math.max(0,b.hp/b.maxHp)+')';elBoss.classList.toggle('armor',b.armor);
      elBoss.querySelector('.bs').textContent=b.armor?'冰甲完好 · 用「冲刺斩」破甲':(b.stun>0?'破甲！趁现在':'冰甲碎裂');}}
  /* 目标 */
  questT-=dt;
  if(questT<=0){questT=0.2;const t=started?questTarget():null;let q='';
    if(t){const d=Math.hypot(t.x-H.p.x,t.z-H.p.z);q='<div><b>'+t.name+'</b><em>'+Math.round(d)+' 米</em><small>'+questTip(t)+'</small></div>';}
    else if(S.done)q='<div><b>自由漫游</b><small>还有 '+(shards.length-S.shards)+' 枚星辉、'+(chests.length-S.chestsOpen)+' 只宝箱等着被找到</small></div>';
    if(q!==hudLast.quest){hudLast.quest=q;elQuest.innerHTML=q;elQuest.hidden=!q;}
    hudLast.qt=t;}
  const qt=hudLast.qt;
  if(qt&&tv.project&&started){const d=Math.hypot(qt.x-H.p.x,qt.z-H.p.z);
    if(d<26){elMark.hidden=true;}else{tv.set(qt.x,qt.y+10,qt.z).project(cam);let sx=tv.x,sy=tv.y;if(tv.z>1){sx=-sx;sy=-1;}
      const mx=1-70/innerWidth*2,my=sy>0?1-210/innerHeight*2:1-230/innerHeight*2,k=Math.max(Math.abs(sx)/mx,Math.abs(sy)/Math.max(0.1,my),1);sx/=k;sy/=k;
      elMark.hidden=false;elMark.style.transform='translate('+((sx*0.5+0.5)*innerWidth).toFixed(1)+'px,'+((0.5-sy*0.5)*innerHeight).toFixed(1)+'px)';
      const tx=Math.round(d)+'米';if(elMark.lastChild.textContent!==tx)elMark.lastChild.textContent=tx;}}
  else if(!elMark.hidden)elMark.hidden=true;
}

/* 小地图 */
const mapImg=document.createElement('canvas');mapImg.width=mapImg.height=256;
(function(){const x=mapImg.getContext('2d'),im=x.createImageData(256,256),d=im.data,deep=C(0x2f6fa8),shal=C(0x66bfd6);
  for(let j=0;j<256;j++)for(let i=0;i<256;i++){const wx=-HALF+(i+0.5)/256*SIZE,wz=-HALF+(j+0.5)/256*SIZE,h=groundH(wx,wz),k=(j*256+i)*4;
    if(h<0)tc.copy(shal).lerp(deep,sstep(0,5,-h));
    else{const sl=slopeAt(wx,wz);groundColor(wx,wz,h,1/Math.sqrt(1+sl*sl),tc);tc.multiplyScalar(clamp(0.94+(groundH(wx-3,wz-3)-h)*0.07,0.7,1.15));}
    d[k]=Math.min(255,tc.r*255);d[k+1]=Math.min(255,tc.g*255);d[k+2]=Math.min(255,tc.b*255);d[k+3]=255;}
  x.putImageData(im,0,0);})();
const mapC=$('map'),mctx=mapC.getContext('2d');
function revealed(x,z){for(let i=0;i<TOWERS.length;i++){const t=TOWERS[i];if(t.lit&&Math.hypot(t.x-x,t.z-z)<240)return true;}return false;}
function mapDiamond(c,x,y,s,lit){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle=lit?'#74f2ff':'#ffa64d';c.strokeStyle='rgba(20,30,40,.85)';c.lineWidth=2.5;c.fillRect(-s,-s,s*2,s*2);c.strokeRect(-s,-s,s*2,s*2);c.restore();}
function mapArrow(c,x,y,s){c.save();c.translate(x,y);c.rotate(Math.PI-H.face);c.fillStyle='#fff';c.strokeStyle='rgba(20,30,40,.9)';c.lineWidth=2.5;
  c.beginPath();c.moveTo(0,-11*s);c.lineTo(8*s,8*s);c.lineTo(0,4*s);c.lineTo(-8*s,8*s);c.closePath();c.fill();c.stroke();c.restore();}
function drawMap(){
  const W=mapC.width,RV=125,sc=W/(2*RV),c=mctx,px=H.p.x,pz=H.p.z;
  c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(W/2,W/2,W/2,0,TAU);c.clip();
  c.fillStyle='#2f6fa8';c.fillRect(0,0,W,W);
  c.save();c.translate(W/2,W/2);c.scale(sc*SIZE/256,sc*SIZE/256);c.drawImage(mapImg,-(px+HALF)/SIZE*256,-(pz+HALF)/SIZE*256);c.restore();
  function at(x,z,edge){let dx=(x-px)*sc,dz=(z-pz)*sc;const d=Math.hypot(dx,dz),lim=W/2-10;if(d>lim){if(!edge)return null;dx*=lim/d;dz*=lim/d;}return [W/2+dx,W/2+dz];}
  for(let i=0;i<shards.length;i++){const s=shards[i];if(s.got||!revealed(s.x,s.z))continue;const q=at(s.x,s.z);if(!q)continue;c.fillStyle='#fff3a0';c.beginPath();c.arc(q[0],q[1],2.6,0,TAU);c.fill();}
  for(let i=0;i<chests.length;i++){const s=chests[i];if(s.open||s.hidden||!revealed(s.x,s.z))continue;const q=at(s.x,s.z);if(!q)continue;c.fillStyle='#ffb84a';c.strokeStyle='#5a3a10';c.lineWidth=1.5;c.fillRect(q[0]-4,q[1]-3.5,8,7);c.strokeRect(q[0]-4,q[1]-3.5,8,7);}
  c.fillStyle='#ff5a6e';c.strokeStyle='rgba(40,10,16,.8)';c.lineWidth=1;
  for(let i=0;i<enemies.length;i++){const e=enemies[i];if(!e.alive||Math.abs(e.p.x-px)>60||Math.abs(e.p.z-pz)>60)continue;const q=at(e.p.x,e.p.z);if(!q)continue;c.beginPath();c.arc(q[0],q[1],e.heavy?4.2:2.6,0,TAU);c.fill();c.stroke();}
  for(let i=0;i<TOWERS.length;i++){const t=TOWERS[i],q=at(t.x,t.z,true);mapDiamond(c,q[0],q[1],6,t.lit);}
  mapArrow(c,W/2,W/2,1);
  c.restore();
}
/* 大地图 */
const bmC=$('bm'),bmx=bmC.getContext('2d');
function drawBigMap(){
  const W=bmC.width,c=bmx,k=W/SIZE;c.imageSmoothingEnabled=true;c.drawImage(mapImg,0,0,W,W);
  const at=function(x,z){return [(x+HALF)*k,(z+HALF)*k];};
  for(let i=0;i<shards.length;i++){const s=shards[i];if(s.got||!revealed(s.x,s.z))continue;const q=at(s.x,s.z);c.fillStyle='#fff3a0';c.strokeStyle='rgba(60,50,10,.7)';c.lineWidth=1;c.beginPath();c.arc(q[0],q[1],3.4,0,TAU);c.fill();c.stroke();}
  for(let i=0;i<chests.length;i++){const s=chests[i];if(s.open||s.hidden||!revealed(s.x,s.z))continue;const q=at(s.x,s.z);c.fillStyle='#ffb84a';c.strokeStyle='#5a3a10';c.lineWidth=1.5;c.fillRect(q[0]-5,q[1]-4,10,8);c.strokeRect(q[0]-5,q[1]-4,10,8);}
  c.font='600 15px '+getComputedStyle(document.body).fontFamily;c.textAlign='center';c.lineJoin='round';
  for(let i=0;i<TOWERS.length;i++){const t=TOWERS[i],q=at(t.x,t.z);mapDiamond(c,q[0],q[1],8,t.lit);
    c.lineWidth=4;c.strokeStyle='rgba(10,24,30,.85)';c.strokeText(t.name,q[0],q[1]+28);c.fillStyle=t.lit?'#bff8ff':'#ffe2bd';c.fillText(t.name,q[0],q[1]+28);}
  const p=at(H.p.x,H.p.z);c.beginPath();c.arc(p[0],p[1],15,0,TAU);c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=2;c.stroke();mapArrow(c,p[0],p[1],1.2);
}
/* 菜单里的旅人与图鉴 */
function buildPanes(){
  let h='';HEROES.forEach(function(d,i){const x=HDESC[i];
    h+='<div class="hc" style="--hc:'+d.css+'"><span class="pt">'+ptHTML(PORT[i],d.glyph)+'</span><div><h3>'+d.name+'<span>'+d.role+' · 按 '+(i+1)+' 切换</span></h3>'+
      '<p><b>普攻</b>　'+x.atk+'<br><b>'+d.skill+'</b>　'+x.skill+'<br><b>'+d.ult+'</b>　'+x.ult+'</p></div></div>';});
  $('pHero').innerHTML=h;h='';
  for(const k in EDEF){const d=EDEF[k],seen=!!S.seen[k];
    h+='<div class="hc'+(seen?'':' unk')+'" style="--hc:#7d8f96"><span class="pt">'+ptHTML(EPORT[k],'？')+'</span><div><h3>'+(seen?d.name:'？？？')+'</h3><p>'+(seen?d.info+'<br><b>弱点</b>　'+d.weak:'还没有遇到过。')+'</p></div></div>';}
  $('pFoe').innerHTML=h;
}
function fmtTime(s){s=Math.floor(s);const m=Math.floor(s/60);return m+':'+(s%60<10?'0':'')+(s%60);}
function showEnding(){
  if(!started)return;$('eTime').textContent=fmtTime(S.time);$('eKill').textContent=S.kills;$('eShard').textContent=S.shards+'/'+shards.length;$('eChest').textContent=S.chestsOpen+'/'+chests.length;
  $('ending').hidden=false;paused=true;if(document.exitPointerLock){try{document.exitPointerLock();}catch(_){}}
}
