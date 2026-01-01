import { err, ok, type Result } from "./result";

export function safeParseJSON<T>(input: string): Result<T> {
  try {
    return ok(JSON.parse(input) as T);
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    return err(error);
  }
}