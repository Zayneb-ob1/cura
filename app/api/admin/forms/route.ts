import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { readJsonObject } from "@/lib/admin/validation";
import { getFormConfigs, saveFormConfig } from "@/lib/forms/config";
import { normalizeFormConfig } from "@/lib/forms/validation";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request)) return unauthorized();
  try {
    const forms = await getFormConfigs();
    return NextResponse.json({ forms }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    if (!readAdminSession(request)) return unauthorized();
    const body = await readJsonObject(request);
    const { formType, config } = normalizeFormConfig(body);
    const form = await saveFormConfig(formType, config);
    return NextResponse.json({ form }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
