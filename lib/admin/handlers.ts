import { NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import {
  createRecord,
  deleteRecord,
  findRecord,
  listRecordsPage,
  updateRecord,
  type CollectionName,
  type StoredRecord,
} from "@/lib/admin/store";
import { ApiError, normalizeRecord, readJsonObject, requiredId } from "@/lib/admin/validation";
import { assertTrustedAdminOrigin } from "@/lib/admin/request-security";

const noStoreHeaders = { "Cache-Control": "no-store" };

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status, headers: noStoreHeaders });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: noStoreHeaders });
}

function isAuthorized(request: NextRequest) {
  return readAdminSession(request) !== null;
}

function positiveInteger(value: string | null, fallback: number, name: string, maximum: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) throw new ApiError(400, `${name} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ApiError(400, `${name} must be between 1 and ${maximum}`);
  }
  return parsed;
}

function listOptions(request: NextRequest, collection: CollectionName) {
  const parameters = request.nextUrl.searchParams;
  const page = positiveInteger(parameters.get("page"), 1, "page", 100_000);
  const pageSize = positiveInteger(parameters.get("limit") ?? parameters.get("pageSize"), 100, "limit", 100);
  const search = parameters.get("search")?.trim();
  if (search && search.length > 120) throw new ApiError(400, "search is too long");

  const rawFilter = parameters.get("status") ?? parameters.get("published");
  let filter: string | boolean | undefined;
  if (rawFilter !== null) {
    const allowed = collection === "contacts"
      ? ["new", "read", "archived"]
      : collection === "appointments"
        ? ["pending", "confirmed", "completed", "cancelled"]
        : ["true", "false"];
    if (!allowed.includes(rawFilter)) throw new ApiError(400, "Invalid list filter");
    filter = collection === "reviews" || collection === "doctors" ? rawFilter === "true" : rawFilter;
  }
  return { page, pageSize, search: search || undefined, filter };
}

export async function handleAdminList(request: NextRequest, collection: CollectionName) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const result = await listRecordsPage<StoredRecord>(collection, listOptions(request, collection));
    const totalPages = Math.ceil(result.total / result.pageSize);
    return NextResponse.json(
      {
        items: result.items,
        pagination: {
          page: result.page,
          limit: result.pageSize,
          pageSize: result.pageSize,
          total: result.total,
          totalPages,
        },
      },
      { headers: noStoreHeaders },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminCreate(request: NextRequest, collection: CollectionName) {
  try {
    assertTrustedAdminOrigin(request);
    if (!isAuthorized(request)) return unauthorized();
    const body = await readJsonObject(request);
    const data = normalizeRecord(collection, body, { creating: true });
    const item = await createRecord(collection, data);
    return NextResponse.json({ item }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminCollectionPatch(request: NextRequest, collection: CollectionName) {
  try {
    assertTrustedAdminOrigin(request);
    if (!isAuthorized(request)) return unauthorized();
    const body = await readJsonObject(request);
    const id = requiredId(body.id);
    const updates = normalizeRecord(collection, body, { creating: false, allowId: true });
    const item = await updateRecord(collection, id, updates);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminCollectionDelete(request: NextRequest, collection: CollectionName) {
  try {
    assertTrustedAdminOrigin(request);
    if (!isAuthorized(request)) return unauthorized();
    let id = new URL(request.url).searchParams.get("id");
    if (!id) {
      const body = await readJsonObject(request);
      id = requiredId(body.id);
    }
    const normalizedId = requiredId(id);
    const deleted = await deleteRecord(collection, normalizedId);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ success: true, id: normalizedId }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminGet(request: NextRequest, collection: CollectionName, rawId: string) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const id = requiredId(rawId);
    const item = await findRecord<StoredRecord>(collection, id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminPatch(
  request: NextRequest,
  collection: CollectionName,
  rawId: string,
) {
  try {
    assertTrustedAdminOrigin(request);
    if (!isAuthorized(request)) return unauthorized();
    const id = requiredId(rawId);
    const body = await readJsonObject(request);
    const updates = normalizeRecord(collection, body, { creating: false });
    const item = await updateRecord(collection, id, updates);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminDelete(
  request: NextRequest,
  collection: CollectionName,
  rawId: string,
) {
  try {
    assertTrustedAdminOrigin(request);
    if (!isAuthorized(request)) return unauthorized();
    const id = requiredId(rawId);
    const deleted = await deleteRecord(collection, id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ success: true, id }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
