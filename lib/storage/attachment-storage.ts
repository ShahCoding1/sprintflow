import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT =
  process.env.ATTACHMENTS_STORAGE_DIR?.trim() ||
  path.join(process.cwd(), "storage", "task-attachments");

function normalizeStorageKey(storageKey: string) {
  const normalized = path
    .normalize(storageKey)
    .replace(/^(\.\.(\/|\\|$))+/, "");

  if (
    normalized.startsWith("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("INVALID_STORAGE_KEY");
  }

  return normalized;
}

function resolveStoragePath(storageKey: string) {
  const normalized = normalizeStorageKey(storageKey);
  const root = path.resolve(STORAGE_ROOT);
  const resolved = path.resolve(root, normalized);

  if (
    resolved !== root &&
    !resolved.startsWith(`${root}${path.sep}`)
  ) {
    throw new Error("INVALID_STORAGE_KEY");
  }

  return resolved;
}

export const attachmentStorage = {
  async put(
    storageKey: string,
    buffer: Buffer,
  ) {
    const filePath = resolveStoragePath(storageKey);

    await mkdir(path.dirname(filePath), {
      recursive: true,
    });

    await writeFile(filePath, buffer);

    return filePath;
  },

  async get(storageKey: string) {
    const filePath = resolveStoragePath(storageKey);

    return readFile(filePath);
  },

  async delete(storageKey: string) {
    const filePath = resolveStoragePath(storageKey);

    try {
      await unlink(filePath);
    } catch (error) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error
          ? error.code
          : null;

      if (code !== "ENOENT") {
        throw error;
      }
    }
  },
};