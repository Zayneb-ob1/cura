import { NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { findRecord, updateRecord } from "@/lib/admin/store";
import { envoyerStatutRdv } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!readAdminSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string; day?: string; time?: string; duration?: number; message?: string;
  };
  const rdv = await findRecord("appointments", id);
  if (!rdv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let updates: Record<string, unknown> = {};
  let statut: "confirmed" | "proposed" | "cancelled";
  if (body.action === "confirm") {
    statut = "confirmed";
    updates = {
      status: "confirmed",
      day: body.day || (rdv as Record<string, unknown>).day,
      slotTime: body.time || "",
      durationMin: Number(body.duration) || 30,
      proposedDay: null, proposedTime: null,
    };
  } else if (body.action === "propose") {
    statut = "proposed";
    updates = { status: "cancelled", proposedDay: body.day || null, proposedTime: body.time || null };
  } else if (body.action === "cancel") {
    statut = "cancelled";
    updates = { status: "cancelled", proposedDay: null, proposedTime: null };
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await updateRecord("appointments", id, updates);
  try {
    await envoyerStatutRdv(
      { ...(rdv as Record<string, unknown>) },
      statut,
      { day: body.day, time: body.time, duration: body.duration, message: body.message },
    );
  } catch (mailError) {
    console.error("Email statut RDV echoue:", mailError);
  }
  return NextResponse.json({ success: true, item: updated }, { headers: { "Cache-Control": "no-store" } });
}
