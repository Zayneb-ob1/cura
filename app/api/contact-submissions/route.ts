import { NextRequest, NextResponse } from "next/server";
import { createRecord } from "@/lib/admin/store";
import { errorResponse } from "@/lib/admin/handlers";
import { normalizeRecord, readJsonObject } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
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
