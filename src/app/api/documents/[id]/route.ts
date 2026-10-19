import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DocumentService } from "@/services/document-service";
import { UpdateDocumentSchema } from "@/lib/validation/schemas";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const document = await DocumentService.getDocumentById(params.id, auth.user.id);
    return NextResponse.json(document);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Document not found" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = UpdateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await DocumentService.updateDocumentMetadata(params.id, auth.user.id, parsed.data.filename);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update document" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await DocumentService.deleteDocument(params.id, auth.user.id);
    return NextResponse.json({ success: true, message: "Document safely removed. Recovery history preserved." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete document" }, { status: 400 });
  }
}
