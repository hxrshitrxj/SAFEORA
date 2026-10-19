"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import DotGrid from "@/components/ui/DotGrid";
import {
  Shield,
  FileText,
  History,
  Activity,
  Flame,
  AlertCircle,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Lock,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  Compass,
  Sliders,
  Terminal,
  Database,
  Cpu,
} from "lucide-react";

export interface NavCategory {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  num: string;
  badge: string;
  icon: any;
  accentColor: string; // Tailwind color token or hex
  glowColor: string;
  borderGlow: string;
  description: string;
  metrics: { label: string; value: string }[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "dashboard",
    name: "Overview",
    subtitle: "Security Telemetry & System Pulse",
    href: "/dashboard",
    num: "01",
    badge: "99.8% READY",
    icon: Activity,
    accentColor: "from-cyan-500 to-blue-600",
    glowColor: "rgba(0, 242, 254, 0.4)",
    borderGlow: "border-cyan-400/40 hover:border-cyan-300",
    description: "Central command dashboard with real-time cryptographic integrity, active incidents, and defense telemetry.",
    metrics: [
      { label: "Vault Posture", value: "Verified Intact" },
      { label: "Active Threats", value: "0 Detected" },
      { label: "Telemetry", value: "240 ops/sec" },
    ],
  },
  {
    id: "vault",
    name: "My Vault",
    subtitle: "Zero-Knowledge Encrypted Storage",
    href: "/vault",
    num: "02",
    badge: "AES-256-GCM",
    icon: FileText,
    accentColor: "from-emerald-500 to-cyan-500",
    glowColor: "rgba(16, 185, 129, 0.4)",
    borderGlow: "border-emerald-400/40 hover:border-emerald-300",
    description: "Browser-side authenticated encryption repository where plaintext and encryption keys never touch the server.",
    metrics: [
      { label: "Cipher", value: "AES-GCM-256" },
      { label: "Merkle Root", value: "SHA-256" },
      { label: "Key Storage", value: "Client-Held" },
    ],
  },
  {
    id: "versions",
    name: "Versions & Recovery",
    subtitle: "Immutable Snapshots & Quarantine",
    href: "/versions",
    num: "03",
    badge: "AIR-GAPPED",
    icon: History,
    accentColor: "from-purple-500 to-indigo-600",
    glowColor: "rgba(168, 85, 247, 0.4)",
    borderGlow: "border-purple-400/40 hover:border-purple-300",
    description: "Pre-verified isolated recovery copies, rollback branch histories, and tamper-resistant backup restoration.",
    metrics: [
      { label: "Snapshots", value: "Immutable" },
      { label: "Rollback", value: "Atomic" },
      { label: "Segregation", value: "Verified" },
    ],
  },
  {
    id: "security",
    name: "Security Center",
    subtitle: "Autonomous Posture & Verification",
    href: "/security",
    num: "04",
    badge: "CONTINUOUS",
    icon: Shield,
    accentColor: "from-teal-400 to-cyan-500",
    glowColor: "rgba(20, 184, 166, 0.4)",
    borderGlow: "border-teal-400/40 hover:border-teal-300",
    description: "Real-time cryptographic audit suite checking chunk manifests, digital signatures, and defense containment.",
    metrics: [
      { label: "Audit State", value: "Continuous" },
      { label: "Signatures", value: "RSA-PSS / HMAC" },
      { label: "Containment", value: "Automatic" },
    ],
  },
  {
    id: "rehearsal",
    name: "Breach Rehearsal",
    subtitle: "Controlled Attack Simulation Drill",
    href: "/rehearsal",
    num: "05",
    badge: "LIVE SIM",
    icon: Flame,
    accentColor: "from-amber-500 to-rose-600",
    glowColor: "rgba(245, 158, 11, 0.45)",
    borderGlow: "border-amber-400/50 hover:border-amber-300",
    description: "Drill mode simulating bit-rot, signature forgery, manifest poisoning, and air-gap recovery validation.",
    metrics: [
      { label: "Sim Scenarios", value: "5 Threat Models" },
      { label: "Response Time", value: "< 24ms" },
      { label: "Quarantine", value: "Zero-Latency" },
    ],
  },
  {
    id: "incidents",
    name: "Incidents & Audit Logs",
    subtitle: "Tamper Proofs & Event Forensic Trail",
    href: "/incidents",
    num: "06",
    badge: "FORENSIC",
    icon: AlertCircle,
    accentColor: "from-rose-500 to-pink-600",
    glowColor: "rgba(244, 63, 94, 0.4)",
    borderGlow: "border-rose-400/40 hover:border-rose-300",
    description: "Append-only cryptographic event timelines, verification proofs, containment reports, and incident logs.",
    metrics: [
      { label: "Log Integrity", value: "Append-Only" },
      { label: "Proof Format", value: "JSON / MD" },
      { label: "Retention", value: "Cryptographic" },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    subtitle: "Security Policies & Client Boundaries",
    href: "/settings",
    num: "07",
    badge: "CLIENT-POLICIES",
    icon: Settings,
    accentColor: "from-blue-500 to-slate-500",
    glowColor: "rgba(59, 130, 246, 0.4)",
    borderGlow: "border-blue-400/40 hover:border-blue-300",
    description: "Configure key derivation iterations, auto-verify schedules, containment thresholds, and operator credentials.",
    metrics: [
      { label: "PBKDF2 / Salt", value: "100k Iterations" },
      { label: "Threshold", value: "Strict Quarantine" },
      { label: "Auth Mode", value: "Zero-Knowledge" },
    ],
  },
  {
    id: "help",
    name: "Help & About",
    subtitle: "RFC Architecture & Threat Model Specs",
    href: "/help",
    num: "08",
    badge: "SPEC 2026",
    icon: HelpCircle,
    accentColor: "from-indigo-500 to-violet-600",
    glowColor: "rgba(99, 102, 241, 0.4)",
    borderGlow: "border-indigo-400/40 hover:border-indigo-300",
    description: "Technical specifications, mathematical proofs, closed-loop pipeline documentation, and architectural blueprints.",
    metrics: [
      { label: "Standard", value: "W3C Web Crypto" },
      { label: "Architecture", value: "Closed-Loop" },
      { label: "Security", value: "Self-Defending" },
    ],
  },
];

interface NavTunnel3DProps {
  currentPath?: string;
  onClose?: () => void;
  onSelectCategory?: (href: string) => void;
  isOverlay?: boolean;
}

export function NavTunnel3D({
  currentPath = "/dashboard",
  onClose,
  onSelectCategory,
  isOverlay = false,
}: NavTunnel3DProps) {
  const router = useRouter();

  // Find initial active index based on current path
  const initialIndex = Math.max(
    0,
    NAV_CATEGORIES.findIndex((c) => c.href === currentPath || currentPath.startsWith(c.href))
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [zoomingId, setZoomingId] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
    };
  }, []);

  // Mouse parallax tracking
  useEffect(() => {
    if (prefersReducedMotion || isZooming) return;

    let rAF: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      setMousePos({ x: currentX, y: currentY });
      rAF = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rAF = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rAF);
    };
  }, [prefersReducedMotion, isZooming]);

  // Keyboard navigation: Left/Right arrows, Enter to zoom, Escape to close
  useEffect(() => {
    if (isZooming) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : NAV_CATEGORIES.length - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < NAV_CATEGORIES.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        triggerZoom(NAV_CATEGORIES[activeIndex]);
      } else if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isZooming, onClose]);

  // Handle Drag / Swipe
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isZooming) return;
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragStartX(clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || isZooming) return;
    setIsDragging(false);
    const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diff = clientX - dragStartX;

    if (diff > 50) {
      // Swiped right -> go to previous
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : NAV_CATEGORIES.length - 1));
    } else if (diff < -50) {
      // Swiped left -> go to next
      setActiveIndex((prev) => (prev < NAV_CATEGORIES.length - 1 ? prev + 1 : 0));
    }
  };

  // Click to Zoom and Expand
  const triggerZoom = useCallback(
    (cat: NavCategory) => {
      if (isZooming) return;

      // Reduced motion bypass
      if (prefersReducedMotion) {
        if (onSelectCategory) {
          onSelectCategory(cat.href);
        } else {
          router.push(cat.href);
        }
        return;
      }

      setIsZooming(true);
      setZoomingId(cat.id);

      // Phase A & B: zoom into camera for 850ms
      setTimeout(() => {
        if (onSelectCategory) {
          onSelectCategory(cat.href);
        } else {
          router.push(cat.href);
        }
      }, 850);
    },
    [isZooming, prefersReducedMotion, onSelectCategory, router]
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full min-h-[100svh] overflow-hidden bg-[#020408] text-white flex flex-col justify-between select-none ${
        isOverlay ? "fixed inset-0 z-50" : "relative"
      }`}
      style={{
        perspective: "1400px",
      }}
      aria-label="3D Floating Navigation Tunnel"
    >
      {/* 1. Deep Space Dotted Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: prefersReducedMotion
            ? "none"
            : `translate3d(${mousePos.x * 12}px, ${mousePos.y * 8}px, 0)`,
        }}
        aria-hidden="true"
      >
        {/* Interactive WebGL2 DotGrid Background from React Bits */}
        <div className="absolute inset-0 pointer-events-none">
          <DotGrid
            baseColor="#1d2c52"
            activeColor="#00f2fe"
            shape="circle"
            dotSize={4}
            gap={22}
            proximity={150}
            strength={1.2}
            bounce={0.55}
            tension={0.35}
            returnDuration={0.8}
            shockRadius={320}
            shockStrength={4}
            swell={0.85}
            stretch={0.4}
            glow={0.6}
            fade={0.25}
            opacity={0.85}
            intro={true}
            mouseInteraction={true}
            clickShock={true}
          />
        </div>

        {/* Deep Horizon Floor Sheen */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#010204] via-transparent to-transparent pointer-events-none" />

        {/* Ambient Volumetric Blue & Cyan Spotlights */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(0, 242, 254, 0.2) 0%, rgba(120, 43, 255, 0.15) 50%, transparent 75%)",
          }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(0, 242, 254, 0.3) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* 2. Floating ESC Button (Header clutter removed, smoothly fades during zoom) */}
      {onClose && (
        <div
          className={`absolute top-0 right-0 z-50 p-6 sm:p-8 flex items-center justify-end transition-opacity duration-300 ${
            isZooming ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"
          }`}
        >
          <button
            onClick={onClose}
            aria-label="Exit 3D Navigation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider border border-white/20 bg-white/5 hover:bg-white/15 text-white transition-all hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-md"
          >
            <X className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">ESC</span>
          </button>
        </div>
      )}

      {/* 3. The 3D Floating Navigation Tunnel (Perspective Curved Ribbon) */}
      <div className="relative z-30 flex-1 flex items-center justify-center overflow-visible w-full my-auto px-4">
        {/* 3D Perspective Stage */}
        <div
          className="relative w-full max-w-7xl h-[480px] sm:h-[540px] md:h-[580px] flex items-center justify-center"
          style={{
            transformStyle: "preserve-3d",
            transform: prefersReducedMotion || isZooming
              ? "rotateX(0deg) rotateY(0deg)"
              : `rotateX(${mousePos.y * -4}deg) rotateY(${mousePos.x * 3}deg)`,
            transition: isZooming
              ? "transform 0.85s cubic-bezier(0.19, 1, 0.22, 1)"
              : "transform 0.15s ease-out",
          }}
        >
          {NAV_CATEGORIES.map((cat, idx) => {
            const offset = idx - activeIndex;
            const isCenter = idx === activeIndex;
            const isHovered = hoveredIndex === idx;
            const isZoomTarget = zoomingId === cat.id;

            // Perspective tunnel parameters inspired by Reference Image 1:
            // Curved horizontal arc with progressive depth recession and Y-rotation
            const spacingX = 280; // horizontal spacing between cards in 3D
            const posX = offset * spacingX + (prefersReducedMotion ? 0 : mousePos.x * 20);
            const depthZ = -Math.pow(Math.abs(offset), 1.35) * 120 + (isHovered && !isZooming ? 40 : 0);
            const rotY = -offset * 14 + (prefersReducedMotion ? 0 : mousePos.x * 6);
            const scaleVal = Math.max(0.68, 1 - Math.abs(offset) * 0.11);
            const opacityVal = Math.max(0.2, 1 - Math.abs(offset) * 0.22);
            const zIndexVal = 60 - Math.round(Math.abs(offset) * 6);

            // Zooming Phase Styles:
            // When isZooming is true:
            // - The selected card moves to (0, 0, 300px) and scales to 3.2
            // - All other cards fade out with blur and push back into deep space
            let cardTransform = "";
            let cardOpacity = opacityVal;

            if (isZooming) {
              if (isZoomTarget) {
                // Smooth forward glide right into the camera, scaling up to cleanly fill the viewport
                cardTransform = `translate3d(0, 0, 950px) scale(2.2) rotateY(0deg) rotateX(0deg)`;
                cardOpacity = 1;
              } else {
                // Lateral dispersal + deep space recession for surrounding cards
                const disperseX = offset > 0 ? posX + 360 : posX - 360;
                cardTransform = `translate3d(${disperseX}px, 0, ${depthZ - 900}px) scale(0.35) rotateY(${rotY * 1.8}deg)`;
                cardOpacity = 0;
              }
            } else {
              cardTransform = `translate3d(${posX}px, 0, ${depthZ}px) rotateY(${rotY}deg) scale(${scaleVal})`;
            }

            const Icon = cat.icon;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  if (isCenter) {
                    triggerZoom(cat);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  transform: cardTransform,
                  opacity: cardOpacity,
                  zIndex: isZoomTarget ? 100 : zIndexVal,
                  transformStyle: "preserve-3d",
                  willChange: "transform, opacity",
                  backfaceVisibility: "hidden",
                  transition: isZooming
                    ? isZoomTarget
                      ? "transform 0.85s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.6s ease-out, box-shadow 0.6s ease-out"
                      : "transform 0.75s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.5s ease-out, filter 0.5s ease-out"
                    : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out, filter 0.4s ease-out",
                  filter: !isCenter && !isHovered && !isZooming ? "brightness(0.7) blur(0.5px)" : "none",
                }}
                className={`absolute w-[240px] sm:w-[280px] md:w-[310px] h-[380px] sm:h-[440px] md:h-[480px] rounded-2xl cursor-pointer group select-none transition-shadow duration-300 ${
                  isCenter
                    ? "ring-1 ring-cyan-400/50 shadow-[0_0_40px_rgba(0,242,254,0.35)]"
                    : "hover:ring-1 hover:ring-cyan-400/30"
                }`}
                role="button"
                tabIndex={0}
                aria-label={`Open ${cat.name} section`}
              >
                {/* High-Velocity Warp Light Tunnel Effect on Zoom Target */}
                <div
                  className={`absolute -inset-10 rounded-3xl pointer-events-none transition-all duration-700 ease-out ${
                    isZoomTarget && isZooming ? "opacity-100 scale-125" : "opacity-0 scale-75"
                  }`}
                  style={{
                    background: `radial-gradient(circle at center, ${cat.glowColor} 0%, rgba(0, 242, 254, 0.35) 40%, transparent 75%)`,
                    filter: "blur(25px)",
                  }}
                />

                {/* Glass Card Surface */}
                <div
                  className={`w-full h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between border bg-[#060b18]/85 backdrop-blur-xl relative overflow-hidden transition-all duration-500 ${cat.borderGlow}`}
                  style={{
                    boxShadow: isZoomTarget && isZooming
                      ? `0 0 90px rgba(0,242,254,0.6), 0 0 160px ${cat.glowColor}`
                      : isCenter
                      ? `0 20px 50px -10px rgba(0,0,0,0.8), 0 0 35px ${cat.glowColor}`
                      : "0 15px 35px -10px rgba(0,0,0,0.7)",
                  }}
                >
                  {/* Subtle Card Grid Sheen */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />

                  {/* Top Ambient Card Radiance */}
                  <div
                    className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40 bg-gradient-to-br ${cat.accentColor}`}
                  />

                  {/* Top Row: Category Icon */}
                  <div className="relative z-10 flex items-center justify-end">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.accentColor} flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-4 h-4 text-white stroke-[2.2]" />
                    </div>
                  </div>

                  {/* Center Visual: Holographic Cybersecurity Preview UI */}
                  <div className="relative z-10 my-auto py-3">
                    <div className="p-3 sm:p-4 rounded-xl bg-navy-950/80 border border-white/[0.08] backdrop-blur-md">
                      {/* Miniature preview UI based on category */}
                      <div className="flex items-center justify-between mb-3 border-b border-white/[0.06] pb-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                          TELEMETRY PREVIEW
                        </span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      </div>

                      {/* Dynamic Metrics Preview */}
                      <div className="space-y-2">
                        {cat.metrics.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="flex items-center justify-between text-[11px] font-mono"
                          >
                            <span className="text-slate-400">{m.label}</span>
                            <span className="text-cyan-300 font-semibold">{m.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Visual Hologram Graphic / Progress Bar */}
                      <div className="mt-3 pt-2 border-t border-white/[0.05]">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${cat.accentColor} rounded-full`}
                            style={{
                              width: `${75 + (idx % 3) * 10}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Category Titles & Zoom Action CTA */}
                  <div className="relative z-10 pt-2 border-t border-white/[0.08]">
                    <div className="flex flex-col">
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-light mt-0.5 line-clamp-1">
                        {cat.subtitle}
                      </p>
                    </div>

                    {/* Action Button: Zoom & Enter */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                        <span>{isCenter ? "CLICK TO ZOOM & ENTER" : "SELECT PANEL"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {idx + 1}/{NAV_CATEGORIES.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Controls: Carousel Arrows & Category Dots */}
      <footer
        className={`relative z-50 w-full px-6 sm:px-10 py-5 flex items-center justify-between gap-4 border-t border-white/[0.06] bg-[#030610]/80 backdrop-blur-md transition-all duration-400 ${
          isZooming ? "opacity-0 translate-y-6 pointer-events-none" : "opacity-100 translate-y-0"
        }`}
      >
        {/* Left: Previous / Next Arrow Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : NAV_CATEGORIES.length - 1))}
            aria-label="Previous navigation panel"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveIndex((prev) => (prev < NAV_CATEGORIES.length - 1 ? prev + 1 : 0))}
            aria-label="Next navigation panel"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: 8 Category Dots Indicator */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Category Selector">
          {NAV_CATEGORIES.map((cat, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Go to ${cat.name}`}
                aria-selected={isCurrent}
                className={`transition-all duration-300 rounded-full focus:outline-none ${
                  isCurrent
                    ? "w-8 h-2 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_#00f2fe]"
                    : "w-2 h-2 bg-white/20 hover:bg-white/50"
                }`}
              />
            );
          })}
        </div>

        {/* Right: Direct Enter CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => triggerZoom(NAV_CATEGORIES[activeIndex])}
            disabled={isZooming}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-xs tracking-wider font-mono shadow-[0_0_20px_rgba(0,242,254,0.35)] hover:shadow-[0_0_30px_rgba(0,242,254,0.6)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 border border-white/20"
          >
            <span>{isZooming ? "ZOOMING..." : "ENTER SECTION"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* Seamless Cinematic Route Transition Veil */}
      <div
        className={`fixed inset-0 z-[200] pointer-events-none transition-opacity duration-400 ease-in-out ${
          isZooming ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "radial-gradient(circle at center, rgba(3, 6, 16, 0.92) 0%, #010204 100%)",
          transitionDelay: isZooming ? "520ms" : "0ms",
        }}
      />
    </div>
  );
}
