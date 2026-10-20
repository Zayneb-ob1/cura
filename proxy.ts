import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const queryLanguage = request.nextUrl.searchParams.get("lang");
  const cookieLanguage = request.cookies.get("cura-language")?.value;

  // First visit (no language chosen yet): send the visitor to the Dutch version, e.g. /?lang=nl.
  if (queryLanguage !== "fr" && queryLanguage !== "nl" && cookieLanguage !== "fr" && cookieLanguage !== "nl") {
    const url = request.nextUrl.clone();
    url.searchParams.set("lang", "nl");
    const response = NextResponse.redirect(url, 307);
    response.cookies.set("cura-language", "nl", { path: "/", maxAge: 31_536_000, sameSite: "lax" });
    return response;
  }
  // Dutch is the default on a first visit; French only when chosen (?lang=fr or the saved cookie).
  const language = queryLanguage === "fr" || (queryLanguage !== "nl" && cookieLanguage === "fr") ? "fr" : "nl";
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
