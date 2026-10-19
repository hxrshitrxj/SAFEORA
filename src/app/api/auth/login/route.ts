import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";
import { LoginSchema } from "@/lib/validation/schemas";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`login:${ip}`, { windowMs: 60000, maxRequests: 10 });
    if (!rateCheck.isAllowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 1 minute before retrying." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await logAuditEvent({
        eventType: "LOGIN_FAILURE",
        actorId: null,
        resourceType: "USER",
        outcome: "FAILURE",
        details: { emailAttempted: email },
      });
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      await logAuditEvent({
        eventType: "LOGIN_FAILURE",
        actorId: user.id,
        resourceType: "USER",
        resourceId: user.id,
        outcome: "FAILURE",
      });
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const userAgent = req.headers.get("user-agent");
    const { token } = await createSession(user.id, ip, userAgent);
    setSessionCookie(token);

    await logAuditEvent({
      eventType: "LOGIN_SUCCESS",
      actorId: user.id,
      resourceType: "USER",
      resourceId: user.id,
      outcome: "SUCCESS",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Authentication failed. Please try again." }, { status: 500 });
  }
}
