import asyncio,sys,json
from playwright.async_api import async_playwright
BASE=__import__('os').path.dirname(__import__('os').path.dirname(__import__('os').path.abspath(__file__)))+'/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required'])
        pg=await b.new_page(viewport={'width':1200,'height':720})
        errs=[]
        pg.on('pageerror',lambda e:errs.append('PAGEERROR '+str(e)))
        pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type in('error','warning') else None)
        await pg.goto('file://'+BASE+'test.html')
        await pg.wait_for_timeout(500)
        await pg.click('#go')
        await pg.wait_for_timeout(400)
        st=lambda: pg.evaluate('(()=>{const g=__g,H=g.H;return {p:[H.p.x.toFixed(1),H.p.y.toFixed(1),H.p.z.toFixed(1)],hp:H.hp,max:H.maxHp,st:Math.round(H.st),ci:H.ci,gr:H.grounded,sw:H.swim,gl:H.glide,S:{sh:g.S.shards,ch:g.S.chestsOpen,tw:g.S.towersLit},dead:H.dead,fr:H.frost.toFixed(1)}})()')
        print('start',await st())
        # walk + run + jump
        await pg.keyboard.down('KeyW');await pg.keyboard.down('ShiftLeft');await pg.wait_for_timeout(1500)
        await pg.keyboard.press('Space');await pg.wait_for_timeout(700)
        await pg.keyboard.up('KeyW');await pg.keyboard.up('ShiftLeft')
        print('walked',await st())
        # attacks for each hero near an enemy
        await pg.evaluate('(()=>{const g=__g,e=g.enemies.find(e=>e.type==="slime");g.H.p.set(e.p.x+2,e.p.y,e.p.z);g.H.inv=0;})()')
        for k in ['Digit1','Digit2','Digit3']:
            await pg.keyboard.press(k)
            for i in range(5):
                await pg.keyboard.press('KeyJ');await pg.wait_for_timeout(350)
            await pg.keyboard.press('KeyK');await pg.wait_for_timeout(900)
            print(k,await st(), await pg.evaluate('__g.enemies.filter(e=>!e.alive).length'))
        # wisp + king
        await pg.evaluate('(()=>{const g=__g,e=g.enemies.find(e=>e.type==="king");g.H.p.set(e.p.x+3,e.p.y,e.p.z);g.H.hp=g.H.maxHp;})()')
        await pg.keyboard.press('Digit1')
        for i in range(14):
            await pg.keyboard.press('KeyJ');await pg.wait_for_timeout(300)
            if i%4==0: await pg.keyboard.press('KeyK')
        print('king',await st(),await pg.evaluate('__g.enemies.find(e=>e.type==="king").hp'))
        await pg.evaluate('(()=>{const g=__g,e=g.enemies.find(e=>e.type==="wisp");g.H.hp=g.H.maxHp;g.H.dead=false;g.H.p.set(e.p.x+6,g.groundH(e.p.x+6,e.p.z),e.p.z);})()')
        await pg.keyboard.press('Digit3')
        for i in range(8):
            await pg.keyboard.press('KeyJ');await pg.wait_for_timeout(450)
        print('wisp',await st())
        # crack with chest: dash
        await pg.evaluate('(()=>{const g=__g,c=g.cracks[0];g.H.hp=g.H.maxHp;g.H.p.set(c.x+5,c.y,c.z);g.H.face=-Math.PI/2;g.H.cds[0]=0;})()')
        await pg.keyboard.press('Digit1');await pg.wait_for_timeout(200);await pg.evaluate('__g.H.face=-Math.PI/2');await pg.keyboard.press('KeyK');await pg.wait_for_timeout(1200)
        print('crack0 alive',await pg.evaluate('__g.cracks[0].alive'),await st())
        await pg.keyboard.down('KeyW');await pg.wait_for_timeout(100);await pg.keyboard.up('KeyW')
        await pg.evaluate('(()=>{const g=__g,c=g.cracks[0];g.H.p.set(c.x,c.y,c.z);})()');await pg.wait_for_timeout(700)
        print('chest',await st())
        # sealed tower
        await pg.evaluate('(()=>{const g=__g,c=g.cracks[5],t=g.TOWERS[2];g.H.p.set(c.x+7.5,g.groundH(c.x+7.5,c.z),c.z);g.H.face=-Math.PI/2;g.H.cds[0]=0;g.enemies.forEach(e=>{if(e.type!=="wisp")e.alive=false;});})()')
        await pg.keyboard.press('KeyK');await pg.wait_for_timeout(800)
        await pg.evaluate('(()=>{const g=__g,t=g.TOWERS[2];g.H.p.set(t.x+2.5,t.y+0.5,t.z);g.H.v.set(0,0,0);})()');await pg.wait_for_timeout(700)
        print('tower2',await pg.evaluate('[__g.cracks[5].alive,__g.TOWERS[2].lit,__g.TOWERS[2].sealed]'),await st())
        # wind column + glide to mesa
        await pg.keyboard.press('Digit2')
        await pg.evaluate('(()=>{const g=__g,c=g.COLUMNS[0];g.H.p.set(c.x,c.y0,c.z);g.H.v.set(0,0,0);g.H.st=g.H.maxSt;})()')
        await pg.wait_for_timeout(300)
        await pg.keyboard.down('Space');await pg.wait_for_timeout(5000)
        print('column',await st(),await pg.evaluate('[__g.COLUMNS[0].top,__g.TOWERS[0].y]'))
        await pg.keyboard.up('Space')
        await pg.evaluate('(()=>{const g=__g,t=g.TOWERS[0];g.H.p.set(t.x+5,t.y+3,t.z);g.H.v.set(0,0,0);g.H.vy=0;})()');await pg.wait_for_timeout(1500)
        print('mesa land',await st())
        await pg.evaluate('(()=>{const g=__g,t=g.TOWERS[0];g.H.p.set(t.x+2.5,t.y+0.5,t.z);})()');await pg.wait_for_timeout(600)
        print('tower0',await pg.evaluate('__g.TOWERS[0].lit'),await st())
        # updraft skill
        await pg.evaluate('__g.H.cds[1]=0');await pg.keyboard.press('KeyK');await pg.keyboard.down('Space');await pg.wait_for_timeout(1500);print('updraft',await st());await pg.keyboard.up('Space')
        # isle platform
        await pg.evaluate('(()=>{const g=__g,s=g.ISLES[0];g.H.p.set(s.x,s.y+2,s.z);g.H.v.set(0,0,0);g.H.vy=0;})()');await pg.wait_for_timeout(1500)
        print('isle',await st(),await pg.evaluate('__g.ISLES[0].y'))
        # mage ice walk to the lake islet
        await pg.keyboard.press('Digit3')
        await pg.evaluate('(()=>{const g=__g;let x=120,z=100;for(let r=0;r<120;r+=1){if(g.groundH(120+r,100)>0.5&&r>12){x=120+r;break;}}g.H.p.set(x,g.groundH(x,100),100);g.H.v.set(0,0,0);g.H.cds[2]=0;window.__sx=x;})()')
        await pg.wait_for_timeout(300);print('shore',await st())
        await pg.keyboard.press('KeyK');await pg.wait_for_timeout(300)
        # set camera yaw so W moves toward -x : forward = (-sin yaw,-cos yaw) => yaw = pi/2
        await pg.evaluate('(()=>{const e=new MouseEvent("x")})()')
        # drive via I directly each frame using stick-like override
        await pg.evaluate('(()=>{window.__drive=setInterval(()=>{const g=__g,H=g.H;const dx=120-H.p.x,dz=100-H.p.z,l=Math.hypot(dx,dz)||1;H.v.x=dx/l*10;H.v.z=dz/l*10;},16)})()')
        await pg.wait_for_timeout(9500)
        await pg.evaluate('clearInterval(window.__drive)')
        print('islet',await st(),await pg.evaluate('[__g.TOWERS[1].lit,__g.plats.filter(p=>p.on).length]'))
        # swim/drown
        await pg.keyboard.press('Digit1')
        await pg.evaluate('(()=>{const g=__g;g.H.frost=0;g.H.p.set(150,-1,100);g.H.safe.set(__sx,g.groundH(__sx,100),100);})()')
        await pg.wait_for_timeout(11000)
        print('drown',await st())
        # summit + finale
        await pg.evaluate('(()=>{const g=__g,t=g.TOWERS[3];g.H.hp=g.H.maxHp;g.H.p.set(t.x+2.5,t.y+0.5,t.z);g.H.v.set(0,0,0)})()');await pg.wait_for_timeout(800)
        print('tower3',await st(),await pg.evaluate('[__g.TOWERS.map(t=>t.lit),__g.S.done]'))
        await pg.wait_for_timeout(5500)
        print('finale',await pg.evaluate('[__g.S.done]'))
        # death
        await pg.evaluate('(()=>{const g=__g;g.H.hp=1;g.H.inv=0;const e=g.enemies.find(e=>e.type==="slime"&&e.alive);g.H.p.copy(e.p);})()');await pg.wait_for_timeout(600)
        print('dying',await st());await pg.wait_for_timeout(3000);print('respawned',await st())
        # night
        await pg.evaluate('__g.DN.tod=0.9');await pg.wait_for_timeout(600)
        # menu, quality, sound
        await pg.keyboard.press('KeyP');await pg.wait_for_timeout(200)
        await pg.click('#mQuality');await pg.click('#mQuality');await pg.click('#mQuality');await pg.click('#mSound');await pg.click('#mSound')
        print('menu',await pg.evaluate('[document.getElementById("menu").hidden,document.getElementById("mQuality").textContent]'))
        await pg.click('#mClose');await pg.wait_for_timeout(300)
        # touch buttons
        for b_ in ['#bAtk','#bJump','#bSkill','.ch:nth-child(2)']:
            await pg.dispatch_event(b_,'pointerdown',{'pointerId':5,'pointerType':'touch'});await pg.dispatch_event(b_,'pointerup',{'pointerId':5,'pointerType':'touch'})
        await pg.wait_for_timeout(500)
        snap=await pg.evaluate('JSON.stringify(__g.snapshot())');print('snap',snap[:300])
        print('hud',await pg.evaluate('[document.getElementById("hearts").children.length,document.getElementById("track").textContent,document.getElementById("who").textContent,document.getElementById("region").textContent,document.getElementById("clock").textContent]'))
        ls=await pg.evaluate('localStorage.getItem("yunye-save-v2")!==null');print('saved',ls)
        # reload and continue
        await pg.reload();await pg.wait_for_timeout(600)
        print('go text',await pg.evaluate('document.getElementById("go").textContent'))
        await pg.click('#go');await pg.wait_for_timeout(800);print('continued',await st())
        nan=await pg.evaluate('(()=>{const g=__g;return [g.H.p.x,g.H.p.y,g.H.p.z,g.cam.position.x,g.cam.position.y].some(v=>isNaN(v))||g.enemies.some(e=>isNaN(e.p.x+e.p.y+e.p.z))})()');print('NaN?',nan)
        print('ERRS',len(errs));print('\n'.join(errs[:25]))
        await pg.screenshot(path='/tmp/hud.png')
        await b.close()
asyncio.run(main())
