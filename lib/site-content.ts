import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { database } from "@/lib/database";
import { contentKeys, type ContentOverrides } from "@/lib/content-catalog";

type ContentRow = RowDataPacket & { content_key: string; value_fr: string; value_nl: string };

/** Edited texts of the public site; an empty value means "use the page default". */
export async function loadSiteContent(): Promise<ContentOverrides> {
  try {
    const [rows] = await database().query<ContentRow[]>("SELECT content_key, value_fr, value_nl FROM site_content");
    const overrides: ContentOverrides = {};
    for (const row of rows) {
      if (contentKeys.has(row.content_key)) overrides[row.content_key] = { fr: row.value_fr ?? "", nl: row.value_nl ?? "" };
    }
    return overrides;
  } catch {
    // Without the database the pages simply show their default texts.
    return {};
  }
}

const MAX_LENGTH = 2_000;

export function normalizeContent(input: unknown): ContentOverrides {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_CONTENT");
  const result: ContentOverrides = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!contentKeys.has(key) || !value || typeof value !== "object") continue;
    const { fr, nl } = value as { fr?: unknown; nl?: unknown };
    result[key] = {
      fr: typeof fr === "string" ? fr.trim().slice(0, MAX_LENGTH) : "",
      nl: typeof nl === "string" ? nl.trim().slice(0, MAX_LENGTH) : "",
    };
  }
  return result;
}

export async function saveSiteContent(entries: ContentOverrides) {
  const connection = await database().getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of Object.entries(entries)) {
      if (!value.fr && !value.nl) {
        await connection.execute("DELETE FROM site_content WHERE content_key = ?", [key]);
      } else {
        await connection.execute(
          `INSERT INTO site_content (content_key, value_fr, value_nl) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE value_fr = VALUES(value_fr), value_nl = VALUES(value_nl), updated_at = CURRENT_TIMESTAMP(3)`,
          [key, value.fr, value.nl],
        );
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return loadSiteContent();
}
