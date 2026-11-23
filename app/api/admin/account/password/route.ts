import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { readJsonObject } from "@/lib/admin/validation";
import { jsonError, newPassword, noStoreHeaders, requiredString } from "@/lib/admin/user-api";
import { setUserPassword, verifyUserPassword } from "@/lib/admin/users";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Changes the password of the signed-in account (the current password is required). */
export async function POST(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    const session = await readAdminSession(request);
    if (!session) return jsonError(401, "Unauthorized");
    if (!session.userId) return jsonError(503, "USER_STORE_UNAVAILABLE");
    const rateLimit = await consumeRateLimit(request, { namespace: "admin-password", limit: 5, windowMs: 15 * 60 * 1_000 });
    if (!rateLimit.allowed) return jsonError(429, "TOO_MANY_ATTEMPTS");

    const body = await readJsonObject(request);
    const currentPassword = requiredString(body, "currentPassword", 200);
    const password = newPassword(body);
    if (!await verifyUserPassword(session.username, currentPassword)) return jsonError(400, "WRONG_CURRENT_PASSWORD");
    await setUserPassword(session.userId, password);
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
