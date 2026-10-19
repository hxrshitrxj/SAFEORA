import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { RehearsalService } from "@/services/rehearsal-service";

export async function POST() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await RehearsalService.cleanupTestFixtures(auth.user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to cleanup fixtures" }, { status: 500 });
  }
}
