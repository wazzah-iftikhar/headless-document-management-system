import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * ISO 8601 DateTime schema
 * Validates and transforms between ISO string and Date object
 * Uses DateFromString which handles the transformation correctly
 */
export const DateTimeSchema = pipe(
  Schema.DateFromString,
  Schema.filter(
    (date) => {
      // Must include 'T' in the ISO string to ensure it's a datetime, not just a date
      const str = date.toISOString();
      return str.includes("T");
    },
    { message: () => "Invalid ISO 8601 DateTime format" }
  )
);

export type DateTime = Schema.Schema.Type<typeof DateTimeSchema>;

/**
 * DateTime Value Object
 * 
 * Encapsulates a validated ISO 8601 DateTime.
 * Immutable with value semantics.
 */
export class DateTimeVO {
  private constructor(private readonly value: DateTime) {}

  /**
   * Static factory method - creates DateTime from Date object
   */
  static fromDate(date: Date): DateTimeVO {
    return new DateTimeVO(date);
  }

  /**
   * Static factory method - creates DateTime from ISO string
   * Validates using Effect Schema
   */
  static fromISOString(isoString: string): Effect.Effect<DateTimeVO, ParseError> {
    // First validate the string format
    const stringSchema = pipe(
      Schema.String,
      Schema.filter(
        (str) => {
          if (!str.includes("T")) {
            return false;
          }
          const date = new Date(str);
          return !isNaN(date.getTime());
        },
        { message: () => "Invalid ISO 8601 DateTime format" }
      )
    );

    return pipe(
      Schema.decodeUnknown(stringSchema)(isoString),
      Effect.map((validatedStr) => {
        const date = new Date(validatedStr);
        return new DateTimeVO(date);
      })
    );
  }

  /**
   * Static factory method - creates DateTime for current time
   */
  static now(): DateTimeVO {
    return new DateTimeVO(new Date());
  }

  /**
   * For persistence layer - encode to ISO string
   */
  encode(): string {
    return this.value.toISOString();
  }

  /**
   * Value semantics - equality by timestamp
   */
  equals(other: DateTimeVO): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  /**
   * Get as Date object
   */
  toDate(): Date {
    return new Date(this.value);
  }

  /**
   * String representation (ISO format)
   */
  toString(): string {
    return this.value.toISOString();
  }

  /**
   * Get the raw value (use sparingly, prefer toDate())
   */
  getValue(): DateTime {
    return this.value;
  }
}
