import "server-only";

import { isIP } from "node:net";
import { randomUUID } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { database } from "@/lib/database";

export type BlockedIp = {
  id: string;
  ipAddress: string;
  createdAt: string;
};

type BlockedIpRow = RowDataPacket & {
  id: string;
  ip_address: string;
  created_at: string | Date;
};

function isoTimestamp(value: string | Date) {
  if (value instanceof Date) return value.toISOString();
  return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`).toISOString();
}

function mapRow(row: BlockedIpRow): BlockedIp {
  return {
    id: String(row.id),
    ipAddress: String(row.ip_address),
    createdAt: isoTimestamp(row.created_at),
  };
}

export function normalizeIpAddress(value: unknown) {
  if (typeof value !== "string") return null;
  let candidate = value.trim();
  const bracketedIpv6 = candidate.match(/^\[([^\]]+)](?::\d+)?$/);
  if (bracketedIpv6) candidate = bracketedIpv6[1];
  if (isIP(candidate) === 0) {
    const ipv4WithPort = candidate.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4WithPort) candidate = ipv4WithPort[1];
  }
  const mappedIpv4 = candidate.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIpv4 && isIP(mappedIpv4[1]) === 4) candidate = mappedIpv4[1];
  return isIP(candidate) === 0 ? null : candidate.toLowerCase();
}

export function requestClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const rawAddress = forwarded || request.headers.get("x-real-ip")?.trim();
  return normalizeIpAddress(rawAddress);
}

export async function listBlockedIps() {
  const [rows] = await database().execute<BlockedIpRow[]>(
    `SELECT id, INET6_NTOA(ip_address) AS ip_address, created_at
     FROM blocked_ips
     ORDER BY created_at DESC, id DESC`,
  );
  return rows.map(mapRow);
}

export async function addBlockedIp(ipAddress: string) {
  const normalized = normalizeIpAddress(ipAddress);
  if (!normalized) throw new Error("Invalid IP address");
  await database().execute(
    `INSERT IGNORE INTO blocked_ips (id, ip_address)
     VALUES (?, INET6_ATON(?))`,
    [randomUUID(), normalized],
  );
  const [rows] = await database().execute<BlockedIpRow[]>(
    `SELECT id, INET6_NTOA(ip_address) AS ip_address, created_at
     FROM blocked_ips
     WHERE ip_address = INET6_ATON(?)
     LIMIT 1`,
    [normalized],
  );
  if (!rows[0]) throw new Error("Blocked IP could not be saved");
  return mapRow(rows[0]);
}

export async function removeBlockedIp(id: string) {
  const [result] = await database().execute<ResultSetHeader>(
    "DELETE FROM blocked_ips WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
}

export async function isBlockedIp(ipAddress: string) {
  const normalized = normalizeIpAddress(ipAddress);
  if (!normalized) return false;
  const [rows] = await database().execute<RowDataPacket[]>(
    "SELECT 1 FROM blocked_ips WHERE ip_address = INET6_ATON(?) LIMIT 1",
    [normalized],
  );
  return rows.length > 0;
}
