import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import prisma from "@/lib/database/prisma";
import { UpdateSettingsSchema } from "@/lib/validation/schemas";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        securitySettings: true,
      },
    });

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Handle password change if requested
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json({ error: "Current password is required to change password." }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
      const isCurrentValid = await verifyPassword(data.currentPassword, user!.passwordHash);
      if (!isCurrentValid) {
        return NextResponse.json({ error: "Current password verification failed." }, { status: 403 });
      }

      const newHash = await hashPassword(data.newPassword);
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { passwordHash: newHash },
      });

      await logAuditEvent({
        eventType: "PASSWORD_CHANGED",
        actorId: auth.user.id,
        resourceType: "USER",
        resourceId: auth.user.id,
        outcome: "SUCCESS",
      });
    }

    if (data.name) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { name: data.name },
      });
    }

    // Update security settings
    const settingsUpdate: any = {};
    if (data.emailAlerts !== undefined) settingsUpdate.emailAlerts = data.emailAlerts;
    if (data.notifyIntegrityFailure !== undefined) settingsUpdate.notifyIntegrityFailure = data.notifyIntegrityFailure;
    if (data.notifySuspiciousActivity !== undefined) settingsUpdate.notifySuspiciousActivity = data.notifySuspiciousActivity;
    if (data.autoContainSession !== undefined) settingsUpdate.autoContainSession = data.autoContainSession;
    if (data.autoQuarantineTampered !== undefined) settingsUpdate.autoQuarantineTampered = data.autoQuarantineTampered;
    if (data.defaultVerificationFreq !== undefined) settingsUpdate.defaultVerificationFreq = data.defaultVerificationFreq;

    if (Object.keys(settingsUpdate).length > 0) {
      await prisma.userSecuritySettings.upsert({
        where: { userId: auth.user.id },
        update: settingsUpdate,
        create: {
          userId: auth.user.id,
          ...settingsUpdate,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 });
  }
}
