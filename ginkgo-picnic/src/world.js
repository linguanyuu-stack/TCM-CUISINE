import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng, hash, lerp, S, sat, clamp, bump, polar, SAUCERS, SAUCER_Y, SEATS, STOOL_H, DISH, POT_Y, FIREWORKS, FW_DIR, fwFlash, T, SPOTS, mixAngle } from './cues.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const col = h => new THREE.Color(h);
export const streamX = z => 8.4 + 1.2 * Math.sin(z * 0.22);
const inStream = (x, z, m = 0) => Math.abs(x - streamX(z)) < 1.4 + m;
export const TREE = [-5.6, -5.2];
const KEEP_OUT = [[0, 8, 4.2], [-3.5, 7, 3], [3.8, -6, 2.6], [-0.9, 1.6, 1], [0, 0, 4.4], [-3.8, -0.8, 2.2], [4.4, 0.2, 2.4], [5.2, 2.6, .8], [-3, 8.5, 2.5]];
const blocked = (x, z, m = 0) => inStream(x, z, .5 + m) || Math.hypot(x - TREE[0], z - TREE[1]) < 1.6 + m || KEEP_OUT.some(k => Math.hypot(x - k[0], z - k[1]) < k[2] + m);

function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

export function leafGeometry(s = 1) {
  const sh = new THREE.Shape(); const n = 10, a0 = Math.PI * 0.14, a1 = Math.PI * 0.86;
  sh.moveTo(0, -0.35); sh.lineTo(0.02, 0);
  for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); const r = (i === n / 2 ? 0.72 : 1) * (0.92 + 0.08 * Math.sin(i * 2.4)); sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  sh.lineTo(-0.02, 0); sh.lineTo(0, -0.35);
  const g = new THREE.ShapeGeometry(sh, 1); g.scale(s, s, s); return g;
}

function swayMat(mat, uTime, amp, freq) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float ph = instanceMatrix[3].x*0.9 + instanceMatrix[3].z*1.3 + instanceMatrix[3].y*0.7;
      float sw = sin(uTime*${freq.toFixed(2)} + ph) + 0.5*sin(uTime*${(freq * 2.3).toFixed(2)} + ph*1.7);
      transformed.x += sw*${amp.toFixed(3)}*(position.y+0.35);
      transformed.z += sw*${(amp * .6).toFixed(3)}*(position.y+0.35);
      #endif`);
  };
  return mat;
}

