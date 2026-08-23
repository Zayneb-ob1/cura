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
const hours = (process.env.NEXT_PUBLIC_CLINIC_HOURS || "")
  .split("|")
  .map((value) => value.trim())
  .filter(Boolean);

export const clinicConfig = {
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
  hours: hours.length === 7 ? hours : [],
  hasAddress: Boolean(addressLine1 || postalCity),
  hasPhone: Boolean(phone && phoneDisplay),
} as const;
