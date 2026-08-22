import type { NextRequest } from "next/server";
import { handleAdminDelete, handleAdminGet, handleAdminPatch } from "@/lib/admin/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminGet(request, "contacts", id);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminPatch(request, "contacts", id);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return handleAdminDelete(request, "contacts", id);
}
