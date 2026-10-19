"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NavTunnel3D } from "@/components/cinematic/nav-tunnel-3d";

export default function NavPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const localToken = typeof window !== "undefined"
          ? (localStorage.getItem("safeora_session_token") || localStorage.getItem("phoenix_session_token"))
          : null;
        const headers: Record<string, string> = {};
        if (localToken) {
          headers["Authorization"] = `Bearer ${localToken}`;
          headers["x-session-token"] = localToken;
        }

        const res = await fetch("/api/auth/session", { headers });
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.authenticated) {
          router.push("/login");
          return;
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-cyan-300 font-mono tracking-wider">
            INITIALIZING 3D NAVIGATION MATRIX...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#020408]">
      <NavTunnel3D
        currentPath="/dashboard"
        onClose={() => router.push("/dashboard")}
        onSelectCategory={(href) => router.push(href)}
      />
    </div>
  );
}
