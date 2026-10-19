import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/database/prisma";
import { RegisterSchema } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/audit-logger";
import { checkRateLimit } from "@/lib/rate-limit/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rateCheck = checkRateLimit(`register:${ip}`, { windowMs: 60000, maxRequests: 5 });
    if (!rateCheck.isAllowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password, name } = parsed.data;

    // Check existing
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      // Generic message to prevent account enumeration
      return NextResponse.json({ error: "An account with this email already exists or is unavailable." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "USER",
        securitySettings: {
          create: {
            emailAlerts: true,
            notifyIntegrityFailure: true,
            notifySuspiciousActivity: true,
            autoContainSession: true,
            autoQuarantineTampered: true,
            rehearsalRetentionDays: 30,
            defaultVerificationFreq: "DAILY",
          },
        },
      },
    });

    const userAgent = req.headers.get("user-agent");
    const { token } = await createSession(user.id, ip, userAgent);
    setSessionCookie(token);

    await logAuditEvent({
      eventType: "USER_REGISTER",
      actorId: user.id,
      resourceType: "USER",
      resourceId: user.id,
      outcome: "SUCCESS",
      details: { email: user.email },
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
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
