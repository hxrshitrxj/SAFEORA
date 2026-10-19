"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Key, Zap, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useToast();
  // Pre-populate demo credentials so user can authenticate immediately without typing
  const [email, setEmail] = useState("demo@safeora-vault.local");
  const [password, setPassword] = useState("SafeoraVaultDemo2026!");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const saveAuthTokenLocally = (token: string) => {
    if (typeof window !== "undefined" && token) {
      try {
        localStorage.setItem("safeora_session_token", token);
        localStorage.setItem("phoenix_session_token", token);
      } catch (e) {
        console.warn("Could not save token to localStorage:", e);
      }

      // Also set client-side document cookie fallback for browsers/laptops that filter Set-Cookie headers
      try {
        document.cookie = `safeora_vault_session=${token}; path=/; max-age=604800; SameSite=Lax`;
        document.cookie = `phoenix_vault_session=${token}; path=/; max-age=604800; SameSite=Lax`;
      } catch (e) {
        console.warn("Could not set document.cookie:", e);
      }
    }
  };

  const getRedirectTarget = () => {
    let redirectTarget = "/dashboard";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const customRedirect = params.get("redirect");
      if (customRedirect && customRedirect.startsWith("/")) {
        redirectTarget = customRedirect;
      }
    }
    return redirectTarget;
  };

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
        if (data.token) {
          saveAuthTokenLocally(data.token);
        }
        success("Access Granted", `Welcome back, ${data.user.name}`);
        window.location.href = getRedirectTarget();
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
        if (data.token) {
          saveAuthTokenLocally(data.token);
        }
        success("Access Granted", `Welcome back, ${data.user.name}`);
        window.location.href = getRedirectTarget();
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

          {/* ⚡ ONE-CLICK INSTANT ACCESS (HERO BUTTON) */}
          <div className="mb-6">
            <button
              type="button"
              disabled={loading}
              onClick={handleInstantDemoLogin}
              className="w-full py-3 px-4 rounded-xl font-bold text-navy-950 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 hover:from-emerald-300 hover:to-blue-400 shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 group hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                  <span>Entering Vault...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-navy-950 fill-navy-950 group-hover:scale-110 transition-transform" />
                  <span>⚡ One-Click Instant Access</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-1.5 font-mono">
              Direct access with seeded demo privileges • No typing required
            </p>
          </div>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-navy-800"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Or Authenticate With Credentials
            </span>
            <div className="flex-grow border-t border-navy-800"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300" htmlFor="email">
                  Email Address
                </label>
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                >
                  Reset Demo Creds
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@safeora-vault.local"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-xs"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-navy-800 hover:bg-navy-700 border border-cyan-500/30 hover:border-cyan-400/60 shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Sign In To Vault</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </>
              )}
            </button>
          </form>

          {/* Seeded Credentials Card */}
          <div className="mt-5 p-3 rounded-xl bg-navy-900/90 border border-cyan-500/20 text-xs font-mono flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold text-slate-300 tracking-wider">SEEDED DEMO CREDENTIALS</span>
              <span className="text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">ACTIVE</span>
            </div>
            <div className="text-slate-300 text-[11px]">
              User: <span className="text-cyan-300 font-semibold select-all">demo@safeora-vault.local</span>
            </div>
            <div className="text-slate-300 text-[11px]">
              Pass: <span className="text-cyan-300 font-semibold select-all">SafeoraVaultDemo2026!</span>
            </div>
            <div className="pt-1 border-t border-navy-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400/90">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Cookies + LocalStorage Dual-Authentication Enabled</span>
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
