import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { database } from "@/lib/database";
import type { RowDataPacket } from "mysql2/promise";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

function clientAddress(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function bucketKey(request: NextRequest, namespace: string, discriminator: string) {
  const value = `${namespace}\n${clientAddress(request)}\n${discriminator.trim().toLowerCase()}`;
  return createHash("sha256").update(value).digest("hex");
}

export async function consumeRateLimit(
  request: NextRequest,
  options: { namespace: string; limit: number; windowMs: number; discriminator?: string },
): Promise<RateLimitResult> {
  const now = Date.now();
  const expiresAt = now + options.windowMs;
  const key = bucketKey(request, options.namespace, options.discriminator ?? "");
  if (Math.random() < 0.02) {
    await database().execute(
      "DELETE FROM rate_limit_buckets WHERE expires_at < ? LIMIT 100",
      [now],
    );
  }
  const connection = await database().getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO rate_limit_buckets (bucket_key, request_count, window_started_at, expires_at)
       VALUES (?, 0, ?, ?)
       ON DUPLICATE KEY UPDATE bucket_key = VALUES(bucket_key)`,
      [key, now, expiresAt],
    );
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT request_count, expires_at FROM rate_limit_buckets WHERE bucket_key = ? FOR UPDATE",
      [key],
    );
    const current = rows[0];
    let count: number;
    let effectiveExpiry: number;
    let allowed: boolean;

    if (Number(current.expires_at) <= now) {
      count = 1;
      effectiveExpiry = expiresAt;
      allowed = true;
      await connection.execute(
        `UPDATE rate_limit_buckets
         SET request_count = 1, window_started_at = ?, expires_at = ?
         WHERE bucket_key = ?`,
        [now, expiresAt, key],
      );
    } else {
      count = Number(current.request_count);
      effectiveExpiry = Number(current.expires_at);
      if (count < options.limit) {
        count += 1;
        allowed = true;
        await connection.execute(
          "UPDATE rate_limit_buckets SET request_count = ? WHERE bucket_key = ?",
          [count, key],
        );
      } else {
        allowed = false;
      }
    }

    await connection.commit();
    return {
      allowed,
      limit: options.limit,
      remaining: allowed ? Math.max(0, options.limit - count) : 0,
      retryAfterSeconds: Math.max(1, Math.ceil((effectiveExpiry - now) / 1_000)),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function rateLimitHeaders(result: RateLimitResult) {
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
  };
  if (!result.allowed) headers["Retry-After"] = String(result.retryAfterSeconds);
  return headers;
}
