"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  FileText,
  Upload,
  Shield,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Trash2,
  Download,
  Key,
  X,
  RefreshCw,
  CheckCircle2,
  Lock,
  Eye,
} from "lucide-react";
import { useToast } from "@/components/shared/toast-context";
import {
  generateDocumentKey,
  exportKeyToBase64,
  encryptDocument,
  importKeyFromBase64,
  decryptDocument,
} from "@/lib/crypto/client-crypto";

interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
  integrityStatus: "VERIFIED" | "TAMPERED" | "CORRUPTED" | "PENDING";
  encryptionAlgo: string;
  lastVerifiedAt: string | null;
  isRestricted: boolean;
  createdAt: string;
  versions: any[];
}

export default function VaultPage() {
  const { success, error, warning } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);

  // Decryption Modal state
  const [decryptDoc, setDecryptDoc] = useState<DocumentItem | null>(null);
  const [decryptionKeyInput, setDecryptionKeyInput] = useState("");
  const [decrypting, setDecrypting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("integrityStatus", statusFilter);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.documents);
      }
    } catch (err: any) {
      error("Fetch Error", "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, statusFilter]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadAndEncrypt = async () => {
    if (!uploadFile) return;

    setEncrypting(true);
    try {
      // 1. Read plaintext file in browser
      const arrayBuffer = await uploadFile.arrayBuffer();

      // 2. Generate client-side AES-256-GCM key
      const key = await generateDocumentKey();
      const base64Key = await exportKeyToBase64(key);
      setGeneratedKey(base64Key);

      // 3. Encrypt document in browser using Web Crypto API
      const envelope = await encryptDocument(arrayBuffer, key);

      // 4. Send ONLY encrypted envelope to server
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: uploadFile.name,
          mimeType: uploadFile.type || "application/octet-stream",
          envelope,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        error("Upload Failed", data.error);
      } else {
        success("Document Protected", `${uploadFile.name} encrypted and uploaded with signed Merkle manifest.`);
        fetchDocuments();
      }
    } catch (err: any) {
      error("Encryption Error", err.message);
    } finally {
      setEncrypting(false);
    }
  };

  const handleVerify = async (docId: string, filename: string) => {
    setVerifyingDocId(docId);
    try {
      const res = await fetch(`/api/documents/${docId}/verify`, { method: "POST" });
      const result = await res.json();

      if (res.ok) {
        if (result.isValid) {
          success("Integrity Verified", `${filename} passed all chunk hash and digital signature checks.`);
        } else {
          error("Tampering Detected!", `${filename} failed integrity check: ${result.details}`);
        }
        fetchDocuments();
      } else {
        error("Verification Error", result.error);
      }
    } catch (err: any) {
      error("Verification Failed", err.message);
    } finally {
      setVerifyingDocId(null);
    }
  };

  const handleDelete = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to remove "${filename}" from your active vault? Recovery history will be safely preserved.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      if (res.ok) {
        success("Document Removed", `${filename} soft-deleted. Recovery snapshot preserved.`);
        fetchDocuments();
      } else {
        const data = await res.json();
        error("Delete Failed", data.error);
      }
    } catch (err: any) {
      error("Delete Failed", err.message);
    }
  };

  const handleDownloadAndDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decryptDoc || !decryptionKeyInput) return;

    setDecrypting(true);
    try {
      // 1. Fetch ciphertext envelope from server
      const res = await fetch(`/api/documents/${decryptDoc.id}/download`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to download ciphertext");
      }

      const { envelope } = await res.json();

      // 2. Import user's key into Web Crypto
      const key = await importKeyFromBase64(decryptionKeyInput.trim());

      // 3. Decrypt ciphertext in browser
      const plaintextBuffer = await decryptDocument(envelope, key);

      // 4. Trigger browser download of decrypted original
      const blob = new Blob([plaintextBuffer], { type: decryptDoc.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decryptDoc.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success("Decrypted Successfully", `Downloaded plaintext ${decryptDoc.filename}`);
      setDecryptDoc(null);
      setDecryptionKeyInput("");
    } catch (err: any) {
      error("Decryption Failed", "Invalid key or authentication tag mismatch.");
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
              <span>MY VAULT</span>
              <span className="text-xs font-sans font-normal px-2.5 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                {documents.length} Items
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Encrypted document management with tamper-evident Merkle chunk manifests
            </p>
          </div>

          <button
            onClick={() => {
              setIsUploadOpen(true);
              setUploadFile(null);
              setGeneratedKey(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-navy-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Encrypted File</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-navy-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-900 border border-navy-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="TAMPERED">Tampered / Quarantined</option>
            </select>
          </div>
        </div>

        {/* Document Table */}
        <div className="glass-panel rounded-2xl border border-navy-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-800 bg-navy-900/40 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Document</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Integrity Status</th>
                  <th className="py-3.5 px-4">Last Verified</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                      Loading encrypted vault records...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-slate-600" />
                        <span>No documents found in vault. Upload your first document to secure it.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const isTampered = doc.integrityStatus === "TAMPERED";
                    const isVerifying = verifyingDocId === doc.id;
                    return (
                      <tr key={doc.id} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link href={`/vault/${doc.id}`} className="font-medium text-white hover:text-cyan-300 flex items-center gap-2 group">
                            <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{doc.filename}</span>
                          </Link>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {doc.encryptionAlgo} • ID: {doc.id.slice(0, 10)}...
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                          v{doc.currentVersion}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {(doc.sizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono inline-flex items-center gap-1 ${
                              isTampered
                                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {isTampered ? <AlertTriangle className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                            <span>{doc.integrityStatus}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                          {doc.lastVerifiedAt ? new Date(doc.lastVerifiedAt).toLocaleString() : "Never"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Verify Button */}
                            <button
                              onClick={() => handleVerify(doc.id, doc.filename)}
                              disabled={isVerifying}
                              className="p-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all"
                              title="Verify Cryptographic Integrity"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin text-cyan-400" : ""}`} />
                            </button>

                            {/* Download & Decrypt Button */}
                            <button
                              onClick={() => {
                                setDecryptDoc(doc);
                                setDecryptionKeyInput("");
                              }}
                              className="p-1.5 rounded-lg border border-blue-500/30 bg-blue-950/30 text-blue-300 hover:bg-blue-900/50 hover:border-blue-400 transition-all"
                              title="Download & Decrypt with Client Key"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Details Page Link */}
                            <Link
                              href={`/vault/${doc.id}`}
                              className="p-1.5 rounded-lg border border-navy-700 bg-navy-800 text-slate-300 hover:text-white hover:bg-navy-700 transition-all"
                              title="View Document Details & Versions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(doc.id, doc.filename)}
                              className="p-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-900/40 hover:border-red-400 transition-all"
                              title="Soft Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload & Encrypt Modal */}
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 rounded-2xl border border-navy-800 shadow-2xl max-w-lg w-full space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">CLIENT-SIDE DOCUMENT ENCRYPTION</h3>
                </div>
                <button
                  onClick={() => setIsUploadOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!generatedKey ? (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-navy-700 hover:border-cyan-400 rounded-xl bg-navy-900/60 text-center cursor-pointer transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    {uploadFile ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-white text-sm">{uploadFile.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{(uploadFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-white">Click or drag file here</div>
                        <div className="text-xs text-slate-400">Any file type supported • AES-256-GCM encrypted</div>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed">
                    <strong>Zero-Knowledge Guarantee:</strong> Document will be encrypted in your browser using Web Crypto before transmission. Only ciphertext is sent to the server.
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-navy-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!uploadFile || encrypting}
                      onClick={handleUploadAndEncrypt}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-navy-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
                    >
                      {encrypting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                          <span>Encrypting & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Encrypt & Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Generated Key Backup Dialog */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Document Encrypted & Uploaded Successfully!</div>
                      <div className="mt-0.5 text-xs text-emerald-300/90">
                        Please save your document encryption key below. The server does NOT store this key.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">
                      CLIENT DECRYPTION KEY (BASE64)
                    </label>
                    <div className="p-3 rounded-xl bg-navy-900 border border-navy-800 font-mono text-xs text-cyan-300 break-all select-all">
                      {generatedKey}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        success("Copied", "Encryption key copied to clipboard.");
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 text-xs font-mono"
                    >
                      Copy Key
                    </button>

                    <button
                      onClick={() => {
                        setIsUploadOpen(false);
                        setGeneratedKey(null);
                        setUploadFile(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-navy-950 font-bold text-xs"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decryption & Download Modal */}
        {decryptDoc && (
          <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel p-6 rounded-2xl border border-navy-800 shadow-2xl max-w-md w-full space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white font-mono">CLIENT-SIDE DECRYPTION</h3>
                </div>
                <button
                  onClick={() => setDecryptDoc(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Provide the Base64 encryption key for <strong>{decryptDoc.filename}</strong> to decrypt in your browser.
              </p>

              <form onSubmit={handleDownloadAndDecrypt} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1" htmlFor="decKey">
                    ENTER DECRYPTION KEY
                  </label>
                  <textarea
                    id="decKey"
                    required
                    rows={3}
                    value={decryptionKeyInput}
                    onChange={(e) => setDecryptionKeyInput(e.target.value)}
                    placeholder="Paste Base64 key..."
                    className="w-full p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecryptDoc(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-navy-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={decrypting || !decryptionKeyInput}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-navy-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 transition-all shadow-md shadow-cyan-500/20"
                  >
                    {decrypting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                        <span>Decrypting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Decrypt & Download</span>
                      </>
                    )}
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
