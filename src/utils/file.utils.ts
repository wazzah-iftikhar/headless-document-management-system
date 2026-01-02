import { config } from "../config/app";
import { ok, err, type Result, tryAsync } from "./result";

/**
 * File utility functions for document operations
 * All functions return Results for functional programming
 */
export class FileUtils {
  /**
   * Validate file type and size
   */
  static validateFile(file: File): Result<File> {
    if (file.type !== "application/pdf") {
      return err(new Error("Only PDF files are allowed"));
    }
    if (file.size > config.maxFileSize) {
      return err(
        new Error(
          `File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`
        )
      );
    }
    return ok(file);
  }

  /**
   * Ensure upload directory exists
   */
  static async ensureUploadDirectory(): Promise<Result<void>> {
    return tryAsync(async () => {
      const uploadDir = Bun.file(config.uploadPath);
      if (!(await uploadDir.exists())) {
        await Bun.$`mkdir -p ${config.uploadPath}`;
      }
    });
  }

  /**
   * Generate unique file path and filename
   */
  static generateFilePath(file: File): Result<{ filePath: string; filename: string }> {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomSuffix}.pdf`;
    const filePath = `${config.uploadPath}/${filename}`;
    return ok({ filePath, filename });
  }

  /**
   * Save file to disk
   */
  static async saveFileToDisk(
    file: File,
    filePath: string
  ): Promise<Result<void>> {
    return tryAsync(async () => {
      await Bun.write(filePath, await file.arrayBuffer());
    });
  }

  /**
   * Delete file from disk
   */
  static async deleteFileFromDisk(filePath: string): Promise<Result<void>> {
    return tryAsync(async () => {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        await Bun.write(filePath, new Uint8Array(0));
        const fileHandle = await Bun.file(filePath);
        if (await fileHandle.exists()) {
          await Bun.$`rm -f ${filePath}`.quiet();
        }
      }
    });
  }

  /**
   * Check if file exists
   */
  static async checkFileExists(filePath: string): Promise<Result<void>> {
    return tryAsync(async () => {
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        throw new Error("File not found on server");
      }
    });
  }
}

