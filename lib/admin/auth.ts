import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "cura_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;

type SessionPayload = {
  sub: string;
  exp: number;
};

export type AdminSession = {
  username: string;
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

export function credentialsAreValid(username: string, password: string) {
  const configuredUsername = adminUsername();
  const configuredPassword = adminPassword();
  if (!configuredUsername || !configuredPassword) return false;

  const usernameMatches = signaturesMatch(username, configuredUsername);
  const passwordMatches = signaturesMatch(password, configuredPassword);

  return usernameMatches && passwordMatches;
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

export function readAdminSession(request: NextRequest): AdminSession | null {
  const configuredUsername = adminUsername();
  const secret = sessionSecret();
  if (!configuredUsername || !secret) return null;
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const [encodedPayload, providedSignature, extraPart] = token.split(".");
  if (!encodedPayload || !providedSignature || extraPart) return null;
  if (!signaturesMatch(providedSignature, sign(encodedPayload, secret))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<SessionPayload>;
    if (payload.sub !== configuredUsername || typeof payload.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    return {
      username: payload.sub,
      expiresAt: new Date(payload.exp).toISOString(),
    };
  } catch {
    return null;
  }
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
