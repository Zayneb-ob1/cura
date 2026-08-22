import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type CollectionName = "contacts" | "appointments" | "reviews" | "doctors";

export type StoredRecord = Record<string, unknown> & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

const DATA_DIRECTORY = path.resolve(
  /* turbopackIgnore: true */ process.env.CURA_DATA_DIRECTORY ?? path.join(process.cwd(), "data"),
);
const writeQueues = new Map<CollectionName, Promise<unknown>>();

function collectionPath(collection: CollectionName) {
  return path.join(DATA_DIRECTORY, `${collection}.json`);
}

function isMissingFile(error: unknown) {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readCollection<T extends StoredRecord>(collection: CollectionName): Promise<T[]> {
  await mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    const contents = await readFile(collectionPath(collection), "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed)) throw new Error(`Invalid ${collection} data file`);
    return parsed as T[];
  } catch (error) {
    if (!isMissingFile(error)) throw error;
    await writeFile(collectionPath(collection), "[]\n", "utf8");
    return [];
  }
}

async function writeCollection(collection: CollectionName, records: StoredRecord[]) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  const destination = collectionPath(collection);
  const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;

  try {
    await writeFile(temporary, `${JSON.stringify(records, null, 2)}\n`, "utf8");
    await rename(temporary, destination);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

function enqueueWrite<T>(collection: CollectionName, operation: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(collection) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  writeQueues.set(collection, current);

  void current.finally(() => {
    if (writeQueues.get(collection) === current) writeQueues.delete(collection);
  }).catch(() => undefined);

  return current;
}

export async function listRecords<T extends StoredRecord>(collection: CollectionName): Promise<T[]> {
  const records = await readCollection<T>(collection);
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function findRecord<T extends StoredRecord>(collection: CollectionName, id: string) {
  const records = await readCollection<T>(collection);
  return records.find((record) => record.id === id) ?? null;
}

export function createRecord<T extends Record<string, unknown>>(collection: CollectionName, data: T) {
  return enqueueWrite(collection, async () => {
    const records = await readCollection<StoredRecord>(collection);
    const timestamp = new Date().toISOString();
    const record: StoredRecord & T = {
      ...data,
      id: randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    records.push(record);
    await writeCollection(collection, records);
    return record;
  });
}

export function updateRecord<T extends StoredRecord>(
  collection: CollectionName,
  id: string,
  updates: Record<string, unknown>,
) {
  return enqueueWrite(collection, async () => {
    const records = await readCollection<T>(collection);
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) return null;

    const current = records[index];
    const record = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    } as T;
    records[index] = record;
    await writeCollection(collection, records);
    return record;
  });
}

export function deleteRecord(collection: CollectionName, id: string) {
  return enqueueWrite(collection, async () => {
    const records = await readCollection<StoredRecord>(collection);
    const filteredRecords = records.filter((record) => record.id !== id);
    if (filteredRecords.length === records.length) return false;

    await writeCollection(collection, filteredRecords);
    return true;
  });
}
