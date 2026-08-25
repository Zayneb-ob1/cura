import type { CollectionName } from "@/lib/admin/store";

export type JsonObject = Record<string, unknown>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_PATTERN = /^(?=(?:\D*\d){6,})[+()\d\s./-]{6,50}$/;
const MAX_JSON_BODY_BYTES = 100_000;

export async function readJsonObject(request: Request): Promise<JsonObject> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new ApiError(415, "Content-Type must be application/json");

  const contentLength = request.headers.get("content-length");
  const declaredLength = contentLength === null ? null : Number(contentLength);
  if (declaredLength !== null && (!Number.isSafeInteger(declaredLength) || declaredLength < 0)) {
    throw new ApiError(400, "Invalid Content-Length header");
  }
  if (declaredLength !== null && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new ApiError(413, "Request body is too large");
  }

  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A valid JSON body is required");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let receivedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_JSON_BODY_BYTES) {
        await reader.cancel();
        throw new ApiError(413, "Request body is too large");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "A valid UTF-8 JSON body is required");
  }

  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ApiError(400, "A valid JSON body is required");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "The request body must be a JSON object");
  }

  return value as JsonObject;
}

function hasOwn(input: JsonObject, field: string) {
  return Object.prototype.hasOwnProperty.call(input, field);
}

const supportedRecordFields: Record<CollectionName, readonly string[]> = {
  contacts: ["name", "email", "phone", "subject", "message", "language", "status"],
  appointments: ["firstName", "lastName", "email", "phone", "care", "day", "time", "note", "consent", "language", "status"],
  reviews: ["name", "quote", "rating", "language", "published"],
  doctors: ["initials", "nameFr", "nameNl", "roleFr", "roleNl", "bioFr", "bioNl", "order", "published"],
};

function assertSupportedFields(input: JsonObject, collection: CollectionName, allowId: boolean) {
  const allowed = new Set(supportedRecordFields[collection]);
  if (allowId) allowed.add("id");
  const unsupported = Object.keys(input).filter((key) => !allowed.has(key));
  if (unsupported.length > 0) throw new ApiError(400, `Unsupported fields: ${unsupported.join(", ")}`);
}

function stringValue(
  input: JsonObject,
  field: string,
  options: { required?: boolean; max?: number; allowEmpty?: boolean } = {},
) {
  if (!hasOwn(input, field)) {
    if (options.required) throw new ApiError(400, `${field} is required`);
    return undefined;
  }

  if (typeof input[field] !== "string") throw new ApiError(400, `${field} must be a string`);
  const value = input[field].trim();
  if (!value && !options.allowEmpty) throw new ApiError(400, `${field} cannot be empty`);
  if (value.length > (options.max ?? 500)) throw new ApiError(400, `${field} is too long`);
  return value;
}

function emailValue(input: JsonObject, required: boolean) {
  const email = stringValue(input, "email", { required, max: 254 });
  if (email !== undefined && !EMAIL_PATTERN.test(email)) throw new ApiError(400, "email is invalid");
  return email?.toLowerCase();
}

function phoneValue(input: JsonObject, required: boolean) {
  const phone = stringValue(input, "phone", { required, max: 50, allowEmpty: !required });
  if (phone && !PHONE_PATTERN.test(phone)) throw new ApiError(400, "phone is invalid");
  return phone;
}

function languageValue(input: JsonObject) {
  if (!hasOwn(input, "language")) return undefined;
  if (input.language !== "fr" && input.language !== "nl") {
    throw new ApiError(400, "language must be fr or nl");
  }
  return input.language;
}

function booleanValue(input: JsonObject, field: string) {
  if (!hasOwn(input, field)) return undefined;
  if (typeof input[field] !== "boolean") throw new ApiError(400, `${field} must be a boolean`);
  return input[field] as boolean;
}

