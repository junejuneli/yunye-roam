/* ===== 界面 ===== */
const elHearts=$('hearts'),elStam=$('stam'),elTrack=$('track'),elToasts=$('toasts'),elBanner=$('banner'),elClock=$('clock'),elRegion=$('region'),
  bAtk=$('bAtk'),bSkill=$('bSkill'),bJump=$('bJump'),bRun=$('bRun'),elChars=$('chars');
function hudHearts(){let s='';const n=H.maxHp/2;for(let i=0;i<n;i++){const v=H.hp-i*2;s+='<i class="'+(v>=2?'f':(v>=1?'h':'e'))+'"></i>';}elHearts.innerHTML=s;}
function hudTrack(pop){
  elTrack.innerHTML='<span>风塔 <b>'+S.towersLit+'</b>/'+TOWERS.length+'</span><span>星辉 <b>'+S.shards+'</b>/'+shards.length+'</span><span>宝箱 <b>'+S.chestsOpen+'</b>/'+chests.length+'</span>';
  if(pop){elTrack.classList.remove('pop');void elTrack.offsetWidth;elTrack.classList.add('pop');}
}
function toast(msg,isHint){
  const d=document.createElement('div');d.className='toast'+(isHint?' hint':'');d.textContent=msg;elToasts.appendChild(d);
  while(elToasts.children.length>3)elToasts.removeChild(elToasts.firstChild);
  setTimeout(function(){d.classList.add('out');setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d);},500);},isHint?6500:3400);
}
function banner(title,sub){elBanner.querySelector('h2').textContent=title;elBanner.querySelector('p').textContent=sub||'';
  elBanner.classList.remove('show');void elBanner.offsetWidth;elBanner.classList.add('show');}
function vignette(){const v=$('vig');v.classList.remove('hit');void v.offsetWidth;v.classList.add('hit');}
function fade(on){$('fade').classList.toggle('on',!!on);}
const charBtns=HEROES.map(function(d,i){
  const b=document.createElement('button');b.type='button';b.className='ch';b.style.setProperty('--hc',d.css);
  b.setAttribute('aria-label','切换到'+d.name+'（'+d.role+'）');
  b.innerHTML='<span class="g">'+d.glyph+'</span><kbd>'+(i+1)+'</kbd>';
  b.addEventListener('pointerdown',function(e){e.preventDefault();switchHero(i);});
  elChars.appendChild(b);return b;});
function hudChars(){
  const d=HEROES[H.ci];
  charBtns.forEach(function(b,i){b.classList.toggle('on',i===H.ci);b.setAttribute('aria-pressed',String(i===H.ci));});
  bSkill.querySelector('.g').textContent=d.sg;bSkill.style.setProperty('--hc',d.css);bSkill.setAttribute('aria-label','技能：'+d.skill);
  $('who').innerHTML='<b>'+d.name+'</b> · '+d.role+' · '+d.skill;
}
let hudLast={st:'',cd:'',low:null,frost:null};
function hudFrame(){
  const r=H.st/H.maxSt,st=r>=0.995?'full':(r*100).toFixed(0);
  if(st!==hudLast.st){hudLast.st=st;elStam.style.opacity=st==='full'?'0':'1';if(st!=='full')elStam.style.setProperty('--p',st+'%');}
  if(H.stLock!==hudLast.low){hudLast.low=H.stLock;elStam.classList.toggle('low',H.stLock);}
  const cd=(H.cds[H.ci]/HEROES[H.ci].cd).toFixed(2);
  if(cd!==hudLast.cd){hudLast.cd=cd;bSkill.style.setProperty('--cd',cd);bSkill.classList.toggle('ready',cd==='0.00');}
  const fr=H.frost>0;if(fr!==hudLast.frost){hudLast.frost=fr;document.body.classList.toggle('frost',fr);}
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
function drawMap(){
  const W=mapC.width,RV=125,sc=W/(2*RV),c=mctx,px=H.p.x,pz=H.p.z;
  c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(W/2,W/2,W/2,0,TAU);c.clip();
  c.fillStyle='#2f6fa8';c.fillRect(0,0,W,W);
  c.save();c.translate(W/2,W/2);c.scale(sc*SIZE/256,sc*SIZE/256);c.drawImage(mapImg,-(px+HALF)/SIZE*256,-(pz+HALF)/SIZE*256);c.restore();
  function at(x,z,edge){let dx=(x-px)*sc,dz=(z-pz)*sc;const d=Math.hypot(dx,dz),lim=W/2-10;if(d>lim){if(!edge)return null;dx*=lim/d;dz*=lim/d;}return [W/2+dx,W/2+dz];}
  for(let i=0;i<shards.length;i++){const s=shards[i];if(s.got||!revealed(s.x,s.z))continue;const q=at(s.x,s.z);if(!q)continue;c.fillStyle='#fff3a0';c.beginPath();c.arc(q[0],q[1],2.6,0,TAU);c.fill();}
  for(let i=0;i<chests.length;i++){const s=chests[i];if(s.open||s.hidden||!revealed(s.x,s.z))continue;const q=at(s.x,s.z);if(!q)continue;c.fillStyle='#ffb84a';c.strokeStyle='#5a3a10';c.lineWidth=1.5;c.fillRect(q[0]-4,q[1]-3.5,8,7);c.strokeRect(q[0]-4,q[1]-3.5,8,7);}
  for(let i=0;i<TOWERS.length;i++){const t=TOWERS[i],q=at(t.x,t.z,true);c.save();c.translate(q[0],q[1]);c.rotate(Math.PI/4);
    c.fillStyle=t.lit?'#74f2ff':'#ffa64d';c.strokeStyle='rgba(20,30,40,.85)';c.lineWidth=2.5;c.fillRect(-6,-6,12,12);c.strokeRect(-6,-6,12,12);c.restore();}
  c.save();c.translate(W/2,W/2);c.rotate(Math.PI-H.face);c.fillStyle='#fff';c.strokeStyle='rgba(20,30,40,.9)';c.lineWidth=2.5;
  c.beginPath();c.moveTo(0,-11);c.lineTo(8,8);c.lineTo(0,4);c.lineTo(-8,8);c.closePath();c.fill();c.stroke();c.restore();
  c.restore();
}
