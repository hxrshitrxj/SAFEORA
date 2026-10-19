"use client";

import { useState, useEffect } from "react";
import { CinematicHeader } from "./header";
import { HeroSection } from "./hero-section";
import { ExploreSection } from "./explore-section";
import { DiscoverSection } from "./discover-section";
import { SideNav } from "./side-nav";
import { BackToTop } from "./back-to-top";
import Link from "next/link";
import {
  Lock,
  Eye,
  AlertTriangle,
  Shield,
  FileCheck,
  RotateCcw,
  Terminal,
  KeyRound,
  Database,
  Flame,
} from "lucide-react";

export function MasterCinematicLanding() {
  const [activeSection, setActiveSection] = useState<string>("hero");

  // Track active section via IntersectionObserver for SideNav
  useEffect(() => {
    const sectionIds = ["hero", "explore", "discover"];
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "-20% 0px -40% 0px",
      threshold: 0.2,
    });

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveSection("hero");
  };

  // Full technical workflow steps preserved from Safeora Vault
  const workflowSteps = [
    {
      num: "01",
      title: "Protect",
      icon: Lock,
      desc: "Client-side AES-256-GCM encryption in your browser before upload. Server never sees plaintext or keys.",
      tag: "Client-Side",
    },
    {
      num: "02",
      title: "Monitor",
      icon: Eye,
      desc: "Tamper-evident Merkle tree chunk manifests authenticated with digital signatures and timestamped proofs.",
      tag: "Tamper-Evident",
    },
    {
      num: "03",
      title: "Detect",
      icon: AlertTriangle,
      desc: "Continuous integrity checks detecting bit-rot, unauthorized tampering, or forged manifest signatures.",
      tag: "Real-Time",
    },
    {
      num: "04",
      title: "Contain",
      icon: Shield,
      desc: "Automated session revocation, document quarantine, and threshold containment without manual delay.",
      tag: "Zero-Latency",
    },
    {
      num: "05",
      title: "Verify",
      icon: FileCheck,
      desc: "Rigorous cryptographic pre-verification of isolated recovery copies before permitting any restoration.",
      tag: "Pre-Verified",
    },
    {
      num: "06",
      title: "Recover",
      icon: RotateCcw,
      desc: "Promote verified recovery copies into the primary vault with atomic version increments and audit logging.",
      tag: "Resilient",
    },
    {
      num: "07",
      title: "Report",
      icon: Terminal,
      desc: "Verifiable incident and rehearsal proof reports exportable in structured JSON and Markdown.",
      tag: "Audit-Ready",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#050609] text-slate-100 flex flex-col overflow-x-hidden selection:bg-[#FF3D9A]/30 selection:text-white">
      {/* LAYER 1: Deep Cinematic Ambient Atmosphere & Room Glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden bg-[#050609]"
        aria-hidden="true"
      >
        {/* Soft atmospheric room glows */}
        <div className="absolute top-1/4 -left-32 w-[600px] h-[600px] rounded-full blur-[160px] bg-[#782BFF]/15" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full blur-[160px] bg-[#FF3D9A]/15" />
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#030407] via-[#050609]/90 to-transparent" />
      </div>

      {/* 1. Top Cinematic Header (Logo △ ○ ▢ & Hamburger MENU + iOS Frosted Glass Overlay) */}
      <CinematicHeader onNavigate={handleNavigate} />

      {/* 2. Interactive Right-Side Vertical Navigation Indicators */}
      <SideNav activeSection={activeSection} onNavigate={handleNavigate} />

      {/* 3. Floating Bottom-Right 4-Point Sparkle Star (Back to Top) */}
      <BackToTop onScrollToTop={handleScrollToTop} />

      {/* 4. Section 1: Hero (HOME) */}
      <HeroSection onExploreClick={() => handleNavigate("explore")} />

      {/* 5. Section 2: Explore Section (EXPLORE) */}
      <ExploreSection />

      {/* 6. Section 3: Discover Section (DISCOVER) */}
      <DiscoverSection />

      {/* 7. Continued Detailed Architectural Workflow */}
      <section
        id="workflow"
        className="py-24 border-t border-white/[0.05] bg-[#070913]/60 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono tracking-widest text-[#00f2fe] uppercase font-bold">
              Complete Closed-Loop Pipeline
            </h2>
            <p className="mt-2 text-2xl sm:text-4xl font-extrabold text-white">
              Protect → Monitor → Detect → Contain → Verify → Recover → Report
            </p>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              Safeora replaces passive file storage with a continuous, closed-loop defensive pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.slice(0, 4).map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl border border-white/[0.06] bg-[#0a0f1d]/60 backdrop-blur-md hover:border-[#782BFF]/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#00f2fe] font-semibold">
                      {step.num} // {step.tag}
                    </span>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <Icon className="w-5 h-5 text-[#00f2fe]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {workflowSteps.slice(4).map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-2xl border border-white/[0.06] bg-[#0a0f1d]/60 backdrop-blur-md hover:border-[#FF3D9A]/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs text-[#FF3D9A] font-semibold">
                      {step.num} // {step.tag}
                    </span>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                      <Icon className="w-5 h-5 text-[#FF3D9A]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. Honest Security Assumptions & Limitations */}
      <section
        id="limitations"
        className="py-20 border-t border-white/[0.05] bg-[#050609] relative z-10"
      >
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="p-8 sm:p-10 rounded-2xl border border-amber-500/25 bg-amber-950/10 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-bold text-white">
                Honest Security Assumptions & Boundaries
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed font-light">
              Safeora is engineered with genuine Web Crypto AES-256-GCM primitives and Merkle tree verification. We believe in transparent engineering assumptions:
            </p>
            <ul className="mt-5 space-y-3 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Client Endpoint Security:</strong> Client-side encryption relies on browser integrity. Compromised endpoints (keyloggers, malicious extensions) can intercept keys before encryption.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Signing Key Boundary:</strong> Manifest digital signatures authenticate integrity only while the signing key remains isolated from attacker write authority.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Local Simulation Boundary:</strong> In local mode, recovery copies reside in segregated filesystem directories simulating an air-gapped boundary. For production, AWS S3 with separate IAM policies is used.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>
                  <strong>Key Loss:</strong> Because documents are encrypted with client-held keys, losing the key means the document cannot be decrypted, by design.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 9. Minimal Cinematic Footer */}
      <footer className="border-t border-white/[0.06] py-12 bg-[#030407] mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 76 26" className="w-12 h-auto opacity-70" aria-hidden="true">
              <g stroke="#FFFFFF" strokeWidth="2" fill="none">
                <polygon points="12,2 2,23 22,23" strokeLinejoin="round" />
                <circle cx="38" cy="12.5" r="10" />
                <rect x="54" y="2.5" width="20" height="20" rx="1.5" strokeLinejoin="round" />
              </g>
            </svg>
            <span className="font-bold text-xs tracking-wider text-white font-mono">
              SAFEORA VAULT
            </span>
            <span className="text-[11px] text-slate-500">
              © 2026. Self-Defending Document Security.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
            <Link href="/help" className="hover:text-[#FF3D9A] transition-colors">
              Documentation
            </Link>
            <Link href="/login" className="hover:text-[#FF3D9A] transition-colors">
              Operator Sign In
            </Link>
            <Link href="/register" className="hover:text-[#FF3D9A] transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
