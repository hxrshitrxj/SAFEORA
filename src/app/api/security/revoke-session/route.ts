import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, revokeSession } from "@/lib/auth/session";
import prisma from "@/lib/database/prisma";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const sessionId = body?.sessionId;
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    // Enforce ownership: session must belong to user
    const targetSession = await prisma.session.findFirst({
      where: { id: sessionId, userId: auth.user.id },
    });
    if (!targetSession) {
      return NextResponse.json({ error: "Session not found or access denied." }, { status: 404 });
    }

    await revokeSession(sessionId, "User manual revocation from Security Center");

    await logAuditEvent({
      eventType: "SESSION_REVOKED",
      actorId: auth.user.id,
      resourceType: "SESSION",
      resourceId: sessionId,
      outcome: "SUCCESS",
    });

    return NextResponse.json({ success: true, message: "Session revoked successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to revoke session" }, { status: 500 });
  }
}
