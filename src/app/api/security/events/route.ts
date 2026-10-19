import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { SecurityService } from "@/services/security-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity") || undefined;
    const eventType = searchParams.get("eventType") || undefined;

    const events = await SecurityService.listSecurityEvents(auth.user.id, { severity, eventType });
    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load events" }, { status: 500 });
  }
}
