import "server-only";
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { database } from "@/lib/database";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export type AdminRole = "owner" | "admin";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: AdminRole;
  active: number | boolean;
  created_at: Date | string;
  last_login_at: Date | string | null;
};

export const PASSWORD_MIN_LENGTH = 10;

function iso(value: Date | string | null) {
  if (!value) return null;
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function toUser(row: UserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    active: Boolean(row.active),
    createdAt: iso(row.created_at) ?? "",
    lastLoginAt: iso(row.last_login_at),
  };
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/** Stored as "scrypt$<salt>$<hash>" (base64url). */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

async function passwordMatches(password: string, stored: string) {
  const [scheme, salt, expected] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  const expectedBuffer = Buffer.from(expected, "base64url");
  const actual = await scrypt(password, Buffer.from(salt, "base64url"), expectedBuffer.length);
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

async function findRow(email: string) {
  const [rows] = await database().execute<UserRow[]>("SELECT * FROM admin_users WHERE email = ? LIMIT 1", [normalizeEmail(email)]);
  return rows[0] ?? null;
}

export async function findUserByEmail(email: string) {
  const row = await findRow(email);
  return row ? toUser(row) : null;
}

export async function listUsers() {
  const [rows] = await database().execute<UserRow[]>("SELECT * FROM admin_users ORDER BY role = 'owner' DESC, created_at ASC");
  return rows.map(toUser);
}

async function countActiveOwners() {
  const [rows] = await database().execute<(RowDataPacket & { total: number })[]>(
    "SELECT COUNT(*) AS total FROM admin_users WHERE role = 'owner' AND active = TRUE",
  );
  return Number(rows[0]?.total ?? 0);
}

export async function createUser(input: { email: string; name: string; role: AdminRole; password: string }) {
  const id = randomUUID();
  await database().execute(
    "INSERT INTO admin_users (id, email, name, password_hash, role, active) VALUES (?, ?, ?, ?, ?, TRUE)",
    [id, normalizeEmail(input.email), input.name.trim(), await hashPassword(input.password), input.role],
  );
  const [rows] = await database().execute<UserRow[]>("SELECT * FROM admin_users WHERE id = ?", [id]);
  return toUser(rows[0]);
}

/** Changes name, role or active state; refuses to remove the last active owner. */
export async function updateUser(id: string, changes: { name?: string; role?: AdminRole; active?: boolean }) {
  const [rows] = await database().execute<UserRow[]>("SELECT * FROM admin_users WHERE id = ?", [id]);
  const current = rows[0];
  if (!current) return null;
  const losesOwnership = current.role === "owner" && Boolean(current.active)
    && ((changes.role && changes.role !== "owner") || changes.active === false);
  if (losesOwnership && await countActiveOwners() <= 1) throw new Error("LAST_OWNER");
  await database().execute(
    "UPDATE admin_users SET name = ?, role = ?, active = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
    [changes.name?.trim() || current.name, changes.role ?? current.role, changes.active ?? Boolean(current.active), id],
  );
  const [updated] = await database().execute<UserRow[]>("SELECT * FROM admin_users WHERE id = ?", [id]);
  return toUser(updated[0]);
}

export async function deleteUser(id: string) {
  const [rows] = await database().execute<UserRow[]>("SELECT * FROM admin_users WHERE id = ?", [id]);
  const current = rows[0];
  if (!current) return false;
  if (current.role === "owner" && Boolean(current.active) && await countActiveOwners() <= 1) throw new Error("LAST_OWNER");
  const [result] = await database().execute<ResultSetHeader>("DELETE FROM admin_users WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

export async function setUserPassword(id: string, password: string) {
  await database().execute(
    "UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?",
    [await hashPassword(password), id],
  );
}

/** Checks the current password of an account (used before changing it). */
export async function verifyUserPassword(email: string, password: string) {
  const row = await findRow(email);
  return Boolean(row && await passwordMatches(password, row.password_hash));
}

/**
 * Login check. Accounts live in the admin_users table. The account defined in the server
 * environment (CURA_ADMIN_USERNAME / CURA_ADMIN_PASSWORD) is imported as owner on its first
 * login; after that the stored password is the one that counts, so it can be changed from the dashboard.
 */
export async function authenticate(email: string, password: string, environment: { username: string; password: string }) {
  const row = await findRow(email);
  if (row) {
    if (!Boolean(row.active) || !await passwordMatches(password, row.password_hash)) return null;
    await database().execute("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [row.id]);
    return toUser(row);
  }
  const isEnvironmentAccount = environment.username && environment.password
    && normalizeEmail(email) === normalizeEmail(environment.username) && password === environment.password;
  if (!isEnvironmentAccount) return null;
  const user = await createUser({ email, name: "Administrateur", role: "owner", password });
  await database().execute("UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [user.id]);
  return user;
}
