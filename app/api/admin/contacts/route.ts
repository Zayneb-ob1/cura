import type { NextRequest } from "next/server";
import {
  handleAdminCollectionDelete,
  handleAdminCollectionPatch,
  handleAdminCreate,
  handleAdminList,
} from "@/lib/admin/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: NextRequest) => handleAdminList(request, "contacts");
export const POST = (request: NextRequest) => handleAdminCreate(request, "contacts");
export const PATCH = (request: NextRequest) => handleAdminCollectionPatch(request, "contacts");
export const DELETE = (request: NextRequest) => handleAdminCollectionDelete(request, "contacts");
