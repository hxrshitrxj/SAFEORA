import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DocumentService } from "@/services/document-service";
import { UploadDocumentSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const integrityStatus = searchParams.get("integrityStatus") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await DocumentService.listDocuments({
      userId: auth.user.id,
      search,
      integrityStatus,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateCheck = checkRateLimit(`upload:${auth.user.id}`, { windowMs: 60000, maxRequests: 20 });
    if (!rateCheck.isAllowed) {
      return NextResponse.json({ error: "Upload rate limit reached. Please wait." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = UploadDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { filename, mimeType, envelope } = parsed.data;

    const result = await DocumentService.uploadDocument({
      userId: auth.user.id,
      filename,
      mimeType,
      envelope,
    });

    return NextResponse.json({
      success: true,
      document: result.document,
      version: result.version,
      merkleRoot: result.merkleRoot,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Document upload failed." }, { status: 500 });
  }
}
