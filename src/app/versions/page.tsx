"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  History,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Layers,
  Clock,
  ArrowRight,
  Database,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

export default function VersionsRecoveryPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ recoveryRecords: any[]; versions: any[] }>({
    recoveryRecords: [],
    versions: [],
  });
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchVersions = async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const json = await res.json();
        // Flatten versions from user documents
        const allVersions: any[] = [];
        json.documents.forEach((doc: any) => {
          doc.versions?.forEach((v: any) => {
            allVersions.push({ ...v, document: doc });
          });
        });
        setData((prev) => ({ ...prev, versions: allVersions }));
      }

      // Fetch overview to get recent recovery operations
      const overviewRes = await fetch("/api/security/overview");
      if (overviewRes.ok) {
        const ovJson = await overviewRes.json();
        setData((prev) => ({
          ...prev,
          recoveryRecords: ovJson.recentRecoveryOperations || [],
        }));
      }
    } catch (err: any) {
      error("Error", "Failed to load version history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleRestore = async (documentId: string, versionNumber: number, filename: string) => {
    if (!confirm(`Confirm recovery restoration of ${filename} to version v${versionNumber}?`)) {
      return;
    }

    setRestoringId(`${documentId}-v${versionNumber}`);
    try {
      const res = await fetch(`/api/documents/${documentId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNumber, reason: `Restoration from Versions & Recovery Center` }),
      });
      const result = await res.json();

      if (res.ok) {
        success("Restored Successfully", `Document promoted to v${result.newVersionNumber} from verified recovery copy.`);
        fetchVersions();
      } else {
        error("Recovery Failed", result.error);
      }
    } catch (err: any) {
      error("Restore Error", err.message);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <span>VERSIONS & RECOVERY</span>
            <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
              PROTECTED
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independently stored recovery replicas with cryptographic pre-restoration validation
          </p>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-200 flex items-start gap-3">
          <Database className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Recovery Protocol:</strong> Every document version uploaded creates a replica in the segregated recovery storage namespace.
            Restoration executes an atomic verification check: if a recovery copy has suffered bit-rot or tampering, restoration aborts immediately to preserve evidentiary integrity.
          </div>
        </div>

        {/* Eligible Versions Table */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">RESTORATION-ELIGIBLE SNAPSHOTS</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{data.versions.length} Snapshots</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Recovery Status</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                      Loading recovery versions...
                    </td>
                  </tr>
                ) : data.versions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No document versions available yet.
                    </td>
                  </tr>
                ) : (
                  data.versions.map((v) => {
                    const doc = v.document;
                    const isRestoring = restoringId === `${doc.id}-v${v.versionNumber}`;
                    return (
                      <tr key={v.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-3">
                          <Link href={`/vault/${doc.id}`} className="font-semibold text-white hover:text-cyan-300">
                            {doc.filename}
                          </Link>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-300">v{v.versionNumber}</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{(v.sizeBytes / 1024).toFixed(1)} KB</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {v.recoveryStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{new Date(v.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleRestore(doc.id, v.versionNumber, doc.filename)}
                            disabled={isRestoring}
                            className="px-3 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 ml-auto disabled:opacity-50 transition-all"
                          >
                            <RotateCcw className={`w-3 h-3 ${isRestoring ? "animate-spin text-cyan-400" : ""}`} />
                            <span>{isRestoring ? "Restoring..." : "Restore Snapshot"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recovery Operations History Table */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">VERIFIED RESTORATION AUDIT TRAIL</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Restored From</th>
                  <th className="py-2.5 px-3">Promoted To</th>
                  <th className="py-2.5 px-3">Pre-Verification</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {data.recoveryRecords.length > 0 ? (
                  data.recoveryRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-white">{r.document?.filename || "Document"}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">v{r.restoredFromVersion}</td>
                      <td className="py-3 px-3 font-mono text-cyan-400 font-bold">v{r.versionNumber}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">
                        {r.verifiedBeforeRestore ? "PASSED (100%)" : "FAILED"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No restoration events recorded yet.
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
