import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import prisma from "@/lib/database/prisma";
import { RehearsalService } from "@/services/rehearsal-service";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const runs = await prisma.rehearsalRun.findMany({
      where: { userId: auth.user.id },
      include: {
        scenarios: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(runs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to list rehearsal runs" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Check if a run is already running
    const activeRun = await prisma.rehearsalRun.findFirst({
      where: {
        userId: auth.user.id,
        status: { in: ["PREPARING", "RUNNING", "VERIFYING"] },
      },
    });

    if (activeRun) {
      return NextResponse.json({ error: "A rehearsal run is already actively in progress." }, { status: 409 });
    }

    const runId = await RehearsalService.runFullRehearsal(auth.user.id);
    const run = await prisma.rehearsalRun.findUnique({
      where: { id: runId },
      include: { scenarios: true },
    });

    return NextResponse.json(run);
  } catch (err: any) {
    console.error("Rehearsal run execution error:", err);
    return NextResponse.json({ error: err.message || "Rehearsal execution failed" }, { status: 500 });
  }
}
