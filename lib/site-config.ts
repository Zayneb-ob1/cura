const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME?.trim() || "CURA Tandarts Praktijk";
const addressLine1 = process.env.NEXT_PUBLIC_CLINIC_ADDRESS_LINE_1?.trim() || "";
const postalCity = process.env.NEXT_PUBLIC_CLINIC_POSTAL_CITY?.trim() || "";
const city = process.env.NEXT_PUBLIC_CLINIC_CITY?.trim() || "";
const phoneDisplay = process.env.NEXT_PUBLIC_CLINIC_PHONE_DISPLAY?.trim() || "";
const phone = process.env.NEXT_PUBLIC_CLINIC_PHONE?.trim().replace(/^tel:/, "") || "";
const email = process.env.NEXT_PUBLIC_CLINIC_EMAIL?.trim() || "";
const mapUrl = process.env.NEXT_PUBLIC_CLINIC_MAP_URL?.trim() || "";
const scheduleFr = process.env.NEXT_PUBLIC_CLINIC_SCHEDULE_FR?.trim() || "";
const scheduleNl = process.env.NEXT_PUBLIC_CLINIC_SCHEDULE_NL?.trim() || "";
const emergencyFr = process.env.NEXT_PUBLIC_CLINIC_EMERGENCY_FR?.trim() || "";
const emergencyNl = process.env.NEXT_PUBLIC_CLINIC_EMERGENCY_NL?.trim() || "";
const legalOperator = process.env.NEXT_PUBLIC_LEGAL_OPERATOR?.trim() || "";
const legalRegistration = process.env.NEXT_PUBLIC_LEGAL_REGISTRATION?.trim() || "";
const legalPrivacyEmail = process.env.NEXT_PUBLIC_LEGAL_PRIVACY_EMAIL?.trim() || "";
const legalHost = process.env.NEXT_PUBLIC_LEGAL_HOST?.trim() || "";
const legalRetentionFr = process.env.NEXT_PUBLIC_LEGAL_RETENTION_FR?.trim() || "";
const legalRetentionNl = process.env.NEXT_PUBLIC_LEGAL_RETENTION_NL?.trim() || "";
const configuredHours = (process.env.NEXT_PUBLIC_CLINIC_HOURS || "")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);
const defaultHours = [
  "08:30–18:00",
  "08:30–18:00",
  "08:30–18:00",
  "08:30–18:00",
  "08:30–17:00",
  "09:00–13:00",
  "closed",
];

export function formatClinicHour(value: string | undefined, language: "fr" | "nl") {
  if (value === "closed") return language === "fr" ? "Fermé" : "Gesloten";
  return value || "—";
}

export type ClinicConfig = {
  name: string;
  addressLine1: string;
  postalCity: string;
  city: string;
  phoneDisplay: string;
  phone: string;
  email: string;
  mapUrl: string;
  schedule: { fr: string; nl: string };
  emergency: { fr: string; nl: string };
  legal: {
    operator: string;
    registration: string;
    privacyEmail: string;
    host: string;
    retention: { fr: string; nl: string };
  };
  hours: string[];
  hasAddress: boolean;
  hasPhone: boolean;
};

export const clinicConfig: ClinicConfig = {
  name: clinicName,
  addressLine1,
  postalCity,
  city,
  phoneDisplay,
  phone,
  email,
  mapUrl,
  schedule: { fr: scheduleFr, nl: scheduleNl },
  emergency: { fr: emergencyFr, nl: emergencyNl },
  legal: {
    operator: legalOperator,
    registration: legalRegistration,
    privacyEmail: legalPrivacyEmail,
    host: legalHost,
    retention: { fr: legalRetentionFr, nl: legalRetentionNl },
  },
  hours: configuredHours.length === 7 ? configuredHours : defaultHours,
  hasAddress: Boolean(addressLine1 || postalCity),
  hasPhone: Boolean(phone && phoneDisplay),
};
