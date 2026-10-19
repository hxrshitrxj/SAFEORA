import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { SecurityService } from "@/services/security-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const overview = await SecurityService.getSecurityOverview(auth.user.id);
    return NextResponse.json(overview);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load security overview" }, { status: 500 });
  }
}
