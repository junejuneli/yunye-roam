(function(){
class V3{constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}setScalar(s){this.x=this.y=this.z=s;return this;}
 copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}clone(){return new V3(this.x,this.y,this.z);}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
 length(){return Math.hypot(this.x,this.y,this.z);}normalize(){const l=this.length()||1;return this.multiplyScalar(1/l);}
 lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;}
 distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}}
class Color{constructor(a,b,c){this.r=1;this.g=1;this.b=1;if(a!==undefined)this.set(a,b,c);}
 set(a,b,c){if(a instanceof Color)return this.copy(a);if(typeof a==='number'&&b===undefined)return this.setHex(a);if(typeof a==='string'){return this;}this.r=a;this.g=b;this.b=c;return this;}
 setHex(h){if(typeof h!=='number'||isNaN(h))throw new Error('bad hex '+h);this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this;}
 getHex(){return (this.r*255)<<16^(this.g*255)<<8^(this.b*255);}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}
 copy(c){if(!(c instanceof Color))throw new Error('Color.copy non-color');this.r=c.r;this.g=c.g;this.b=c.b;return this;}clone(){return new Color().copy(this);}
 lerp(c,t){if(!(c instanceof Color))throw new Error('Color.lerp non-color');if(typeof t!=='number'||isNaN(t))throw new Error('lerp NaN');this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this;}
 offsetHSL(){return this;}multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this;}}
class Obj{constructor(){this.position=new V3();this.rotation=new V3();this.scale=new V3(1,1,1);this.quaternion={setFromUnitVectors(){return this;}};this.children=[];this.visible=true;this.matrix={};this.parent=null;this.renderOrder=0;}
 add(o){if(!(o instanceof Obj))throw new Error('add non-object');this.children.push(o);o.parent=this;return this;}remove(o){const i=this.children.indexOf(o);if(i>=0)this.children.splice(i,1);return this;}
 updateMatrix(){}lookAt(){}traverse(f){f(this);this.children.forEach(c=>c.traverse(f));}}
class Attr{constructor(a,n){this.array=a;this.itemSize=n;this.count=a.length/n;this.needsUpdate=false;}
 getX(i){return this.array[i*this.itemSize];}getY(i){return this.array[i*this.itemSize+1];}getZ(i){return this.array[i*this.itemSize+2];}
 setX(i,v){this.array[i*this.itemSize]=v;}setY(i,v){this.array[i*this.itemSize+1]=v;}setZ(i,v){this.array[i*this.itemSize+2]=v;}
 setXYZ(i,x,y,z){const o=i*this.itemSize;this.array[o]=x;this.array[o+1]=y;this.array[o+2]=z;}}
class Geo{constructor(){this.attributes={};this.index=null;this.boundingSphere=null;}
 setAttribute(n,a){if(!(a instanceof Attr))throw new Error('setAttribute non-attr');this.attributes[n]=a;return this;}setIndex(i){this.index=Array.isArray(i)?{array:i}:i;return this;}
 _fill(n){const p=new Float32Array(n*3);for(let i=0;i<p.length;i++)p[i]=Math.sin(i*1.3)*0.5;this.setAttribute('position',new Attr(p,3));this.setAttribute('normal',new Attr(new Float32Array(n*3).fill(0.577),3));this.setAttribute('uv',new Attr(new Float32Array(n*2),2));}
 toNonIndexed(){return this;}computeVertexNormals(){}
 translate(x,y,z){const p=this.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);return this;}
 scale(x,y,z){const p=this.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*x,p.getY(i)*y,p.getZ(i)*z);return this;}
 rotateX(a){const p=this.attributes.position,c=Math.cos(a),s=Math.sin(a);for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i);p.setY(i,y*c-z*s);p.setZ(i,y*s+z*c);}return this;}
 rotateZ(a){const p=this.attributes.position,c=Math.cos(a),s=Math.sin(a);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setX(i,x*c-y*s);p.setY(i,x*s+y*c);}return this;}}
