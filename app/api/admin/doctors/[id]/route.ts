import type { NextRequest } from "next/server";
import { handleAdminDelete, handleAdminGet, handleAdminPatch } from "@/lib/admin/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return handleAdminGet(request, "doctors", (await context.params).id);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleAdminPatch(request, "doctors", (await context.params).id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleAdminDelete(request, "doctors", (await context.params).id);
}
