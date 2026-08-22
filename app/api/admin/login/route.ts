import { NextRequest, NextResponse } from "next/server";
import { credentialsAreValid, setAdminSessionCookie } from "@/lib/admin/auth";
import { ApiError, readJsonObject } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/admin/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (typeof body.username !== "string" || typeof body.password !== "string") {
      throw new ApiError(400, "username and password are required");
    }

    if (!credentialsAreValid(body.username, body.password)) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const response = NextResponse.json(
      { authenticated: true, user: { username: body.username } },
      { headers: { "Cache-Control": "no-store" } },
    );
    setAdminSessionCookie(response, request, body.username);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
