import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * ISO 8601 DateTime schema
 * Validates and transforms between ISO string and Date object
 */
export const DateTimeSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => {
      const date = new Date(str);
      return !isNaN(date.getTime()) && str.includes("T");
    },
    { message: () => "Invalid ISO 8601 DateTime format" }
  ),
  Schema.transform(
    Schema.Date,
    {
      decode: (str) => new Date(str),
      encode: (date) => date.toISOString(),
      strict: false,
    }
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
    return pipe(
      Schema.decodeUnknown(DateTimeSchema)(isoString),
      Effect.map((date) => new DateTimeVO(date))
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
