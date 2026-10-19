"use client";

import { useState } from "react";

interface BackToTopProps {
  onScrollToTop: () => void;
}

export function BackToTop({ onScrollToTop }: BackToTopProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-7 sm:bottom-9 right-7 sm:right-11 z-50">
      {/* Tooltip on hover */}
      <div
        className={`absolute bottom-11 right-0 px-2.5 py-1 rounded bg-[#0a0f1d]/90 border border-white/10 backdrop-blur-md pointer-events-none transition-all duration-200 whitespace-nowrap shadow-lg shadow-black/50 ${
          isHovered ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-1"
        }`}
      >
        <span className="font-mono text-[10px] text-white/80 tracking-widest uppercase">
          Back to Top
        </span>
      </div>

      <button
        onClick={onScrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Back to top"
        className="group relative flex items-center justify-center p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D9A] transition-transform duration-300 hover:scale-110 active:scale-95"
      >
        {/* Subtle Ambient Glow Behind Star */}
        <span
          className="absolute inset-0 rounded-full bg-[#FF3D9A]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />

        {/* 4-pointed sparkle star SVG */}
        <svg
          viewBox="0 0 28 28"
          className="w-7 sm:w-8 h-7 sm:h-8 relative z-10 overflow-visible transition-all duration-500 group-hover:rotate-45"
          style={{
            filter: isHovered
              ? "drop-shadow(0 0 8px #FF3D9A) drop-shadow(0 0 16px #782BFF)"
              : "drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))",
          }}
          aria-hidden="true"
        >
          <path
            d="M14 2 Q14 14 2 14 Q14 14 14 26 Q14 14 26 14 Q14 14 14 2 Z"
            fill={isHovered ? "#FFFFFF" : "#E2E8F0"}
            stroke={isHovered ? "#FF3D9A" : "rgba(255,255,255,0.6)"}
            strokeWidth="0.8"
            className="transition-colors duration-300"
          />
        </svg>
      </button>
    </div>
  );
}
