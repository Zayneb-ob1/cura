import { ApiError, type JsonObject } from "@/lib/admin/validation";
import {
  formFieldKeys,
  type FormConfig,
  type FormFieldConfig,
  type FormType,
} from "@/lib/forms/config";

function own(input: JsonObject, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function textValue(
  input: JsonObject,
  key: string,
  options: { max: number; empty?: boolean },
) {
  if (!own(input, key) || typeof input[key] !== "string") {
    throw new ApiError(400, `${key} must be a string`);
  }
  const value = input[key].trim();
  if (!options.empty && !value) throw new ApiError(400, `${key} cannot be empty`);
  if (value.length > options.max) throw new ApiError(400, `${key} is too long`);
  return value;
}

function booleanValue(input: JsonObject, key: string, fallback?: boolean) {
  if (!own(input, key) && fallback !== undefined) return fallback;
  if (typeof input[key] !== "boolean") throw new ApiError(400, `${key} must be a boolean`);
  return input[key] as boolean;
}

function formTypeValue(value: unknown): FormType {
  if (value !== "contact" && value !== "appointment") {
    throw new ApiError(400, "formType must be contact or appointment");
  }
  return value;
}

function normalizeField(value: unknown): FormFieldConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Each field must be an object");
  }
  const field = value as JsonObject;
  const key = textValue(field, "key", { max: 64 });
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(key)) {
    throw new ApiError(400, `Invalid field key: ${key}`);
  }
  if (!Number.isInteger(field.order) || Number(field.order) < 0 || Number(field.order) > 9999) {
    throw new ApiError(400, `order must be an integer from 0 to 9999 for ${key}`);
  }
  return {
    key,
    labelFr: textValue(field, "labelFr", { max: 240 }),
    labelNl: textValue(field, "labelNl", { max: 240 }),
    placeholderFr: textValue(field, "placeholderFr", { max: 500, empty: true }),
    placeholderNl: textValue(field, "placeholderNl", { max: 500, empty: true }),
    required: booleanValue(field, "required"),
    visible: booleanValue(field, "visible"),
    order: Number(field.order),
  };
}

export function normalizeFormConfig(input: JsonObject) {
  const formType = formTypeValue(input.formType);
  const expectedSlug = formType === "contact" ? "contact" : "rendez-vous";
  if (own(input, "slug") && input.slug !== expectedSlug) {
    throw new ApiError(400, `slug must be ${expectedSlug}`);
  }
  if (!Array.isArray(input.fields)) throw new ApiError(400, "fields must be an array");

  const fields = input.fields.map(normalizeField);
  const receivedKeys = new Set(fields.map((field) => field.key));
  const expectedKeys = formFieldKeys[formType];
  if (receivedKeys.size !== fields.length) throw new ApiError(400, "Field keys must be unique");
  if (fields.length !== expectedKeys.length || expectedKeys.some((key) => !receivedKeys.has(key))) {
    throw new ApiError(400, `fields must contain: ${expectedKeys.join(", ")}`);
  }

  const submissionRequiredKeys = formType === "contact"
    ? ["name", "email", "subject", "message"]
    : ["firstName", "lastName", "email", "phone", "day", "consent"];
  for (const key of submissionRequiredKeys) {
    const field = fields.find((candidate) => candidate.key === key);
    if (!field?.visible || !field.required) {
      throw new ApiError(400, `${key} must remain visible and required`);
    }
  }

  const config: FormConfig = {
    slug: expectedSlug,
    enabled: booleanValue(input, "enabled", true),
    titleFr: textValue(input, "titleFr", { max: 240 }),
    titleNl: textValue(input, "titleNl", { max: 240 }),
    descriptionFr: textValue(input, "descriptionFr", { max: 5_000, empty: true }),
    descriptionNl: textValue(input, "descriptionNl", { max: 5_000, empty: true }),
    submitLabelFr: textValue(input, "submitLabelFr", { max: 160 }),
    submitLabelNl: textValue(input, "submitLabelNl", { max: 160 }),
    fields,
  };
  return { formType, config };
}
