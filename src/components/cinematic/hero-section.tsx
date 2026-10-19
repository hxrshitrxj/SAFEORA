"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onExploreClick: () => void;
}

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  // Mouse position normalized (-1 to 1) for parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Initial cinematic entrance sequence
  useEffect(() => {
    // Check user preference for reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (motionQuery.addEventListener) {
      motionQuery.addEventListener("change", handleMotionChange);
    }

    const timer = setTimeout(() => {
      setIsReady(true);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener("change", handleMotionChange);
      }
    };
  }, []);

  // Smooth mouse movement tracking with performance throttling & visibility pause
  useEffect(() => {
    if (prefersReducedMotion) return;

    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isTabActive = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isTabActive) return;
      // Normalize from -1 to 1 based on viewport center
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (!isTabActive) {
        targetX = 0;
        targetY = 0;
      }
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const updateParallax = () => {
      if (isTabActive) {
        // Smooth lerp damping with 60fps limit
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        setMousePos({ x: currentX, y: currentY });
      }
      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  // Proximity glow calculation:
  // When mouse is on the left (mousePos.x < -0.2), intensify left frame
  // When mouse is on the right (mousePos.x > 0.2), intensify right frame
  const leftGlowIntensity = Math.min(
    1.4,
    Math.max(0.85, 1 - mousePos.x * 0.4)
  );
  const rightGlowIntensity = Math.min(
    1.4,
    Math.max(0.85, 1 + mousePos.x * 0.4)
  );

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative w-full h-[100svh] min-h-[640px] overflow-hidden bg-transparent flex items-center justify-center select-none"
      aria-label="Hero Section"
    >
      {/* 1. Deep Corridor Atmospheric Backplate with Parallax */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: prefersReducedMotion
            ? "none"
            : `translate3d(${mousePos.x * 6}px, ${mousePos.y * 4}px, 0)`,
        }}
        aria-hidden="true"
      >
        {/* Floating Atmospheric Cyber Particles / Volumetric Dust */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <span className="absolute top-[20%] left-[25%] w-1 h-1 rounded-full bg-[#FF3D9A]/60 blur-[0.5px] animate-pulse" />
            <span className="absolute top-[45%] left-[18%] w-1.5 h-1.5 rounded-full bg-[#782BFF]/50 blur-[0.5px] animate-ping" />
            <span className="absolute top-[30%] right-[22%] w-1 h-1 rounded-full bg-[#FF3D9A]/60 blur-[0.5px] animate-pulse" />
            <span className="absolute top-[65%] right-[30%] w-1.5 h-1.5 rounded-full bg-[#782BFF]/40 blur-[0.5px] animate-pulse" />
            <span className="absolute top-[15%] right-[40%] w-1 h-1 rounded-full bg-white/40 blur-[0.5px] animate-ping" />
            <span className="absolute top-[55%] left-[38%] w-1 h-1 rounded-full bg-[#FF3D9A]/40 blur-[0.5px] animate-pulse" />
          </div>
        )}

        {/* Ambient Room Glows */}
        <div
          className="absolute top-1/4 -left-20 w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(120, 43, 255, 0.25) 0%, rgba(5, 6, 9, 0) 70%)",
            opacity: leftGlowIntensity,
          }}
        />
        <div
          className="absolute top-1/4 -right-20 w-[480px] h-[480px] rounded-full blur-[140px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255, 61, 154, 0.25) 0%, rgba(5, 6, 9, 0) 70%)",
            opacity: rightGlowIntensity,
          }}
        />

        {/* Floor Horizon & Subtle Floor Sheen */}
        <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-gradient-to-t from-[#030407]/70 via-transparent to-transparent border-t border-white/[0.02]" />
      </div>

      {/* 2. Left Neon Door Frame (Perspective Quadrilateral) */}
      <div
        className={`absolute left-0 sm:left-4 md:left-8 lg:left-12 xl:left-16 top-1/2 -translate-y-1/2 w-[180px] sm:w-[250px] md:w-[320px] lg:w-[380px] h-[55vh] sm:h-[65vh] md:h-[75vh] max-h-[700px] z-30 transition-all duration-700 ease-out ${
          isReady ? "opacity-100 animate-neon-ignite" : "opacity-0"
        }`}
        style={{
          transform: prefersReducedMotion
            ? "translate3d(0, -50%, 0)"
            : `translate3d(${mousePos.x * 20}px, calc(-50% + ${mousePos.y * 12}px), 0)`,
        }}
      >
        <div
          className="w-full h-full animate-neon-left pointer-events-none"
          style={{
            filter: `drop-shadow(0 0 16px rgba(120, 43, 255, ${0.7 * leftGlowIntensity}))`,
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 320 640" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="neonLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#782BFF" />
                <stop offset="30%" stopColor="#5425FF" />
                <stop offset="70%" stopColor="#FF3D9A" />
                <stop offset="100%" stopColor="#F20B48" />
              </linearGradient>

              <linearGradient id="floorLeftReflect" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF3D9A" stopOpacity="0.35" />
                <stop offset="40%" stopColor="#782BFF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#050609" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Floor reflection polygon */}
            <polygon
              points="40,540 280,470 260,630 60,640"
              fill="url(#floorLeftReflect)"
              filter="blur(18px)"
            />

            {/* Outer neon tube bloom */}
            <polygon
              points="40,90 280,180 280,470 40,540"
              fill="none"
              stroke="url(#neonLeftGrad)"
              strokeWidth="18"
              strokeLinejoin="miter"
              filter="blur(16px)"
              opacity={0.65 * leftGlowIntensity}
            />

            {/* Middle neon radiance */}
            <polygon
              points="40,90 280,180 280,470 40,540"
              fill="none"
              stroke="url(#neonLeftGrad)"
              strokeWidth="7"
              strokeLinejoin="miter"
              filter="blur(4px)"
              opacity="0.95"
            />

            {/* Crisp white inner electrical core */}
            <polygon
              points="40,90 280,180 280,470 40,540"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinejoin="miter"
              opacity="0.95"
            />
          </svg>
        </div>

        {/* Clean Aesthetic "Enter Vault →" Button Inside the Neon Door Frame (Desktop & Tablet) */}
        <div className="hidden sm:block absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-auto">
          <Link
            href="/dashboard?nav=open"
            aria-label="Enter Vault"
            className="group relative inline-flex items-center gap-2.5 px-5 sm:px-6 md:px-7 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#FF2D8D] via-[#a855f7] to-[#782BFF] text-white font-bold text-xs sm:text-sm md:text-base tracking-wide shadow-[0_0_22px_rgba(255,45,141,0.5),0_0_45px_rgba(120,43,255,0.35)] hover:shadow-[0_0_35px_rgba(255,45,141,0.85),0_0_70px_rgba(120,43,255,0.65)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/25 select-none whitespace-nowrap backdrop-blur-sm"
            style={{
              transform: "perspective(800px) rotateY(12deg)",
            }}
          >
            <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              Enter Vault
            </span>
            <ArrowRight className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          </Link>
        </div>
      </div>

      {/* 3. Central Masked Red-Hooded Guard Character (Full-Height 3D Perspective) */}
      <div
        className={`relative z-20 flex items-end justify-center pointer-events-none select-none h-full transition-all duration-1000 ease-out ${
          isReady ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className="relative flex items-end justify-center h-[82vh] sm:h-[88vh] md:h-[94vh] max-h-[960px] transition-transform duration-200 ease-out animate-guard-idle"
          style={{
            transform: prefersReducedMotion
              ? "none"
              : `translate3d(${mousePos.x * -16}px, ${mousePos.y * -10}px, 20px) rotateY(${mousePos.x * -4.5}deg) rotateX(${mousePos.y * 3}deg) scale(${1 + Math.abs(mousePos.x) * 0.012})`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* Volumetric Layered Rim Light - Violet accent on left shoulder & hood */}
          <div
            className="absolute top-1/4 -left-14 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[80px] pointer-events-none opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(120, 43, 255, 0.5) 0%, transparent 70%)",
            }}
          />
          {/* Volumetric Layered Rim Light - Pink accent on right arm */}
          <div
            className="absolute top-1/3 -right-14 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-[80px] pointer-events-none opacity-50"
            style={{
              background: "radial-gradient(circle, rgba(255, 61, 154, 0.5) 0%, transparent 70%)",
            }}
          />

          {/* Central Guard Character Image - Full Height, Uncropped, Seamless 100% Alpha Cutout */}
          <img
            src="/assets/squid-guard-isolated.png"
            alt="Squid Game Sentinel Guard in crimson red hooded uniform and black mesh mask with white circle symbol"
            className="h-full w-auto max-w-none object-contain object-bottom drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
            style={{
              filter:
                "drop-shadow(0 0 20px rgba(242, 11, 72, 0.22)) drop-shadow(0 0 45px rgba(120, 43, 255, 0.18))",
            }}
            loading="eager"
            decoding="async"
          />

          {/* Realistic Soft Ambient Floor Shadow Under Character */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-64 sm:w-[380px] md:w-[440px] h-8 bg-black/90 blur-xl rounded-full" />
        </div>
      </div>

      {/* 4. Right Neon Door Frame (Perspective Quadrilateral) */}
      <div
        className={`absolute right-0 sm:right-4 md:right-10 lg:right-14 top-1/2 -translate-y-1/2 w-[180px] sm:w-[250px] md:w-[320px] lg:w-[380px] h-[55vh] sm:h-[65vh] md:h-[75vh] max-h-[700px] pointer-events-none z-10 transition-all duration-700 ease-out ${
          isReady ? "opacity-100 animate-neon-ignite" : "opacity-0"
        }`}
        style={{
          transform: prefersReducedMotion
            ? "translate3d(0, -50%, 0)"
            : `translate3d(${mousePos.x * -20}px, calc(-50% + ${mousePos.y * 12}px), 0)`,
        }}
        aria-hidden="true"
      >
        <div
          className="w-full h-full animate-neon-right"
          style={{
            filter: `drop-shadow(0 0 16px rgba(255, 61, 154, ${0.7 * rightGlowIntensity}))`,
          }}
        >
          <svg viewBox="0 0 320 640" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="neonRightGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#782BFF" />
                <stop offset="35%" stopColor="#FF3D9A" />
                <stop offset="75%" stopColor="#F20B48" />
                <stop offset="100%" stopColor="#FF3D9A" />
              </linearGradient>

              <linearGradient id="floorRightReflect" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FF3D9A" stopOpacity="0.4" />
                <stop offset="45%" stopColor="#782BFF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#050609" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Floor reflection polygon */}
            <polygon
              points="280,540 40,470 60,630 260,640"
              fill="url(#floorRightReflect)"
              filter="blur(18px)"
            />

            {/* Outer neon tube bloom */}
            <polygon
              points="280,90 40,180 40,470 280,540"
              fill="none"
              stroke="url(#neonRightGrad)"
              strokeWidth="18"
              strokeLinejoin="miter"
              filter="blur(16px)"
              opacity={0.65 * rightGlowIntensity}
            />

            {/* Middle neon radiance */}
            <polygon
              points="280,90 40,180 40,470 280,540"
              fill="none"
              stroke="url(#neonRightGrad)"
              strokeWidth="7"
              strokeLinejoin="miter"
              filter="blur(4px)"
              opacity="0.95"
            />

            {/* Crisp white inner electrical core */}
            <polygon
              points="280,90 40,180 40,470 280,540"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinejoin="miter"
              opacity="0.95"
            />
          </svg>
        </div>
      </div>

      {/* 5. Mobile Recomposed CTA (Only shown on small screens so it never collides with character) */}
      <div className="sm:hidden absolute bottom-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto w-[85%] max-w-[280px]">
        <Link
          href="/dashboard?nav=open"
          aria-label="Enter Vault"
          className="group relative flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF2D8D] via-[#a855f7] to-[#782BFF] text-white font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(255,45,141,0.6),0_0_50px_rgba(120,43,255,0.4)] active:scale-95 transition-all duration-300 border border-white/25 select-none whitespace-nowrap backdrop-blur-sm"
        >
          <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            Enter Vault
          </span>
          <ArrowRight className="relative z-10 w-4 h-4 text-white stroke-[2.5] transition-transform duration-300 group-hover:translate-x-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
        </Link>
      </div>

      {/* 6. Subtle Scroll Indicator at Bottom Center */}
      <button
        onClick={onExploreClick}
        aria-label="Scroll to Explore Section"
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors pointer-events-auto group focus:outline-none"
      >
        <span className="font-mono text-[9px] tracking-widest uppercase">
          SCROLL
        </span>
        <ChevronDown className="w-3.5 h-3.5 animate-bounce group-hover:text-[#FF3D9A] transition-colors" />
      </button>
    </section>
  );
}
