/* ===== 渲染基础 ===== */
const $=id=>document.getElementById(id);
const coarse=!!(window.matchMedia&&matchMedia('(pointer:coarse)').matches);
const reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
if(coarse)document.body.classList.add('touch');
const canvas=$('c');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:!coarse,powerPreference:'high-performance'});}
catch(e){fail('这台设备的浏览器不支持 WebGL，无法显示 3D 画面。');return;}
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const V3=THREE.Vector3,C=h=>new THREE.Color(h);
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xd6eef2,130,780);
const cam=new THREE.PerspectiveCamera(58,1,0.4,1500);
const dummy=new THREE.Object3D(),tc=new THREE.Color(),tc2=new THREE.Color(),tv=new V3(),tv2=new V3();
function ramp(vals){const t=new THREE.DataTexture(new Uint8Array(vals),vals.length,1,THREE.LuminanceFormat);
  t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t;}
const gradTex=ramp([105,170,228,255]),gradSoft=ramp([165,205,238,255]);
const toon=(c,o)=>new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gradTex},o||{}));
const basic=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:c},o||{}));
const glowy=(c,op)=>basic(c,{transparent:true,opacity:op===undefined?1:op,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const outlineMat=new THREE.MeshBasicMaterial({color:0x2b2236,side:THREE.BackSide});

/* 光照 */
const hemi=new THREE.HemisphereLight(0xd4f0ff,0x86a865,0.8);scene.add(hemi);
const sunL=new THREE.DirectionalLight(0xfff0cc,0.9);scene.add(sunL);scene.add(sunL.target);
sunL.shadow.mapSize.set(2048,2048);
(function(){const s=sunL.shadow.camera;s.left=-70;s.right=70;s.top=70;s.bottom=-70;s.near=1;s.far=420;})();
sunL.shadow.bias=-0.0006;sunL.shadow.normalBias=0.5;

/* 画质档位 */
const QUALITY=[{name:'低',pr:1,shadow:false,grass:36},{name:'中',pr:1.5,shadow:false,grass:80},{name:'高',pr:2,shadow:true,grass:150}];
let qIdx=coarse?1:2;

/* 随风摆动：给内置材质的顶点着色器加一段位移 */
const windU={uTime:{value:0},uHero:{value:new V3()}};
function windify(mat,grass){
  mat.onBeforeCompile=function(sh){
    sh.uniforms.uTime=windU.uTime;sh.uniforms.uHero=windU.uHero;
    sh.vertexShader='uniform float uTime;\nuniform vec3 uHero;\nvarying float vGy;\n'+sh.vertexShader
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvGy=position.y;')
      .replace('#include <project_vertex>',[
        'vec4 mvPosition=vec4(transformed,1.0);',
        '#ifdef USE_INSTANCING',
        'mvPosition=instanceMatrix*mvPosition;',
        'vec3 wRoot=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;',
        '#else',
        'vec3 wRoot=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;',
        '#endif',
        'mvPosition=modelMatrix*mvPosition;',
        grass?[
          'float gh=position.y;',
          'float gw=sin(uTime*1.8+wRoot.x*0.33+wRoot.z*0.27)+0.5*sin(uTime*3.1+wRoot.x*0.9-wRoot.z*0.6);',
          'float gust=sin(uTime*0.6+wRoot.x*0.05+wRoot.z*0.04)*0.5+0.5;',
          'mvPosition.x+=gw*(0.08+0.17*gust)*gh*gh;',
          'mvPosition.z+=gw*0.05*gh*gh;',
          'vec2 dp=wRoot.xz-uHero.xz;float dl=length(dp);',
          'float push=(1.0-smoothstep(0.3,1.6,dl))*step(abs(wRoot.y-uHero.y),1.6);',
          'mvPosition.xz+=normalize(dp+vec2(0.0001))*push*0.6*gh;',
          'mvPosition.y-=push*0.3*gh;',
          'float fd=1.0-smoothstep(42.0,53.0,dl);',
          'mvPosition.xyz=mix(wRoot,mvPosition.xyz,fd);'
        ].join('\n'):[
          'float tk=position.y/7.0;tk*=tk;',
          'mvPosition.x+=sin(uTime*1.2+wRoot.x*0.21+wRoot.z*0.17)*0.28*tk;',
          'mvPosition.z+=cos(uTime*0.9+wRoot.x*0.13-wRoot.z*0.11)*0.18*tk;'
        ].join('\n'),
        'mvPosition=viewMatrix*mvPosition;',
        'gl_Position=projectionMatrix*mvPosition;'
      ].join('\n'));
    if(grass)sh.fragmentShader='varying float vGy;\n'+sh.fragmentShader
      .replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(0.6,1.2,clamp(vGy,0.0,1.0));');
  };
  mat.customProgramCacheKey=function(){return grass?'wind-grass':'wind-tree';};
  return mat;
}

/* 几何小工具 */
function jitter(g,amt,seed){const p=g.attributes.position;
  const h=n=>{const s=Math.sin(n)*43758.5453;return s-Math.floor(s);};
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=Math.round(x*40)*12.9898+Math.round(y*40)*78.233+Math.round(z*40)*37.719+(seed||0);
    p.setXYZ(i,x+(h(k)-0.5)*2*amt,y+(h(k+1.7)-0.5)*2*amt,z+(h(k+3.1)-0.5)*2*amt);}
  g.computeVertexNormals();return g;}
function mergeGeos(parts){let n=0;
  const gs=parts.map(p=>{const g=p.g.index?p.g.toNonIndexed():p.g;n+=g.attributes.position.count;return g;});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
  parts.forEach((p,pi)=>{const g=gs[pi],Pp=g.attributes.position,Nn=g.attributes.normal;
    for(let i=0;i<Pp.count;i++,o++){const y=Pp.getY(i);
      pos[o*3]=Pp.getX(i);pos[o*3+1]=y;pos[o*3+2]=Pp.getZ(i);
      nor[o*3]=Nn.getX(i);nor[o*3+1]=Nn.getY(i);nor[o*3+2]=Nn.getZ(i);
      const k=p.y1!==undefined?lerp(p.k0,p.k1,clamp((y-p.y0)/(p.y1-p.y0),0,1)):1;
      col[o*3]=p.c.r*k;col[o*3+1]=p.c.g*k;col[o*3+2]=p.c.b*k;}});
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('normal',new THREE.BufferAttribute(nor,3));
  g.setAttribute('color',new THREE.BufferAttribute(col,3));
  return g;}
function blobGeo(r,x,y,z,sy,seed){const g=new THREE.IcosahedronGeometry(r,1);jitter(g,r*0.1,seed);
  const p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++){tv.set(p.getX(i),p.getY(i),p.getZ(i)).normalize();n.setXYZ(i,tv.x,tv.y,tv.z);}
  g.scale(1,sy||1,1);g.translate(x,y,z);return g;}
const glowTex=(function(){const cv=document.createElement('canvas');cv.width=cv.height=64;const x=cv.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,.55)');
  g.addColorStop(0.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(cv);})();
function glowSprite(color,size,op){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:op===undefined?1:op}));
  s.scale.set(size,size,1);return s;}
