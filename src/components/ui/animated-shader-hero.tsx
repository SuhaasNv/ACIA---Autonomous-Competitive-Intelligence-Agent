import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface HeroProps {
  trustBadge?: {
    text: string;
    icons?: string[];
  };
  headline: {
    line1: string;
    line2: string;
  };
  subtitle: string;
  buttons?: {
    primary?: {
      text: string;
      onClick?: () => void;
    };
    secondary?: {
      text: string;
      onClick?: () => void;
    };
  };
  className?: string;
}

const defaultShaderSource = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float a=rnd(i), b=rnd(i+vec2(1,0)), c=rnd(i+vec2(0,1)), d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) { t+=a*noise(p); p*=2.*m; a*=.5; }
  return t;
}
float clouds(vec2 p) {
  float d=1., t=.0;
  for (float i=.0; i<3.; i++) {
    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
    t=mix(t,d,a); d=a; p*=2./(i+1.);
  }
  return t;
}
void main(void) {
  vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
  vec3 col=vec3(0);
  float bg=clouds(vec2(st.x+T*.5,-st.y));
  uv*=1.-.3*(sin(T*.2)*.5+.5);
  for (float i=1.; i<12.; i++) {
    uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
    vec2 p=uv;
    float d=length(p);
    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
    float b=noise(i+p+bg*1.731);
    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
  }
  O=vec4(col,1);
}`;

const useShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const pausedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) return;

    // Cap DPR for mobile battery / performance
    const dpr = Math.min(Math.max(1, window.devicePixelRatio * 0.5), 1.5);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const compile = (shader: WebGLShader, src: string) => {
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
    };

    const vertSrc = `#version 300 es\nprecision highp float;\nin vec4 position;\nvoid main(){gl_Position=position;}`;
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    compile(vs, vertSrc);
    compile(fs, defaultShaderSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,-1,-1,1,1,1,-1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'resolution');
    const uTime = gl.getUniformLocation(program, 'time');

    resize();
    window.addEventListener('resize', resize);

    // Pause animation when tab is hidden (saves battery on mobile)
    const handleVisibility = () => { pausedRef.current = document.hidden; };
    document.addEventListener('visibilitychange', handleVisibility);

    const loop = (now: number) => {
      animationFrameRef.current = requestAnimationFrame(loop);
      if (pausedRef.current) return;
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now * 1e-3);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return canvasRef;
};

const Hero: React.FC<HeroProps> = ({ trustBadge, headline, subtitle, buttons, className = "" }) => {
  const canvasRef = useShaderBackground();

  return (
    // 100svh = safe viewport height — handles mobile browser address bar shrink/grow
    <div className={`relative w-full overflow-hidden bg-black ${className}`} style={{ minHeight: '100svh' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none select-none"
        style={{ background: 'black' }}
        aria-hidden="true"
      />

      {/* Slight vignette overlay to help text contrast at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white px-5 sm:px-8 pt-20 pb-10">
        {trustBadge && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 sm:mb-8 max-w-xs sm:max-w-none text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-orange-500/10 backdrop-blur-md border border-orange-300/20 rounded-full">
              {trustBadge.icons?.map((icon, i) => (
                <span key={i} className="text-sm">{icon}</span>
              ))}
              <span className="text-orange-100/80 text-[11px] sm:text-xs font-medium leading-snug">
                {trustBadge.text}
              </span>
            </div>
          </motion.div>
        )}

        <div className="text-center space-y-4 sm:space-y-5 w-full max-w-5xl mx-auto">
          <div className="space-y-0.5 sm:space-y-1">
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.6rem] leading-none sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight bg-gradient-to-r from-orange-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent"
            >
              {headline.line1}
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.6rem] leading-none sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent"
            >
              {headline.line2}
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-orange-100/75 font-light leading-relaxed max-w-xs sm:max-w-lg md:max-w-2xl mx-auto"
          >
            {subtitle}
          </motion.p>

          {buttons && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.72, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-6 sm:mt-8 w-full sm:w-auto px-2 sm:px-0"
            >
              {buttons.primary && (
                <button
                  onClick={buttons.primary.onClick}
                  className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-orange-500 to-yellow-500 active:from-orange-600 active:to-yellow-600 text-black rounded-full font-bold text-sm transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95"
                >
                  {buttons.primary.text}
                </button>
              )}
              {buttons.secondary && (
                <button
                  onClick={buttons.secondary.onClick}
                  className="w-full sm:w-auto px-7 py-3.5 sm:px-8 sm:py-4 bg-white/5 active:bg-white/15 border border-white/10 text-white/80 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95"
                >
                  {buttons.secondary.text}
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;
