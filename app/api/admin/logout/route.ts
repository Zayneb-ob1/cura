import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { authenticated: false },
    { headers: { "Cache-Control": "no-store" } },
  );
  clearAdminSessionCookie(response, request);
  return response;
}
