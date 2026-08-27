import { type NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { errorResponse } from "@/lib/admin/handlers";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";
import { ApiError, readJsonObject } from "@/lib/admin/validation";
import { addBlockedIp, listBlockedIps, normalizeIpAddress } from "@/lib/security/blocked-ips";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
}

export async function GET(request: NextRequest) {
  if (!readAdminSession(request)) return unauthorized();
  try {
    const items = await listBlockedIps();
    return NextResponse.json({
      items,
      pagination: {
        page: 1,
        limit: 100,
        pageSize: 100,
        total: items.length,
        totalPages: items.length > 0 ? 1 : 0,
      },
    }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedAdminOrigin(request);
    if (!readAdminSession(request)) return unauthorized();
    const body = await readJsonObject(request);
    const unsupported = Object.keys(body).filter((key) => key !== "ipAddress");
    if (unsupported.length > 0) throw new ApiError(400, `Unsupported fields: ${unsupported.join(", ")}`);
    const ipAddress = normalizeIpAddress(body.ipAddress);
    if (!ipAddress) throw new ApiError(400, "A valid IPv4 or IPv6 address is required");
    const item = await addBlockedIp(ipAddress);
    return NextResponse.json({ item }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
