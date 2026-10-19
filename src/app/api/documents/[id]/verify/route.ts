import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { IntegrityService } from "@/services/integrity-service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let versionNumber: number | undefined;
    try {
      const body = await req.json();
      if (body?.versionNumber) versionNumber = Number(body.versionNumber);
    } catch {
      // Body is optional
    }

    const result = await IntegrityService.verifyDocument(params.id, auth.user.id, versionNumber);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Integrity verification failed" }, { status: 400 });
  }
}
