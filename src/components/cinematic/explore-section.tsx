"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Lock, Eye, AlertTriangle, ArrowRight, Play, CheckCircle2, RefreshCw } from "lucide-react";

export function ExploreSection() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("INTEGRITY_VERIFIED_ROOT_VALID");
    }, 1800);
  };

  const defensePillars = [
    {
      num: "01",
      title: "Client-Side Zero Knowledge",
      subtitle: "AES-256-GCM Envelope Encryption",
      desc: "Every payload is sealed with a unique 96-bit nonce and client-derived key inside Web Crypto before leaving the browser. The server only receives opaque ciphertext.",
      icon: Lock,
      status: "SECURE",
      color: "#782BFF",
    },
    {
      num: "02",
      title: "Tamper-Evident Merkle Proofs",
      subtitle: "Signed 64KB Chunk Manifests",
      desc: "Documents are split into deterministic 64KB chunks and assembled into a cryptographic Merkle tree. Any bit-rot, truncation, or unauthorized alteration invalidates the root signature immediately.",
      icon: Eye,
      status: "CONTINUOUS",
      color: "#FF3D9A",
    },
    {
      num: "03",
      title: "Autonomous Session Quarantine",
      subtitle: "Zero-Latency Threat Containment",
      desc: "Upon detection of signature mismatch or token anomaly, containment triggers instantly: rogue sessions are invalidated, compromised keys isolated, and alert logs dispatched.",
      icon: AlertTriangle,
      status: "ACTIVE",
      color: "#F20B48",
    },
    {
      num: "04",
      title: "Isolated Recovery Promotion",
      subtitle: "Pre-Verified Air-Gapped Restore",
      desc: "Recovery replicas are maintained in segregated storage. Before restoring, Phoenix cryptographically verifies the clean copy against tamper-proof manifests.",
      icon: Shield,
      status: "STANDBY",
      color: "#00f2fe",
    },
  ];

  return (
    <section
      id="explore"
      className="relative min-h-[100svh] w-full py-24 sm:py-32 px-6 sm:px-12 bg-[#050609] border-t border-white/[0.04] flex flex-col justify-center overflow-hidden"
      aria-label="Explore Section"
    >
      {/* Background Neon Atmospheric Glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#782BFF]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-[#FF3D9A]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cyber Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(to right, #ffffff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#782BFF] animate-ping" />
              <span className="font-mono text-xs text-[#782BFF] tracking-[0.25em] uppercase font-bold">
                02 // AUTONOMOUS DEFENSE CHAMBER
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              A Living Sentinel, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#782BFF] via-[#FF3D9A] to-[#00f2fe]">
                Not a Passive Storage Box
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="px-4 py-2.5 rounded-xl border border-[#782BFF]/40 bg-[#782BFF]/10 hover:bg-[#782BFF]/20 text-[#a855f7] hover:text-white font-mono text-xs flex items-center gap-2 transition-all shadow-lg shadow-[#782BFF]/10 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-[#FF3D9A]" : ""}`} />
              <span>{isScanning ? "VERIFYING MANIFEST..." : "TEST MERKLE ROOT"}</span>
            </button>
            <Link
              href="/rehearsal"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#782BFF] to-[#FF3D9A] text-white font-medium text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-lg shadow-[#FF3D9A]/20"
            >
              <span>Breach Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Integrity Banner Feedback if tested */}
        {scanResult && (
          <div className="mb-8 p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 font-mono text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>STATUS: [200 OK] — MERKLE CHUNK INTEGRITY VERIFIED (0 TAMPERING DETECTED)</span>
            </div>
            <span className="text-[10px] text-emerald-500">DIGITAL SIGNATURE VALID</span>
          </div>
        )}

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {defensePillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.num}
                className="group relative p-8 rounded-2xl bg-[#090b14]/80 border border-white/[0.06] hover:border-[#782BFF]/40 transition-all duration-300 backdrop-blur-xl hover:shadow-[0_0_30px_rgba(120,43,255,0.1)]"
              >
                {/* Corner accent glow */}
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-tr-2xl blur-2xl opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none"
                  style={{ backgroundColor: pillar.color }}
                />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${pillar.color}15`,
                        borderColor: `${pillar.color}35`,
                        color: pillar.color,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] font-bold text-white/40 block">
                        PROTOCOL {pillar.num}
                      </span>
                      <span
                        className="font-mono text-[10px] tracking-wider uppercase font-semibold"
                        style={{ color: pillar.color }}
                      >
                        {pillar.status}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-[#FF3D9A] transition-colors">
                  {pillar.title}
                </h3>
                <h4 className="text-xs font-mono text-[#00f2fe]/80 mt-1">
                  {pillar.subtitle}
                </h4>

                <p className="mt-4 text-sm text-slate-400 leading-relaxed font-light">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
