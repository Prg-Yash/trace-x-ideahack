import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

interface CharacterProps {
  char: string;
  index: number;
  total: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  mouseActive: MotionValue<number>;
  containerWidth: number;
  containerHeight: number;
}

interface FragmentConfig {
  clipPath: string;
  config: { stiffness: number; damping: number; mass: number };
  pushFactorX: number;
  pushFactorY: number;
  rotateFactor: number;
  yOffset: number;
  zFactor: number;
  scaleFactor: number;
  skewFactor: number;
}

const fragmentsData: FragmentConfig[] = [
  {
    clipPath: "polygon(0 0, 100% 0, 100% 20%, 0 15%)",
    config: { stiffness: 120, damping: 14, mass: 0.8 },
    pushFactorX: 10,
    pushFactorY: -15,
    rotateFactor: -8,
    yOffset: -80,
    zFactor: 120,
    scaleFactor: 1.15,
    skewFactor: 12,
  },
  {
    clipPath: "polygon(0 15%, 100% 20%, 100% 40%, 0 35%)",
    config: { stiffness: 150, damping: 12, mass: 0.6 },
    pushFactorX: 5,
    pushFactorY: -5,
    rotateFactor: -3,
    yOffset: -40,
    zFactor: 60,
    scaleFactor: 1.05,
    skewFactor: 4,
  },
  {
    clipPath: "polygon(0 35%, 100% 40%, 100% 60%, 0 55%)",
    config: { stiffness: 90, damping: 18, mass: 1.1 },
    pushFactorX: 0,
    pushFactorY: 0,
    rotateFactor: 2,
    yOffset: 0,
    zFactor: 0,
    scaleFactor: 1.0,
    skewFactor: 0, // Solid anchor
  },
  {
    clipPath: "polygon(0 55%, 100% 60%, 100% 80%, 0 75%)",
    config: { stiffness: 130, damping: 15, mass: 0.9 },
    pushFactorX: -5,
    pushFactorY: 5,
    rotateFactor: 5,
    yOffset: 40,
    zFactor: 70,
    scaleFactor: 1.08,
    skewFactor: -6,
  },
  {
    clipPath: "polygon(0 75%, 100% 80%, 100% 100%, 0 100%)",
    config: { stiffness: 110, damping: 13, mass: 0.7 },
    pushFactorX: -10,
    pushFactorY: 15,
    rotateFactor: 10,
    yOffset: 80,
    zFactor: 150,
    scaleFactor: 1.2,
    skewFactor: -14,
  },
];