const T={Vector3:V3,Color:Color,Object3D:Obj,Group:class extends Obj{},BufferGeometry:Geo,BufferAttribute:Attr,
 Scene:class extends Obj{},Fog:class{constructor(c,n,f){this.color=new Color(c);this.near=n;this.far=f;}},
 Sphere:class{constructor(c,r){this.center=c;this.radius=r;}},
 PerspectiveCamera:class extends Obj{constructor(f){super();this.fov=f;this.aspect=1;}updateProjectionMatrix(){}},
 WebGLRenderer:class{constructor(o){this.domElement=o.canvas;this.shadowMap={};this.pr=1;}setPixelRatio(p){this.pr=p;}setSize(w,h){this.domElement.width=w*this.pr;this.domElement.height=h*this.pr;}render(s,c){if(!(s instanceof Obj)||!(c instanceof Obj))throw new Error('render args');window.__frames=(window.__frames||0)+1;}},
 HemisphereLight:class extends Obj{constructor(a,b,i){super();this.color=new Color(a);this.groundColor=new Color(b);this.intensity=i;}},
 DirectionalLight:class extends Obj{constructor(a,i){super();this.color=new Color(a);this.intensity=i;this.target=new Obj();this.shadow={mapSize:new V3(),camera:{},bias:0};}},
 DataTexture:class{constructor(d,w,h){if(d.length!==w*h)throw new Error('DataTexture size');this.image={data:d,width:w,height:h};}},CanvasTexture:class{},
 Mesh:class extends Obj{constructor(g,m){super();if(!(g instanceof Geo))throw new Error('Mesh geo');if(!(m instanceof Mat))throw new Error('Mesh mat');this.geometry=g;this.material=m;}},
 Points:class extends Obj{constructor(g,m){super();this.geometry=g;this.material=m;}},
 Sprite:class extends Obj{constructor(m){super();this.material=m;this.center=new V3(0.5,0.5,0);}},
 InstancedMesh:class extends Obj{constructor(g,m,n){super();if(!(g instanceof Geo)||!(m instanceof Mat))throw new Error('IM args');this.geometry=g;this.material=m;this.count=n;this.max=n;this.instanceMatrix={needsUpdate:false};this.instanceColor=null;}
  setMatrixAt(i){if(!(i>=0&&i<this.max))throw new Error('setMatrixAt range '+i+'/'+this.max);}setColorAt(i,c){if(!(c instanceof Color))throw new Error('setColorAt');if(!(i>=0&&i<this.max))throw new Error('setColorAt range');this.instanceColor=this.instanceColor||{needsUpdate:false};}},
 LuminanceFormat:1,NearestFilter:2,LinearFilter:3,BackSide:1,DoubleSide:2,AdditiveBlending:2,PCFSoftShadowMap:2};
class Mat{constructor(o){o=o||{};Object.assign(this,o);this.color=new Color(o.color===undefined?0xffffff:o.color);this.emissive=new Color(o.emissive||0);if(this.opacity===undefined)this.opacity=1;}}
['MeshToonMaterial','MeshBasicMaterial','MeshLambertMaterial','MeshPhongMaterial','ShaderMaterial','SpriteMaterial'].forEach(n=>{T[n]=class extends Mat{};});
T.ShaderMaterial=class extends Mat{constructor(o){super(o);if(typeof o.vertexShader!=='string'||typeof o.fragmentShader!=='string')throw new Error('shader strings');(window.__shaders=window.__shaders||[]).push({vs:o.vertexShader,fs:o.fragmentShader,u:Object.keys(o.uniforms||{})});}};
T.PlaneGeometry=class extends Geo{constructor(w,h,ws,hs){super();ws=ws||1;hs=hs||1;const n=(ws+1)*(hs+1),p=new Float32Array(n*3);let k=0;
 for(let j=0;j<=hs;j++)for(let i=0;i<=ws;i++){p[k++]=-w/2+i*w/ws;p[k++]=h/2-j*h/hs;p[k++]=0;}
 this.setAttribute('position',new Attr(p,3));this.setAttribute('normal',new Attr(new Float32Array(n*3).fill(0.577),3));
 const idx=[];for(let j=0;j<hs;j++)for(let i=0;i<ws;i++){const a=i+(ws+1)*j,b=i+(ws+1)*(j+1),c=i+1+(ws+1)*(j+1),d=i+1+(ws+1)*j;idx.push(a,b,d,b,c,d);}this.index={array:new Uint16Array(idx)};}};
['SphereGeometry','BoxGeometry','CylinderGeometry','ConeGeometry','IcosahedronGeometry','DodecahedronGeometry','OctahedronGeometry','TorusGeometry','RingGeometry','CircleGeometry','LatheGeometry','ShapeGeometry'].forEach(n=>{T[n]=class extends Geo{constructor(){super();for(let i=0;i<arguments.length;i++)if(typeof arguments[i]==='number'&&isNaN(arguments[i]))throw new Error(n+' NaN arg');this._fill(24);}};});
T.Vector2=class{constructor(x,y){this.x=x||0;this.y=y||0;}};
T.Shape=class{moveTo(){return this;}lineTo(){return this;}quadraticCurveTo(){return this;}};
window.THREE=T;
})();
