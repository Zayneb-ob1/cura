import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const queryLanguage = request.nextUrl.searchParams.get("lang");
  const cookieLanguage = request.cookies.get("cura-language")?.value;
  const language = queryLanguage === "nl" || (queryLanguage !== "fr" && cookieLanguage === "nl") ? "nl" : "fr";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cura-language", language);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/",
    "/soins/:path*",
    "/urgences/:path*",
    "/cabinet/:path*",
    "/tarifs/:path*",
    "/nouveau-patient/:path*",
    "/conseils/:path*",
    "/contact/:path*",
    "/rendez-vous/:path*",
    "/mentions-legales/:path*",
  ],
};