export function buildWorld(scene) {
  const R = rng(2026), uTime = { value: 0 }, upd = [];
  const D = new THREE.Object3D();

  // ---------- sky ----------
  const skyU = { uDusk: { value: 0 }, uNight: { value: 0 }, uTime, uSun: { value: V3(-.5, .6, .3).normalize() }, uMoon: { value: V3(.7, .42, -.6).normalize() }, uFw: { value: V3(0, 0, 0) } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vD; uniform float uDusk,uNight,uTime; uniform vec3 uSun,uMoon,uFw;
      float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      void main(){ vec3 d=normalize(vD); float h=clamp(d.y,0.,1.); float k=pow(1.-h,2.4);
        vec3 day=mix(vec3(.30,.56,.86),vec3(.99,.90,.72),k);
        vec3 dusk=mix(vec3(.16,.17,.40),vec3(1.,.50,.26),pow(1.-h,3.2));
        vec3 night=mix(vec3(.010,.018,.07),vec3(.06,.09,.22),k);
        vec3 c=mix(day,dusk,uDusk); c=mix(c,night,uNight);
        float sd=max(dot(d,uSun),0.); c+=vec3(1.,.85,.6)*(pow(sd,300.)*1.2+pow(sd,12.)*.25)*(1.-uNight);
        vec3 p=d*110.; vec3 ip=floor(p); vec3 fp=fract(p)-.5; float hh=h3(ip);
        float st=step(.988,hh)*smoothstep(.38,.0,length(fp))*(.6+.4*sin(uTime*(2.+hh*40.)+hh*90.));
        c+=vec3(1.,.95,.85)*st*uNight*smoothstep(.02,.2,d.y)*1.3;
        float md=dot(d,uMoon); c+=(vec3(1.,.97,.86)*smoothstep(.9990,.9994,md)+vec3(.5,.6,.9)*pow(max(md,0.),60.)*.25)*uNight;
        c+=uFw*.05*uNight*(1.-h*.5);
        gl_FragColor=vec4(c,1.);
        #include <colorspace_fragment>
      }`
  }));
  sky.renderOrder = -10; scene.add(sky);
  scene.fog = new THREE.Fog(0xf3e3c0, 22, 95);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0xdcecff, 0x9a8a55, 1.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d2, 3.0); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 11; sc.bottom = -11; sc.near = 1; sc.far = 70; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04; sun.shadow.radius = 5;
  sun.target.position.set(0, 0, -1); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xffe0c0, 0.55); fill.position.set(3, 4, 9); scene.add(fill);
  const moon = new THREE.DirectionalLight(0x8fa8ff, 0); moon.position.set(7, 9, -6); scene.add(moon);
  const fwL = new THREE.DirectionalLight(0xffffff, 0); fwL.position.set(FW_DIR[0], 17, FW_DIR[1]); scene.add(fwL);
  const fire = new THREE.PointLight(0xff8a3a, 1, 7, 1.6); fire.position.set(0.45, 0.25, -0.55); scene.add(fire);
  const lampL = [[-2.4, 3.3, -1.4], [0.4, 3.0, 0.4], [3.0, 3.1, 1.6]].map(p => { const l = new THREE.PointLight(0xffb060, 0, 13, 1.5); l.position.set(...p); scene.add(l); return l; });

  // ---------- ground ----------
  const gtex = canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = '#8fae4e'; g.fillRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 5000; i++) { const x = r() * w, y = r() * h, s = 6 + r() * 40; g.fillStyle = ['rgba(120,160,60,.10)', 'rgba(170,190,80,.10)', 'rgba(90,140,60,.10)', 'rgba(215,190,90,.07)'][i % 4]; g.beginPath(); g.ellipse(x, y, s, s * (.5 + r() * .5), r() * 3, 0, 7); g.fill(); }
    const tx = (TREE[0] + 70) / 140 * w, tz = (TREE[1] + 2 + 70) / 140 * h; const gr = g.createRadialGradient(tx + 22, tz + 18, 8, tx + 22, tz + 18, 110); gr.addColorStop(0, 'rgba(236,190,60,.75)'); gr.addColorStop(.6, 'rgba(232,196,80,.35)'); gr.addColorStop(1, 'rgba(232,196,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(120, 72), new THREE.MeshStandardMaterial({ map: gtex, roughness: 1 }));
  ground.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = (v - .5) * 240 / 140 + .5; });
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // hills + far trees
  { const g = new THREE.SphereGeometry(1, 20, 12); const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 1 }), 26); const pal = ['#9db85a', '#c9b24e', '#d99a45', '#86a657', '#b8c060', '#e0a94c'];
    for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283 + R() * .2, r = 70 + R() * 30; D.position.set(Math.cos(a) * r, -3, Math.sin(a) * r); D.scale.set(18 + R() * 16, 7 + R() * 9, 18 + R() * 14); D.rotation.set(0, 0, 0); D.updateMatrix(); m.setMatrixAt(i, D.matrix); m.setColorAt(i, col(pal[i % 6])); } scene.add(m); }
  { const N = 54, tg = new THREE.CylinderGeometry(.16, .26, 1, 7); tg.translate(0, .5, 0); const trunks = new THREE.InstancedMesh(tg, new THREE.MeshStandardMaterial({ color: 0x705038, roughness: 1 }), N);
    const bg = new THREE.SphereGeometry(1, 16, 12); const blobs = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ roughness: .95 }), N * 4); const pal = ['#f0c23c', '#e8a83a', '#e2793a', '#d85a38', '#8fb04e', '#6f9a4c', '#f4d256', '#c9c24a'];
    let n = 0, b = 0, guard = 0; while (n < N && guard++ < 4000) { const a = R() * 6.283, r = 17 + R() * 42, x = Math.cos(a) * r, z = Math.sin(a) * r; if (inStream(x, z, 1.5) || (Math.abs(x) < 9 && z > 6)) continue; const h = 2.2 + R() * 2.6, s = 1.6 + R() * 1.6, c = col(pal[Math.floor(R() * pal.length)]);
      D.position.set(x, 0, z); D.scale.set(1.3, h, 1.3); D.rotation.set(0, 0, 0); D.updateMatrix(); trunks.setMatrixAt(n, D.matrix);
      for (let k = 0; k < 4; k++) { D.position.set(x + (R() - .5) * s * 1.1, h + s * .5 + (R() - .3) * s * .8, z + (R() - .5) * s * 1.1); const q = s * (.7 + R() * .5); D.scale.set(q, q * .85, q); D.updateMatrix(); blobs.setMatrixAt(b, D.matrix); blobs.setColorAt(b++, c.clone().offsetHSL((R() - .5) * .03, 0, (R() - .5) * .1)); } n++; }
    trunks.castShadow = blobs.castShadow = true; scene.add(trunks, blobs); }
  // clouds
  const cloudM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, fog: false, depthWrite: false });
  { const g = new THREE.SphereGeometry(1, 12, 8); const m = new THREE.InstancedMesh(g, cloudM, 40); let k = 0; for (let c = 0; c < 8; c++) { const a = -2.6 + c * .55 + R() * .3, r = 190, y = 38 + R() * 40; for (let j = 0; j < 5; j++) { D.position.set(Math.cos(a) * r + (j - 2) * 11, y + (R() - .5) * 4, Math.sin(a) * r + (R() - .5) * 8); D.scale.set(12 + R() * 8, 5 + R() * 3, 8); D.updateMatrix(); m.setMatrixAt(k++, D.matrix); } } m.renderOrder = -9; scene.add(m); }

  // ---------- stream ----------
  const waterU = { uTime, uNight: { value: 0 }, uFw: { value: V3() }, uFog: { value: col(0xf3e3c0) }, uGold: { value: 0 } };
  { const pos = [], uv = [], idx = []; const n = 160; for (let i = 0; i <= n; i++) { const z = -70 + i * (115 / n), x = streamX(z); pos.push(x - 1.4, .03, z, x + 1.4, .03, z); uv.push(0, z, 1, z); if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: waterU, toneMapped: false,
      vertexShader: 'varying vec2 vU; varying float vZ; void main(){ vU=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vZ=-mv.z; gl_Position=projectionMatrix*mv; }',
      fragmentShader: `varying vec2 vU; varying float vZ; uniform float uTime,uNight,uGold; uniform vec3 uFw,uFog;
        float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
        void main(){ vec2 p=vec2(vU.x*3.,vU.y*.9+uTime*.55); float w=n2(p*2.)+.5*n2(p*5.+3.);
          vec3 day=mix(vec3(.20,.50,.62),vec3(.55,.80,.86),smoothstep(.5,1.2,w)); day=mix(day,vec3(.95,.62,.36),uGold*.45);
          vec3 night=mix(vec3(.02,.04,.10),vec3(.07,.11,.22),smoothstep(.5,1.2,w));
          vec3 c=mix(day,night,uNight);
          float sp=smoothstep(.93,1.,n2(vec2(vU.x*14.,vU.y*5.+uTime*1.6))*n2(vec2(vU.x*9.+4.,vU.y*3.-uTime*.3))*1.9);
          c+=sp*mix(vec3(1.,.97,.85),vec3(.5,.6,.9)*.6,uNight);
          c+=uFw*(.10+.5*smoothstep(.75,1.25,w))*uNight;
          float edge=smoothstep(0.,.14,vU.x)*smoothstep(1.,.86,vU.x); c=mix(c*.75+vec3(.12,.14,.1)*(1.-uNight),c,edge);
          float f=smoothstep(22.,95.,vZ); c=mix(c,uFog,f);
          gl_FragColor=vec4(c,1.);
          #include <colorspace_fragment>
        }` }));
    scene.add(m);
    const rg = new THREE.IcosahedronGeometry(1, 1); const rocks = new THREE.InstancedMesh(rg, new THREE.MeshStandardMaterial({ roughness: .9 }), 110);
    for (let i = 0; i < 110; i++) { const z = -30 + R() * 55, s = (R() < .5 ? -1 : 1), x = streamX(z) + s * (1.35 + R() * .5); const q = .14 + R() * .3; D.position.set(x, q * .25, z); D.scale.set(q * (1 + R() * .6), q * .65, q * (1 + R() * .5)); D.rotation.set(R(), R() * 6, R()); D.updateMatrix(); rocks.setMatrixAt(i, D.matrix); rocks.setColorAt(i, col('#9a948a').offsetHSL(0, 0, (R() - .5) * .16)); }
    rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks); }

  // ---------- grass, flowers, fallen leaves ----------
  { const blade = (a, h, lean) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-.028, 0, 0, .028, 0, 0, lean, h, 0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); g.rotateY(a); return g; };
    const tg = mergeGeometries([blade(0, .15, .03), blade(1.1, .11, -.04), blade(2.2, .17, .02), blade(3.6, .1, -.03), blade(4.6, .13, .03)]); tg.translate(0, 0, 0);
    const N = 16000, m = new THREE.InstancedMesh(tg, swayMat(new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), uTime, .22, 1.7), N); let n = 0, guard = 0;
    while (n < N && guard++ < 60000) { const a = R() * 6.283, r = 2 + Math.pow(R(), .7) * 34, x = Math.cos(a) * r, z = Math.sin(a) * r + 2; if (inStream(x, z, .1) || (Math.abs(x) < 2.95 && Math.abs(z) < 2.95)) continue; const s = .7 + R() * .9; D.position.set(x, 0, z); D.rotation.set(0, R() * 6.283, 0); D.scale.set(s, s, s); D.updateMatrix(); m.setMatrixAt(n, D.matrix); m.setColorAt(n++, col('#a4cc58').offsetHSL((R() - .6) * .06, 0, (R() - .5) * .12)); }
    m.count = n; m.receiveShadow = true; scene.add(m);
    const fg = new THREE.SphereGeometry(.035, 6, 4); const fl = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial(), 500); for (let i = 0; i < 500; i++) { let x, z; do { const a = R() * 6.283, r = 3.2 + R() * 22; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (inStream(x, z, .1) || (Math.abs(x) < 3 && Math.abs(z) < 3)); D.position.set(x, .13 + R() * .08, z); D.scale.set(1, .6, 1); D.rotation.set(0, 0, 0); D.updateMatrix(); fl.setMatrixAt(i, D.matrix); fl.setColorAt(i, col(['#ffffff', '#fff3b0', '#ffd9e6'][i % 3])); } scene.add(fl); }
  const leafG = leafGeometry(1);
  const leafMat = () => new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, emissive: 0x3a2800 });
  const leafCol = () => col('#f2c230').offsetHSL((R() - .5) * .05, 0, (R() - .5) * .16);
  { const N = 3200, m = new THREE.InstancedMesh(leafG, leafMat(), N); for (let i = 0; i < N; i++) { let x, z, g = 0; do { if (R() < .6) { const a = R() * 6.283, r = Math.sqrt(R()) * 9.5; x = TREE[0] + 2.2 + Math.cos(a) * r; z = TREE[1] + 2 + Math.sin(a) * r; } else { const a = R() * 6.283, r = 2 + R() * 24; x = Math.cos(a) * r; z = Math.sin(a) * r; } } while (inStream(x, z) && g++ < 9); const on = Math.abs(x) < 2.8 && Math.abs(z) < 2.8; const s = .11 + R() * .08; D.position.set(x, (on ? .03 : .015) + R() * .01, z); D.rotation.set(-Math.PI / 2 + (R() - .5) * .3, 0, R() * 6.283, 'YXZ'); D.rotation.y = R() * 6.283; D.scale.set(s, s, s); D.updateMatrix(); m.setMatrixAt(i, D.matrix); m.setColorAt(i, leafCol()); } m.receiveShadow = true; scene.add(m); }

  // ---------- big ginkgo ----------
  const barkM = new THREE.MeshStandardMaterial({ color: 0x6d4a31, roughness: 1 });
  { const tg = new THREE.CylinderGeometry(.42, .85, 6.4, 14, 8); const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)); const k = 1 + .1 * Math.sin(a * 5 + y * 1.3) + .06 * Math.sin(a * 9 - y * 2) + (y < -2.4 ? (-2.4 - y) * .5 : 0); p.setX(i, p.getX(i) * k + .25 * Math.sin(y * .6)); p.setZ(i, p.getZ(i) * k); } tg.computeVertexNormals(); const trunk = new THREE.Mesh(tg, barkM); trunk.position.set(TREE[0], 3.2, TREE[1]); trunk.castShadow = trunk.receiveShadow = true; scene.add(trunk);
    const br = [[1.6, 2.2, 1.2], [-2.4, 2.6, .6], [.6, 2.8, -2.2], [2.6, 1.9, -.6], [-1.2, 2.4, 2.0], [-.4, 3.4, -.4]];
    for (const b of br) { const len = Math.hypot(...b); const g = new THREE.CylinderGeometry(.12, .3, len, 7); g.translate(0, len / 2, 0); const m = new THREE.Mesh(g, barkM); m.position.set(TREE[0] + .15, 5.0, TREE[1]); m.quaternion.setFromUnitVectors(V3(0, 1, 0), V3(...b).normalize()); m.castShadow = true; scene.add(m); } }
  const blobsDef = [];
  { const C = [TREE[0] + .6, 8.6, TREE[1] + .6]; const N = 34; const bg = new THREE.SphereGeometry(1, 28, 18); const p = bg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + .09 * Math.sin(x * 5 + y * 3) + .07 * Math.sin(z * 6 - y * 4 + x * 2); p.setXYZ(i, x * k, y * k, z * k); } bg.computeVertexNormals();
    const m = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ roughness: .95 }), N);
    for (let i = 0; i < N; i++) { let x, y, z; const a = R() * 6.283, e = Math.acos(lerp(-.45, 1, R())), rr = .45 + R() * .55; x = C[0] + Math.sin(e) * Math.cos(a) * 5.6 * rr; z = C[2] + Math.sin(e) * Math.sin(a) * 5.0 * rr; y = C[1] + Math.cos(e) * 2.7 * rr; if (x > .6) x = .6 - R(); const s = 1.5 + R() * 1.2; blobsDef.push([x, y, z, s]); D.position.set(x, y, z); D.scale.set(s, s * .82, s); D.rotation.set(R(), R() * 6, R()); D.updateMatrix(); m.setMatrixAt(i, D.matrix); m.setColorAt(i, col('#e3ac22').offsetHSL((R() - .5) * .03, 0, (R() - .5) * .08 - (y < C[1] ? .05 : 0))); }
    scene.add(m);
    const LN = 7000, lm = new THREE.InstancedMesh(leafG, swayMat(leafMat(), uTime, .1, 2.1), LN); const n = V3();
    for (let i = 0; i < LN; i++) { const b = blobsDef[Math.floor(R() * N)]; n.set(R() - .5, R() - .5, R() - .5).normalize(); if (n.y < -.5 && R() < .5) n.y *= -1; D.position.set(b[0] + n.x * b[3] * 1.04, b[1] + n.y * b[3] * .86, b[2] + n.z * b[3] * 1.04); D.rotation.set(R() * 6, R() * 6, R() * 6); const s = .2 + R() * .16; D.scale.set(s, s, s); D.updateMatrix(); lm.setMatrixAt(i, D.matrix); lm.setColorAt(i, col('#f6cc3a').offsetHSL((R() - .5) * .05, 0, (R() - .5) * .2)); }
    lm.castShadow = true; scene.add(lm); }
  // falling leaves
  { const N = 260, m = new THREE.InstancedMesh(leafG, leafMat(), N); const P = []; for (let i = 0; i < N; i++) { P.push([TREE[0] + 1 + (R() - .5) * 17, TREE[1] + 3 + (R() - .5) * 15, 5 + R() * 5, 5 + R() * 5, R() * 10, R() * 6.283, .09 + R() * .07]); m.setColorAt(i, leafCol()); }
    m.castShadow = true; m.frustumCulled = false; scene.add(m);
    upd.push(t => { for (let i = 0; i < N; i++) { const p = P[i], u = ((t + p[4]) % p[3]) / p[3], y = p[2] * (1 - u); const sx = Math.sin(t * 1.3 + p[5]) * .5 + u * 1.4, sz = Math.cos(t * 1.1 + p[5] * 1.7) * .4; D.position.set(p[0] + sx, y + .02, p[1] + sz); D.rotation.set(t * 1.7 + p[5], t * .9 + p[5] * 2, Math.sin(t * 2.3 + p[5]) * 1.2); const s = p[6] * S(0, .04, u) * (1 - S(.97, 1, u)); D.scale.set(s, s, s); D.updateMatrix(); m.setMatrixAt(i, D.matrix); } m.instanceMatrix.needsUpdate = true; }); }
  // light rays
  const rayU = [];
  { const sd = V3(-7, 10, 5).normalize(); for (let i = 0; i < 9; i++) { const u = { uA: { value: 0 }, uPh: { value: R() * 6 } }; rayU.push(u); const w = .7 + R() * 1.3, len = 9; const g = new THREE.PlaneGeometry(w, len); g.translate(0, -len / 2, 0);
      const mat = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, vertexShader: 'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }', fragmentShader: 'varying vec2 vU; uniform float uA; void main(){ float a=smoothstep(0.,.5,vU.x)*smoothstep(1.,.5,vU.x)*smoothstep(0.,.25,vU.y)*smoothstep(1.,.7,vU.y); gl_FragColor=vec4(vec3(1.,.9,.62)*a*uA,1.); }' });
      for (let k = 0; k < 2; k++) { const m = new THREE.Mesh(g, mat); m.position.set(TREE[0] + 1.5 + R() * 7.5, 8.6, TREE[1] + 1 + R() * 6.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), sd); m.rotateY(k * 1.4 + R()); m.renderOrder = 5; scene.add(m); } } }

  // ---------- blanket, pot, stove ----------
  const btex = canvasTex(512, 512, (g, w) => { const r = rng(9), n = 8, s = w / n; const pal = ['#f6ead2', '#f2c9c2', '#dfe6bd', '#f7dfa8', '#f6ead2', '#e9b9b0']; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = pal[(i * 3 + j * 5 + (i * j) % 3) % pal.length]; g.fillRect(i * s, j * s, s, s); if ((i + j) % 3 === 0) { g.strokeStyle = 'rgba(190,120,110,.5)'; g.lineWidth = 2; for (let k = 8; k < s; k += 12) { g.beginPath(); g.moveTo(i * s + k, j * s); g.lineTo(i * s + k, j * s + s); g.stroke(); g.beginPath(); g.moveTo(i * s, j * s + k); g.lineTo(i * s + s, j * s + k); g.stroke(); } } else if ((i + j) % 3 === 1) { g.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(i * s + 10 + r() * (s - 20), j * s + 10 + r() * (s - 20), 4, 0, 7); g.fill(); } } g.strokeStyle = 'rgba(150,100,70,.45)'; g.setLineDash([6, 5]); g.lineWidth = 1.5; g.strokeRect(i * s + 3, j * s + 3, s - 6, s - 6); g.setLineDash([]); } g.strokeStyle = '#c98a7a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, w - 10); });
  { const g = new THREE.PlaneGeometry(5.7, 5.7, 24, 24); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .012 + .012 * Math.sin(p.getX(i) * 3.1) * Math.sin(p.getY(i) * 2.7)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: btex, roughness: 1 })); m.rotation.x = -Math.PI / 2; m.rotation.z = .06; m.receiveShadow = true; scene.add(m); }
  const clay = new THREE.MeshStandardMaterial({ color: 0x9a5632, roughness: .55, side: THREE.DoubleSide }), cream = new THREE.MeshStandardMaterial({ color: 0xf7ecd8, roughness: .35, side: THREE.DoubleSide });
  const emberM = new THREE.MeshBasicMaterial({ color: 0xff7a2a });
  { const stove = new THREE.Mesh(new THREE.CylinderGeometry(.4, .46, .22, 24), new THREE.MeshStandardMaterial({ color: 0xa8684a, roughness: .9 })); stove.position.y = .11; stove.castShadow = stove.receiveShadow = true; scene.add(stove);
    const d = polar(39, 1); const hole = new THREE.Mesh(new THREE.BoxGeometry(.24, .12, .1), new THREE.MeshBasicMaterial({ color: 0x2a120a })); hole.position.set(d[0] * .42, .09, d[1] * .42); hole.rotation.y = Math.atan2(d[0], d[1]); scene.add(hole);
    const em = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), emberM); em.position.set(d[0] * .4, .07, d[1] * .4); em.scale.set(1.4, .6, 1); scene.add(em);
    const wood = new THREE.MeshStandardMaterial({ color: 0xb98a58, roughness: .85 });
    const stool = new THREE.Mesh(new THREE.CylinderGeometry(.43, .4, STOOL_H, 22), wood); stool.position.set(SEATS[4][0], STOOL_H / 2, SEATS[4][1]); stool.castShadow = stool.receiveShadow = true; scene.add(stool);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.415, .02, 6, 26), new THREE.MeshStandardMaterial({ color: 0x8a5f38 })); ring.rotation.x = Math.PI / 2; ring.position.set(SEATS[4][0], STOOL_H - .06, SEATS[4][1]); scene.add(ring);
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, SAUCER_Y[4], 14), wood); stump.position.set(SAUCERS[4][0], SAUCER_Y[4] / 2, SAUCERS[4][1]); stump.castShadow = true; scene.add(stump);
    const prof = [[.02, .2], [.36, .2], [.5, .3], [.57, .46], [.56, .6], [.5, .69], [.54, .72], [.47, .7], [.5, .58]].map(p => new THREE.Vector2(...p));
    const pot = new THREE.Mesh(new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(28), 40), clay); pot.castShadow = pot.receiveShadow = true; scene.add(pot);
    const band = new THREE.Mesh(new THREE.TorusGeometry(.575, .022, 8, 40), cream); band.rotation.x = Math.PI / 2; band.position.y = .5; scene.add(band);
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283; const f = new THREE.Mesh(new THREE.SphereGeometry(.03, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: .5 })); f.position.set(Math.sin(a) * .575, .4, Math.cos(a) * .575); f.scale.z = .4; f.lookAt(0, .4, 0); scene.add(f); }
    for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(.09, .03, 8, 14, Math.PI), clay); h.position.set(s * .56, .58, 0); h.rotation.set(0, 0, -s * Math.PI / 2); scene.add(h); }
    const soup = new THREE.Mesh(new THREE.CircleGeometry(.5, 32), new THREE.MeshStandardMaterial({ color: 0x7b3b18, roughness: .12 })); soup.rotation.x = -Math.PI / 2; soup.position.y = POT_Y; scene.add(soup);
    const bits = []; const bm = [[0xa82a1c, .055, 1.5], [0xe2472a, .03, 1.6], [0xf3e6c4, .06, .35], [0x5a3a22, .05, .5], [0x2c2420, .035, 1.2]];
    for (let i = 0; i < 20; i++) { const b = bm[i % 5]; const m = new THREE.Mesh(new THREE.SphereGeometry(b[1], 10, 8), new THREE.MeshStandardMaterial({ color: b[0], roughness: .4 })); const a = R() * 6.283, r = .08 + R() * .34; m.position.set(Math.cos(a) * r, POT_Y, Math.sin(a) * r); m.scale.set(b[2] > 1 ? b[2] : 1, b[2] < 1 ? b[2] : .8, 1); m.rotation.y = R() * 6; scene.add(m); bits.push([m, R() * 6, a, r]); }
    const bubs = []; for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb87840, roughness: .1, transparent: true, opacity: .8 })); scene.add(m); bubs.push(m); }
    upd.push(t => { for (const b of bits) { b[0].position.y = POT_Y + .012 * Math.sin(t * 2.2 + b[1]); const a = b[2] + .12 * Math.sin(t * .5 + b[1]); b[0].position.x = Math.cos(a) * b[3]; b[0].position.z = Math.sin(a) * b[3]; }
      bubs.forEach((m, i) => { const per = .7 + hash(i, 1) * .6, k = Math.floor(t / per + hash(i, 2)), u = (t / per + hash(i, 2)) - k, a = hash(i, k) * 6.283, r = hash(k, i + 9) * .4; m.position.set(Math.cos(a) * r, POT_Y + .005, Math.sin(a) * r); const s = Math.sin(Math.PI * u) * (u < .85 ? 1 : 0) * (.6 + hash(k, 3)); m.scale.setScalar(Math.max(s, .001)); }); }); }
  // saucers + dish
  { const sg = new THREE.CylinderGeometry(.115, .09, .02, 20); for (const s of SAUCERS) { if (s === SAUCERS[4]) continue; const m = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: 0xc8905a, roughness: .7 })); m.position.set(s[0], .04, s[1]); m.receiveShadow = true; scene.add(m); }
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(.17, .12, .04, 22), cream); dish.position.set(DISH[0], .05, DISH[1]); dish.castShadow = true; scene.add(dish);
    for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({ color: i % 3 ? 0xa82a1c : 0xe2472a, roughness: .45 })); const a = i * .7, r = i ? .09 : 0; m.position.set(DISH[0] + Math.cos(a) * r, .09 + (i > 6 ? .04 : 0), DISH[1] + Math.sin(a) * r); m.scale.set(1.4, 1, 1); m.rotation.y = a; scene.add(m); } }
  // steam (points)
  const steamU = { uPx: { value: 1080 }, uCol: { value: col(0xffffff) }, uOp: { value: .2 } };
  { const N = 70, g = new THREE.BufferGeometry(); const pos = new Float32Array(N * 3), aux = new Float32Array(N * 2); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aux', new THREE.BufferAttribute(aux, 2));
    const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: steamU, transparent: true, depthWrite: false, toneMapped: false,
      vertexShader: 'attribute vec2 aux; varying float vA; uniform float uPx; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vA=aux.y*smoothstep(.7,2.2,-mv.z); gl_PointSize=aux.x*uPx/(-mv.z); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying float vA; uniform vec3 uCol; uniform float uOp; void main(){ float d=length(gl_PointCoord-.5)*2.; float a=smoothstep(1.,.1,d); gl_FragColor=vec4(uCol,a*a*vA*uOp); \n#include <colorspace_fragment>\n }' }));
    m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
    upd.push(t => { for (let i = 0; i < N; i++) { const per = 2.6 + hash(i, 4) * 1.6, u = ((t + hash(i, 5) * per) % per) / per, a = hash(i, 6) * 6.283, r = hash(i, 7) * .32; pos[i * 3] = Math.cos(a) * r + Math.sin(t * .8 + i) * .12 * u + u * u * .35; pos[i * 3 + 1] = .68 + u * 2.3; pos[i * 3 + 2] = Math.sin(a) * r + Math.cos(t * .7 + i * 2) * .1 * u; aux[i * 2] = .28 + u * .75; aux[i * 2 + 1] = Math.sin(Math.PI * Math.pow(u, .7)); } g.attributes.position.needsUpdate = true; g.attributes.aux.needsUpdate = true; }); }

  // ---------- lantern string ----------
  const lanternM = new THREE.MeshStandardMaterial({ color: 0xf2c690, roughness: .8, emissive: 0xff9a3a, emissiveIntensity: 0 });
  const haloU = { uA: { value: 0 } }; const lanterns = [];
  { const A = V3(TREE[0] + 1.0, 5.0, TREE[1] + 1.9), B = V3(5.2, 3.7, 2.6); const pole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 3.75, 8), barkM); pole.position.set(B.x, 1.87, B.z); pole.castShadow = true; scene.add(pole);
    const pts = []; for (let i = 0; i <= 24; i++) { const k = i / 24; const p = A.clone().lerp(B, k); p.y -= Math.sin(Math.PI * k) * 1.05; pts.push(p); }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .012, 5), new THREE.MeshBasicMaterial({ color: 0x4a3526 })));
    const hg = new THREE.PlaneGeometry(1.5, 1.5); const hm = new THREE.ShaderMaterial({ uniforms: haloU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, vertexShader: 'varying vec2 vU; void main(){ vU=uv; vec4 mv=modelViewMatrix*vec4(0.,0.,0.,1.); mv.xy+=position.xy; gl_Position=projectionMatrix*mv; }', fragmentShader: 'varying vec2 vU; uniform float uA; void main(){ float d=length(vU-.5)*2.; float a=pow(max(1.-d,0.),2.2); gl_FragColor=vec4(vec3(1.,.62,.25)*a*uA,1.); }' });
    for (let i = 0; i < 9; i++) { const p = pts[2 + Math.round(i * 2.5)]; const g = new THREE.Group(); g.position.copy(p);
      const body = new THREE.Mesh(new THREE.SphereGeometry(.2, 16, 12), lanternM); body.scale.y = .86; body.position.y = -.26;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .04, 10), barkM); cap.position.y = -.09; const cap2 = cap.clone(); cap2.position.y = -.43;
      const tas = new THREE.Mesh(new THREE.CylinderGeometry(.012, .02, .16, 5), new THREE.MeshStandardMaterial({ color: 0xd9452a })); tas.position.y = -.53;
      const halo = new THREE.Mesh(hg, hm); halo.position.y = -.26; halo.renderOrder = 7;
      g.add(body, cap, cap2, tas, halo); scene.add(g); lanterns.push(g); } }

  // ---------- gray crowd ----------
  const mobs = [];
  { const mk = (ears) => { const prof = [[0, 0], [.15, .01], [.2, .1], [.2, .28], [.185, .4], [.2, .5], [.185, .62], [.11, .7], [0, .72]].map(p => new THREE.Vector2(...p)); const parts = [new THREE.LatheGeometry(new THREE.SplineCurve(prof).getPoints(18), 14)];
      const sph = (r, x, y, z, sx = 1, sy = 1, sz = 1) => { const g = new THREE.SphereGeometry(r, 8, 6); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
      if (ears === 0) parts.push(sph(.055, .1, .71, 0), sph(.055, -.1, .71, 0)); if (ears === 1) parts.push(sph(.05, .1, .74, 0, .8, 1.7, .7), sph(.05, -.1, .74, 0, .8, 1.7, .7));
      parts.push(sph(.05, .2, .3, .03, .7, 1.2, .8), sph(.05, -.2, .3, .03, .7, 1.2, .8), sph(.06, .09, .03, .05, 1, .6, 1.3), sph(.06, -.09, .03, .05, 1, .6, 1.3));
      const eyes = [sph(.018, .07, .54, .185), sph(.018, -.07, .54, .185)];
      const all = [...parts, ...eyes].map((g, i) => { const gi = g.index ? g.toNonIndexed() : g; const n = gi.attributes.position.count, c = new Float32Array(n * 3).fill(i >= parts.length ? .5 : 1); gi.setAttribute('color', new THREE.BufferAttribute(c, 3)); gi.deleteAttribute('uv'); return gi; });
      const g = mergeGeometries(all); return g; };
    const geos = [mk(0), mk(1), mk(2)];
    const list = []; const add = (o) => { o.i = list.length; o.s = 1.0 + hash(list.length, 3) * .45; o.shade = .62 + hash(list.length, 8) * .16; list.push(o); };
    const matG = new THREE.MeshStandardMaterial({ color: 0xcfcbc6, roughness: 1 }); const bl = [];
    let guard = 0; while (bl.length < 50 && guard++ < 6000) { const a = R() * 6.283, r = 6.2 + Math.pow(R(), 1.4) * 22, x = Math.cos(a) * r, z = Math.sin(a) * r; if (blocked(x, z, 1.3) || bl.some(b => Math.hypot(b[0] - x, b[1] - z) < 3.0)) continue; bl.push([x, z]); const n = 2 + Math.floor(R() * 3), a0 = R() * 6;
      const m = new THREE.Mesh(new THREE.CircleGeometry(1.35, 20), matG); m.rotation.x = -Math.PI / 2; m.position.set(x, .02, z); m.receiveShadow = true; scene.add(m);
      for (let k = 0; k < n; k++) { const aa = a0 + k / n * 6.283; add({ type: 1, x: x + Math.cos(aa) * .78, z: z + Math.sin(aa) * .78, yaw: Math.atan2(-Math.cos(aa), -Math.sin(aa)) }); } }
    for (let i = 0; i < 44; i++) { let ax, az, bx, bz, g = 0; do { const a = R() * 6.283, r = 8 + R() * 18, len = 6 + R() * 8, da = a + 1.57 + (R() - .5); ax = Math.cos(a) * r; az = Math.sin(a) * r; bx = ax + Math.cos(da) * len; bz = az + Math.sin(da) * len; } while (g++ < 60 && [0, .25, .5, .75, 1].some(k => blocked(lerp(ax, bx, k), lerp(az, bz, k), 1.2) || bl.some(b => Math.hypot(b[0] - lerp(ax, bx, k), b[1] - lerp(az, bz, k)) < 1.9))); add({ type: 0, ax, az, bx, bz, sp: .7 + R() * .5, ph: R() * 20 }); }
    for (let c = 0; c < 5; c++) { let x, z, g = 0; do { const a = R() * 6.283, r = 9 + R() * 14; x = Math.cos(a) * r; z = Math.sin(a) * r; } while (g++ < 80 && (blocked(x, z, 2.2) || bl.some(b => Math.hypot(b[0] - x, b[1] - z) < 3))); for (let k = 0; k < 3; k++) add({ type: 2, x, z, r: 1.1, ph: k * 2.094 + c, small: 1 }); }
    for (let i = 0; i < 16; i++) { const z = -16 + i * 1.9 + R(), s = i % 2 ? 1 : -1; add({ type: 1, x: streamX(z) + s * 2.3, z, yaw: s > 0 ? -1.57 : 1.57 }); }
    const per = [[], [], []]; list.forEach(o => per[Math.floor(hash(o.i, 5) * 3)].push(o));
    const shG = new THREE.CircleGeometry(.24, 12); shG.rotateX(-Math.PI / 2); const shM = new THREE.InstancedMesh(shG, new THREE.MeshBasicMaterial({ color: 0x1a2010, transparent: true, opacity: .22, depthWrite: false }), list.length); shM.frustumCulled = false; scene.add(shM);
    const ims = per.map((arr, v) => { const m = new THREE.InstancedMesh(geos[v], new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), arr.length); arr.forEach((o, k) => m.setColorAt(k, new THREE.Color().setRGB(o.shade, o.shade * .985, o.shade * .965))); m.castShadow = true; m.frustumCulled = false; scene.add(m); return m; });
    const walkS = t => t < 41 ? t : 41 + (1 - Math.exp(-(t - 41) * 1.5)) / 1.5;
    upd.push((t, e, cam) => { const ws = walkS(t), look = S(42.2, 43.4, t) * (1 - S(53, 56, t)); let si = 0;
      per.forEach((arr, v) => { arr.forEach((o, k) => { let x, z, yaw, hop = 0, roll = 0, tilt = 0; const s = o.small ? o.s * .7 : o.s;
        if (o.type === 0) { const len = Math.hypot(o.bx - o.ax, o.bz - o.az), u = (ws * o.sp + o.ph) / len, c = u % 2, k2 = c < 1 ? c : 2 - c, dir = c < 1 ? 1 : -1; const e2 = S(0, 1, k2); x = lerp(o.ax, o.bx, e2); z = lerp(o.az, o.bz, e2); const turn = S(.0, .08, k2) * (1 - S(.92, 1, k2)); yaw = Math.atan2((o.bx - o.ax) * dir, (o.bz - o.az) * dir) + (1 - turn) * 1.5 * dir; const mv = (1 - S(41, 42, t)) * turn; hop = Math.abs(Math.sin(ws * 5 * o.sp + o.i)) * .05 * mv; roll = Math.sin(ws * 5 * o.sp + o.i) * .08 * mv; }
        else if (o.type === 2) { const a = ws * 1.5 + o.ph; x = o.x + Math.cos(a) * o.r; z = o.z + Math.sin(a) * o.r; yaw = Math.atan2(-Math.sin(a), Math.cos(a)); const mv = 1 - S(41, 42, t); hop = Math.abs(Math.sin(ws * 9 + o.ph)) * .07 * mv; }
        else { x = o.x; z = o.z; yaw = o.yaw; const talk = Math.max(0, Math.sin(t * .9 + o.i * 2.1)); hop = Math.abs(Math.sin(t * 6 + o.i)) * .025 * talk; roll = Math.sin(t * 1.2 + o.i) * .05; }
        if (look > 0) { yaw = mixAngle(yaw, Math.atan2(FW_DIR[0] - x, FW_DIR[1] - z), look); tilt = -.28 * look; for (const f of FIREWORKS) { const d = t - f.t - hash(o.i, f.seed) * .5; if (d > 0 && d < .45 && hash(o.i + 3, f.seed) < .4) hop += Math.sin(Math.PI * d / .45) * .16; } }
        const near = Math.hypot(x - cam.position.x, z - cam.position.z) < 2.2 ? 0.0001 : 1;
        D.position.set(x, hop, z); D.rotation.set(tilt, yaw, roll, 'YXZ'); D.scale.setScalar(s * near); D.updateMatrix(); ims[v].setMatrixAt(k, D.matrix);
        D.position.set(x, .025, z); D.rotation.set(0, 0, 0); D.scale.setScalar(s * near * (1 - hop * 2)); D.updateMatrix(); shM.setMatrixAt(si++, D.matrix); }); ims[v].instanceMatrix.needsUpdate = true; }); shM.instanceMatrix.needsUpdate = true; });
    mobs.push(list.length); }

  // ---------- fireworks ----------
  const fwU = { uPx: { value: 1080 } };
  { const PER = 110, TR = 5, N = FIREWORKS.length * (PER * TR + 13); const pos = new Float32Array(N * 3), colr = new Float32Array(N * 4); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('acol', new THREE.BufferAttribute(colr, 4));
    const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: fwU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
      vertexShader: 'attribute vec4 acol; varying vec3 vC; uniform float uPx; void main(){ vC=acol.rgb; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=max(acol.a*uPx/(-mv.z),1.5); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5)*2.; float a=pow(max(1.-d,0.),1.6); gl_FragColor=vec4(vC*a,1.); }' }));
    m.frustumCulled = false; m.renderOrder = 8; scene.add(m);
    const dirs = FIREWORKS.map(f => { const r = rng(f.seed), a = []; for (let i = 0; i < PER; i++) { const u = r() * 2 - 1, p = r() * 6.283, s = Math.sqrt(1 - u * u), v = f.type === 1 ? (i % 2 ? 1 : .55) : .75 + r() * .3; a.push([s * Math.cos(p) * v, u * v, s * Math.sin(p) * v, r()]); } return a; });
    upd.push(t => { let n = 0; const put = (x, y, z, r, gg, b, s) => { pos[n * 3] = x; pos[n * 3 + 1] = y; pos[n * 3 + 2] = z; colr[n * 4] = r; colr[n * 4 + 1] = gg; colr[n * 4 + 2] = b; colr[n * 4 + 3] = s; n++; };
      FIREWORKS.forEach((f, fi) => { const age = t - f.t; if (age > -1.0 && age < 0) { const sx = f.x * .8, sz = f.z; for (let j = 0; j < 12; j++) { const a = Math.max(0, age + 1 - j * .025), k = 1 - Math.pow(1 - a, 2); const fade = (1 - j / 12); put(lerp(sx, f.x, k) + Math.sin(a * 30) * .08, lerp(0, f.y, k), sz, 1 * fade, .8 * fade, .5 * fade, .9 * fade + .25); } }
        if (age >= 0 && age < 2.8) { const D2 = dirs[fi], will = f.type === 2; for (let i = 0; i < PER; i++) { const d = D2[i]; for (let j = 0; j < TR; j++) { const a = age - j * (will ? .09 : .05); if (a < 0) continue; const k = (1 - Math.exp(-a * 2.4)) / 2.4 * f.size * 5.4; const gy = a * a * (will ? 2.4 : 1.1); const life = will ? 2.7 : 2.0; let br = (1 - S(life * .45, life, a)) * (1 - j / TR) * (a < .08 ? 1.6 : 1); if (a > life * .5) br *= .5 + .5 * Math.sin(a * 40 + d[3] * 60); const c = (i % 3 === 0 && f.type !== 2) ? f.col2 : f.col; const w = a < .15 ? 1 - a / .15 : 0; put(f.x + d[0] * k, f.y + d[1] * k - gy, f.z + d[2] * k, (c[0] * c[0] * .6 + w * .5) * br, (c[1] * c[1] * .6 + w * .5) * br, (c[2] * c[2] * .6 + w * .5) * br, (j === 0 ? 1.25 : .8) * (.6 + br * .5)); } } if (age < .25) { const fl2 = (1 - age / .25) * .5; put(f.x, f.y, f.z, fl2, fl2 * .9, fl2 * .7, 5); } } });
      g.setDrawRange(0, n); g.attributes.position.needsUpdate = true; g.attributes.acol.needsUpdate = true; }); }

  // ---------- per-frame environment ----------
  const cDayFog = col(0xf3e3c0), cGoldFog = col(0xf2b987), cNightFog = col(0x0a1030), tmp = new THREE.Color();
  function update(t, e, cam, renderer) {
    const px = renderer.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360)); steamU.uPx.value = px; fwU.uPx.value = px;
    uTime.value = t; skyU.uDusk.value = e.dusk; skyU.uNight.value = e.night; const f = fwFlash(t); skyU.uFw.value.set(f[0], f[1], f[2]); waterU.uFw.value.set(f[0], f[1], f[2]); waterU.uNight.value = e.night; waterU.uGold.value = e.gold;
    scene.fog.color.copy(cDayFog).lerp(cGoldFog, e.gold * .8).lerp(cNightFog, e.night); waterU.uFog.value.copy(scene.fog.color);
    const low = 1 - e.day; sun.position.set(lerp(-7, -12, low), lerp(10, 3.2, low), lerp(5, 4, low)).multiplyScalar(2.5); skyU.uSun.value.copy(sun.position).normalize();
    sun.color.set(0xfff0d2).lerp(tmp.set(0xff8a3c), sat(e.gold * .85 + low * .5)); sun.intensity = 3.1 * e.day * (1 - e.night);
    hemi.color.set(0xdcecff).lerp(tmp.set(0xffc9a0), e.gold * .6).lerp(tmp.set(0x33427c), e.night); hemi.groundColor.set(0x9a8a55).lerp(tmp.set(0x141a30), e.night); hemi.intensity = lerp(1.45, .55, e.night);
    fill.intensity = .55 * (1 - e.night) + .0; moon.intensity = .4 * e.night;
    const fl = Math.hypot(f[0], f[1], f[2]); fwL.intensity = Math.min(fl * .8, .85) * e.night; if (fl > 0.001) fwL.color.setRGB(f[0] / fl, f[1] / fl, f[2] / fl).lerp(tmp.set(0xffffff), .3);
    const flick = .8 + .12 * Math.sin(t * 13.1) + .08 * Math.sin(t * 23.7 + 1); fire.intensity = flick * lerp(1.2, 3.5, e.night); emberM.color.setRGB(1, .35 + .2 * flick, .1);
    lampL.forEach((l, i) => { l.intensity = e.lamp * (4.6 + Math.sin(t * 3 + i * 2) * .3); }); lanternM.emissiveIntensity = e.lamp * 2.4; haloU.uA.value = e.lamp * .55;
    lanterns.forEach((g, i) => { g.rotation.z = Math.sin(t * 1.1 + i * .9) * .07; g.rotation.x = Math.sin(t * .8 + i * 1.7) * .04; });
    rayU.forEach(u => { u.uA.value = (.13 + .07 * Math.sin(t * .5 + u.uPh.value)) * e.day * (1 + e.gold * .6); });
    cloudM.color.set(0xffffff).lerp(tmp.set(0xffb890), e.gold).lerp(tmp.set(0x1a2348), e.night); cloudM.opacity = lerp(.9, .5, e.night);
    steamU.uCol.value.set(0xffffff).lerp(tmp.set(0xffd9b0), e.night * .6); steamU.uOp.value = lerp(.2, .17, e.night);
    renderer.toneMappingExposure = lerp(1.0, 1.08, e.night) * (1 + e.gold * .08);
    for (const u of upd) u(t, e, cam);
  }
  return { update, mobCount: mobs[0] };
}
