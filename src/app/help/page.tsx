"use client";

import React from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  HelpCircle,
  Shield,
  Lock,
  FileCheck,
  RotateCcw,
  Flame,
  Key,
  AlertTriangle,
  Terminal,
  Database,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  const sections = [
    {
      id: "concept",
      title: "1. What is SAFEORA?",
      icon: Shield,
      content: `SAFEORA is a Self-Defending Document Security Vault designed to protect sensitive organizational records from tampering, ransomware, and silent corruption.
Unlike traditional cloud storage that passively holds files, SAFEORA actively guards documents through client-side encryption, authenticated Merkle manifests, continuous integrity checks, and automated session containment.`,
    },
    {
      id: "encryption",
      title: "2. Client-Side Encryption & Key Strategy",
      icon: Lock,
      content: `• Algorithm: AES-256-GCM (Authenticated Encryption with Associated Data via Web Crypto API).
• Nonce Management: Every encryption operation uses a cryptographically secure, random 96-bit (12-byte) IV. Nonces are never reused with the same key.
• Zero-Knowledge Architecture: Encryption keys are generated in your browser memory. The server receives ONLY ciphertext envelopes. If the server database is compromised, an attacker obtains only encrypted bytes without the decryption keys.
• Key Fingerprints: A deterministic SHA-256 key fingerprint allows users to confirm key matches without transmitting or exposing the secret key.`,
    },
    {
      id: "manifests",
      title: "3. Tamper-Evident Integrity Manifests",
      icon: FileCheck,
      content: `• Chunking: Ciphertext files are divided into deterministic 64KB chunks.
• Ordered Hashing: Each chunk is hashed with SHA-256.
• Merkle Tree Root: Chunk hashes are combined pairwise up to a single Merkle Root.
• Canonical Serialization: The manifest payload is serialized using strict canonical JSON conventions to guarantee deterministic representation.
• Digital Signatures: The canonical manifest is signed by an isolated KMS signing service.
• Critical Distinction: A hash alone is NOT a signature. If an attacker could rewrite both a file and its stored hash, naive comparisons would pass. The digital signature authenticates that the manifest was produced by an authorized entity possessing the signing secret.`,
    },
    {
      id: "recovery",
      title: "4. Independent Recovery Copies & Pre-Verification",
      icon: RotateCcw,
      content: `• Segregated Storage: Every version upload generates an immutable replica in a separate recovery storage namespace.
• Pre-Restoration Verification: Before any recovery copy can overwrite or roll forward an active document, SAFEORA re-verifies the digital signature and chunk hashes of the recovery replica.
• Anti-Rollback Defense: Version numbers strictly increment. An attacker cannot force rollback to an obsolete or insecure prior version.`,
    },
    {
      id: "rehearsal",
      title: "5. Breach Rehearsal & Recovery Proof Engine",
      icon: Flame,
      content: `SAFEORA features a built-in rehearsal suite that executes 5 real, controlled security scenarios within isolated synthetic fixtures:
• Scenario A (Document Tampering): Proves that changing a single byte in ciphertext triggers chunk and Merkle root failure.
• Scenario B (Manifest Tampering): Proves that forging manifest metadata without the private signing key fails signature authentication.
• Scenario C (Unauthorized Session): Confirms automated containment revokes a rogue session without disrupting valid users.
• Scenario D (Verified Recovery): Corrupts a primary copy, verifies failure, pre-verifies the recovery replica, and executes clean restoration.
• Scenario E (Bulk Activity): Generates rapid-fire synthetic requests exceeding rate thresholds to test automated anomaly containment.`,
    },
    {
      id: "limitations",
      title: "6. Honest Security Assumptions & Boundaries",
      icon: AlertTriangle,
      content: `• Not 100% Secure: No system can guarantee immunity from all attacks.
• Endpoint Dependency: If the user's browser or device is compromised with malware or a rogue extension, keys can be intercepted before client-side encryption.
• Signing Secret Isolation: Signatures protect integrity only as long as the signing secret is kept outside the attacker's write authority.
• Development Simulation: In local mode, recovery storage resides in separate filesystem directories simulating cloud bucket isolation. In production, distinct AWS S3 buckets with independent IAM permissions should be configured.`,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <span>HELP & DOCUMENTATION</span>
            <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              ARCHITECTURE GUIDE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Technical explanation of cryptographic foundations, recovery workflows, and rehearsal testing
          </p>
        </div>

        {/* Quick Links Banner */}
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
            <Terminal className="w-4 h-4" />
            <span>Ready to test the defense engine?</span>
          </div>
          <Link
            href="/rehearsal"
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-red-500 text-navy-950 font-bold text-xs flex items-center gap-1.5"
          >
            <span>Launch Rehearsal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div key={sec.id} className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-3">
                <div className="flex items-center gap-2.5 border-b border-navy-800 pb-3">
                  <div className="p-2 rounded-lg bg-navy-900 border border-navy-800 text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">{sec.title}</h3>
                </div>
                <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                  {sec.content}
                </div>
              </div>
            );
          })}
        </div>

        {/* Commands Reference Card */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-3 text-xs font-mono">
          <h3 className="text-sm font-bold text-white font-mono border-b border-navy-800 pb-2">
            DEVELOPER COMMAND CHEATSHEET
          </h3>
          <div className="space-y-1.5 text-slate-300">
            <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
              <span className="text-cyan-400">npm test</span> — Run Vitest unit and integration test suite
            </div>
            <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
              <span className="text-cyan-400">npm run dev</span> — Launch local Next.js development server on http://localhost:3000
            </div>
            <div className="p-2 rounded-lg bg-navy-900 border border-navy-800">
              <span className="text-cyan-400">npx tsx prisma/seed.ts</span> — Seed development demo user & sample vault document
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
