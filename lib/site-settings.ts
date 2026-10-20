import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { ApiError } from "@/lib/admin/validation";
import { database } from "@/lib/database";
import { clinicConfig, type ClinicConfig } from "@/lib/site-config";

export type EditableClinicSettings = {
  phoneDisplay: string;
  email: string;
  scheduleFr: string;
  scheduleNl: string;
  emergencyFr: string;
  emergencyNl: string;
};

type SettingsRow = RowDataPacket & {
  phone_display: string;
  phone_dial: string;
  email: string;
  schedule_fr: string;
  schedule_nl: string;
  emergency_fr: string;
  emergency_nl: string;
};

const defaultSettings: EditableClinicSettings = {
  phoneDisplay: clinicConfig.phoneDisplay || "+32 (0)11 00 00 00",
  email: clinicConfig.email || "contact@curadental.be",
  scheduleFr: clinicConfig.schedule.fr || "Lun–Ven 9h00–17h00",
  scheduleNl: clinicConfig.schedule.nl || "Ma–Vr 9u00–17u00",
  emergencyFr: clinicConfig.emergency.fr || "",
  emergencyNl: clinicConfig.emergency.nl || "",
};

function textValue(value: unknown, name: string, maximum: number) {
  if (typeof value !== "string") throw new ApiError(400, `${name} must be a string`);
  const normalized = value.trim();
  if (normalized.length > maximum) throw new ApiError(400, `${name} is too long`);
  return normalized;
}

function phoneDialValue(display: string) {
  const normalized = display
    .replace(/\(0\)/g, "")
    .replace(/(?!^)\+/g, "")
    .replace(/[^\d+]/g, "");
  if (normalized && normalized.replace(/\D/g, "").length < 6) {
    throw new ApiError(400, "phoneDisplay is invalid");
  }
  return normalized;
}

export function normalizeClinicSettings(input: Record<string, unknown>): EditableClinicSettings {
  const supported = new Set([
    "phoneDisplay",
    "email",
    "scheduleFr",
    "scheduleNl",
    "emergencyFr",
    "emergencyNl",
  ]);
  const unsupported = Object.keys(input).filter((key) => !supported.has(key));
  if (unsupported.length > 0) throw new ApiError(400, `Unsupported fields: ${unsupported.join(", ")}`);

  const settings = {
    phoneDisplay: textValue(input.phoneDisplay, "phoneDisplay", 50),
    email: textValue(input.email, "email", 254).toLowerCase(),
    scheduleFr: textValue(input.scheduleFr, "scheduleFr", 120),
    scheduleNl: textValue(input.scheduleNl, "scheduleNl", 120),
    emergencyFr: textValue(input.emergencyFr, "emergencyFr", 160),
    emergencyNl: textValue(input.emergencyNl, "emergencyNl", 160),
  };
  if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
    throw new ApiError(400, "email is invalid");
  }
  phoneDialValue(settings.phoneDisplay);
  return settings;
}

function rowToEditableSettings(row: SettingsRow): EditableClinicSettings {
  return {
    phoneDisplay: String(row.phone_display),
    email: String(row.email),
    scheduleFr: String(row.schedule_fr),
    scheduleNl: String(row.schedule_nl),
    emergencyFr: String(row.emergency_fr),
    emergencyNl: String(row.emergency_nl),
  };
}

export async function getEditableClinicSettings() {
  const [rows] = await database().query<SettingsRow[]>(
    `SELECT phone_display, phone_dial, email, schedule_fr, schedule_nl, emergency_fr, emergency_nl
     FROM site_settings WHERE id = 1 LIMIT 1`,
  );
  return rows[0] ? rowToEditableSettings(rows[0]) : defaultSettings;
}

export async function saveEditableClinicSettings(settings: EditableClinicSettings) {
  const phoneDial = phoneDialValue(settings.phoneDisplay);
  await database().execute(
    `INSERT INTO site_settings (
       id, phone_display, phone_dial, email, schedule_fr, schedule_nl, emergency_fr, emergency_nl
     ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       phone_display = VALUES(phone_display),
       phone_dial = VALUES(phone_dial),
       email = VALUES(email),
       schedule_fr = VALUES(schedule_fr),
       schedule_nl = VALUES(schedule_nl),
       emergency_fr = VALUES(emergency_fr),
       emergency_nl = VALUES(emergency_nl),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [
      settings.phoneDisplay,
      phoneDial,
      settings.email,
      settings.scheduleFr,
      settings.scheduleNl,
      settings.emergencyFr,
      settings.emergencyNl,
    ],
  );
  return settings;
}

function mergeClinicConfig(settings: EditableClinicSettings, phone: string): ClinicConfig {
  return {
    ...clinicConfig,
    phoneDisplay: settings.phoneDisplay,
    phone,
    email: settings.email,
    schedule: { fr: settings.scheduleFr, nl: settings.scheduleNl },
    emergency: { fr: settings.emergencyFr, nl: settings.emergencyNl },
    hasPhone: Boolean(phone && settings.phoneDisplay),
  };
}

export async function loadClinicConfig(): Promise<ClinicConfig> {
  try {
    const [rows] = await database().query<SettingsRow[]>(
      `SELECT phone_display, phone_dial, email, schedule_fr, schedule_nl, emergency_fr, emergency_nl
       FROM site_settings WHERE id = 1 LIMIT 1`,
    );
    if (!rows[0]) return clinicConfig;
    return mergeClinicConfig(rowToEditableSettings(rows[0]), String(rows[0].phone_dial));
  } catch {
    return clinicConfig;
  }
}
