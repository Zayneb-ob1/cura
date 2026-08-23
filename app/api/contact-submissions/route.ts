import { NextRequest, NextResponse } from "next/server";
import { createRecord } from "@/lib/admin/store";
import { errorResponse } from "@/lib/admin/handlers";
import { normalizeRecord, readJsonObject } from "@/lib/admin/validation";
import { getFormConfig } from "@/lib/forms/config";
import { assertConfiguredRequiredFields } from "@/lib/forms/validation";
import { consumeRateLimit, rateLimitHeaders, type RateLimitResult } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let rateLimit: RateLimitResult | null = null;
  try {
    rateLimit = await consumeRateLimit(request, {
      namespace: "public-contact",
      limit: 5,
      windowMs: 10 * 60 * 1_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimit) },
      );
    }
    const form = await getFormConfig("contact");
    if (form && !form.enabled) {
      return NextResponse.json({ error: "Contact form is disabled" }, { status: 503 });
    }
    const body = await readJsonObject(request);
    if (form) assertConfiguredRequiredFields(form, body);
    const data = normalizeRecord("contacts", body, { creating: true, publicSubmission: true });
    const item = await createRecord("contacts", data);
    return NextResponse.json(
      { success: true, id: item.id },
      { status: 201, headers: rateLimitHeaders(rateLimit) },
    );
  } catch (error) {
    const response = errorResponse(error);
    if (rateLimit) {
      for (const [name, value] of Object.entries(rateLimitHeaders(rateLimit))) response.headers.set(name, value);
    }
    return response;
  }
}
