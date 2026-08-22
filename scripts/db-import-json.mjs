import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { loadDatabaseEnvironment } from "./db-env.mjs";

const connection = await mysql.createConnection(await loadDatabaseEnvironment());

async function records(name) {
  const contents = await readFile(path.join(process.cwd(), "data", `${name}.json`), "utf8");
  return JSON.parse(contents);
}

for (const item of await records("contacts")) {
  await connection.execute(
    `INSERT INTO contacts (id, name, email, phone, subject, message, language, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),phone=VALUES(phone),subject=VALUES(subject),message=VALUES(message),language=VALUES(language),status=VALUES(status),updated_at=VALUES(updated_at)`,
    [item.id, item.name, item.email, item.phone ?? "", item.subject, item.message, item.language, item.status, new Date(item.createdAt), new Date(item.updatedAt)],
  );
}

for (const item of await records("appointments")) {
  await connection.execute(
    `INSERT INTO appointments (id, first_name, last_name, email, phone, care, day, preferred_time, note, consent, language, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE first_name=VALUES(first_name),last_name=VALUES(last_name),email=VALUES(email),phone=VALUES(phone),care=VALUES(care),day=VALUES(day),preferred_time=VALUES(preferred_time),note=VALUES(note),consent=VALUES(consent),language=VALUES(language),status=VALUES(status),updated_at=VALUES(updated_at)`,
    [item.id, item.firstName, item.lastName, item.email, item.phone, item.care ?? "", item.day, item.time ?? "", item.note ?? "", item.consent, item.language, item.status, new Date(item.createdAt), new Date(item.updatedAt)],
  );
}

for (const item of await records("reviews")) {
  await connection.execute(
    `INSERT INTO reviews (id, name, quote, rating, language, published, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE name=VALUES(name),quote=VALUES(quote),rating=VALUES(rating),language=VALUES(language),published=VALUES(published),updated_at=VALUES(updated_at)`,
    [item.id, item.name, item.quote, item.rating, item.language, item.published, new Date(item.createdAt), new Date(item.updatedAt)],
  );
}

for (const item of await records("doctors")) {
  await connection.execute(
    `INSERT INTO doctors (id, initials, name_fr, name_nl, role_fr, role_nl, bio_fr, bio_nl, display_order, published, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE initials=VALUES(initials),name_fr=VALUES(name_fr),name_nl=VALUES(name_nl),role_fr=VALUES(role_fr),role_nl=VALUES(role_nl),bio_fr=VALUES(bio_fr),bio_nl=VALUES(bio_nl),display_order=VALUES(display_order),published=VALUES(published),updated_at=VALUES(updated_at)`,
    [item.id, item.initials, item.nameFr, item.nameNl, item.roleFr, item.roleNl, item.bioFr, item.bioNl, item.order, item.published, new Date(item.createdAt), new Date(item.updatedAt)],
  );
}

await connection.end();
process.stdout.write("Existing JSON data imported into MySQL.\n");
