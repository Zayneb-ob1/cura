import { NextRequest, NextResponse } from "next/server";
import { createRecord } from "@/lib/admin/store";
import { errorResponse } from "@/lib/admin/handlers";
import { normalizeRecord, readJsonObject } from "@/lib/admin/validation";
import { getFormConfig } from "@/lib/forms/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const form = await getFormConfig("contact");
    if (form && !form.enabled) {
      return NextResponse.json({ error: "Contact form is disabled" }, { status: 503 });
    }
    const body = await readJsonObject(request);
    const data = normalizeRecord("contacts", body, { creating: true, publicSubmission: true });
    const item = await createRecord("contacts", data);
    return NextResponse.json(
      { success: true, item },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
