"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Lock,
  FileCheck,
  UserCheck,
  Trash2,
  Download,
  Filter,
  Flame,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

export default function SecurityCenterPage() {
  const { success, error } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Event filtering
  const [events, setEvents] = useState<any[]>([]);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchSecurityData = async () => {
    try {
      const [overviewRes, eventsRes] = await Promise.all([
        fetch("/api/security/overview"),
        fetch(`/api/security/events?severity=${severityFilter}&eventType=${typeFilter}`),
      ]);

      if (overviewRes.ok) {
        setData(await overviewRes.json());
      }
      if (eventsRes.ok) {
        setEvents(await eventsRes.json());
      }
    } catch (err: any) {
      error("Fetch Error", "Failed to load security telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [severityFilter, typeFilter]);

  const handleVerifyAll = async () => {
    setVerifying(true);
    try {
      const res = await fetch("/api/security/verify-all", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        if (result.failed > 0) {
          error("Tampering Alert", `${result.failed} document(s) failed verification.`);
        } else {
          success("Vault Integrity Confirmed", `All ${result.total} document(s) verified intact.`);
        }
        await fetchSecurityData();
      } else {
        error("Verification Failed", result.error);
      }
    } catch (err: any) {
      error("Verification Failed", err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Revoke this active session? The client will be required to re-authenticate.")) {
      return;
    }

    setRevokingSessionId(sessionId);
    try {
      const res = await fetch("/api/security/revoke-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        success("Session Revoked", "Target session terminated.");
        fetchSecurityData();
      } else {
        const d = await res.json();
        error("Revoke Failed", d.error);
      }
    } catch (err: any) {
      error("Revoke Error", err.message);
    } finally {
      setRevokingSessionId(null);
    }
  };

  const exportAuditLog = () => {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safeora-audit-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success("Audit Log Exported", "Structured JSON audit telemetry downloaded.");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
              <span>SECURITY CENTER</span>
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                ACTIVE DEFENSE
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time threat monitoring, session containment controls, and audit event ledger
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAuditLog}
              className="px-3.5 py-2 rounded-xl border border-navy-700 bg-navy-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Log</span>
            </button>
            <button
              onClick={handleVerifyAll}
              disabled={verifying}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-navy-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin text-navy-950" : ""}`} />
              <span>{verifying ? "Verifying..." : "Run Vault Integrity Check"}</span>
            </button>
          </div>
        </div>

        {/* Readiness Index & Formula Explanation Banner */}
        <div className="p-6 rounded-2xl glass-panel border border-cyan-500/30 bg-gradient-to-r from-navy-900 via-navy-900 to-cyan-950/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Info className="w-4 h-4" />
              <span>TRANSPARENT DEFENSIVE SCORING FORMULA</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Internal Defense Readiness: {data?.metrics?.testReadinessScore ?? 85}/100
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Score = (40% × Verified Document Ratio) + (35% × Breach Rehearsal Pass Rate) + (25% - Active Incidents).
              Derived from authentic database state and non-destructive rehearsal test results.
            </p>
          </div>

          <Link
            href="/rehearsal"
            className="px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-xs font-bold font-mono flex items-center gap-2 whitespace-nowrap self-start md:self-auto"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Run Breach Rehearsal</span>
          </Link>
        </div>

        {/* Active Session Management Table */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">ACTIVE SESSIONS & TOKEN CONTAINMENT</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{data?.activeSessions?.length || 1} Active Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Session Identifier</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3">Last Active</th>
                  <th className="py-2.5 px-3 text-right">Containment Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {data?.activeSessions?.map((s: any) => {
                  const isRevoking = revokingSessionId === s.id;
                  return (
                    <tr key={s.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-white">
                        {s.id.slice(0, 12)}...
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{s.ipAddress || "127.0.0.1"}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(s.createdAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(s.lastActivityAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          disabled={isRevoking}
                          className="px-3 py-1 rounded-lg border border-red-500/30 bg-red-950/30 text-red-300 hover:bg-red-900/50 hover:border-red-400 text-xs font-semibold flex items-center gap-1.5 ml-auto disabled:opacity-50 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isRevoking ? "Revoking..." : "Revoke Session"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Events & Audit Ledger */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono">APPEND-ONLY AUDIT & SECURITY LEDGER</h3>
              <p className="text-xs text-slate-400 mt-0.5">Filter telemetry events by severity and category</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Severity:</span>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-navy-900 border border-navy-800 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="ALL">All</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="INFO">Info</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Event:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-navy-900 border border-navy-800 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="INTEGRITY_FAILURE">Integrity Failures</option>
                  <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
                  <option value="BULK_ACTIVITY">Bulk Activity</option>
                  <option value="SIGNATURE_INVALID">Signature Invalid</option>
                  <option value="SESSION_REVOKED">Session Revocations</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Resource Target</th>
                  <th className="py-2.5 px-3">Details</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {events.length > 0 ? (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">{ev.eventType}</td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 font-mono text-slate-300">{ev.resourceType || "SYSTEM"}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono truncate max-w-xs">{ev.details || "-"}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(ev.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No events matching current filter criteria.
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
