"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  Settings,
  Lock,
  User,
  Shield,
  Bell,
  Database,
  Save,
  CheckCircle2,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");

  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Security Preferences
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [notifyIntegrityFailure, setNotifyIntegrityFailure] = useState(true);
  const [notifySuspiciousActivity, setNotifySuspiciousActivity] = useState(true);
  const [autoContainSession, setAutoContainSession] = useState(true);
  const [autoQuarantineTampered, setAutoQuarantineTampered] = useState(true);
  const [defaultVerificationFreq, setDefaultVerificationFreq] = useState("DAILY");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const user = await res.json();
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        if (user.securitySettings) {
          const s = user.securitySettings;
          setEmailAlerts(s.emailAlerts);
          setNotifyIntegrityFailure(s.notifyIntegrityFailure);
          setNotifySuspiciousActivity(s.notifySuspiciousActivity);
          setAutoContainSession(s.autoContainSession);
          setAutoQuarantineTampered(s.autoQuarantineTampered);
          setDefaultVerificationFreq(s.defaultVerificationFreq);
        }
      }
    } catch (err: any) {
      error("Fetch Error", "Failed to load user settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          emailAlerts,
          notifyIntegrityFailure,
          notifySuspiciousActivity,
          autoContainSession,
          autoQuarantineTampered,
          defaultVerificationFreq,
        }),
      });

      if (res.ok) {
        success("Preferences Saved", "Security configuration updated successfully.");
      } else {
        const d = await res.json();
        error("Save Failed", d.error);
      }
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error("Password Too Short", "New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("Mismatch", "New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        success("Password Changed", "Your password has been securely updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const d = await res.json();
        error("Update Failed", d.error);
      }
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <span>SETTINGS & SECURITY POLICIES</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage account identity, automated containment triggers, and storage configuration
          </p>
        </div>

        {/* Profile Card */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
            <User className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">OPERATOR PROFILE</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-mono text-slate-400 uppercase mb-1" htmlFor="pName">
                FULL NAME
              </label>
              <input
                id="pName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 uppercase mb-1">EMAIL (READ-ONLY)</label>
              <input
                type="text"
                disabled
                value={email}
                className="w-full p-2.5 rounded-xl bg-navy-900/40 border border-navy-800 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Automated Defense Preferences */}
        <form onSubmit={handleSavePreferences} className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-5">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">AUTOMATED DEFENSE & CONTAINMENT POLICIES</h3>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Policies"}</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-navy-800 cursor-pointer hover:bg-navy-850 transition-colors">
              <div>
                <div className="font-semibold text-white">Automated Session Containment</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Automatically revoke active tokens upon detecting unauthorized access or abnormal rate bursts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoContainSession}
                onChange={(e) => setAutoContainSession(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-navy-950 border-navy-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-navy-800 cursor-pointer hover:bg-navy-850 transition-colors">
              <div>
                <div className="font-semibold text-white">Auto-Quarantine Tampered Documents</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Restrict downloads and mark corrupted copies upon chunk hash or digital signature mismatch.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoQuarantineTampered}
                onChange={(e) => setAutoQuarantineTampered(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-navy-950 border-navy-700"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-navy-800 cursor-pointer hover:bg-navy-850 transition-colors">
              <div>
                <div className="font-semibold text-white">Integrity Failure Telemetry Alerts</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Generate immediate high-priority audit events when Merkle roots fail verification.
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyIntegrityFailure}
                onChange={(e) => setNotifyIntegrityFailure(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 bg-navy-950 border-navy-700"
              />
            </label>

            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Default Verification Cadence</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Automatic background Merkle integrity audit schedule.</div>
              </div>
              <select
                value={defaultVerificationFreq}
                onChange={(e) => setDefaultVerificationFreq(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-navy-950 border border-navy-800 text-cyan-300 text-xs focus:outline-none"
              >
                <option value="HOURLY">Hourly</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MANUAL">Manual Only</option>
              </select>
            </div>
          </div>
        </form>

        {/* Password Change Form */}
        <form onSubmit={handleChangePassword} className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">CHANGE ACCOUNT PASSWORD</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-mono text-slate-400 uppercase mb-1" htmlFor="curPass">
                CURRENT PASSWORD
              </label>
              <input
                id="curPass"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 uppercase mb-1" htmlFor="newPass">
                NEW PASSWORD (MIN 8)
              </label>
              <input
                id="newPass"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block font-mono text-slate-400 uppercase mb-1" htmlFor="confPass">
                CONFIRM NEW PASSWORD
              </label>
              <input
                id="confPass"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword}
              className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold disabled:opacity-50 transition-all"
            >
              {savingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </div>
        </form>

        {/* Storage Architecture Overview */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-3 text-xs">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">STORAGE INFRASTRUCTURE CONFIGURATION</h3>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Storage credentials and signing secrets are managed via server environment variables (<code className="text-cyan-300">.env</code>) and are never exposed in user interface controls.
          </p>
          <div className="p-3.5 rounded-xl bg-navy-900 border border-navy-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div>STORAGE_PROVIDER: local (Filesystem simulation)</div>
            <div>PRIMARY_STORE: ./storage/uploads</div>
            <div>RECOVERY_STORE: ./storage/recovery (Isolated folder namespace)</div>
            <div>FIXTURES_STORE: ./storage/fixtures (Synthetic rehearsal tests)</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
