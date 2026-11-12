#!/usr/bin/env python3
"""把 src/ 里的源码合并成单个 index.html。
python3 build.py        生成 index.html（可直接打开或部署）
python3 build.py dev    生成 dev.html（真引擎 + 调试接口 window.__g，给 tools/shot.js 截图用）
python3 build.py test   生成 test.html（用 tools/mock_three.js 代替 Three.js，配合 tools/smoke_test.py 跑逻辑测试）
"""
import sys
SRC = 'src/'
PARTS = ['01_core', '02_engine', '03_world', '04_nature', '05_fx', '06_objects', '07_actors', '07b_props', '08_game', '09_hud', '10_main']
CDN = '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
mode = sys.argv[1] if len(sys.argv) > 1 else ''
test = mode == 'test'
dev = mode == 'dev'
head = open(SRC + 'head.html', encoding='utf-8').read()
js = '(function(){\n"use strict";\n' + open(SRC + '00_shaders.js', encoding='utf-8').read()
js += ("function fail(msg){const e=document.getElementById('err');if(msg)e.innerHTML=msg;e.hidden=false;}\n"
       "if(!window.THREE){fail();return;}\nfunction start(saved){\nsaved=saved||{};\n")
for p in PARTS:
    js += open(SRC + p + '.js', encoding='utf-8').read() + '\n'
if test or dev:
    js += ("window.__g={H,S,I,TOWERS,chests,shards,cracks,enemies,COLUMNS,ISLES,CAMPS,windify,groundH,DN,plats,heroes,"
           "switchHero,activateTower,finale,PEAK,ISLETS,SPAWN,renderer,scene,cam,snapshot,loadGame,toggleMenu,frame,QUALITY,"
           "groundColor,tGeo,skyU,waterU,updateSky,HG,hmTex,sunL,hemi,N1,CELL,HALF,SEG,"
           "setCam,hazards,EDEF,addEnemy,damageEnemy,bossE,TW,BZ,I,PORT,EPORT,ROCKSPOTS,toggleMap,TRIALS,props,toggleParty,spikes,showEnding,tryUlt,trySkill,animHero,get paused(){return paused;},set paused(v){paused=v;}};\n")
js += ("}\nfunction boot(d){try{start(d);}catch(e){console.error(e);fail('游戏启动时出了点问题：'+(e&&e.message||e)+'<br>请刷新页面，或换一个较新的浏览器再试。');}}\n"
       "const hot=window.claude&&window.claude.hot;\n"
       "document.body.classList.add('booting');\n"
       "/* 先让标题画出来，再开始生成世界 */\n"
       "requestAnimationFrame(function(){setTimeout(function(){if(hot&&hot.ready)hot.ready(boot);else boot((hot&&hot.data)||{});},30);});\n})();\n")
if not test:
    # 上线版把 Three.js 直接内联进页面：不依赖任何外部 CDN，离线也能玩
    three = open('vendor/three.min.js', encoding='utf-8').read().replace('</script', '<\\/script')
    head = head.replace(CDN, '<script>\n' + three + '\n</script>')
if test:
    head = head.replace(CDN, '<script src="tools/mock_three.js"></script><script>window.__TEST=1</script>')
cut = head.index('</style>') + len('</style>')
doc = ('<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
       + head[:cut] + '\n</head>\n<body>\n' + head[cut:] + '<script>\n' + js + '</script>\n</body>\n</html>\n')
out = 'test.html' if test else ('dev.html' if dev else 'index.html')
open(out, 'w', encoding='utf-8').write(doc)
print(out, len(doc), 'bytes')
