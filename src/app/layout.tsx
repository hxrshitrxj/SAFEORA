import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/shared/toast-context";

export const metadata: Metadata = {
  title: "SAFEORA — Self-Defending Document Vault",
  description:
    "Next-generation self-defending document security vault with client-side AES-256-GCM encryption, tamper-evident Merkle manifests, air-gapped recovery, and breach rehearsal proof.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-navy-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
