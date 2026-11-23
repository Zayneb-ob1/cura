import "server-only";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/admin/validation";
import { PASSWORD_MIN_LENGTH, type AdminRole } from "@/lib/admin/users";

export const noStoreHeaders = { "Cache-Control": "no-store" };

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: noStoreHeaders });
}

export function requiredString(body: Record<string, unknown>, key: string, max: number) {
  const value = body[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new ApiError(400, `${key} is required`);
  return value.trim();
}

export function newPassword(body: Record<string, unknown>, key = "newPassword") {
  const value = body[key];
  if (typeof value !== "string" || value.length < PASSWORD_MIN_LENGTH || value.length > 200) {
    throw new ApiError(400, "PASSWORD_TOO_SHORT");
  }
  return value;
}

export function roleValue(value: unknown): AdminRole | undefined {
  if (value === undefined) return undefined;
  if (value !== "owner" && value !== "admin") throw new ApiError(400, "role must be owner or admin");
  return value;
}

export function emailValue(value: unknown) {
  if (typeof value !== "string" || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    throw new ApiError(400, "INVALID_EMAIL");
  }
  return value.trim();
}
