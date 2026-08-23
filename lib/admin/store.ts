import "server-only";
import { randomUUID } from "node:crypto";
import { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { database } from "@/lib/database";

export type CollectionName = "contacts" | "appointments" | "reviews" | "doctors";

export type StoredRecord = Record<string, unknown> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const tableNames: Record<CollectionName, string> = {
  contacts: "contacts",
  appointments: "appointments",
  reviews: "reviews",
  doctors: "doctors",
};

const fieldColumns: Record<CollectionName, Record<string, string>> = {
  contacts: {
    name: "name", email: "email", phone: "phone", subject: "subject", message: "message",
    language: "language", status: "status",
  },
  appointments: {
    firstName: "first_name", lastName: "last_name", email: "email", phone: "phone", care: "care",
    day: "day", time: "preferred_time", note: "note", consent: "consent", language: "language", status: "status",
  },
  reviews: {
    name: "name", quote: "quote", rating: "rating", language: "language", published: "published",
  },
  doctors: {
    initials: "initials", nameFr: "name_fr", nameNl: "name_nl", roleFr: "role_fr", roleNl: "role_nl",
    bioFr: "bio_fr", bioNl: "bio_nl", order: "display_order", published: "published",
  },
};

const searchableColumns: Record<CollectionName, readonly string[]> = {
  contacts: ["name", "email", "phone", "subject", "message"],
  appointments: ["first_name", "last_name", "email", "phone", "care"],
  reviews: ["name", "quote"],
  doctors: ["initials", "name_fr", "name_nl", "role_fr", "role_nl"],
};

export type RecordListOptions = {
  page: number;
  pageSize: number;
  search?: string;
  filter?: string | boolean;
};

export type RecordListResult<T extends StoredRecord> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

function isoTimestamp(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
    return new Date(normalized).toISOString();
  }
  return new Date(String(value)).toISOString();
}

function mapRow(collection: CollectionName, row: RowDataPacket): StoredRecord {
  const record: StoredRecord = {
    id: String(row.id),
    createdAt: isoTimestamp(row.created_at),
    updatedAt: isoTimestamp(row.updated_at),
  };

  for (const [field, column] of Object.entries(fieldColumns[collection])) {
    const value = row[column];
    record[field] = (field === "consent" || field === "published") ? Boolean(value) : value;
  }
  return record;
}

function writableFields(collection: CollectionName, data: Record<string, unknown>) {
  return Object.entries(data)
    .filter(([field, value]) => field in fieldColumns[collection] && value !== undefined)
    .map(([field, value]) => ({ column: fieldColumns[collection][field], value: sqlValue(value) }));
}

function sqlValue(value: unknown): string | number | boolean | Date | null {
  if (value === null || value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return String(value);
}

export async function listPublishedReviews<T extends StoredRecord>(language?: "fr" | "nl"): Promise<T[]> {
  const where = language ? "published = TRUE AND language = ?" : "published = TRUE";
  const values = language ? [language, 50] : [50];
  const [rows] = await database().execute<RowDataPacket[]>(
    `SELECT * FROM reviews WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ?`,
    values,
  );
  return rows.map((row) => mapRow("reviews", row) as T);
}

export async function listPublishedDoctors<T extends StoredRecord>(): Promise<T[]> {
  const [rows] = await database().execute<RowDataPacket[]>(
    "SELECT * FROM doctors WHERE published = TRUE ORDER BY display_order ASC, created_at DESC, id DESC LIMIT ?",
    [100],
  );
  return rows.map((row) => mapRow("doctors", row) as T);
}

export async function listRecordsPage<T extends StoredRecord>(
  collection: CollectionName,
  options: RecordListOptions,
): Promise<RecordListResult<T>> {
  const table = tableNames[collection];
  const where: string[] = [];
  const values: Array<string | number | boolean> = [];

  if (options.search) {
    const columns = searchableColumns[collection];
    where.push(`(${columns.map((column) => `\`${column}\` LIKE ?`).join(" OR ")})`);
    values.push(...columns.map(() => `%${options.search}%`));
  }
  if (options.filter !== undefined) {
    const column = collection === "contacts" || collection === "appointments" ? "status" : "published";
    where.push(`\`${column}\` = ?`);
    values.push(options.filter);
  }

  const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
  const orderSql = collection === "doctors"
    ? " ORDER BY display_order ASC, created_at DESC, id DESC"
    : " ORDER BY created_at DESC, id DESC";
  const [countRows] = await database().execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM \`${table}\`${whereSql}`,
    values,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.ceil(total / options.pageSize);
  const page = totalPages > 0 ? Math.min(options.page, totalPages) : 1;
  const offset = (page - 1) * options.pageSize;
  const [rows] = await database().execute<RowDataPacket[]>(
    `SELECT * FROM \`${table}\`${whereSql}${orderSql} LIMIT ? OFFSET ?`,
    [...values, options.pageSize, offset],
  );

  return {
    items: rows.map((row) => mapRow(collection, row) as T),
    total,
    page,
    pageSize: options.pageSize,
  };
}

export async function findRecord<T extends StoredRecord>(collection: CollectionName, id: string) {
  const table = tableNames[collection];
  const [rows] = await database().execute<RowDataPacket[]>(`SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapRow(collection, rows[0]) as T : null;
}

export async function createRecord<T extends Record<string, unknown>>(collection: CollectionName, data: T) {
  const table = tableNames[collection];
  const fields = writableFields(collection, data);
  const id = randomUUID();
  const timestamp = new Date();
  const columns = ["id", ...fields.map((field) => field.column), "created_at", "updated_at"];
  const values = [id, ...fields.map((field) => field.value), timestamp, timestamp];
  await database().execute(
    `INSERT INTO \`${table}\` (${columns.map((column) => `\`${column}\``).join(", ")}) VALUES (${values.map(() => "?").join(", ")})`,
    values,
  );
  return await findRecord<StoredRecord & T>(collection, id) as StoredRecord & T;
}

export async function updateRecord<T extends StoredRecord>(
  collection: CollectionName,
  id: string,
  updates: Record<string, unknown>,
) {
  const table = tableNames[collection];
  const fields = writableFields(collection, updates);
  if (fields.length === 0) return findRecord<T>(collection, id);

  const assignments = fields.map((field) => `\`${field.column}\` = ?`).join(", ");
  const values = [...fields.map((field) => field.value), id];
  const [result] = await database().execute<ResultSetHeader>(
    `UPDATE \`${table}\` SET ${assignments}, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    values,
  );
  return result.affectedRows > 0 ? findRecord<T>(collection, id) : null;
}

export async function deleteRecord(collection: CollectionName, id: string) {
  const table = tableNames[collection];
  const [result] = await database().execute<ResultSetHeader>(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
  return result.affectedRows > 0;
}
