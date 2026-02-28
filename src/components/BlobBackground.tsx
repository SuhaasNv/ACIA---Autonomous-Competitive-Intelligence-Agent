import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

type BlobDef = {
  id: string;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  size: number;
  color: string;
  blur: number;
  animate: Record<string, number[]>;
  duration: number;
  delay: number;
};

const DESKTOP_BLOBS: BlobDef[] = [
  {
    // Top-right cyan — sweeping clockwise loop
    id: "b1",
    top: "-22%",
    right: "-16%",
    size: 700,
    color: "hsl(200 85% 62% / 0.7)",
    blur: 90,
    animate: {
      x: [0, -120, -200, -80, 60, 0],
      y: [0, 80, 200, 300, 160, 0],
      scaleX: [1, 1.18, 0.9, 1.12, 0.95, 1],
      scaleY: [1, 0.9, 1.18, 0.92, 1.1, 1],
      rotate: [0, 30, 60, 40, 15, 0],
    },
    duration: 40,
    delay: 0,
  },
  {
    // Bottom-left violet — counter-clockwise loop
    id: "b2",
    bottom: "-22%",
    left: "-16%",
    size: 640,
    color: "hsl(260 65% 68% / 0.6)",
    blur: 85,
    animate: {
      x: [0, 130, 220, 100, -40, 0],
      y: [0, -90, -200, -290, -150, 0],
      scaleX: [1, 0.88, 1.2, 0.92, 1.1, 1],
      scaleY: [1, 1.2, 0.88, 1.14, 0.9, 1],
      rotate: [0, -25, -55, -35, -12, 0],
    },
    duration: 45,
    delay: 4,
  },
  {
    // Mid-left teal — figure-eight drift
    id: "b3",
    top: "36%",
    left: "-10%",
    size: 480,
    color: "hsl(180 70% 58% / 0.5)",
    blur: 75,
    animate: {
      x: [0, 140, 260, 140, -40, -120, 0],
      y: [0, -120, 0, 120, 80, -60, 0],
      scaleX: [1, 1.15, 0.88, 1.1, 0.93, 1.05, 1],
      scaleY: [1, 0.88, 1.15, 0.9, 1.1, 0.95, 1],
      rotate: [0, 20, -10, 20, -5, 10, 0],
    },
    duration: 38,
    delay: 8,
  },
  {
    // Upper-center indigo — diagonal wander
    id: "b4",
    top: "5%",
    left: "26%",
    size: 380,
    color: "hsl(240 70% 72% / 0.45)",
    blur: 70,
    animate: {
      x: [0, -100, -180, -60, 80, 160, 0],
      y: [0, 100, 220, 320, 200, 80, 0],
      scaleX: [1, 1.2, 0.85, 1.15, 0.9, 1.08, 1],
      scaleY: [1, 0.85, 1.2, 0.88, 1.15, 0.92, 1],
      rotate: [0, -30, 10, -20, 15, -8, 0],
    },
    duration: 32,
    delay: 2,
  },
];

const MOBILE_BLOBS: BlobDef[] = [
  {
    id: "b1",
    top: "-14%",
    right: "-10%",
    size: 320,
    color: "hsl(200 85% 62% / 0.55)",
    blur: 60,
    animate: {
      x: [0, -60, -100, -40, 0],
      y: [0, 60, 140, 200, 0],
      scaleX: [1, 1.1, 0.92, 1.05, 1],
      scaleY: [1, 0.92, 1.1, 0.96, 1],
    },
    duration: 30,
    delay: 0,
  },
  {
    id: "b2",
    bottom: "-14%",
    left: "-10%",
    size: 300,
    color: "hsl(260 65% 68% / 0.45)",
    blur: 55,
    animate: {
      x: [0, 60, 110, 50, 0],
      y: [0, -60, -130, -180, 0],
      scaleX: [1, 0.92, 1.1, 0.96, 1],
      scaleY: [1, 1.1, 0.92, 1.06, 1],
    },
    duration: 38,
    delay: 6,
  },
];

const REDUCED_BLOBS: BlobDef[] = [
  {
    id: "b1",
    top: "-22%",
    right: "-16%",
    size: 520,
    color: "hsl(200 85% 62% / 0.35)",
    blur: 85,
    animate: { scaleX: [1, 1.03, 1], scaleY: [1, 0.97, 1] },
    duration: 8,
    delay: 0,
  },
  {
    id: "b2",
    bottom: "-22%",
    left: "-16%",
    size: 450,
    color: "hsl(260 65% 68% / 0.25)",
    blur: 75,
    animate: { scaleX: [1, 0.97, 1], scaleY: [1, 1.03, 1] },
    duration: 10,
    delay: 3,
  },
];

export default function BlobBackground() {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 48, damping: 20, mass: 2 });
  const springY = useSpring(mouseY, { stiffness: 48, damping: 20, mass: 2 });

  useEffect(() => {
    if (reducedMotion || isMobile) return;
    const handleMove = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth / 2) * 0.28);
      mouseY.set((e.clientY - window.innerHeight / 2) * 0.28);
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [reducedMotion, isMobile, mouseX, mouseY]);

  const blobs = reducedMotion ? REDUCED_BLOBS : isMobile ? MOBILE_BLOBS : DESKTOP_BLOBS;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Radial glow at top-center for depth */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1100,
          height: 750,
          background:
            "radial-gradient(ellipse 80% 55% at 50% 0%, hsl(200 85% 55% / 0.16) 0%, transparent 70%)",
        }}
      />

      {/* Animated blobs */}
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          style={{
            position: "absolute",
            top: blob.top,
            left: blob.left,
            right: blob.right,
            bottom: blob.bottom,
            width: blob.size,
            height: blob.size,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at center, ${blob.color} 0%, transparent 65%)`,
            filter: `blur(${blob.blur}px)`,
            mixBlendMode: "hard-light",
            willChange: "transform",
          }}
          animate={blob.animate}
          transition={{
            duration: blob.duration,
            delay: blob.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Mouse-follow blob — desktop + full motion only */}
      {!reducedMotion && !isMobile && (
        <motion.div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            x: springX,
            y: springY,
            translateX: "-50%",
            translateY: "-50%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, hsl(200 85% 68% / 0.28) 0%, transparent 65%)",
            filter: "blur(65px)",
            mixBlendMode: "hard-light",
            willChange: "transform",
          }}
        />
      )}

      {/* Fractal noise texture for grain/depth */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.04,
          mixBlendMode: "overlay",
        }}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="hero-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#hero-noise)" />
      </svg>
    </div>
  );
}
