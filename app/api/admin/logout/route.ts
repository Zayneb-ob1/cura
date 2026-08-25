import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    const response = NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
    clearAdminSessionCookie(response, request);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
