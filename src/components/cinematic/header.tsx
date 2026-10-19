"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Shield, Lock, Activity, BookOpen, User, X } from "lucide-react";

interface HeaderProps {
  onNavigate?: (sectionId: string) => void;
}

export function CinematicHeader({ onNavigate }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate("hero");
    } else {
      const heroEl = document.getElementById("hero");
      if (heroEl) {
        heroEl.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleNavClick = (sectionId: string) => {
    setIsOpen(false);
    if (onNavigate) {
      onNavigate(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navLinks = [
    { num: "01", label: "HOME", desc: "Cinematic Sentinel Portal", action: () => handleNavClick("hero") },
    { num: "02", label: "EXPLORE", desc: "Autonomous Defense Engine", action: () => handleNavClick("explore") },
    { num: "03", label: "DISCOVER", desc: "Cryptographic Capabilities", action: () => handleNavClick("discover") },
    { num: "04", label: "VAULT CONSOLE", desc: "Zero-Knowledge Protected Storage", href: "/dashboard?nav=open", icon: Lock },
    { num: "05", label: "BREACH REHEARSAL", desc: "Autonomous Attack Simulation", href: "/rehearsal", icon: Activity },
    { num: "06", label: "SECURITY AUDIT", desc: "Real-time Posture & Tamper Logs", href: "/security", icon: Shield },
    { num: "07", label: "DOCUMENTATION", desc: "Architecture & Verification Guides", href: "/help", icon: BookOpen },
  ];

  return (
    <>
      {/* Top Header Bar (when menu is closed) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 pointer-events-none px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between transition-opacity duration-300 ${
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Top-Left Geometric Logo: Triangle, Circle, Square */}
        <button
          onClick={handleLogoClick}
          aria-label="Return to Hero Section"
          className="pointer-events-auto group flex items-center gap-2 p-2 -ml-2 rounded-lg hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-[#FF3D9A]/60"
        >
          <svg
            viewBox="0 0 76 26"
            className="w-16 sm:w-20 h-auto overflow-visible transition-transform duration-300 group-hover:scale-105"
            aria-hidden="true"
          >
            <filter id="logoPinkGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#FF3D9A" floodOpacity="0.8" />
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#782BFF" floodOpacity="0.5" />
            </filter>

            <g filter="url(#logoPinkGlow)" stroke="#FFFFFF" strokeWidth="2.2" fill="none">
              {/* Triangle */}
              <polygon points="12,2 2,23 22,23" strokeLinejoin="round" />
              {/* Circle */}
              <circle cx="38" cy="12.5" r="10" />
              {/* Square */}
              <rect x="54" y="2.5" width="20" height="20" rx="1.5" strokeLinejoin="round" />
            </g>
          </svg>
        </button>

        {/* Top-Right Hamburger Menu */}
        <button
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-label="Open navigation menu"
          className="pointer-events-auto group flex items-center gap-2.5 px-3 py-2 -mr-2 rounded-lg hover:bg-white/5 transition-all focus:outline-none focus:ring-2 focus:ring-[#782BFF]/60"
        >
          <div className="relative w-5 h-4 flex flex-col justify-between py-[1px]">
            <span className="block w-full h-[1.8px] bg-white rounded-full transition-all group-hover:translate-x-0.5" />
            <span className="block w-full h-[1.8px] bg-white rounded-full transition-all group-hover:translate-x-1" />
            <span className="block w-full h-[1.8px] bg-white rounded-full transition-all group-hover:translate-x-0.5" />
          </div>
          <span className="text-xs font-mono tracking-[0.22em] text-white font-medium select-none group-hover:text-[#FF3D9A] transition-colors">
            MENU
          </span>
        </button>
      </header>

      {/* ========================================================
          LAYER 2 & 3: iOS FROSTED-GLASS FULLSCREEN OVERLAY
          Allows background image to stay recognizable behind the glass!
          ======================================================== */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-500 flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto ${
          isOpen
            ? "opacity-100 pointer-events-auto scale-100"
            : "opacity-0 pointer-events-none scale-[0.985]"
        }`}
        style={{
          backgroundColor: "rgba(8, 8, 16, 0.44)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
        }}
        aria-hidden={!isOpen}
      >
        {/* Subtle Ambient Color Diffusion inside the Glass Layer (LAYER 2) */}
        <div className="absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-[#782BFF]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute top-1/2 right-12 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-l from-[#FF3D9A]/22 via-[#782BFF]/12 to-transparent rounded-full blur-[140px] pointer-events-none" />

        {/* LAYER 3: Overlay Header Info */}
        <div className="relative z-10 flex items-center justify-between pb-6 pt-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-5 sm:gap-8">
            {/* Logo in overlay */}
            <button
              onClick={handleLogoClick}
              aria-label="Return to Hero Section"
              className="group flex items-center p-1 -ml-1 rounded focus:outline-none focus:ring-1 focus:ring-[#FF3D9A]"
            >
              <svg viewBox="0 0 76 26" className="w-16 sm:w-20 h-auto overflow-visible" aria-hidden="true">
                <g stroke="#FFFFFF" strokeWidth="2.2" fill="none">
                  <polygon points="12,2 2,23 22,23" strokeLinejoin="round" />
                  <circle cx="38" cy="12.5" r="10" />
                  <rect x="54" y="2.5" width="20" height="20" rx="1.5" strokeLinejoin="round" />
                </g>
              </svg>
            </button>

            {/* Label matching screenshot */}
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#FF3D9A] animate-ping" />
              <span className="font-mono text-[11px] sm:text-xs text-white/70 tracking-[0.2em] uppercase font-semibold">
                SAFEORA VAULT // CENTRAL DIRECTORY
              </span>
            </div>
          </div>

          {/* Close Pill Button & ESC helper */}
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close navigation menu"
              className="group flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/15 text-white text-xs font-mono tracking-widest transition-all duration-200 shadow-lg shadow-black/40 hover:border-[#FF3D9A]/60 focus:outline-none focus:ring-2 focus:ring-[#FF3D9A]"
            >
              <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200 text-[#FF3D9A]" />
              <span>CLOSE</span>
            </button>
            <span className="font-mono text-[10px] text-white/40 tracking-wider hidden sm:inline-block">
              PRESS ESC TO EXIT
            </span>
          </div>
        </div>

        {/* LAYER 3: Staggered Navigation Links */}
        <div className="relative z-10 my-auto py-8 max-w-4xl">
          <nav className="flex flex-col space-y-2 sm:space-y-3.5" aria-label="Main menu">
            {navLinks.map((item, index) => {
              if (item.href) {
                return (
                  <Link
                    key={item.num}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-baseline gap-4 sm:gap-6 py-2 px-3 -mx-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] hover:backdrop-blur-sm hover:translate-x-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF3D9A] transition-all duration-200 ${
                      isOpen ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <span className="font-mono text-xs sm:text-sm text-[#FF3D9A] font-semibold tracking-wider">
                      {item.num}
                    </span>
                    <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-[#FF3D9A] group-hover:to-[#782BFF] transition-all">
                      {item.label}
                    </span>
                    <span className="hidden md:inline-block text-xs font-mono text-white/40 group-hover:text-white/70 transition-colors ml-2 font-light">
                      — {item.desc}
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-[#FF3D9A] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all ml-auto self-center" />
                  </Link>
                );
              }

              return (
                <button
                  key={item.num}
                  onClick={item.action}
                  className={`group flex items-baseline gap-4 sm:gap-6 py-2 px-3 -mx-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] hover:backdrop-blur-sm hover:translate-x-1.5 text-left focus:outline-none focus:ring-1 focus:ring-[#FF3D9A] transition-all duration-200 ${
                    isOpen ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  <span className="font-mono text-xs sm:text-sm text-[#782BFF] font-semibold tracking-wider group-hover:text-[#FF3D9A] transition-colors">
                    {item.num}
                  </span>
                  <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-[#FF3D9A] group-hover:to-[#782BFF] transition-all">
                    {item.label}
                  </span>
                  <span className="hidden md:inline-block text-xs font-mono text-white/40 group-hover:text-white/70 transition-colors ml-2 font-light">
                    — {item.desc}
                  </span>
                  <span className="ml-auto text-xs font-mono text-[#782BFF] group-hover:text-[#FF3D9A] group-hover:translate-x-1 transition-all self-center opacity-0 group-hover:opacity-100">
                    GOTO →
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* LAYER 3: Overlay Footer */}
        <div className="relative z-10 border-t border-white/[0.08] pt-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40">
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-[#FF3D9A] flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Operator Sign In</span>
            </Link>
            <span>•</span>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="text-[#00f2fe] hover:underline"
            >
              Initialize New Vault
            </Link>
          </div>
          <div>AES-256-GCM • MERKLE ROOTS • ISO-27001 COMPLIANT</div>
        </div>
      </div>
    </>
  );
}
