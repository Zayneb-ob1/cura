import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/admin/handlers";
import { listRecords, type StoredRecord } from "@/lib/admin/store";

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

export async function GET() {
  try {
    const records = await listRecords<DoctorRecord>("doctors");
    const items = records
      .filter((record) => record.published)
      .sort((left, right) => left.order - right.order);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
