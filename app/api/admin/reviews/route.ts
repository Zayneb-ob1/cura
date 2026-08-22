import type { NextRequest } from "next/server";
import {
  handleAdminCollectionDelete,
  handleAdminCollectionPatch,
  handleAdminCreate,
  handleAdminList,
} from "@/lib/admin/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: NextRequest) => handleAdminList(request, "reviews");
export const POST = (request: NextRequest) => handleAdminCreate(request, "reviews");
export const PATCH = (request: NextRequest) => handleAdminCollectionPatch(request, "reviews");
export const DELETE = (request: NextRequest) => handleAdminCollectionDelete(request, "reviews");
