import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DocumentService } from "@/services/document-service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const versionNumber = searchParams.get("version") ? parseInt(searchParams.get("version")!, 10) : undefined;

    const result = await DocumentService.getDocumentCiphertext(params.id, auth.user.id, versionNumber);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to download document ciphertext" }, { status: 400 });
  }
}
