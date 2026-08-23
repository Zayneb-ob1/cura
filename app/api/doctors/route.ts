import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/admin/handlers";
import { listPublishedDoctors, type StoredRecord } from "@/lib/admin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DoctorRecord = StoredRecord & {
  initials: string;
  nameFr: string;
  nameNl: string;
  roleFr: string;
  roleNl: string;
  bioFr: string;
  bioNl: string;
  order: number;
  published: boolean;
};

const importedPlaceholderIds = new Set([
  "doctor-general",
  "doctor-implantology",
  "doctor-hygiene",
]);

export async function GET() {
  try {
    const items = (await listPublishedDoctors<DoctorRecord>())
      .filter(({ id }) => !importedPlaceholderIds.has(id));
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
