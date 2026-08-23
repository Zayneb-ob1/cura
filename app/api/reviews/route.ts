import { NextRequest, NextResponse } from "next/server";
import { listPublishedReviews, type StoredRecord } from "@/lib/admin/store";
import { ApiError } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/admin/handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewRecord = StoredRecord & {
  name: string;
  quote: string;
  rating: number;
  language: "fr" | "nl";
  published: boolean;
};

const importedPlaceholderIds = new Set([
  "review-fr-samira",
  "review-fr-tom",
  "review-fr-nathalie",
  "review-nl-samira",
  "review-nl-tom",
  "review-nl-nathalie",
]);

export async function GET(request: NextRequest) {
  try {
    const language = new URL(request.url).searchParams.get("language");
    if (language !== null && language !== "fr" && language !== "nl") {
      throw new ApiError(400, "language must be fr or nl");
    }

    const records = await listPublishedReviews<ReviewRecord>(language ?? undefined);
    const items = records
      .filter(({ id }) => !importedPlaceholderIds.has(id))
      .map(({ id, name, quote, rating, language: reviewLanguage, createdAt, updatedAt }) => ({
        id,
        name,
        quote,
        rating,
        language: reviewLanguage,
        createdAt,
        updatedAt,
      }));

    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
