import "server-only";
import { type Pool, type PoolConnection, type RowDataPacket } from "mysql2/promise";
import { database } from "@/lib/database";

export type FormType = "contact" | "appointment";

export type FormFieldConfig = {
  key: string;
  labelFr: string;
  labelNl: string;
  placeholderFr: string;
  placeholderNl: string;
  required: boolean;
  visible: boolean;
  order: number;
};

export type FormConfig = {
  slug: "contact" | "rendez-vous";
  enabled: boolean;
  titleFr: string;
  titleNl: string;
  descriptionFr: string;
  descriptionNl: string;
  submitLabelFr: string;
  submitLabelNl: string;
  fields: FormFieldConfig[];
};

export const formFieldKeys: Record<FormType, readonly string[]> = {
  contact: ["name", "email", "phone", "subject", "message"],
  appointment: ["care", "day", "time", "firstName", "lastName", "email", "phone", "note", "consent"],
};

const formSlugs: Record<FormType, FormConfig["slug"]> = {
  contact: "contact",
  appointment: "rendez-vous",
};

function mapField(row: RowDataPacket): FormFieldConfig {
  return {
    key: String(row.field_key),
    labelFr: String(row.label_fr),
    labelNl: String(row.label_nl),
    placeholderFr: String(row.placeholder_fr),
    placeholderNl: String(row.placeholder_nl),
    required: Boolean(row.is_required),
    visible: Boolean(row.is_visible),
    order: Number(row.display_order),
  };
}

async function selectForm(connection: Pool | PoolConnection, formType: FormType) {
  const [configRows] = await connection.execute<RowDataPacket[]>(
    "SELECT * FROM form_configs WHERE form_type = ? LIMIT 1",
    [formType],
  );
  if (!configRows[0]) return null;

  const [fieldRows] = await connection.execute<RowDataPacket[]>(
    "SELECT * FROM form_fields WHERE form_type = ? ORDER BY display_order ASC, field_key ASC",
    [formType],
  );
  const row = configRows[0];
  return {
    slug: formSlugs[formType],
    enabled: Boolean(row.enabled),
    titleFr: String(row.title_fr),
    titleNl: String(row.title_nl),
    descriptionFr: String(row.description_fr),
    descriptionNl: String(row.description_nl),
    submitLabelFr: String(row.submit_label_fr),
    submitLabelNl: String(row.submit_label_nl),
    fields: fieldRows.map(mapField),
  } satisfies FormConfig;
}

export async function getFormConfig(formType: FormType) {
  return selectForm(database(), formType);
}

export async function getFormConfigs() {
  const [contact, appointment] = await Promise.all([
    getFormConfig("contact"),
    getFormConfig("appointment"),
  ]);
  return { contact, appointment };
}

export function formTypeFromSlug(slug: string): FormType | null {
  if (slug === "contact") return "contact";
  if (slug === "rendez-vous" || slug === "appointment") return "appointment";
  return null;
}

export async function saveFormConfig(formType: FormType, config: FormConfig) {
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO form_configs (
        form_type, slug, enabled, title_fr, title_nl, description_fr, description_nl,
        submit_label_fr, submit_label_nl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        slug = VALUES(slug), enabled = VALUES(enabled), title_fr = VALUES(title_fr),
        title_nl = VALUES(title_nl), description_fr = VALUES(description_fr),
        description_nl = VALUES(description_nl), submit_label_fr = VALUES(submit_label_fr),
        submit_label_nl = VALUES(submit_label_nl), updated_at = CURRENT_TIMESTAMP(3)`,
      [
        formType,
        formSlugs[formType],
        config.enabled,
        config.titleFr,
        config.titleNl,
        config.descriptionFr,
        config.descriptionNl,
        config.submitLabelFr,
        config.submitLabelNl,
      ],
    );

    await connection.execute("DELETE FROM form_fields WHERE form_type = ?", [formType]);
    for (const field of config.fields) {
      await connection.execute(
        `INSERT INTO form_fields (
          form_type, field_key, label_fr, label_nl, placeholder_fr, placeholder_nl,
          is_required, is_visible, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          formType,
          field.key,
          field.labelFr,
          field.labelNl,
          field.placeholderFr,
          field.placeholderNl,
          field.required,
          field.visible,
          field.order,
        ],
      );
    }
    await connection.commit();
    return await selectForm(connection, formType);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
