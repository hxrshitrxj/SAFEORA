import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { RecoveryService } from "@/services/recovery-service";
import { RestoreVersionSchema } from "@/lib/validation/schemas";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = RestoreVersionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const result = await RecoveryService.restoreVersion({
      documentId: params.id,
      targetVersionNumber: parsed.data.versionNumber,
      userId: auth.user.id,
      reason: parsed.data.reason,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Document restoration failed." }, { status: 400 });
  }
}
