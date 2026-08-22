import { randomUUID } from "node:crypto";
import mysql, { type Pool, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

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

let pool: Pool | null = null;

function database() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  const databaseName = process.env.MYSQL_DATABASE;
  if (!host || !user || password === undefined || !databaseName) {
    throw new Error("MySQL environment variables are not configured");
  }

  pool ??= mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user,
    password,
    database: databaseName,
    charset: "utf8mb4",
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
  });
  return pool;
}

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

export async function listRecords<T extends StoredRecord>(collection: CollectionName): Promise<T[]> {
  const table = tableNames[collection];
  const [rows] = await database().query<RowDataPacket[]>(`SELECT * FROM \`${table}\` ORDER BY created_at DESC`);
  return rows.map((row) => mapRow(collection, row) as T);
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
