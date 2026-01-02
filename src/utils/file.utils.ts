import { Effect, pipe } from "effect";
import { ConfigService } from "../effect/services/config.service";
import { config } from "../config/app"; // Keep for non-migrated functions
import { ok, err, type Result, tryAsync } from "./result";

/**
 * File utility functions for document operations
 * All functions return Results for functional programming
 */
export class FileUtils {
  /**
   * Validate file type and size
   * Refactored to use Effect with explicit succeed/fail
   */
  static validateFile(file: File): Effect.Effect<File, Error, ConfigService> {
    return pipe(
      ConfigService,
      Effect.flatMap((config) => {
        if (file.type !== "application/pdf") {
          return Effect.fail(new Error("Only PDF files are allowed"));
        }

        if (file.size > config.maxFileSize) {
          return Effect.fail(
            new Error(
              `File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`
            )
          );
        }

        return Effect.succeed(file);
      })
    );
  }

  /**
   * Ensure upload directory exists
   * Refactored to use Effect with explicit succeed/fail
   */
  static ensureUploadDirectory(): Effect.Effect<void, Error, ConfigService> {
    return pipe(
      ConfigService,
      Effect.flatMap((config) =>
        Effect.tryPromise({
          try: async () => {
            const uploadDir = Bun.file(config.uploadPath);
            if (!(await uploadDir.exists())) {
              await Bun.$`mkdir -p ${config.uploadPath}`;
            }
          },
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      )
    );
  }

  /**
   * Generate unique file path and filename
   * Refactored to use Effect with explicit succeed/fail
   */
  static generateFilePath(file: File): Effect.Effect<{ filePath: string; filename: string }, Error, ConfigService> {
    return pipe(
      ConfigService,
      Effect.flatMap((config) => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const filename = `${timestamp}-${randomSuffix}.pdf`;
        const filePath = `${config.uploadPath}/${filename}`;

        return Effect.succeed({ filePath, filename });
      })
    );
  }

  /**
   * Save file to disk
   * Refactored to use Effect for error handling
   */
  static saveFileToDisk(
    file: File,
    filePath: string
  ): Effect.Effect<void, Error> {
    return Effect.tryPromise({
      try: async () => {
        await Bun.write(filePath, await file.arrayBuffer());
      },
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    });
  }

  /**
   * Delete file from disk
   * Refactored to use Effect for error handling
   */
  static deleteFileFromDisk(filePath: string): Effect.Effect<void, Error> {
    return Effect.tryPromise({
      try: async () => {
        const file = Bun.file(filePath);
        if (await file.exists()) {
          await Bun.write(filePath, new Uint8Array(0));
          const fileHandle = await Bun.file(filePath);
          if (await fileHandle.exists()) {
            await Bun.$`rm -f ${filePath}`.quiet();
          }
        }
      },
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    });
  }

  /**
   * Check if file exists
   * Refactored to use Effect for error handling
   */
  static checkFileExists(filePath: string): Effect.Effect<void, Error> {
    return Effect.tryPromise({
      try: async () => {
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
          throw new Error("File not found on server");
        }
      },
      catch: (error) =>
        error instanceof Error ? error : new Error(String(error)),
    });
  }
  
}

