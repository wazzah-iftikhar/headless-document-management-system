import { Schema } from "@effect/schema";
import { pipe } from "effect";

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
    }
  )
);

export type DateTime = Schema.Schema.Type<typeof DateTimeSchema>;
