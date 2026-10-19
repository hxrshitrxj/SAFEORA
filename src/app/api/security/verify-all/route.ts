import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { IntegrityService } from "@/services/integrity-service";

export async function POST() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const summary = await IntegrityService.verifyAllDocuments(auth.user.id);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to verify vault" }, { status: 500 });
  }
}
