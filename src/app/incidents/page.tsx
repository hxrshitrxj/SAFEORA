"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  AlertCircle,
  Shield,
  FileCheck,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Edit3,
  X,
  History,
  Check,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

interface IncidentItem {
  id: string;
  incidentNumber: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RECOVERING" | "RESOLVED" | "FALSE_POSITIVE";
  detectionSource: string;
  affectedResourceId: string | null;
  affectedResourceType: string | null;
  actionsTaken: string | null;
  notes: string | null;
  createdAt: string;
}

export default function IncidentsPage() {
  const { success, error } = useToast();
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal detail
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newNotes, setNewNotes] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`/api/incidents?status=${statusFilter}`);
      if (res.ok) {
        const json = await res.json();
        setIncidents(json);
      }
    } catch (err: any) {
      error("Fetch Error", "Failed to load incidents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter]);

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/incidents/${selectedIncident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus || selectedIncident.status,
          notes: newNotes,
        }),
      });

      if (res.ok) {
        success("Incident Updated", `Status updated to ${newStatus || selectedIncident.status}`);
        setSelectedIncident(null);
        fetchIncidents();
      } else {
        const d = await res.json();
        error("Update Failed", d.error);
      }
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
              <span>INCIDENTS & DEFENSE ACTIONS</span>
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                {incidents.length} Incidents
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Automated threat containment records, forensic details, and authorized incident resolution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="CONTAINED">Contained</option>
              <option value="RECOVERING">Recovering</option>
              <option value="RESOLVED">Resolved</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </select>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="glass-panel rounded-2xl border border-navy-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 bg-navy-900/40 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Incident ID</th>
                  <th className="py-3.5 px-4">Title & Detection Source</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                      Loading incidents...
                    </td>
                  </tr>
                ) : incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No security incidents recorded. Systems operating cleanly.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => {
                    return (
                      <tr key={inc.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                          {inc.incidentNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{inc.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Source: {inc.detectionSource} • Target: {inc.affectedResourceType || "SYSTEM"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              inc.severity === "CRITICAL"
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : inc.severity === "HIGH"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              inc.status === "RESOLVED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : inc.status === "CONTAINED"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {new Date(inc.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedIncident(inc);
                              setNewStatus(inc.status);
                              setNewNotes(inc.notes || "");
                            }}
                            className="px-3 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Manage</span>
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

        {/* Manage Incident Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 rounded-2xl border border-navy-800 shadow-2xl max-w-lg w-full space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-navy-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white font-mono">
                    MANAGE INCIDENT: {selectedIncident.incidentNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">TITLE</div>
                  <div className="font-semibold text-white mt-0.5">{selectedIncident.title}</div>
                </div>

                {selectedIncident.actionsTaken && (
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase">CONTAINMENT ACTIONS EXECUTED</div>
                    <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 font-mono text-cyan-300 mt-1">
                      {selectedIncident.actionsTaken}
                    </div>
                  </div>
                )}

                <form onSubmit={handleUpdateIncident} className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1" htmlFor="incStatus">
                      UPDATE STATUS
                    </label>
                    <select
                      id="incStatus"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                    >
                      <option value="OPEN">Open</option>
                      <option value="INVESTIGATING">Investigating</option>
                      <option value="CONTAINED">Contained</option>
                      <option value="RECOVERING">Recovering</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="FALSE_POSITIVE">False Positive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1" htmlFor="incNotes">
                      FORENSIC INVESTIGATION NOTES
                    </label>
                    <textarea
                      id="incNotes"
                      rows={3}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Add investigation notes or evidence references..."
                      className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIncident(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-navy-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-navy-950 font-bold text-xs disabled:opacity-50"
                    >
                      {updating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
