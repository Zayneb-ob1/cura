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

export async function readJsonObject(request: Request): Promise<JsonObject> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > 100_000) {
    throw new ApiError(413, "Request body is too large");
  }

  let value: unknown;
  try {
    value = await request.json();
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
  addDefined(result, "phone", stringValue(input, "phone", { max: 50, allowEmpty: true }));
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
  addDefined(result, "phone", stringValue(input, "phone", { required: creating, max: 50 }));
  addDefined(result, "care", stringValue(input, "care", { max: 200, allowEmpty: true }));
  const day = stringValue(input, "day", { required: creating, max: 10 });
  if (day !== undefined && !DATE_PATTERN.test(day)) throw new ApiError(400, "day must use YYYY-MM-DD");
  addDefined(result, "day", day);
  addDefined(result, "time", stringValue(input, "time", { max: 100, allowEmpty: true }));
  addDefined(result, "note", stringValue(input, "note", { max: 5_000, allowEmpty: true }));
  addDefined(result, "consent", booleanValue(input, "consent"));
  addDefined(result, "language", languageValue(input));
  addDefined(result, "status", statusValue(input, ["pending", "confirmed", "completed", "cancelled"]));
  if (isPublic && input.consent !== true) throw new ApiError(400, "consent is required");
  if (creating) {
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
  options: { creating: boolean; publicSubmission?: boolean },
) {
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
