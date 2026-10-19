"use client";

import { useEffect, useState } from "react";

interface SideNavProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function SideNav({ activeSection, onNavigate }: SideNavProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sections = [
    { id: "hero", label: "HOME", sub: "Cinematic Sentinel" },
    { id: "explore", label: "EXPLORE", sub: "Autonomous Defense" },
    { id: "discover", label: "DISCOVER", sub: "Cryptographic Arsenal" },
  ];

  return (
    <nav
      aria-label="Section navigation"
      className="fixed right-6 sm:right-10 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-5 select-none"
    >
      {sections.map((sec, idx) => {
        const isActive = activeSection === sec.id;
        const isHovered = hoveredIndex === idx;

        return (
          <div
            key={sec.id}
            className="relative flex items-center justify-end"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Tooltip on hover */}
            <div
              className={`absolute right-10 px-3 py-1 rounded bg-[#0a0f1d]/90 border border-white/10 backdrop-blur-md pointer-events-none transition-all duration-200 whitespace-nowrap shadow-lg shadow-black/50 ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-2"
              }`}
            >
              <span className="font-mono text-[10px] text-[#FF3D9A] font-semibold mr-1.5">
                0{idx + 1} //
              </span>
              <span className="font-mono text-[11px] text-white tracking-wider">
                {sec.label}
              </span>
            </div>

            {/* Clickable Indicator */}
            <button
              onClick={() => onNavigate(sec.id)}
              aria-label={`Scroll to ${sec.label} section`}
              aria-current={isActive ? "step" : undefined}
              className="group flex items-center justify-end py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D9A] rounded-full"
            >
              {isActive ? (
                /* Active: Horizontal neon bar + glowing circular marker */
                <div className="flex items-center gap-1.5 animate-fadeIn">
                  <span
                    className="w-5 sm:w-6 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#FF3D9A] to-white"
                    style={{
                      boxShadow: "0 0 8px #FF3D9A, 0 0 16px #782BFF",
                    }}
                  />
                  <div className="relative flex items-center justify-center">
                    <span
                      className="w-3 h-3 rounded-full border-[1.5px] border-white bg-[#FF3D9A]"
                      style={{
                        boxShadow:
                          "0 0 10px #FF3D9A, 0 0 20px #782BFF, inset 0 0 4px #ffffff",
                      }}
                    />
                    <span className="absolute w-1 h-1 rounded-full bg-white animate-ping opacity-75" />
                  </div>
                </div>
              ) : (
                /* Inactive: Clean outlined circle */
                <span className="w-2.5 h-2.5 rounded-full border border-white/40 group-hover:border-white group-hover:scale-125 group-hover:shadow-[0_0_8px_#FF3D9A] transition-all duration-300" />
              )}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
