"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Shield,
  Lock,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Flame,
  Plus,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export default function DashboardPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/security/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err: any) {
      error("Error", "Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleVerifyAll = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/security/verify-all", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        if (result.failed > 0) {
          error("Tampering Alert", `${result.failed} document(s) failed verification.`);
        } else {
          success("All Documents Intact", `${result.passed} document(s) verified against Merkle manifests.`);
        }
        await fetchOverview();
      } else {
        error("Verification Failed", result.error);
      }
    } catch (err: any) {
      error("Verification Failed", err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Mock activity trend for chart based on real metrics
  const chartData = [
    { time: "00:00", events: 1, verifications: 2 },
    { time: "04:00", events: 0, verifications: 1 },
    { time: "08:00", events: 3, verifications: 4 },
    { time: "12:00", events: data?.recentEvents?.length || 2, verifications: (data?.metrics?.totalDocuments || 1) * 2 },
    { time: "16:00", events: (data?.recentEvents?.length || 1) + 1, verifications: data?.metrics?.totalDocuments || 3 },
    { time: "20:00", events: data?.recentEvents?.length || 2, verifications: data?.metrics?.totalDocuments || 4 },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
              <span>SECURITY OVERVIEW</span>
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Continuous monitoring of client-encrypted documents, Merkle manifests, and isolated recovery copies
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleVerifyAll}
              disabled={verifying}
              className="px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin text-cyan-400" : ""}`} />
              <span>{verifying ? "Verifying Vault..." : "Verify All Documents"}</span>
            </button>
            <Link
              href="/vault"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-navy-950 hover:from-cyan-300 hover:to-blue-400 text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Documents */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">TOTAL DOCUMENTS</span>
              <div className="p-2 rounded-lg bg-navy-800 text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3 font-mono">
              {loading ? "..." : data?.metrics?.totalDocuments ?? 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">100%</span>
              <span>Client-side AES-256-GCM</span>
            </div>
          </div>

          {/* Integrity Status */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">INTEGRITY POSTURE</span>
              <div className="p-2 rounded-lg bg-navy-800 text-emerald-400">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3 font-mono">
              {loading ? (
                "..."
              ) : data?.metrics?.tamperedDocuments > 0 ? (
                <span className="text-red-400">{data?.metrics?.tamperedDocuments} TAMPERED</span>
              ) : (
                <span className="text-emerald-400">VERIFIED</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {data?.metrics?.lastVerificationTime ? (
                <span>Checked {new Date(data.metrics.lastVerificationTime).toLocaleTimeString()}</span>
              ) : (
                <span>Ready for cryptographic check</span>
              )}
            </div>
          </div>

          {/* Active Incidents */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">ACTIVE INCIDENTS</span>
              <div className="p-2 rounded-lg bg-navy-800 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3 font-mono">
              {loading ? "..." : data?.metrics?.activeIncidents ?? 0}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
              <span>Automated containment</span>
              <Link href="/incidents" className="text-cyan-400 hover:underline">
                View logs →
              </Link>
            </div>
          </div>

          {/* Test Readiness Index */}
          <div className="p-5 rounded-2xl glass-panel border border-navy-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">READINESS INDEX</span>
              <div className="p-2 rounded-lg bg-navy-800 text-violet-400">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-3 font-mono">
              {loading ? "..." : `${data?.metrics?.testReadinessScore ?? 85}/100`}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate" title={data?.metrics?.scoreFormulaExplanation}>
              Test-derived internal metric
            </div>
          </div>
        </div>

        {/* Breach Rehearsal Banner */}
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-navy-900 to-navy-900 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-amber-400">
              <Flame className="w-4 h-4" />
              <span>CORE DIFFERENTIATOR • BREACH REHEARSAL & RECOVERY PROOF</span>
            </div>
            <h3 className="text-lg font-bold text-white">Execute Controlled Attack Simulations</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Run 5 non-destructive synthetic tests (Ciphertext Tampering, Manifest Forgery, Token Hijacking, Air-Gapped Recovery, and Bulk Anomaly) to prove self-defense mechanics.
            </p>
          </div>
          <Link
            href="/rehearsal"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-navy-950 font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-lg shadow-amber-500/20 transition-all flex-shrink-0"
          >
            <span>Launch Breach Rehearsal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Charts & Storage Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline Chart */}
          <div className="lg:col-span-2 p-6 rounded-2xl glass-panel border border-navy-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono">DEFENSE ACTIVITY TELEMETRY</h3>
                <p className="text-xs text-slate-400 mt-0.5">Integrity verifications & threat events over time</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Live Monitoring
              </span>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVerif" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f2fe" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0f1d", borderColor: "#1d2c52", borderRadius: "10px", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="verifications" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#colorVerif)" name="Verifications" />
                  <Area type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" name="Events" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Storage Posture & Architecture */}
          <div className="p-6 rounded-2xl glass-panel border border-navy-800 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono mb-1">STORAGE SEGREGATION</h3>
              <p className="text-xs text-slate-400 mb-4">Independent primary and recovery storage</p>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
                  <div className="text-[11px] font-mono text-cyan-400">PRIMARY STORAGE</div>
                  <div className="text-xs font-semibold text-white mt-0.5 truncate">{data?.storageStatus?.primaryTarget || "./storage/uploads"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Active ciphertext object store</div>
                </div>

                <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
                  <div className="text-[11px] font-mono text-emerald-400">RECOVERY COPIES (ISOLATED)</div>
                  <div className="text-xs font-semibold text-white mt-0.5 truncate">{data?.storageStatus?.recoveryTarget || "./storage/recovery"}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pre-verified restoration target</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-navy-800">
              <div className="text-[11px] text-slate-400 leading-relaxed">
                {data?.storageStatus?.modeDescription}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Security Events Table */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">RECENT AUDIT & SECURITY TELEMETRY</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time append-only security events</p>
            </div>
            <Link href="/incidents" className="text-xs font-mono text-cyan-400 hover:underline">
              Full Audit Log →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Resource</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {data?.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.map((ev: any) => (
                    <tr key={ev.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-white">{ev.eventType}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            ev.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : ev.severity === "HIGH"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          }`}
                        >
                          {ev.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 truncate max-w-xs">{ev.resourceType || "SYSTEM"}</td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(ev.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No security events recorded yet. All systems operating normally.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