function statusValue(input: JsonObject, allowed: readonly string[]) {
  if (!hasOwn(input, "status")) return undefined;
  if (typeof input.status !== "string" || !allowed.includes(input.status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  }
  return input.status;
}

function addDefined(target: JsonObject, key: string, value: unknown) {
  if (value !== undefined) target[key] = value;
}

function normalizeContact(input: JsonObject, creating: boolean) {
  const result: JsonObject = {};
  addDefined(result, "name", stringValue(input, "name", { required: creating, max: 120 }));
  addDefined(result, "email", emailValue(input, creating));
  addDefined(result, "phone", phoneValue(input, false));
  addDefined(result, "subject", stringValue(input, "subject", { required: creating, max: 160 }));
  addDefined(result, "message", stringValue(input, "message", { required: creating, max: 5_000 }));
  addDefined(result, "language", languageValue(input));
  addDefined(result, "status", statusValue(input, ["new", "read", "archived"]));
  if (creating) {
    result.language ??= "fr";
    result.status ??= "new";
  }
  return result;
}

function normalizeAppointment(input: JsonObject, creating: boolean, isPublic: boolean) {
  const result: JsonObject = {};
  addDefined(result, "firstName", stringValue(input, "firstName", { required: creating, max: 100 }));
  addDefined(result, "lastName", stringValue(input, "lastName", { required: creating, max: 100 }));
  addDefined(result, "email", emailValue(input, creating));
  addDefined(result, "phone", phoneValue(input, creating));
  addDefined(result, "care", stringValue(input, "care", { max: 200, allowEmpty: true }));
  const day = stringValue(input, "day", { required: creating, max: 10 });
  if (day !== undefined) {
    if (!DATE_PATTERN.test(day)) throw new ApiError(400, "day must use YYYY-MM-DD");
    const [year, month, date] = day.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, date));
    if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== date) {
      throw new ApiError(400, "day must be a valid calendar date");
    }
    if (isPublic && day < new Date().toISOString().slice(0, 10)) {
      throw new ApiError(400, "day cannot be in the past");
    }
  }
  addDefined(result, "day", day);
  addDefined(result, "time", stringValue(input, "time", { max: 100, allowEmpty: true }));
  addDefined(result, "note", stringValue(input, "note", { max: 5_000, allowEmpty: true }));
  addDefined(result, "consent", booleanValue(input, "consent"));
  addDefined(result, "language", languageValue(input));
  addDefined(result, "status", statusValue(input, ["pending", "confirmed", "completed", "cancelled"]));
  if (isPublic && input.consent !== true) throw new ApiError(400, "consent is required");
  if (creating) {
    result.note ??= "";
    result.consent ??= false;
    result.language ??= "fr";
    result.status ??= "pending";
  }
  return result;
}

function normalizeReview(input: JsonObject, creating: boolean) {
  const result: JsonObject = {};
  addDefined(result, "name", stringValue(input, "name", { required: creating, max: 160 }));
  addDefined(result, "quote", stringValue(input, "quote", { required: creating, max: 2_000 }));

  if (hasOwn(input, "rating")) {
    if (typeof input.rating !== "number" || !Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new ApiError(400, "rating must be an integer from 1 to 5");
    }
    result.rating = input.rating;
  }

  addDefined(result, "language", languageValue(input));
  addDefined(result, "published", booleanValue(input, "published"));
  if (creating) {
    result.rating ??= 5;
    result.language ??= "fr";
    result.published ??= true;
  }
  return result;
}

function normalizeDoctor(input: JsonObject, creating: boolean) {
  const result: JsonObject = {};
  addDefined(result, "initials", stringValue(input, "initials", { required: creating, max: 4 }));
  addDefined(result, "nameFr", stringValue(input, "nameFr", { required: creating, max: 120 }));
  addDefined(result, "nameNl", stringValue(input, "nameNl", { required: creating, max: 120 }));
  addDefined(result, "roleFr", stringValue(input, "roleFr", { required: creating, max: 180 }));
  addDefined(result, "roleNl", stringValue(input, "roleNl", { required: creating, max: 180 }));
  addDefined(result, "bioFr", stringValue(input, "bioFr", { required: creating, max: 1_000 }));
  addDefined(result, "bioNl", stringValue(input, "bioNl", { required: creating, max: 1_000 }));
  addDefined(result, "published", booleanValue(input, "published"));

  if (hasOwn(input, "order")) {
    if (typeof input.order !== "number" || !Number.isInteger(input.order) || input.order < 0 || input.order > 999) {
      throw new ApiError(400, "order must be an integer from 0 to 999");
    }
    result.order = input.order;
  }

  if (creating) {
    result.published ??= true;
    result.order ??= 0;
  }
  return result;
}

export function normalizeRecord(
  collection: CollectionName,
  input: JsonObject,
  options: { creating: boolean; publicSubmission?: boolean; allowId?: boolean },
) {
  assertSupportedFields(input, collection, options.allowId === true);
  let result: JsonObject;
  if (collection === "contacts") result = normalizeContact(input, options.creating);
  else if (collection === "appointments") {
    result = normalizeAppointment(input, options.creating, options.publicSubmission === true);
  } else if (collection === "reviews") result = normalizeReview(input, options.creating);
  else result = normalizeDoctor(input, options.creating);

  if (!options.creating && Object.keys(result).length === 0) {
    throw new ApiError(400, "No supported fields were provided");
  }
  return result;
}

export function requiredId(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > 200) {
    throw new ApiError(400, "A valid id is required");
  }
  return value.trim();
}
