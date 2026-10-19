"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import {
  FileText,
  Shield,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Download,
  Key,
  ArrowLeft,
  Calendar,
  Lock,
  Layers,
  CheckCircle2,
  Edit2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";
import { importKeyFromBase64, decryptDocument } from "@/lib/crypto/client-crypto";

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error, warning } = useToast();
  const documentId = params.documentId as string;

  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  // Rename modal
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newFilename, setNewFilename] = useState("");

  // Preview & Decrypt
  const [previewKey, setPreviewKey] = useState("");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}`);
      if (res.ok) {
        const json = await res.json();
        setDocument(json);
        setNewFilename(json.filename);
      } else {
        error("Not Found", "Document could not be located.");
        router.push("/vault");
      }
    } catch (err: any) {
      error("Fetch Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const handleVerify = async (versionNumber?: number) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNumber }),
      });
      const result = await res.json();

      if (res.ok) {
        if (result.isValid) {
          success("Integrity Confirmed", "Document matched chunk hashes, Merkle root, and valid signature.");
        } else {
          error("Tampering Detected!", result.details);
        }
        fetchDocument();
      } else {
        error("Verification Error", result.error);
      }
    } catch (err: any) {
      error("Verification Failed", err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`Restore Document to verified version v${versionNumber}? A new atomic version will be created.`)) {
      return;
    }

    setRestoringVersion(versionNumber);
    try {
      const res = await fetch(`/api/documents/${documentId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionNumber, reason: `Manual restoration to verified v${versionNumber}` }),
      });
      const data = await res.json();

      if (res.ok) {
        success("Restoration Successful", `Document promoted to v${data.newVersionNumber} from verified recovery copy.`);
        fetchDocument();
      } else {
        error("Restoration Aborted", data.error);
      }
    } catch (err: any) {
      error("Restore Failed", err.message);
    } finally {
      setRestoringVersion(null);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: newFilename }),
      });
      if (res.ok) {
        success("Renamed", "Document metadata updated.");
        setIsRenameOpen(false);
        fetchDocument();
      } else {
        const d = await res.json();
        error("Rename Failed", d.error);
      }
    } catch (err: any) {
      error("Error", err.message);
    }
  };

  const handleClientPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewKey) return;

    setDecrypting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/download`);
      const { envelope } = await res.json();

      const key = await importKeyFromBase64(previewKey.trim());
      const decryptedBuffer = await decryptDocument(envelope, key);

      // Try decode as text
      const text = new TextDecoder().decode(decryptedBuffer);
      setPreviewContent(text.slice(0, 5000));
      success("Decrypted in Browser Memory", "Plaintext preview rendered. Never stored on server.");
    } catch (err: any) {
      error("Decryption Failed", "Invalid encryption key or ciphertext mismatch.");
      setPreviewContent(null);
    } finally {
      setDecrypting(false);
    }
  };

  if (loading || !document) {
    return (
      <AppShell>
        <div className="py-20 text-center text-slate-400 font-mono text-sm">
          Loading document cryptographic manifest...
        </div>
      </AppShell>
    );
  }

  const latestVersion = document.versions[0];
  const manifest = latestVersion?.manifest;
  const isTampered = document.integrityStatus === "TAMPERED";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div>
          <Link
            href="/vault"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Vault</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-950 border border-cyan-500/30 text-cyan-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white font-mono">{document.filename}</h1>
                  <button
                    onClick={() => setIsRenameOpen(true)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Rename"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                  <span>Current: v{document.currentVersion}</span>
                  <span>•</span>
                  <span>{(document.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>Uploaded {new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVerify()}
                disabled={verifying}
                className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin text-cyan-400" : ""}`} />
                <span>{verifying ? "Verifying..." : "Verify Integrity"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Warning Banner if Tampered */}
        {isTampered && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 text-xs flex items-start gap-3 shadow-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">SECURITY ALERT: DOCUMENT INTEGRITY COMPROMISED</div>
              <div className="mt-1 leading-relaxed">
                Stored ciphertext failed Merkle chunk verification or digital signature check. Document has been quarantined.
                To recover, select a verified version below and click <strong>Restore this Version</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Cryptographic Manifest Overview Card */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">TAMPER-EVIDENT INTEGRITY MANIFEST</h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 ${
                isTampered
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {isTampered ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{document.integrityStatus}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
              <div className="text-[10px] font-mono text-slate-400">ENCRYPTION ALGORITHM</div>
              <div className="text-xs font-bold text-white font-mono mt-1">{document.encryptionAlgo}</div>
            </div>
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
              <div className="text-[10px] font-mono text-slate-400">HASH ALGORITHM</div>
              <div className="text-xs font-bold text-white font-mono mt-1">{manifest?.hashAlgorithm || "SHA-256"}</div>
            </div>
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
              <div className="text-[10px] font-mono text-slate-400">CHUNK SIZE</div>
              <div className="text-xs font-bold text-white font-mono mt-1">
                {manifest ? `${manifest.chunkSizeBytes / 1024} KB` : "64 KB"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800">
              <div className="text-[10px] font-mono text-slate-400">SIGNER KEY IDENTIFIER</div>
              <div className="text-xs font-bold text-cyan-300 font-mono mt-1 truncate">
                {manifest?.signerKeyId || "phoenix-kms-v1"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1">AUTHENTICATED MERKLE TREE ROOT</div>
            <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 font-mono text-xs text-cyan-300 break-all select-all">
              {manifest?.merkleRoot || "Pending calculation"}
            </div>
          </div>
        </div>

        {/* Version History & Restoration Table */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">VERSION HISTORY & RECOVERY COPIES</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{document.versions.length} Total Versions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Primary Path</th>
                  <th className="py-2.5 px-3">Recovery Copy</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {document.versions.map((v: any) => {
                  const isCurrent = v.versionNumber === document.currentVersion;
                  const isRestoring = restoringVersion === v.versionNumber;
                  return (
                    <tr key={v.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        v{v.versionNumber} {isCurrent && <span className="text-[10px] text-cyan-400 font-normal ml-1">(active)</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 truncate max-w-xs">{v.storagePath}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400 truncate max-w-xs">{v.recoveryPath || "Isolated storage"}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-navy-800 text-slate-300 border border-navy-700">
                          {v.recoveryStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRestore(v.versionNumber)}
                          disabled={isRestoring}
                          className="px-3 py-1 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 ml-auto disabled:opacity-50 transition-all"
                        >
                          <RotateCcw className={`w-3 h-3 ${isRestoring ? "animate-spin text-cyan-400" : ""}`} />
                          <span>{isRestoring ? "Restoring..." : "Restore"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client-Side Safe Decryption & Preview */}
        <div className="p-6 rounded-2xl glass-panel border border-navy-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">SAFE IN-BROWSER DECRYPT & PREVIEW</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Decrypt ciphertext strictly within your browser&apos;s Web Crypto memory. Plaintext is never transmitted or saved to the server.
          </p>

          <form onSubmit={handleClientPreview} className="space-y-3 max-w-xl">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1" htmlFor="docKey">
                PASTE DOCUMENT KEY
              </label>
              <input
                id="docKey"
                type="text"
                required
                value={previewKey}
                onChange={(e) => setPreviewKey(e.target.value)}
                placeholder="Base64 document key..."
                className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={decrypting || !previewKey}
              className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {decrypting ? "Decrypting in memory..." : "Decrypt & Render Preview"}
            </button>
          </form>

          {previewContent && (
            <div className="mt-4 p-4 rounded-xl bg-navy-950 border border-cyan-500/30">
              <div className="text-[10px] font-mono text-cyan-400 mb-2">PLAINTEXT PREVIEW (RENDERED IN BROWSER ONLY)</div>
              <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap overflow-x-auto max-h-64">
                {previewContent}
              </pre>
            </div>
          )}
        </div>

        {/* Rename Modal */}
        {isRenameOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 rounded-2xl border border-navy-800 shadow-2xl max-w-sm w-full space-y-4">
              <h3 className="text-base font-bold text-white font-mono">RENAME DOCUMENT</h3>
              <form onSubmit={handleRename} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1" htmlFor="renameInput">
                    FILENAME
                  </label>
                  <input
                    id="renameInput"
                    type="text"
                    required
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRenameOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 text-navy-950 font-bold text-xs"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
