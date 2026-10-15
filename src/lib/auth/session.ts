import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import * as argon2 from "argon2";
import crypto from "crypto";

// ─── Session Configuration ───────────────────────────────────────────────────

export const SESSION_COOKIE = "matchmaker_session";
export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

// ─── Password Hashing ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// ─── Session Management (Stateless HMAC-SHA256 Signed Cookies) ───────────────

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-secret-for-mvp-development-only-change-in-prod";

interface SessionPayload {
  matchmakerId: string;
  expiresAt: number;
}

function sign(payloadStr: string): string {
  return crypto.createHmac("sha256", AUTH_SECRET).update(payloadStr).digest("base64url");
}

function verify(payloadStr: string, signature: string): boolean {
  try {
    const expected = sign(payloadStr);
    const expectedBuf = Buffer.from(expected);
    const signatureBuf = Buffer.from(signature);
    if (expectedBuf.length !== signatureBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch {
    return false;
  }
}

export async function createSession(matchmakerId: string): Promise<string> {
  const payload: SessionPayload = {
    matchmakerId,
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadStr);
  const token = `${payloadStr}.${signature}`;

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  } catch {
    // Graceful fallback when invoked outside Next.js request context (e.g. testing)
  }

  return token;
}

export async function getSession(): Promise<{
  matchmakerId: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadStr, signature] = parts;
    if (!verify(payloadStr, signature)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf8")
    );

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return { matchmakerId: payload.matchmakerId };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Outside request store
  }
}

// ─── Auth Helpers ────────────────────────────────────────────────────────────

/**
 * Get the currently authenticated matchmaker, or null if not logged in.
 */
export async function getCurrentMatchmaker() {
  const session = await getSession();
  if (!session) return null;

  const matchmaker = await prisma.matchmaker.findUnique({
    where: { id: session.matchmakerId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
    },
  });

  return matchmaker;
}

/**
 * Require authentication — returns matchmaker or throws.
 * Use in server actions and API routes.
 */
export async function requireAuth() {
  const matchmaker = await getCurrentMatchmaker();
  if (!matchmaker) {
    throw new Error("Unauthorized");
  }
  return matchmaker;
}

/**
 * Verify that the current matchmaker owns a given customer.
 * Returns the customer or throws 404 (to avoid existence leaks).
 */
export async function requireCustomerOwnership(customerId: string) {
  const matchmaker = await requireAuth();

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      assignedMatchmakerId: matchmaker.id,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return { matchmaker, customer };
}
