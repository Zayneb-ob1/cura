import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { readJsonObject } from "@/lib/admin/validation";
import { jsonError, newPassword, noStoreHeaders, roleValue } from "@/lib/admin/user-api";
import { deleteUser, setUserPassword, updateUser } from "@/lib/admin/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function ownerSession(request: NextRequest) {
  assertTrustedAdminOrigin(request);
  const session = await readAdminSession(request);
  if (!session) return { error: jsonError(401, "Unauthorized") } as const;
  if (session.role !== "owner") return { error: jsonError(403, "OWNER_ONLY") } as const;
  return { session } as const;
}

/** Owner edits an account: name, role, active state, or a new password. */
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const result = await ownerSession(request);
    if ("error" in result) return result.error;
    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (id === result.session.userId && (body.active === false || (body.role !== undefined && body.role !== "owner"))) {
      return jsonError(400, "CANNOT_DEMOTE_SELF");
    }
    if (body.password !== undefined) await setUserPassword(id, newPassword(body, "password"));
    const user = await updateUser(id, {
      name: typeof body.name === "string" ? body.name.slice(0, 120) : undefined,
      role: roleValue(body.role),
      active: typeof body.active === "boolean" ? body.active : undefined,
    });
    if (!user) return jsonError(404, "Not found");
    return NextResponse.json({ item: user }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_OWNER") return jsonError(400, "LAST_OWNER");
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const result = await ownerSession(request);
    if ("error" in result) return result.error;
    const { id } = await context.params;
    if (id === result.session.userId) return jsonError(400, "CANNOT_DELETE_SELF");
    if (!await deleteUser(id)) return jsonError(404, "Not found");
    return NextResponse.json({ success: true }, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_OWNER") return jsonError(400, "LAST_OWNER");
    return errorResponse(error);
  }
}
