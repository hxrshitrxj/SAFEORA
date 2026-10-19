"use client";

import Link from "next/link";
import { Lock, Activity, ShieldCheck, History, ArrowRight, ExternalLink, Terminal } from "lucide-react";

export function DiscoverSection() {
  const modules = [
    {
      id: "vault",
      title: "Document Vault Console",
      badge: "CORE ENGINE",
      desc: "Client-side AES-256-GCM encryption with browser-held master keys. Upload, inspect chunk manifests, and store critical confidential records.",
      href: "/vault",
      icon: Lock,
      stats: "256-bit GCM • Nonce-Isolated",
      color: "#FF3D9A",
    },
    {
      id: "rehearsal",
      title: "Breach Rehearsal Lab",
      badge: "SIMULATION SUITE",
      desc: "Run 5 automated attack scenarios: manifest forgery, bit-rot injection, unauthorized token reuse, and rapid bulk activity in isolated sandboxes.",
      href: "/rehearsal",
      icon: Activity,
      stats: "5 Attack Models • Safe Fixtures",
      color: "#782BFF",
    },
    {
      id: "security",
      title: "Integrity & Posture Monitor",
      badge: "TELEMETRY",
      desc: "Real-time posture score, active quarantine state, Merkle signature validation logs, and automated incident response telemetry.",
      href: "/security",
      icon: ShieldCheck,
      stats: "Continuous Scan • 0 Latency",
      color: "#00f2fe",
    },
    {
      id: "versions",
      title: "Tamper-Evident Version Ledger",
      badge: "AUDIT TRAIL",
      desc: "Cryptographically chained document history. Air-gapped recovery copies are verified before promotion to prevent poisoned restorations.",
      href: "/versions",
      icon: History,
      stats: "Atomic Roll-Forward • Immutable",
      color: "#F20B48",
    },
  ];

  return (
    <section
      id="discover"
      className="relative min-h-[100svh] w-full py-24 sm:py-32 px-6 sm:px-12 bg-[#050609] border-t border-white/[0.04] flex flex-col justify-center overflow-hidden"
      aria-label="Discover Section"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] bg-[#FF3D9A]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-[#782BFF]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FF3D9A]/30 bg-[#FF3D9A]/10 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FF3D9A] animate-pulse" />
            <span className="font-mono text-xs text-[#FF3D9A] tracking-[0.25em] uppercase font-bold">
              03 // DISCOVER THE ARSENAL
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Production-Minded Security <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF3D9A] via-[#782BFF] to-[#00f2fe]">
              Ready for Real Scenarios
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            Every module in Safeora is wired into real cryptographic routines — from Web Crypto AES-256 envelope keys to Merkle tree chunk manifests.
          </p>
        </div>

        {/* 4 Feature Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className="group relative p-8 rounded-2xl bg-[#090b14]/70 border border-white/[0.06] hover:border-[#FF3D9A]/50 transition-all duration-300 backdrop-blur-xl hover:shadow-[0_0_35px_rgba(255,61,154,0.12)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 tracking-widest uppercase">
                      {mod.badge}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${mod.color}15`,
                        borderColor: `${mod.color}35`,
                        color: mod.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#FF3D9A] transition-colors">
                    {mod.title}
                  </h3>

                  <p className="mt-3 text-sm text-slate-400 font-light leading-relaxed">
                    {mod.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                  <span className="font-mono text-xs text-white/40">
                    {mod.stats}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#FF3D9A] group-hover:translate-x-1 transition-transform">
                    <span>LAUNCH</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Global Call to Action Bar */}
        <div className="p-8 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-[#090b14] via-[#101324] to-[#090b14] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#782BFF]/20 border border-[#782BFF]/40 flex items-center justify-center text-[#a855f7]">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Experience Safeora In Action</h4>
              <p className="text-xs text-slate-400 font-light">
                Sign in with demo credentials or initialize a new cryptographic vault now.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/login"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all"
            >
              Demo Sign In
            </Link>
            <Link
              href="/register"
              className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF3D9A] to-[#782BFF] hover:from-[#f72585] hover:to-[#5425FF] text-white text-xs font-semibold shadow-lg shadow-[#FF3D9A]/20 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Create Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
