// 用真实 Three.js + 无头 Chromium 截图，检查画面用。
// 用法：python3 build.py dev && node tools/shot.js 场景脚本.js [宽] [高]
// 场景脚本导出 async (pg, shot) => {...}；shot(文件名) 存一张图，pg 是 Playwright 的 Page，页面里有 window.__g。
const {chromium}=require('playwright');const path=require('path');
(async()=>{
  const [scn,w,h]=process.argv.slice(2);const touch=process.env.TOUCH==='1';
  const b=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const pg=await b.newPage({viewport:{width:+w||1280,height:+h||720},deviceScaleFactor:1,hasTouch:touch,isMobile:touch});
  pg.on('pageerror',e=>console.log('PAGEERROR',e.message,(e.stack||'').split('\n').slice(1,3).join(' ')));
  pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('CONSOLE',m.text().slice(0,400));});
  await pg.goto('file://'+path.resolve(__dirname,'..',process.env.PAGE||'dev.html'));
  await pg.waitForFunction('!document.getElementById("go").disabled',null,{timeout:180000});
  const shot=async name=>{await pg.screenshot({path:name});console.log('shot',name);};
  await require(path.resolve(scn))(pg,shot);
  await b.close();
})();
