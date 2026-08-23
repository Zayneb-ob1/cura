import { NextRequest, NextResponse } from "next/server";
import { credentialsAreValid, setAdminSessionCookie } from "@/lib/admin/auth";
import { ApiError, readJsonObject } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { consumeRateLimit, rateLimitHeaders, type RateLimitResult } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let rateLimit: RateLimitResult | null = null;
  try {
    assertTrustedAdminOrigin(request);
    rateLimit = await consumeRateLimit(request, {
      namespace: "admin-login",
      limit: 5,
      windowMs: 15 * 60 * 1_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }
    const body = await readJsonObject(request);
    const unsupported = Object.keys(body).filter((key) => key !== "username" && key !== "password");
    if (unsupported.length > 0) throw new ApiError(400, `Unsupported fields: ${unsupported.join(", ")}`);
    if (
      typeof body.username !== "string" || !body.username.trim() || body.username.length > 254
      || typeof body.password !== "string" || !body.password || body.password.length > 1_024
    ) {
      throw new ApiError(400, "username and password are required");
    }
    const username = body.username.trim();

    if (!credentialsAreValid(username, body.password)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401, headers: rateLimitHeaders(rateLimit) },
      );
    }

    const response = NextResponse.json(
      { authenticated: true, user: { username } },
      { headers: rateLimitHeaders(rateLimit) },
    );
    setAdminSessionCookie(response, request, username);
    return response;
  } catch (error) {
    const response = errorResponse(error);
    if (rateLimit) {
      for (const [name, value] of Object.entries(rateLimitHeaders(rateLimit))) response.headers.set(name, value);
    }
    return response;
  }
}