function FragmentPiece({
  char,
  cx,
  cy,
  mouseX,
  mouseY,
  mouseActive,
  scale,
  isShadow,
  frag,
}: {
  char: string;
  cx: number;
  cy: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  mouseActive: MotionValue<number>;
  scale: number;
  isShadow?: boolean;
  frag: FragmentConfig;
}) {
  const rawX = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return isShadow ? 6 * scale : 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      const radialPush = (dx / (dist || 1)) * 40 * force * scale;
      const artisticPush = frag.pushFactorX * force * scale;
      return (isShadow ? 6 * scale : 0) + radialPush + artisticPush;
    }
    return isShadow ? 6 * scale : 0;
  });

  const rawY = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return isShadow ? 6 * scale : 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      const radialPush = (dy / (dist || 1)) * 40 * force * scale;
      const artisticPush = frag.pushFactorY * force * scale;
      return (isShadow ? 6 * scale : 0) + radialPush + artisticPush;
    }
    return isShadow ? 6 * scale : 0;
  });

  const rawZ = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      return frag.zFactor * force * scale;
    }
    return 0;
  });

  const rawRotate = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      const direction = dx > 0 ? 1 : -1;
      return frag.rotateFactor * force * direction;
    }
    return 0;
  });

  const rawRotateX = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      return (dy / 8) * force; // Tilt backward/forward
    }
    return 0;
  });

  const rawRotateY = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      return -(dx / 8) * force; // Tilt left/right facing away
    }
    return 0;
  });

  const rawScale = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 1;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      return 1 + (frag.scaleFactor - 1) * force;
    }
    return 1;
  });

  const rawSkewX = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      return frag.skewFactor * force * (dx > 0 ? 1 : -1);
    }
    return 0;
  });

  const rawBlur = useTransform([mouseX, mouseY, mouseActive], (vals) => {
    const [mx, my, activeVal] = vals as [number, number, number];
    if (activeVal === 0) return 0;
    const dx = cx - mx;
    const dy = cy + frag.yOffset * scale - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 280 * scale;

    if (dist < radius) {
      const force = Math.pow(1 - dist / radius, 2);
      return force * 4; // Max 4px blur when close
    }
    return 0;
  });

  const x = useSpring(rawX, frag.config);
  const y = useSpring(rawY, frag.config);
  const z = useSpring(rawZ, frag.config);
  const rotate = useSpring(rawRotate, frag.config);
  const rotateX = useSpring(rawRotateX, frag.config);
  const rotateY = useSpring(rawRotateY, frag.config);
  const scaleTr = useSpring(rawScale, frag.config);
  const skewX = useSpring(rawSkewX, frag.config);
  const blur = useSpring(rawBlur, frag.config);
  
  const filter = useTransform(blur, (v) => `blur(${v}px)`);

  const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-sans, system-ui, sans-serif)",
    fontSize: "inherit",
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    textTransform: "uppercase",
  };

  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center ${
        isShadow ? "text-[#a3e635] z-0" : "text-[#ffffff] z-10"
      }`}
      style={{
        ...textStyle,
        clipPath: frag.clipPath,
        x,
        y,
        z,
        rotate,
        rotateX,
        rotateY,
        scale: scaleTr,
        skewX,
        WebkitTextStroke: isShadow ? "2px #130537" : "2.5px #130537",
        filter: isShadow ? "none" : filter,
        willChange: "transform, filter",
        transformStyle: "preserve-3d",
      }}
    >
      {char}
    </motion.div>
  );
}

function NeobrutalistCharacter({
  char,
  index,
  total,
  mouseX,
  mouseY,
  mouseActive,
  containerWidth,
  containerHeight,
}: CharacterProps) {
  // Estimate character horizontal center based on its index
  const cx = containerWidth * ((index + 0.55) / (total + 0.1));
  const cy = containerHeight / 2;

  // Responsive scaling factor
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      const isTablet = window.innerWidth < 1024;
      setScale(isMobile ? 0.35 : isTablet ? 0.65 : 1.0);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{
        fontSize: "13vw",
        width: "0.9em",
        height: "1.1em",
        transformStyle: "preserve-3d",
      }}
    >
      {/* 1. Neobrutalist Extruded Shadow Layers (Lime Green #a3e635) */}
      {fragmentsData.map((frag, i) => (
        <FragmentPiece
          key={`shadow-${i}`}
          char={char}
          cx={cx}
          cy={cy}
          mouseX={mouseX}
          mouseY={mouseY}
          mouseActive={mouseActive}
          scale={scale}
          isShadow={true}
          frag={frag}
        />
      ))}

      {/* 2. White Front Fragment Layers */}
      {fragmentsData.map((frag, i) => (
        <FragmentPiece
          key={`front-${i}`}
          char={char}
          cx={cx}
          cy={cy}
          mouseX={mouseX}
          mouseY={mouseY}
          mouseActive={mouseActive}
          scale={scale}
          isShadow={false}
          frag={frag}
        />
      ))}
    </div>
  );
}

// Subtle background grid to align with clean dashboard grids
function BackgroundGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.15] pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, #130537 1px, transparent 1px),
          linear-gradient(to bottom, #130537 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
      }}
    />
  );
}

// Generate static list of random background floating particles
const particles = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 4 + 2,
  duration: Math.random() * 14 + 10,
  delay: Math.random() * -10,
}));

export function InteractiveTypography() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mouseActive = useMotionValue(0);

  const [dimensions, setDimensions] = useState({ width: 1200, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
    mouseActive.set(1);
  };

  const handleMouseLeave = () => {
    mouseActive.set(0);
  };

  const chars = ["G", "-", "T", "E", "N"];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden flex flex-col items-center justify-center select-none border-t-2 border-[#130537]"
      style={{
        height: "50vh",
        backgroundColor: "#e8e8e2",
        perspective: "1200px",
      }}
    >
      <style>
        {`
          @keyframes gradient-move {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      {/* Background Grids & Paper Texture for Neobrutalist design */}
      <BackgroundGrid />
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Particles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-none border border-[#130537] bg-[#a3e635]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: 0.15,
            }}
            animate={{
              y: [0, -50, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Flex container holding each neobrutalist fragmenting character */}
      <div className="w-full max-w-7xl px-4 md:px-12 flex items-center justify-center gap-1 md:gap-3 pointer-events-none z-10">
        {chars.map((char, index) => (
          <NeobrutalistCharacter
            key={index}
            char={char}
            index={index}
            total={chars.length}
            mouseX={mouseX}
            mouseY={mouseY}
            mouseActive={mouseActive}
            containerWidth={dimensions.width}
            containerHeight={dimensions.height}
          />
        ))}
      </div>
    </div>
  );
}
