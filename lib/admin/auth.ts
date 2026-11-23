import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { authenticate, findUserByEmail, normalizeEmail, type AdminRole, type AdminUser } from "@/lib/admin/users";

export const ADMIN_SESSION_COOKIE = "cura_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

type SessionPayload = {
  sub: string;
  exp: number;
};

export type AdminSession = {
  username: string;
  name: string;
  role: AdminRole;
  userId: string | null;
  expiresAt: string;
};

function adminUsername() {
  return process.env.CURA_ADMIN_USERNAME?.trim() ?? "";
}

function adminPassword() {
  return process.env.CURA_ADMIN_PASSWORD ?? "";
}

function sessionSecret() {
  const secret = process.env.CURA_ADMIN_SESSION_SECRET ?? "";
  return secret.length >= 32 ? secret : "";
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = createHash("sha256").update(left).digest();
  const rightBuffer = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function environmentCredentialsMatch(username: string, password: string) {
  const configuredUsername = adminUsername();
  const configuredPassword = adminPassword();
  if (!configuredUsername || !configuredPassword) return false;
  return signaturesMatch(normalizeEmail(username), normalizeEmail(configuredUsername))
    && signaturesMatch(password, configuredPassword);
}

/** Returns the account for these credentials, or null. Falls back to the environment account if the database is down. */
export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    return await authenticate(username, password, { username: adminUsername(), password: adminPassword() });
  } catch (error) {
    console.error("Admin login: user store unavailable", error);
    if (!environmentCredentialsMatch(username, password)) return null;
    return { id: "", email: normalizeEmail(username), name: "Administrateur", role: "owner", active: true, createdAt: "", lastLoginAt: null };
  }
}

export function createAdminSessionToken(username = adminUsername()) {
  const secret = sessionSecret();
  if (!username || !secret) throw new Error("Admin authentication environment variables are not configured");
  const payload: SessionPayload = {
    sub: username,
    exp: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

/** Valid, unexpired session of an active account (accounts can be disabled or removed from the dashboard). */
export async function readAdminSession(request: NextRequest): Promise<AdminSession | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const [encodedPayload, providedSignature, extraPart] = token.split(".");
  if (!encodedPayload || !providedSignature || extraPart) return null;
  if (!signaturesMatch(providedSignature, sign(encodedPayload, secret))) return null;

  let payload: Partial<SessionPayload>;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
  } catch {
    return null;
  }
  if (typeof payload.sub !== "string" || typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
  const expiresAt = new Date(payload.exp).toISOString();
  const isEnvironmentAccount = Boolean(adminUsername()) && normalizeEmail(payload.sub) === normalizeEmail(adminUsername());

  try {
    const user = await findUserByEmail(payload.sub);
    if (user) return user.active ? { username: user.email, name: user.name, role: user.role, userId: user.id, expiresAt } : null;
  } catch (error) {
    console.error("Admin session: user store unavailable", error);
  }
  return isEnvironmentAccount
    ? { username: normalizeEmail(payload.sub), name: "Administrateur", role: "owner", userId: null, expiresAt }
    : null;
}

function requestUsesHttps(request: NextRequest) {
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return forwardedProtocol ? forwardedProtocol === "https" : request.nextUrl.protocol === "https:";
}

export function setAdminSessionCookie(
  response: NextResponse,
  request: NextRequest,
  username = adminUsername(),
) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(username),
    httpOnly: true,
    sameSite: "lax",
    secure: requestUsesHttps(request),
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export function clearAdminSessionCookie(response: NextResponse, request: NextRequest) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: requestUsesHttps(request),
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
