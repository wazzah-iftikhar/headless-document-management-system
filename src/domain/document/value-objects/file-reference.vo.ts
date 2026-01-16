import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema/ParseError";

/**
 * File path validation - must be a non-empty string
 */
const filePathSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => str.length > 0,
    { message: () => "File path cannot be empty" }
  )
);

/**
 * File reference value object schema
 * Encapsulates filename, original filename, and file path
 */
export const FileReferenceSchema = Schema.Struct({
  filename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Filename must be between 1 and 255 characters" }
    )
  ),
  originalFilename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Original filename must be between 1 and 255 characters" }
    )
  ),
  filePath: filePathSchema,
});

export type FileReference = Schema.Schema.Type<typeof FileReferenceSchema>;

/**
 * FileReference Value Object
 * 
 * Encapsulates file reference information (filename, originalFilename, filePath).
 * Immutable with value semantics.
 */
export class FileReferenceVO {
  private constructor(
    private readonly filename: string,
    private readonly originalFilename: string,
    private readonly filePath: string
  ) {}

  /**
   * Static factory method - creates FileReference from components
   * Validates using Effect Schema
   */
  static create(
    filename: string,
    originalFilename: string,
    filePath: string
  ): Effect.Effect<FileReferenceVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(FileReferenceSchema)({
        filename,
        originalFilename,
        filePath,
      }),
      Effect.map((ref) => new FileReferenceVO(
        ref.filename,
        ref.originalFilename,
        ref.filePath
      ))
    );
  }

  /**
   * For persistence layer - encode to plain object
   */
  encode(): FileReference {
    return {
      filename: this.filename,
      originalFilename: this.originalFilename,
      filePath: this.filePath,
    };
  }

  /**
   * Getters (immutable access)
   */
  getFilename(): string {
    return this.filename;
  }

  getOriginalFilename(): string {
    return this.originalFilename;
  }

  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Value semantics - equality by all fields
   */
  equals(other: FileReferenceVO): boolean {
    return (
      this.filename === other.filename &&
      this.originalFilename === other.originalFilename &&
      this.filePath === other.filePath
    );
  }
}
