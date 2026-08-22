import { NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = readAdminSession(request);
  return NextResponse.json(
    session
      ? { authenticated: true, user: { username: session.username }, expiresAt: session.expiresAt }
      : { authenticated: false, user: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
