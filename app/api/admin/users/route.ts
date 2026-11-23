import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { readJsonObject } from "@/lib/admin/validation";
import { emailValue, jsonError, newPassword, noStoreHeaders, requiredString, roleValue } from "@/lib/admin/user-api";
import { createUser, findUserByEmail, listUsers } from "@/lib/admin/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only owners can see and manage dashboard accounts.
export async function GET(request: NextRequest) {
  const session = await readAdminSession(request);
  if (!session) return jsonError(401, "Unauthorized");
  if (session.role !== "owner") return jsonError(403, "OWNER_ONLY");
  try {
    return NextResponse.json({ items: await listUsers(), currentUserId: session.userId }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    const session = await readAdminSession(request);
    if (!session) return jsonError(401, "Unauthorized");
    if (session.role !== "owner") return jsonError(403, "OWNER_ONLY");
    const body = await readJsonObject(request);
    const email = emailValue(body.email);
    if (await findUserByEmail(email)) return jsonError(409, "EMAIL_EXISTS");
    const user = await createUser({
      email,
      name: requiredString(body, "name", 120),
      role: roleValue(body.role) ?? "admin",
      password: newPassword(body, "password"),
    });
    return NextResponse.json({ item: user }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
