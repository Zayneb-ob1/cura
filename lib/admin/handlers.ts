import { NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import {
  createRecord,
  deleteRecord,
  findRecord,
  listRecords,
  updateRecord,
  type CollectionName,
  type StoredRecord,
} from "@/lib/admin/store";
import { ApiError, normalizeRecord, readJsonObject, requiredId } from "@/lib/admin/validation";

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

export async function handleAdminList(request: NextRequest, collection: CollectionName) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const items = await listRecords<StoredRecord>(collection);
    return NextResponse.json({ items }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminCreate(request: NextRequest, collection: CollectionName) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const body = await readJsonObject(request);
    const data = normalizeRecord(collection, body, { creating: true });
    const item = await createRecord(collection, data);
    return NextResponse.json({ item }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminCollectionPatch(request: NextRequest, collection: CollectionName) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const body = await readJsonObject(request);
    const id = requiredId(body.id);
    const updates = normalizeRecord(collection, body, { creating: false });
    const item = await updateRecord(collection, id, updates);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handleAdminCollectionDelete(request: NextRequest, collection: CollectionName) {
  if (!isAuthorized(request)) return unauthorized();
  try {
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
  if (!isAuthorized(request)) return unauthorized();
  try {
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
  if (!isAuthorized(request)) return unauthorized();
  try {
    const id = requiredId(rawId);
    const deleted = await deleteRecord(collection, id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStoreHeaders });
    return NextResponse.json({ success: true, id }, { headers: noStoreHeaders });
  } catch (error) {
    return errorResponse(error);
  }
}
