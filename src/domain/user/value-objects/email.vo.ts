import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Email validation schema
 * Basic email format validation
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EmailSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => emailRegex.test(str) && str.length <= 255,
    { message: () => "Invalid email format" }
  )
);

export type Email = Schema.Schema.Type<typeof EmailSchema>;

/**
 * Email Value Object
 * 
 * Encapsulates a validated email address.
 * Immutable with value semantics.
 */
export class EmailVO {
  private constructor(private readonly value: Email) {}

  static fromString(value: string): Effect.Effect<EmailVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(EmailSchema)(value),
      Effect.map((email) => new EmailVO(email))
    );
  }

  encode(): string {
    return this.value;
  }

  equals(other: EmailVO): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  toString(): string {
    return this.value;
  }

  getValue(): Email {
    return this.value;
  }
}
