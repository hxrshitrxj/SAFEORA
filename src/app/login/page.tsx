"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Key } from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Authentication failed.");
        error("Login Failed", data.error || "Please check your credentials.");
      } else {
        success("Access Granted", `Welcome back, ${data.user.name}`);
        let redirectTarget = "/dashboard";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const customRedirect = params.get("redirect");
          if (customRedirect && customRedirect.startsWith("/")) {
            redirectTarget = customRedirect;
          }
        }
        window.location.href = redirectTarget;
      }
    } catch (err: any) {
      setFormError(err?.message || "Network or server connection failed.");
      error("Connection Error", err?.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setEmail("demo@safeora-vault.local");
    setPassword("SafeoraVaultDemo2026!");
    setFormError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@safeora-vault.local",
          password: "SafeoraVaultDemo2026!",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Demo authentication failed.");
        error("Login Failed", data.error || "Please check credentials.");
      } else {
        success("Access Granted", `Welcome back, ${data.user.name}`);
        let redirectTarget = "/dashboard";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const customRedirect = params.get("redirect");
          if (customRedirect && customRedirect.startsWith("/")) {
            redirectTarget = customRedirect;
          }
        }
        window.location.href = redirectTarget;
      }
    } catch (err: any) {
      setFormError(err?.message || "Network or server connection failed.");
      error("Connection Error", err?.message || "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("demo@safeora-vault.local");
    setPassword("SafeoraVaultDemo2026!");
    setFormError("");
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-navy-950 font-bold" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">SAFEORA VAULT</h1>
          <p className="text-sm text-slate-400 mt-1">Authenticate to access protected cryptographic assets</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 rounded-2xl border border-navy-800 shadow-2xl">
          {formError && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-navy-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Instant Demo Access Buttons */}
          <div className="mt-5 pt-5 border-t border-navy-800 space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={handleInstantDemoLogin}
              className="w-full py-2.5 px-3 rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-950/60 via-blue-950/50 to-cyan-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/10 disabled:opacity-50"
            >
              <Key className="w-4 h-4 text-cyan-400" />
              <span>⚡ One-Click Demo Access</span>
            </button>

            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full py-1.5 px-3 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Auto-Fill Credentials Form</span>
            </button>
          </div>

          {/* Explicit Credentials Info Box */}
          <div className="mt-4 p-3 rounded-xl bg-navy-900/90 border border-cyan-500/20 text-xs font-mono flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300 tracking-wider">SEEDED DEMO CREDENTIALS</span>
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">READY</span>
            </div>
            <div className="text-slate-300 text-[11px] mt-1">
              User: <span className="text-cyan-300 font-semibold select-all">demo@safeora-vault.local</span>
            </div>
            <div className="text-slate-300 text-[11px]">
              Pass: <span className="text-cyan-300 font-semibold select-all">SafeoraVaultDemo2026!</span>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don&apos;t have a protected vault yet?{" "}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
            Register new account
          </Link>
        </p>
      </div>
    </div>
  );
}
