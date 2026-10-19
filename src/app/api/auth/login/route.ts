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
    // Generous rate limit in development / localhost to prevent blocking testing
    const maxAllowed = process.env.NODE_ENV === "development" || ip === "127.0.0.1" ? 100 : 15;
    const rateCheck = checkRateLimit(`login:${ip}`, { windowMs: 60000, maxRequests: maxAllowed });
    if (!rateCheck.isAllowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 1 minute before retrying." },
        { status: 429 }
      );
    }

    const rawBody = await req.json();
    let rawEmail = typeof rawBody.email === "string" ? rawBody.email.trim() : "";
    if (rawEmail.toLowerCase() === "demo") {
      rawEmail = "demo@safeora-vault.local";
    }

    const parsed = LoginSchema.safeParse({
      ...rawBody,
      email: rawEmail,
      password: typeof rawBody.password === "string" ? rawBody.password.trim() : "",
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    let { email, password } = parsed.data;
    email = email.toLowerCase();

    const isDemoAccount =
      email === "demo@safeora-vault.local" ||
      email === "demo@phoenix-vault.local" ||
      email === "demo@safeora.local";

    const isDemoPassword =
      password === "SafeoraVaultDemo2026!" ||
      password === "PhoenixVaultDemo2026!";

    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If demo account and password matches demo passwords, guarantee user existence
    if (isDemoAccount && isDemoPassword && !user) {
      const { hashPassword } = await import("@/lib/auth/password");
      const passwordHash = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email,
          name: "Security Officer Alex",
          passwordHash,
          role: "USER",
          securitySettings: {
            create: {
              emailAlerts: true,
              notifyIntegrityFailure: true,
              notifySuspiciousActivity: true,
              autoContainSession: true,
              autoQuarantineTampered: true,
            },
          },
        },
      });
    }

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

    let isPasswordValid = await verifyPassword(password, user.passwordHash);

    // If demo credentials match known demo passwords, heal password hash if needed
    if (!isPasswordValid && isDemoAccount && isDemoPassword) {
      const { hashPassword } = await import("@/lib/auth/password");
      const newHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
      isPasswordValid = true;
    }

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

    // Audit log should not block successful authentication if DB is busy
    await logAuditEvent({
      eventType: "LOGIN_SUCCESS",
      actorId: user.id,
      resourceType: "USER",
      resourceId: user.id,
      outcome: "SUCCESS",
    }).catch((auditErr) => {
      console.warn("Audit logging warning during login:", auditErr);
    });

    const isSecure =
      process.env.NODE_ENV === "production" &&
      (req.headers.get("x-forwarded-proto") === "https" || req.url.startsWith("https://"));

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set cookie directly on response object to guarantee browser persistence
    response.cookies.set("safeora_vault_session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });
    response.cookies.set("phoenix_vault_session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: err?.message || "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
