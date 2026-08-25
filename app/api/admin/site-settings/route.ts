import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { readJsonObject } from "@/lib/admin/validation";
import {
  getEditableClinicSettings,
  normalizeClinicSettings,
  saveEditableClinicSettings,
} from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request)) return unauthorized();
  try {
    const settings = await getEditableClinicSettings();
    return NextResponse.json({ settings }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    if (!readAdminSession(request)) return unauthorized();
    const body = await readJsonObject(request);
    const settings = normalizeClinicSettings(body);
    const savedSettings = await saveEditableClinicSettings(settings);
    return NextResponse.json({ settings: savedSettings }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
