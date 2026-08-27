import { after, NextRequest, NextResponse } from "next/server";
import { readAdminSession } from "@/lib/admin/auth";
import { findRecord, updateRecord } from "@/lib/admin/store";
import { syncConfirmedAppointmentToGoogleCalendar } from "@/lib/google-calendar";
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
  const previousAppointmentState = {
    status: (rdv as Record<string, unknown>).status,
    day: (rdv as Record<string, unknown>).day,
    slotTime: (rdv as Record<string, unknown>).slotTime,
    durationMin: (rdv as Record<string, unknown>).durationMin,
    proposedDay: (rdv as Record<string, unknown>).proposedDay,
    proposedTime: (rdv as Record<string, unknown>).proposedTime,
  };

  let updates: Record<string, unknown> = {};
  let confirmationReused = false;
  let statut: "confirmed" | "proposed" | "cancelled";
  if (body.action === "confirm") {
    statut = "confirmed";
    const confirmedDay = String(body.day || (rdv as Record<string, unknown>).day || "").slice(0, 10);
    const confirmedTime = String(body.time || (rdv as Record<string, unknown>).slotTime || "").slice(0, 5);
    const confirmedDuration = Number(body.duration) || 30;
    const existingDay = String((rdv as Record<string, unknown>).day || "").slice(0, 10);
    const existingTime = String((rdv as Record<string, unknown>).slotTime || "").slice(0, 5);
    const existingDuration = Number((rdv as Record<string, unknown>).durationMin) || 30;
    confirmationReused = (
      (rdv as Record<string, unknown>).status === "confirmed"
      && existingDay === confirmedDay
      && existingTime === confirmedTime
      && existingDuration === confirmedDuration
    );
    if (!confirmationReused) {
      updates = {
        status: "confirmed",
        day: confirmedDay,
        slotTime: confirmedTime,
        durationMin: confirmedDuration,
        proposedDay: null, proposedTime: null,
      };
    }
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
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  let calendarConfigured = false;
  let calendarSynced = false;
  let calendarEventUrl: string | undefined;

  const sendStatusEmail = async () => {
    try {
      await envoyerStatutRdv(
        { ...(updated as Record<string, unknown>) },
        statut,
        statut === "confirmed"
          ? {
              day: String((updated as Record<string, unknown>).day ?? ""),
              time: String((updated as Record<string, unknown>).slotTime ?? ""),
              duration: Number((updated as Record<string, unknown>).durationMin) || 30,
              message: body.message,
              calendarEventUrl,
            }
          : { day: body.day, time: body.time, duration: body.duration, message: body.message },
      );
    } catch (mailError) {
      console.error("Email statut RDV echoue:", mailError);
    }
  };

  const syncCalendar = async () => {
    try {
      const calendar = await syncConfirmedAppointmentToGoogleCalendar(
        { ...(updated as Record<string, unknown>) },
        {
          day: String((updated as Record<string, unknown>).day ?? ""),
          time: String((updated as Record<string, unknown>).slotTime ?? ""),
          duration: Number((updated as Record<string, unknown>).durationMin) || 30,
          message: body.message,
        },
      );
      calendarConfigured = calendar.configured;
      calendarSynced = calendar.synced;
      calendarEventUrl = calendar.eventUrl;
    } catch (calendarError) {
      calendarConfigured = true;
      console.error("Synchronisation Google Calendar echouee:", calendarError);
    }
  };

  if (statut === "confirmed") {
    await syncCalendar();
    if (!calendarConfigured || !calendarSynced) {
      if (!confirmationReused) {
        await updateRecord("appointments", id, previousAppointmentState);
      }
      return NextResponse.json(
        {
          error: calendarConfigured
            ? "La synchronisation Google Agenda a échoué. La réservation n’a pas été confirmée."
            : "Google Agenda n’est pas configuré. La réservation n’a pas été confirmée.",
          calendarConfigured,
          calendarSynced,
        },
        { status: calendarConfigured ? 502 : 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  if (!confirmationReused) after(sendStatusEmail);

  return NextResponse.json(
    {
      success: true,
      item: updated,
      emailQueued: !confirmationReused,
      emailSent: confirmationReused ? true : undefined,
      calendarConfigured,
      calendarSynced,
      calendarEventUrl,
      confirmationReused,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
