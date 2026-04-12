/**
 * shader-bg.js — WebGL plasma shader background for DAS hero sections
 * Colors matched to brand: #E63946 (red), #0f0f0f (black)
 *
 * Usage: add class="shader-canvas" to a <canvas> inside any hero section.
 * The canvas must be position:absolute and its parent position:relative.
 */
(function () {

  const VS = `
    attribute vec4 aPos;
    void main() { gl_Position = aPos; }
  `;

  /* ── Fragment shader — plasma lines, brand-coloured ── */
  const FS = `
    precision highp float;
    uniform vec2  iResolution;
    uniform float iTime;

    const float overallSpeed     = 0.18;
    const float gridSmoothWidth  = 0.015;
    const float axisWidth        = 0.05;
    const float majorLineWidth   = 0.025;
    const float minorLineWidth   = 0.0125;
    const float majorLineFreq    = 5.0;
    const float minorLineFreq    = 1.0;
    const float scale            = 5.0;

    /* Brand red #E63946 → (0.902, 0.224, 0.275) */
    const vec4 lineColor = vec4(0.902, 0.224, 0.275, 1.0);

    const float minLineWidth   = 0.008;
    const float maxLineWidth   = 0.18;
    const float lineSpeed      = 1.0  * overallSpeed;
    const float lineAmplitude  = 1.0;
    const float lineFrequency  = 0.2;
    const float warpSpeed      = 0.2  * overallSpeed;
    const float warpFrequency  = 0.5;
    const float warpAmplitude  = 1.0;
    const float offsetFrequency= 0.5;
    const float offsetSpeed    = 1.33 * overallSpeed;
    const float minOffsetSpread= 0.6;
    const float maxOffsetSpread= 2.0;
    const int   linesPerGroup  = 16;

    #define drawCircle(pos,r,coord)   smoothstep(r + gridSmoothWidth, r, length(coord-(pos)))
    #define drawSmoothLine(pos,hw,t)  smoothstep(hw, 0.0, abs(pos-(t)))
    #define drawCrispLine(pos,hw,t)   smoothstep(hw+gridSmoothWidth, hw, abs(pos-(t)))
    #define drawPeriodicLine(f,w,t)   drawCrispLine(f/2.0, w, abs(mod(t,f)-(f)/2.0))

    float random(float t) {
      return (cos(t) + cos(t*1.3+1.3) + cos(t*1.4+1.4)) / 3.0;
    }

    float getPlasmaY(float x, float hFade, float offset) {
      return random(x * lineFrequency + iTime * lineSpeed) * hFade * lineAmplitude + offset;
    }

    void main() {
      vec2 uv    = gl_FragCoord.xy / iResolution.xy;
      vec2 space = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.x * 2.0 * scale;

      float hFade = 1.0 - (cos(uv.x * 6.2832) * 0.5 + 0.5);
      float vFade = 1.0 - (cos(uv.y * 6.2832) * 0.5 + 0.5);

      space.y += random(space.x * warpFrequency + iTime * warpSpeed)
                 * warpAmplitude * (0.5 + hFade);
      space.x += random(space.y * warpFrequency + iTime * warpSpeed + 2.0)
                 * warpAmplitude * hFade;

      /* Brand backgrounds:
         bgColor1 = #0f0f0f pure black
         bgColor2 = #1a0507 very dark red-tinted black  */
      vec4 bgColor1 = vec4(0.059, 0.059, 0.059, 1.0);
      vec4 bgColor2 = vec4(0.102, 0.020, 0.027, 1.0);

      vec4 lines = vec4(0.0);

      for (int l = 0; l < linesPerGroup; l++) {
        float nli         = float(l) / float(linesPerGroup);
        float offsetTime  = iTime * offsetSpeed;
        float offsetPos   = float(l) + space.x * offsetFrequency;
        float rand        = random(offsetPos + offsetTime) * 0.5 + 0.5;
        float halfWidth   = mix(minLineWidth, maxLineWidth, rand * hFade) / 2.0;
        float offset      = random(offsetPos + offsetTime * (1.0 + nli))
                            * mix(minOffsetSpread, maxOffsetSpread, hFade);

        float linePos = getPlasmaY(space.x, hFade, offset);
        float line    = drawSmoothLine(linePos, halfWidth, space.y) / 2.0
                      + drawCrispLine(linePos, halfWidth * 0.15, space.y);

        float circleX       = mod(float(l) + iTime * lineSpeed, 25.0) - 12.0;
        vec2  circlePos     = vec2(circleX, getPlasmaY(circleX, hFade, offset));
        float circle        = drawCircle(circlePos, 0.01, space) * 4.0;

        lines += (line + circle) * lineColor * rand;
      }

      vec4 col  = mix(bgColor1, bgColor2, uv.x);
      col      *= vFade;
      col.a     = 1.0;
      col      += lines;

      gl_FragColor = col;
    }
  `;

  /* ── WebGL helpers ─────────────────────────────────── */
  function makeShader(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s); return null;
    }
    return s;
  }

  function makeProgram(gl) {
    const prog = gl.createProgram();
    gl.attachShader(prog, makeShader(gl, gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, makeShader(gl, gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program error:', gl.getProgramInfoLog(prog)); return null;
    }
    return prog;
  }

  /* ── Main init ─────────────────────────────────────── */
  function initShaderBg(canvas) {
    const gl = canvas.getContext('webgl');
    if (!gl) return; // graceful fallback — hero shows plain dark background

    const prog = makeProgram(gl);
    if (!prog) return;

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const aPos     = gl.getAttribLocation(prog, 'aPos');
    const uRes     = gl.getUniformLocation(prog, 'iResolution');
    const uTime    = gl.getUniformLocation(prog, 'iTime');
    const parent   = canvas.parentElement;

    function resize() {
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    const t0 = performance.now();
    (function render() {
      const t = (performance.now() - t0) / 1000;
      gl.clearColor(0.059, 0.059, 0.059, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(aPos);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(render);
    })();
  }

  /* ── Auto-attach to every .shader-canvas on the page ── */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('canvas.shader-canvas').forEach(initShaderBg);
  });

})();
