import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { RehearsalService } from "@/services/rehearsal-service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const report = await RehearsalService.generateReport(params.id, auth.user.id);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate report" }, { status: 400 });
  }
}
