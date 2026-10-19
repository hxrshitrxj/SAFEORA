import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/database/prisma";
import type { Session, User } from "@prisma/client";

export const SESSION_COOKIE_NAME = "phoenix_vault_session";
const SESSION_EXPIRY_HOURS = parseInt(process.env.SESSION_EXPIRY_HOURS || "24", 10);

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface ActiveSessionContext {
  session: Session;
  user: AuthenticatedUser;
}

/**
 * Creates a new secure session for a user and records it in the database.
 */
export async function createSession(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ token: string; session: Session }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      token,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      expiresAt,
      isRevoked: false,
    },
  });

  return { token, session };
}

/**
 * Sets the secure session cookie on Next.js Response/cookies.
 */
export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
  });
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Verifies current session token from cookies against database and active status.
 */
export async function getAuthenticatedUser(): Promise<ActiveSessionContext | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check expiration
    if (new Date() > session.expiresAt) {
      return null;
    }

    // Check if session has been contained or revoked
    if (session.isRevoked) {
      return null;
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {}); // non-blocking

    return {
      session,
      user: session.user,
    };
  } catch (err) {
    console.error("Session verification error:", err);
    return null;
  }
}

/**
 * Explicitly revokes a session (used in user logout, user settings, or automated threat containment).
 */
export async function revokeSession(sessionId: string, note?: string): Promise<boolean> {
  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        revocationNote: note || "Revoked by security policy",
      },
    });
    return true;
  } catch {
    return false;
  }
}
