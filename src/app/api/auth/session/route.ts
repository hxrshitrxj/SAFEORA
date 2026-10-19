import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      const res = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      res.cookies.delete("safeora_vault_session");
      res.cookies.delete("phoenix_vault_session");
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user: auth.user,
      sessionId: auth.session.id,
      expiresAt: auth.session.expiresAt,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
