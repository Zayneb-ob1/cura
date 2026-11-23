import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { ApiError, readJsonObject } from "@/lib/admin/validation";
import { jsonError, noStoreHeaders } from "@/lib/admin/user-api";
import { loadSiteContent, normalizeContent, saveSiteContent } from "@/lib/site-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Edited texts of the public site (keys listed in lib/content-catalog.ts). */
export async function GET(request: NextRequest) {
  if (!(await readAdminSession(request))) return jsonError(401, "Unauthorized");
  return NextResponse.json({ overrides: await loadSiteContent() }, { headers: noStoreHeaders });
}

export async function PUT(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    if (!(await readAdminSession(request))) return jsonError(401, "Unauthorized");
    const body = await readJsonObject(request);
    let entries;
    try {
      entries = normalizeContent(body.overrides);
    } catch {
      throw new ApiError(400, "INVALID_CONTENT");
    }
    return NextResponse.json({ overrides: await saveSiteContent(entries) }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
