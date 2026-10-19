import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { IncidentService } from "@/services/incident-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const incidents = await IncidentService.listIncidents(auth.user.id, status);
    return NextResponse.json(incidents);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load incidents" }, { status: 500 });
  }
}
