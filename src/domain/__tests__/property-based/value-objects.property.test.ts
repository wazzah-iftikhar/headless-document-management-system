import { test, expect } from "bun:test";
import * as fc from "fast-check";
import { Effect } from "effect";
import { UserIdVO } from "../../user/value-objects/user-id.vo";
import { EmailVO } from "../../user/value-objects/email.vo";
import { DocumentIdVO } from "../../document/value-objects/document-id.vo";
import { DateTimeVO } from "../../document/value-objects/date-time.vo";
import { MetadataTagsVO } from "../../document/value-objects/metadata-tags.vo";
import { FileReferenceVO } from "../../document/value-objects/file-reference.vo";

/**
 * Property-based tests for Value Objects
 * 
 * These tests verify domain invariants hold for all valid inputs,
 * not just specific test cases.
 */

// Generators for valid inputs
// UUID v4 generator - create a custom generator that produces valid UUID v4
const uuidV4Generator = fc
  .tuple(
    fc.string({ minLength: 8, maxLength: 8 }).filter((s) => /^[0-9a-f]{8}$/i.test(s)),
    fc.string({ minLength: 4, maxLength: 4 }).filter((s) => /^[0-9a-f]{4}$/i.test(s)),
    fc.constant("4"),
    fc.string({ minLength: 3, maxLength: 3 }).filter((s) => /^[0-9a-f]{3}$/i.test(s)),
    fc.constantFrom("8", "9", "a", "b"),
    fc.string({ minLength: 3, maxLength: 3 }).filter((s) => /^[0-9a-f]{3}$/i.test(s)),
    fc.string({ minLength: 12, maxLength: 12 }).filter((s) => /^[0-9a-f]{12}$/i.test(s))
  )
  .map((parts) => `${parts[0]}-${parts[1]}-${parts[2]}${parts[3]}-${parts[4]}${parts[5]}-${parts[6]}`);
const emailGenerator = fc.emailAddress().filter((email) => email.length <= 255);
const isoDateTimeGenerator = fc.date().map((date) => date.toISOString());
const nonEmptyStringGenerator = fc.string({ minLength: 1, maxLength: 255 });
const tagGenerator = fc.string({ minLength: 1, maxLength: 50 });

