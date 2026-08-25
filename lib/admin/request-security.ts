import type { NextRequest } from "next/server";
import { ApiError } from "@/lib/admin/validation";

function normalizedOrigin(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

function requestOrigin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    || request.headers.get("host")?.trim()
    || request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
    || request.nextUrl.protocol.replace(":", "");
  return normalizedOrigin(`${protocol}://${host}`);
}

function trustedOrigins(request: NextRequest) {
  const configured = [
    ...(process.env.CURA_ALLOWED_ADMIN_ORIGINS ?? "").split(","),
    process.env.NEXT_PUBLIC_SITE_URL ?? "",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ];
  const origins = new Set(configured.map((value) => normalizedOrigin(value.trim())).filter(Boolean));
  const current = requestOrigin(request);
  if (current) origins.add(current);
  return origins;
}

export function assertTrustedAdminOrigin(request: NextRequest) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") throw new ApiError(403, "Untrusted request origin");

  const origin = normalizedOrigin(request.headers.get("origin") ?? "");
  if (!origin || !trustedOrigins(request).has(origin)) {
    throw new ApiError(403, "Untrusted request origin");
  }
}
