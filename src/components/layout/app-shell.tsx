"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  FileText,
  History,
  Activity,
  Flame,
  AlertCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Compass,
  Grid,
  Sparkles,
  Lock,
  Layers,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";
import { NavTunnel3D, NAV_CATEGORIES } from "@/components/cinematic/nav-tunnel-3d";

interface AppShellProps {
  children: React.ReactNode;
}

interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error } = useToast();

  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [is3dNavOpen, setIs3dNavOpen] = useState(false);

  // Check initial URL query param (e.g. ?nav=open or ?nav=3d)
  useEffect(() => {
    const navParam = searchParams?.get("nav");
    if (navParam === "open" || navParam === "3d") {
      setIs3dNavOpen(true);
    }
  }, [searchParams]);

  // Auth verification
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // Global keyboard shortcut: Press ESC to toggle 3D Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setIs3dNavOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      success("Logged out", "Session terminated securely.");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const handleQuickVerifyAll = async () => {
    setVerifyingAll(true);
    try {
      const res = await fetch("/api/security/verify-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        if (data.failed > 0) {
          error(
            "Integrity Alert",
            `${data.failed} document(s) failed verification and have been contained.`
          );
        } else {
          success(
            "Vault Integrity Confirmed",
            `All ${data.total} document(s) verified intact against manifests.`
          );
        }
      } else {
        error("Verification failed", data.error);
      }
    } catch (err: any) {
      error("Verification failed", err.message);
    } finally {
      setVerifyingAll(false);
    }
  };

  // Find active category
  const activeCategory = NAV_CATEGORIES.find(
    (c) => c.href === pathname || (c.href !== "/dashboard" && pathname.startsWith(c.href))
  ) || NAV_CATEGORIES[0];

  const ActiveIcon = activeCategory.icon;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030610] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-cyan-300 font-mono tracking-wider">
            INITIALIZING PHOENIX VAULT...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col min-w-0 selection:bg-cyan-500/30 selection:text-white">
      {/* 3D FLOATING NAVIGATION TUNNEL OVERLAY */}
      {is3dNavOpen && (
        <NavTunnel3D
          currentPath={pathname}
          isOverlay={true}
          onClose={() => setIs3dNavOpen(false)}
          onSelectCategory={(href) => {
            setIs3dNavOpen(false);
            router.push(href);
          }}
        />
      )}

      {/* TOP COMMAND CENTER HUD (Replaces permanent sidebar) */}
      <header className="h-16 border-b border-navy-800 bg-[#070b18]/90 backdrop-blur-xl px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Left Section: Brand & 3D Navigation Trigger */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform flex-shrink-0 border border-cyan-400/30">
              <Shield className="w-5 h-5 text-navy-950" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-sm tracking-wider text-white font-mono">
                PHOENIX
              </span>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest -mt-0.5">
                Self-Defending
              </span>
            </div>
          </Link>

          {/* PROMINENT 3D NAVIGATION TRIGGER BUTTON */}
          <button
            onClick={() => setIs3dNavOpen(true)}
            aria-label="Open 3D Navigation Tunnel"
            className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-purple-500/20 border border-cyan-400/40 hover:border-cyan-300 text-cyan-300 hover:text-white transition-all shadow-[0_0_15px_rgba(0,242,254,0.15)] hover:shadow-[0_0_25px_rgba(0,242,254,0.35)] active:scale-95"
            title="Open 3D Floating Navigation Tunnel (ESC)"
          >
            <Compass className="w-4 h-4 text-cyan-400 group-hover:rotate-45 transition-transform duration-300" />
            <span className="font-mono text-xs font-bold tracking-wider">3D NAV</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 font-mono hidden md:inline">
              ESC
            </span>
          </button>

          {/* Current Active Category Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono">
            <ActiveIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">LOCATION:</span>
            <span className="text-white font-semibold">{activeCategory.name}</span>
          </div>
        </div>

        {/* Center Section: Cryptographic Status Heartbeat */}
        <div className="hidden xl:flex items-center gap-3 text-xs font-mono text-gray-400">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-navy-900/60 border border-navy-800">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-400 font-semibold">AES-256-GCM</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">CLIENT-SIDE</span>
          </div>
          <span className="text-emerald-400 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>DEFENSE ACTIVE</span>
          </span>
        </div>

        {/* Right Section: Actions & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Action: Verify All Documents */}
          <button
            onClick={handleQuickVerifyAll}
            disabled={verifyingAll}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all disabled:opacity-50"
            title="Run cryptographic integrity verification across all documents"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                verifyingAll ? "animate-spin text-cyan-400" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {verifyingAll ? "Verifying..." : "Verify All Vault"}
            </span>
            <span className="sm:hidden">Verify</span>
          </button>

          {/* Breach Rehearsal Fast Link */}
          <Link
            href="/rehearsal"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 transition-all"
            title="Open Breach Rehearsal Simulator"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Rehearsal</span>
            <ChevronRight className="w-3 h-3 text-amber-400" />
          </Link>

          {/* User Profile Card & Logout */}
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-navy-800">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                {user?.name}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono tracking-wider">
                {user?.role || "OPERATOR"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-navy-800 transition-colors"
              title="Sign out securely"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* FULL-WIDTH PAGE CONTENT VIEWPORT (No permanent sidebar eating space) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
