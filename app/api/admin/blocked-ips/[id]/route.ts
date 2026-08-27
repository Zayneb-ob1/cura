import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { requiredId } from "@/lib/admin/validation";
import { removeBlockedIp } from "@/lib/security/blocked-ips";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedAdminOrigin(request);
    if (!readAdminSession(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
    }
    const { id: rawId } = await context.params;
    const id = requiredId(rawId);
    const deleted = await removeBlockedIp(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ success: true, id }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