// Value Object Property-Based Tests
  test("UserIdVO: should always create valid UUID v4 from valid input", async () => {
    await fc.assert(
      fc.asyncProperty(uuidV4Generator, async (uuid) => {
        const result = await Effect.runPromise(
          Effect.either(UserIdVO.fromString(uuid))
        );
        if (result._tag !== "Right") {
          throw new Error(`Failed to create UserIdVO from valid UUID: ${uuid}`);
        }
        return result.right.toString() === uuid;
      }),
      { numRuns: 100 }
    );
  });

  test("UserIdVO: should always reject invalid UUID formats", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((str) => {
          // Not a valid UUID v4
          const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          return !uuidV4Regex.test(str) && str.length > 0;
        }),
        async (invalidUuid) => {
          const result = await Effect.runPromise(
            Effect.either(UserIdVO.fromString(invalidUuid))
          );
          return result._tag === "Left";
        }
      ),
      { numRuns: 100 }
    );
  });

  test("EmailVO: should always create valid email from valid input", async () => {
    await fc.assert(
      fc.asyncProperty(emailGenerator, async (email) => {
        const result = await Effect.runPromise(
          Effect.either(EmailVO.fromString(email))
        );
        if (result._tag !== "Right") {
          throw new Error(`Failed to create EmailVO from valid email: ${email}`);
        }
        return result.right.toString() === email;
      }),
      { numRuns: 100 }
    );
  });

  test("EmailVO: should always reject invalid email formats", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter((str) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return (!emailRegex.test(str) || str.length > 255) && str.length > 0;
        }),
        async (invalidEmail) => {
          const result = await Effect.runPromise(
            Effect.either(EmailVO.fromString(invalidEmail))
          );
          return result._tag === "Left";
        }
      ),
      { numRuns: 100 }
    );
  });

  test("DocumentIdVO: should always create valid UUID v4 from valid input", async () => {
    await fc.assert(
      fc.asyncProperty(uuidV4Generator, async (uuid) => {
        const result = await Effect.runPromise(
          Effect.either(DocumentIdVO.fromString(uuid))
        );
        if (result._tag !== "Right") {
          throw new Error(`Failed to create DocumentIdVO from valid UUID: ${uuid}`);
        }
        return result.right.toString() === uuid;
      }),
      { numRuns: 100 }
    );
  });

  test("DateTimeVO: should always create valid DateTime from valid ISO string", async () => {
    await fc.assert(
      fc.asyncProperty(isoDateTimeGenerator, async (isoString) => {
        const result = await Effect.runPromise(
          Effect.either(DateTimeVO.fromISOString(isoString))
        );
        if (result._tag !== "Right") {
          throw new Error(`Failed to create DateTimeVO from valid ISO string: ${isoString}`);
        }
        return result.right.encode() === isoString;
      }),
      { numRuns: 100 }
    );
  });

  test("DateTimeVO: should maintain round-trip encoding (encode then decode)", async () => {
    await fc.assert(
      fc.asyncProperty(isoDateTimeGenerator, async (isoString) => {
        const createResult = await Effect.runPromise(
          Effect.either(DateTimeVO.fromISOString(isoString))
        );
        if (createResult._tag !== "Right") {
          throw new Error(`Failed to create DateTimeVO: ${isoString}`);
        }
        const dt = createResult.right;
        const encoded = dt.encode();
        const decodeResult = await Effect.runPromise(
          Effect.either(DateTimeVO.fromISOString(encoded))
        );
        if (decodeResult._tag !== "Right") {
          throw new Error(`Failed to decode encoded DateTime: ${encoded}`);
        }
        return decodeResult.right.equals(dt);
      }),
      { numRuns: 100 }
    );
  });

  test("MetadataTagsVO: should always create valid tags from valid array", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(tagGenerator, { minLength: 0, maxLength: 100 }),
        async (tags) => {
          const result = await Effect.runPromise(
            Effect.either(MetadataTagsVO.fromArray(tags))
          );
          if (result._tag !== "Right") {
            throw new Error(`Failed to create MetadataTagsVO from valid tags: ${JSON.stringify(tags)}`);
          }
          return result.right.getCount() === tags.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  test("MetadataTagsVO: should always reject tags exceeding 50 characters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 51, maxLength: 200 }),
        async (longTag) => {
          const result = await Effect.runPromise(
            Effect.either(MetadataTagsVO.fromArray([longTag]))
          );
          return result._tag === "Left";
        }
      ),
      { numRuns: 50 }
    );
  });

  test("MetadataTagsVO: should maintain value semantics (equality is independent of order)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(tagGenerator, { minLength: 1, maxLength: 10 }),
        async (tags) => {
          const shuffled = [...tags].sort(() => Math.random() - 0.5);
          const tags1 = await Effect.runPromise(MetadataTagsVO.fromArray(tags));
          const tags2 = await Effect.runPromise(
            MetadataTagsVO.fromArray(shuffled)
          );
          return tags1.equals(tags2);
        }
      ),
      { numRuns: 50 }
    );
  });

  test("FileReferenceVO: should always create valid file reference from valid components", async () => {
    await fc.assert(
      fc.asyncProperty(
        nonEmptyStringGenerator,
        nonEmptyStringGenerator,
        fc.string({ minLength: 1 }),
        async (filename, originalFilename, filePath) => {
          // Ensure filenames don't exceed 255 chars
          const safeFilename = filename.slice(0, 255);
          const safeOriginalFilename = originalFilename.slice(0, 255);

          const result = await Effect.runPromise(
            Effect.either(
              FileReferenceVO.create(safeFilename, safeOriginalFilename, filePath)
            )
          );
          if (result._tag !== "Right") {
            throw new Error(`Failed to create FileReferenceVO: ${safeFilename}`);
          }
          return (
            result.right.getFilename() === safeFilename &&
            result.right.getOriginalFilename() === safeOriginalFilename &&
            result.right.getFilePath() === filePath
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test("FileReferenceVO: should always reject filenames exceeding 255 characters", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 256, maxLength: 500 }),
        nonEmptyStringGenerator,
        fc.string({ minLength: 1 }),
        async (longFilename, originalFilename, filePath) => {
          const result = await Effect.runPromise(
            Effect.either(
              FileReferenceVO.create(longFilename, originalFilename, filePath)
            )
          );
          return result._tag === "Left";
        }
      ),
      { numRuns: 50 }
    );
  });
