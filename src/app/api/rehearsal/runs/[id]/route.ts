import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import prisma from "@/lib/database/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const run = await prisma.rehearsalRun.findFirst({
      where: { id: params.id, userId: auth.user.id },
      include: { scenarios: true },
    });

    if (!run) return NextResponse.json({ error: "Rehearsal run not found" }, { status: 404 });
    return NextResponse.json(run);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch rehearsal run" }, { status: 500 });
  }
}
