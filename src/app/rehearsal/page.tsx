"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Flame,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Clock,
  Shield,
  FileCheck,
  UserX,
  Database,
  Activity,
  Layers,
  Info,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

interface RehearsalRun {
  id: string;
  runNumber: number;
  status: "IDLE" | "PREPARING" | "RUNNING" | "VERIFYING" | "COMPLETED" | "FAILED";
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  executionTimeMs: number;
  errorSummary?: string;
  createdAt: string;
  scenarios: any[];
}

export default function RehearsalPage() {
  const { success, error, warning } = useToast();
  const [runs, setRuns] = useState<RehearsalRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<RehearsalRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [activeStep, setActiveStep] = useState<"IDLE" | "PREPARING" | "RUNNING" | "VERIFYING" | "COMPLETED">("IDLE");

  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/rehearsal/runs");
      if (res.ok) {
        const json: RehearsalRun[] = await res.json();
        setRuns(json);
        if (json.length > 0 && !selectedRun) {
          setSelectedRun(json[0]);
        }
      }
    } catch (err: any) {
      error("Fetch Error", "Failed to load rehearsal history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunAllTests = async () => {
    setSimulating(true);
    setActiveStep("PREPARING");

    try {
      // Simulate state progression for UI feedback
      setTimeout(() => setActiveStep("RUNNING"), 400);
      setTimeout(() => setActiveStep("VERIFYING"), 1200);

      const res = await fetch("/api/rehearsal/runs", { method: "POST" });
      const newRun = await res.json();

      if (!res.ok) {
        error("Simulation Failed", newRun.error);
        setActiveStep("IDLE");
      } else {
        setActiveStep("COMPLETED");
        success(
          "Rehearsal Complete",
          `All ${newRun.totalScenarios} security scenarios executed. ${newRun.passedScenarios} passed.`
        );
        await fetchRuns();
        setSelectedRun(newRun);
      }
    } catch (err: any) {
      error("Execution Error", err.message);
      setActiveStep("IDLE");
    } finally {
      setSimulating(false);
    }
  };

  const handleExportReport = async () => {
    if (!selectedRun) return;

    try {
      const res = await fetch(`/api/rehearsal/runs/${selectedRun.id}/report`);
      const data = await res.json();

      const blob = new Blob([data.markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phoenix-rehearsal-report-run${selectedRun.runNumber}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success("Report Downloaded", `Exported Markdown report for Run #${selectedRun.runNumber}.`);
    } catch (err: any) {
      error("Export Failed", err.message);
    }
  };

  const handleCleanupFixtures = async () => {
    if (!confirm("Remove temporary synthetic test fixtures and simulated test sessions? Production data will remain untouched.")) {
      return;
    }

    setCleaning(true);
    try {
      const res = await fetch("/api/rehearsal/fixtures/cleanup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        success("Fixtures Cleaned", data.message);
      } else {
        error("Cleanup Failed", data.error);
      }
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setCleaning(false);
    }
  };

  const getScenarioIcon = (key: string) => {
    switch (key) {
      case "SCENARIO_A_DOC_TAMPER":
        return FileCheck;
      case "SCENARIO_B_MANIFEST_TAMPER":
        return Shield;
      case "SCENARIO_C_UNAUTHORIZED_SESSION":
        return UserX;
      case "SCENARIO_D_RECOVERY_PROOF":
        return Database;
      case "SCENARIO_E_BULK_ACTIVITY":
        return Activity;
      default:
        return Flame;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
              <span>BREACH REHEARSAL & RECOVERY PROOF</span>
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30">
                SAFE SANDBOX
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Controlled synthetic attack simulations demonstrating self-defending containment & verifiable recovery
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleCleanupFixtures}
              disabled={cleaning}
              className="px-3.5 py-2 rounded-xl border border-navy-700 bg-navy-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              title="Clean up temporary simulation sessions & synthetic files"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{cleaning ? "Cleaning..." : "Clear Test Fixtures"}</span>
            </button>

            {selectedRun && (
              <button
                onClick={handleExportReport}
                className="px-3.5 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report</span>
              </button>
            )}

            <button
              onClick={handleRunAllTests}
              disabled={simulating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-navy-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/25"
            >
              <Flame className={`w-4 h-4 ${simulating ? "animate-bounce" : ""}`} />
              <span>{simulating ? "Executing Simulation Suite..." : "Run All 5 Breach Tests"}</span>
            </button>
          </div>
        </div>

        {/* State Machine Status Indicator */}
        <div className="p-4 rounded-2xl glass-panel border border-navy-800 flex items-center justify-between overflow-x-auto gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <span>STATE MACHINE:</span>
          </div>

          <div className="flex items-center gap-3">
            {["IDLE", "PREPARING", "RUNNING", "VERIFYING", "COMPLETED"].map((step, idx) => {
              const isCurrent = (simulating ? activeStep : selectedRun?.status || "IDLE") === step;
              return (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      isCurrent
                        ? "bg-cyan-500 text-navy-950 font-bold shadow-md shadow-cyan-500/30"
                        : "bg-navy-900 text-slate-500 border border-navy-800"
                    }`}
                  >
                    {step}
                  </span>
                  {idx < 4 && <span className="text-slate-600">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Boundary Disclosure Banner */}
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Isolated Safety Boundary:</strong> All breach rehearsals operate strictly on synthetic mock documents and dedicated test sessions.
            No production documents or real sessions are ever targeted or disrupted. Successful completion verifies defensive logic, but does not guarantee immunity from unmodeled zero-day vectors.
          </div>
        </div>

        {/* Run Selector & Summary */}
        {runs.length > 0 && (
          <div className="p-5 rounded-2xl glass-panel border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">SELECT RUN:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {runs.slice(0, 6).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRun(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      selectedRun?.id === r.id
                        ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold"
                        : "bg-navy-900 border border-navy-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Run #{r.runNumber} ({new Date(r.createdAt).toLocaleTimeString()})
                  </button>
                ))}
              </div>
            </div>

            {selectedRun && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-300">{selectedRun.executionTimeMs} ms</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">
                    {selectedRun.passedScenarios}/{selectedRun.totalScenarios} PASSED
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5 Scenario Execution Cards Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              Loading scenario results...
            </div>
          ) : !selectedRun || selectedRun.scenarios.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-2xl border border-navy-800 space-y-3">
              <Flame className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Breach Rehearsals Executed Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Launch your first simulation to execute all 5 non-destructive tests and prove cryptographic defense mechanics.
              </p>
              <button
                onClick={handleRunAllTests}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-navy-950 font-bold text-xs"
              >
                Launch All 5 Tests Now
              </button>
            </div>
          ) : (
            selectedRun.scenarios.map((sc, index) => {
              const Icon = getScenarioIcon(sc.scenarioKey);
              return (
                <div
                  key={sc.id || sc.scenarioKey}
                  className="p-6 rounded-2xl glass-panel border border-navy-800 hover:border-navy-700 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-cyan-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                          <span>{sc.name}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{sc.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-auto">
                      <span className="text-[11px] font-mono text-slate-400">{sc.executionTimeMs} ms</span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                          sc.passed
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {sc.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span>{sc.passed ? "ASSERTION PASSED" : "FAILED"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-800">
                      <div className="text-[10px] font-mono text-cyan-400 uppercase">EXPECTED OUTCOME</div>
                      <div className="text-slate-300 mt-1 leading-relaxed">{sc.expectedOutcome}</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-800">
                      <div className="text-[10px] font-mono text-emerald-400 uppercase">ACTUAL SYSTEM RESPONSE</div>
                      <div className="text-slate-200 mt-1 leading-relaxed font-mono">{sc.actualOutcome}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-400">
                    <div>
                      Detection: <span className="text-white font-semibold">{sc.detectionStatus}</span>
                    </div>
                    <span>•</span>
                    <div>
                      Containment: <span className="text-white font-semibold">{sc.containmentStatus}</span>
                    </div>
                    <span>•</span>
                    <div>
                      Recovery: <span className="text-white font-semibold">{sc.recoveryStatus}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
