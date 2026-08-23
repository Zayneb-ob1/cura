import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/admin/handlers";
import { formTypeFromSlug, getFormConfig } from "@/lib/forms/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };
const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const formType = formTypeFromSlug(slug);
    if (!formType) {
      return NextResponse.json({ error: "Form not found" }, { status: 404, headers: noStoreHeaders });
    }
    const form = await getFormConfig(formType);
    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404, headers: noStoreHeaders });
    }
    return NextResponse.json({ form }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
