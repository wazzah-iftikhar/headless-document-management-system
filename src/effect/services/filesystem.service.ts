import { Context, Layer } from "effect";

/**
 * FileSystem Service Interface
 * Abstracts file system operations for better testability
 */
export interface IFileSystemService {
  /**
   * Check if a file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * Write file to disk
   */
  write(path: string, data: Uint8Array | ArrayBuffer): Promise<void>;

  /**
   * Read file from disk
   */
  read(path: string): Promise<Uint8Array>;

  /**
   * Delete file from disk
   */
  delete(path: string): Promise<void>;

  /**
   * Ensure directory exists
   */
  ensureDir(path: string): Promise<void>;
}

/**
 * FileSystem Service Tag
 * Represents the file system dependency in Effect Context
 */
export class FileSystemService extends Context.Tag("FileSystemService")<
  FileSystemService,
  IFileSystemService
>() {}

/**
 * FileSystem Service Implementation using Bun
 */
const createBunFileSystemService = (): IFileSystemService => ({
  async exists(path: string): Promise<boolean> {
    const file = Bun.file(path);
    return await file.exists();
  },

  async write(path: string, data: Uint8Array | ArrayBuffer): Promise<void> {
    await Bun.write(path, data);
  },

  async read(path: string): Promise<Uint8Array> {
    const file = Bun.file(path);
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  },

  async delete(path: string): Promise<void> {
    const file = Bun.file(path);
    if (await file.exists()) {
      await Bun.write(path, new Uint8Array(0));
      const fileHandle = await Bun.file(path);
      if (await fileHandle.exists()) {
        await Bun.$`rm -f ${path}`.quiet();
      }
    }
  },

  async ensureDir(path: string): Promise<void> {
    const uploadDir = Bun.file(path);
    if (!(await uploadDir.exists())) {
      await Bun.$`mkdir -p ${path}`;
    }
  },
});

/**
 * FileSystem Service Live Implementation
 */
export const FileSystemServiceLive = Layer.succeed(
  FileSystemService,
  createBunFileSystemService()
);

