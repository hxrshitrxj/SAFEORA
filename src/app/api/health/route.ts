import { NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";
import { getStorageAdapter } from "@/lib/storage";

export async function GET() {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    const storage = getStorageAdapter();

    return NextResponse.json({
      status: "HEALTHY",
      service: "SAFEORA — Self-Defending Document Vault",
      timestamp: new Date().toISOString(),
      database: "CONNECTED",
      storage: storage.getStatus(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "DEGRADED",
        error: err.message,
      },
      { status: 503 }
    );
  }
}
