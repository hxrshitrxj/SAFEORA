import { NextResponse } from "next/server";
import { getAuthenticatedUser, revokeSession, clearSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function POST() {
  try {
    const auth = await getAuthenticatedUser();
    if (auth) {
      await revokeSession(auth.session.id, "User initiated logout");
      await logAuditEvent({
        eventType: "LOGOUT",
        actorId: auth.user.id,
        resourceType: "SESSION",
        resourceId: auth.session.id,
        outcome: "SUCCESS",
      });
    }

    clearSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch (err: any) {
    clearSessionCookie();
    return NextResponse.json({ success: true });
  }
}
