// ---------------------------------------------------------------------------
// WebGL2 compositor. The painted scene, emissive light and the canopy
// occluder are uploaded as textures each frame; shaders add volumetric light
// rays (two passes), time-of-day grading, bloom, vignette and seeded grain.
// ---------------------------------------------------------------------------
const GLX = {
  init(canvas) {
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false }); this.gl = gl;
    const vs = `#version 300 es
in vec2 p; out vec2 uv; void main(){ uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;
    const raysFS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D occ; uniform vec2 sun;
void main(){ vec2 d = (uv - sun) / 56.; vec2 q = uv; float acc = 0., w = 1.;
  for (int i = 0; i < 56; i++) { q -= d; acc += texture(occ, q).r * w; w *= .972; }
  o = vec4(vec3(acc / 28.), 1.); }`;
    const finFS = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D scene, fg, emis, emisF, bloom, rays, ui; uniform float tod, flash, rayAmt, frame, fade, uiOn;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + frame * .618) * 43758.5453); }
vec3 grade(vec3 c){
  float l = dot(c, vec3(.299, .587, .114));
  vec3 day = pow(c, vec3(1.02)) * vec3(1.04, 1.0, .95);
  vec3 dusk = mix(vec3(l), c, .85) * vec3(1.06, .78, .62) * .9;
  vec3 night = mix(vec3(l), c, .5) * vec3(.36, .44, .78) * .72;
  vec3 g = tod < 1. ? mix(day, dusk, tod) : mix(dusk, night, tod - 1.);
  return g * (1. + flash * .45 * step(1.5, tod)) + flash * vec3(.10, .07, .05) * step(1.5, tod);
}
void main(){
  vec2 st = vec2(uv.x, 1. - uv.y);
  vec3 g = grade(texture(scene, st).rgb) + texture(emis, st).rgb;          // sky, hills, stream + fireworks/stars behind
  vec4 f = texture(fg, st);                                                  // lawn, cast, crowd, canopy (premultiplied)
  if (f.a > .001) { vec3 fc = f.rgb / f.a; vec3 fgc = grade(fc); if (tod > 1.) fgc = mix(fgc, mix(vec3(dot(fc, vec3(.299,.587,.114))), fc, .7) * vec3(.62, .62, .86), (tod - 1.) * .55); g = g * (1. - f.a) + fgc * f.a; }
  float r = texture(rays, st).r;
  g += rayAmt * smoothstep(.08, .7, r) * vec3(1., .85, .55) * .65;
  g += texture(emisF, st).rgb + texture(bloom, st).rgb * .8;
  vec2 v = uv - .5; g *= 1. - dot(v, v) * .55;
  g += (h(gl_FragCoord.xy) - .5) * .028;
  vec4 u = texture(ui, st) * uiOn; g = g * (1. - u.a) + u.rgb;
  o = vec4(g * fade, 1.);
}`;
    const mk = (fs) => { const P = gl.createProgram(); for (const [ty, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); gl.attachShader(P, s); } gl.linkProgram(P); return P; };
    this.pRays = mk(raysFS); this.pFin = mk(finFS);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.tex = {}; for (const k of ['scene', 'fg', 'emis', 'emisF', 'bloom', 'occ', 'ui', 'rays']) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); this.tex[k] = t; }
    gl.bindTexture(gl.TEXTURE_2D, this.tex.rays); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 480, 270, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex.rays, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.buf = buf;
  },
  up(k, canvas) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, this.tex[k]); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); },
  draw(P, U) { const gl = this.gl; gl.useProgram(P); const loc = gl.getAttribLocation(P, 'p'); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    let unit = 0; for (const [n, v] of Object.entries(U)) { const L = gl.getUniformLocation(P, n); if (typeof v === 'string') { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, this.tex[v]); gl.uniform1i(L, unit++); } else if (Array.isArray(v)) gl.uniform2f(L, v[0], v[1]); else gl.uniform1f(L, v); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); },
  frame(c, info) {
    const gl = this.gl;
    this.up('scene', c.scene); this.up('fg', c.fg); this.up('emisF', c.emisF); this.up('emis', c.emis); this.up('bloom', c.bloom); this.up('occ', c.occ); if (info.uiOn > 0) this.up('ui', c.ui);
    // occluder canvas is y-down: sun in its uv space
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, 480, 270);
    this.draw(this.pRays, { occ: 'occ', sun: [info.sun[0] / W, info.sun[1] / H] });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    this.draw(this.pFin, { scene: 'scene', fg: 'fg', emisF: 'emisF', emis: 'emis', bloom: 'bloom', rays: 'rays', ui: 'ui', tod: info.k, flash: info.flash, rayAmt: info.rayAmt, frame: info.frame, fade: info.fade, uiOn: info.uiOn });
  },
};
